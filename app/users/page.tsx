"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Users, SearchX, Check } from "lucide-react";

export default function UsersDiscoveryPage() {
  const { user, isLoaded } = useUser();
  const users = useQuery(api.users.getUsers, user ? { clerkId: user.id } : "skip");
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);
  const createGroup = useMutation(api.conversations.createGroup);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;
    try {
      const conversationId = await getOrCreateConversation({
        participantOne: user.id,
        participantTwo: otherUserId,
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleUserClick = (otherUserId: string) => {
    if (isGroupMode) {
      setSelectedUsers(prev => 
        prev.includes(otherUserId) 
          ? prev.filter(id => id !== otherUserId)
          : [...prev, otherUserId]
      );
    } else {
      handleStartChat(otherUserId);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || selectedUsers.length < 1 || !groupName.trim()) return;
    setIsCreating(true);
    try {
      // Group participants must include the creator
      const participants = [...selectedUsers, user.id];
      const conversationId = await createGroup({
        name: groupName.trim(),
        participants,
        createdBy: user.id
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create group:", error);
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-8 bg-gray-50">
      <header className="flex justify-between items-center w-full max-w-4xl mx-auto mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-gray-500 hover:text-black transition-colors">
            &larr; Back to Chat
          </Link>
          <h1 className="text-2xl font-bold">Discover Users</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsGroupMode(!isGroupMode);
              setSelectedUsers([]);
              setGroupName("");
            }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              isGroupMode 
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
            }`}
          >
            {isGroupMode ? "Cancel Group" : "Create Group"}
          </button>
          <UserButton />
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Input 
            type="text" 
            placeholder="Search users by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-white border-gray-300"
          />
        </div>

        {!isLoaded || users === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
              {searchQuery ? <SearchX className="w-8 h-8 stroke-[1.5]" /> : <Users className="w-8 h-8 stroke-[1.5]" />}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {searchQuery ? "No matches found" : "No users yet"}
              </h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? `We couldn't find anyone named "${searchQuery}". Check the spelling and try again.` 
                  : "We're waiting for other people to join. Check back later to start chatting!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => (
              <div 
                key={u._id} 
                className="cursor-pointer" 
                onClick={() => handleUserClick(u.clerkId)}
              >
                <Card className={`p-4 hover:shadow-md transition-all border-gray-200 ${isGroupMode && selectedUsers.includes(u.clerkId) ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'hover:border-blue-300'}`}>
                  <CardContent className="p-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border border-gray-100">
                          <AvatarImage src={u.avatar} alt={u.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {u.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{u.name}</h3>
                        <p className="text-sm text-gray-500 whitespace-nowrap">{isGroupMode ? "Click to select" : "Click to chat"}</p>
                      </div>
                    </div>
                    {isGroupMode && (
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${selectedUsers.includes(u.clerkId) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                        {selectedUsers.includes(u.clerkId) && <Check className="w-4 h-4 text-white" />}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {isGroupMode && selectedUsers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-2 z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                placeholder="Group Name (e.g. Frontend Team)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border-gray-300"
                maxLength={50}
              />
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline-block">
                {selectedUsers.length} selected
              </span>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreating || selectedUsers.length < 1}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
