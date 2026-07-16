import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "couple_db.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Structure for our persistent database
interface User {
  email: string;
  name: string;
  picture?: string;
  coupleId?: string;
  username?: string;
  passwordHash?: string;
  lastActive?: string;
}

interface RelationshipInfo {
  anniversaryDate: string;
  userNickname: string;
  partnerNickname: string;
  loveMessage?: string;
  userAvatar?: string;
  partnerAvatar?: string;
}

interface Memory {
  id: string;
  title: string;
  type: "photo_album" | "video_album" | "video" | "note";
  mediaUrl?: string;
  mediaUrls?: string[];
  content: string;
  date: string;
  creatorId: "user" | "partner";
}

interface ChatMessage {
  id: string;
  senderId: "user" | "partner";
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: "photo" | "video" | "sticker";
  seen?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: "anniversary" | "date" | "special" | "diary" | "other";
  notes?: string;
  creatorId: "user" | "partner";
}

interface MoodLog {
  date: string;
  userMood?: "happy" | "lovelorn" | "angry" | "tired" | "excited";
  partnerMood?: "happy" | "lovelorn" | "angry" | "tired" | "excited";
  userNote?: string;
  partnerNote?: string;
}

interface Couple {
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

interface DB {
  users: Record<string, User>;
  couples: Record<string, Couple>;
}

// Initial DB template
const initialDB: DB = {
  users: {},
  couples: {}
};

// Database helper functions
function loadDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      if (!data.trim()) {
        return { users: {}, couples: {} };
      }
      const db = JSON.parse(data);
      if (!db.users) db.users = {};
      if (!db.couples) db.couples = {};
      return db;
    }
  } catch (error) {
    console.error("Error reading database file, using fallback:", error);
  }
  return { users: {}, couples: {} };
}

function saveDB(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Generate random pairing code (LOVE-XXXX)
function generatePairingCode(): string {
  const chars = "ACDEFGHJKLMNPQRTUVWXY34679";
  let code = "LOVE-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to create a default couple space
function createDefaultCouple(id: string, ownerEmail: string, partnerEmail?: string): Couple {
  const pairingCode = generatePairingCode();
  const today = new Date().toISOString().split("T")[0];

  return {
    id,
    ownerEmail: ownerEmail.toLowerCase().trim(),
    partnerEmail: partnerEmail ? partnerEmail.toLowerCase().trim() : undefined,
    pairingCode,
    relationshipInfo: {
      anniversaryDate: today,
      userNickname: "",
      partnerNickname: "",
      loveMessage: "",
      userAvatar: "",
      partnerAvatar: ""
    },
    memories: [],
    messages: [],
    events: [],
    moodLogs: []
  };
}

// ------------------- API ROUTES -------------------

// 0.0 Migrate Local DB to Server
app.post("/api/auth/migrate-local-db", (req, res) => {
  const { users, couples } = req.body;
  if (!users && !couples) {
    return res.status(400).json({ error: "Invalid migration data" });
  }

  const db = loadDB();
  let migratedUsersCount = 0;
  let migratedCouplesCount = 0;

  if (users) {
    for (const [key, user] of Object.entries(users)) {
      const cleanedKey = key.toLowerCase().trim();
      if (!db.users[cleanedKey]) {
        db.users[cleanedKey] = user as User;
        migratedUsersCount++;
      } else {
        const existing = db.users[cleanedKey];
        if (!existing.passwordHash && (user as User).passwordHash) {
          existing.passwordHash = (user as User).passwordHash;
        }
        if (!existing.coupleId && (user as User).coupleId) {
          existing.coupleId = (user as User).coupleId;
        }
        if (!existing.username && (user as User).username) {
          existing.username = (user as User).username;
        }
      }
    }
  }

  if (couples) {
    for (const [key, couple] of Object.entries(couples)) {
      if (!db.couples[key]) {
        db.couples[key] = couple as Couple;
        migratedCouplesCount++;
      }
    }
  }

  if (migratedUsersCount > 0 || migratedCouplesCount > 0) {
    saveDB(db);
  }

  return res.json({
    success: true,
    migratedUsersCount,
    migratedCouplesCount,
    message: `ซิงค์บัญชีและห้องคู่รักเรียบร้อยแล้วค่ะ! ย้ายผู้ใช้ ${migratedUsersCount} คน และห้องรัก ${migratedCouplesCount} ห้องเข้าสู่ระบบฐานข้อมูลคลาวด์แล้ว`
  });
});

// Helper to find a user by email or username case-insensitively
function findUserInDB(db: DB, input: string): User | undefined {
  if (!input) return undefined;
  const cleaned = input.toLowerCase().trim();
  if (db.users[cleaned]) {
    return db.users[cleaned];
  }
  return Object.values(db.users).find(
    (u) => u.email.toLowerCase().trim() === cleaned || u.username?.toLowerCase().trim() === cleaned
  );
}

// 0.1 Register with Username and Password
app.post("/api/auth/register-username", (req, res) => {
  const { username, passwordHash } = req.body;
  if (!username || !passwordHash) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วนค่ะ" });
  }

  const cleanedUsername = username.trim();
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(cleanedUsername)) {
    return res.status(400).json({ error: "ชื่อผู้ใช้งานต้องเป็นภาษาอังกฤษ ตัวเลข หรือเครื่องหมายขีดล่าง (_) เท่านั้นค่ะ" });
  }

  const mockEmail = `${cleanedUsername.toLowerCase()}@app.com`;
  const db = loadDB();

  // Check if username already exists
  const existingUser = Object.values(db.users).find(
    (u) => u.username?.toLowerCase() === cleanedUsername.toLowerCase() || u.email.toLowerCase() === mockEmail
  );

  if (existingUser) {
    return res.status(400).json({ error: "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้วค่ะ กรุณาเปลี่ยนชื่อใหม่นะคะ" });
  }

  const newUser: User = {
    email: mockEmail,
    username: cleanedUsername,
    name: cleanedUsername,
    passwordHash: passwordHash,
    picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  };

  db.users[mockEmail] = newUser;
  saveDB(db);

  return res.json({ success: true, message: "สมัครสมาชิกสำเร็จแล้วค่ะ สามารถเข้าสู่ระบบได้ทันที!", user: newUser, couple: null });
});

