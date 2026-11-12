"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, User, Terminal, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    model: string;
    isMock: boolean;
    latency: string;
  };
}

export const AIAssistantPanel: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [input, setInput] = useState<string>("");

  const samplePrompts = [
    "How to optimize my resume for Google Cloud?",
    "Evaluate my STAR answer for System Design",
    "Compare my skills against Senior Backend benchmark",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "user",
      content: "How does my profile compare against the Google Cloud Software Engineer opening?",
      timestamp: "10:14 AM",
    },
    {
      id: "msg-2",
      sender: "assistant",
      content:
        "Your profile demonstrates **91.4% semantic match** with the Google Cloud mandate. Your verified strengths in **Python, FastAPI, and MySQL** align with their core service requirements. \n\n**Key Insight:** Adding a Docker containerized deployment to your Distributed Task Queue project will bridge the remaining gap and elevate your predicted shortlist probability to 96%.",
      timestamp: "10:14 AM",
      metadata: {
        model: "Gemini 1.5 Flash (Deterministic Mock Ready)",
        isMock: false,
        latency: "280ms",
      },
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    let replyText = "";
    if (q.includes("resume") || q.includes("ATS")) {
      replyText = "Your resume currently achieves **92/100 on the ATS Rubric**. To reach 98, convert your 2 qualitative experience points into quantified STAR bullet points (e.g. *'Optimized database queries, reducing average latency from 450ms to 85ms'*).";
    } else if (q.includes("STAR") || q.includes("System Design")) {
      replyText = "In a STAR response for System Design, structure your narrative: 1) **Situation:** High write traffic bottleneck, 2) **Task:** Design resilient cache layer, 3) **Action:** Introduced Redis cache-aside with connection pooling, 4) **Result:** Cut p99 latency by 65%.";
    } else {
      replyText = "Based on our 32-entity taxonomy, your highest-leverage career milestone is containerization and distributed tracing. Your current 8.75 CGPA satisfies 100% of campus Tier-1 gating criteria.";
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: "assistant",
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      metadata: {
        model: "BridgeAI Hybrid Engine",
        isMock: true,
        latency: "190ms",
      },
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div className={`premium-card p-6 rounded-2xl flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest text-lime flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-primary">BridgeAI Copilot</h3>
              <span className="text-[10px] font-mono text-forest bg-lime/20 px-2 py-0.5 rounded border border-lime/30 font-semibold">
                Context-Aware
              </span>
            </div>
            <span className="text-xs text-primary-muted font-mono">
              Grounding: Candidate Profile • MySQL 8 Schema
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-primary-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Zero Token Leakage
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-forest text-white rounded-br-none shadow-sm"
                  : "bg-stone-100/90 text-primary border border-border-subtle rounded-bl-none shadow-subtle"
              }`}
            >
              <p className="whitespace-pre-line font-sans">{m.content}</p>

              {m.metadata && (
                <div className="mt-2 pt-2 border-t border-border-subtle/40 flex items-center justify-between text-[10px] font-mono text-primary-muted">
                  <span>{m.metadata.model}</span>
                  <span>{m.metadata.latency}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-primary-muted mt-1 px-1">
              {m.timestamp}
            </span>
          </div>
        ))}
      </div>

      {/* Suggested Quick Queries */}
      <div className="pt-2 mb-3 flex flex-wrap gap-1.5">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[11px] font-mono text-primary-muted bg-stone-200/60 hover:bg-stone-200 hover:text-primary px-2.5 py-1 rounded-md border border-border-subtle transition-all text-left truncate max-w-full"
          >
            + {p}
          </button>
        ))}
      </div>

      {/* Interactive Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-3 border-t border-border-subtle flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask BridgeAI about ATS feedback, interview STAR prep, or skill gaps..."
          className="flex-1 bg-white border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-sans text-primary placeholder:text-primary-muted focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-xl bg-forest text-lime flex items-center justify-center hover:bg-forest-dark transition-all flex-shrink-0 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

