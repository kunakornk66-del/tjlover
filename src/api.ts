// High-Fidelity Client-Side Local Database and API Emulator
// Allows the app to work seamlessly both on full-stack (Express server) and client-only (Vercel) environments.

import { CurrentUser, Couple, Memory, ChatMessage, CalendarEvent, MoodLog } from './types';

export interface DiagnosticLog {
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'system';
  message: string;
  details?: any;
}

const diagnosticLogs: DiagnosticLog[] = [];
let logListeners: (() => void)[] = [];

export function addDiagnosticLog(type: 'request' | 'response' | 'error' | 'system', message: string, details?: any) {
  const newLog: DiagnosticLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details: details ? JSON.parse(JSON.stringify(details)) : undefined
  };
  diagnosticLogs.unshift(newLog);
  if (diagnosticLogs.length > 50) {
    diagnosticLogs.pop();
  }
  logListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

export function getDiagnosticLogs(): DiagnosticLog[] {
  return [...diagnosticLogs];
}

export function subscribeToDiagnosticLogs(listener: () => void) {
  logListeners.push(listener);
  return () => {
    logListeners = logListeners.filter(l => l !== listener);
  };
}

// Seed initial log
addDiagnosticLog('system', 'ระบบการตรวจสอบและวิเคราะห์การซิงค์ข้อมูล (Diagnostics) เริ่มต้นทำงานสำเร็จ');

interface DB {
  users: Record<string, CurrentUser>;
  couples: Record<string, Couple>;
}

// Check if we are forced to run in Local-Only mode
let isLocalOnlyMode = false;

export function setLocalOnlyMode(val: boolean) {
  isLocalOnlyMode = val;
  if (typeof window !== 'undefined') {
    if (val) {
      localStorage.setItem('local_only_mode', 'true');
    } else {
      localStorage.removeItem('local_only_mode');
    }
  }
}

export function getLocalOnlyMode(): boolean {
  return false;
}

// Read/Write Local DB
function loadLocalDB(): DB {
  try {
    const data = localStorage.getItem('local_couple_db');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || {},
        couples: parsed.couples || {},
      };
    }
  } catch (e) {
    console.error('Error reading local storage DB', e);
  }
  return { users: {}, couples: {} };
}

