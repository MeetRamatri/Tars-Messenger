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
import Link from "next/link";

export default function SingleChatPage({ params }: { params: { conversationId: string } }) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messages = useQuery(api.messages.getMessages, { 
    conversationId: params.conversationId as Id<"conversations"> 
  });
  const conversation = useQuery(api.conversations.getConversation, user ? {
    conversationId: params.conversationId as Id<"conversations">,
    clerkId: user.id
  } : "skip");

  const sendMessage = useMutation(api.messages.sendMessage);
  const setTyping = useMutation(api.conversations.setTyping);
  const markAsRead = useMutation(api.conversations.markAsRead);

  // Mark as read when opening chat or receiving new messages
  useEffect(() => {
    if (user && params.conversationId) {
      markAsRead({
        conversationId: params.conversationId as Id<"conversations">,
        clerkId: user.id
      });
    }
  }, [user, params.conversationId, messages, markAsRead]);

  // Auto-scroll logic
  useEffect(() => {
    if (!messages) return;

    if (isAtBottom) {
      // If we're already at bottom, stay at bottom
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      // If we're not at bottom, check if this message was sent by us
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.senderId === user?.id) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        setIsAtBottom(true);
        setHasNewMessages(false);
      } else {
        // Someone else sent a message while we were scrolled up
        setHasNewMessages(true);
      }
    }
  }, [messages, isAtBottom, user?.id]);

  // Keep typing indicator visible if at bottom
  useEffect(() => {
    if (isAtBottom && conversation?.typing?.length) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.typing, isAtBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Consider "at bottom" if within 100px of the very bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAtBottom(atBottom);
    
    if (atBottom && hasNewMessages) {
      setHasNewMessages(false);
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setHasNewMessages(false);
  };

  // Clean up typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (user) {
        setTyping({
          conversationId: params.conversationId as Id<"conversations">,
          clerkId: user.id,
          isTyping: false,
        });
      }
    };
  }, [user, params.conversationId, setTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!user) return;
    
    setTyping({
      conversationId: params.conversationId as Id<"conversations">,
      clerkId: user.id,
      isTyping: true,
    });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({
        conversationId: params.conversationId as Id<"conversations">,
        clerkId: user.id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setTyping({
      conversationId: params.conversationId as Id<"conversations">,
      clerkId: user.id,
      isTyping: false,
    });

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

  const formatTimestamp = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Reset time parts for accurate day comparisons
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    
    // Today
    if (msgDateOnly.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], timeOptions);
    }
    
    // Same year
    if (messageDate.getFullYear() === now.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ", " + messageDate.toLocaleTimeString([], timeOptions);
    }
    
    // Different year
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ", " + messageDate.toLocaleTimeString([], timeOptions);
  };

  return (
    <main className="flex-1 flex flex-col h-[100dvh] bg-[#fcfcfc] relative">
      <header className="flex justify-between items-center w-full p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/chat" 
            className="md:hidden flex items-center justify-center p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </Link>
          <div className="flex items-center gap-3">
            {conversation?.otherUser && (
              <div className="relative">
                <Avatar className="h-10 w-10 border border-gray-100 flex-shrink-0">
                  <AvatarImage src={conversation.otherUser.avatar} />
                  <AvatarFallback className="text-sm bg-blue-50 text-blue-700">
                    {conversation.otherUser.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                {conversation.otherUser.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10"></span>
                )}
              </div>
            )}
            <h1 className="text-lg font-semibold truncate">
              {conversation?.otherUser?.name || "Loading..."}
            </h1>
          </div>
        </div>
        <UserButton />
      </header>
      
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <ScrollArea 
          className="flex-1 px-4 py-6"
          onScrollCapture={handleScroll}
        >
          <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-4">
            {messages === undefined ? (
               <div className="text-center text-gray-400 mt-10">Loading messages...</div>
            ) : messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 mt-10 space-y-4">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                   <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                     <AvatarImage src={conversation?.otherUser?.avatar} />
                     <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-medium">
                       {conversation?.otherUser?.name?.charAt(0) || "?"}
                     </AvatarFallback>
                   </Avatar>
                 </div>
                 <div className="text-center">
                   <h3 className="text-lg font-medium text-gray-900">Say hi to {conversation?.otherUser?.name?.split(' ')[0]}!</h3>
                   <p className="text-sm text-gray-500 mt-1">
                     Send a message to kick off the conversation.
                   </p>
                 </div>
               </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div 
                    key={msg._id} 
                    className={`flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <Avatar className="h-8 w-8 mt-auto mb-1 border border-gray-100 flex-shrink-0 shadow-sm">
                        <AvatarImage src={msg.sender?.avatar} />
                        <AvatarFallback className="text-xs bg-blue-50 text-blue-700 font-medium">
                          {msg.sender?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-[11px] font-medium text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                      
                      <div 
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMe 
                            ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-br-sm shadow-md shadow-blue-500/20" 
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm drop-shadow-sm"
                        }`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {msg.body}
                      </div>
                      
                      <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? "mr-1" : "ml-1"}`}>
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {conversation?.typing?.filter(id => id !== user?.id).length ? (
              <div className="flex gap-3 w-full justify-start items-center">
                <Avatar className="h-8 w-8 mt-1 border border-gray-100 flex-shrink-0">
                  <AvatarImage src={conversation.otherUser?.avatar} />
                  <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                    {conversation.otherUser?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm flex items-center gap-1 mt-1">
                  <span className="animate-bounce inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="animate-bounce inline-block w-1 h-1 bg-gray-400 rounded-full" style={{ animationDelay: '0.2s' }}></span>
                  <span className="animate-bounce inline-block w-1 h-1 bg-gray-400 rounded-full" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            ) : null}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {hasNewMessages && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 z-20"
          >
            New messages ↓
          </button>
        )}

        <div className="p-4 bg-white border-t border-gray-200">
          <form 
            onSubmit={handleSendMessage} 
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <Input
              placeholder="Message..."
              className="pr-24 py-6 rounded-full border-gray-200 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 bg-white shadow-sm transition-all"
              value={newMessage}
              onChange={handleInputChange}
              disabled={messages === undefined}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || messages === undefined}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-full px-5 py-2 text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
