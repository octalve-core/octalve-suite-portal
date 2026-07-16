import type { PaymentGatewaySetting, WalletLedgerEntry } from "@/lib/types";

export type WalletFundingProvider = {
  provider: string;
  displayName: string;
};

export type WalletEntryKind = "credit" | "debit" | "refund" | "hold" | "adjustment";

export const WALLET_TOP_UP_LIMITS = {
  min: 1000,
  max: 5000000,
};

export function formatWalletMoney(value: number, showDecimals = true) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatWalletDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatWalletTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeEntryLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (item) => item.toUpperCase());
}

export function walletEntryKind(entry: WalletLedgerEntry): WalletEntryKind {
  if (entry.entryType === "REFUND" || entry.entryType === "REVERSAL") return "refund";
  if (entry.entryType === "HOLD") return "hold";
  if (entry.direction === "IN") return "credit";
  if (entry.direction === "OUT") return "debit";

  return "adjustment";
}

export function entryTone(entry: WalletLedgerEntry) {
  const kind = walletEntryKind(entry);

  if (kind === "credit") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (kind === "debit") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (kind === "refund") {
    return "bg-blue-50 text-[#0064E0] ring-blue-100";
  }

  if (kind === "hold") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function entryAmountClass(entry: WalletLedgerEntry) {
  return entry.direction === "IN" ? "text-emerald-600" : "text-slate-950";
}

export function signedWalletAmount(entry: WalletLedgerEntry) {
  const amount = formatWalletMoney(entry.amount);
  return entry.direction === "IN" ? `+ ${amount}` : `- ${amount}`;
}

export function isSafeCheckoutUrl(value?: string, provider?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const normalizedProvider = String(provider ?? "").trim().toUpperCase();

    if (url.protocol !== "https:") return false;

    if (normalizedProvider === "PAYSTACK") {
      return hostname === "checkout.paystack.com" || hostname.endsWith(".paystack.com");
    }

    if (normalizedProvider === "FLUTTERWAVE") {
      return hostname === "checkout.flutterwave.com" || hostname.endsWith(".flutterwave.com");
    }

    return false;
  } catch {
    return false;
  }
}

export function sanitizeFundingAmountInput(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 9);
}

export function parseFundingAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount);
}

export function validateFundingAmount(value: string) {
  const amount = parseFundingAmount(value);

  if (amount < WALLET_TOP_UP_LIMITS.min) {
    return `Minimum wallet funding amount is ${formatWalletMoney(WALLET_TOP_UP_LIMITS.min, false)}.`;
  }

  if (amount > WALLET_TOP_UP_LIMITS.max) {
    return `Maximum wallet funding amount is ${formatWalletMoney(WALLET_TOP_UP_LIMITS.max, false)}.`;
  }

  return "";
}

export function getWalletFundingProviders(
  gateways: PaymentGatewaySetting[],
): WalletFundingProvider[] {
  return gateways
    .filter((gateway) =>
      ["PAYSTACK", "FLUTTERWAVE"].includes(String(gateway.provider)),
    )
    .filter((gateway) => gateway.isEnabled)
    .filter((gateway) => Boolean(gateway.publicKeyConfigured && gateway.secretKeyConfigured))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((gateway) => ({
      provider: String(gateway.provider),
      displayName: gateway.displayName,
    }));
}

export function walletEntryActionHref(entry: WalletLedgerEntry) {
  if (entry.paymentId) return `/client/payments/${entry.paymentId}`;
  if (entry.projectId) return `/client/projects/${entry.projectId}`;

  return "";
}

export function maskWalletReference(value?: string, visibleStart = 8, visibleEnd = 4) {
  const cleaned = String(value ?? "").trim();

  if (!cleaned) return "Not available";
  if (cleaned.length <= visibleStart + visibleEnd + 3) return cleaned;

  return `${cleaned.slice(0, visibleStart)}...${cleaned.slice(-visibleEnd)}`;
}

export function safePublicWalletError(
  value: unknown,
  fallback = "Wallet service is temporarily unavailable. Please try again or contact support.",
) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : "";

  const cleaned = message.trim();

  if (!cleaned) return fallback;
  if (cleaned.length > 180) return fallback;

  const unsafeFragments = [
    "authorization",
    "bearer",
    "database",
    "env",
    "failed with status",
    "idempotency",
    "payload",
    "prisma",
    "provider request failed",
    "secret",
    "stack",
    "token",
    "webhook",
  ];

  const lower = cleaned.toLowerCase();

  if (unsafeFragments.some((fragment) => lower.includes(fragment))) {
    return fallback;
  }

  return cleaned;
}