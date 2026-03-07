import { mutation } from "./_generated/server";
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
