import { NextRequest, NextResponse } from "next/server";
import { readTab, TABS } from "@/lib/sheets";
import type { InvoiceLineItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch pending rows from BulkImport sheet (columns A to N)
    const rows = await readTab(TABS.bulkImport, "A2:N");
    
    // 2. Fetch catalog products to match names & default values
    const productRows = await readTab(TABS.products);
    const catalogProducts = productRows.map(r => ({
      id: r[0],
      name: r[1],
      type: r[2],
      description: r[3],
      unitLabel: r[4],
      defaultPrice: Number(r[5]) || 0,
      cgstRate: Number(r[6]) || 9,
      sgstRate: Number(r[7]) || 9,
      igstRate: Number(r[8]) || 18,
      active: r[9] !== "false",
    })).filter(p => p.active);

    // 3. Group and process rows
        const draftsMap: {
      [importId: string]: {
        importId: string;
        date: string;
        billToName: string;
        billToPhone: string;
        billToEmail: string;
        note: string;
        sacCode: string;
        paymentMode: string;
        placeOfSupply: string;
        lineItems: InvoiceLineItem[];
        rowIndices: number[];
      }
    } = {};

    rows.forEach((row, index) => {
      const importId = row[0]?.trim();
      const status = row[13]?.trim();

      // Skip rows with no Import ID or those that are already processed (Status != empty)
      if (!importId || status) return;

      const date = row[1]?.trim() || new Date().toISOString().slice(0, 10);
      const billToName = row[2]?.trim() || "";
      const billToPhone = row[3]?.trim() || "";
      const billToEmail = row[4]?.trim() || "";
      const productNameOrId = row[5]?.trim() || "";
      const qty = Number(row[6]) || 1;
      const price = row[7]?.trim() ? Number(row[7]) : null;
      const customGstRate = row[8]?.trim() ? Number(row[8]) : null;
      const sacCode = row[9]?.trim() || "";
      const paymentMode = row[10]?.trim() || "";
      const placeOfSupply = row[11]?.trim() || "Intra-State";
      const note = row[12]?.trim() || "";
      const rowIndex = index + 2; // spreadsheet row number (A2 in sheet corresponds to index 0 + 2 = row 2)

      const matchedProduct = catalogProducts.find(p =>
        p.id.toLowerCase() === productNameOrId.toLowerCase() ||
        p.name.toLowerCase() === productNameOrId.toLowerCase()
      );

      const resolvedPrice = price !== null ? price : (matchedProduct ? matchedProduct.defaultPrice : 0);
      
      let resolvedCgst = matchedProduct ? matchedProduct.cgstRate : 9;
      let resolvedSgst = matchedProduct ? matchedProduct.sgstRate : 9;
      let resolvedIgst = matchedProduct ? matchedProduct.igstRate : 18;

      if (customGstRate !== null) {
        resolvedCgst = customGstRate / 2;
        resolvedSgst = customGstRate / 2;
        resolvedIgst = customGstRate;
      }

      const lineItem: InvoiceLineItem = {
        productId: matchedProduct ? matchedProduct.id : "custom",
        name: matchedProduct ? matchedProduct.name : productNameOrId,
        unitLabel: matchedProduct ? matchedProduct.unitLabel : "Units",
        description: matchedProduct ? matchedProduct.description : "",
        qty,
        price: resolvedPrice,
        cgstRate: resolvedCgst,
        sgstRate: resolvedSgst,
        igstRate: resolvedIgst,
      };

      if (!draftsMap[importId]) {
        draftsMap[importId] = {
          importId,
          date,
          billToName,
          billToPhone,
          billToEmail,
          note,
          sacCode,
          paymentMode,
          placeOfSupply,
          lineItems: [],
          rowIndices: [],
        };
      }

      draftsMap[importId].lineItems.push(lineItem);
      draftsMap[importId].rowIndices.push(rowIndex);
    });

    const drafts = Object.values(draftsMap);
    return NextResponse.json({ drafts });

  } catch (err: any) {
    console.error("Bulk import fetch failed:", err);
    // If the tab is missing or bad range
    if (err.message?.includes("not found") || err.message?.includes("exceeds grid limits") || err.status === 400) {
      return NextResponse.json({
        error: "TAB_NOT_FOUND",
        message: "The 'BulkImport' tab was not found in your Google Sheet. Please add a new tab named 'BulkImport' to your sheet."
      }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || "Failed to load bulk import data" }, { status: 500 });
  }
}
