"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function PresenceTracker() {
  const { user } = useUser();
  const updatePresence = useMutation(api.users.updatePresence);

  useEffect(() => {
    if (!user) return;

    // Mark online when mounting
    updatePresence({ clerkId: user.id, isOnline: true });

    // Handle visibility changes (switching tabs/minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updatePresence({ clerkId: user.id, isOnline: true });
      } else {
        updatePresence({ clerkId: user.id, isOnline: false });
      }
    };

    // Handle window closing/refreshing
    const handleBeforeUnload = () => {
      updatePresence({ clerkId: user.id, isOnline: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup when component unmounts
    return () => {
      updatePresence({ clerkId: user.id, isOnline: false });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, updatePresence]);

  return null; // This component doesn't render anything
}
