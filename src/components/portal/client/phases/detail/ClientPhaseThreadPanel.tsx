"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { PhaseMessage, ProjectPhase } from "@/lib/types";
import {
  ROLE_LABELS,
  cn,
  formatPhaseDateTime,
  getSenderName,
  getSenderRole,
  userInitial,
} from "./client-phase-detail-utils";

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function cleanUrlToken(value: string) {
  return value.replace(/[),.;!?]+$/g, "");
}

function normalizeHref(value: string) {
  const cleaned = cleanUrlToken(value);

  if (cleaned.toLowerCase().startsWith("http://") || cleaned.toLowerCase().startsWith("https://")) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

function splitMessageText(text: string) {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const cleaned = cleanUrlToken(raw);
    parts.push({ type: "link", value: cleaned });

    lastIndex = index + raw.length;

    const trailing = raw.slice(cleaned.length);
    if (trailing) {
      parts.push({ type: "text", value: trailing });
    }
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: text }];
}

function MessageText({
  text,
  isMine,
}: {
  text: string;
  isMine: boolean;
}) {
  const parts = splitMessageText(text);

  return (
    <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-6 sm:text-sm">
      {parts.map((part, index) => {
        if (part.type === "link") {
          return (
            <a
              key={`${part.value}-${index}`}
              href={normalizeHref(part.value)}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex max-w-full items-center gap-1 break-all font-bold underline decoration-2 underline-offset-2",
                isMine ? "text-white" : "text-[#0064E0]",
              )}
            >
              <Link2 size={13} className="shrink-0" />
              {part.value}
            </a>
          );
        }

        return <span key={`${part.value}-${index}`}>{part.value}</span>;
      })}
    </p>
  );
}

function ThreadAvatar({
  name,
  isMine,
}: {
  name: string;
  isMine: boolean;
}) {
  return (
    <span
      className={[
        "mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ring-1",
        isMine
          ? "bg-blue-50 text-[#0064E0] ring-blue-100"
          : "bg-slate-100 text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      {isMine ? <UserRound size={16} /> : userInitial(name)}
    </span>
  );
}

function SystemBubble({ message }: { message: PhaseMessage }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-white/92 px-4 py-3 text-center shadow-sm backdrop-blur">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
          <ShieldCheck size={12} />
          System Update
        </div>

        <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">
          {message.message}
        </p>

        <span className="mt-1 block text-[11px] font-semibold text-slate-400">
          {formatPhaseDateTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function ThreadMessageBubble({
  message,
  currentUserId,
}: {
  message: PhaseMessage;
  currentUserId?: string;
}) {
  const [copied, setCopied] = useState(false);

  const role = getSenderRole(message);
  const name = getSenderName(message);
  const isSystem = message.type === "SYSTEM" || role === "SYSTEM";
  const isMine = Boolean(currentUserId && message.senderId === currentUserId);
  const roleLabel = ROLE_LABELS[role] ?? "Workspace User";

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (isSystem) {
    return <SystemBubble message={message} />;
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-2 sm:gap-3",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine ? <ThreadAvatar name={name} isMine={false} /> : null}

      <div className={cn("flex min-w-0 max-w-[88%] flex-col sm:max-w-[78%]", isMine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative min-w-0 rounded-[22px] px-4 py-3 shadow-sm ring-1",
            isMine
              ? "rounded-tr-md bg-[#D8EBFF] text-slate-950 ring-blue-100"
              : "rounded-tl-md bg-white text-slate-950 ring-slate-200",
          )}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <strong className="max-w-[180px] truncate text-sm font-semibold tracking-[-0.02em]">
              {name}
            </strong>

            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]",
                isMine
                  ? "bg-white/70 text-[#0064E0]"
                  : "bg-blue-50 text-[#0064E0]",
              )}
            >
              {roleLabel}
            </span>
          </div>

          <MessageText text={message.message} isMine={false} />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void copyMessage()}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-bold opacity-80 transition hover:opacity-100",
                isMine
                  ? "bg-white/60 text-[#0064E0] hover:bg-white"
                  : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-[#0064E0]",
              )}
              aria-label="Copy message"
              title="Copy message"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>

            <span className="text-[11px] font-bold text-slate-400">
              {formatPhaseDateTime(message.createdAt)}
            </span>

            {isMine ? (
              <CheckCheck size={14} className="text-[#0064E0]" />
            ) : null}
          </div>
        </div>
      </div>

      {isMine ? <ThreadAvatar name={name} isMine /> : null}
    </div>
  );
}

export function ClientPhaseThreadPanel({
  phase,
  currentUserId,
  onSendMessage,
  onRequestChanges,
  canRequestChanges,
  sending,
  requestingChanges,
}: {
  phase: ProjectPhase;
  currentUserId?: string;
  onSendMessage: (message: string) => Promise<void>;
  onRequestChanges: (message: string) => Promise<void>;
  canRequestChanges: boolean;
  sending: boolean;
  requestingChanges: boolean;
}) {
  const [message, setMessage] = useState("");
  const [changeMessage, setChangeMessage] = useState("");

  const sortedMessages = useMemo(() => {
    return [...phase.messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [phase.messages]);

  async function submitMessage() {
    const text = message.trim();

    if (!text || sending) return;

    setMessage("");
    await onSendMessage(text);
  }

  async function submitChanges() {
    const text = changeMessage.trim();

    if (!text || requestingChanges) return;

    setChangeMessage("");
    await onRequestChanges(text);
  }

  return (
    <aside className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <MessageCircle size={22} />
              <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-[-0.04em] text-slate-950">
                Phase Thread
              </h2>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                Project-linked conversation and delivery feedback
              </p>
            </div>
          </div>

          <Link
            href={`/client/phases/${phase.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-2xl px-3 text-sm font-bold text-[#0064E0] transition hover:bg-blue-50"
          >
            View all
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      <div className="bg-[#F6F3EE] p-3 sm:p-4">
        <div className="max-h-[610px] min-h-[460px] overflow-y-auto rounded-[24px] border border-white/80 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.045)_1px,transparent_0)] bg-[length:20px_20px] p-3 sm:p-4">
          {sortedMessages.length ? (
            <div className="grid gap-4">
              {sortedMessages.map((item) => (
                <ThreadMessageBubble
                  key={item.id}
                  message={item}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-blue-100">
                  <MessageCircle size={24} />
                </span>
                <strong className="mt-4 block text-base font-semibold text-slate-950">
                  No messages yet
                </strong>
                <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                  Messages about this phase will appear here once conversation starts.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
              disabled={sending}
              rows={1}
              placeholder="Type a message..."
              className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => void submitMessage()}
              disabled={!message.trim() || sending}
              className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,100,224,0.18)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {canRequestChanges ? (
          <div className="mt-4 rounded-[24px] border border-orange-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <label className="block text-base font-semibold tracking-[-0.03em] text-slate-950">
              Request Changes
            </label>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Provide feedback or request adjustments to this phase.
            </p>

            <textarea
              value={changeMessage}
              onChange={(event) => setChangeMessage(event.target.value)}
              disabled={requestingChanges}
              placeholder="Tell the delivery team what should be adjusted..."
              className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void submitChanges()}
                disabled={!changeMessage.trim() || requestingChanges}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestingChanges ? "Submitting..." : "Request Changes"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}