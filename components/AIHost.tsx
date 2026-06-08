"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Quick suggestion chips                                              */
/* ------------------------------------------------------------------ */
const SUGGESTIONS = [
  { label: "What's trending?", message: "What's trending right now on Versa TV?" },
  { label: "How do I create?", message: "How do I create my own series on Versa TV?" },
  { label: "Monetization", message: "How do creators earn money on Versa TV?" },
  { label: "About Versa TV", message: "What is Versa TV and how does it work?" },
  { label: "Set up a channel", message: "How do I set up my own channel?" },
  { label: "Filmology Labs", message: "Tell me about Filmology Labs" },
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hey! I'm your **Versa TV AI Host** — I know everything about the platform. Ask me about trending shows, how to create your own series, monetization, channels, or anything else. I'm here to help you get the most out of Versa TV.\n\nWhat would you like to know?",
};

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                   */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center flex-shrink-0">
        <div className="flex items-end gap-[2px] h-3">
          {[0, 0.15, 0.3].map((d) => (
            <div
              key={d}
              className="w-[2px] rounded-full bg-white"
              style={{
                animation: `waveform 0.6s ease-in-out ${d}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[0, 0.2, 0.4].map((d) => (
          <span
            key={d}
            className="inline-block w-[5px] h-[5px] rounded-full bg-[#6C5CE7]"
            style={{
              animation: `dot-pulse 1.4s ease-in-out ${d}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message bubble                                                     */
/* ------------------------------------------------------------------ */
function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";

  // Simple markdown-like bold rendering
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
    return parts.map((part, i) => {
      if (part === "\n") return <br key={i} />;
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className={isUser ? "text-white" : "text-[#f0eef5]"}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (isUser) {
    return (
      <div
        className="flex justify-end animate-[fade-in_0.2s_ease-out]"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-[#6C5CE7] text-white text-[13px] font-body leading-relaxed">
          {renderContent(message.content)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-2.5 animate-[fade-in_0.2s_ease-out]"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      {/* Message */}
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-[#101020] border border-[#1a1a30] text-[13px] text-[#f0eef5]/85 font-body leading-relaxed">
        {renderContent(message.content)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AIHost() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------- Send message ---------------------------------------- */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage: ChatMessage = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setShowSuggestions(false);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.filter((m) => m !== WELCOME_MESSAGE),
          }),
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.reply || "I'm not sure about that. Try asking about trending shows, the Studio, channels, or monetization!",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I had a brief connection hiccup, but I'm still here! Ask me about trending shows, how to create a series, channels, monetization, or anything about Versa TV.",
          },
        ]);
      }

      setLoading(false);
    },
    [loading, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (msg: string) => {
    sendMessage(msg);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="px-4 pt-14 pb-3">
        <div className="flex items-center gap-3">
          {/* Glowing avatar */}
          <div className="relative">
            <div
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6C5CE7] via-[#FFAB00]/60 to-[#00D2FF]/40 flex items-center justify-center"
              style={{ boxShadow: "0 0 16px 2px rgba(108, 92, 231, 0.2)" }}
            >
              <div className="w-[36px] h-[36px] rounded-full bg-[#07070e] flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-4">
                  {[0, 0.12, 0.24, 0.1, 0.2].map((d, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-full bg-gradient-to-t from-[#6C5CE7] to-[#FFAB00]"
                      style={{
                        animation: `waveform 0.8s ease-in-out ${d}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#07070e] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-[#f0eef5] leading-tight">
              AI Host
            </h2>
            <p className="text-[11px] text-[#00D2FF] font-body font-medium flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2FF] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D2FF]" />
              </span>
              Online — Ask me anything
            </p>
          </div>

          {/* Clear chat */}
          {messages.length > 1 && (
            <button
              onClick={() => {
                setMessages([WELCOME_MESSAGE]);
                setShowSuggestions(true);
              }}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8b8aa0] hover:text-[#f0eef5] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4"
      >
        <div className="max-w-md mx-auto space-y-3 pt-2">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} index={i} />
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          {/* Suggestion chips */}
          {showSuggestions && !loading && (
            <div className="pt-2 animate-[fade-in_0.3s_ease-out_0.3s_both]">
              <p className="text-[10px] text-[#8b8aa0]/60 uppercase tracking-[0.12em] font-bold mb-2 px-1">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestion(s.message)}
                    className="px-3.5 py-2 rounded-full bg-[#101020] border border-[#1a1a30] text-[11px] font-body font-medium text-[#f0eef5]/70 hover:text-[#f0eef5] hover:border-[#6C5CE7]/40 hover:bg-[#6C5CE7]/8 transition-all active:scale-95"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-white/[0.06] bg-[#07070e]/90 backdrop-blur-xl px-4 py-3 pb-20">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex items-center gap-2.5">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Versa TV..."
              disabled={loading}
              className="w-full bg-[#101020] rounded-full px-5 py-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 border border-[#1a1a30] focus:border-[#6C5CE7]/30 transition-all disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 flex-shrink-0"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
