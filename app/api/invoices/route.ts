import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { readTab, appendRow, TABS } from "@/lib/sheets";
import { getNextSerialNumber } from "@/lib/serial";
import { uploadInvoicePdf } from "@/lib/drive";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";
import { withBrandDefaults } from "@/lib/brandDefaults";
import type { Invoice, InvoiceLineItem, BrandConfig } from "@/lib/types";

const BRAND_FIELDS: (keyof BrandConfig)[] = [
  "companyName",
  "address",
  "gstin",
  "website",
  "email",
  "upiId",
  "bankName",
  "accountNo",
  "ifsc",
  "logoUrl",
  "sealUrl",
  "qrUrl",
  "primaryColor",
  "secondaryColor",
  "paymentLink",
  "sacCodes",
  "paymentModes",
];

async function loadBrandConfig(): Promise<BrandConfig> {
  const rows = await readTab(TABS.brandConfig, "A2:Q2");
  const row = rows[0] || [];
  const partial = Object.fromEntries(BRAND_FIELDS.map((f, i) => [f, row[i] || ""])) as Partial<BrandConfig>;
  return withBrandDefaults(partial);
}

export async function GET(req: NextRequest) {
  const rows = await readTab(TABS.invoices);
  const search = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  const invoices = rows
    .map((r) => ({
      serialNumber: r[0],
      date: r[1],
      billToName: r[2],
      billToPhone: r[3],
      billToEmail: r[4],
      total: Number(r[9]) || 0,
      pdfDriveLink: r[10] || "",
      sacCode: r[11] || "999293",
      paymentMode: r[12] || "",
      placeOfSupply: r[13] || "Intra-State",
    }))
    .filter((inv) => !search || inv.billToName.toLowerCase().includes(search) || inv.serialNumber.toLowerCase().includes(search))
    .reverse(); // most recent first

  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { billToName, billToPhone, billToEmail, note, lineItems, date, sacCode, paymentMode, placeOfSupply } = body as {
    billToName: string;
    billToPhone: string;
    billToEmail: string;
    note: string;
    date: string;
    lineItems: InvoiceLineItem[];
    sacCode?: string;
    paymentMode?: string;
    placeOfSupply?: string;
  };

  if (!billToName || !lineItems?.length) {
    return NextResponse.json({ error: "billToName and at least one line item are required" }, { status: 400 });
  }

  const invoiceDate = date ? new Date(date) : new Date();
  const brand = await loadBrandConfig();

  let subtotal = 0;
  let gstAmount = 0;
  for (const item of lineItems) {
    const lineTotal = item.qty * item.price;
    subtotal += lineTotal;
    const cgstVal = item.cgstRate ?? 9;
    const sgstVal = item.sgstRate ?? 9;
    const igstVal = item.igstRate ?? 18;
    const totalItemGstRate = (placeOfSupply === "Inter-State") ? igstVal : (cgstVal + sgstVal);
    gstAmount += lineTotal * (totalItemGstRate / 100);
  }
  const total = subtotal + gstAmount;

  const serialNumber = await getNextSerialNumber(invoiceDate);

  const invoice: Invoice = {
    serialNumber,
    date: invoiceDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    billToName,
    billToPhone: billToPhone || "",
    billToEmail: billToEmail || "",
    note: note || "",
    lineItems,
    subtotal,
    gstAmount,
    total,
    sacCode: sacCode || "999293",
    paymentMode: paymentMode || "",
    placeOfSupply: placeOfSupply || "Intra-State",
  };

  const pdfBuffer = await renderToBuffer(InvoiceDocument({ invoice, brand }));

  let pdfDriveLink = "";
  try {
    pdfDriveLink = await uploadInvoicePdf(`${serialNumber}-${billToName}.pdf`, pdfBuffer);
  } catch (err) {
    // Drive backup failing should never block the invoice itself — the PDF is
    // still returned to the browser for download either way.
    console.error("Drive backup failed:", err);
  }

  await appendRow(TABS.invoices, [
    invoice.serialNumber,
    invoice.date,
    invoice.billToName,
    invoice.billToPhone,
    invoice.billToEmail,
    JSON.stringify(invoice.lineItems),
    invoice.note,
    invoice.subtotal,
    invoice.gstAmount,
    invoice.total,
    pdfDriveLink,
    invoice.sacCode || "",
    invoice.paymentMode || "",
    invoice.placeOfSupply || "",
  ]);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 201,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${serialNumber}.pdf"`,
      "X-Invoice-Serial": serialNumber,
      "X-Invoice-Drive-Link": pdfDriveLink || "",
    },
  });
}
