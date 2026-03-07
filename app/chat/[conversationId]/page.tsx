"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { Trash2, SmilePlus, Loader2, AlertCircle, Users } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function SingleChatPage({ params }: { params: { conversationId: string } }) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<Id<"messages"> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setActiveReactionMessageId(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const messages = useQuery(api.messages.getMessages, { 
    conversationId: params.conversationId as Id<"conversations"> 
  });
  const conversation = useQuery(api.conversations.getConversation, user ? {
    conversationId: params.conversationId as Id<"conversations">,
    clerkId: user.id
  } : "skip");

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
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

  const handleSendMessage = async (e?: React.FormEvent, contentToRetry?: string) => {
    if (e) e.preventDefault();
    const content = contentToRetry || newMessage.trim();
    if (!content || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setTyping({
      conversationId: params.conversationId as Id<"conversations">,
      clerkId: user.id,
      isTyping: false,
    });

    setIsSending(true);
    setFailedMessage(null);

    try {
      await sendMessage({
        conversationId: params.conversationId as Id<"conversations">,
        senderId: user.id,
        body: content,
      });
      if (!contentToRetry) {
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setFailedMessage(content);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    if (!user) return;
    try {
      await deleteMessage({
        messageId,
        clerkId: user.id
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleReaction = async (messageId: Id<"messages">, emoji: string) => {
    if (!user) return;
    try {
      await toggleReaction({
        messageId,
        emoji,
        clerkId: user.id
      });
      setActiveReactionMessageId(null);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
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
          <div className="flex items-center gap-3 cursor-default">
            {conversation?.isGroup ? (
              <div className="relative">
                <div className="h-10 w-10 rounded-full border border-gray-100 flex-shrink-0 bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            ) : conversation?.otherUser ? (
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
            ) : null}
            <div className="flex flex-col gap-1 overflow-hidden">
              <h1 className="text-lg font-semibold truncate">
                {conversation?.isGroup 
                  ? `${conversation.name} (${conversation.participants?.length || 0})` 
                  : conversation?.otherUser?.name || "Loading..."}
              </h1>
              {conversation?.isGroup && (
                <p className="text-xs text-gray-500 truncate">Group Chat</p>
              )}
            </div>
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
              <div className="flex flex-col gap-4 w-full mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => {
                  const isMe = i % 2 === 0;
                  return (
                    <div key={i} className={`flex gap-3 w-full ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && <Skeleton className="h-8 w-8 rounded-full mt-auto mb-1 flex-shrink-0" />}
                      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                        <Skeleton className={`h-10 rounded-2xl ${i === 1 ? 'w-32' : i === 2 ? 'w-64' : i === 3 ? 'w-48' : i === 4 ? 'w-24' : 'w-56'} ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 mt-10 space-y-4">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-2 shadow-sm">
                   {conversation?.isGroup ? (
                     <Users className="w-12 h-12 text-blue-500" />
                   ) : (
                     <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                       <AvatarImage src={conversation?.otherUser?.avatar} />
                       <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-medium">
                         {conversation?.otherUser?.name?.charAt(0) || "?"}
                       </AvatarFallback>
                     </Avatar>
                   )}
                 </div>
                 <div className="text-center">
                   <h3 className="text-xl font-medium text-gray-900">
                     {conversation?.isGroup 
                       ? `Welcome to ${conversation.name}` 
                       : `Say hi to ${conversation?.otherUser?.name?.split(' ')[0]}!`}
                   </h3>
                   <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                     {conversation?.isGroup 
                       ? "You've created a new group. Send a message to kick off the conversation." 
                       : "Send a message to kick off the conversation."}
                   </p>
                 </div>
               </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div 
                    key={msg._id} 
                    className={`flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 group ${isMe ? "justify-end" : "justify-start"}`}
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
                      
                      <div className="flex items-center gap-2 group/msg relative">
                        {isMe && !msg.deleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!msg.deleted && (
                          <div className={`transition-all flex items-center ${isMe ? "order-first" : "order-last"} relative ${activeReactionMessageId === msg._id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                            <div className="relative">
                              <button
                                onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg._id ? null : msg._id)}
                                className={`p-1.5 rounded-full transition-colors ${activeReactionMessageId === msg._id ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}
                                title="Add reaction"
                              >
                                <SmilePlus className="w-4 h-4" />
                              </button>
                              
                              {activeReactionMessageId === msg._id && (
                                <div 
                                  ref={reactionPickerRef}
                                  className={`absolute bottom-full mb-2 flex bg-white shadow-lg border border-gray-100 rounded-full px-2 py-1 gap-1 z-50 animate-in fade-in zoom-in-95 duration-200 ${isMe ? "right-[-10px]" : "left-[-10px]"}`}
                                >
                                  {EMOJIS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleReaction(msg._id, emoji);
                                      }}
                                      className="hover:bg-gray-100 rounded-full p-1 text-lg transition-transform duration-200 hover:scale-[1.3] active:scale-95 origin-bottom"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div 
                          className={`px-4 py-2.5 rounded-2xl relative z-10 ${
                            msg.deleted
                              ? "bg-gray-50 border border-gray-200 text-gray-500 italic shadow-sm"
                              : isMe 
                                ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-br-sm shadow-md shadow-blue-500/20" 
                                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm drop-shadow-sm"
                          }`}
                          style={{ wordBreak: 'break-word' }}
                        >
                          {msg.deleted ? "This message was deleted" : msg.body}
                        </div>
                      </div>
                      
                      {!msg.deleted && msg.reactions && msg.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
                          {msg.reactions.map(r => {
                            const hasReacted = r.users.includes(user?.id || "");
                            return (
                              <button
                                key={r.emoji}
                                onClick={() => handleReaction(msg._id, r.emoji)}
                                className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                                  hasReacted
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-semibold text-[10px]">{r.users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
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
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 z-20"
          >
            New messages ↓
          </button>
        )}

        <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-2 relative">
          {failedMessage && (
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Failed to send message</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFailedMessage(null)}
                  className="font-medium hover:text-red-800 transition-colors px-2 py-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSendMessage(undefined, failedMessage)}
                  className="bg-white text-red-600 font-semibold px-3 py-1 rounded-full shadow-sm border border-red-100 hover:bg-red-50 transition-all active:scale-95"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <form 
            onSubmit={(e) => handleSendMessage(e)} 
            className="max-w-4xl mx-auto w-full relative flex items-center"
          >
            <Input
              placeholder="Message..."
              className="pr-24 py-6 rounded-full border-gray-200 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 bg-white shadow-sm transition-all"
              value={newMessage}
              onChange={handleInputChange}
              disabled={messages === undefined || isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || messages === undefined || isSending}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-full px-5 py-2 text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center min-w-[80px]"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Send"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
