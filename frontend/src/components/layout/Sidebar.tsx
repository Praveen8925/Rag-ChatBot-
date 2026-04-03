"use client";

import Link from "next/link";
import { useSessions, useCreateSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();
  const router = useRouter();

  const handleNewChat = async () => {
    const newSession = await createSession.mutateAsync();
    // Assuming the API returns the new session with an ID
    if (newSession) {
      router.push(`/chat/${newSession.id}`);
    }
  };

  return (
    <aside className="w-64 h-full bg-gray-800 text-white p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/chat" className="text-2xl font-bold">
          SmartChat
        </Link>
      </div>
      <Button onClick={handleNewChat} className="mb-4" disabled={createSession.isPending}>
        {createSession.isPending ? "Creating..." : "New Chat"}
      </Button>
      <nav className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p>Loading sessions...</p>
        ) : (
          <ul>
            {sessions?.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/chat/${session.id}`}
                  className="block py-2 px-4 rounded hover:bg-gray-700"
                >
                  {session.title || "New Chat"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <div className="mt-auto">
        <Link href="/documents" className="block py-2 px-4 rounded hover:bg-gray-700">
            Documents
        </Link>
      </div>
    </aside>
  );
}
