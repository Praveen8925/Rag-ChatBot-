"use client";

import Link from "next/link";
import { useSessions, useCreateSession, useDeleteSession, useUpdateSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  FileText,
  LogOut,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";


export default function Sidebar() {
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Fetch user info for displaying name
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata;
        setUsername(meta?.username || meta?.full_name || "");
        setUserEmail(user.email || "");
      }
    };
    fetchUser();
  }, []);

  const handleNewChat = async () => {
    const newSession = await createSession.mutateAsync();
    // Assuming the API returns the new session with an ID
    if (newSession) {
      router.push(`/chat/${newSession.id}`);
    }
  };

  const handleDelete = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      deleteSession.mutate(sessionId, {
        onError: (error: any) => {
          console.error("Delete failed:", error);
          const message = error.message || "Failed to delete chat. Please try again.";
          alert(message);
        },
        onSuccess: () => {
          // If deleted session was currently active, redirect to chat page
          if (pathname === `/chat/${sessionId}`) {
            router.push('/chat');
          }
        }
      });
    }
  };

  const handleRename = (sessionId: string, currentTitle: string) => {
    setEditingSession(sessionId);
    setEditingTitle(currentTitle || "New Chat");
  };

  const handleSaveEdit = () => {
    if (editingSession && editingTitle.trim()) {
      // Allow any title including "New Chat" - user has full control
      const trimmedTitle = editingTitle.trim();

      updateSession.mutate({ sessionId: editingSession, title: trimmedTitle }, {
        onError: (error: any) => {
          console.error("Update failed:", error);
          const message = error.message || "Failed to update chat name. Please try again.";
          alert(message);
        },
        onSuccess: () => {
          setEditingSession(null);
          setEditingTitle("");
        }
      });
    } else {
      // Cancel if title is empty
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditingTitle("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = username || userEmail?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 h-full flex flex-col"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center sc-gradient-bg shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        <Link href="/chat" className="text-lg font-bold sc-gradient-text tracking-tight">
          SmartChat
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <Button
          id="new-chat-btn"
          onClick={handleNewChat}
          disabled={createSession.isPending}
          className="w-full h-10 rounded-xl font-medium text-sm gap-2 sc-gradient-bg text-white border-0
            hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/20"
        >
          <Plus size={16} />
          {createSession.isPending ? "Creating..." : "New Chat"}
        </Button>
      </div>

      {/* Sessions Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--sc-text-muted)" }}>
          Recent
        </p>

        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-lg animate-pulse"
                style={{ background: "var(--sc-surface-raised)" }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <ul className="space-y-0.5">
              {sessions?.map((session, index) => {
                const isActive = pathname === `/chat/${session.id}`;
                return (
                  <motion.li
                    key={session.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={`/chat/${session.id}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
                      style={{
                        background: isActive ? "var(--sc-purple-dim)" : "transparent",
                        color: isActive ? "var(--sc-purple)" : "var(--sidebar-foreground)",
                      }}
                      onClick={(e) => {
                        // Prevent navigation when in edit mode
                        if (editingSession === session.id) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <MessageSquare size={14} className="shrink-0 opacity-60 group-hover:opacity-100" />
                      <div className="flex-1 min-w-0">
                        {editingSession === session.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={handleSaveEdit}
                            className="w-full bg-transparent border-none outline-none font-medium leading-tight text-sm"
                            style={{ color: isActive ? "var(--sc-purple)" : "var(--sidebar-foreground)" }}
                            autoFocus
                          />
                        ) : (
                          <p className="truncate font-medium leading-tight">
                            {session.title || "New Chat"}
                          </p>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingSession === session.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleSaveEdit(); }}
                              className="p-1 hover:text-green-400"
                              title="Save"
                              disabled={updateSession.isPending}
                            >
                              {updateSession.isPending ? "..." : "✓"}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCancelEdit(); }}
                              className="p-1 hover:text-red-400"
                              title="Cancel"
                              disabled={updateSession.isPending}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleRename(session.id, session.title); }}
                              className="p-1 hover:text-white"
                              title="Edit name"
                              disabled={deleteSession.isPending}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); handleDelete(session.id); }}
                              className="p-1 hover:text-red-500"
                              title="Delete chat"
                              disabled={deleteSession.isPending}
                            >
                              {deleteSession.isPending ? "..." : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </AnimatePresence>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 space-y-1"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <Link
          href="/documents"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
          style={{ color: "var(--sidebar-foreground)" }}
        >
          <FileText size={14} className="shrink-0 opacity-60 group-hover:opacity-100" />
          <span>Documents</span>
        </Link>

        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-sm" style={{ color: "var(--sc-text-muted)" }}>Theme</span>
          <ThemeToggle />
        </div>

        {/* User info + Logout */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1"
          style={{ background: "var(--sc-surface-raised)" }}
        >
          {/* Avatar with initials */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white sc-gradient-bg"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
              {displayName}
            </p>
            {userEmail && username && (
              <p className="text-xs truncate" style={{ color: "var(--sc-text-muted)" }}>
                {userEmail}
              </p>
            )}
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200
              hover:bg-red-500/10 hover:text-red-400"
            style={{ color: "var(--sc-text-muted)" }}
            aria-label="Logout"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
