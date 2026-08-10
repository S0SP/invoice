"use client";

import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/types";

const emptyForm = {
  name: "",
  type: "session" as "session" | "ebook",
  description: "",
  unitLabel: "Sessions",
  defaultPrice: "",
  gstRate: "18",
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditingId(null);
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(emptyForm);
    setSaving(false);
    load();
  }

  async function handleDeactivate(id: string) {
    if (confirm("Are you sure you want to deactivate this item?")) {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      type: p.type,
      description: p.description || "",
      unitLabel: p.unitLabel,
      defaultPrice: String(p.defaultPrice),
      gstRate: String(p.gstRate),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-1 text-2xl">{editingId ? "Edit Catalog Item" : "Catalog"}</h1>
        <p className="mb-6 text-sm">
          {editingId 
            ? "Modify the selected item's details. Changes will reflect on future invoices."
            : "Course sessions and ebooks live here with a default price and GST rate. Both stay editable per invoice at billing time."
          }
        </p>

        <form onSubmit={handleSubmit} className="mb-10 rounded-card border border-border bg-panel p-6">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-muted">Item name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. FRENCH-IGCSE-G-7"
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Type</label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    type: v as "session" | "ebook",
                    unitLabel: v === "ebook" ? "Copies" : "Sessions",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Course Session</SelectItem>
                  <SelectItem value="ebook">Ebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Default price (₹)</label>
              <input
                required
                type="number"
                value={form.defaultPrice}
                onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">GST rate (%)</label>
              <input
                required
                type="number"
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Unit label</label>
              <input
                value={form.unitLabel}
                onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add to catalog"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-border bg-background px-5 py-2 font-semibold text-muted hover:bg-panel"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-3"
            >
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-muted my-1">{p.description}</p>
                )}
                <p className="text-xs text-muted">
                  {p.type === "ebook" ? "Ebook" : "Session"} · ₹{p.defaultPrice} · GST {p.gstRate}% · Unit: {p.unitLabel}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs text-muted hover:text-primary transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivate(p.id)}
                  className="text-xs text-muted hover:text-red-500 transition"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-muted">No catalog items yet.</p>}
        </div>
      </div>
    </main>
  );
}
