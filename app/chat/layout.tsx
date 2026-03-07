"use client";

import { Sidebar } from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatActive = pathname.startsWith("/chat/") && pathname !== "/chat";
  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden">
      <div className={`flex-shrink-0 border-r border-gray-200 transition-all duration-300 ${
        isChatActive ? "hidden md:flex w-full md:w-80" : "flex w-full md:w-80"
      }`}>
        <Sidebar />
      </div>
      <div className={`flex-1 flex col min-w-0 bg-gray-50 ${
        isChatActive ? "flex" : "hidden md:flex"
      }`}>
        {children}
      </div>
    </div>
  );
}