// 0.2 Login with Username and Password
app.post("/api/auth/login-username", (req, res) => {
  const { username, passwordHash } = req.body;
  if (!username || !passwordHash) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วนค่ะ" });
  }

  const cleanedUsername = username.trim().toLowerCase();
  const db = loadDB();

  const user = Object.values(db.users).find(
    (u) => u.username?.toLowerCase() === cleanedUsername || u.email.toLowerCase() === `${cleanedUsername}@app.com`
  );

  if (!user) {
    return res.status(401).json({ error: "ไม่พบชื่อผู้ใช้งานนี้ในระบบค่ะ" });
  }

  if (user.passwordHash !== passwordHash) {
    return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งค่ะ" });
  }

  let couple: Couple | null = null;
  if (user.coupleId && db.couples[user.coupleId]) {
    couple = db.couples[user.coupleId];
  } else {
    const foundCouple = Object.values(db.couples).find(
      (c) => {
        if (!c.partnerEmail) return false;
        const cleanedPart = c.partnerEmail.toLowerCase().trim();
        return cleanedPart === user.email.toLowerCase().trim() || 
               cleanedPart === user.username?.toLowerCase().trim();
      }
    );
    if (foundCouple) {
      user.coupleId = foundCouple.id;
      couple = foundCouple;
      db.users[user.email.toLowerCase().trim()] = user;
      saveDB(db);
    }
  }

  return res.json({ user, couple });
});

// 1. Authenticate & Fetch Profile
app.post("/api/auth/login", (req, res) => {
  const { email, name, picture } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();

  let user = db.users[cleanedEmail];
  if (!user) {
    // If it's a mock app.com email, DO NOT auto-create it!
    if (cleanedEmail.endsWith("@app.com")) {
      return res.status(401).json({ error: "ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ กรุณาเข้าสู่ระบบใหม่อีกครั้งค่ะ" });
    }
    user = {
      email: cleanedEmail,
      name: name || email.split("@")[0],
      picture: picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };
    db.users[cleanedEmail] = user;
    saveDB(db);
  }

  // If user is already associated with a couple, load it
  let couple: Couple | null = null;
  if (user.coupleId && db.couples[user.coupleId]) {
    couple = db.couples[user.coupleId];
  } else {
    // Check if another user added them as partner
    const foundCouple = Object.values(db.couples).find(
      (c) => {
        if (!c.partnerEmail) return false;
        const cleanedPart = c.partnerEmail.toLowerCase().trim();
        return cleanedPart === cleanedEmail || 
               cleanedPart === user.username?.toLowerCase().trim();
      }
    );
    if (foundCouple) {
      user.coupleId = foundCouple.id;
      couple = foundCouple;
      db.users[cleanedEmail] = user;
      saveDB(db);
    }
  }

  res.json({ user, couple });
});

