export interface WalletConfig {
  id: "jazzcash" | "easypaisa";
  name: string;
  accountNumber: string;
  accountTitle: string;
  tillId?: string;
  isMerchant?: boolean;
  ussdCode?: string;
  brandColor: string;
  bgLight: string;
  borderColor: string;
  badgeColor: string;
  logo: string;
  posterImage?: string;
  instructions: string[];
}

export const WALLET_CONFIGS: Record<"jazzcash" | "easypaisa", WalletConfig> = {
  jazzcash: {
    id: "jazzcash",
    name: "JazzCash",
    accountNumber: process.env.NEXT_PUBLIC_JAZZCASH_ACCOUNT_NUMBER || "984456353",
    accountTitle: process.env.NEXT_PUBLIC_JAZZCASH_ACCOUNT_TITLE || "FAHAD Shop",
    tillId: process.env.NEXT_PUBLIC_JAZZCASH_TILL_ID || "984456353",
    isMerchant: true,
    ussdCode: "*786*10#",
    brandColor: "#D81B26",
    bgLight: "bg-amber-50/70",
    borderColor: "border-amber-300",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    logo: "📱",
    posterImage: "/jazzcash-merchant-poster.jpg",
    instructions: [
      "Method 1 (QR Scan): Open JazzCash App → Tap 'Scan QR' → Scan the Merchant QR code above.",
      "Method 2 (USSD Mobile): Dial *786*10# on your Jazz SIM → Enter Till ID: 984456353 → Enter exact order amount.",
      "Confirm merchant name is 'FAHAD Shop' and complete payment with your MPIN.",
      "Copy the Transaction ID (TID) from the SMS/app receipt and enter it below.",
    ],
  },
  easypaisa: {
    id: "easypaisa",
    name: "Easypaisa",
    accountNumber: process.env.NEXT_PUBLIC_EASYPAISA_ACCOUNT_NUMBER || "0340-0872273",
    accountTitle: process.env.NEXT_PUBLIC_EASYPAISA_ACCOUNT_TITLE || "Fahad Ali",
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

