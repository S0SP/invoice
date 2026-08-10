"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";

interface InvoiceRow {
  serialNumber: string;
  date: string;
  billToName: string;
  total: number;
  pdfDriveLink: string;
}

function getGoogleDriveDownloadLink(driveLink: string): string {
  if (!driveLink) return "";
  const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return driveLink;
}

export default function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [q, setQ] = useState("");

  async function load(search = "") {
    const res = await fetch(`/api/invoices?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setInvoices(data.invoices || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-1 text-2xl">Invoice History</h1>
        <p className="mb-6 text-sm">
          Read-only ledger. To correct a mistake, raise a new invoice rather than editing an old one.
        </p>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            load(e.target.value);
          }}
          placeholder="Search by name or serial number…"
          className="mb-6 w-full rounded-lg border border-border bg-panel px-3 py-2"
        />

        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.serialNumber}
              className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-3"
            >
              <div>
                <p className="font-semibold">{inv.billToName}</p>
                <p className="text-xs text-muted">
                  {inv.serialNumber} · {inv.date}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">₹{inv.total.toLocaleString("en-IN")}</span>
                {inv.pdfDriveLink && (
                  <div className="flex items-center gap-3">
                    <a
                      href={inv.pdfDriveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted hover:text-foreground transition hover:underline"
                    >
                      View
                    </a>
                    <a
                      href={getGoogleDriveDownloadLink(inv.pdfDriveLink)}
                      className="text-xs text-primary hover:opacity-90 transition font-semibold hover:underline bg-primary/10 px-2.5 py-1 rounded-md"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-sm text-muted">No invoices found.</p>}
        </div>
      </div>
    </main>
  );
}
