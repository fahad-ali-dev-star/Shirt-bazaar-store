import {
  Body,
  Container,
  Head,
  Heading,
  Html,
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
}

export const OrderConfirmationEmail = ({
  orderId,
  total,
  customerName,
  paymentMethod = "stripe",
  transactionId,
}: OrderConfirmationProps) => {
  const isCod = paymentMethod === "cod";
  const isJazzCash = paymentMethod === "jazzcash";
  const isEasypaisa = paymentMethod === "easypaisa";
  const isWallet = isJazzCash || isEasypaisa;
  const walletName = isJazzCash ? "JazzCash" : "Easypaisa";

  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - #{orderId.slice(0, 8)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your order!</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            We've received your order and are currently processing it.
            Your order number is <strong>#{orderId.slice(0, 8)}</strong>.
          </Text>
          <Section style={section}>
            <Text style={text}>
              <strong>Payment Method:</strong>{" "}
              {isCod
                ? "Cash on Delivery (COD)"
                : isJazzCash
                ? "JazzCash (Direct Transfer)"
                : isEasypaisa
                ? "Easypaisa (Direct Transfer)"
                : "Card (Stripe)"}
            </Text>
            <Text style={text}>
              <strong>{isCod ? "Amount Due on Delivery:" : isWallet ? "Amount Transferred:" : "Total Paid:"}</strong>{" "}
              Rs {total.toFixed(2)}
            </Text>
            {isCod && (
              <Text style={{ ...text, fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
                💵 Please have the exact cash amount ready when the courier arrives at your doorstep.
              </Text>
            )}
            {isWallet && transactionId && (
              <Text style={{ ...text, fontSize: "14px", color: "#374151", marginTop: "8px", fontFamily: "monospace", background: "#f3f4f6", padding: "8px 12px", borderRadius: "6px" }}>
                📋 Your submitted TID: <strong>{transactionId}</strong>
              </Text>
            )}
            {isWallet && (
              <Text style={{ ...text, fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                🔍 Our team will verify your {walletName} payment shortly and begin preparing your order.
                You will receive another email once your order is confirmed and shipped.
              </Text>
            )}
          </Section>
          <Text style={text}>
            {isWallet
              ? `If you have not completed the ${walletName} transfer yet, please do so immediately to avoid delays.`
              : "You will receive another update when your order has shipped with courier tracking details."}
            {" "}If you have any questions, reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

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
