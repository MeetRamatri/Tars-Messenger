"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <header className="flex justify-between items-center w-full mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-black">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold">Chat</h1>
        </div>
        <UserButton />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-24 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
        <p className="text-gray-500">Chat interface will go here.</p>
      </div>
    </main>
  );
}
