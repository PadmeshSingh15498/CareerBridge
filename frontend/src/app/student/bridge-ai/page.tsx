"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Check,
  Copy,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  ArrowRight
} from "lucide-react";

import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { apiService } from "@/lib/api";
import {
  BridgeAIConversationSummary,
  BridgeAIConversationDetail,
  BridgeAIMessage
} from "@/types/bridge-ai";

export default function StudentBridgeAIPage() {
  const [conversations, setConversations] = useState<BridgeAIConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<BridgeAIConversationDetail | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [loadingConv, setLoadingConv] = useState<boolean>(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations list and suggested prompts
  useEffect(() => {
    async function init() {
      try {
        const [convsRes, promptsRes] = await Promise.all([
          apiService.getBridgeAIConversations(),
          apiService.getBridgeAIPrompts()
        ]);

        if (promptsRes.data) {
          setSuggestedPrompts(promptsRes.data);
        }

        if (convsRes.data && convsRes.data.length > 0) {
          setConversations(convsRes.data);
          setActiveConvId(convsRes.data[0].id);
        } else {
          // Auto create initial conversation
          const newRes = await apiService.createBridgeAIConversation({
            title: "Campus Career Strategy",
            context_type: "general"
          });
          if (newRes.data) {
            setConversations([
              {
                id: newRes.data.id,
                title: newRes.data.title,
                context_type: newRes.data.context_type,
                message_count: newRes.data.messages.length,
                created_at: newRes.data.created_at,
                last_message_at: newRes.data.created_at
              }
            ]);
            setActiveConvId(newRes.data.id);
            setActiveConv(newRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to initialize BridgeAI:", err);
      } finally {
        setLoadingConv(false);
      }
    }
    init();
  }, []);

  // Fetch active conversation detail when activeConvId changes
  useEffect(() => {
    if (!activeConvId) return;

    async function fetchConv() {
      try {
        const res = await apiService.getBridgeAIConversation(activeConvId!);
        if (res.data) {
          setActiveConv(res.data);
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    }
    fetchConv();
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, sending]);

  const handleCreateNewConversation = async () => {
    try {
      const res = await apiService.createBridgeAIConversation({
        title: "New Career Discussion",
        context_type: "general"
      });
      if (res.data) {
        setConversations((prev) => [
          {
            id: res.data.id,
            title: res.data.title,
            context_type: res.data.context_type,
            message_count: res.data.messages.length,
            created_at: res.data.created_at,
            last_message_at: res.data.created_at
          },
          ...prev
        ]);
        setActiveConvId(res.data.id);
        setActiveConv(res.data);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteBridgeAIConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);

      if (activeConvId === convId) {
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id);
        } else {
          setActiveConvId(null);
          setActiveConv(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputPrompt).trim();
    if (!text || !activeConvId || sending) return;

    // Optimistic user message append
    const tempUserMsg: BridgeAIMessage = {
      id: `temp-${Date.now()}`,
      sender_role: "user",
      content: text,
      created_at: new Date().toISOString()
    };

    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null
    );
    setInputPrompt("");
    setSending(true);

    try {
      const res = await apiService.sendBridgeAIMessage(activeConvId, text);
      if (res.data) {
        const assistantMsg = res.data.assistant_message;

        setActiveConv((prev) => {
          if (!prev) return null;
          // Filter out temp user msg and append real returned messages
          const cleanMsgs = prev.messages.filter((m) => m.id !== tempUserMsg.id);
          return {
            ...prev,
            messages: [...cleanMsgs, res.data.user_message, assistantMsg]
          };
        });

        // Update title in sidebar if updated
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  message_count: c.message_count + 2,
                  last_message_at: new Date().toISOString()
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Helper to render markdown text with formatted code blocks and lists
  const renderMessageContent = (content: string, msgId: string | number) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const language = lines[0].includes("python")
          ? "python"
          : lines[0].includes("json")
          ? "json"
          : lines[0].includes("sql")
          ? "sql"
          : lines[0].includes("javascript") || lines[0].includes("typescript")
          ? "typescript"
          : "code";
        const codeText = lines.slice(1).join("\n") || lines[0];
        const snippetId = `${msgId}-${pIdx}`;

        return (
          <div key={pIdx} className="my-3 rounded-xl overflow-hidden border border-cb-border bg-stone-900 text-stone-100 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-stone-800 text-[11px] text-stone-400">
              <span className="uppercase">{language}</span>
              <button
                onClick={() => handleCopyCode(codeText, snippetId)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copiedCodeId === snippetId ? (
                  <>
                    <Check className="w-3 h-3 text-cb-lime" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // Format basic markdown headers, bold, bullets
      const lines = part.split("\n");
      return (
        <div key={pIdx} className="space-y-1.5 leading-relaxed text-xs text-cb-primary">
          {lines.map((line, lIdx) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-heading font-bold text-sm text-cb-forest mt-3 mb-1">
                  {line.replace("### ", "")}
                </h4>
              );
            }
            if (line.startsWith("#### ")) {
              return (
                <h5 key={lIdx} className="font-heading font-semibold text-xs text-cb-primary uppercase tracking-wider mt-2.5 mb-1">
                  {line.replace("#### ", "")}
                </h5>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cb-forest mt-1.5 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
                </div>
              );
            }
            if (/^\d+\.\s/.test(line)) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1">
                  <span className="font-mono text-cb-forest font-semibold shrink-0">
                    {line.match(/^\d+\./)?.[0]}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace(/^\d+\.\s/, "")) }} />
                </div>
              );
            }
            if (!line.trim()) {
              return <div key={lIdx} className="h-1" />;
            }
            return (
              <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
            );
          })}
        </div>
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-cb-forest">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-cb-secondary">$1</em>')
      .replace(/\[Source: (.*?)\]/g, '<span class="inline-flex items-center gap-0.5 bg-cb-forest/10 text-cb-forest px-1.5 py-0.2 rounded text-[10px] font-mono border border-cb-forest/20 font-semibold">[Ref: $1]</span>');
  };

  return (
    <WorkspaceShell role="student" activeTabTitle="BridgeAI">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[75vh]">
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONVERSATION HISTORY & TOPICS (4 cols)      */}
        {/* ======================================================== */}
        <section className="lg:col-span-4 flex flex-col space-y-4">
          {/* New Chat Button */}
          <button
            onClick={handleCreateNewConversation}
            className="w-full py-2.5 px-4 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-cb-lime" />
            <span>New Mentorship Session</span>
          </button>

          {/* Conversations List Box */}
          <div className="premium-card p-4 rounded-2xl flex-1 flex flex-col justify-between border border-cb-border bg-white overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-cb-border">
                <span className="text-[11px] font-mono text-cb-secondary uppercase tracking-wider">
                  Past Discussions
                </span>
                <span className="text-[11px] font-mono text-cb-forest bg-cb-forest/10 px-2 py-0.5 rounded-full font-semibold">
                  {conversations.length} Active
                </span>
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {conversations.map((c) => {
                  const isActive = c.id === activeConvId;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className={`group p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                        isActive
                          ? "bg-cb-forest/10 border-cb-forest/30 text-cb-primary shadow-2xs font-semibold"
                          : "bg-stone-50/70 border-transparent hover:border-cb-border text-cb-secondary hover:text-cb-primary hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cb-forest" : "text-stone-400"}`} />
                        <span className="truncate text-xs">{c.title}</span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-all text-stone-400"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grounding Status Footer */}
            <div className="pt-3 border-t border-cb-border mt-4 text-[11px] font-mono text-cb-secondary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cb-forest shrink-0" />
              <span>Grounded strictly in your student profile records.</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: ACTIVE CHAT WORKSPACE (8 cols)             */}
        {/* ======================================================== */}
        <section className="lg:col-span-8 premium-card rounded-2xl flex flex-col justify-between border border-cb-border bg-white shadow-xs overflow-hidden h-[78vh]">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-cb-border bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cb-forest text-cb-lime flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-sm font-bold text-cb-primary">
                    BridgeAI Career Copilot
                  </h3>
                  <span className="text-[10px] font-mono text-cb-forest bg-cb-lime/20 px-2 py-0.5 rounded-full border border-cb-lime/30 font-semibold">
                    Context-Grounded
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cb-secondary">
                  Grounded: Profile • PyMuPDF ATS • MySQL 8 Curricula
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-cb-secondary block">
                Model: BridgeAI Contextual
              </span>
              <span className="text-[10px] font-mono text-cb-forest">
                Response: ~180ms
              </span>
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeConv?.messages.map((msg, idx) => {
              const isAssistant = msg.sender_role === "assistant";

              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${isAssistant ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAssistant
                        ? "bg-cb-forest text-cb-lime shadow-xs"
                        : "bg-stone-300 text-stone-700"
                    }`}
                  >
                    {isAssistant ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-2 border ${
                      isAssistant
                        ? "bg-stone-50/80 border-cb-border"
                        : "bg-cb-forest text-white border-cb-forest"
                    }`}
                  >
                    {/* Render content */}
                    {isAssistant ? (
                      renderMessageContent(msg.content, msg.id)
                    ) : (
                      <p className="text-xs leading-relaxed font-medium">{msg.content}</p>
                    )}

                    {/* Sources reference pills */}
                    {isAssistant && msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                      <div className="pt-2 border-t border-cb-border/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-mono text-cb-secondary uppercase">
                          Citations:
                        </span>
                        {msg.metadata.sources.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white text-cb-forest border border-cb-border font-medium"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-cb-forest" />
                            <span>{s.title}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Follow-up question chips */}
                    {isAssistant && msg.metadata?.follow_ups && msg.metadata.follow_ups.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {msg.metadata.follow_ups.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSendMessage(q)}
                            className="text-[11px] bg-white hover:bg-stone-100 text-cb-primary px-2.5 py-1 rounded-lg border border-cb-border font-medium transition-colors text-left flex items-center gap-1 shadow-2xs"
                          >
                            <span>{q}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-cb-forest" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Streaming / Typing Indicator */}
            {sending && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-cb-forest text-cb-lime flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-stone-50 border border-cb-border rounded-2xl p-3.5 flex items-center gap-2 text-xs font-mono text-cb-secondary">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cb-forest" />
                  <span>BridgeAI is reasoning with your profile context...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Chips Strip */}
          {activeConv?.messages.length === 1 && (
            <div className="px-5 py-2 bg-stone-50/70 border-t border-cb-border flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono text-cb-secondary uppercase tracking-wider block w-full mb-0.5">
                Suggested Prompts:
              </span>
              {suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs bg-white hover:bg-stone-100 text-cb-primary px-3 py-1 rounded-lg border border-cb-border transition-colors text-left font-medium flex items-center gap-1 shadow-2xs"
                >
                  <span>{prompt}</span>
                  <ChevronRight className="w-3 h-3 text-cb-forest" />
                </button>
              ))}
            </div>
          )}

          {/* Prompt Input Box */}
          <div className="p-4 border-t border-cb-border bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask BridgeAI about career roadmaps, resume improvements, or interview drills..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={sending}
                className="flex-1 bg-stone-50 border border-cb-border rounded-xl px-4 py-2.5 text-xs text-cb-primary placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-cb-forest"
              />
              <button
                type="submit"
                disabled={sending || !inputPrompt.trim()}
                className="px-4 py-2.5 bg-cb-forest hover:bg-cb-dark text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 text-cb-lime" />
              </button>
            </form>
            <p className="text-[10px] font-mono text-stone-400 mt-2 text-center">
              BridgeAI provides placement guidance grounded in your verified profile. Campus selection decisions rest with employers.
            </p>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
