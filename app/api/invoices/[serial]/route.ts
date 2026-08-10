import { NextRequest, NextResponse } from "next/server";
import { readTab, TABS } from "@/lib/sheets";

export async function GET(_req: NextRequest, { params }: { params: { serial: string } }) {
  const rows = await readTab(TABS.invoices);
  const row = rows.find((r) => r[0] === params.serial);

  if (!row) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const invoice = {
    serialNumber: row[0],
    date: row[1],
    billToName: row[2],
    billToPhone: row[3],
    billToEmail: row[4],
    lineItems: JSON.parse(row[5] || "[]"),
    note: row[6],
    subtotal: Number(row[7]),
    gstAmount: Number(row[8]),
    total: Number(row[9]),
    pdfDriveLink: row[10] || "",
    sacCode: row[11] || "999293",
  };

  return NextResponse.json({ invoice });
}
