# UnboundYou Invoice Tool

Internal invoicing tool. Next.js only, Google Sheets as the database, PDF generated server-side and
backed up to Google Drive. Zero recurring cost.

## 1. Install

```bash
npm install
```

## 2. Create the Google Sheet

Create one Google Sheet with these four tabs (exact names matter):

**`Products`** — header row: `id | name | type | description | unitLabel | defaultPrice | gstRate | active`

**`Counter`** — header row: `fy_prefix | last_serial` (leave the rest empty — the app creates rows automatically per financial year)

**`Invoices`** — header row: `serialNumber | date | billToName | billToPhone | billToEmail | lineItemsJson | note | subtotal | gstAmount | total | pdfDriveLink`

**`BrandConfig`** — header row: `companyName | address | gstin | website | email | upiId | bankName | accountNo | ifsc | logoUrl | sealUrl | qrUrl | primaryColor | secondaryColor`
Fill row 2 with your actual brand details (see suggested values below).

## 3. Set up the Sheets service account (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create/select a project.
2. Enable the **Google Sheets API**.
3. IAM & Admin → Service Accounts → Create → download the JSON key.
4. Open your Sheet → Share → paste the service account's email (`...@...iam.gserviceaccount.com`) with **Editor** access.
5. Put the full JSON key content into `GOOGLE_SERVICE_ACCOUNT_JSON` (as one line) and the Sheet's ID (from its URL) into `SHEET_ID`.

## 4. Set up Drive backup (personal Gmail storage via OAuth Playground)

A bare service account has **0 bytes of its own Drive storage** on the free tier, so PDF backups use a
personal Gmail account's quota instead, authorized once via Google's OAuth Playground:

1. In the same Cloud project, enable the **Google Drive API**.
2. APIs & Services → Credentials → Create OAuth Client ID → type **Web application** → add
   `https://developers.google.com/oauthplayground` as an authorized redirect URI.
   Add https://developers.google.com to your Authorized JavaScript origins
3. Go to [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground).
4. Gear icon (top right) → check **"Use your own OAuth credentials"** → paste your Client ID + Secret.
5. In the left panel, find **Drive API v3** → select scope `https://www.googleapis.com/auth/drive.file`.
6. Click **Authorize APIs** → sign in with the personal Gmail account whose storage you want to use.
7. Click **Exchange authorization code for tokens** → copy the **Refresh token**.
8. Put the Client ID/Secret into `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`, and the refresh
   token into `GOOGLE_DRIVE_REFRESH_TOKEN`. Optionally create a Drive folder, share nothing extra (it's
   your own account), and drop its ID into `GOOGLE_DRIVE_FOLDER_ID`.

This refresh token doesn't expire under normal use — this is a one-time setup.

## 5. Set the shared login

Pick a team password and a long random session secret:

```bash
APP_ADMIN_PASSWORD=whatever-you-want
APP_SESSION_SECRET=$(openssl rand -hex 32)
```

## 6. Suggested BrandConfig row (from your sample invoice)

```
companyName:   UnboundYou Pvt. Ltd.
address:       SR0001, Siyaram Infra Co., 303, F-5, Hanuman Nagar, Ashok Nagar, Sampatchak, Patna – 800020
gstin:         10AAECU1155D1Z1
website:       www.unboundyou.com
email:         team@unboundyou.com
upiId:         MSUNBOUNDYOUPRIVATELIMITED.eazypay@icici
bankName:      ICICI Bank
accountNo:     509405000013
ifsc:          ICIC0005094
logoUrl:       <hosted URL of logo.png>
sealUrl:       <hosted URL of the seal/stamp image>
qrUrl:         <hosted URL of the payment QR image>
primaryColor:  #2F80F9
secondaryColor:#08BD7E
```

Logo/seal/QR need to be hosted somewhere reachable by URL (e.g. uploaded to the `public/` folder and
referenced as `/logo.png` once deployed, or hosted on Drive/any static host) since `@react-pdf/renderer`
needs a fetchable image URL, not a local upload.

## 7. Run locally

```bash
npm run dev
```

## 8. Deploy

Push to GitHub → import into [Vercel](https://vercel.com) (free Hobby tier) → paste all the env vars
above into the project settings → deploy.

## What's new in this pass

- **Live, editable invoice preview** — `New Invoice` no longer uses a separate boring form. The preview
  *is* the invoice: it matches the branded PDF layout exactly, and every field (bill-to details, date,
  line item qty/price/GST, note) is editable directly on it.
- **Default brand data everywhere** — `lib/brandDefaults.ts` seeds the sample invoice's brand details
  (company, GSTIN, UPI, bank, colors) as a fallback. Until the `BrandConfig` Sheet tab is filled in, both
  the preview and generated PDFs still render fully branded instead of blank.
- **Real dropdown UI** — native `<select>` elements are replaced with a styled component on top of
  [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select) (`components/ui/select.tsx`),
  used for the catalog "add item" picker and the catalog "Type" field. Run `npm install` again to pull in
  the two new dependencies (`@radix-ui/react-select`, `lucide-react`).

## Notes

- Serial numbers auto-increment per financial year (`FY-26-27-000003` style), computed from the invoice
  date's Apr 1–Mar 31 boundary.
- GST rate is set per catalog item but fully editable per line on each invoice.
- Past invoices are read-only in the History screen — corrections go through a new invoice, not an edit,
  to keep the ledger trustworthy.
- Dark/light toggle affects only the app UI. The generated invoice PDF always renders in the fixed
  branded light layout, since that's what parents actually receive.