// Helper to strip emojis, whitespace, and convert to lower case for ultra-robust matching
function getSimplifiedName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '') // strip emojis
    .replace(/\s+/g, '') // strip whitespace
    .trim();
}

// 1.5 Simplified Email Login
app.post("/api/simple/login", (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "กรุณาระบุอีเมลเพื่อใช้เข้าสู่ระบบด้วยค่ะ" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();
  const cleanedName = name ? name.trim() : email.split("@")[0];

  let user = db.users[cleanedEmail];
  if (!user) {
    user = {
      email: cleanedEmail,
      name: cleanedName,
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };
    db.users[cleanedEmail] = user;
  } else {
    // Keep or update name if provided
    if (name && name.trim()) {
      user.name = cleanedName;
    }
  }

  // Look up if this email is associated with an existing couple room
  let couple = null;
  if (user.coupleId && db.couples[user.coupleId]) {
    couple = db.couples[user.coupleId];
  } else {
    const foundCouple = Object.values(db.couples).find(
      (c) => (c.ownerEmail?.toLowerCase().trim() === cleanedEmail || c.partnerEmail?.toLowerCase().trim() === cleanedEmail)
    );
    if (foundCouple) {
      user.coupleId = foundCouple.id;
      couple = foundCouple;
      db.users[cleanedEmail] = user;
    }
  }

  saveDB(db);
  res.json({ user, couple });
});

