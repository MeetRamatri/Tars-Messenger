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

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
        clerkId: v.string()
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.senderId !== args.clerkId) {
            throw new Error("Unauthorized to delete this message");
        }

        await ctx.db.patch(args.messageId, {
            deleted: true
        });

        // Optionally update the conversation's lastMessage if this was it
        // Note: For simplicity, we keep the lastMessage intact on the conversation record,
        // or we could query the *next* most recent message. 
    }
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        let reactions = message.reactions || [];
        const reactionIndex = reactions.findIndex(r => r.emoji === args.emoji);

        if (reactionIndex !== -1) {
            const userIndex = reactions[reactionIndex].users.indexOf(args.clerkId);
            if (userIndex !== -1) {
                // Toggle off: remove user
                reactions[reactionIndex].users.splice(userIndex, 1);
                // Remove emoji struct entirely if no users left
                if (reactions[reactionIndex].users.length === 0) {
                    reactions.splice(reactionIndex, 1);
                }
            } else {
                // Add user to existing emoji list
                reactions[reactionIndex].users.push(args.clerkId);
            }
        } else {
            // Add completely new emoji to the reactions list
            reactions.push({ emoji: args.emoji, users: [args.clerkId] });
        }

        await ctx.db.patch(args.messageId, { reactions });
    }
});
