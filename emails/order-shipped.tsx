import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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
}

export const OrderShippedEmail = ({
  orderId,
  customerName,
  courier,
  trackingNumber,
}: OrderShippedProps) => {
  const trackingUrl = getCourierTrackingUrl(courier, trackingNumber);

  return (
    <Html>
      <Head />
      <Preview>Your order has shipped! - #{orderId.slice(0, 8)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your order is on the way!</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Great news! Order <strong>#{orderId.slice(0, 8)}</strong> has been handed over to our delivery partner and is on its way to you.
          </Text>
          <Section style={section}>
            <Text style={text}>
              <strong>Courier:</strong> {courier}
            </Text>
            <Text style={text}>
              <strong>Tracking Number:</strong> {trackingNumber}
            </Text>
            {trackingUrl && (
              <div style={{ textAlign: "center" as const, marginTop: "16px", marginBottom: "8px" }}>
                <Button
                  style={btn}
                  href={trackingUrl}
                >
                  Track Your Package →
                </Button>
              </div>
            )}
          </Section>
          <Text style={text}>
            You can also view full order details in your customer account.
            If you have any questions, simply reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderShippedEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #f0f0f0",
  borderRadius: "5px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  padding: "30px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 30px",
};

const section = {
  padding: "20px 30px",
  backgroundColor: "#f9f9f9",
  margin: "20px 30px",
  borderRadius: "4px",
};

const btn = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
