export interface Profile {
  id: 'user' | 'partner';
  name: string;
  avatarUrl: string;
  color: string;
  emoji: string;
}

export interface Memory {
  id: string;
  title: string;
  type: 'photo_album' | 'video_album' | 'video' | 'note';
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  date: string;
  creatorId: 'user' | 'partner';
}

export interface ChatMessage {
  id: string;
  senderId: 'user' | 'partner';
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'sticker';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: 'anniversary' | 'date' | 'special' | 'diary' | 'other';
  notes?: string;
  creatorId: 'user' | 'partner';
}

export interface MoodLog {
  date: string; // YYYY-MM-DD
  userMood?: string; // emoji or mood key
  partnerMood?: string; // emoji or mood key
  userNote?: string;
  partnerNote?: string;
}

export interface RelationshipInfo {
  anniversaryDate: string; // YYYY-MM-DD
  userNickname: string;
  partnerNickname: string;
  loveMessage: string;
  userAvatar?: string;
  partnerAvatar?: string;
}

export interface CurrentUser {
  email: string;
  name: string;
  picture?: string;
  coupleId?: string;
  username?: string;
  passwordHash?: string;
}

export interface Couple {
  id: string;
  ownerEmail: string;
  partnerEmail?: string;
  pairingCode: string;
  relationshipInfo: RelationshipInfo;
  memories: Memory[];
  messages: ChatMessage[];
  events: CalendarEvent[];
  moodLogs: MoodLog[];
}

