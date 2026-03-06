"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const testMessage = useQuery(api?.test?.get);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Realtime Chat App</h1>
      <p className="mt-6 text-xl text-green-500 font-medium">
        {testMessage === undefined ? "Loading Convex..." : testMessage}
      </p>
    </main>
  );
}
