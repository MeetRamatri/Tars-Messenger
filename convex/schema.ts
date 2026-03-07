import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        avatar: v.string(),
        createdAt: v.number(),
        isOnline: v.optional(v.boolean()),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        name: v.optional(v.string()),
        isGroup: v.optional(v.boolean()),
        participants: v.array(v.string()), // array of clerkIds
        createdBy: v.optional(v.string()), // clerkId
        participantOne: v.optional(v.string()), // deprecated
        participantTwo: v.optional(v.string()), // deprecated
        lastMessage: v.optional(v.string()),
        updatedAt: v.number(),
        typing: v.optional(v.array(v.string())),
        unread1: v.optional(v.number()), // deprecated
        unread2: v.optional(v.number()), // deprecated
    }).index("by_participantOne", ["participantOne"])
        .index("by_participantTwo", ["participantTwo"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.string(), // clerkId
        body: v.string(),
        createdAt: v.number(),
        deleted: v.optional(v.boolean()),
        reactions: v.optional(v.array(
            v.object({
                emoji: v.string(),
                users: v.array(v.string()) // array of clerkIds
            })
        )),
    }).index("by_conversationId", ["conversationId"]),
});
