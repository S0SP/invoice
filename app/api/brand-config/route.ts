import { NextRequest, NextResponse } from "next/server";
import { readTab, updateRange, TABS } from "@/lib/sheets";
import type { BrandConfig } from "@/lib/types";
import { withBrandDefaults } from "@/lib/brandDefaults";

const FIELDS: (keyof BrandConfig)[] = [
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
];

export async function GET() {
  const rows = await readTab(TABS.brandConfig, "A2:P2");
  const row = rows[0] || [];
  const partial = Object.fromEntries(FIELDS.map((f, i) => [f, row[i] || ""])) as Partial<BrandConfig>;
  const config = withBrandDefaults(partial);
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<BrandConfig>;
  const rows = await readTab(TABS.brandConfig, "A2:P2");
  const existing = rows[0] || [];

  const merged = FIELDS.map((f, i) => (body[f] !== undefined ? String(body[f]) : existing[i] || ""));

  await updateRange(`${TABS.brandConfig}!A2:P2`, merged);
  return NextResponse.json({ ok: true });
}
