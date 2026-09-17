import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationProps {
  orderId: string;
  total: number;
  customerName: string;
  paymentMethod?: "stripe" | "cod" | "jazzcash" | "easypaisa";
  transactionId?: string;
  siteUrl?: string;
}

export const OrderConfirmationEmail = ({
  orderId,
  total,
  customerName,
  paymentMethod = "stripe",
  transactionId,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fhdstore.pk",
}: OrderConfirmationProps) => {
  const isCod = paymentMethod === "cod";
  const isJazzCash = paymentMethod === "jazzcash";
  const isEasypaisa = paymentMethod === "easypaisa";
  const isWallet = isJazzCash || isEasypaisa;
  const walletName = isJazzCash ? "JazzCash" : "Easypaisa";
  const cleanOrderId = orderId.slice(0, 8).toUpperCase();
  const logoUrl = `${siteUrl.replace(/\/$/, "")}/logo.png`;

  return (
    <Html>
      <Head />
      <Preview>Order Confirmation #{cleanOrderId} - FHD Store</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand Header */}
          <Section style={headerSection}>
            <table style={{ width: "100%", textAlign: "center" }}>
              <tr>
                <td align="center">
                  <div style={brandBadge}>
                    <span style={brandNameFhd}>FHD</span>{" "}
                    <span style={brandNameStore}>STORE</span>
                  </div>
                  <Text style={taglineText}>Premium Shirts &amp; Everyday Essentials</Text>
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Greeting */}
          <Section style={contentSection}>
            <Heading style={h1}>Thank you for your order! 🎉</Heading>
            <Text style={greetingText}>Hi <strong>{customerName}</strong>,</Text>
            <Text style={bodyText}>
              We have received your order and our fulfillment team is preparing it with care.
              Your reference number is <strong style={orderIdBadge}>#{cleanOrderId}</strong>.
            </Text>

            {/* Order & Payment Summary Card */}
            <Section style={summaryCard}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tr>
                  <td style={summaryLabel}>Order ID</td>
                  <td style={summaryValue}>#{cleanOrderId}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Payment Method</td>
                  <td style={summaryValue}>
                    {isCod
                      ? "Cash on Delivery (COD)"
                      : isJazzCash
                      ? "JazzCash Direct Transfer"
                      : isEasypaisa
                      ? "Easypaisa Direct Transfer"
                      : "Card Payment (Stripe)"}
                  </td>
                </tr>
                <tr>
                  <td style={summaryLabel}>
                    {isCod ? "Amount Due on Delivery" : isWallet ? "Amount Transferred" : "Total Paid"}
                  </td>
                  <td style={{ ...summaryValue, color: "#16a34a", fontSize: "18px", fontWeight: "bold" }}>
                    Rs {total.toLocaleString()}
                  </td>
                </tr>
              </table>

              {isCod && (
                <div style={noticeBox}>
                  <Text style={noticeText}>
                    💵 <strong>Cash on Delivery:</strong> Please keep the exact amount (<strong>Rs {total.toLocaleString()}</strong>) ready when the courier arrives at your doorstep.
                  </Text>
                </div>
              )}

              {isWallet && transactionId && (
                <div style={tidBox}>
                  <Text style={tidLabel}>Submitted Transaction ID (TID):</Text>
                  <Text style={tidCode}>{transactionId}</Text>
                  <Text style={noticeSubText}>
                    🔍 Our accounts team will verify your {walletName} transfer shortly and begin packing your parcel.
                  </Text>
                </div>
              )}
            </Section>

            {/* Next Steps */}
            <Text style={bodyText}>
              {isWallet
                ? `If you haven't completed the ${walletName} transfer yet, please finalize it using your order ID as reference.`
                : "You will receive an automated tracking notification as soon as your parcel is handed over to the courier."}
            </Text>

            <Section style={{ textAlign: "center", marginTop: "24px", marginBottom: "16px" }}>
              <Link href={`${siteUrl}/account`} style={primaryButton}>
                View Order Status in Account →
              </Link>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Need help with your order? Reply directly to this email or visit our store.
            </Text>
            <Text style={copyrightText}>
              © {new Date().getFullYear()} <strong>FHD Store</strong>. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// --- Styles ---
const main = {
  backgroundColor: "#f4f6f8",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "580px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
};

const headerSection = {
  padding: "28px 24px 16px",
  textAlign: "center" as const,
  backgroundColor: "#ffffff",
};

const brandBadge = {
  display: "inline-block",
  fontSize: "24px",
  fontWeight: "900",
  letterSpacing: "-0.5px",
};

const brandNameFhd = {
  color: "#1E3A8A",
  fontWeight: "900",
  fontSize: "26px",
};

const brandNameStore = {
  color: "#64748B",
  fontWeight: "700",
  fontSize: "22px",
  letterSpacing: "2px",
};

const taglineText = {
  margin: "6px 0 0",
  fontSize: "12px",
  color: "#94a3b8",
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
};

const divider = {
  borderColor: "#f1f5f9",
  margin: "0",
};

const contentSection = {
  padding: "28px 32px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "800",
  margin: "0 0 16px",
  textAlign: "left" as const,
};

const greetingText = {
  fontSize: "15px",
  color: "#334155",
  margin: "0 0 10px",
};

const bodyText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#475569",
  margin: "0 0 16px",
};

const orderIdBadge = {
  backgroundColor: "#eff6ff",
  color: "#1e40af",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const summaryCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "20px 0",
};

const summaryLabel = {
  padding: "6px 0",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "500",
};

const summaryValue = {
  padding: "6px 0",
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: "600",
  textAlign: "right" as const,
};

const noticeBox = {
  backgroundColor: "#fefce8",
  border: "1px solid #fef08a",
  borderRadius: "6px",
  padding: "10px 14px",
  marginTop: "12px",
};

const noticeText = {
  margin: "0",
  fontSize: "13px",
  color: "#854d0e",
  lineHeight: "18px",
};

const tidBox = {
  backgroundColor: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "12px 14px",
  marginTop: "12px",
};

const tidLabel = {
  margin: "0 0 4px",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "600",
};

const tidCode = {
  margin: "0 0 6px",
  fontSize: "16px",
  fontFamily: "monospace",
  fontWeight: "bold",
  color: "#0f172a",
  letterSpacing: "1px",
};

const noticeSubText = {
  margin: "0",
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "16px",
};

const primaryButton = {
  backgroundColor: "#1E3A8A",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footerSection = {
  padding: "20px 32px 28px",
  textAlign: "center" as const,
  backgroundColor: "#f8fafc",
};

const footerText = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 8px",
};

const copyrightText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0",
};

