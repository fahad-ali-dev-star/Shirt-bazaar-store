import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { OrderShippedEmail } from "@/emails/order-shipped";
import { logServerError } from "@/lib/api/errors";
import fs from "fs";
import path from "path";

function loadEnvFallback() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    // Ignore fallback errors
  }
}

function getSmtpTransporter() {
  loadEnvFallback();
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : undefined;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  if (!user || !pass) {
    console.warn("[email] ⚠️ Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function getFromHeader() {
  loadEnvFallback();
  const fromName = process.env.EMAIL_FROM_NAME || "FHD Store";
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const fromEmail =
    process.env.EMAIL_FROM ||
    user ||
    process.env.RESEND_FROM_EMAIL ||
    "onboarding@resend.dev";
  return `"${fromName}" <${fromEmail}>`;
}

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail({
  to,
  subject,
  reactElement,
}: {
  to: string;
  subject: string;
  reactElement: React.ReactElement;
}) {
  console.log(`[email] Preparing to send email to: ${to} (Subject: "${subject}")`);
  const smtp = getSmtpTransporter();
  const fromHeader = getFromHeader();

  // 1. Try Gmail / SMTP First (Free to send to ANY email address)
  if (smtp) {
    try {
      const html = await render(reactElement);
      const result = await smtp.sendMail({
        from: fromHeader,
        to,
        subject,
        html,
      });
      console.log(`[email] ✅ Successfully sent via Gmail SMTP to ${to} (MessageId: ${result.messageId})`);
      return { success: true, provider: "smtp", id: result.messageId };
    } catch (error) {
      console.error(`[email] ❌ Failed sending email via Gmail SMTP to ${to}:`, error);
      logServerError("Failed to send email via SMTP", error, { to, subject });
      throw error;
    }
  }

  // 2. Try Resend if configured
  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || fromHeader,
        to: [to],
        subject,
        react: reactElement,
      });
      console.log(`[email] ✅ Successfully sent via Resend to ${to} (Id: ${result.data?.id})`);
      return { success: true, provider: "resend", id: result.data?.id };
    } catch (error) {
      console.error(`[email] ❌ Failed sending email via Resend to ${to}:`, error);
      logServerError("Failed to send email via Resend", error, { to, subject });
      throw error;
    }
  }

  console.warn(
    "[email] ⚠️ No email provider configured. Please set GMAIL_USER & GMAIL_APP_PASSWORD in your .env.local file."
  );
  return { success: false, reason: "No email provider configured" };
}

export async function sendOrderConfirmationEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  total: number,
  paymentMethod: "stripe" | "cod" | "jazzcash" | "easypaisa" = "stripe",
  transactionId?: string
) {
  try {
    const storeName = process.env.EMAIL_FROM_NAME || "FHD Store";
    const subject = `Order Confirmation - #${orderId.slice(0, 8)} | ${storeName}`;
    const element = OrderConfirmationEmail({
      orderId,
      total,
      customerName,
      paymentMethod,
      transactionId,
    });
    return await sendEmail({ to: toEmail, subject, reactElement: element });
  } catch (error) {
    logServerError("Failed to send order confirmation email", error, { orderId, toEmail });
  }
}

export async function sendOrderShippedEmail(
  toEmail: string,
  customerName: string,
  orderId: string,
  courier: string,
  trackingNumber: string
) {
  try {
    const storeName = process.env.EMAIL_FROM_NAME || "FHD Store";
    const subject = `Your order #${orderId.slice(0, 8)} has shipped! | ${storeName}`;
    const element = OrderShippedEmail({
      orderId,
      customerName,
      courier,
      trackingNumber,
    });
    return await sendEmail({ to: toEmail, subject, reactElement: element });
  } catch (error) {
    logServerError("Failed to send order shipped email", error, { orderId, toEmail });
  }
}

