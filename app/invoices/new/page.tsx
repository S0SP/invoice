"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { InvoicePreview } from "@/components/InvoicePreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, InvoiceLineItem, BrandConfig } from "@/lib/types";

export default function NewInvoicePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<BrandConfig | null>(null);

  const [billToName, setBillToName] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [sacCode, setSacCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [successSerial, setSuccessSerial] = useState("");
  const [lastSaved, setLastSaved] = useState<{
    serial: string;
    name: string;
    phone: string;
    email: string;
    total: number;
    driveLink: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
    fetch("/api/brand-config")
      .then((r) => r.json())
      .then((d) => {
        setBrand(d.config || null);
        if (d.config?.sacCodes) {
          try {
            const parsed = JSON.parse(d.config.sacCodes);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSacCode(parsed[0].code);
            }
          } catch (e) {
            setSacCode("999293");
          }
        } else {
          setSacCode("999293");
        }
      });
  }, []);

  function addLineItem(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLineItems((items) => [
      ...items,
      {
        productId: product.id,
        name: product.name,
        unitLabel: product.unitLabel,
        description: product.description,
        qty: 1,
        price: product.defaultPrice,
        gstRate: product.gstRate,
      },
    ]);
  }

  function updateLine(index: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((items) => items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeLine(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setSuccessSerial("");
    setLastSaved(null);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billToName, billToPhone, billToEmail, note, date, lineItems, sacCode }),
    });

    if (!res.ok) {
      setSaving(false);
      alert("Could not save invoice — a bill-to name and at least one item are required.");
      return;
    }

    const serial = res.headers.get("X-Invoice-Serial") || "";
    const driveLink = res.headers.get("X-Invoice-Drive-Link") || "";
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serial || "invoice"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const subtotal = lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
    const gstAmount = lineItems.reduce((sum, it) => sum + it.qty * it.price * (it.gstRate / 100), 0);
    const total = subtotal + gstAmount;

    setLastSaved({
      serial,
      name: billToName,
      phone: billToPhone,
      email: billToEmail,
      total,
      driveLink,
    });

    setSuccessSerial(serial);
    setSaving(false);
    setBillToName("");
    setBillToPhone("");
    setBillToEmail("");
    setNote("");
    setLineItems([]);
  }

  function getWhatsAppShareUrl() {
    if (!lastSaved) return "#";
    let cleanPhone = lastSaved.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }
    
    let text = `Hi ${lastSaved.name},\n\nPlease find your invoice ${lastSaved.serial} from UnboundYou.\n`;
    text += `Total Amount: ₹${lastSaved.total.toLocaleString("en-IN")}\n`;
    if (lastSaved.driveLink) {
      text += `Download Link: ${lastSaved.driveLink}\n`;
    }
    text += `\nThank you!`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  function getEmailShareUrl() {
    if (!lastSaved) return "#";
    const subject = `Invoice ${lastSaved.serial} from UnboundYou`;
    let body = `Hi ${lastSaved.name},\n\nPlease find your invoice ${lastSaved.serial} from UnboundYou.\n\n`;
    body += `Total Amount: ₹${lastSaved.total.toLocaleString("en-IN")}\n`;
    if (lastSaved.driveLink) {
      body += `Download Link: ${lastSaved.driveLink}\n\n`;
    } else {
      body += `The PDF has been downloaded to your system.\n\n`;
    }
    body += `Regards,\nUnboundYou Pvt. Ltd.`;
    
    return `mailto:${lastSaved.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Sticky controls */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
            <div className="rounded-card border border-border bg-panel p-5 space-y-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">New Invoice</h1>
                <p className="text-xs text-muted mt-1">
                  Type client info and invoice notes directly onto the live preview on the right.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  Add catalog items
                </label>
                <Select onValueChange={(v) => addLineItem(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="+ Add item to invoice…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ₹{p.defaultPrice.toLocaleString("en-IN")}
                      </SelectItem>
                    ))}
                    {products.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted">
                        No catalog items yet — add some first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {successSerial && lastSaved && (
                <div className="rounded-lg border border-border bg-panel p-4 space-y-3">
                  <div className="text-xs text-foreground leading-normal">
                    Invoice <strong>{successSerial}</strong> successfully saved and downloaded.
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={getWhatsAppShareUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white py-2 font-semibold text-xs transition shadow-sm"
                    >
                      Share on WhatsApp
                    </a>
                    <a
                      href={getEmailShareUrl()}
                      className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white py-2 font-semibold text-xs transition shadow-sm"
                    >
                      Share via Email
                    </a>
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !billToName || lineItems.length === 0}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 text-sm shadow-md"
              >
                {saving ? "Generating invoice…" : "Save & Download Invoice"}
              </button>
            </div>
          </div>

          {/* Right Panel: Live Invoice Sheet */}
          <div className="lg:col-span-8">
            {brand ? (
              <InvoicePreview
                brand={brand}
                serialPreview="Assigned on save"
                billToName={billToName}
                billToPhone={billToPhone}
                billToEmail={billToEmail}
                date={date}
                note={note}
                lineItems={lineItems}
                onChange={(patch) => {
                  if (patch.billToName !== undefined) setBillToName(patch.billToName);
                  if (patch.billToPhone !== undefined) setBillToPhone(patch.billToPhone);
                  if (patch.billToEmail !== undefined) setBillToEmail(patch.billToEmail);
                  if (patch.date !== undefined) setDate(patch.date);
                  if (patch.note !== undefined) setNote(patch.note);
                  if (patch.sacCode !== undefined) setSacCode(patch.sacCode);
                }}
                onUpdateLine={updateLine}
                onRemoveLine={removeLine}
                sacCode={sacCode}
              />
            ) : (
              <div className="rounded-card border border-border bg-panel p-10 text-center text-sm text-muted">
                Loading brand details…
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
