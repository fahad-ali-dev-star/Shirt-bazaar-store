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

const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa (KPK)",
  "Islamabad Capital Territory",
  "Balochistan",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan",
];

const POPULAR_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Sukkur",
  "Larkana",
  "Gujrat",
  "Mardan",
  "Rahim Yar Khan",
  "Sahiwal",
  "Okara",
  "Kasur",
  "Wah Cantt",
  "Sheikhupura",
  "Jhelum",
  "Muzaffarabad",
  "Mirpur",
  "Mingora",
  "Nawabshah",
  "Dera Ghazi Khan",
  "Kohat",
];

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
    alternatePhone: "",
    address: "",
    landmark: "",
    city: "Karachi",
    deliveryNotes: "",
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

    if (!form.fullName.trim()) {
      setError("Please enter the recipient's full name.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter a valid phone number for courier delivery.");
      return;
    }
    if (!form.address.trim()) {
      setError("Please enter your complete delivery address.");
      return;
    }
    if (!form.city.trim()) {
      setError("Please select or enter your delivery City.");
      return;
    }

    if ((paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && !transactionId.trim()) {
      setError(`Please enter the Transaction ID (TID) from your ${paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"} confirmation SMS.`);
      return;
    }

    if ((paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && !senderPhone.trim()) {
      setError(`Please enter the mobile number you used to send the ${paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"} payment.`);
      return;
    }

    setLoading(true);

    const synthesizedAddress = [
      form.address.trim(),
      form.landmark.trim() ? `(Near ${form.landmark.trim()})` : "",
      form.city.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const formattedPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      alternatePhone: form.alternatePhone.trim() || undefined,
      address: synthesizedAddress,
      streetAddress: form.address.trim(),
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      deliveryNotes: form.deliveryNotes.trim() || undefined,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
          shippingAddress: formattedPayload,
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
        if (data.url.startsWith("http://") || data.url.startsWith("https://")) {
          try {
            const urlObj = new URL(data.url);
            if (typeof window !== "undefined" && (urlObj.origin === window.location.origin || data.url.includes("/checkout/success"))) {
              router.push(`${urlObj.pathname}${urlObj.search}`);
            } else {
              window.location.href = data.url;
            }
          } catch {
            window.location.href = data.url;
          }
        } else {
          router.push(data.url);
        }
      } else if (data.orderId) {
        router.push(`/checkout/success?order=${data.orderId}&method=${paymentMethod}`);
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
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-600";

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
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Delivery & Shipping Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please provide accurate address details for smooth doorstep delivery across Pakistan.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs sm:text-sm text-red-700">
              <span className="text-base shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* ── Section 1: Contact Information ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <span className="text-lg">👤</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Contact Information</h2>
                  <p className="text-[11px] text-slate-500">Order updates and delivery SMS notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className={labelCls}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="phone" className={labelCls}>
                        Mobile / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded font-medium">
                        Courier Call
                      </span>
                    </div>
                    <input
                      id="phone"
                      required
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Courier will call this number before arrival.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="alternatePhone" className={labelCls}>
                        Alternative Phone
                      </label>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        Recommended
                      </span>
                    </div>
                    <input
                      id="alternatePhone"
                      placeholder="03XX-XXXXXXX (Optional)"
                      value={form.alternatePhone}
                      onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                      className={inputCls}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Backup number in case primary is busy/unreachable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Delivery Address ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="text-lg">📍</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Delivery Address</h2>
                  <p className="text-[11px] text-slate-500">Where should we deliver your order?</p>
                </div>
              </div>

              {/* Complete Address */}
              <div>
                <label htmlFor="address" className={labelCls}>
                  Complete Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  required
                  rows={2}
                  placeholder="House / Flat #, Street, Sector, Block, Area or Colony"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`${inputCls} resize-none leading-relaxed`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  e.g. House # 42-B, Street 5, Sector F-10/2 or Flat 304, Al-Madina Heights, Block 13-D
                </p>
              </div>

              {/* City and Nearby Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className={labelCls}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    required
                    list="pakistan-cities"
                    placeholder="Type or select city (e.g. Karachi, Lahore)"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={inputCls}
                  />
                  <datalist id="pakistan-cities">
                    {POPULAR_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="landmark" className={labelCls}>
                      Nearby Landmark
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
                  </div>
                  <input
                    id="landmark"
                    placeholder="e.g. Near Meezan Bank / Main Gate"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Delivery Note for Rider (Optional) */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="deliveryNotes" className={labelCls}>
                    Delivery Instructions / Notes
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
                </div>
                <input
                  id="deliveryNotes"
                  placeholder="e.g. Please call before coming or deliver after 2:00 PM"
                  value={form.deliveryNotes}
                  onChange={(e) => setForm({ ...form, deliveryNotes: e.target.value })}
                  className={inputCls}
                  maxLength={300}
                />
              </div>
            </div>

            {/* ── Section 3: Payment Method ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <span className="text-lg">💵</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Payment Method</h2>
                  <p className="text-[11px] text-slate-500">Pay safely when your package arrives</p>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    id: "cod",
                    icon: "💵",
                    title: "Cash on Delivery (COD)",
                    desc: "Pay in cash when your parcel arrives at your doorstep.",
                    badge: "Available",
                    disabled: false,
                  },
                  /*
                  // ── Digital Wallet & Card Payments (Uncomment to re-enable) ──
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
                  */
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
