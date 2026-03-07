"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const { user, isLoaded } = useUser();
  const conversations = useQuery(api.conversations.getMyConversations, user ? { clerkId: user.id } : "skip");
  const pathname = usePathname();

  return (
    <aside className="w-80 h-full border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold">Chats</h2>
        <Link 
          href="/users" 
          className="p-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium border border-blue-100"
        >
          New Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!isLoaded || conversations === undefined ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-transparent">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="text-center p-6 mt-10">
            <p className="text-gray-500 text-sm">No conversations yet.</p>
            <p className="text-gray-400 text-xs mt-1">Start one by finding users!</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname === `/chat/${conv._id}`;
            const otherUser = conv.otherUser;

            if (!otherUser) return null; // Fallback if data sync hasn't occurred

            return (
              <Link 
                key={conv._id} 
                href={`/chat/${conv._id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer border ${
                  isActive 
                    ? "bg-blue-50 border-blue-100" 
                    : "hover:bg-gray-50 border-transparent"
                }`}
              >
                <Avatar className="h-12 w-12 border border-gray-100 flex-shrink-0">
                  <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {otherUser.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold text-sm truncate pr-2 text-gray-900">
                      {otherUser.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
