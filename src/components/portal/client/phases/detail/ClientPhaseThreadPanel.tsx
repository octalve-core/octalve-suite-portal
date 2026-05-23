"use client";

import { useMemo, useState } from "react";
import {
  CheckCheck,
  MessageCircle,
  MoreVertical,
  Paperclip,
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
          : "bg-white text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      {isMine ? <UserRound size={16} /> : userInitial(name)}
    </span>
  );
}

function SystemBubble({ message }: { message: PhaseMessage }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[88%] rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-center shadow-sm backdrop-blur">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
          <ShieldCheck size={12} />
          System Update
        </div>

        <p className="text-sm font-medium leading-6 text-slate-700">
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
  const role = getSenderRole(message);
  const name = getSenderName(message);
  const isSystem = message.type === "SYSTEM" || role === "SYSTEM";
  const isMine = Boolean(currentUserId && message.senderId === currentUserId);

  if (isSystem) {
    return <SystemBubble message={message} />;
  }

  return (
    <div
      className={cn(
        "flex w-full gap-2 sm:gap-3",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {!isMine ? <ThreadAvatar name={name} isMine={false} /> : null}

      <div
        className={cn(
          "relative max-w-[86%] px-4 py-3 shadow-sm sm:max-w-[76%]",
          isMine
            ? "rounded-[22px] rounded-tr-md bg-[#0064E0] text-white"
            : "rounded-[22px] rounded-tl-md border border-slate-200 bg-white text-slate-900",
        )}
      >
        <div
          className={cn(
            "absolute top-3 h-3 w-3 rotate-45",
            isMine
              ? "-right-1 bg-[#0064E0]"
              : "-left-1 border-b border-l border-slate-200 bg-white",
          )}
        />

        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <strong
            className={cn(
              "text-xs font-black uppercase tracking-[0.08em]",
              isMine ? "text-white/90" : "text-slate-800",
            )}
          >
            {isMine ? "You" : name}
          </strong>

          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.09em]",
              isMine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>

        <p
          className={cn(
            "whitespace-pre-wrap text-sm font-medium leading-6",
            isMine ? "text-white" : "text-slate-700",
          )}
        >
          {message.message}
        </p>

        <div
          className={cn(
            "mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold",
            isMine ? "text-white/70" : "text-slate-400",
          )}
        >
          <span>{formatPhaseDateTime(message.createdAt)}</span>
          {isMine ? <CheckCheck size={13} /> : null}
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

    if (!text) return;

    setMessage("");
    await onSendMessage(text);
  }

  async function submitChanges() {
    const text = changeMessage.trim();

    if (!text) return;

    setChangeMessage("");
    await onRequestChanges(text);
  }

  return (
    <aside className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0064E0] text-white shadow-[0_12px_26px_rgba(0,100,224,0.25)]">
              <MessageCircle size={21} />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-[-0.04em] text-slate-950">
                Phase Thread
              </h2>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                Octalve delivery conversation
              </p>
            </div>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Thread options"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="bg-[#EEF4F8] p-3 sm:p-4">
        <div className="max-h-[560px] min-h-[420px] overflow-y-auto rounded-[22px] border border-white/70 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] bg-[length:18px_18px] p-3 sm:p-4">
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
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#0064E0] shadow-sm ring-1 ring-blue-100">
                  <MessageCircle size={24} />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-slate-950">
                  No messages yet
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Messages about this phase will appear here once conversation starts.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-slate-300"
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>

            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
              disabled={sending}
              placeholder="Type a message..."
              className="h-12 min-w-0 flex-1 rounded-2xl border border-transparent bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => void submitMessage()}
              disabled={!message.trim() || sending}
              className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {canRequestChanges ? (
          <div className="mt-4 rounded-[22px] border border-orange-200 bg-orange-50 p-4">
            <label className="block text-sm font-bold text-slate-900">
              Request changes
            </label>

            <p className="mt-1 text-xs font-semibold leading-5 text-orange-700">
              Use this only when you want Octalve to adjust this phase before approval.
            </p>

            <textarea
              value={changeMessage}
              onChange={(event) => setChangeMessage(event.target.value)}
              disabled={requestingChanges}
              placeholder="Tell the delivery team what should be adjusted before approval..."
              className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => void submitChanges()}
                disabled={!changeMessage.trim() || requestingChanges}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestingChanges ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}