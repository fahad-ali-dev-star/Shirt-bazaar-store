"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download } from "lucide-react";

interface WalletQRProps {
  accountNumber: string;
  accountTitle: string;
  amount: number;
  orderRef?: string;
  walletName: "JazzCash" | "Easypaisa";
  brandColor: string;
  bgLight: string;
  borderColor: string;
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
}: WalletQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<"account" | "amount" | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Normalize account number to digits only
  const cleanNumber = accountNumber.replace(/[^0-9]/g, "");

  // Build the QR payload — follows the Raast / EMVCo-inspired Pakistani wallet scan format
  // Most wallet apps that support QR scanning accept this format:
  // ACCOUNT|AMOUNT|TITLE|REF
  // Some wallets also accept plain phone numbers and auto-fill on scan
  const qrPayload = [
    cleanNumber,
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
        dark: "#0f172a",   // dark slate
        light: "#ffffff",  // white background
      },
      errorCorrectionLevel: "M",
    })
      .then(() => setQrGenerated(true))
      .catch(console.error);
  }, [qrPayload]);

  function copyToClipboard(text: string, type: "account" | "amount") {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      });
    }
  }

  function downloadQR() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${walletName.toLowerCase()}-payment-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  const isJazzCash = walletName === "JazzCash";

  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgLight} p-4 sm:p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: brandColor }}
          >
            {isJazzCash ? "J" : "E"}
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
            {isJazzCash ? "J" : "E"}
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
