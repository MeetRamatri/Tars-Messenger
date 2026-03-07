"use client";

import { UserButton } from "@clerk/nextjs";

export default function SingleChatPage({ params }: { params: { conversationId: string } }) {
  return (
    <main className="flex-1 flex flex-col h-full bg-white relative">
      <header className="flex justify-between items-center w-full p-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Conversation ID: <span className="text-gray-500 text-base">{params.conversationId}</span></h1>
        </div>
        <UserButton />
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm">
            Chat history for {params.conversationId} goes here
          </p>
        </div>
      </div>
    </main>
  );
}
