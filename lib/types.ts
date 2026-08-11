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
  gstRate: number; // set per catalog item, e.g. 18
  active: boolean;
}

export interface InvoiceLineItem {
  productId: string;
  name: string;
  unitLabel: string;
  description: string;
  qty: number;
  price: number; // editable per invoice, defaults from Product.defaultPrice
  gstRate: number; // editable per invoice, defaults from Product.gstRate
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
