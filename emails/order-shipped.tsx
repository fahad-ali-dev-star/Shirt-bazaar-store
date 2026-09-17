import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { getCourierTrackingUrl } from "@/lib/tracking";

interface OrderShippedProps {
  orderId: string;
  customerName: string;
  courier: string;
  trackingNumber: string;
  siteUrl?: string;
}

export const OrderShippedEmail = ({
  orderId,
  customerName,
  courier,
  trackingNumber,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fhdstore.pk",
}: OrderShippedProps) => {
  const trackingUrl = getCourierTrackingUrl(courier, trackingNumber);
  const cleanOrderId = orderId.slice(0, 8).toUpperCase();

  return (
    <Html>
      <Head />
      <Preview>Your order #{cleanOrderId} has shipped! - FHD Store</Preview>
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

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={h1}>Your order is on the way! 🚚</Heading>
            <Text style={greetingText}>Hi <strong>{customerName}</strong>,</Text>
            <Text style={bodyText}>
              Great news! Your order <strong style={orderIdBadge}>#{cleanOrderId}</strong> has been handed over to our delivery partner and is on its way to you.
            </Text>

            {/* Courier Tracking Card */}
            <Section style={trackingCard}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tr>
                  <td style={summaryLabel}>Courier Service</td>
                  <td style={summaryValue}>{courier}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Tracking / CN Number</td>
                  <td style={{ ...summaryValue, fontFamily: "monospace", fontSize: "15px" }}>
                    {trackingNumber}
                  </td>
                </tr>
              </table>

              {trackingUrl && (
                <div style={{ textAlign: "center" as const, marginTop: "20px" }}>
                  <Button style={trackingButton} href={trackingUrl}>
                    Track Your Parcel →
                  </Button>
                </div>
              )}
            </Section>

            <Text style={bodyText}>
              You can also view order status and order history anytime from your account dashboard.
            </Text>

            <Section style={{ textAlign: "center", marginTop: "20px", marginBottom: "16px" }}>
              <Link href={`${siteUrl}/account`} style={secondaryButton}>
                View Order in Account
              </Link>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Have questions about your delivery? Reply directly to this email.
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

export default OrderShippedEmail;

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

const trackingCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
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

const trackingButton = {
  backgroundColor: "#1E3A8A",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 28px",
};

const secondaryButton = {
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
  border: "1px solid #cbd5e1",
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

