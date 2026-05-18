"use client";

import { CheckCheck, UserRound } from "lucide-react";
import { Badge } from "./UI";

type PhaseMessageThreadProps = {
  messages: Array<{
    id: string;
    message: string;
    senderId?: string | null;
    createdAt: string;
    author?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
  }>;
  currentUserId?: string | null;
};

function roleLabel(role?: string | null) {
  if (role === "SUPER_ADMIN") return "Admin";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";
  if (role === "CLIENT") return "Client";
  return "Workspace";
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Now";
  }
}

export function PhaseMessageThread({
  messages,
  currentUserId,
}: PhaseMessageThreadProps) {
  if (!messages.length) {
    return (
      <div className="phase-thread-empty">
        <UserRound size={24} />
        <strong>No messages yet</strong>
        <span>Start the conversation for this phase.</span>
      </div>
    );
  }

  return (
    <div className="phase-message-thread">
      {messages.map((message) => {
        const isMine = Boolean(currentUserId && message.senderId === currentUserId);
        const authorName =
          message.author?.name ||
          message.author?.email ||
          (isMine ? "You" : "Octalve Team");

        return (
          <article
            key={message.id}
            className={isMine ? "phase-chat-bubble is-mine" : "phase-chat-bubble"}
          >
            <div className="phase-chat-meta">
              <span>{isMine ? "You" : authorName}</span>
              <Badge className={isMine ? "badge-blue" : "badge-slate"}>
                {isMine ? "You" : roleLabel(message.author?.role)}
              </Badge>
            </div>

            <p>{message.message}</p>

            <div className="phase-chat-time">
              <span>{formatTime(message.createdAt)}</span>
              {isMine && <CheckCheck size={13} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}
