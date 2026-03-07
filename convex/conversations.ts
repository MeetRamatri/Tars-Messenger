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
            participants: [args.participantOne, args.participantTwo],
            updatedAt: Date.now(),
        });

        return newChatId;
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        participants: v.array(v.string()),
        createdBy: v.string()
    },
    handler: async (ctx, args) => {
        if (args.participants.length < 2) throw new Error("Groups require at least 2 participants.");

        const newChatId = await ctx.db.insert("conversations", {
            name: args.name,
            isGroup: true,
            participants: args.participants,
            createdBy: args.createdBy,
            updatedAt: Date.now(),
        });

        return newChatId;
    }
});

export const getMyConversations = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const allConversations = await ctx.db.query("conversations").collect();
        const myConversations = allConversations
            .filter(c =>
                (c.participants || []).includes(args.clerkId) ||
                c.participantOne === args.clerkId ||
                c.participantTwo === args.clerkId
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);

        const enrichedConversations = await Promise.all(
            myConversations.map(async (conv) => {
                if (conv.isGroup) {
                    return {
                        ...conv,
                        otherUser: null,
                        unreadCount: 0 // Optional: build unread tracking for groups later
                    };
                } else {
                    const isParticipantOne = conv.participantOne === args.clerkId;
                    const otherParticipantId = isParticipantOne ? conv.participantTwo : conv.participantOne;

                    let finalOtherId = otherParticipantId;
                    if (!finalOtherId && conv.participants) {
                        finalOtherId = conv.participants.find(p => p !== args.clerkId);
                    }

                    const unreadCount = isParticipantOne ? (conv.unread1 || 0) : (conv.unread2 || 0);

                    let otherUser = null;
                    if (finalOtherId) {
                        otherUser = await ctx.db
                            .query("users")
                            .withIndex("by_clerkId", (q) => q.eq("clerkId", finalOtherId!))
                            .unique();
                    }

                    return {
                        ...conv,
                        otherUser,
                        unreadCount
                    };
                }
            })
        );

        return enrichedConversations;
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations"), clerkId: v.string() },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return;
        if (conversation.isGroup) return; // Skip updating unreads for groups currently

        if (conversation.participantOne === args.clerkId) {
            if ((conversation.unread1 || 0) > 0) {
                await ctx.db.patch(args.conversationId, { unread1: 0 });
            }
        } else {
            if ((conversation.unread2 || 0) > 0) {
                await ctx.db.patch(args.conversationId, { unread2: 0 });
            }
        }
    }
});

export const getConversation = query({
    args: { conversationId: v.id("conversations"), clerkId: v.string() },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        if (conversation.isGroup) {
            return {
                ...conversation,
                otherUser: null
            };
        }

        const otherParticipantId =
            conversation.participantOne === args.clerkId
                ? conversation.participantTwo
                : conversation.participantOne;

        let finalOtherId = otherParticipantId;
        if (!finalOtherId && conversation.participants) {
            finalOtherId = conversation.participants.find(p => p !== args.clerkId);
        }

        let otherUser = null;
        if (finalOtherId) {
            otherUser = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", finalOtherId!))
                .unique();
        }

        return {
            ...conversation,
            otherUser,
        };
    },
});

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        clerkId: v.string(),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return;

        let typing = conversation.typing || [];

        if (args.isTyping) {
            if (!typing.includes(args.clerkId)) {
                typing.push(args.clerkId);
            }
        } else {
            typing = typing.filter((id) => id !== args.clerkId);
        }

        await ctx.db.patch(args.conversationId, { typing });
    },
});

