export type ProductType = "session" | "ebook";

export interface SacCode {
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  unitLabel: string; // e.g. "Sessions", "Copies"
  defaultPrice: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  active: boolean;
}

export interface InvoiceLineItem {
  productId: string;
  name: string;
  unitLabel: string;
  description: string;
  qty: number;
  price: number; // editable per invoice, defaults from Product.defaultPrice
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface Invoice {
  serialNumber: string;
  date: string; // ISO date
  billToName: string;
  billToPhone: string;
  billToEmail: string;
  note: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  pdfDriveLink?: string;
  sacCode?: string;
  paymentMode?: string;
  placeOfSupply?: string;
}

export interface BrandConfig {
  companyName: string;
  address: string;
  gstin: string;
  website: string;
  email: string;
  upiId: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  logoUrl: string;
  sealUrl: string;
  qrUrl: string;
  primaryColor: string;
  secondaryColor: string;
  paymentLink: string;
  sacCodes?: string;
  paymentModes?: string;
}
