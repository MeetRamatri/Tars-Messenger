"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const testMessage = useQuery(api?.test?.get);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-5xl flex justify-end mb-8">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Realtime Chat App</h1>
        <p className="mt-6 text-xl text-green-500 font-medium h-8">
          {testMessage === undefined ? "Loading Convex..." : testMessage}
        </p>

        <SignedIn>
          <Link href="/chat" className="mt-8 bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-sm">
            Go to Chat
          </Link>
        </SignedIn>
        <SignedOut>
          <p className="mt-8 text-gray-500 bg-gray-100 py-3 px-6 rounded-lg text-sm border border-gray-200">
            Sign in to access the chat.
          </p>
        </SignedOut>
      </div>
    </main>
  );
}
