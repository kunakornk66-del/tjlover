export interface User {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  coupleId?: string;
  avatar?: string;
  customStatus?: string;
}

export interface Couple {
  id: string;
  partner1Id: string;
  partner2Id: string;
  anniversaryDate?: string; // ISO date string YYYY-MM-DD
  themeColor?: string; // Tailwind color class or hex
}

export interface ChatMessage {
  id: string;
  coupleId: string;
  senderId: string;
  senderName: string;
  text: string;
  images?: string[]; // base64 images
  createdAt: string; // ISO string
}

export interface Memory {
  id: string;
  coupleId: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  images: string[]; // base64 images
  createdBy: string;
  creatorName: string;
  createdAt: string;
  likes: string[]; // array of user IDs who liked
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  coupleId: string;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  category: 'anniversary' | 'date' | 'milestone' | 'general';
  createdBy: string;
}
