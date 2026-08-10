import type { BrandConfig } from "@/lib/types";

/**
 * Fallback brand data pulled from the original sample invoice. Used anywhere
 * BrandConfig is read so the app never shows a blank/unbranded invoice
 * before the BrandConfig Sheet tab has been filled in — and any field left
 * empty in the Sheet quietly falls back to this instead of showing nothing.
 */
export const DEFAULT_BRAND: BrandConfig = {
  companyName: "UnboundYou Pvt. Ltd.",
  address: "SR0001, Siyaram Infra Co., 303, F-5, Hanuman Nagar, Ashok Nagar, Sampatchak, Patna – 800020",
  gstin: "10AAECU1155D1Z1",
  website: "www.unboundyou.com",
  email: "team@unboundyou.com",
  upiId: "MSUNBOUNDYOUPRIVATELIMITED.eazypay@icici",
  bankName: "ICICI Bank",
  accountNo: "509405000013",
  ifsc: "ICIC0005094",
  logoUrl: "/logo.png",
  sealUrl: "",
  qrUrl: "",
  primaryColor: "#2F80F9",
  secondaryColor: "#08BD7E",
  paymentLink: "",
  sacCodes: JSON.stringify([
    { name: "Sessions", code: "999293" },
    { name: "Ebooks", code: "9984" }
  ]),
};

/** Merges a partial/empty config read from the Sheet over the defaults — Sheet values win when present. */
export function withBrandDefaults(partial: Partial<BrandConfig>): BrandConfig {
  const merged = { ...DEFAULT_BRAND };
  (Object.keys(DEFAULT_BRAND) as (keyof BrandConfig)[]).forEach((key) => {
    if (partial[key]) merged[key] = partial[key] as string;
  });
  return merged;
}
