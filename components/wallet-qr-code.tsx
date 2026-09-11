"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, QrCode, Smartphone, Sparkles, ExternalLink } from "lucide-react";
import Image from "next/image";

interface WalletQRProps {
  accountNumber: string;
  accountTitle: string;
  amount: number;
  orderRef?: string;
  walletName: "JazzCash" | "Easypaisa";
  brandColor: string;
  bgLight: string;
  borderColor: string;
  tillId?: string;
  isMerchant?: boolean;
  ussdCode?: string;
  posterImage?: string;
}

export function WalletQRCode({
  accountNumber,
  accountTitle,
  amount,
  orderRef,
  walletName,
  brandColor,
  bgLight,
  borderColor,
  tillId = "984456353",
  isMerchant,
  ussdCode = "*786*10#",
  posterImage = "/jazzcash-merchant-poster.jpg",
}: WalletQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<"account" | "amount" | "till" | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrViewMode, setQrViewMode] = useState<"dynamic" | "poster">("poster");

  const cleanNumber = accountNumber.replace(/[^0-9]/g, "");
  const isJazzCash = walletName === "JazzCash";
  const displayTillId = tillId || cleanNumber;

  // Build the QR payload — follows the Raast / EMVCo-inspired Pakistani wallet scan format
  const qrPayload = [
    displayTillId,
    amount.toFixed(0),
    accountTitle,
    orderRef || "",
  ]
    .filter(Boolean)
    .join("|");

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, qrPayload, {
      width: 220,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then(() => setQrGenerated(true))
      .catch(console.error);
  }, [qrPayload]);

  function copyToClipboard(text: string, type: "account" | "amount" | "till") {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      });
    }
  }

  function downloadQR() {
    if (qrViewMode === "poster" && isJazzCash) {
      const link = document.createElement("a");
      link.download = `jazzcash-fahad-shop-till-${displayTillId}.jpg`;
      link.href = posterImage;
      link.click();
      return;
    }

    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${walletName.toLowerCase()}-payment-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  // ── Specialized Layout for JazzCash Business Merchant ──
  if (isJazzCash) {
    return (
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-4 sm:p-6 space-y-5 shadow-xs">
        {/* Merchant Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-slate-900 shadow-sm font-black text-lg">
              JC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {accountTitle}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                  <Sparkles size={10} /> Merchant Till
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Official JazzCash &amp; Raast Verified Business Account
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 px-3.5 py-2 text-right self-start sm:self-auto">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Total</p>
            <p className="text-lg sm:text-xl font-extrabold text-brand-600">
              Rs {amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Till ID Prominent Badge Display */}
        <div className="rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-300 p-4 shadow-sm text-center">
          <p className="text-[11px] font-extrabold tracking-widest text-slate-900 uppercase mb-2">
            MERCHANT TILL ID
          </p>

          <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
            {displayTillId.split("").map((digit, idx) => (
              <span
                key={idx}
                className="inline-flex h-10 w-8 sm:h-12 sm:w-10 items-center justify-center rounded-lg bg-white font-mono text-xl sm:text-2xl font-black text-slate-900 shadow-sm border border-amber-200"
              >
                {digit}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(displayTillId, "till")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              {copied === "till" ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-300">Till ID Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Till ID ({displayTillId})</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(amount.toFixed(0), "amount")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-white transition-colors shadow-sm cursor-pointer"
            >
              {copied === "amount" ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700">Amount Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Rs {amount.toFixed(0)}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code + Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* QR Display Card */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative rounded-2xl border-4 border-white bg-white p-2.5 shadow-md w-full max-w-[240px]">
              {qrViewMode === "poster" ? (
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-amber-400">
                  <Image
                    src={posterImage}
                    alt="JazzCash Official Merchant QR Poster"
                    fill
                    className="object-contain"
                    sizes="240px"
                    priority
                  />
                </div>
              ) : (
                <div className="relative flex justify-center items-center py-2">
                  <canvas ref={canvasRef} className="block mx-auto max-w-full" />
                </div>
              )}

              {/* View Switcher Button */}
              <div className="mt-2 flex gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setQrViewMode("poster")}
                  className={`flex-1 py-1 rounded-md transition-colors ${
                    qrViewMode === "poster"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  Merchant Poster
                </button>
                <button
                  type="button"
                  onClick={() => setQrViewMode("dynamic")}
                  className={`flex-1 py-1 rounded-md transition-colors ${
                    qrViewMode === "dynamic"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "hover:text-slate-900"
                  }`}
                >
                  Amount QR
                </button>
              </div>

              <button
                type="button"
                onClick={downloadQR}
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
              >
                <Download size={12} />
                Save QR to Phone
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 text-center">
              Scan with JazzCash, Raast, Easypaisa, or any banking app
            </p>
          </div>

          {/* Step-by-step Instructions */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              How to Pay (Choose either method):
            </h4>

            {/* Method A: QR Scan */}
            <div className="rounded-xl bg-white border border-amber-200 p-3 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <QrCode size={14} className="text-amber-600" />
                <span>Method 1: Scan QR (Instant)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                <li>Open <strong>JazzCash App</strong> (or any Raast enabled banking app).</li>
                <li>Tap <strong>&quot;Scan QR&quot;</strong> and point your camera at the QR code.</li>
                <li>Verify merchant is <strong>FAHAD Shop</strong> &amp; amount is <strong>Rs {amount.toFixed(0)}</strong>.</li>
                <li>Enter your MPIN to confirm.</li>
              </ol>
            </div>

            {/* Method B: USSD Dial Code */}
            <div className="rounded-xl bg-white border border-amber-200 p-3 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Smartphone size={14} className="text-amber-600" />
                <span>Method 2: Dial *786*10# (Offline / No App Needed)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                <li>Dial <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">*786*10#</code> from your Jazz SIM.</li>
                <li>Enter Till ID: <strong className="font-mono text-slate-900">{displayTillId}</strong></li>
                <li>Enter Amount: <strong className="font-mono text-slate-900">Rs {amount.toFixed(0)}</strong></li>
                <li>Confirm recipient is <strong>FAHAD Shop</strong> and enter MPIN.</li>
              </ol>
            </div>

            {/* Raast Note */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800 flex items-center gap-2">
              <span className="font-bold">✨ Raast Supported:</span>
              <span>You can also pay from Nayapay, SadaPay, HBL, Meezan etc. via Raast QR.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Layout for Easypaisa ──
  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgLight} p-4 sm:p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: brandColor }}
          >
            E
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Scan QR to Pay via {walletName}</p>
            <p className="text-xs text-slate-500">Open {walletName} app → Tap &quot;Scan QR&quot;</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bill Amount</p>
          <p className="text-xl font-extrabold text-slate-900">Rs {amount.toLocaleString()}</p>
        </div>
      </div>

      {/* QR Code + Payment Info */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* QR Canvas */}
        <div className="relative shrink-0">
          <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white p-2">
            <canvas
              ref={canvasRef}
              className={`block transition-opacity duration-500 ${qrGenerated ? "opacity-100" : "opacity-0"}`}
            />
            {!qrGenerated && (
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
                  <p className="text-xs text-slate-400">Generating QR…</p>
                </div>
              </div>
            )}
          </div>
          {/* Wallet logo badge overlay */}
          <div
            className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-extrabold shadow-md"
            style={{ background: brandColor }}
          >
            E
          </div>
        </div>

        {/* Payment Details */}
        <div className="flex-1 w-full space-y-3">
          {/* Account Number */}
          <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              Account / Mobile Number
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base sm:text-lg font-extrabold text-slate-900 tracking-wider">
                {accountNumber}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(cleanNumber, "account")}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              >
                {copied === "account" ? (
                  <><Check size={12} className="text-emerald-600" /><span className="text-emerald-700">Copied!</span></>
                ) : (
                  <><Copy size={12} /><span>Copy</span></>
                )}
              </button>
            </div>
          </div>

          {/* Account Title */}
          <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              Account Title
            </p>
            <p className="font-semibold text-sm text-slate-900">{accountTitle}</p>
          </div>

          {/* Exact Amount */}
          <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-xs">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              Exact Amount to Send
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-extrabold text-slate-900">
                Rs {amount.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(amount.toFixed(0), "amount")}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
              >
                {copied === "amount" ? (
                  <><Check size={12} className="text-emerald-600" /><span className="text-emerald-700">Copied!</span></>
                ) : (
                  <><Copy size={12} /><span>Copy</span></>
                )}
              </button>
            </div>
          </div>

          {/* Download QR Button */}
          <button
            type="button"
            onClick={downloadQR}
            disabled={!qrGenerated}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 shadow-xs"
          >
            <Download size={13} />
            Save QR to Phone
          </button>
        </div>
      </div>

      {/* How to scan instructions */}
      <div
        className="rounded-xl p-3 text-xs space-y-1.5"
        style={{ background: `${brandColor}10`, border: `1px solid ${brandColor}30` }}
      >
        <p className="font-bold text-slate-800 text-xs">How to pay with QR:</p>
        {[
          `Open your ${walletName} app on your mobile phone`,
          `Tap "Scan QR" or "Pay via QR" button in the app`,
          `Point your camera at the QR code above`,
          `The app will auto-fill the account number and amount`,
          `Verify receiver name matches "${accountTitle}", then confirm payment`,
          `Copy the Transaction ID (TID) from the confirmation and enter it below`,
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white text-[9px] font-extrabold mt-0.5"
              style={{ background: brandColor }}
            >
              {i + 1}
            </span>
            <span className="text-slate-700">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

