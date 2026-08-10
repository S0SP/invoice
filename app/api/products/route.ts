import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readTab, appendRow, TABS } from "@/lib/sheets";
import type { Product } from "@/lib/types";

function rowToProduct(row: string[]): Product {
  const [id, name, type, description, unitLabel, defaultPrice, gstRate, active] = row;
  return {
    id,
    name,
    type: (type as Product["type"]) || "session",
    description: description || "",
    unitLabel: unitLabel || "Sessions",
    defaultPrice: Number(defaultPrice) || 0,
    gstRate: Number(gstRate) || 18,
    active: active !== "false",
  };
}

export async function GET() {
  const rows = await readTab(TABS.products);
  const products = rows.map(rowToProduct).filter((p) => p.active);
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, description, unitLabel, defaultPrice, gstRate } = body;

  if (!name || !defaultPrice) {
    return NextResponse.json({ error: "name and defaultPrice are required" }, { status: 400 });
  }

  const product: Product = {
    id: uuid(),
    name,
    type: type === "ebook" ? "ebook" : "session",
    description: description || "",
    unitLabel: unitLabel || (type === "ebook" ? "Copies" : "Sessions"),
    defaultPrice: Number(defaultPrice),
    gstRate: Number(gstRate) || 18,
    active: true,
  };

  await appendRow(TABS.products, [
    product.id,
    product.name,
    product.type,
    product.description,
    product.unitLabel,
    product.defaultPrice,
    product.gstRate,
    "true",
  ]);

  return NextResponse.json({ product }, { status: 201 });
}
