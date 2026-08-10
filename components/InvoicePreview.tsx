"use client";

import Image from "next/image";
import type { BrandConfig, InvoiceLineItem } from "@/lib/types";
import { X } from "lucide-react";

interface Props {
  brand: BrandConfig;
  serialPreview: string; // e.g. "Assigned on save"
  billToName: string;
  billToPhone: string;
  billToEmail: string;
  date: string;
  note: string;
  lineItems: InvoiceLineItem[];
  onChange: (patch: {
    billToName?: string;
    billToPhone?: string;
    billToEmail?: string;
    date?: string;
    note?: string;
    sacCode?: string;
  }) => void;
  onUpdateLine: (index: number, patch: Partial<InvoiceLineItem>) => void;
  onRemoveLine: (index: number) => void;
  sacCode: string;
}

export function InvoicePreview({
  brand,
  serialPreview,
  billToName,
  billToPhone,
  billToEmail,
  date,
  note,
  lineItems,
  onChange,
  onUpdateLine,
  onRemoveLine,
  sacCode,
}: Props) {
  const subtotal = lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
  const gstAmount = lineItems.reduce((sum, it) => sum + it.qty * it.price * (it.gstRate / 100), 0);
  const total = subtotal + gstAmount;

  // Divide total GST by 2 to get CGST and SGST/UTGST
  const halfGstAmount = gstAmount / 2;

  const blue = brand.primaryColor || "#2F80F9";

  const parsedSacCodes: { name: string; code: string }[] = (() => {
    if (brand.sacCodes) {
      try {
        const parsed = JSON.parse(brand.sacCodes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse sacCodes", e);
      }
    }
    return [
      { name: "Sessions", code: "999293" },
      { name: "Ebooks", code: "9984" },
    ];
  })();

  const sacCodesOptions = [...parsedSacCodes];
  if (sacCode && !sacCodesOptions.some((item) => item.code === sacCode)) {
    sacCodesOptions.push({ name: `Custom (${sacCode})`, code: sacCode });
  }

  return (
    <div
      className="overflow-hidden rounded-card border border-border bg-white shadow-xl px-6 py-6"
      style={{ fontFamily: "var(--font-plus-jakarta)", fontSize: "13px" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        {brand.logoUrl ? (
          <Image
            src={brand.logoUrl}
            alt={brand.companyName}
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            unoptimized
          />
        ) : (
          <div className="h-9 w-32" />
        )}
        <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: blue }}>
          TAX INVOICE
        </h2>
      </div>

      {/* Row 1: From vs Company Meta */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">From</p>
          <p className="text-sm font-bold text-slate-900 mb-0.5">{brand.companyName}</p>
          <p className="text-xs text-slate-600 leading-normal whitespace-pre-line">{brand.address}</p>
        </div>
        <div className="flex flex-col justify-start text-xs text-slate-700 space-y-0.5">
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">State:</span>
            <span className="text-slate-900">Bihar</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">GSTIN:</span>
            <span className="text-slate-900">{brand.gstin}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">Website:</span>
            <span className="text-slate-900">{brand.website}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">Email:</span>
            <span className="text-slate-900">{brand.email}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 my-2" />

      {/* Row 2: Invoice Info vs Place of Supply/SAC */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-xs text-slate-700 space-y-1">
          <div className="flex items-center">
            <span className="font-bold text-slate-800 w-28">Invoice No:</span>
            <span className="text-slate-900 font-semibold">{serialPreview}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-800 w-28">Invoice Date:</span>
            <input
              type="date"
              className="uy-inline-input text-[#0F1729] font-medium w-auto focus:border-b-2 focus:border-primary border-b border-dashed border-slate-300 px-1 py-0.5"
              value={date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          </div>
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <div className="flex">
            <span className="font-bold text-slate-800 w-32">Place of Supply:</span>
            <span className="text-slate-900">Bihar (India)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-800 w-32">SAC Code:</span>
            <select
              className="uy-inline-input text-[#0F1729] font-medium bg-transparent border-b border-dashed border-slate-300 focus:border-b-2 focus:border-primary py-0.5 focus:outline-none cursor-pointer"
              value={sacCode}
              onChange={(e) => onChange({ sacCode: e.target.value })}
            >
              {sacCodesOptions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 my-2" />

      {/* Row 3: Customer Info vs Payment Mode */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice For</p>
          <input
            className="uy-inline-input text-sm font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-b-2 focus:border-primary py-0.5"
            placeholder="Parent / bill-to name"
            value={billToName}
            onChange={(e) => onChange({ billToName: e.target.value })}
          />
          <input
            className="uy-inline-input text-xs text-slate-600 mt-1 border-b border-dashed border-slate-300 focus:border-b-2 focus:border-primary py-0.5"
            placeholder="Email address"
            value={billToEmail}
            onChange={(e) => onChange({ billToEmail: e.target.value })}
          />
          <input
            className="uy-inline-input text-xs text-slate-600 mt-1 border-b border-dashed border-slate-300 focus:border-b-2 focus:border-primary py-0.5"
            placeholder="Phone number"
            value={billToPhone}
            onChange={(e) => onChange({ billToPhone: e.target.value })}
          />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <div className="flex">
            <span className="font-bold text-slate-800 w-32">Mode of Payment:</span>
            <span className="text-slate-900">Online</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-32">Payment Status:</span>
            <span className="text-slate-900">Paid</span>
          </div>
        </div>
      </div>

      {/* Particulars Table */}
      <div className="mt-4">
        <div className="flex justify-between border-b pb-1.5 mb-2" style={{ borderColor: blue }}>
          <span className="text-xs font-bold text-slate-950">Particulars</span>
          <span className="text-xs font-bold text-slate-950">Amount</span>
        </div>

        {lineItems.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-400">
            Add an item from the catalog above — it will appear here, fully editable.
          </div>
        )}

        <div className="space-y-2">
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-start justify-between border-b border-slate-50 pb-2 last:border-0">
              <div className="flex-1 pr-4">
                <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                {item.description && <div className="text-[10px] text-slate-500 mt-0.5">{item.description}</div>}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Qty:</span>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => onUpdateLine(i, { qty: Number(e.target.value) })}
                      className="w-10 text-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-slate-400">Price: ₹</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onUpdateLine(i, { price: Number(e.target.value) })}
                      className="w-20 border border-slate-200 rounded px-1 py-0.5 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="text-slate-400">
                    GST: {item.gstRate}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-950 text-xs min-w-[70px] text-right">
                  ₹{(item.qty * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => onRemoveLine(i)}
                  aria-label="Remove item"
                  className="text-slate-400 transition hover:text-red-500 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Breakdown */}
      {lineItems.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-2 text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>CGST (9%)</span>
            <span className="font-medium text-slate-900">
              ₹{halfGstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>SGST (9%)</span>
            <span className="font-medium text-slate-900">
              ₹{halfGstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Total Row */}
      <div className="flex justify-between border-t pt-2 mt-2 mb-4" style={{ borderColor: blue }}>
        <span className="text-sm font-bold text-slate-950">Total</span>
        <span className="text-sm font-bold text-slate-950">
          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Note */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
        <span className="font-bold text-slate-900">Note:</span>
        <input
          className="uy-inline-input text-slate-800"
          placeholder="Optional — e.g. sessions carried over to next month"
          value={note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>

      {/* Declarations */}
      <div className="text-[10px] text-slate-400 space-y-0.5 leading-normal mb-4">
        <p>1. GST under reverse charge is not payable on this invoice</p>
        <p>2. This is a computer generated invoice and does not require a signature</p>
      </div>

      {/* Footer Info: Payment Details, Stamp, QR */}
      <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-4">
        <div className="space-y-1 text-[10px] text-slate-600 max-w-[65%]">
          <p className="font-bold uppercase tracking-wider text-slate-400 mb-0.5">Payment Information</p>
          <p className="font-medium text-slate-800">UPI ID: {brand.upiId}</p>
          <p className="font-medium text-slate-800">Bank Name: {brand.bankName}</p>
          <p className="font-medium text-slate-800">Account No: {brand.accountNo}</p>
          <p className="font-medium text-slate-800">IFSC Code: {brand.ifsc}</p>
          {brand.paymentLink && (
            <p className="font-medium text-slate-800">
              Payment Link:{" "}
              <a
                href={brand.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-90 font-bold"
                style={{ color: blue }}
              >
                {brand.paymentLink}
              </a>
            </p>
          )}
          {brand.sealUrl && (
            <div className="mt-2">
              <Image
                src={brand.sealUrl}
                alt="Company Seal"
                width={55}
                height={55}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          {brand.qrUrl && (
            <Image
              src={brand.qrUrl}
              alt="Payment QR"
              width={75}
              height={75}
              className="h-16 w-auto object-contain"
              unoptimized
            />
          )}
          <span className="text-[8px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">
            Scan to Pay
          </span>
        </div>
      </div>
    </div>
  );
}
