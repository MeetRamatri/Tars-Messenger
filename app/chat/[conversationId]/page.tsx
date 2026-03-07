"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "../../../convex/_generated/dataModel";

export default function SingleChatPage({ params }: { params: { conversationId: string } }) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.getMessages, { 
    conversationId: params.conversationId as Id<"conversations"> 
  });
  const sendMessage = useMutation(api.messages.sendMessage);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage({
        conversationId: params.conversationId as Id<"conversations">,
        senderId: user.id,
        body: newMessage.trim(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const getDayAndMonth = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#fcfcfc] relative">
      <header className="flex justify-between items-center w-full p-4 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Tars Messenger</h1>
        </div>
        <UserButton />
      </header>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-4">
            {messages === undefined ? (
               <div className="text-center text-gray-400 mt-10">Loading messages...</div>
            ) : messages.length === 0 ? (
               <div className="text-center text-gray-500 mt-10 p-6 bg-white rounded-xl border border-dashed border-gray-300">
                 No messages yet. Send a message to start the conversation!
               </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg._id} className={`flex gap-3 w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <Avatar className="h-8 w-8 mt-1 border border-gray-100 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar} />
                        <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                          {msg.sender?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                      
                      <div 
                        className={`px-4 py-2 rounded-2xl ${
                          isMe 
                            ? "bg-blue-600 text-white rounded-tr-sm" 
                            : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm"
                        }`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {msg.body}
                      </div>
                      
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {getDayAndMonth(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-gray-200">
          <form 
            onSubmit={handleSendMessage} 
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <Input
              placeholder="Type your message..."
              className="pr-20 py-6 rounded-full border-gray-300 focus-visible:ring-blue-500 bg-gray-50"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={messages === undefined}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || messages === undefined}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-4 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