// 1.6 Create a new Couple Space (Email-centric)
app.post("/api/simple/create-space", (req, res) => {
  const { email, name, anniversaryDate } = req.body;
  if (!email) {
    return res.status(400).json({ error: "กรุณาเข้าสู่ระบบก่อนสร้างพื้นที่ห้องคู่รักค่ะ" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();
  const cleanedName = name ? name.trim() : email.split("@")[0];

  let user = db.users[cleanedEmail];
  if (!user) {
    user = {
      email: cleanedEmail,
      name: cleanedName,
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };
    db.users[cleanedEmail] = user;
  }

  const coupleId = `couple-${Date.now()}`;
  const couple = createDefaultCouple(coupleId, cleanedEmail);
  couple.relationshipInfo = {
    anniversaryDate: anniversaryDate || new Date().toISOString().split("T")[0],
    userNickname: cleanedName,
    partnerNickname: "คุณแฟน 🐰",
    loveMessage: "อยู่รักและเป็นรอยยิ้มของกันและกันแบบนี้ไปทุกๆ วันเลยน้าาา 🥰",
    userAvatar: "🐻",
    partnerAvatar: "🐰"
  };

  db.couples[coupleId] = couple;
  user.coupleId = coupleId;
  db.users[cleanedEmail] = user;

  saveDB(db);
  res.json({ user, couple });
});

// 1.7 Link/Join Couple Space by Pairing Code (Email-centric)
app.post("/api/simple/link-space", (req, res) => {
  const { email, name, pairingCode } = req.body;
  if (!email || !pairingCode) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน กรุณาระบุรหัสคู่รักด้วยค่ะ" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();
  const cleanedName = name ? name.trim() : email.split("@")[0];

  let user = db.users[cleanedEmail];
  if (!user) {
    user = {
      email: cleanedEmail,
      name: cleanedName,
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };
    db.users[cleanedEmail] = user;
  }

  let cleanedCode = pairingCode.toUpperCase().replace(/\s+/g, "").trim();
  if (cleanedCode.length === 4) {
    cleanedCode = "LOVE-" + cleanedCode;
  }

  const couple = Object.values(db.couples).find(
    (c) => c.pairingCode.toUpperCase().trim() === cleanedCode
  );

  if (!couple) {
    return res.status(404).json({
      error: `ไม่พบห้องคู่รักรหัส "${cleanedCode}" ในระบบเลยค่ะ รบกวนให้ทางแฟนของคุณแจ้งรหัสที่แสดงอยู่บนหน้าจอด้านบนให้ถูกต้องนะคะ`
    });
  }

  // If already owner, just join
  if (couple.ownerEmail.toLowerCase().trim() === cleanedEmail) {
    user.coupleId = couple.id;
    db.users[cleanedEmail] = user;
  } else {
    // Link as partner
    couple.partnerEmail = cleanedEmail;
    couple.relationshipInfo.partnerNickname = cleanedName;
    user.coupleId = couple.id;
    db.users[cleanedEmail] = user;
  }

  saveDB(db);
  res.json({ user, couple });
});

// 2. Create a new Couple Space (First User / Owner)
app.post("/api/couple/create", (req, res) => {
  const { email, partnerEmail, pairingCode } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();
  const cleanedPartner = partnerEmail ? partnerEmail.toLowerCase().trim() : undefined;

  const user = findUserInDB(db, cleanedEmail);
  if (!user) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานที่พยายามสร้างห้องคู่รักในระบบฐานข้อมูลค่ะ" });
  }

  const coupleId = `couple-${Date.now()}`;
  // Always use user's official email key to link ownership
  const couple = createDefaultCouple(coupleId, user.email, cleanedPartner);

  if (pairingCode) {
    let cleanedCode = pairingCode.toUpperCase().replace(/\s+/g, "").trim();
    if (cleanedCode.length === 4) {
      cleanedCode = "LOVE-" + cleanedCode;
    } else if (cleanedCode.length === 8 && cleanedCode.startsWith("LOVE")) {
      cleanedCode = "LOVE-" + cleanedCode.substring(4);
    }
    couple.pairingCode = cleanedCode;
  }

  db.couples[coupleId] = couple;
  user.coupleId = coupleId;
  db.users[user.email.toLowerCase().trim()] = user;

  // If partner email/username is provided, we can pre-assign if they already exist
  if (cleanedPartner) {
    const partnerUser = findUserInDB(db, cleanedPartner);
    if (partnerUser) {
      partnerUser.coupleId = coupleId;
      db.users[partnerUser.email.toLowerCase().trim()] = partnerUser;
      // Update couple's partnerEmail with partner's official email key
      couple.partnerEmail = partnerUser.email.toLowerCase().trim();
    }
  }

  saveDB(db);
  res.json({ couple, user });
});

// 3. Set or Update Partner's Email (Owner setting up partner)
app.post("/api/couple/set-partner", (req, res) => {
  const { coupleId, partnerEmail } = req.body;
  if (!coupleId || !partnerEmail) {
    return res.status(400).json({ error: "Couple ID and partner email are required" });
  }

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) {
    return res.status(404).json({ error: "Couple space not found" });
  }

  const cleanedPartner = partnerEmail.toLowerCase().trim();
  
  // Find partner by email or username
  const partnerUser = findUserInDB(db, cleanedPartner);
  if (partnerUser) {
    couple.partnerEmail = partnerUser.email.toLowerCase().trim();
    partnerUser.coupleId = coupleId;
    db.users[partnerUser.email.toLowerCase().trim()] = partnerUser;
  } else {
    // Fallback if not found yet, assign as literal string
    couple.partnerEmail = cleanedPartner;
  }

  saveDB(db);
  res.json({ couple });
});

// 4. Join an existing Couple Space using Pairing Code (Partner) or Partner's Username/Email
app.post("/api/couple/join", (req, res) => {
  const { email, pairingCode } = req.body;
  if (!email || !pairingCode) {
    return res.status(400).json({ error: "Email and pairing code are required" });
  }

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();
  
  const user = findUserInDB(db, cleanedEmail);
  if (!user) {
    return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานที่พยายามเชื่อมต่อในระบบฐานข้อมูลค่ะ (เคล็ดลับ: กรุณาตรวจสอบว่าคุณล็อกอินด้วยชื่อผู้ใช้ที่สมัครแล้วเสร็จสมบูรณ์นะคะ)" });
  }

  // Normalize code
  let cleanedCode = pairingCode.toUpperCase().replace(/\s+/g, "").trim();
  
  if (cleanedCode.length === 4) {
    cleanedCode = "LOVE-" + cleanedCode;
  } 
  else if (cleanedCode.length === 8 && cleanedCode.startsWith("LOVE")) {
    cleanedCode = "LOVE-" + cleanedCode.substring(4);
  }

  // 1. Try to find the couple by pairing code first
  let couple = Object.values(db.couples).find((c) => c.pairingCode.toUpperCase().trim() === cleanedCode);

  // 2. If not found, try to search pairingCode as a Username or Email of the partner
  if (!couple) {
    const partnerUser = findUserInDB(db, pairingCode);
    if (partnerUser && partnerUser.coupleId && db.couples[partnerUser.coupleId]) {
      couple = db.couples[partnerUser.coupleId];
    }
  }

  if (!couple) {
    return res.status(404).json({ 
      error: "ไม่พบห้องคู่รักจากข้อมูลที่ระบุค่ะ กรุณาตรวจสอบรหัสโปรแกรมคู่รัก (เช่น MGPH), ชื่อผู้ใช้งานของแฟน (เช่น kunakorn) หรืออีเมลของแฟนคุณอีกครั้งนะคะ" 
    });
  }

  // Bind partner email and link the user
  couple.partnerEmail = user.email.toLowerCase().trim();
  user.coupleId = couple.id;
  db.users[user.email.toLowerCase().trim()] = user;

  saveDB(db);
  res.json({ couple, user });
});

// 5. Update relationship info
app.post("/api/couple/update-info", (req, res) => {
  const { coupleId, info } = req.body;
  if (!coupleId || !info) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) {
    return res.status(404).json({ error: "Couple space not found" });
  }

  couple.relationshipInfo = {
    ...couple.relationshipInfo,
    ...info
  };

  saveDB(db);
  res.json({ couple });
});

