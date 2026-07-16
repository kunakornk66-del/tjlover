import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to encrypt password using standard SHA-256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Database initial state helper
interface DBState {
  users: any[];
  couples: any[];
  messages: any[];
  memories: any[];
  events: any[];
}

function initDB(): DBState {
  if (!fs.existsSync(DB_FILE)) {
    const initialState: DBState = {
      users: [],
      couples: [],
      messages: [],
      memories: [],
      events: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf8");
    return initialState;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse DB, resetting", error);
    const initialState: DBState = {
      users: [],
      couples: [],
      messages: [],
      memories: [],
      events: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf8");
    return initialState;
  }
}

function saveDB(data: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to DB", err);
  }
}

async function startServer() {
  // Initialize the JSON DB
  let db = initDB();

  const app = express();

  // Support file uploads via Base64 with generous limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware to authenticate user via Authorization header
  const authenticateUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }
    const token = authHeader.substring(7);
    const user = db.users.find(u => u.token === token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    req.user = user;
    next();
  };

  // --- Auth APIs ---

  // Register
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    db = initDB(); // ensure latest state
    const existing = db.users.find(u => u.email === trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const userId = crypto.randomUUID();
    const token = `token-${userId}-${crypto.randomBytes(8).toString("hex")}`;
    const inviteCode = `${name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;
    const coupleId = crypto.randomUUID();

    const newCouple = {
      id: coupleId,
      partner1Id: userId,
      partner2Id: null,
      anniversaryDate: new Date().toISOString().split("T")[0],
      themeColor: "pink"
    };

    const newUser = {
      id: userId,
      email: trimmedEmail,
      passwordHash: hashPassword(password),
      name: name.trim(),
      inviteCode,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      partnerId: null,
      coupleId: coupleId,
      customStatus: "Happy together! 💕",
      token
    };

    db.couples.push(newCouple);
    db.users.push(newUser);
    saveDB(db);

    const { passwordHash, ...userResponse } = newUser;
    res.json({ user: userResponse, token });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const hash = hashPassword(password);
    db = initDB();

    const user = db.users.find(u => u.email === trimmedEmail && u.passwordHash === hash);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate new token on login
    const token = `token-${user.id}-${crypto.randomBytes(8).toString("hex")}`;
    user.token = token;
    saveDB(db);

    const { passwordHash, ...userResponse } = user;
    res.json({ user: userResponse, token });
  });

  // Get current user profile and partner info
  app.get("/api/auth/me", authenticateUser, (req: any, res) => {
    db = initDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let partner = null;
    let couple = null;

    // If user has no coupleId, create a solo room automatically so they can immediately use all features!
    if (!user.coupleId) {
      const coupleId = crypto.randomUUID();
      const newCouple = {
        id: coupleId,
        partner1Id: user.id,
        partner2Id: null,
        anniversaryDate: new Date().toISOString().split("T")[0], // Default anniversary today
        themeColor: "pink"
      };
      user.coupleId = coupleId;
      db.couples.push(newCouple);
      saveDB(db);
    }

    if (user.partnerId) {
      partner = db.users.find(u => u.id === user.partnerId);
      if (partner) {
        // Strip sensitive fields
        partner = {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar,
          customStatus: partner.customStatus
        };
      }
    }

    if (user.coupleId) {
      couple = db.couples.find(c => c.id === user.coupleId);
    }

    const { passwordHash, token, ...userResponse } = user;
    res.json({ user: userResponse, partner, couple });
  });

  // --- Couple connection APIs ---

  // Connect using code or partner's email
  app.post("/api/couple/connect", authenticateUser, (req: any, res) => {
    const { partnerEmailOrCode } = req.body;
    if (!partnerEmailOrCode) {
      return res.status(400).json({ error: "Please provide an invite code or email address" });
    }

    const searchStr = partnerEmailOrCode.trim().toLowerCase();
    db = initDB();

    // Find partner by email or invite code
    const partner = db.users.find(
      u => u.email === searchStr || (u.inviteCode && u.inviteCode.toLowerCase() === searchStr)
    );

    if (!partner) {
      return res.status(404).json({ error: "Partner not found. Double check the code or email." });
    }

    if (partner.id === req.user.id) {
      return res.status(400).json({ error: "You cannot connect with yourself!" });
    }

    if (partner.partnerId && partner.partnerId !== req.user.id) {
      return res.status(400).json({ error: "This partner is already connected to someone else." });
    }

    const me = db.users.find(u => u.id === req.user.id);
    if (me.partnerId && me.partnerId !== partner.id) {
      return res.status(400).json({ error: "You are already connected to someone." });
    }

    // Connect them! Determine which couple room (ID) to keep.
    // If the partner already has a solo room (where partner2Id is null), we'll adopt that room to preserve partner's solo work!
    // Otherwise, we use my existing solo room.
    let targetCoupleId = partner.coupleId || me.coupleId || crypto.randomUUID();

    let coupleObj = db.couples.find(c => c.id === targetCoupleId);
    if (!coupleObj) {
      coupleObj = {
        id: targetCoupleId,
        partner1Id: partner.id,
        partner2Id: me.id,
        anniversaryDate: new Date().toISOString().split("T")[0],
        themeColor: "pink"
      };
      db.couples.push(coupleObj);
    } else {
      // Update the existing room to have both partners
      coupleObj.partner1Id = partner.id;
      coupleObj.partner2Id = me.id;
    }

    me.partnerId = partner.id;
    me.coupleId = targetCoupleId;

    partner.partnerId = me.id;
    partner.coupleId = targetCoupleId;

    saveDB(db);

    res.json({
      success: true,
      couple: coupleObj,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        avatar: partner.avatar,
        customStatus: partner.customStatus
      }
    });
  });

  // Update couple profiles (anniversary, theme, customStatus)
  app.post("/api/couple/update", authenticateUser, (req: any, res) => {
    const { anniversaryDate, customStatus, avatar, name, partnerAvatar } = req.body;
    db = initDB();

    const me = db.users.find(u => u.id === req.user.id);
    if (!me) return res.status(404).json({ error: "User not found" });

    if (customStatus !== undefined) me.customStatus = customStatus;
    if (avatar !== undefined) me.avatar = avatar;
    if (name !== undefined) me.name = name;

    if (partnerAvatar !== undefined && me.partnerId) {
      const partnerUser = db.users.find(u => u.id === me.partnerId);
      if (partnerUser) {
        partnerUser.avatar = partnerAvatar;
      }
    }

    if (anniversaryDate !== undefined && me.coupleId) {
      const couple = db.couples.find(c => c.id === me.coupleId);
      if (couple) {
        couple.anniversaryDate = anniversaryDate;
      }
    }

    saveDB(db);
    res.json({ success: true });
  });

  // --- Private Chat APIs ---

  // Get messages (with simple paging/polling)
  app.get("/api/chats", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    const { since } = req.query;
    db = initDB();

    let coupleMessages = db.messages.filter(m => m.coupleId === me.coupleId);

    if (since) {
      const sinceTime = new Date(since as string).getTime();
      coupleMessages = coupleMessages.filter(m => new Date(m.createdAt).getTime() > sinceTime);
    }

    res.json(coupleMessages);
  });

  // Send message
  app.post("/api/chats/send", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    const { text, images } = req.body;
    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Cannot send empty message" });
    }

    db = initDB();

    const newMessage = {
      id: crypto.randomUUID(),
      coupleId: me.coupleId,
      senderId: me.id,
      senderName: me.name,
      text: text || "",
      images: images || [],
      createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    saveDB(db);

    res.json(newMessage);
  });

  // --- Shared Memories APIs ---

  // Get all memories
  app.get("/api/memories", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    db = initDB();
    const coupleMemories = db.memories
      .filter(m => m.coupleId === me.coupleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(coupleMemories);
  });

  // Create memory (multiple photos)
  app.post("/api/memories/create", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    const { title, content, date, images, category } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: "Title and Date are required" });
    }

    db = initDB();

    const newMemory = {
      id: crypto.randomUUID(),
      coupleId: me.coupleId,
      title: title.trim(),
      content: (content || "").trim(),
      date,
      images: images || [],
      createdBy: me.id,
      creatorName: me.name,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      category: category ? category.trim() : "ทั่วไป 🌸"
    };

    db.memories.push(newMemory);
    saveDB(db);

    res.json(newMemory);
  });

  // Delete memory
  app.delete("/api/memories/:id", authenticateUser, (req: any, res) => {
    const me = req.user;
    const { id } = req.params;

    db = initDB();
    const index = db.memories.findIndex(m => m.id === id && m.coupleId === me.coupleId);
    if (index === -1) {
      return res.status(404).json({ error: "Memory not found" });
    }

    db.memories.splice(index, 1);
    saveDB(db);

    res.json({ success: true });
  });

  // Like / Unlike memory
  app.post("/api/memories/like", authenticateUser, (req: any, res) => {
    const me = req.user;
    const { memoryId } = req.body;

    db = initDB();
    const memory = db.memories.find(m => m.id === memoryId && m.coupleId === me.coupleId);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    const likedIndex = memory.likes.indexOf(me.id);
    if (likedIndex > -1) {
      // Unlike
      memory.likes.splice(likedIndex, 1);
    } else {
      // Like
      memory.likes.push(me.id);
    }

    saveDB(db);
    res.json(memory);
  });

  // Add Comment to memory
  app.post("/api/memories/comment", authenticateUser, (req: any, res) => {
    const me = req.user;
    const { memoryId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    db = initDB();
    const memory = db.memories.find(m => m.id === memoryId && m.coupleId === me.coupleId);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    const newComment = {
      id: crypto.randomUUID(),
      userId: me.id,
      userName: me.name,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    memory.comments.push(newComment);
    saveDB(db);

    res.json(memory);
  });

  // --- Shared Calendar Events APIs ---

  // Get calendar events
  app.get("/api/calendar", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    db = initDB();
    const coupleEvents = db.events.filter(e => e.coupleId === me.coupleId);
    res.json(coupleEvents);
  });

  // Create event
  app.post("/api/calendar/create", authenticateUser, (req: any, res) => {
    const me = req.user;
    if (!me.coupleId) {
      return res.status(400).json({ error: "You are not connected in a couple yet" });
    }

    const { title, date, description, category } = req.body;
    if (!title || !date || !category) {
      return res.status(400).json({ error: "Title, Date, and Category are required" });
    }

    db = initDB();

    const newEvent = {
      id: crypto.randomUUID(),
      coupleId: me.coupleId,
      title: title.trim(),
      date,
      description: (description || "").trim(),
      category,
      createdBy: me.id
    };

    db.events.push(newEvent);
    saveDB(db);

    res.json(newEvent);
  });

  // Delete event
  app.delete("/api/calendar/:id", authenticateUser, (req: any, res) => {
    const me = req.user;
    const { id } = req.params;

    db = initDB();
    const index = db.events.findIndex(e => e.id === id && e.coupleId === me.coupleId);
    if (index === -1) {
      return res.status(404).json({ error: "Event not found" });
    }

    db.events.splice(index, 1);
    saveDB(db);

    res.json({ success: true });
  });

  // Handle Vite Asset Serving & SPA fallback
  const isProduction = process.env.NODE_ENV === "production" || (!fs.existsSync(path.join(process.cwd(), "server.ts")) && fs.existsSync(path.join(process.cwd(), "dist")));

  if (!isProduction) {
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
