import Link from "next/link";
import type { WorkspaceNavItem } from "./workspace-shell-types";

export function WorkspaceNavItemRow({
  item,
  active,
  compact = false,
  onClick,
  tone = "dark",
}: {
  item: WorkspaceNavItem;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
  tone?: "dark" | "light";
}) {
  const shellClass =
    tone === "light"
      ? active
        ? "border-[#0064E0] bg-[#0064E0] text-white shadow-[0_12px_26px_rgba(0,100,224,0.18)]"
        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
      : active
        ? "border-transparent bg-[#001F4F] text-white shadow-[0_12px_26px_rgba(0,31,79,0.26)]"
        : "border-transparent text-white/72 hover:bg-[#001F4F] hover:text-white";

  const iconClass =
    tone === "light"
      ? active
        ? "text-white"
        : "text-[#0064E0] group-hover:text-[#0064E0]"
      : active
        ? "text-white"
        : "text-white/72 group-hover:text-white";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "octalve-mobile-more-item group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
        shellClass,
        compact ? "justify-center px-3" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition",
          iconClass,
        ].join(" ")}
      >
        {item.icon}
      </span>

      {!compact ? (
        <span className="min-w-0 flex-1 truncate">
          {item.shortLabel ?? item.label}
        </span>
      ) : null}

      {!!item.badge ? (
        <span
          className={[
            "grid min-w-6 place-items-center rounded-full px-2 py-1 text-[11px] font-bold",
            active ? "bg-white text-[#0064E0]" : "bg-[#0064E0] text-white",
          ].join(" ")}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}