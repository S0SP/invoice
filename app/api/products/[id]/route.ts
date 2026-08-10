import { NextRequest, NextResponse } from "next/server";
import { readTab, updateRange, TABS } from "@/lib/sheets";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const updates = await req.json();
  const rows = await readTab(TABS.products);
  const rowIndex = rows.findIndex((r) => r[0] === params.id);

  if (rowIndex === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const existing = rows[rowIndex];
  const merged = [
    existing[0], // id never changes
    updates.name ?? existing[1],
    updates.type ?? existing[2],
    updates.description ?? existing[3],
    updates.unitLabel ?? existing[4],
    updates.defaultPrice !== undefined ? Number(updates.defaultPrice) : existing[5],
    updates.gstRate !== undefined ? Number(updates.gstRate) : existing[6],
    updates.active !== undefined ? String(updates.active) : existing[7],
  ];

  const sheetRow = rowIndex + 2; // +2: header row + 1-indexing
  await updateRange(`${TABS.products}!A${sheetRow}:H${sheetRow}`, merged);

  return NextResponse.json({ ok: true });
}
