"use client";

import { useState } from "react";
import { assistantReply } from "@/lib/ai";
import { Button, Icons, Input } from "./UI";

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ from: "ai" | "me"; text: string }>>([
    { from: "ai", text: "I can help structure briefs, recommend packages, summarize projects, explain payments and guide approvals." }
  ]);

  function send() {
    if (!input.trim()) return;
    const prompt = input.trim();
    setMessages((prev) => [...prev, { from: "me", text: prompt }, { from: "ai", text: assistantReply(prompt) }]);
    setInput("");
  }

  return (
    <>
      {open && (
        <div className="ai-panel">
          <div className="ai-header">
            <strong>{Icons.ai} Octalve AI</strong>
            <button className="icon-btn" onClick={() => setOpen(false)} style={{ color: "#fff" }}>×</button>
          </div>
          <div className="ai-body">
            {messages.map((message, index) => <div key={index} className="ai-message" style={message.from === "me" ? { background: "#f3ebff", color: "#5b21b6" } : undefined}>{message.text}</div>)}
          </div>
          <div className="ai-input">
            <Input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="Ask about this project..." />
            <Button onClick={send}>{Icons.arrow}</Button>
          </div>
        </div>
      )}
      <div className="ai-fab">
        <Button onClick={() => setOpen((value) => !value)}>{Icons.ai} AI Assistant</Button>
      </div>
    </>
  );
}
