import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
    args: {
        participantOne: v.string(),
        participantTwo: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if conversation already exists (could be in either order)
        const existingChat1 = await ctx.db
            .query("conversations")
            .withIndex("by_participantOne", (q) => q.eq("participantOne", args.participantOne))
            .filter((q) => q.eq(q.field("participantTwo"), args.participantTwo))
            .first();

        if (existingChat1 !== null) {
            return existingChat1._id;
        }

        const existingChat2 = await ctx.db
            .query("conversations")
            .withIndex("by_participantOne", (q) => q.eq("participantOne", args.participantTwo))
            .filter((q) => q.eq(q.field("participantTwo"), args.participantOne))
            .first();

        if (existingChat2 !== null) {
            return existingChat2._id;
        }

        // Create new conversation
        const newChatId = await ctx.db.insert("conversations", {
            participantOne: args.participantOne,
            participantTwo: args.participantTwo,
            updatedAt: Date.now(),
        });

        return newChatId;
    },
});

export const getMyConversations = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        // Get all conversations where user is participantOne
        const asParticipantOne = await ctx.db
            .query("conversations")
            .withIndex("by_participantOne", (q) => q.eq("participantOne", args.clerkId))
            .collect();

        // Get all conversations where user is participantTwo
        const asParticipantTwo = await ctx.db
            .query("conversations")
            .withIndex("by_participantTwo", (q) => q.eq("participantTwo", args.clerkId))
            .collect();

        // Combine and sort by updated time descending
        const allConversations = [...asParticipantOne, ...asParticipantTwo].sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        // Fetch the other user's details for each conversation
        const enrichedConversations = await Promise.all(
            allConversations.map(async (conv) => {
                const otherParticipantId =
                    conv.participantOne === args.clerkId
                        ? conv.participantTwo
                        : conv.participantOne;

                const otherUser = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", otherParticipantId))
                    .unique();

                return {
                    ...conv,
                    otherUser,
                };
            })
        );

        return enrichedConversations;
    },
});
