"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import { useParams } from "next/navigation";

export default function ChatSessionPage() {
  const { sessionId } = useParams();
  return <ChatWindow sessionId={sessionId as string} />;
}
