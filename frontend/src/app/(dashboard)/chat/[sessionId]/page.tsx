"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import VoiceModal from "@/components/chat/VoiceModal";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");

  const handleVoiceClose = (transcript: string) => {
    if (transcript) {
      setPendingTranscript(transcript);
    }
    setVoiceModalOpen(false);
  };

  return (
    <>
      <ChatWindow
        sessionId={sessionId as string}
        onOpenVoiceModal={() => setVoiceModalOpen(true)}
        pendingTranscript={pendingTranscript}
        onTranscriptConsumed={() => setPendingTranscript("")}
      />
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={handleVoiceClose}
      />
    </>
  );
}
