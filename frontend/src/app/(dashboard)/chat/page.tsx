"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import VoiceModal from "@/components/chat/VoiceModal";
import { useCreateSession, useSessions } from "@/hooks/useSession";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();

  // Create ONE default chat for new users (signup/signin)
  useEffect(() => {
    if (!isLoading && sessions && sessions.length === 0) {
      createSession.mutate();
    }
  }, [sessions, isLoading, createSession]);

  const handleVoiceClose = (transcript: string) => {
    // On the index page there's no session, so just close
    setVoiceModalOpen(false);
  };

  return (
    <>
      <ChatWindow
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
      />
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={handleVoiceClose}
      />
    </>
  );
}
