// High-Fidelity Client-Side Local Database and API Emulator
// Allows the app to work seamlessly both on full-stack (Express server) and client-only (Vercel) environments.

import { CurrentUser, Couple, Memory, ChatMessage, CalendarEvent, MoodLog } from './types';

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
  if (typeof window !== 'undefined') {
    return isLocalOnlyMode || localStorage.getItem('local_only_mode') === 'true';
  }
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
  const isLocal = getLocalOnlyMode();

  if (!isLocal) {
    try {
      const res = await window.fetch(url, options);
      // If Vercel gives standard static routing (fails API routes with 404 or index.html)
      const isHtmlResponse = res.headers.get('content-type')?.includes('text/html');
      
      if (res.status === 404 || isHtmlResponse) {
        console.warn(`Server endpoint for ${url} is not available (HTML/404 received), switching to client fallback mode.`);
        setLocalOnlyMode(true);
        return await handleLocalFallback(url, options);
      }
      return res;
    } catch (err) {
      console.warn(`Express backend offline for ${url}, switching to client fallback mode.`, err);
      setLocalOnlyMode(true);
      return await handleLocalFallback(url, options);
    }
  } else {
    return await handleLocalFallback(url, options);
  }
}
