import { NextResponse } from "next/server";
import { logServerError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/admin";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { isEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { authorized, user } = await requireAdmin();
  if (!authorized || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = new URL(req.url).searchParams.get("to")?.trim() || user.email;
  if (!isEmail(to)) {
    return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
  }

  try {
    await sendOrderConfirmationEmail(to, "Test User", "test-order-12345", 1500);
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Test email failed", error);
    return NextResponse.json({ success: false, error: "Unable to send test email" }, { status: 500 });
  }
}
