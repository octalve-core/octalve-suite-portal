import Link from "next/link";
import type { WorkspaceNavItem } from "./workspace-shell-types";

export function WorkspaceNavItemRow({
  item,
  active,
  compact = false,
  onClick,
}: {
  item: WorkspaceNavItem;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-[#001F4F] text-white shadow-[0_12px_26px_rgba(0,31,79,0.26)]"
          : "text-white/72 hover:bg-[#001F4F] hover:text-white",
        compact ? "justify-center px-3" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition",
          active
            ? "text-white"
            : "text-white/72 group-hover:text-white",
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
            active ? "bg-white text-[#001F4F]" : "bg-[#001F4F] text-white",
          ].join(" ")}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
