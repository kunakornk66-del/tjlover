import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  email: text("email").primaryKey(),
  data: jsonb("data").$type<{
    email: string;
    name: string;
    picture?: string;
    coupleId?: string;
    username?: string;
    passwordHash?: string;
    lastActive?: string;
  }>().notNull(),
});

export const couples = pgTable("couples", {
  id: text("id").primaryKey(),
  pairingCode: text("pairing_code").notNull(),
  data: jsonb("data").$type<{
    id: string;
    ownerEmail: string;
    partnerEmail?: string;
    pairingCode: string;
    relationshipInfo: {
      anniversaryDate: string;
      userNickname: string;
      partnerNickname: string;
      loveMessage?: string;
      userAvatar?: string;
      partnerAvatar?: string;
    };
    memories: Array<{
      id: string;
      title: string;
      type: "photo_album" | "video_album" | "video" | "note";
      mediaUrl?: string;
      mediaUrls?: string[];
      content: string;
      date: string;
      creatorId: "user" | "partner";
    }>;
    messages: Array<{
      id: string;
      senderId: "user" | "partner";
      text: string;
      timestamp: string;
      mediaUrl?: string;
      mediaType?: "photo" | "video" | "sticker";
      seen?: boolean;
    }>;
    events: Array<{
      id: string;
      title: string;
      date: string;
      category: "anniversary" | "date" | "special" | "diary" | "other";
      notes?: string;
      creatorId: "user" | "partner";
    }>;
    moodLogs: Array<{
      date: string;
      userMood?: "happy" | "lovelorn" | "angry" | "tired" | "excited";
      partnerMood?: "happy" | "lovelorn" | "angry" | "tired" | "excited";
      userNote?: string;
      partnerNote?: string;
    }>;
  }>().notNull(),
});
