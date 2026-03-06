"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function UsersDiscoveryPage() {
  const { user, isLoaded } = useUser();
  const users = useQuery(api.users.getUsers, user ? { clerkId: user.id } : "skip");

  return (
    <main className="flex min-h-screen flex-col p-8 bg-gray-50">
      <header className="flex justify-between items-center w-full max-w-4xl mx-auto mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-gray-500 hover:text-black transition-colors">
            &larr; Back to Chat
          </Link>
          <h1 className="text-2xl font-bold">Discover Users</h1>
        </div>
        <UserButton />
      </header>

      <div className="w-full max-w-4xl mx-auto">
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
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No other users found</h3>
            <p className="text-gray-500">When other people sign up, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((u) => (
              <Card key={u._id} className="p-4 hover:shadow-md transition-shadow border-gray-200">
                <CardContent className="p-0 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-gray-100">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {u.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{u.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
