"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  Search,
  Settings2,
  WalletCards,
  X,
} from "lucide-react";

import type { ProjectPayment, Role } from "@/lib/types";
import { NotificationBell } from "../NotificationBell";
import { paymentsHref, roleEyebrow, settingsHref } from "./workspace-shell-utils";
import { WorkspaceUserAvatar } from "./WorkspaceUserAvatar";

export type WorkspaceTopbarPaymentAlert = {
  id: string;
  projectTitle: string;
  businessName: string;
  type: ProjectPayment["type"];
  status: ProjectPayment["status"];
  amount: number;
  href: string;
};

export type WorkspaceSearchItem = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  keywords: string[];
};

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatNaira(value: number) {
  return currencyFormatter.format(value);
}

function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit" : "Balance";
}

function paymentStatusLabel(status: ProjectPayment["status"]) {
  if (status === "UNPAID") return "Unpaid";
  if (status === "PENDING_CONFIRMATION") return "Awaiting confirmation";
  if (status === "CONFIRMED") return "Confirmed";
  return "Rejected";
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSafeInternalHref(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || /[\u0000-\u001F\u007F]/.test(value)) return false;
  return true;
}

export function WorkspaceTopbar({
  role,
  userName,
  pendingTotal,
  paymentsCount,
  paymentAlerts,
  searchItems,
  onLogout,
}: {
  role: Role;
  userName: string;
  pendingTotal: number;
  paymentsCount: number;
  paymentAlerts: WorkspaceTopbarPaymentAlert[];
  searchItems: WorkspaceSearchItem[];
  onLogout: () => void;
}) {
  const router = useRouter();

  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const paymentsWrapRef = useRef<HTMLDivElement | null>(null);
  const userMenuWrapRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const paymentSummary = useMemo(() => {
    const unpaid = paymentAlerts.filter((item) => item.status === "UNPAID");
    const pending = paymentAlerts.filter(
      (item) => item.status === "PENDING_CONFIRMATION",
    );

    return {
      unpaidCount: unpaid.length,
      pendingCount: pending.length,
      totalAmount: paymentAlerts.reduce((total, item) => total + item.amount, 0),
    };
  }, [paymentAlerts]);

  const visibleSearchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    if (normalizedQuery.length < 2) return [];

    const safeItems = searchItems.filter((item) => isSafeInternalHref(item.href));

    return safeItems
      .map((item) => {
        const haystack = normalizeSearchText(
          [
            item.title,
            item.eyebrow,
            item.description,
            ...item.keywords,
          ].join(" "),
        );

        const startsWithScore = normalizeSearchText(item.title).startsWith(normalizedQuery)
          ? 2
          : 0;
        const includesScore = haystack.includes(normalizedQuery) ? 1 : 0;

        return { item, score: startsWithScore + includesScore };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [searchItems, searchQuery]);

  const showSearchResults = searchOpen && searchQuery.trim().length >= 2;
  const showMobileSearchResults = mobileSearchOpen && searchQuery.trim().length >= 2;

  function closeSearch() {
    setSearchOpen(false);
    setMobileSearchOpen(false);
  }

  function openSearchHref(href: string) {
    if (!isSafeInternalHref(href)) return;

    closeSearch();
    setPaymentsOpen(false);
    setUserMenuOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  function submitSearch() {
    const firstResult = visibleSearchResults[0];

    if (firstResult) {
      openSearchHref(firstResult.href);
    }
  }

  function renderSearchResults(mode: "desktop" | "mobile") {
    const isMobile = mode === "mobile";
    const hasQuery = searchQuery.trim().length >= 2;

    return (
      <section
        aria-label="Workspace search results"
        className={[
          isMobile
            ? "fixed left-3 right-3 top-[88px] z-90 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:hidden"
            : "absolute left-0 top-[calc(100%+12px)] z-90 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]",
        ].join(" ")}
      >
        {isMobile ? (
          <div className="flex items-center gap-3 border-b border-slate-100 p-4">
            <Search size={18} className="text-[#334a7d]" />
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch();
                if (event.key === "Escape") closeSearch();
              }}
              placeholder="Search workspace..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Search results
          </span>
        </div>

        {hasQuery && visibleSearchResults.length ? (
          <div className="max-h-[min(420px,calc(100vh-230px))] overflow-auto">
            {visibleSearchResults.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  closeSearch();
                  setSearchQuery("");
                }}
                className="flex min-w-0 items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50/55"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-[#0064E0]">
                  <Search size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                    {item.eyebrow} • {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center px-6 py-8 text-center">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-[#334a7d] ring-1 ring-slate-200">
                <Search size={20} />
              </span>
              <strong className="mt-4 block text-sm font-medium text-slate-900">
                {hasQuery ? "No matching result" : "Type at least 2 characters"}
              </strong>
              <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
                Search projects, phases, payments, requests, clients and workspace pages.
              </span>
            </div>
          </div>
        )}
      </section>
    );
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;

      if (paymentsWrapRef.current && !paymentsWrapRef.current.contains(target)) {
        setPaymentsOpen(false);
      }

      if (userMenuWrapRef.current && !userMenuWrapRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            ref={searchWrapRef}
            className="relative hidden h-12 w-full max-w-[360px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:flex"
          >
            <Search size={19} className="text-[#334a7d]" />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
                setPaymentsOpen(false);
                setUserMenuOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch();
                if (event.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Search workspace..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-[#526899]"
            />
            <kbd className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 md:inline-flex">
              ↵
            </kbd>

            {showSearchResults ? renderSearchResults("desktop") : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(true);
              setSearchOpen(true);
              setPaymentsOpen(false);
              setUserMenuOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-[#334a7d] shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:hidden"
            aria-label="Search workspace"
          >
            <Search size={19} />
          </button>

          {showMobileSearchResults || mobileSearchOpen ? renderSearchResults("mobile") : null}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="relative">
            <NotificationBell />
          </div>

          <div className="relative inline-flex" ref={paymentsWrapRef}>
            <button
              type="button"
              onClick={() => {
                setPaymentsOpen((value) => !value);
                setUserMenuOpen(false);
                closeSearch();
              }}
              aria-expanded={paymentsOpen}
              aria-label={`${paymentsCount} pending payment records`}
              className={[
                "hidden min-h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-medium shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition md:inline-flex",
                paymentsCount > 0
                  ? "border-blue-200 bg-blue-50 text-[#0064E0]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-[#0064E0]",
              ].join(" ")}
            >
              <CreditCard size={18} className="text-[#0064E0]" />
              <span>Payments</span>
              {paymentsCount > 0 ? (
                <em className="grid min-w-5 place-items-center rounded-full bg-[#0064E0] px-1.5 py-0.5 text-[10px] font-bold not-italic text-white">
                  {paymentsCount > 9 ? "9+" : paymentsCount}
                </em>
              ) : null}
              <ChevronDown
                size={15}
                className={[
                  "transition",
                  paymentsOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentsOpen((value) => !value);
                setUserMenuOpen(false);
                closeSearch();
              }}
              aria-expanded={paymentsOpen}
              aria-label={`${paymentsCount} pending payment records`}
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-[#0064E0] shadow-[0_8px_24px_rgba(15,23,42,0.035)] md:hidden"
            >
              <WalletCards size={18} />
              {paymentsCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#0064E0] px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                  {paymentsCount > 9 ? "9+" : paymentsCount}
                </span>
              ) : null}
            </button>

            {paymentsOpen ? (
              <section
                aria-label="Pending payment summary"
                className="fixed left-3 right-3 top-[88px] z-90 max-h-[calc(100vh-110px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] md:absolute md:left-auto md:right-0 md:top-[calc(100%+12px)] md:w-[420px] md:max-w-[calc(100vw-2rem)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                  <div>
                    <strong className="block text-base font-medium tracking-[-0.03em] text-slate-900">
                      Pending payments
                    </strong>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {paymentsCount} record{paymentsCount === 1 ? "" : "s"} need attention
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentsOpen(false)}
                    aria-label="Close pending payment summary"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-[#E61525]"
                  >
                    <X size={16} strokeWidth={2.25} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Unpaid
                    </span>
                    <strong className="mt-1 block text-lg font-medium text-slate-800">
                      {paymentSummary.unpaidCount}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Pending
                    </span>
                    <strong className="mt-1 block text-lg font-medium text-slate-800">
                      {paymentSummary.pendingCount}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Value
                    </span>
                    <strong className="mt-1 block truncate text-lg font-medium text-slate-800">
                      {formatNaira(paymentSummary.totalAmount)}
                    </strong>
                  </div>
                </div>

                {paymentAlerts.length ? (
                  <div className="max-h-[min(440px,calc(100vh-280px))] overflow-auto">
                    {paymentAlerts.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setPaymentsOpen(false)}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50/55"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {item.projectTitle}
                          </span>
                          <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                            {item.businessName} • {paymentTypeLabel(item.type)} • {paymentStatusLabel(item.status)}
                          </span>
                        </span>

                        <span className="text-right">
                          <strong className="block text-sm font-medium text-slate-800">
                            {formatNaira(item.amount)}
                          </strong>
                          <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-medium text-[#0064E0]">
                            Open
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-44 place-items-center px-6 py-8 text-center">
                    <div>
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#29BE3E] ring-1 ring-emerald-100">
                        <CreditCard size={22} />
                      </span>
                      <strong className="mt-4 block text-base font-medium tracking-[-0.03em] text-slate-900">
                        No pending payments
                      </strong>
                      <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                        Unpaid and awaiting-confirmation records will appear here.
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <Link
                    href={paymentsHref(role)}
                    onClick={() => setPaymentsOpen(false)}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl bg-[#0064E0] px-4 text-sm font-medium text-white transition hover:bg-[#0052B8]"
                  >
                    View all payments
                  </Link>
                </div>
              </section>
            ) : null}
          </div>

          <div className="relative flex min-w-0 items-center pl-1" ref={userMenuWrapRef}>
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((value) => !value);
                setPaymentsOpen(false);
                closeSearch();
              }}
              aria-expanded={userMenuOpen}
              aria-label="Open account menu"
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-transparent p-1.5 pr-2 transition hover:border-slate-200 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
            >
              <WorkspaceUserAvatar
                name={userName}
                className="!bg-slate-100 !text-slate-900 !ring-slate-200"
              />
              <span className="hidden min-w-0 text-left lg:block">
                <strong className="block max-w-[150px] truncate text-sm font-medium text-slate-900">
                  {userName}
                </strong>
                <span className="mt-0.5 block text-xs font-medium text-[#334a7d]">
                  {roleEyebrow(role)}
                </span>
              </span>
              <ChevronDown
                size={15}
                className={[
                  "hidden text-slate-500 transition lg:block",
                  userMenuOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>

            {userMenuOpen ? (
              <section
                aria-label="Account menu"
                className="absolute right-0 top-[calc(100%+12px)] z-90 w-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
              >
                <div className="border-b border-slate-100 p-4">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {userName}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {roleEyebrow(role)}
                  </span>
                </div>

                <div className="p-2">
                  <Link
                    href={settingsHref(role)}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-[#0064E0]"
                  >
                    <Settings2 size={17} />
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void onLogout();
                    }}
                    className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}