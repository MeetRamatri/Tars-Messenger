import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        avatar: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser !== null) {
            // User exists, just return their local Convex ID
            return existingUser._id;
        }

        // New user, store in DB
        const newUserId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            avatar: args.avatar,
            createdAt: Date.now(),
        });

        return newUserId;
    },
});
