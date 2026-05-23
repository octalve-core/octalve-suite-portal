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
          ? "bg-[#0064E0] text-white shadow-[0_14px_34px_rgba(0,100,224,0.28)]"
          : "text-white/76 hover:bg-white/8 hover:text-white",
        compact ? "justify-center px-3" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-6 w-6 shrink-0 place-items-center",
          active ? "text-white" : "text-white/78 group-hover:text-white",
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
