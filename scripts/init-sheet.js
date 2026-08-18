const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

// 1. Manually parse .env variables to authenticate outside Next.js runtime
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing Google credentials in environment variables.");
  }

  let privateKey = privateKeyRaw.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function run() {
  console.log("Starting Google Sheets initialization...");
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("Missing SHEET_ID in environment variables.");
  }

  // 2. Fetch BrandConfig to build dropdown options
  console.log("Loading brand configurations for validation values...");
  const resConfig = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "BrandConfig!A2:Q2",
  });
  const configRow = resConfig.data.values ? resConfig.data.values[0] : [];

  // Parse SAC Codes
  const sacCodesJson = configRow[15] || "";
  let sacCodes = [];
  try {
    if (sacCodesJson) {
      sacCodes = JSON.parse(sacCodesJson).map((c) => c.code);
    }
  } catch (e) {
    console.warn("Failed to parse sacCodes, using fallbacks:", e.message);
  }
  if (sacCodes.length === 0) sacCodes = ["999293", "9984"];

  // Parse Payment Modes
  const paymentModesJson = configRow[16] || "";
  let paymentModes = [];
  try {
    if (paymentModesJson) {
      paymentModes = JSON.parse(paymentModesJson);
    }
  } catch (e) {
    console.warn("Failed to parse paymentModes, using fallbacks:", e.message);
  }
  if (paymentModes.length === 0) paymentModes = ["Bank Transfer", "Razorpay"];

  console.log("Loaded validation options:");
  console.log(" - SAC Codes:", sacCodes);
  console.log(" - Payment Modes:", paymentModes);

  // 3. Check if BulkImport sheet tab exists
  console.log("Checking sheet tabs...");
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const bulkImportSheet = metadata.data.sheets.find((s) => s.properties.title === "BulkImport");

  let sheetId;
  if (!bulkImportSheet) {
    console.log("BulkImport tab not found. Creating it...");
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: "BulkImport",
              },
            },
          },
        ],
      },
    });
    sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
    console.log(`Created BulkImport tab with Sheet ID: ${sheetId}`);
  } else {
    sheetId = bulkImportSheet.properties.sheetId;
    console.log(`Found existing BulkImport tab with Sheet ID: ${sheetId}`);
  }

  // 4. Overwrite headers in row 1
  console.log("Setting column headers...");
  const headers = [
    "Import ID",
    "Invoice Date",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Product Name / ID",
    "Quantity",
    "Price",
    "GST Rate",
    "SAC Code",
    "Payment Mode",
    "Place of Supply",
    "Note",
    "Status",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "BulkImport!A1:N1",
    valueInputOption: "RAW",
    requestBody: {
      values: [headers],
    },
  });
  console.log("Headers written successfully.");

  // 5. Apply Data Validation rules (Columns I, J, K, L)
  console.log("Applying Data Validation validation dropdowns to sheet columns...");
  const validationRequests = [
    // Column I (GST Rate): index 8
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1, // Skip header row
          endRowIndex: 1000,
          startColumnIndex: 8,
          endColumnIndex: 9,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: ["0", "5", "12", "18", "28"].map((v) => ({ userEnteredValue: v })),
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    // Column J (SAC Code): index 9
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 9,
          endColumnIndex: 10,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: sacCodes.map((v) => ({ userEnteredValue: String(v) })),
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    // Column K (Payment Mode): index 10
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 10,
          endColumnIndex: 11,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: paymentModes.map((v) => ({ userEnteredValue: v })),
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    // Column L (Place of Supply): index 11
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 11,
          endColumnIndex: 12,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: ["Intra-State", "Inter-State"].map((v) => ({ userEnteredValue: v })),
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: validationRequests,
    },
  });

  console.log("Data Validation rules applied successfully!");
  console.log("Sheet tab BulkImport is ready to use!");
}

run().catch((err) => {
  console.error("Initialization script failed:", err);
  process.exit(1);
});
