import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.string(), // clerkId
        body: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Insert the message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            body: args.body,
            createdAt: Date.now(),
        });

        // 2. Update the conversation with the last message preview and new timestamp
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            let unread1 = conversation.unread1 || 0;
            let unread2 = conversation.unread2 || 0;

            if (conversation.participantOne === args.senderId) {
                unread2 += 1;
            } else {
                unread1 += 1;
            }

            await ctx.db.patch(args.conversationId, {
                lastMessage: args.body,
                updatedAt: Date.now(),
                unread1,
                unread2,
            });
        }

        return messageId;
    },
});

export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        // Return all messages for the conversation, ordered by creation (default insert order)
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Attach sender details to each message
        const enrichedMessages = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db
                    .query("users")
                    .withIndex("by_clerkId", (q) => q.eq("clerkId", msg.senderId))
                    .unique();

                return {
                    ...msg,
                    sender,
                };
            })
        );

        return enrichedMessages;
    },
});
