export interface WalletConfig {
  id: "jazzcash" | "easypaisa";
  name: string;
  accountNumber: string;
  accountTitle: string;
  brandColor: string;
  bgLight: string;
  borderColor: string;
  badgeColor: string;
  logo: string;
  instructions: string[];
}

export const WALLET_CONFIGS: Record<"jazzcash" | "easypaisa", WalletConfig> = {
  jazzcash: {
    id: "jazzcash",
    name: "JazzCash",
    accountNumber: process.env.NEXT_PUBLIC_JAZZCASH_ACCOUNT_NUMBER || "0300-1234567",
    accountTitle: process.env.NEXT_PUBLIC_JAZZCASH_ACCOUNT_TITLE || "Shirt Store Official",
    brandColor: "#D81B26",
    bgLight: "bg-red-50/70",
    borderColor: "border-red-200",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    logo: "📱",
    instructions: [
      "Open your JazzCash App or dial *786# on your mobile.",
      "Select 'Send Money' → 'To JazzCash Account' (or Mobile Number).",
      "Enter the Account Number and the exact order total.",
      "Confirm receiver name matches the Account Title above.",
      "After transfer, copy the 11-12 digit Transaction ID (TID) from the confirmation SMS/Receipt and paste it below.",
    ],
  },
  easypaisa: {
    id: "easypaisa",
    name: "Easypaisa",
    accountNumber: process.env.NEXT_PUBLIC_EASYPAISA_ACCOUNT_NUMBER || "0345-1234567",
    accountTitle: process.env.NEXT_PUBLIC_EASYPAISA_ACCOUNT_TITLE || "Shirt Store Official",
    brandColor: "#00A651",
    bgLight: "bg-emerald-50/70",
    borderColor: "border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    logo: "🟢",
    instructions: [
      "Open your Easypaisa App or dial *786# on your mobile.",
      "Select 'Send Money' → 'Easypaisa Mobile Account'.",
      "Enter the Account Number and the exact order total.",
      "Confirm receiver name matches the Account Title above.",
      "After transfer, copy the Transaction ID (TID) from the confirmation SMS/Receipt and paste it below.",
    ],
  },
};
