import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Drive uploads use a personal Gmail account's OAuth refresh token instead
 * of the service account, because a bare service account has 0 bytes of its
 * own Drive storage quota on the free tier. The refresh token below is
 * generated once via Google's OAuth 2.0 Playground:
 *
 *   1. https://developers.google.com/oauthplayground
 *   2. Gear icon → check "Use your own OAuth credentials" → paste your
 *      OAuth Client ID + Secret (from the same Google Cloud project used
 *      for the Sheets service account).
 *   3. In the left panel, find "Drive API v3" → select the
 *      https://www.googleapis.com/auth/drive.file scope.
 *   4. Authorize → sign in with the personal Gmail account whose storage
 *      you want to use → Exchange authorization code for tokens.
 *   5. Copy the resulting Refresh Token into GOOGLE_DRIVE_REFRESH_TOKEN.
 *
 * That refresh token doesn't expire under normal use, so this only needs
 * to be done once (and again only if access is manually revoked).
 */
function getDriveAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Drive backup is not configured: set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN"
    );
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

/** Uploads a PDF buffer to a specific Drive folder in the personal account, returns a shareable link. */
export async function uploadInvoicePdf(fileName: string, pdfBuffer: Buffer): Promise<string> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // optional — omit to upload to root

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(pdfBuffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error("Drive upload did not return a file id");

  // Make it link-viewable so the PDF can be reopened from the ledger without
  // needing to sign into the personal Gmail account each time.
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  const file = await drive.files.get({ fileId, fields: "webViewLink" });
  return file.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}