function saveLocalDB(db: DB) {
  try {
    localStorage.setItem('local_couple_db', JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error writing local storage DB', e);
  }
}

// Custom simple mock Response class conforming to Fetch Response shape
class MockResponse {
  ok: boolean;
  status: number;
  private _data: any;

  constructor(status: number, data: any) {
    this.status = status;
    this.ok = status >= 200 && status < 300;
    this._data = data;
  }

  async json() {
    return this._data;
  }

  async text() {
    return JSON.stringify(this._data);
  }
}

// Router matching helper
function matchPattern(pattern: string, url: string): Record<string, string> | null {
  const cleanUrl = url.split('?')[0];
  const patternParts = pattern.split('/');
  const urlParts = cleanUrl.split('/');
  
  if (patternParts.length !== urlParts.length) return null;
  
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const name = patternParts[i].slice(1);
      params[name] = decodeURIComponent(urlParts[i]);
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

// Main Local Emulator Router
async function handleLocalFallback(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const db = loadLocalDB();

  console.info(`[API Emulator] Mocking ${method} ${url}`);

  try {
    // 0.1 POST /api/auth/register-username
    if (method === 'POST' && url.startsWith('/api/auth/register-username')) {
      const { username, passwordHash } = JSON.parse(options?.body as string || '{}');
      if (!username || !passwordHash) {
        return new MockResponse(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วนค่ะ' }) as any;
      }
      
      const cleanedUsername = username.trim();
      // Validate username: only English letters, numbers, and underscores allowed
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(cleanedUsername)) {
        return new MockResponse(400, { error: 'ชื่อผู้ใช้งานต้องเป็นภาษาอังกฤษ ตัวเลข หรือเครื่องหมายขีดล่าง (_) เท่านั้นค่ะ' }) as any;
      }

      const mockEmail = `${cleanedUsername.toLowerCase()}@app.com`;
      
      // Check if username already exists (by checking mock email or username field)
      const existingUser = Object.values(db.users).find(
        (u) => u.username?.toLowerCase() === cleanedUsername.toLowerCase() || u.email.toLowerCase() === mockEmail
      );
      if (existingUser) {
        return new MockResponse(400, { error: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้วค่ะ กรุณาเปลี่ยนชื่อใหม่นะคะ' }) as any;
      }

      // Create new user record
      const newUser: CurrentUser = {
        email: mockEmail,
        username: cleanedUsername,
        name: cleanedUsername,
        passwordHash: passwordHash,
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };

      db.users[mockEmail] = newUser;
      saveLocalDB(db);

      return new MockResponse(200, { success: true, message: 'สมัครสมาชิกสำเร็จแล้วค่ะ สามารถเข้าสู่ระบบได้ทันที!' }) as any;
    }

    // 0.2 POST /api/auth/login-username
    if (method === 'POST' && url.startsWith('/api/auth/login-username')) {
      const { username, passwordHash } = JSON.parse(options?.body as string || '{}');
      if (!username || !passwordHash) {
        return new MockResponse(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วนค่ะ' }) as any;
      }

      const cleanedUsername = username.trim().toLowerCase();
      
      // Find user
      const user = Object.values(db.users).find(
        (u) => u.username?.toLowerCase() === cleanedUsername || u.email.toLowerCase() === `${cleanedUsername}@app.com`
      );

      if (!user) {
        return new MockResponse(401, { error: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบค่ะ' }) as any;
      }

      if (user.passwordHash !== passwordHash) {
        return new MockResponse(401, { error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งค่ะ' }) as any;
      }

      let couple: Couple | null = null;
      if (user.coupleId && db.couples[user.coupleId]) {
        couple = db.couples[user.coupleId];
      } else {
        const foundCouple = Object.values(db.couples).find(
          (c) => c.partnerEmail?.toLowerCase() === user.email.toLowerCase()
        );
        if (foundCouple) {
          user.coupleId = foundCouple.id;
          couple = foundCouple;
          db.users[user.email] = user;
          saveLocalDB(db);
        }
      }

      return new MockResponse(200, { user, couple }) as any;
    }

    // 1. POST /api/auth/login
    if (method === 'POST' && url.startsWith('/api/auth/login')) {
      const { email, name, picture } = JSON.parse(options?.body as string || '{}');
      if (!email) {
        return new MockResponse(400, { error: 'Email is required' }) as any;
      }
      const cleanedEmail = email.toLowerCase().trim();
      let user = db.users[cleanedEmail];
      if (!user) {
        user = {
          email: cleanedEmail,
          name: name || email.split('@')[0],
          picture: picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };
        db.users[cleanedEmail] = user;
        saveLocalDB(db);
      }

      let couple: Couple | null = null;
      if (user.coupleId && db.couples[user.coupleId]) {
        couple = db.couples[user.coupleId];
      } else {
        const foundCouple = Object.values(db.couples).find(
          (c) => c.partnerEmail?.toLowerCase() === cleanedEmail
        );
        if (foundCouple) {
          user.coupleId = foundCouple.id;
          couple = foundCouple;
          db.users[cleanedEmail] = user;
          saveLocalDB(db);
        }
      }
      return new MockResponse(200, { user, couple }) as any;
    }

    // 2.5 POST /api/simple/create (Local Fallback)
    if (method === 'POST' && url.startsWith('/api/simple/create')) {
      const { yourName, partnerName, roomCode, anniversaryDate } = JSON.parse(options?.body as string || '{}');
      if (!yourName || !roomCode) {
        return new MockResponse(400, { error: "กรุณากรอกชื่อเล่นของคุณและรหัสห้องคู่รักด้วยค่ะ" }) as any;
      }

      const normalizedCode = roomCode.toUpperCase().replace(/\s+/g, "").trim();

      // Check if room code already exists in db.couples
      const existingCouple = Object.values(db.couples).find(
        (c) => c.pairingCode.toUpperCase().trim() === normalizedCode
      );
      if (existingCouple) {
        return new MockResponse(400, { error: "รหัสห้องคู่รักนี้ถูกใช้งานแล้วค่ะ กรุณาตั้งรหัสใหม่อื่นๆ นะคะ" }) as any;
      }

      const coupleId = `couple-${normalizedCode}`;
      const ownerEmail = `owner-${normalizedCode}@couple.com`;
      const partnerEmail = `partner-${normalizedCode}@couple.com`;

      const ownerUser: CurrentUser = {
        email: ownerEmail,
        name: yourName.trim(),
        coupleId: coupleId,
        picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
      };

      const couple: Couple = {
        id: coupleId,
        ownerEmail: ownerEmail,
        partnerEmail: partnerEmail,
        pairingCode: normalizedCode,
        relationshipInfo: {
          anniversaryDate: anniversaryDate || new Date().toISOString().split("T")[0],
          userNickname: yourName.trim(),
          partnerNickname: partnerName ? partnerName.trim() : "คุณแฟน 🐰",
          loveMessage: "อยู่รักและเป็นรอยยิ้มของกันและกันแบบนี้ไปทุกๆ วันเลยน้าาา 🥰",
          userAvatar: "🐻",
          partnerAvatar: "🐰"
        },
        memories: [],
        messages: [],
        events: [],
        moodLogs: []
      };

      db.users[ownerEmail] = ownerUser;
      db.couples[coupleId] = couple;

      saveLocalDB(db);
      return new MockResponse(200, { user: ownerUser, couple }) as any;
    }

    // 2.6 POST /api/simple/auth (Local Fallback)
    if (method === 'POST' && url.startsWith('/api/simple/auth')) {
      const { yourName, roomCode } = JSON.parse(options?.body as string || '{}');
      if (!yourName || !roomCode) {
        return new MockResponse(400, { error: "กรุณาระบุชื่อเล่นและรหัสห้องคู่รักเพื่อเข้าใช้งานค่ะ" }) as any;
      }

      const normalizedCode = roomCode.toUpperCase().replace(/\s+/g, "").trim();

      // Find the couple room
      const couple = Object.values(db.couples).find(
        (c) => c.pairingCode.toUpperCase().trim() === normalizedCode
      );

      if (!couple) {
        return new MockResponse(404, { error: `ไม่พบห้องคู่รักที่ตั้งรหัสผ่าน/รหัสห้อง "${normalizedCode}" ในระบบเลยค่ะ กรุณาตรวจสอบรหัสอีกครั้งนะคะ` }) as any;
      }

      const getSimplifiedNameLocal = (name: string): string => {
        if (!name) return "";
        return name
          .toLowerCase()
          .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '') // strip emojis
          .replace(/\s+/g, '') // strip whitespace
          .trim();
      };

      const nameInputClean = getSimplifiedNameLocal(yourName);
      const ownerNameClean = getSimplifiedNameLocal(couple.relationshipInfo.userNickname);
      const partnerNameClean = getSimplifiedNameLocal(couple.relationshipInfo.partnerNickname || '');

      let isOwner = false;
      if (nameInputClean === ownerNameClean) {
        isOwner = true;
      } else if (nameInputClean !== partnerNameClean && partnerNameClean !== "" && partnerNameClean !== "คุณแฟน" && partnerNameClean !== "คุณแฟน🐰") {
        isOwner = false;
      }

      let loggedUser: CurrentUser;
      if (isOwner) {
        const ownerEmail = couple.ownerEmail || `owner-${normalizedCode}@couple.com`;
        let user = db.users[ownerEmail];
        if (!user) {
          user = {
            email: ownerEmail,
            name: yourName.trim(),
            coupleId: couple.id,
            picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          };
          db.users[ownerEmail] = user;
        } else {
          user.name = yourName.trim();
        }
        loggedUser = user;
      } else {
        const partnerEmail = couple.partnerEmail || `partner-${normalizedCode}@couple.com`;
        let user = db.users[partnerEmail];
        if (!user) {
          user = {
            email: partnerEmail,
            name: yourName.trim(),
            coupleId: couple.id,
            picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
          };
          db.users[partnerEmail] = user;
        } else {
          user.name = yourName.trim();
        }

        couple.partnerEmail = partnerEmail;
        if (!couple.relationshipInfo.partnerNickname || couple.relationshipInfo.partnerNickname === "คุณแฟน 🐰") {
          couple.relationshipInfo.partnerNickname = yourName.trim();
        }
        loggedUser = user;
      }

      saveLocalDB(db);
      return new MockResponse(200, { user: loggedUser, couple }) as any;
    }

    // 2. POST /api/couple/create
    if (method === 'POST' && url.startsWith('/api/couple/create')) {
      const { email, partnerEmail } = JSON.parse(options?.body as string || '{}');
      if (!email) {
        return new MockResponse(400, { error: 'Email is required' }) as any;
      }
      const cleanedEmail = email.toLowerCase().trim();
      const cleanedPartner = partnerEmail ? partnerEmail.toLowerCase().trim() : undefined;

      const user = db.users[cleanedEmail];
      if (!user) {
        return new MockResponse(404, { error: 'User not found' }) as any;
      }

      const coupleId = `couple-${Date.now()}`;
      const pairingCode = 'LOVE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const couple: Couple = {
        id: coupleId,
        ownerEmail: cleanedEmail,
        partnerEmail: cleanedPartner,
        pairingCode,
        relationshipInfo: {
          anniversaryDate: new Date().toISOString().split('T')[0],
          userNickname: '',
          partnerNickname: '',
          loveMessage: '',
          userAvatar: '',
          partnerAvatar: '',
        },
        memories: [],
        messages: [],
        events: [],
        moodLogs: [],
      };

      db.couples[coupleId] = couple;
      user.coupleId = coupleId;
      db.users[cleanedEmail] = user;

      if (cleanedPartner && db.users[cleanedPartner]) {
        db.users[cleanedPartner].coupleId = coupleId;
      }

      saveLocalDB(db);
      return new MockResponse(200, { couple, user }) as any;
    }

    // 3. POST /api/couple/set-partner
    if (method === 'POST' && url.startsWith('/api/couple/set-partner')) {
      const { coupleId, partnerEmail } = JSON.parse(options?.body as string || '{}');
      if (!coupleId || !partnerEmail) {
        return new MockResponse(400, { error: 'Missing parameters' }) as any;
      }
      const couple = db.couples[coupleId];
      if (!couple) {
        return new MockResponse(404, { error: 'Couple space not found' }) as any;
      }
      const cleanedPartner = partnerEmail.toLowerCase().trim();
      couple.partnerEmail = cleanedPartner;
      if (db.users[cleanedPartner]) {
        db.users[cleanedPartner].coupleId = coupleId;
      }
      saveLocalDB(db);
      return new MockResponse(200, { couple }) as any;
    }

    // 4. POST /api/couple/join
    if (method === 'POST' && url.startsWith('/api/couple/join')) {
      const { email, pairingCode } = JSON.parse(options?.body as string || '{}');
      if (!email || !pairingCode) {
        return new MockResponse(400, { error: 'Missing parameters' }) as any;
      }
      const cleanedEmail = email.toLowerCase().trim();
      const cleanedCode = pairingCode.toUpperCase().trim();
      const user = db.users[cleanedEmail];
      if (!user) {
        return new MockResponse(404, { error: 'User not found' }) as any;
      }
      const couple = Object.values(db.couples).find((c) => c.pairingCode === cleanedCode);
      if (!couple) {
        return new MockResponse(404, { error: 'รหัสคู่รักไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งค่ะ' }) as any;
      }
      couple.partnerEmail = cleanedEmail;
      user.coupleId = couple.id;
      db.users[cleanedEmail] = user;
      saveLocalDB(db);
      return new MockResponse(200, { couple, user }) as any;
    }

    // 5. POST /api/couple/update-info
    if (method === 'POST' && url.startsWith('/api/couple/update-info')) {
      const { coupleId, info } = JSON.parse(options?.body as string || '{}');
      if (!coupleId || !info) {
        return new MockResponse(400, { error: 'Missing parameters' }) as any;
      }
      const couple = db.couples[coupleId];
      if (!couple) {
        return new MockResponse(404, { error: 'Couple space not found' }) as any;
      }
      couple.relationshipInfo = {
        ...couple.relationshipInfo,
        ...info,
      };
      saveLocalDB(db);
      return new MockResponse(200, { couple }) as any;
    }

    // 6. POST /api/couple/reset
    if (method === 'POST' && url.startsWith('/api/couple/reset')) {
      const { email, coupleId } = JSON.parse(options?.body as string || '{}');
      const cleanedEmail = email?.toLowerCase().trim();
      if (coupleId) {
        Object.keys(db.users).forEach((userEmail) => {
          if (db.users[userEmail].coupleId === coupleId) {
            delete db.users[userEmail].coupleId;
          }
        });
        delete db.couples[coupleId];
      }
      if (cleanedEmail) {
        const user = db.users[cleanedEmail];
        if (user) {
          delete user.coupleId;
        }
      }
      saveLocalDB(db);
      return new MockResponse(200, { success: true, message: 'ล้างข้อมูลทั้งหมดและลบการจับคู่รักสำเร็จแล้วค่ะ' }) as any;
    }

    // 7. GET & POST /api/chats/:coupleId
    let params = matchPattern('/api/chats/:coupleId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      // Extract email query to update lastActive
      let emailQuery = '';
      try {
        const urlObj = new URL(url, 'http://localhost');
        emailQuery = urlObj.searchParams.get('email') || '';
      } catch (e) {
        const matches = url.match(/[?&]email=([^&]+)/);
        if (matches) {
          emailQuery = decodeURIComponent(matches[1]);
        }
      }

      const cleanedEmailQuery = emailQuery.toLowerCase().trim();
      if (cleanedEmailQuery && db.users[cleanedEmailQuery]) {
        db.users[cleanedEmailQuery].lastActive = new Date().toISOString();
        saveLocalDB(db);
      }

      if (method === 'GET') {
        const ownerUser = couple.ownerEmail ? db.users[couple.ownerEmail.toLowerCase().trim()] : undefined;
        const partnerUser = couple.partnerEmail ? db.users[couple.partnerEmail.toLowerCase().trim()] : undefined;

        const messagesWithSeen = (couple.messages || []).map((msg) => {
          let seen = false;
          if (msg.senderId === 'user' && partnerUser && partnerUser.lastActive) {
            seen = new Date(partnerUser.lastActive) >= new Date(msg.timestamp);
          } else if (msg.senderId === 'partner' && ownerUser && ownerUser.lastActive) {
            seen = new Date(ownerUser.lastActive) >= new Date(msg.timestamp);
          }
          return { ...msg, seen };
        });

        // Determine partner's lastActive time relative to the requester
        let partnerLastActive: string | undefined = undefined;
        if (cleanedEmailQuery) {
          const isOwner = cleanedEmailQuery === (couple.ownerEmail || '').toLowerCase().trim() ||
                          cleanedEmailQuery === (ownerUser?.username || '').toLowerCase().trim();
          if (isOwner) {
            partnerLastActive = partnerUser ? partnerUser.lastActive : undefined;
          } else {
            partnerLastActive = ownerUser ? ownerUser.lastActive : undefined;
          }
        } else {
          partnerLastActive = partnerUser ? partnerUser.lastActive : undefined;
        }

        return new MockResponse(200, {
          messages: messagesWithSeen,
          partnerLastActive
        }) as any;
      } else if (method === 'POST') {
        const { message } = JSON.parse(options?.body as string || '{}');
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: message.senderId,
          text: message.text || '',
          timestamp: new Date().toISOString(),
          isEncrypted: false,
          mediaUrl: message.mediaUrl,
          mediaType: message.mediaType,
          seen: false,
        };
        couple.messages = couple.messages || [];
        couple.messages.push(newMessage);
        saveLocalDB(db);
        return new MockResponse(200, newMessage) as any;
      }
    }

    // 8. GET & POST /api/memories/:coupleId
    params = matchPattern('/api/memories/:coupleId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      if (method === 'GET') {
        return new MockResponse(200, couple.memories || []) as any;
      } else if (method === 'POST') {
        const { memory } = JSON.parse(options?.body as string || '{}');
        const newMemory: Memory = {
          id: `mem-${Date.now()}`,
          title: memory.title,
          type: memory.type,
          content: memory.content,
          mediaUrl: memory.mediaUrl,
          mediaUrls: memory.mediaUrls,
          date: new Date().toISOString().split('T')[0],
          creatorId: memory.creatorId,
        };
        couple.memories = couple.memories || [];
        couple.memories.unshift(newMemory);
        saveLocalDB(db);
        return new MockResponse(200, newMemory) as any;
      }
    }

    // 9. PUT & DELETE /api/memories/:coupleId/:memoryId
    params = matchPattern('/api/memories/:coupleId/:memoryId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      if (method === 'DELETE') {
        couple.memories = (couple.memories || []).filter((m) => m.id !== params!.memoryId);
        saveLocalDB(db);
        return new MockResponse(200, { success: true }) as any;
      } else if (method === 'PUT') {
        const { memory } = JSON.parse(options?.body as string || '{}');
        const index = (couple.memories || []).findIndex((m) => m.id === params!.memoryId);
        if (index === -1) return new MockResponse(404, { error: 'Memory not found' }) as any;

        couple.memories[index] = {
          ...couple.memories[index],
          title: memory.title !== undefined ? memory.title : couple.memories[index].title,
          type: memory.type !== undefined ? memory.type : couple.memories[index].type,
          content: memory.content !== undefined ? memory.content : couple.memories[index].content,
          mediaUrl: memory.mediaUrl !== undefined ? memory.mediaUrl : couple.memories[index].mediaUrl,
          mediaUrls: memory.mediaUrls !== undefined ? memory.mediaUrls : couple.memories[index].mediaUrls,
        };
        saveLocalDB(db);
        return new MockResponse(200, couple.memories[index]) as any;
      }
    }

    // 10. GET & POST /api/events/:coupleId
    params = matchPattern('/api/events/:coupleId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      if (method === 'GET') {
        return new MockResponse(200, couple.events || []) as any;
      } else if (method === 'POST') {
        const { event } = JSON.parse(options?.body as string || '{}');
        const newEvent: CalendarEvent = {
          id: `ev-${Date.now()}`,
          title: event.title,
          date: event.date,
          category: event.category,
          notes: event.notes,
          creatorId: event.creatorId,
        };
        couple.events = couple.events || [];
        couple.events.push(newEvent);
        saveLocalDB(db);
        return new MockResponse(200, newEvent) as any;
      }
    }

    // 11. PUT & DELETE /api/events/:coupleId/:eventId
    params = matchPattern('/api/events/:coupleId/:eventId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      if (method === 'DELETE') {
        couple.events = (couple.events || []).filter((e) => e.id !== params!.eventId);
        saveLocalDB(db);
        return new MockResponse(200, { success: true }) as any;
      } else if (method === 'PUT') {
        const { event } = JSON.parse(options?.body as string || '{}');
        const index = (couple.events || []).findIndex((e) => e.id === params!.eventId);
        if (index === -1) return new MockResponse(404, { error: 'Event not found' }) as any;

        couple.events[index] = {
          ...couple.events[index],
          title: event.title !== undefined ? event.title : couple.events[index].title,
          category: event.category !== undefined ? event.category : couple.events[index].category,
          notes: event.notes !== undefined ? event.notes : couple.events[index].notes,
        };
        saveLocalDB(db);
        return new MockResponse(200, couple.events[index]) as any;
      }
    }

    // 12. GET & POST /api/moods/:coupleId
    params = matchPattern('/api/moods/:coupleId', url);
    if (params) {
      const couple = db.couples[params.coupleId];
      if (!couple) return new MockResponse(404, { error: 'Couple not found' }) as any;

      if (method === 'GET') {
        return new MockResponse(200, couple.moodLogs || []) as any;
      } else if (method === 'POST') {
        const { date, mood, note, creatorId } = JSON.parse(options?.body as string || '{}');
        couple.moodLogs = couple.moodLogs || [];
        let todayLog = couple.moodLogs.find((l) => l.date === date);
        if (!todayLog) {
          todayLog = { date };
          couple.moodLogs.unshift(todayLog);
        }
        if (creatorId === 'user') {
          todayLog.userMood = mood;
          if (note !== undefined) todayLog.userNote = note;
        } else {
          todayLog.partnerMood = mood;
          if (note !== undefined) todayLog.partnerNote = note;
        }
        saveLocalDB(db);
        return new MockResponse(200, todayLog) as any;
      }
    }

    return new MockResponse(404, { error: 'API route not found' }) as any;
  } catch (error: any) {
    console.error('[API Emulator Error]', error);
    return new MockResponse(500, { error: error.message || 'Internal simulation error' }) as any;
  }
}

// Global fetch substitute
export async function appFetch(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  addDiagnosticLog('request', `เรียกข้อมูล: [${method}] ${url}`);

  // If Local-Only Mode is active, immediately route all API requests to the local database emulator
  if (getLocalOnlyMode()) {
    addDiagnosticLog('system', `[โหมดออฟไลน์] จำลองข้อมูลในเครื่องสำหรับ ${url}`);
    const localRes = await handleLocalFallback(url, options);
    
    // Log response
    try {
      const cloned = localRes.clone();
      const text = await cloned.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed.error || parsed.err) {
          addDiagnosticLog('error', `พบข้อผิดพลาดจำลอง: ${parsed.error || parsed.err}`, parsed);
        } else {
          addDiagnosticLog('response', `จำลองสำเร็จ (HTTP ${localRes.status}): ${url}`);
        }
      } catch {
        addDiagnosticLog('response', `จำลองสำเร็จ (HTTP ${localRes.status}): ${url}`);
      }
    } catch {}
    
    return localRes;
  }

  const isAuthRoute = url.includes('/api/auth/') || url.includes('/api/simple/');

  try {
    const res = await window.fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const isHtmlResponse = contentType.includes('text/html');
    
    // Check if the response is valid JSON
    let isJson = false;
    let textBody = '';
    try {
      const cloned = res.clone();
      textBody = await cloned.text();
      try {
        JSON.parse(textBody);
        isJson = true;
      } catch {
        isJson = false;
      }
    } catch {
      isJson = false;
    }

    // Only fall back to local emulator if the server returned HTML or non-JSON content
    // (which means Vite served index.html instead of Express API, or there's an Nginx / Cloud Run error page)
    if (isHtmlResponse || !isJson) {
      const trimmedText = textBody.trim();
      const isHtmlText = trimmedText.startsWith('<') || trimmedText.toLowerCase().startsWith('<!doctype') || trimmedText.toLowerCase().startsWith('the page');
      
      if (isHtmlText || res.status === 502 || res.status === 503 || res.status === 504 || isHtmlResponse) {
        addDiagnosticLog('system', `เซิร์ฟเวอร์ตอบกลับไม่เป็น JSON (รหัส ${res.status}) สำหรับ ${url} สลับเข้าโหมดจำลองในเครื่อง`);
        return await handleLocalFallback(url, options);
      }
      
      // If it's a 2xx success but not JSON, wrap in a safe MockResponse
      if (res.ok) {
        return new MockResponse(200, { success: true, text: textBody }) as any;
      } else {
        return new MockResponse(res.status, { error: textBody || 'เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด' }) as any;
      }
    }

    // Otherwise, the server is running and returned a real JSON response.
    // Log live response
    try {
      const parsed = JSON.parse(textBody);
      if (parsed.error || parsed.err) {
        addDiagnosticLog('error', `ข้อผิดพลาดจากเซิร์ฟเวอร์สำหรับ ${url}: ${parsed.error || parsed.err}`, parsed);
      } else if (!res.ok) {
        addDiagnosticLog('error', `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${res.status} สำหรับ ${url}`, parsed);
      } else {
        addDiagnosticLog('response', `เซิร์ฟเวอร์ตอบกลับสำเร็จ (HTTP ${res.status}): ${url}`);
      }
    } catch {
      if (!res.ok) {
        addDiagnosticLog('error', `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${res.status} สำหรับ ${url}`);
      } else {
        addDiagnosticLog('response', `เซิร์ฟเวอร์ตอบกลับสำเร็จ (HTTP ${res.status}): ${url}`);
      }
    }

    return res;
  } catch (err: any) {
    addDiagnosticLog('system', `เซิร์ฟเวอร์ออฟไลน์/เชื่อมต่อไม่ได้สำหรับ ${url} ทำการจำลองในเครื่องแทนค่ะ`, { error: err?.message || err });
    return await handleLocalFallback(url, options);
  }
}
