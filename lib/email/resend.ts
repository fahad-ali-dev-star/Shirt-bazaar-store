import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrderShippedEmail } from "@/emails/order-shipped";
import { logServerError } from "@/lib/api/errors";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Store <onboarding@resend.dev>";

export async function sendOrderConfirmationEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  total: number,
  paymentMethod: "stripe" | "cod" | "jazzcash" | "easypaisa" = "stripe",
  transactionId?: string
) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not configured; confirmation email skipped.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Order Confirmation - #${orderId.slice(0, 8)}`,
      react: OrderConfirmationEmail({ orderId, total, customerName, paymentMethod, transactionId }),
    });
  } catch (error) {
    logServerError("Failed to send order confirmation email", error, { orderId });
  }
}

export async function sendOrderShippedEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  courier: string,
  trackingNumber: string
) {
  const resend = getResendClient();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Your order has shipped! - #${orderId.slice(0, 8)}`,
      react: OrderShippedEmail({ orderId, customerName, courier, trackingNumber }),
    });
  } catch (error) {
    logServerError("Failed to send order shipped email", error, { orderId });
  }
}
