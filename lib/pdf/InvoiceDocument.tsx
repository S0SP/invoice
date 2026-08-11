import { Document, Page, Text, View, Image, StyleSheet, Link } from "@react-pdf/renderer";
import type { Invoice, BrandConfig } from "@/lib/types";

const FALLBACK_BLUE = "#2F80F9";
const FALLBACK_GREEN = "#08BD7E";

function buildStyles(brand: BrandConfig) {
  const blue = brand.primaryColor || FALLBACK_BLUE;
  const green = brand.secondaryColor || FALLBACK_GREEN;

  return StyleSheet.create({
    page: {
      fontSize: 12,
      color: "#1E293B",
      fontFamily: "Helvetica",
      paddingHorizontal: 40,
      paddingVertical: 45,
    },
    // Top Header: Logo on left, TAX INVOICE on right
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
      paddingBottom: 16,
      marginBottom: 20,
    },
    logo: {
      width: 150,
      height: 48,
      objectFit: "contain",
    },
    title: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: blue,
      letterSpacing: 0.5,
    },
    // Two column grid for details
    gridRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    gridCol: {
      width: "48%",
    },
    // Typography
    sectionLabel: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#64748B",
      textTransform: "uppercase",
      marginBottom: 4,
    },
    boldText: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
      marginBottom: 4,
    },
    normalText: {
      fontSize: 11,
      color: "#334155",
      lineHeight: 1.5,
    },
    metaLabel: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#475569",
    },
    metaValue: {
      fontSize: 11,
      color: "#0F1729",
      marginBottom: 6,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
      marginVertical: 12,
    },
    // Table / Particulars
    tableHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 2,
      borderBottomColor: blue,
      paddingBottom: 6,
      marginTop: 16,
      marginBottom: 10,
    },
    tableHeaderCell: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
    },
    itemRow: {
      marginBottom: 12,
    },
    itemMainRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    itemName: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
      width: "70%",
    },
    itemPrice: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
      textAlign: "right",
    },
    itemDesc: {
      fontSize: 10,
      color: "#64748B",
      marginTop: 2,
      width: "70%",
    },
    itemQty: {
      fontSize: 10,
      color: "#475569",
      marginTop: 2,
    },
    // Tax block
    taxRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    taxLabel: {
      fontSize: 11,
      color: "#475569",
    },
    taxValue: {
      fontSize: 11,
      color: "#475569",
      textAlign: "right",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 2,
      borderTopColor: blue,
      paddingTop: 8,
      marginTop: 10,
      marginBottom: 20,
    },
    totalLabel: {
      fontSize: 15,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
    },
    totalValue: {
      fontSize: 15,
      fontFamily: "Helvetica-Bold",
      color: "#0F1729",
      textAlign: "right",
    },
    // Bottom Declarations
    declarations: {
      fontSize: 9,
      color: "#64748B",
      lineHeight: 1.5,
      marginBottom: 20,
    },
    // Footer payment / QR block
    footerBand: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
    },
    paymentInfo: {
      width: "55%",
    },
    footerLabel: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#64748B",
      textTransform: "uppercase",
      marginBottom: 4,
    },
    footerValue: {
      fontSize: 10,
      color: "#334155",
      lineHeight: 1.5,
    },
    sealQrContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      width: "42%",
      justifyContent: "flex-end",
    },
    qrBlock: {
      alignItems: "center",
    },
    qr: {
      width: 85,
      height: 85,
    },
    qrText: {
      fontSize: 8,
      color: "#64748B",
      marginTop: 4,
      textAlign: "center",
    },
    seal: {
      width: 85,
      height: 85,
      marginRight: 12,
    },
  });
}

