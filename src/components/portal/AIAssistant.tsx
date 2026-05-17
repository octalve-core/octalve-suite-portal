"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  Maximize2,
  MessageSquareText,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { assistantReply } from "@/lib/ai";
import { useApp } from "./AppContext";
import { Button, Input } from "./UI";

type ChatMessage = {
  from: "ai" | "me";
  text: string;
};

const suggestions = [
  "Summarize this workspace",
  "Explain approvals",
  "How do payments work?",
  "What is the next action?",
];

export function AIAssistant() {
  const { currentUser, selectedProject, state } = useApp();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");

  const intro = useMemo(() => {
    const projectText = selectedProject
      ? `You are viewing ${selectedProject.title}.`
      : "No active project is selected yet.";

    return `Hi ${currentUser?.name?.split(" ")[0] ?? "there"}, I can help with project briefs, phase approvals, payments, deliverables, and next actions. ${projectText}`;
  }, [currentUser?.name, selectedProject]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "ai",
      text: intro,
    },
  ]);

  function getContextualReply(prompt: string) {
    const lower = prompt.toLowerCase();

    if (lower.includes("summarize") || lower.includes("summary")) {
      if (!selectedProject) {
        return `There are ${state.projects.length} project(s) in this workspace. Select a project to get a more specific summary.`;
      }

      const approved = selectedProject.phases.filter(
        (phase) => phase.status === "APPROVED",
      ).length;

      return `${selectedProject.title} has ${approved}/${selectedProject.phases.length} phases approved. Current status: ${selectedProject.status}. Total deliverables: ${selectedProject.phases.flatMap((phase) => phase.deliverables).length}.`;
    }

    if (lower.includes("next")) {
      if (!selectedProject) return "Select a project first, then I can identify the next action.";

      const pendingApproval = selectedProject.phases.find(
        (phase) => phase.status === "AWAITING_APPROVAL",
      );

      if (pendingApproval) {
        return `Next action: review and approve or request changes for ${pendingApproval.title}.`;
      }

      const payment = selectedProject.payments.find(
        (item) => item.status === "UNPAID" || item.status === "PENDING_CONFIRMATION",
      );

      if (payment) {
        return `Next action: ${payment.type.toLowerCase()} payment is ${payment.status.toLowerCase().replaceAll("_", " ")}.`;
      }

      return "No urgent action is pending right now.";
    }

    return assistantReply(prompt);
  }

  function send(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt) return;

    setMessages((previous) => [
      ...previous,
      { from: "me", text: prompt },
      { from: "ai", text: getContextualReply(prompt) },
    ]);

    setInput("");
  }

  return (
    <>
      {open && (
        <div
          className="ai-panel"
          style={{
            width: expanded ? "min(760px, calc(100vw - 32px))" : undefined,
            bottom: expanded ? 24 : undefined,
          }}
        >
          <div className="ai-header">
            <div className="deliverable-main">
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.14)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Bot size={20} />
              </span>
              <div>
                <strong style={{ display: "block" }}>Octalve AI</strong>
                <span style={{ fontSize: 12, opacity: 0.72 }}>
                  Workspace assistant
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="icon-btn"
                onClick={() => setExpanded((value) => !value)}
                style={{ color: "#fff" }}
                type="button"
                aria-label="Resize assistant"
              >
                {expanded ? <ChevronDown size={18} /> : <Maximize2 size={18} />}
              </button>

              <button
                className="icon-btn"
                onClick={() => setOpen(false)}
                style={{ color: "#fff" }}
                type="button"
                aria-label="Close assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="ai-body"
            style={{
              maxHeight: expanded ? "62vh" : undefined,
              background:
                "linear-gradient(180deg, rgba(246,250,255,0.9), #ffffff)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  className="badge badge-blue"
                  style={{ cursor: "pointer" }}
                >
                  <Sparkles size={13} /> {item}
                </button>
              ))}
            </div>

            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={`ai-message ${message.from === "me" ? "mine" : ""}`}
                style={
                  message.from === "me"
                    ? {
                        marginLeft: "auto",
                        background: "var(--primary)",
                        color: "#fff",
                        maxWidth: "86%",
                      }
                    : {
                        maxWidth: "90%",
                      }
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="ai-input">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
              placeholder="Ask about projects, payments, approvals..."
            />
            <Button onClick={() => send()} disabled={!input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}

      <div className="ai-fab">
        <Button onClick={() => setOpen((value) => !value)}>
          <MessageSquareText size={17} /> AI Assistant
        </Button>
      </div>
    </>
  );
}