// 6. Get & Post Chat Messages (With auto-replies)
app.get("/api/chats/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const { email } = req.query;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const requesterEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  if (requesterEmail) {
    const user = findUserInDB(db, requesterEmail);
    if (user) {
      user.lastActive = new Date().toISOString();
      db.users[user.email.toLowerCase().trim()] = user;
      saveDB(db);
    }
  }

  const ownerUser = couple.ownerEmail ? findUserInDB(db, couple.ownerEmail) : undefined;
  const partnerUser = couple.partnerEmail ? findUserInDB(db, couple.partnerEmail) : undefined;

  const messagesWithSeen = (couple.messages || []).map((msg) => {
    let seen = false;
    if (msg.senderId === "user" && partnerUser && partnerUser.lastActive) {
      seen = new Date(partnerUser.lastActive) >= new Date(msg.timestamp);
    } else if (msg.senderId === "partner" && ownerUser && ownerUser.lastActive) {
      seen = new Date(ownerUser.lastActive) >= new Date(msg.timestamp);
    }
    return { ...msg, seen };
  });

  // Determine partner's lastActive time relative to the requester
  let partnerLastActive: string | undefined = undefined;
  if (requesterEmail) {
    const isOwner = requesterEmail === (couple.ownerEmail || "").toLowerCase().trim() ||
                    requesterEmail === (ownerUser?.username || "").toLowerCase().trim();
    if (isOwner) {
      partnerLastActive = partnerUser ? partnerUser.lastActive : undefined;
    } else {
      partnerLastActive = ownerUser ? ownerUser.lastActive : undefined;
    }
  } else {
    partnerLastActive = partnerUser ? partnerUser.lastActive : undefined;
  }

  res.json({
    messages: messagesWithSeen,
    partnerLastActive
  });
});

app.post("/api/chats/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const { email } = req.query;
  const { message } = req.body; // { text, senderId, mediaUrl, mediaType }
  if (!coupleId || !message || !message.senderId || (!message.text && !message.mediaUrl)) {
    return res.status(400).json({ error: "Invalid message data" });
  }

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const requesterEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  if (requesterEmail) {
    const user = findUserInDB(db, requesterEmail);
    if (user) {
      user.lastActive = new Date().toISOString();
      db.users[user.email.toLowerCase().trim()] = user;
    }
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    senderId: message.senderId,
    text: message.text || "",
    timestamp: new Date().toISOString(),
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    seen: false,
  };

  couple.messages.push(newMessage);
  saveDB(db);
  res.json(newMessage);
});

// 7. Memories Endpoints
app.get("/api/memories/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });
  res.json(couple.memories);
});

app.post("/api/memories/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const { memory } = req.body; // { title, type, mediaUrl, content, creatorId }
  if (!coupleId || !memory) return res.status(400).json({ error: "Invalid memory data" });

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const newMemory: Memory = {
    id: `mem-${Date.now()}`,
    title: memory.title,
    type: memory.type,
    mediaUrl: memory.mediaUrl,
    mediaUrls: memory.mediaUrls,
    content: memory.content,
    date: new Date().toISOString().split("T")[0],
    creatorId: memory.creatorId
  };

  couple.memories.unshift(newMemory);
  saveDB(db);
  res.json(newMemory);
});

app.delete("/api/memories/:coupleId/:memoryId", (req, res) => {
  const { coupleId, memoryId } = req.params;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  couple.memories = couple.memories.filter((m) => m.id !== memoryId);
  saveDB(db);
  res.json({ success: true });
});

