import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUserWithConvex } from "@/components/SyncUserWithConvex";
import { PresenceTracker } from "@/components/PresenceTracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Realtime Chat App",
  description: "A realtime chat application built with Next.js and Convex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ConvexClientProvider>
            {/* These should be safe components that internally check auth */}
            <SignedIn>
              <SyncUserWithConvex />
              <PresenceTracker />
            </SignedIn>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}