export function InvoiceDocument({ invoice, brand }: { invoice: Invoice; brand: BrandConfig }) {
  const styles = buildStyles(brand);
  const blue = brand.primaryColor || FALLBACK_BLUE;

  // Divide total GST by 2 to get CGST and SGST/UTGST
  const halfGstAmount = invoice.gstAmount / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Header */}
        <View style={styles.header}>
          {brand.logoUrl ? (
            <Image src={brand.logoUrl} style={styles.logo} />
          ) : (
            <View style={{ width: 150, height: 48 }} />
          )}
          <Text style={styles.title}>TAX INVOICE</Text>
        </View>

        {/* Row 1: From vs Company Meta */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>From</Text>
            <Text style={styles.boldText}>{brand.companyName}</Text>
            <Text style={styles.normalText}>{brand.address}</Text>
          </View>
          <View style={styles.gridCol}>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 70 }]}>State:</Text>
              <Text style={styles.metaValue}>Bihar</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 70 }]}>GSTIN:</Text>
              <Text style={styles.metaValue}>{brand.gstin}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 70 }]}>Website:</Text>
              <Text style={styles.metaValue}>{brand.website}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 70 }]}>Email:</Text>
              <Text style={styles.metaValue}>{brand.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 2: Invoice Info vs SAC Code */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 100 }]}>Invoice No:</Text>
              <Text style={styles.metaValue}>{invoice.serialNumber}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 100 }]}>Invoice Date:</Text>
              <Text style={styles.metaValue}>{invoice.date}</Text>
            </View>
          </View>
          <View style={styles.gridCol}>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 110 }]}>Place of Supply:</Text>
              <Text style={styles.metaValue}>Bihar (India)</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 110 }]}>SAC Code:</Text>
              <Text style={styles.metaValue}>{invoice.sacCode || "999293"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 3: Customer Info vs Payment Mode */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Invoice For</Text>
            <Text style={styles.boldText}>{invoice.billToName}</Text>
            {invoice.billToEmail ? <Text style={styles.normalText}>{invoice.billToEmail}</Text> : null}
            {invoice.billToPhone ? <Text style={styles.normalText}>{invoice.billToPhone}</Text> : null}
          </View>
          <View style={styles.gridCol}>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 120 }]}>Mode of Payment:</Text>
              <Text style={styles.metaValue}>{invoice.paymentMode || "Bank Transfer"}</Text>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 3 }}>
              <Text style={[styles.metaLabel, { width: 120 }]}>Payment Status:</Text>
              <Text style={styles.metaValue}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Table Headers: Particulars & Amount */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Particulars</Text>
          <Text style={styles.tableHeaderCell}>Amount</Text>
        </View>

        {/* Line Items */}
        {invoice.lineItems.map((item, i) => (
          <View style={styles.itemRow} key={i}>
            <View style={styles.itemMainRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                Rs. {(item.qty * item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
            <Text style={styles.itemQty}>
              {item.qty} {item.unitLabel} × Rs. {item.price.toLocaleString("en-IN")}
            </Text>
          </View>
        ))}

        {/* Tax Breakdowns */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>CGST (9%)</Text>
            <Text style={styles.taxValue}>
              Rs. {halfGstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>SGST (9%)</Text>
            <Text style={styles.taxValue}>
              Rs. {halfGstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Total row */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            Rs. {invoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {invoice.note ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 2 }]}>Note</Text>
            <Text style={styles.normalText}>{invoice.note}</Text>
          </View>
        ) : null}

        {/* Declarations */}
        <View style={styles.declarations}>
          <Text>1. GST under reverse charge is not payable on this invoice</Text>
          <Text>2. This is a computer generated invoice and does not require a signature</Text>
        </View>

        {/* Footer info: Bank Details, Stamp, QR */}
        <View style={styles.footerBand}>
          <View style={styles.paymentInfo}>
            <Text style={styles.footerLabel}>Payment Information</Text>
            <Text style={styles.footerValue}>UPI ID: {brand.upiId}</Text>
            <Text style={styles.footerValue}>Bank Name: {brand.bankName}</Text>
            <Text style={styles.footerValue}>Account No: {brand.accountNo}</Text>
            <Text style={styles.footerValue}>IFSC Code: {brand.ifsc}</Text>
            {brand.paymentLink ? (
              <Text style={[styles.footerValue, { marginTop: 4 }]}>
                Payment Link:{" "}
                <Link
                  src={brand.paymentLink}
                  style={{ color: blue, textDecoration: "underline", fontFamily: "Helvetica-Bold" }}
                >
                  {brand.paymentLink}
                </Link>
              </Text>
            ) : null}
          </View>
          <View style={styles.sealQrContainer}>
            {brand.sealUrl ? <Image src={brand.sealUrl} style={styles.seal} /> : null}
            <View style={styles.qrBlock}>
              {brand.qrUrl ? <Image src={brand.qrUrl} style={styles.qr} /> : null}
              <Text style={styles.qrText}>Scan to Pay</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