app.put("/api/memories/:coupleId/:memoryId", (req, res) => {
  const { coupleId, memoryId } = req.params;
  const { memory } = req.body;
  if (!coupleId || !memoryId || !memory) return res.status(400).json({ error: "Invalid memory data" });

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const index = couple.memories.findIndex((m) => m.id === memoryId);
  if (index === -1) return res.status(404).json({ error: "Memory not found" });

  couple.memories[index] = {
    ...couple.memories[index],
    title: memory.title !== undefined ? memory.title : couple.memories[index].title,
    type: memory.type !== undefined ? memory.type : couple.memories[index].type,
    content: memory.content !== undefined ? memory.content : couple.memories[index].content,
    mediaUrl: memory.mediaUrl !== undefined ? memory.mediaUrl : couple.memories[index].mediaUrl,
    mediaUrls: memory.mediaUrls !== undefined ? memory.mediaUrls : couple.memories[index].mediaUrls,
  };

  saveDB(db);
  res.json(couple.memories[index]);
});

// 8. Events Endpoints
app.get("/api/events/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });
  res.json(couple.events);
});

app.post("/api/events/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const { event } = req.body;
  if (!coupleId || !event) return res.status(400).json({ error: "Invalid event data" });

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const newEvent: CalendarEvent = {
    id: `ev-${Date.now()}`,
    title: event.title,
    date: event.date,
    category: event.category,
    notes: event.notes,
    creatorId: event.creatorId
  };

  couple.events.push(newEvent);
  saveDB(db);
  res.json(newEvent);
});

app.delete("/api/events/:coupleId/:eventId", (req, res) => {
  const { coupleId, eventId } = req.params;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  couple.events = couple.events.filter((e) => e.id !== eventId);
  saveDB(db);
  res.json({ success: true });
});

app.put("/api/events/:coupleId/:eventId", (req, res) => {
  const { coupleId, eventId } = req.params;
  const { event } = req.body;
  if (!coupleId || !eventId || !event) return res.status(400).json({ error: "Invalid event data" });

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  const index = couple.events.findIndex((e) => e.id === eventId);
  if (index === -1) return res.status(404).json({ error: "Event not found" });

  couple.events[index] = {
    ...couple.events[index],
    title: event.title !== undefined ? event.title : couple.events[index].title,
    category: event.category !== undefined ? event.category : couple.events[index].category,
    notes: event.notes !== undefined ? event.notes : couple.events[index].notes,
  };

  saveDB(db);
  res.json(couple.events[index]);
});

// 9. Moods Endpoints
app.get("/api/moods/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });
  res.json(couple.moodLogs);
});

app.post("/api/moods/:coupleId", (req, res) => {
  const { coupleId } = req.params;
  const { date, mood, note, creatorId } = req.body; // creatorId is "user" or "partner"
  if (!coupleId || !date || !mood || !creatorId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const db = loadDB();
  const couple = db.couples[coupleId];
  if (!couple) return res.status(404).json({ error: "Not found" });

  let todayLog = couple.moodLogs.find((l) => l.date === date);
  if (!todayLog) {
    todayLog = { date };
    couple.moodLogs.unshift(todayLog);
  }

  if (creatorId === "user") {
    todayLog.userMood = mood;
    if (note !== undefined) todayLog.userNote = note;
  } else {
    todayLog.partnerMood = mood;
    if (note !== undefined) todayLog.partnerNote = note;
  }

  saveDB(db);
  res.json(todayLog);
});

// 10. Factory Reset / Wipe Data
app.post("/api/couple/reset", (req, res) => {
  const { email, coupleId } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const db = loadDB();
  const cleanedEmail = email.toLowerCase().trim();

  // If specific coupleId is provided, we completely delete the couple space and unlink all associated users
  if (coupleId) {
    Object.keys(db.users).forEach((userEmail) => {
      if (db.users[userEmail].coupleId === coupleId) {
        delete db.users[userEmail].coupleId;
      }
    });
    delete db.couples[coupleId];
  }

  // Also ensure the requesting user's coupleId is removed
  const user = findUserInDB(db, cleanedEmail);
  if (user) {
    delete user.coupleId;
    db.users[user.email.toLowerCase().trim()] = user;
  }
  
  // Save changes
  saveDB(db);
  res.json({ success: true, message: "ล้างข้อมูลทั้งหมดและลบการจับคู่รักสำเร็จแล้วค่ะ" });
});

// ------------------- VITE & STATIC FILE SERVING -------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
