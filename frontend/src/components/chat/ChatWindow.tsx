"use client";

import { useState } from "react";
import { useMessages, useSendMessage } from "@/hooks/useChat";
import { useDocumentStore } from "@/store/documentStore";
import { useMode } from "@/hooks/useMode";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Message } from "@/types/chat";

function ChatMessage({ message }: { message: Message }) {
    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                <p>{message.content}</p>
                {message.sources && (
                    <div className="mt-2 text-xs text-gray-600">
                        <strong>Sources:</strong>
                        <ul>
                            {message.sources.map((source, index) => (
                                <li key={index}>{source.filename} (Page: {source.page})</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}


export default function ChatWindow({ sessionId }: { sessionId?: string }) {
  const [input, setInput] = useState("");
  const { data: messages, isLoading } = useMessages(sessionId!);
  const sendMessage = useSendMessage();
  const { selectedDocIds } = useDocumentStore();
  const mode = useMode();

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const messageToSend = {
      session_id: sessionId,
      content: input,
      selected_doc_ids: mode === 'rag' ? selectedDocIds : undefined,
    };

    await sendMessage.mutateAsync(messageToSend);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading && <p>Loading messages...</p>}
        {messages?.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <div className="p-4 border-t flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sendMessage.isPending}>
          {sendMessage.isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
