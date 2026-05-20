"use client";

import { MessageSquareText, ShieldCheck, UserRound } from "lucide-react";

import type { PhaseMessage, Role } from "@/lib/types";

type ThreadMessage = PhaseMessage & {
  author?: {
    id?: string;
    name?: string;
    role?: Role;
  } | null;
};

const ROLE_LABELS: Record<Role | "SYSTEM", string> = {
  CLIENT: "Client",
  STAFF: "Staff",
  PROJECT_MANAGER: "Project Manager",
  SUPER_ADMIN: "Admin",
  SYSTEM: "System",
};

function getInitial(name?: string) {
  return (name || "O").trim().slice(0, 1).toUpperCase();
}

function formatTime(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSenderName(message: ThreadMessage) {
  return (
    message.author?.name ||
    message.senderName ||
    (message.senderRole === "SYSTEM" ? "Octalve System" : "Workspace User")
  );
}

function getSenderRole(message: ThreadMessage) {
  return (message.senderRole || message.author?.role || "SYSTEM") as Role | "SYSTEM";
}

export function PhaseMessageThread({
  messages,
  currentUserId,
}: {
  messages: ThreadMessage[];
  currentUserId?: string;
}) {
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (!sortedMessages.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0064E0] shadow-sm">
          <MessageSquareText size={22} />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-slate-950">
          No messages yet
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Client, staff and admin updates for this phase will appear here with sender details.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-130 space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      {sortedMessages.map((message) => {
        const role = getSenderRole(message);
        const name = getSenderName(message);
        const isSystem = message.type === "SYSTEM" || role === "SYSTEM";
        const isMine = Boolean(currentUserId && message.senderId === currentUserId);

        if (isSystem) {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.11em] text-slate-600">
                  <ShieldCheck size={12} />
                  System Update
                </div>
                <p className="text-sm font-medium leading-6 text-slate-700">
                  {message.message}
                </p>
                <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                  {formatTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={[
              "flex w-full gap-2 sm:gap-3",
              isMine ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            {!isMine ? (
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white text-xs font-black text-slate-700 ring-1 ring-slate-200">
                {getInitial(name)}
              </span>
            ) : null}

            <div
              className={[
                "max-w-[86%] rounded-[22px] px-4 py-3 shadow-sm sm:max-w-[74%]",
                isMine
                  ? "rounded-tr-md bg-[#0064E0] text-white"
                  : "rounded-tl-md border border-slate-200 bg-white text-slate-900",
              ].join(" ")}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <strong
                  className={[
                    "text-xs font-black uppercase tracking-[0.08em]",
                    isMine ? "text-white/85" : "text-slate-800",
                  ].join(" ")}
                >
                  {isMine ? "You" : name}
                </strong>

                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.09em]",
                    isMine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {ROLE_LABELS[role]}
                </span>
              </div>

              <p
                className={[
                  "whitespace-pre-wrap text-sm font-medium leading-6",
                  isMine ? "text-white" : "text-slate-700",
                ].join(" ")}
              >
                {message.message}
              </p>

              <span
                className={[
                  "mt-2 block text-[11px] font-semibold",
                  isMine ? "text-white/65" : "text-slate-400",
                ].join(" ")}
              >
                {formatTime(message.createdAt)}
              </span>
            </div>

            {isMine ? (
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <UserRound size={16} />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}