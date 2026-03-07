"use client";

import { UserButton } from "@clerk/nextjs";

export default function ChatPage() {
  return (
    <main className="flex-1 flex flex-col h-full bg-white relative">
      <header className="absolute top-0 right-0 p-4">
        <UserButton />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Tars Messenger</h2>
          <p className="text-gray-500 text-sm">
            Select a conversation from the sidebar or click "New Chat" to discover users.
          </p>
        </div>
      </div>
    </main>
  );
}
