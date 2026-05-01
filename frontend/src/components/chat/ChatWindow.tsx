"use client";

import { useState, useRef, useEffect } from "react";
import { useMessages, useSendMessage } from "@/hooks/useChat";
import { useDocumentStore } from "@/store/documentStore";
import { useMode } from "@/hooks/useMode";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Sparkles } from "lucide-react";
import { Message } from "@/types/chat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { createClient } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

// ── Message bubble ───────────────────────────────────────────────────────────
function ChatMessage({ message, index, userInitials }: { message: Message; index: number; userInitials: string }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl sc-gradient-bg flex items-center justify-center shrink-0 mb-0.5">
          <Sparkles size={14} className="text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[72%] md:max-w-[60%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm text-white sc-gradient-bg shadow-lg shadow-purple-900/30"
            : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? {}
            : {
                background: "var(--sc-surface)",
                border: "1px solid var(--sc-border)",
                color: "var(--foreground)",
              }
        }
      >
        <p>{message.content}</p>

        {message.sources && (
          <div
            className="mt-2 pt-2 space-y-1"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-xs font-semibold opacity-60">Sources</p>
            <ul className="space-y-0.5">
              {message.sources.map((source, i) => (
                <li key={i} className="text-xs opacity-60 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-current inline-block" />
                  {source.filename} — p.{source.page}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* User avatar — show initials from username */}
      {isUser && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-0.5 text-xs font-bold sc-gradient-bg text-white"
        >
          {userInitials}
        </div>
      )}
    </motion.div>
  );
}

// ── Main ChatWindow ──────────────────────────────────────────────────────────
export default function ChatWindow({
  sessionId,
  onOpenVoiceModal,
  pendingTranscript,
  onTranscriptConsumed,
}: {
  sessionId?: string;
  onOpenVoiceModal?: () => void;
  pendingTranscript?: string;
  onTranscriptConsumed?: () => void;
}) {
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const { data: messages, isLoading } = useMessages(sessionId!);
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const { selectedDocIds } = useDocumentStore();
  const mode = useMode();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isSupported } = useVoiceInput();
  const [userInitials, setUserInitials] = useState("U");

  // Inject voice transcript into input when modal closes
  useEffect(() => {
    if (pendingTranscript) {
      setInput((prev) => (prev ? prev + " " + pendingTranscript : pendingTranscript));
      onTranscriptConsumed?.();
    }
  }, [pendingTranscript, onTranscriptConsumed]);

  // Fetch username for avatar display
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata;
        const name = meta?.username || meta?.full_name || user.email?.split("@")[0] || "U";
        setUserInitials(name.slice(0, 2).toUpperCase());
      }
    };
    fetchUser();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // Optimistically add user message
    queryClient.setQueryData(['messages', sessionId], (old: Message[] | undefined) => [...(old || []), tempUserMessage]);

    const messageToSend = {
      session_id: sessionId,
      content: input,
      selected_doc_ids: mode === "rag" ? selectedDocIds : undefined,
    };

    setInput("");
    
    await sendMessage.mutateAsync(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isLoading && (
          <div className="flex justify-start items-end gap-2.5">
            <div className="w-8 h-8 rounded-xl sc-gradient-bg flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ background: "var(--sc-surface)", border: "1px solid var(--sc-border)" }}
            >
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full sc-gradient-bg"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no session */}
        {!sessionId && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="w-16 h-16 rounded-2xl sc-gradient-bg flex items-center justify-center">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                Welcome to SmartChat
              </h2>
              <p className="text-sm mt-2 max-w-xs" style={{ color: "var(--sc-text-muted)" }}>
                Create a new chat or select an existing one from the sidebar to get started.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages?.map((msg, index) => (
            <ChatMessage key={msg.id || index} message={msg} index={index} userInitials={userInitials} />
          ))}
        </AnimatePresence>

        {/* Typing indicator when sending */}
        {sendMessage.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-end gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl sc-gradient-bg flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ background: "var(--sc-surface)", border: "1px solid var(--sc-border)" }}
            >
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--sc-purple)" }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-5 pt-3">
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200"
          style={{
            background: "var(--sc-surface)",
            border: "1px solid var(--sc-border)",
            boxShadow: "0 0 0 0px rgba(147,51,234,0)",
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="chat-input"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1.5
              placeholder:text-[var(--sc-text-muted)]"
            style={{ color: "var(--foreground)", maxHeight: "140px", minHeight: "24px" }}
          />

          {/* Voice mic button */}
          {isSupported && onOpenVoiceModal && (
            <button
              id="voice-input-btn"
              onClick={onOpenVoiceModal}
              aria-label="Voice input"
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 mb-0.5"
              style={{
                background: "var(--sc-purple-dim)",
                color: "var(--sc-purple)",
              }}
            >
              <Mic size={18} />
            </button>
          )}

          {/* Send button */}
          <motion.button
            id="send-message-btn"
            onClick={handleSend}
            disabled={sendMessage.isPending || !input.trim()}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 mb-0.5
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim() ? "var(--sc-gradient)" : "var(--sc-surface-raised)",
            }}
            aria-label="Send message"
          >
            <Send size={14} className="text-white translate-x-px" />
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "var(--sc-text-muted)" }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
