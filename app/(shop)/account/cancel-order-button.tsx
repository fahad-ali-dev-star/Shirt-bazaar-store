"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this order? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "Failed to cancel order");
        return;
      }

      window.alert("Order cancelled successfully.");
      router.refresh();
    } catch {
      window.alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          <span>Cancelling…</span>
        </>
      ) : (
        <>
          <XCircle size={12} />
          <span>Cancel Order</span>
        </>
      )}
    </button>
  );
}
