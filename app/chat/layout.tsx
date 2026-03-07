"use client";

import { Sidebar } from "@/components/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {children}
      </div>
    </div>
  );
}
