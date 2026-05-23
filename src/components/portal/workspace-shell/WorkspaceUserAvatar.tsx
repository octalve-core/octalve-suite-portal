import { getInitial } from "./workspace-shell-utils";

export function WorkspaceUserAvatar({
  name,
  className = "",
}: {
  name?: string;
  className?: string;
}) {
  return (
    <span
      className={[
        "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      {getInitial(name)}
    </span>
  );
}
