import { google } from "googleapis";

/**
 * Sheets access uses a plain Google service account — that's fine because
 * Sheets storage lives inside the Sheet itself (owned by whoever created it),
 * not inside the service account's own Drive quota. Drive uploads (the PDF
 * backups) are a separate concern — see lib/drive.ts, which uses a personal
 * Gmail account's quota instead, since service accounts get 0 bytes of
 * their own Drive storage on the free tier.
 */
function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.SHEET_ID;

  if (clientEmail && privateKeyRaw) {
    let privateKey = privateKeyRaw.trim();
    // Strip quotes if they were included
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace \n string representations with actual newline characters
    privateKey = privateKey.replace(/\\n/g, "\n");

    if (!sheetId || sheetId === 'your-google-sheet-id') {
      throw new Error(
        "SHEET_ID is not configured or is set to the default placeholder. " +
        "Please set SHEET_ID to your actual Google Sheet ID in the .env file."
      );
    }

    return new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Neither GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY nor GOOGLE_SERVICE_ACCOUNT_JSON is set in environment variables. " +
      "Please configure your Google Sheets credentials in the .env file."
    );
  }
  if (raw.trim() === '{"type":"service_account", ...}') {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON in .env is configured with the default placeholder '{\"type\":\"service_account\", ...}'. " +
      "Please replace it with your actual Google service account JSON key as a single-line string."
    );
  }
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_JSON is not a valid JSON string: ${(err as Error).message}. ` +
      "Make sure you pasted the complete JSON key content on a single line in your .env file."
    );
  }

  if (!sheetId || sheetId === 'your-google-sheet-id') {
    throw new Error(
      "SHEET_ID is not configured or is set to the default placeholder. " +
      "Please set SHEET_ID to your actual Google Sheet ID in the .env file."
    );
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export const SPREADSHEET_ID = process.env.SHEET_ID!;

export const TABS = {
  products: "Products",
  counter: "Counter",
  invoices: "Invoices",
  brandConfig: "BrandConfig",
} as const;

/** Reads all rows (minus header) from a tab as arrays of cell strings. */
export async function readTab(tab: string, range = "A2:Z"): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!${range}`,
  });
  return res.data.values ?? [];
}

/** Appends a single row to a tab. */
export async function appendRow(tab: string, row: (string | number)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

/** Overwrites a specific row range, e.g. `Products!A5:H5`, 1-indexed including header. */
export async function updateRange(range: string, row: (string | number)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}
