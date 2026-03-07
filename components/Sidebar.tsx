"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import { MessageSquare, Users } from "lucide-react";

export function Sidebar() {
  const { user, isLoaded } = useUser();
  const conversations = useQuery(api.conversations.getMyConversations, user ? { clerkId: user.id } : "skip");
  const pathname = usePathname();

  return (
    <aside className="w-full h-full bg-white flex flex-col">
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
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 mt-10">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
              <MessageSquare className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">No conversations</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your chats will appear here once you start messaging friends.
              </p>
            </div>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname === `/chat/${conv._id}`;

            if (conv.isGroup) {
              const memberCount = conv.participants?.length || 0;
              const displayName = `${conv.name} (${memberCount})`;
              return (
                <Link 
                  key={conv._id} 
                  href={`/chat/${conv._id}`}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                    isActive 
                      ? "bg-blue-50/80 border-blue-100 shadow-sm" 
                      : "hover:bg-blue-50/50 hover:border-blue-100/50 border-transparent hover:translate-x-1"
                  }`}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border border-gray-100 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`font-semibold text-sm truncate pr-2 ${conv.unreadCount > 0 && !isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {displayName}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate ${conv.unreadCount > 0 && !isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && !isActive && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            }

            const otherUser = conv.otherUser;
            if (!otherUser) return null; // Fallback if data sync hasn't occurred

            return (
              <Link 
                key={conv._id} 
                href={`/chat/${conv._id}`}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer border ${
                  isActive 
                    ? "bg-blue-50/80 border-blue-100 shadow-sm" 
                    : "hover:bg-blue-50/50 hover:border-blue-100/50 border-transparent hover:translate-x-1"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border border-gray-100 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm">
                    <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {otherUser.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10 shadow-sm"></span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold text-sm truncate pr-2 ${conv.unreadCount > 0 && !isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {otherUser.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 && !isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && !isActive && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
