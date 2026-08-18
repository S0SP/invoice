import { getSheetsClient, SPREADSHEET_ID, TABS } from "./sheets";

export async function initializeBulkImportSheet() {
  const sheets = getSheetsClient();
  const spreadsheetId = SPREADSHEET_ID;

  // 1. Fetch BrandConfig for dropdown validations
  const resConfig = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "BrandConfig!A2:Q2",
  });
  const configRow = resConfig.data.values ? resConfig.data.values[0] : [];

  // Parse SAC codes
  const sacCodesJson = configRow[15] || "";
  let sacCodes: string[] = [];
  try {
    if (sacCodesJson) {
      sacCodes = JSON.parse(sacCodesJson).map((c: any) => String(c.code));
    }
  } catch (e) {
    console.warn("Failed to parse sacCodes:", e);
  }
  if (sacCodes.length === 0) sacCodes = ["999293", "9984"];

  // Parse Payment Modes
  const paymentModesJson = configRow[16] || "";
  let paymentModes: string[] = [];
  try {
    if (paymentModesJson) {
      paymentModes = JSON.parse(paymentModesJson);
    }
  } catch (e) {
    console.warn("Failed to parse paymentModes:", e);
  }
  if (paymentModes.length === 0) paymentModes = ["Bank Transfer", "Razorpay"];

  // 2. Check if BulkImport sheet tab exists
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const bulkImportSheet = metadata.data.sheets?.find((s) => s.properties?.title === "BulkImport");

  let sheetId: number;
  if (!bulkImportSheet) {
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
    sheetId = addRes.data.replies?.[0].addSheet?.properties?.sheetId || 0;
  } else {
    sheetId = bulkImportSheet.properties?.sheetId || 0;
  }

  // 3. Write Headers
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

  // 4. Set formulas in H2:I1000 for auto-populating Price and GST Rate from Products catalog
  const formulas: string[][] = [];
  for (let r = 2; r <= 1000; r++) {
    formulas.push([
      `=IF(ISBLANK(F${r}), "", IFERROR(VLOOKUP(F${r}, Products!$B$2:$I$100, 5, FALSE), ""))`, // Price (Column H)
      `=IF(ISBLANK(F${r}), "", IFERROR(VLOOKUP(F${r}, Products!$B$2:$I$100, 8, FALSE), ""))`, // GST Rate (Column I)
    ]);
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "BulkImport!H2:I1000",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: formulas,
    },
  });

  // 5. Apply Dropdowns (Data Validation)
  const validationRequests = [
    // Column F (Product Name): index 5 -> ONE_OF_RANGE referencing Products!$B$2:$B$100 dynamically
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 5,
          endColumnIndex: 6,
        },
        rule: {
          condition: {
            type: "ONE_OF_RANGE",
            values: [{ userEnteredValue: "=Products!$B$2:$B$100" }],
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    // Column I (GST Rate): index 8
    {
      setDataValidation: {
        range: {
          sheetId,
          startRowIndex: 1,
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
}
