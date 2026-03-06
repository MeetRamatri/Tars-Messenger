"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function SyncUserWithConvex() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (user) {
      storeUser({
        clerkId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        avatar: user.imageUrl,
      });
    }
  }, [user, storeUser]);

  return null;
}
