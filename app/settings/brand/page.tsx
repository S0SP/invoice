"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import type { BrandConfig } from "@/lib/types";

const FIELDS: { key: keyof BrandConfig; label: string }[] = [
  { key: "companyName", label: "Company name" },
  { key: "address", label: "Address" },
  { key: "gstin", label: "GSTIN" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
  { key: "upiId", label: "UPI ID" },
  { key: "bankName", label: "Bank name" },
  { key: "accountNo", label: "Account number" },
  { key: "ifsc", label: "IFSC" },
  { key: "logoUrl", label: "Logo image URL" },
  { key: "sealUrl", label: "Seal/stamp image URL" },
  { key: "qrUrl", label: "Payment QR image URL" },
  { key: "primaryColor", label: "Primary color (hex)" },
  { key: "secondaryColor", label: "Secondary color (hex)" },
  { key: "paymentLink", label: "Payment link (Razorpay/Paytm)" },
];

export default function BrandSettingsPage() {
  const [config, setConfig] = useState<Partial<BrandConfig>>({});
  const [sacCodesList, setSacCodesList] = useState<{ name: string; code: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/brand-config")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.config || {});
        if (d.config?.sacCodes) {
          try {
            setSacCodesList(JSON.parse(d.config.sacCodes));
          } catch (e) {
            setSacCodesList([]);
          }
        } else {
          setSacCodesList([
            { name: "Sessions", code: "999293" },
            { name: "Ebooks", code: "9984" },
          ]);
        }
      });
  }, []);

  function updateSacCodes(newList: { name: string; code: string }[]) {
    setSacCodesList(newList);
    setConfig((prev) => ({ ...prev, sacCodes: JSON.stringify(newList) }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/brand-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-1 text-2xl">Brand Settings</h1>
        <p className="mb-6 text-sm">
          Everything shown on every generated invoice — logo, address, payment details, colors — lives
          here. Changing it is a data edit, not a code change.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-4 rounded-card border border-border bg-panel p-6">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-muted">{f.label}</label>
              <input
                value={config[f.key] || ""}
                onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-card border border-border bg-panel p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Predefined SAC Codes</h2>
            <p className="text-xs text-muted mt-1">
              Add friendly names and Service Accounting Codes (SAC) to choose from during invoice creation.
            </p>
          </div>

          <div className="space-y-3">
            {sacCodesList.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-end bg-background border border-border rounded-lg p-3 relative group">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider">
                    Name (e.g. Sessions)
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const newList = [...sacCodesList];
                      newList[idx] = { ...newList[idx], name: e.target.value };
                      updateSacCodes(newList);
                    }}
                    placeholder="Ebooks, Sessions..."
                    className="w-full rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-bold text-muted uppercase tracking-wider">
                    SAC Code (e.g. 9984)
                  </label>
                  <input
                    value={item.code}
                    onChange={(e) => {
                      const newList = [...sacCodesList];
                      newList[idx] = { ...newList[idx], code: e.target.value };
                      updateSacCodes(newList);
                    }}
                    placeholder="9984, 999293..."
                    className="w-full rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => {
                    const newList = sacCodesList.filter((_, i) => i !== idx);
                    updateSacCodes(newList);
                  }}
                  className="rounded-md bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-xs font-semibold transition"
                  title="Remove SAC Code"
                >
                  Delete
                </button>
              </div>
            ))}

            {sacCodesList.length === 0 && (
              <p className="text-xs text-muted italic">No SAC codes defined. Add one below to get started.</p>
            )}
          </div>

          <button
            onClick={() => {
              const newList = [...sacCodesList, { name: "", code: "" }];
              updateSacCodes(newList);
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background py-2 text-xs font-semibold text-muted hover:text-foreground hover:border-muted transition"
          >
            + Add custom SAC code
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save brand settings"}
        </button>
      </div>
    </main>
  );
}
