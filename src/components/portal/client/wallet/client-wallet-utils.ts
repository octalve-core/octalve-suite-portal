import type { PaymentGatewaySetting, WalletLedgerEntry } from "@/lib/types";

export type WalletFundingProvider = {
  provider: string;
  displayName: string;
};

export function formatWalletMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
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

export function entryTone(entry: WalletLedgerEntry) {
  if (entry.direction === "IN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (entry.entryType === "HOLD") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (entry.entryType === "REVERSAL") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function normalizeEntryLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function isSafeCheckoutUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
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
