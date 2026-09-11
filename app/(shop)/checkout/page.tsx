"use client";

import { useState, useEffect, Suspense } from "react";
import { useCart } from "@/lib/store/cart";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, ChevronRight, Tag, Copy, Check, Smartphone, Info } from "lucide-react";
import { WALLET_CONFIGS } from "@/lib/payments/wallet-config";
import { WalletQRCode } from "@/components/wallet-qr-code";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/payments/shipping";

/* ── Step indicator ── */
function Step({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          done
            ? "bg-emerald-500 text-white"
            : active
            ? "bg-brand-600 text-white"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? "✓" : label[0]}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active ? "text-slate-900" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

function CheckoutForm() {
  const { items, subtotal, discountAmount, discountedTotal, appliedCoupon } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "jazzcash" | "easypaisa" | "stripe">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const rawDiscounted = discountedTotal();
  const shippingFee = calculateShipping(rawDiscounted, form.city);
  const grandTotal = rawDiscounted + shippingFee;
  const freeShippingDifference = Math.max(0, FREE_SHIPPING_THRESHOLD - rawDiscounted);

  function handleCopyAccount(accountNumber: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber.replace(/[^0-9]/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam) {
      if (errParam === "payment_failed") setError("Payment failed. Please try again.");
      else if (errParam === "invalid_signature") setError("Payment verification failed. Please try again.");
      else if (errParam === "order_not_found") setError("Order not found. Please try checking out again.");
      else setError("An error occurred during payment.");
    }
  }, [searchParams]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-slate-800 mb-2">Your cart is empty</p>
        <button onClick={() => router.push("/")} className="mt-4 text-sm text-brand-600 underline">
          Go back to shopping
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if ((paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && !transactionId.trim()) {
      setError(`Please enter the Transaction ID (TID) from your ${paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"} confirmation SMS.`);
      return;
    }

    if ((paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && !senderPhone.trim()) {
      setError(`Please enter the mobile number you used to send the ${paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"} payment. We need this to verify your transfer.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
          shippingAddress: form,
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          senderPhone: senderPhone.trim() || undefined,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?next=/checkout`);
          return;
        }
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Order created, but could not navigate to confirmation.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  const inputCls = "input-base mt-1.5";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="animate-fade-in">
      {/* Progress Steps */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-1 scrollbar-none">
        <Step label="Cart" active={false} done={true} />
        <ChevronRight size={14} className="text-slate-300 shrink-0" />
        <Step label="Details" active={true} done={false} />
        <ChevronRight size={14} className="text-slate-300 shrink-0" />
        <Step label="Payment" active={false} done={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        {/* ── Left: Form ── */}
        <div className="lg:col-span-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-5 sm:mb-6">
            Shipping Details
          </h1>

          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs sm:text-sm text-red-700">
              <span className="text-base shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="fullName" className={labelCls}>Full Name</label>
                <input
                  id="fullName"
                  required
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelCls}>Email Address</label>
                <input
                  id="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className={labelCls}>Phone Number</label>
              <input
                id="phone"
                required
                placeholder="03XX-XXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="address" className={labelCls}>Street Address</label>
              <input
                id="address"
                required
                placeholder="House #, Street, Area"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="city" className={labelCls}>City</label>
              <input
                id="city"
                required
                placeholder="Karachi, Lahore, Islamabad…"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
              />
            </div>

            {/* Payment Method */}
            <div className="pt-2">
              <p className={labelCls + " mb-3"}>Payment Method</p>
              <div className="grid gap-3">
                {[
                  {
                    id: "cod",
                    icon: "💵",
                    title: "Cash on Delivery",
                    desc: "Pay in cash when your parcel arrives at your doorstep.",
                    badge: "Most Popular",
                    disabled: false,
                  },
                  {
                    id: "jazzcash",
                    icon: "📱",
                    title: "JazzCash",
                    desc: "Scan Merchant QR, dial *786*10# (Till ID: 984456353), or pay via Raast.",
                    badge: "Business Merchant",
                    disabled: false,
                  },
                  {
                    id: "easypaisa",
                    icon: "🟢",
                    title: "Easypaisa",
                    desc: "Transfer via Easypaisa App or *786# and provide Transaction ID.",
                    badge: "Direct Wallet",
                    disabled: false,
                  },
                  {
                    id: "stripe",
                    icon: "💳",
                    title: "Card Payment (Stripe)",
                    desc: "Visa, MasterCard, or Debit Card.",
                    badge: "Coming Soon",
                    disabled: true,
                  },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (opt.disabled) return;
                      setPaymentMethod(opt.id as "cod" | "jazzcash" | "easypaisa" | "stripe");
                    }}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 transition-all select-none ${
                      opt.disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : paymentMethod === opt.id
                        ? "cursor-pointer border-brand-500 bg-brand-50/60 shadow-sm"
                        : "cursor-pointer border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.id}
                      checked={paymentMethod === opt.id}
                      disabled={opt.disabled}
                      onChange={() => {
                        if (!opt.disabled)
                          setPaymentMethod(opt.id as "cod" | "jazzcash" | "easypaisa" | "stripe");
                      }}
                      className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${opt.disabled ? "text-slate-400" : "text-slate-900"}`}>
                          {opt.icon} {opt.title}
                        </span>
                        {opt.badge && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            opt.id === "cod"
                              ? "bg-amber-100 text-amber-800"
                              : opt.id === "jazzcash"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : opt.id === "easypaisa"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-500"
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs ${opt.disabled ? "text-slate-400" : "text-slate-500"}`}>
                        {opt.disabled
                          ? "Card payments are not available yet. Please choose another method."
                          : opt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Dynamic QR Payment (JazzCash / Easypaisa) ── */}
              {(paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && (
                <div className="mt-4 space-y-4 animate-fade-in">
                  <WalletQRCode
                    accountNumber={WALLET_CONFIGS[paymentMethod].accountNumber}
                    accountTitle={WALLET_CONFIGS[paymentMethod].accountTitle}
                    amount={grandTotal}
                    orderRef={`SB-${Date.now().toString().slice(-6)}`}
                    walletName={paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"}
                    brandColor={WALLET_CONFIGS[paymentMethod].brandColor}
                    bgLight={WALLET_CONFIGS[paymentMethod].bgLight}
                    borderColor={WALLET_CONFIGS[paymentMethod].borderColor}
                    tillId={WALLET_CONFIGS[paymentMethod].tillId}
                    isMerchant={WALLET_CONFIGS[paymentMethod].isMerchant}
                    ussdCode={WALLET_CONFIGS[paymentMethod].ussdCode}
                    posterImage={WALLET_CONFIGS[paymentMethod].posterImage}
                  />

                  {/* Verification note */}
                  <div className={`rounded-xl border px-3.5 py-3 text-xs ${
                    paymentMethod === "jazzcash"
                      ? "bg-amber-50/80 border-amber-200 text-amber-900"
                      : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  }`}>
                    <p className="font-semibold mb-1">
                      {paymentMethod === "jazzcash"
                        ? "⚡ Instant Payment Verification"
                        : "⚠️ Important — Pay from the same network"}
                    </p>
                    <p className="leading-relaxed">
                      {paymentMethod === "jazzcash"
                        ? "Make sure you confirm 'FAHAD Shop' (Till ID: 984456353) when completing payment. Once transferred, enter the Transaction ID (TID) from your JazzCash receipt below."
                        : "Please send from an Easypaisa account to our Easypaisa number. Cross-network payments take longer to verify."}
                    </p>
                  </div>

                  {/* TID + Sender Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="walletTid" className={labelCls}>
                        Transaction ID (TID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="walletTid"
                        required
                        type="text"
                        placeholder="e.g. 1234567890 or TJ240910123456"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className={`${inputCls} bg-white`}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        From the SMS/receipt you received after payment.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="walletSender" className={labelCls}>
                        Your Sending Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="walletSender"
                        required
                        type="text"
                        placeholder="03XX-XXXXXXX"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className={`${inputCls} bg-white`}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        The mobile number you sent the payment from.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ── Right: Summary ── */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-24 shadow-xs">
            <h2 className="font-bold text-slate-900 mb-4 text-xs sm:text-sm uppercase tracking-wider">
              Your Order
            </h2>

            <ul className="space-y-3 mb-5 pb-4 border-b border-slate-100">
              {items.map((item) => (
                <li key={item.variantId} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-600 truncate mr-2">
                    {item.productName}
                    <span className="ml-1 text-slate-400">× {item.qty}</span>
                  </span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    Rs {(item.price * item.qty).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs sm:text-sm mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">Rs {subtotal().toFixed(2)}</span>
              </div>

              {/* Coupon Discount Line */}
              {appliedCoupon && discountAmount() > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Tag size={12} />
                    {appliedCoupon.code} ({appliedCoupon.discountPercent}% off)
                  </span>
                  <span className="font-bold">− Rs {discountAmount().toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span>Shipping</span>
                  {shippingFee === 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      Free
                    </span>
                  )}
                </span>
                <span className={`font-semibold ${shippingFee === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                  {shippingFee === 0 ? "FREE" : `Rs ${shippingFee}`}
                </span>
              </div>

              {freeShippingDifference > 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                  💡 Add <strong className="font-bold">Rs {freeShippingDifference.toFixed(0)}</strong> more to get <strong>FREE delivery</strong> across Pakistan!
                </p>
              )}
            </div>

            <div className="flex justify-between items-baseline mb-5 pt-3 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <div className="text-right">
                {appliedCoupon && discountAmount() > 0 && (
                  <p className="text-xs line-through text-slate-400">Rs {(subtotal() + shippingFee).toFixed(2)}</p>
                )}
                <span className="text-xl sm:text-2xl font-extrabold text-brand-600">
                  Rs {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="btn-primary w-full py-3.5 sm:py-4 rounded-xl text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? paymentMethod === "cod"
                  ? "Placing Order…"
                  : paymentMethod === "jazzcash"
                  ? "Verifying TID…"
                  : paymentMethod === "easypaisa"
                  ? "Verifying TID…"
                  : "Redirecting…"
                : paymentMethod === "cod"
                ? "Place Order (Cash on Delivery)"
                : paymentMethod === "jazzcash"
                ? "Place Order & Verify JazzCash"
                : paymentMethod === "easypaisa"
                ? "Place Order & Verify Easypaisa"
                : "Pay with Card"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock size={11} />
              <span>Secured by SSL encryption</span>
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={11} />
              <span>Your data is never shared</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-slate-400 animate-pulse">Loading checkout…</div>
        </div>
      }>
        <CheckoutForm />
      </Suspense>
    </main>
  );
}
