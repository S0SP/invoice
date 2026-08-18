"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { 
  Play, 
  Edit2, 
  CheckCircle, 
  AlertTriangle, 
  FileSpreadsheet, 
  Loader2,
  RefreshCw,
  Info
} from "lucide-react";

interface DraftInvoice {
  importId: string;
  date: string;
  billToName: string;
  billToPhone: string;
  billToEmail: string;
  note: string;
  sacCode: string;
  paymentMode: string;
  placeOfSupply: string;
  rowIndices: number[];
  lineItems: {
    productId: string;
    name: string;
    unitLabel: string;
    description: string;
    qty: number;
    price: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
  }[];
}

export default function BulkImportPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabError, setTabError] = useState<string | null>(null);
  
  // Bulk generation state
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, statusText: "" });
  const [generationResults, setGenerationResults] = useState<{ name: string; serial: string; success: boolean; error?: string }[]>([]);

  // Individual generating states (per importId)
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function loadDrafts() {
    setLoading(true);
    setTabError(null);
    try {
      const res = await fetch("/api/invoices/bulk-import");
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "TAB_NOT_FOUND") {
          setTabError(data.message);
        } else {
          alert(data.error || "Failed to load bulk import data");
        }
        setDrafts([]);
      } else {
        setDrafts(data.drafts || []);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while loading drafts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  const calculateTotal = (draft: DraftInvoice) => {
    const subtotal = draft.lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
    const gstAmount = draft.lineItems.reduce((sum, it) => {
      // Split 50/50 for CGST/SGST or full IGST
      const totalItemGstRate = (it.cgstRate + it.sgstRate);
      return sum + it.qty * it.price * (totalItemGstRate / 100);
    }, 0);
    return subtotal + gstAmount;
  };

  const handleEdit = (draft: DraftInvoice) => {
    sessionStorage.setItem("draft_invoice", JSON.stringify(draft));
    router.push("/invoices/new");
  };

  const generateSingle = async (draft: DraftInvoice) => {
    setGeneratingId(draft.importId);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billToName: draft.billToName,
          billToPhone: draft.billToPhone,
          billToEmail: draft.billToEmail,
          note: draft.note,
          date: draft.date,
          lineItems: draft.lineItems,
          sacCode: draft.sacCode,
          paymentMode: draft.paymentMode,
          placeOfSupply: draft.placeOfSupply,
          bulkImportRowIndices: draft.rowIndices,
          responseType: "json"
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate invoice");
      }

      const data = await res.json();
      alert(`Successfully generated invoice ${data.serialNumber}!`);
      // Remove from list
      setDrafts(prev => prev.filter(d => d.importId !== draft.importId));
    } catch (e: any) {
      alert(e.message || "Failed to generate invoice");
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAllInvoices = async () => {
    if (drafts.length === 0) return;
    setIsBulkGenerating(true);
    setGenerationResults([]);
    setBulkProgress({ current: 0, total: drafts.length, statusText: "Starting bulk generation..." });

    const results = [];
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      setBulkProgress(prev => ({
        ...prev,
        current: i + 1,
        statusText: `Generating invoice for ${draft.billToName}...`
      }));

      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billToName: draft.billToName,
            billToPhone: draft.billToPhone,
            billToEmail: draft.billToEmail,
            note: draft.note,
            date: draft.date,
            lineItems: draft.lineItems,
            sacCode: draft.sacCode,
            paymentMode: draft.paymentMode,
            placeOfSupply: draft.placeOfSupply,
            bulkImportRowIndices: draft.rowIndices,
            responseType: "json"
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Save failed");
        }

        const data = await res.json();
        results.push({ name: draft.billToName, serial: data.serialNumber, success: true });
      } catch (e: any) {
        results.push({ name: draft.billToName, serial: "ERROR", success: false, error: e.message || "Unknown error" });
      }
      setGenerationResults([...results]);
    }

    setBulkProgress(prev => ({ ...prev, statusText: "Finished bulk generation!" }));
    loadDrafts();
  };

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-5xl px-6 py-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Bulk Invoice Import
            </h1>
            <p className="text-sm text-muted mt-1">
              Import multiple invoices at once directly from Google Sheets.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDrafts}
              disabled={loading || isBulkGenerating}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold hover:bg-background transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sync Sheet
            </button>
            <button
              onClick={generateAllInvoices}
              disabled={loading || isBulkGenerating || drafts.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 shadow-md"
            >
              <Play className="h-4 w-4" />
              Bulk Generate All ({drafts.length})
            </button>
          </div>
        </div>

        {/* Tab Error Warning */}
        {tabError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 mb-8 text-red-800 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-950">BulkImport Sheet Tab Missing</h3>
                <p className="text-sm mt-1">
                  {tabError}
                </p>
              </div>
            </div>
            
            <div className="border-t border-red-100 pt-4 mt-2">
              <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider mb-2">Instructions to fix:</h4>
              <ol className="list-decimal pl-5 text-sm space-y-2.5">
                <li>Open your Google Spreadsheet linked to this app.</li>
                <li>Add a new tab sheet and name it exactly <strong><code>BulkImport</code></strong>.</li>
                <li>Create a header row (Row 1) with these exact columns:
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono font-bold bg-white/70 p-3 rounded-lg border border-red-100 text-red-900 leading-normal">
                    <span>A: Import ID</span>
                    <span>B: Invoice Date</span>
                    <span>C: Customer Name</span>
                    <span>D: Customer Phone</span>
                    <span>E: Customer Email</span>
                    <span>F: Product Name / ID</span>
                    <span>G: Quantity</span>
                    <span>H: Price</span>
                    <span>I: GST Rate</span>
                    <span>J: SAC Code</span>
                    <span>K: Payment Mode</span>
                    <span>L: Place of Supply</span>
                    <span>M: Note</span>
                    <span>N: Status</span>
                  </div>
                </li>
                <li>Leave the <strong><code>Status</code></strong> column empty when writing new draft lines.</li>
                <li>Once ready, click the <strong>Sync Sheet</strong> button above to load them!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Bulk Progress Overlay */}
        {isBulkGenerating && (
          <div className="rounded-lg border border-border bg-panel p-6 mb-8 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Bulk Action Progress</h3>
              <span className="text-xs font-mono bg-background border border-border px-2 py-0.5 rounded-md font-semibold">
                {bulkProgress.current} / {bulkProgress.total} Complete
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted">
              {bulkProgress.current < bulkProgress.total ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              <span>{bulkProgress.statusText}</span>
            </div>

            {/* Live generation summaries */}
            {generationResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-md bg-background p-3 text-xs space-y-1.5 font-mono">
                {generationResults.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0">
                    <span className="text-muted font-medium">{r.name}</span>
                    {r.success ? (
                      <span className="text-green-600 font-bold">Generated ({r.serial})</span>
                    ) : (
                      <span className="text-red-500 font-bold" title={r.error}>Failed ({r.error})</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {bulkProgress.current === bulkProgress.total && (
              <div className="flex justify-end">
                <button
                  onClick={() => setIsBulkGenerating(false)}
                  className="rounded-md bg-slate-900 px-4 py-1.5 text-xs text-white hover:opacity-90"
                >
                  Dismiss progress
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info panel */}
        {!tabError && !isBulkGenerating && (
          <div className="rounded-lg border border-border bg-[#F8FAFC] p-4 mb-6 flex gap-3 text-xs text-slate-600">
            <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Spreadsheet Grouping Helper:</span> Lines in the <strong>BulkImport</strong> tab with matching <strong>Import ID</strong> values are automatically grouped into a single invoice. Leave <strong>Status</strong> blank to keep rows in draft mode. Generated invoices will be stamped with their invoice serial numbers in column N to avoid duplicate generation.
            </div>
          </div>
        )}

        {/* Drafts List */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            Loading pending draft invoices...
          </div>
        )}

        {!loading && !tabError && drafts.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted space-y-3">
            <div className="text-4xl text-slate-300">📭</div>
            <p className="font-medium text-foreground">No pending bulk invoices found</p>
            <p className="max-w-md mx-auto text-xs text-muted">
              Add draft rows with blank statuses to the <strong>BulkImport</strong> tab in your Google Sheets and click <strong>Sync Sheet</strong> above.
            </p>
          </div>
        )}

        {!loading && !tabError && drafts.length > 0 && (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.importId}
                className="rounded-lg border border-border bg-panel p-5 space-y-4 shadow-sm hover:border-muted transition"
              >
                {/* Draft details */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-3.5">
                  <div>
                    <h3 className="font-bold text-foreground text-base leading-normal">
                      {draft.billToName || <span className="text-red-500 italic">No name provided</span>}
                    </h3>
                    <p className="text-xs text-muted mt-1 flex flex-wrap gap-2 items-center">
                      <span className="font-bold uppercase tracking-wide bg-background border border-border px-1.5 py-0.5 rounded text-[10px]">
                        Import ID: {draft.importId}
                      </span>
                      <span>·</span>
                      <span>Date: {draft.date}</span>
                      {draft.paymentMode && (
                        <span className="bg-[#EEF2F6] text-[#3B82F6] border border-[#DBEAFE] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {draft.paymentMode}
                        </span>
                      )}
                      {draft.placeOfSupply && (
                        <span className="bg-[#F0FDF4] text-[#22C55E] border border-[#DCFCE7] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {draft.placeOfSupply}
                        </span>
                      )}
                      {draft.billToEmail && (
                        <>
                          <span>·</span>
                          <span>{draft.billToEmail}</span>
                        </>
                      )}
                      {draft.billToPhone && (
                        <>
                          <span>·</span>
                          <span>{draft.billToPhone}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-foreground">
                      ₹{calculateTotal(draft).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider mt-0.5">
                      {draft.lineItems.length} {draft.lineItems.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Line Items</div>
                  <div className="grid grid-cols-1 gap-2 bg-background/50 border border-border rounded-lg p-3">
                    {draft.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
                        <div className="pr-4">
                          <span className="font-bold text-foreground">{item.name}</span>
                          <span className="text-muted text-[10px] ml-2">
                            {item.qty} {item.unitLabel} × ₹{item.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          ₹{(item.qty * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {draft.note && (
                  <div className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-md text-slate-600 flex gap-2">
                    <span className="font-bold text-slate-800">Note:</span>
                    <span>{draft.note}</span>
                  </div>
                )}

                {/* Draft action buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                  <button
                    onClick={() => handleEdit(draft)}
                    disabled={isBulkGenerating || generatingId !== null}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-background transition disabled:opacity-50"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit & Preview
                  </button>
                  <button
                    onClick={() => generateSingle(draft)}
                    disabled={isBulkGenerating || generatingId !== null}
                    className="flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {generatingId === draft.importId ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        Generate Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
