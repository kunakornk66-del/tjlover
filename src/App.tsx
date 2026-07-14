import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, LogIn, Lock, Bell, CheckCircle2, User, Smile, MessageCircle, Calendar, ShieldCheck, HeartHandshake, LogOut, ArrowRight, Compass, Settings, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Memory, ChatMessage, CalendarEvent, MoodLog, RelationshipInfo, CurrentUser, Couple } from './types';
import { appFetch, getLocalOnlyMode, setLocalOnlyMode } from './api';
import AnniversarySection from './components/AnniversarySection';
import CalendarSection from './components/CalendarSection';
import MemoryBoxSection from './components/MemoryBoxSection';
import ChatSection from './components/ChatSection';
import MoodLoggerSection from './components/MoodLoggerSection';
import SecuritySection from './components/SecuritySection';
import DailyFlashbackReminder from './components/DailyFlashbackReminder';

// Custom Notification Interface
interface BannerNotification {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'love' | 'security';
}

// Simple client-side JWT decoder for Google credential
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

export default function App() {
  // 1. Current Session States
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('couple_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading couple_user:', e);
    }
    return null;
  });

  const [currentCouple, setCurrentCouple] = useState<Couple | null>(null);

  // Fallback states for when database hasn't loaded yet
  const [relationshipInfo, setRelationshipInfo] = useState<RelationshipInfo>({
    anniversaryDate: '2025-01-14',
    userNickname: 'คุณหมีน้อย 🐻',
    partnerNickname: 'คุณกระต่ายอ้วน 🐰',
    loveMessage: 'การได้พบเธอคือสิ่งที่ดีที่สุดในชีวิตรักของฉันเลยนะค้าบ อยู่รักและเป็นรอยยิ้มของกันและกันแบบนี้ไปทุกๆ วันเลยน้าาา 🥰',
  });

  const [memories, setMemories] = useState<Memory[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);

  // Local state for Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginAvatar, setLoginAvatar] = useState('🐻');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Custom Username & Password Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSwitchAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setLoginUsername('');
    setLoginPassword('');
    setSignUpUsername('');
    setSignUpPassword('');
    setAuthMessage(null);
  };

  // Local state for Couple Setup
  const [setupMode, setSetupMode] = useState<'create' | 'join'>('create');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerNicknameInput, setPartnerNicknameInput] = useState('คุณกระต่ายอ้วน 🐰');
  const [userNicknameInput, setUserNicknameInput] = useState('คุณหมีน้อย 🐻');
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [isSettingUpSpace, setIsSettingUpSpace] = useState(false);

  // Active user role tag ("user" or "partner")
  const [activeUser, setActiveUser] = useState<'user' | 'partner'>('user');

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'memories' | 'chat' | 'mood' | 'security'>('home');

  // 3. Notification State
  const [notifications, setNotifications] = useState<BannerNotification[]>([]);

  // Function to push new beautiful dynamic banner alert toast
  const triggerNotification = (message: string, type: 'info' | 'love' | 'security' = 'info') => {
    const newNotif: BannerNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: new Date(),
      type,
    };
    setNotifications((old) => [newNotif, ...old]);

    // Automatically remove after 5 seconds
    setTimeout(() => {
      setNotifications((old) => old.filter((n) => n.id !== newNotif.id));
    }, 5000);
  };

  // 4. Synchronization and fetching from backend Express API
  const fetchCoupleData = async (coupleId: string) => {
    try {
      const res = await appFetch(`/api/chats/${coupleId}`);
      if (res.ok) {
        const chats = await res.json();
        setMessages(chats);
      }

      const resMemories = await appFetch(`/api/memories/${coupleId}`);
      if (resMemories.ok) {
        const mems = await resMemories.json();
        setMemories(mems);
      }

      const resEvents = await appFetch(`/api/events/${coupleId}`);
      if (resEvents.ok) {
        const evs = await resEvents.json();
        setEvents(evs);
      }

      const resMoods = await appFetch(`/api/moods/${coupleId}`);
      if (resMoods.ok) {
        const moods = await resMoods.json();
        setMoodLogs(moods);
      }
    } catch (e) {
      console.error("Error fetching couple shared data:", e);
    }
  };

  // Pull relationship state periodically and solve identity role
  useEffect(() => {
    if (currentUser && currentUser.coupleId && currentCouple) {
      // Determine user role tag automatically:
      // If logged-in email is the couple owner, they are "user" (first person).
      // If logged-in email is the couple partner, they are "partner" (second person).
      if (currentUser.email.toLowerCase().trim() === currentCouple.ownerEmail.toLowerCase().trim()) {
        setActiveUser('user');
      } else {
        setActiveUser('partner');
      }
    }
  }, [currentUser, currentCouple]);

  // Handle Login submission
  const handleLogin = async (email: string, name?: string, picture?: string) => {
    setIsLoggingIn(true);
    try {
      // Clear all existing states before fetching new login session to avoid bleed-over
      setMessages([]);
      setMemories([]);
      setEvents([]);
      setMoodLogs([]);

      const response = await appFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, picture }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('couple_user', JSON.stringify(data.user));

        if (data.couple) {
          setCurrentCouple(data.couple);
          setRelationshipInfo(data.couple.relationshipInfo);
          fetchCoupleData(data.couple.id);
          triggerNotification(`💖 ล็อกอินสำเร็จ ยินดีต้อนรับกลับบ้านของสองเราค่ะ!`, 'love');
        } else {
          setCurrentCouple(null);
          setRelationshipInfo({
            anniversaryDate: new Date().toISOString().split('T')[0],
            userNickname: '',
            partnerNickname: '',
            loveMessage: '',
            userAvatar: '',
            partnerAvatar: '',
          });
          triggerNotification(`🌱 ล็อกอินสำเร็จแล้วค่ะ! ขั้นตอนต่อไปมาเริ่มเชื่อมต่อหัวใจกันน้า`, 'info');
        }
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ระบบล็อกอินได้');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fallback pure JS SHA-256 for non-secure contexts / iframes
  const sha256Fallback = (ascii: string): string => {
    const rightRotate = (value: number, amount: number) => {
      return (value >>> amount) | (value << (32 - amount));
    };
    
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    const result = [];

    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const primes: number[] = [];
    const isPrime = (n: number) => {
      for (let factor = 2; factor * factor <= n; factor++) {
        if (n % factor === 0) return false;
      }
      return true;
    };
    let candidate = 2;
    while (primes.length < 64) {
      if (isPrime(candidate)) primes.push(candidate);
      candidate++;
    }

    const getFractionalBits = (val: number) => {
      return ((val - Math.floor(val)) * maxWord) | 0;
    };

    for (i = 0; i < 8; i++) {
      hash[i] = getFractionalBits(mathPow(primes[i], 1 / 2));
    }
    for (i = 0; i < 64; i++) {
      k[i] = getFractionalBits(mathPow(primes[i], 1 / 3));
    }

    let asciiBitLength = ascii.length * 8;
    const asciiBytes = [];
    for (i = 0; i < ascii.length; i++) {
      asciiBytes[i] = ascii.charCodeAt(i) & 0xff;
    }

    asciiBytes.push(0x80);
    while ((asciiBytes.length * 8) % 512 !== 448) {
      asciiBytes.push(0x00);
    }

    const lengthBuffer = new ArrayBuffer(8);
    const lengthView = new DataView(lengthBuffer);
    lengthView.setUint32(0, Math.floor(asciiBitLength / maxWord));
    lengthView.setUint32(4, asciiBitLength % maxWord);
    for (i = 0; i < 8; i++) {
      asciiBytes.push(lengthView.getUint8(i));
    }

    const totalBytes = asciiBytes.length;
    for (i = 0; i < totalBytes; i += 64) {
      const w = new Array(64);
      for (j = 0; j < 16; j++) {
        w[j] =
          (asciiBytes[i + j * 4] << 24) |
          (asciiBytes[i + j * 4 + 1] << 16) |
          (asciiBytes[i + j * 4 + 2] << 8) |
          asciiBytes[i + j * 4 + 3];
      }
      for (j = 16; j < 64; j++) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      let [a, b, c, d, e, f, g, h] = hash;

      for (j = 0; j < 64; j++) {
        const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
        const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }

    for (i = 0; i < 8; i++) {
      const val = hash[i] >>> 0;
      let hex = val.toString(16);
      while (hex.length < 8) {
        hex = '0' + hex;
      }
      result.push(hex);
    }

    return result.join('');
  };

  // Hash function with fallback
  const computeHash = async (text: string): Promise<string> => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('Crypto API not fully available, falling back to pure JS hash:', e);
    }
    return sha256Fallback(text);
  };

  // Sign Up / Register using Username and Password
  const handleUsernameRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    
    const usernameTrimmed = signUpUsername.trim();
    if (!usernameTrimmed) {
      setAuthMessage({ text: 'กรุณากรอกชื่อผู้ใช้งานค่ะ', type: 'error' });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameTrimmed)) {
      setAuthMessage({ text: 'ชื่อผู้ใช้งานต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่าง (_) เท่านั้นค่ะ', type: 'error' });
      return;
    }

    if (signUpPassword.length < 6) {
      setAuthMessage({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรค่ะ', type: 'error' });
      return;
    }

    setIsLoggingIn(true);
    try {
      const passwordHash = await computeHash(signUpPassword);
      const response = await appFetch('/api/auth/register-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameTrimmed, passwordHash }),
      });

      const data = await response.json();
      if (response.ok) {
        // Successful registration: DO NOT login automatically!
        // Show success message and transition to login tab with inputs cleared.
        setAuthMode('login');
        setLoginUsername(usernameTrimmed);
        setLoginPassword('');
        setSignUpUsername('');
        setSignUpPassword('');
        setAuthMessage({ text: data.message || 'สมัครสมาชิกสำเร็จแล้วค่ะ! กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบนะคะ', type: 'success' });
        triggerNotification('✅ สมัครสมาชิกสำเร็จแล้วค่ะ! กรุณาเข้าสู่ระบบนะคะ', 'info');
      } else {
        setAuthMessage({ text: data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAuthMessage({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อสมัครสมาชิกได้ค่ะ', type: 'error' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign In / Login using Username and Password
  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);

    const usernameTrimmed = loginUsername.trim();
    if (!usernameTrimmed || !loginPassword) {
      setAuthMessage({ text: 'กรุณากรอกข้อมูลให้ครบถ้วนค่ะ', type: 'error' });
      return;
    }

    setIsLoggingIn(true);
    try {
      const passwordHash = await computeHash(loginPassword);
      const response = await appFetch('/api/auth/login-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameTrimmed, passwordHash }),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('couple_user', JSON.stringify(data.user));

        if (data.couple) {
          setCurrentCouple(data.couple);
          setRelationshipInfo(data.couple.relationshipInfo);
          fetchCoupleData(data.couple.id);
          triggerNotification(`💖 ล็อกอินสำเร็จ ยินดีต้อนรับกลับบ้านของสองเราค่ะ!`, 'love');
        } else {
          setCurrentCouple(null);
          setRelationshipInfo({
            anniversaryDate: new Date().toISOString().split('T')[0],
            userNickname: '',
            partnerNickname: '',
            loveMessage: '',
            userAvatar: '',
            partnerAvatar: '',
          });
          triggerNotification(`🌱 ล็อกอินสำเร็จแล้วค่ะ! ขั้นตอนต่อไปมาเริ่มเชื่อมต่อหัวใจกันน้า`, 'info');
        }
      } else {
        setAuthMessage({ text: data.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAuthMessage({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ล็อกอินได้ค่ะ', type: 'error' });
    } finally {
      setIsLoggingIn(false);
    }
  };
  useEffect(() => {
    if (!currentUser || !currentUser.coupleId) return;

    // Fast polling for chats (every 2.5 seconds)
    const chatInterval = setInterval(() => {
      fetchCoupleData(currentUser.coupleId!);
    }, 2500);

    return () => clearInterval(chatInterval);
  }, [currentUser]);

  // Automatically read invitation code from URL or localStorage (e.g. ?code=OUGS or ?join=OUGS)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('join') || urlParams.get('code');
      let codeToUse = joinCode;
      
      if (!codeToUse) {
        codeToUse = localStorage.getItem('pending_join_code');
      }

      if (codeToUse) {
        let normalized = codeToUse.toUpperCase().replace(/\s+/g, '').trim();
        if (normalized.length === 4) {
          normalized = 'LOVE-' + normalized;
        }
        
        // Save to localStorage so that if they need to register/login first, it will persist!
        localStorage.setItem('pending_join_code', normalized);
        
        // If logged in but not in a couple, preset state
        if (currentUser && !currentUser.coupleId) {
          setSetupMode('join');
          setPairingCodeInput(normalized);
          // Let's remove the query parameter from url so it doesn't keep triggering and alerts once beautifully!
          window.history.replaceState({}, document.title, window.location.pathname);
          triggerNotification(`✨ ตรวจพบรหัสเชิญชวนคู่รักอัตโนมัติ: "${normalized}" กดปุ่มด้านล่างเพื่อเข้าร่วมและเชื่อมต่อได้ทันทีค่ะ!`, 'love');
        } else if (!currentUser) {
          triggerNotification(`✨ ตรวจพบรหัสเชิญชวนคู่รัก "${normalized}" กรุณาล็อกอินหรือสมัครสมาชิกใหม่เพื่อเชื่อมต่อรักสองเราได้อัตโนมัติค่ะ!`, 'info');
        }
      }
    } catch (e) {
      console.error("Error reading invitation URL code:", e);
    }
  }, [currentUser]);

  // Initial load if user has been authenticated in previous session
  useEffect(() => {
    if (currentUser) {
      handleLogin(currentUser.email, currentUser.name, currentUser.picture);
    }
  }, []);

  // Log Out Action
  const handleLogout = () => {
    localStorage.removeItem('couple_user');
    setCurrentUser(null);
    setCurrentCouple(null);
    setMessages([]);
    setMemories([]);
    setEvents([]);
    setMoodLogs([]);
    setLoginUsername('');
    setLoginPassword('');
    setSignUpUsername('');
    setSignUpPassword('');
    setAuthMessage(null);
    triggerNotification('👋 ออกจากระบบเรียบร้อยแล้วค่ะ เจอกันใหม่นะจ๊ะ!', 'info');
  };

  // Setup Couple Space (Create action)
  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSettingUpSpace(true);

    try {
      const response = await appFetch('/api/couple/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          partnerEmail: partnerEmail || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setCurrentCouple(data.couple);
        setRelationshipInfo(data.couple.relationshipInfo);
        
        // Push initial updates
        await appFetch(`/api/couple/update-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId: data.couple.id,
            info: {
              userNickname: userNicknameInput,
              partnerNickname: partnerNicknameInput,
            },
          }),
        });

        localStorage.setItem('couple_user', JSON.stringify(data.user));
        
        // Refresh full data
        handleLogin(currentUser.email, currentUser.name, currentUser.picture);
        triggerNotification('🏡 สร้างรังรักแสนอบอุ่นและห้องสองเราสำเร็จแล้วจ้า!', 'love');
      } else {
        alert('เกิดข้อผิดพลาดในการเปิดคู่รักใหม่');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อสร้างคู่รักได้');
    } finally {
      setIsSettingUpSpace(false);
    }
  };

  // Join Couple Space (Join action)
  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !pairingCodeInput) return;
    setIsSettingUpSpace(true);

    try {
      const response = await appFetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          pairingCode: pairingCodeInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setCurrentCouple(data.couple);
        setRelationshipInfo(data.couple.relationshipInfo);
        localStorage.setItem('couple_user', JSON.stringify(data.user));
        localStorage.removeItem('pending_join_code');
        
        // Pull latest states
        fetchCoupleData(data.couple.id);
        triggerNotification('🔑 เชื่อมต่อหัวใจสำเร็จ! ยินดีต้อนรับเข้าสู่รังรักร่วมกันสองคนค่ะ!', 'love');
      } else {
        const errData = await response.json();
        alert(errData.error || 'รหัสโปรแกรมไม่ถูกต้อง หรือห้องคู่รักเต็มแล้วค่ะ');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อเชื่อมต่อรหัสโปรแกรมคู่รักได้');
    } finally {
      setIsSettingUpSpace(false);
    }
  };

  // Actions Handlers linked to Express Backend
  const handleUpdateRelationshipInfo = async (info: RelationshipInfo) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch('/api/couple/update-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: currentUser.coupleId,
          info,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setRelationshipInfo(data.couple.relationshipInfo);
        setCurrentCouple(data.couple);
        triggerNotification('⚙️ อัปเดตข้อมูลหวานใจและสโลแกนคู่รักเรียบร้อยแล้วจ้า!', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMemory = async (memory: Memory) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/memories/${currentUser.coupleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        const name = activeUser === 'user' ? relationshipInfo.userNickname : relationshipInfo.partnerNickname;
        triggerNotification(`📸 ${name} บันทึกความทรงจำใหม่: "${memory.title}" เรียบร้อย!`, 'love');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/memories/${currentUser.coupleId}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        triggerNotification('🗑️ ลบความทรงจำแสนหวานออกจากคลังแล้วจ้า', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMemory = async (id: string, updatedMemory: Partial<Memory>) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/memories/${currentUser.coupleId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: updatedMemory }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        triggerNotification('📝 อัปเดตความทรงจำแสนรักเรียบร้อยค่ะ!', 'love');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvent = async (event: CalendarEvent) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/events/${currentUser.coupleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        const name = activeUser === 'user' ? relationshipInfo.userNickname : relationshipInfo.partnerNickname;
        triggerNotification(`📅 ${name} เขียนปฏิทินเพิ่มกิจกรรม: "${event.title}" เรียบร้อยแล้ว!`, 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/events/${currentUser.coupleId}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        triggerNotification('🗑️ ลบกิจกรรมคู่รักออกจากปฏิทินแล้วจ้า', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateEvent = async (id: string, updatedEvent: Partial<CalendarEvent>) => {
    if (!currentUser || !currentUser.coupleId) return;
    try {
      const response = await appFetch(`/api/events/${currentUser.coupleId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: updatedEvent }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        triggerNotification('📝 อัปเดตบันทึก/ไดอารี่เรียบร้อยแล้วค่ะ!', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogMood = async (mood: string, note: string) => {
    if (!currentUser || !currentUser.coupleId) return;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const response = await appFetch(`/api/moods/${currentUser.coupleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          mood,
          note,
          creatorId: activeUser,
        }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
        triggerNotification('🌸 อัปเดตบันทึกอุณหภูมิใจหวานๆ ของวันนี้เรียบร้อยค่ะ!', 'love');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (text: string, mediaUrl?: string, mediaType?: 'photo' | 'video' | 'sticker') => {
    if (!currentUser || !currentUser.coupleId) return;
    const messagePayload = {
      text,
      senderId: activeUser,
      mediaUrl,
      mediaType,
    };
    try {
      const response = await appFetch(`/api/chats/${currentUser.coupleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messagePayload }),
      });
      if (response.ok) {
        fetchCoupleData(currentUser.coupleId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePartnerEmail = async (partnerEmail: string) => {
    if (!currentUser || !currentUser.coupleId) return;
    const response = await appFetch('/api/couple/set-partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupleId: currentUser.coupleId,
        partnerEmail,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      setCurrentCouple(data.couple);
    }
  };

  const handleResetFactory = async () => {
    if (!currentUser) return;
    try {
      await appFetch('/api/couple/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          coupleId: currentUser.coupleId || undefined,
        }),
      });
      
      // Update local state to remove the coupleId while keeping the user logged in
      const updatedUser = { ...currentUser };
      delete updatedUser.coupleId;
      setCurrentUser(updatedUser);
      localStorage.setItem('couple_user', JSON.stringify(updatedUser));

      // Reset couple and tab data
      setCurrentCouple(null);
      setMessages([]);
      setMemories([]);
      setEvents([]);
      setMoodLogs([]);
      setActiveTab('home');

      triggerNotification('🚨 รีเซ็ตคืนค่าโรงงานเรียบร้อยแล้วค่ะ โดยบัญชีอีเมลของคุณยังคงล็อกอินอยู่', 'security');
    } catch (e) {
      console.error(e);
    }
  };

  // Local Import Restore Handler
  const handleRestoreData = (restoredState: {
    memories: Memory[];
    messages: ChatMessage[];
    events: CalendarEvent[];
    moodLogs: MoodLog[];
    relationshipInfo: RelationshipInfo;
  }) => {
    setMemories(restoredState.memories);
    setMessages(restoredState.messages);
    setEvents(restoredState.events);
    setMoodLogs(restoredState.moodLogs);
    setRelationshipInfo(restoredState.relationshipInfo);
    triggerNotification('🛡️ กู้คืนคลังรักเข้ารหัสทั้งหมดเรียบร้อยแล้วค่ะ!', 'security');
  };

  // Render Login state first if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] text-[#5D4E4E] flex flex-col justify-between antialiased">
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-[#F0E6DD] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="inline-block w-14 h-14 bg-linear-to-tr from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-white mx-auto animate-pulse">
                ❤️
              </span>
              <h1 className="font-extrabold text-2xl text-[#5D4E4E] tracking-tight">
                Couple Memory Hub 💖
              </h1>
              <p className="text-xs text-[#A89090] max-w-sm mx-auto leading-relaxed">
                เซฟโซนรักแบบสองเราแชร์บันทึก แชท และความทรงจำร่วมกันอย่างปลอดภัย ลงทะเบียนด้วยชื่อผู้ใช้งานและรหัสผ่านได้ทันทีค่ะ
              </p>
            </div>

            {/* Premium Tab Bar */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl border border-[#F0E6DD]/60">
              <button
                type="button"
                onClick={() => handleSwitchAuthMode('login')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-[#FF8E8E] shadow-sm'
                    : 'text-[#A89090] hover:text-[#5D4E4E]'
                }`}
              >
                🔑 เข้าสู่ระบบ (Sign In)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchAuthMode('register')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-[#FF8E8E] shadow-sm'
                    : 'text-[#A89090] hover:text-[#5D4E4E]'
                }`}
              >
                📝 สมัครสมาชิกใหม่ (Sign Up)
              </button>
            </div>

            {/* Notification Messages */}
            {authMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                  authMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span className="text-base mt-0.5">
                  {authMessage.type === 'success' ? '✅' : '⚠️'}
                </span>
                <p className="font-semibold">{authMessage.text}</p>
              </motion.div>
            )}

            {/* Anti-Autofill protection and forms */}
            {authMode === 'login' ? (
              <form
                onSubmit={handleUsernameLogin}
                className="space-y-4 text-left bg-[#FFF9F5] p-5 sm:p-6 rounded-2xl border border-[#F0E6DD]"
                autoComplete="off"
              >
                {/* Dummy structures to trap browser password managers and autofill */}
                <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
                <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

                <div className="flex items-center gap-2 mb-2 justify-center">
                  <span className="w-6 h-6 bg-[#FFEFEF] rounded-full flex items-center justify-center text-xs text-[#FF8E8E]">👤</span>
                  <p className="text-sm font-black text-[#5D4E4E] tracking-tight">ระบุข้อมูลผู้ใช้เพื่อเข้าระบบ</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#A89090] uppercase mb-1">
                      ชื่อผู้ใช้งาน (Username):
                    </label>
                    <input
                      type="text"
                      name="couple_username_login"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="กรอกชื่อผู้ใช้งานภาษาอังกฤษ ตัวเลข ขีดล่าง"
                      className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] focus:ring-1 focus:ring-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E] font-medium placeholder:text-gray-300 shadow-2xs"
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#A89090] uppercase mb-1">
                      รหัสผ่าน (Password):
                    </label>
                    <input
                      type="password"
                      name="couple_password_login"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] focus:ring-1 focus:ring-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E] font-medium placeholder:text-gray-300 shadow-2xs"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 mt-2 bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                >
                  {isLoggingIn ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบห้องของสองเรา 💖'}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleUsernameRegister}
                className="space-y-4 text-left bg-[#FFF9F5] p-5 sm:p-6 rounded-2xl border border-[#F0E6DD]"
                autoComplete="off"
              >
                {/* Dummy structures to trap browser password managers and autofill */}
                <input type="text" name="prevent_autofill_user_reg" style={{ display: 'none' }} tabIndex={-1} />
                <input type="password" name="prevent_autofill_pass_reg" style={{ display: 'none' }} tabIndex={-1} />

                <div className="flex items-center gap-2 mb-2 justify-center">
                  <span className="w-6 h-6 bg-[#FFEFEF] rounded-full flex items-center justify-center text-xs text-[#FF8E8E]">📝</span>
                  <p className="text-sm font-black text-[#5D4E4E] tracking-tight">กรอกข้อมูลเพื่อสมัครสมาชิกใหม่</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#A89090] uppercase mb-1">
                      ชื่อผู้ใช้งาน (Username): <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="couple_username_signup"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      placeholder="ภาษาอังกฤษ / ตัวเลข / ขีดล่างเท่านั้น"
                      className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] focus:ring-1 focus:ring-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E] font-medium placeholder:text-gray-300 shadow-2xs"
                      autoComplete="off"
                      required
                    />
                    <span className="block text-[10px] text-gray-400 mt-1 font-medium">
                      * จัดเก็บในระบบในรูปแบบเสมือน: username@app.com
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#A89090] uppercase mb-1">
                      รหัสผ่าน (Password): <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="couple_password_signup"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] focus:ring-1 focus:ring-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E] font-medium placeholder:text-gray-300 shadow-2xs"
                      autoComplete="new-password"
                      required
                    />
                    <span className="block text-[10px] text-gray-400 mt-1 font-medium">
                      * จัดเก็บอย่างปลอดภัยด้วยการเข้ารหัส SHA-256 ลงในคอลเลกชันผู้ใช้บน Firestore
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 mt-2 bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                >
                  {isLoggingIn ? 'กำลังดำเนินการ...' : 'ลงทะเบียนผู้ใช้ใหม่ 🌿'}
                </button>
              </form>
            )}

            <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-[#F0E6DD]"></div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-[#A89090] uppercase tracking-widest">
                หรือ เข้าใช้งานระบบสาธิตด่วน
              </span>
            </div>

            {/* Instant login fallback with no inputs */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={async () => {
                  setAuthMessage(null);
                  setIsLoggingIn(true);
                  try {
                    const defaultHash = await computeHash('password123');
                    await appFetch('/api/auth/register-username', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: 'couple_demo', passwordHash: defaultHash }),
                    });
                    
                    const response = await appFetch('/api/auth/login-username', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: 'couple_demo', passwordHash: defaultHash }),
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setCurrentUser(data.user);
                      localStorage.setItem('couple_user', JSON.stringify(data.user));
                      if (data.couple) {
                        setCurrentCouple(data.couple);
                        setRelationshipInfo(data.couple.relationshipInfo);
                        fetchCoupleData(data.couple.id);
                      }
                      triggerNotification('🦊 เข้าสู่ระบบทดลองเรียบร้อยแล้วค่ะ!', 'info');
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsLoggingIn(false);
                  }
                }}
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#5D4E4E] border border-[#F0E6DD] font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                เข้าใช้งานด้วยบัญชีเดโม่ (couple_demo) 🦊
              </button>
            </div>
          </motion.div>
        </div>

        {/* Cute Couple Footer */}
        <footer className="text-center text-[10px] text-gray-400 py-4 border-t border-[#F0E6DD]">
          Couple Memory Hub • พัฒนาโดยคำนึงถึงความสุขและความปลอดภัยสูงสุด 🔒
        </footer>
      </div>
    );
  }

  // Render Setup Space state if logged in but coupleId is null
  if (currentUser && !currentUser.coupleId) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] text-[#5D4E4E] flex flex-col justify-between antialiased">
        <header className="bg-white border-b border-[#F0E6DD] px-4 py-4 sticky top-0 z-40 shadow-xs">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <h1 className="font-extrabold text-sm text-[#5D4E4E] flex items-center gap-1">
              <Heart className="w-4 h-4 text-[#FF8E8E] fill-current" />
              เชื่อมต่อหัวใจสองเรา 💖
            </h1>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 border border-[#F0E6DD] hover:bg-rose-50 text-xs text-rose-500 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-[#F0E6DD] rounded-3xl p-6 shadow-xl space-y-6"
          >
            <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                onClick={() => setSetupMode('create')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  setupMode === 'create' ? 'bg-white text-[#FF8E8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                สร้างพื้นที่รักใหม่ 🏡
              </button>
              <button
                onClick={() => setSetupMode('join')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  setupMode === 'join' ? 'bg-white text-[#FF8E8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                เข้าร่วมพื้นที่เดิม 🔑
              </button>
            </div>

            {setupMode === 'create' ? (
              <form onSubmit={handleCreateCouple} className="space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="font-extrabold text-sm text-[#5D4E4E]">ตั้งใจเปิดประตูห้องใหม่ให้สองเรา 🏡</h3>
                  <p className="text-[10px] text-[#A89090]">กรอกรายละเอียดเพื่อสร้างรหัสโปรแกรมเชิญชวนแฟนจ้า</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ชื่อเล่นของคุณ:</label>
                    <input
                      type="text"
                      value={userNicknameInput}
                      onChange={(e) => setUserNicknameInput(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#F0E6DD] outline-hidden bg-white font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ชื่อเล่นแฟนของคุณ:</label>
                    <input
                      type="text"
                      value={partnerNicknameInput}
                      onChange={(e) => setPartnerNicknameInput(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#F0E6DD] outline-hidden bg-white font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">อีเมล Gmail ของแฟน (ระบุไว้เพื่อให้แฟนล็อกอินได้):</label>
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="เช่น sweety-partner@gmail.com (เลือกใส่ภายหลังได้)"
                    className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSettingUpSpace}
                  className="w-full py-3 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                >
                  <Heart className="w-4 h-4 fill-current animate-pulse" />
                  เปิดห้องความทรงจำรักร่วมกัน 💖
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinCouple} className="space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="font-extrabold text-sm text-[#5D4E4E]">เข้าร่วมรังรักของหวานใจ 🔑</h3>
                  <p className="text-[10px] text-[#A89090]">ใส่รหัสโปรแกรมที่แฟนแชร์มาเพื่อเข้าร่วมทันทีจ้า</p>
                </div>

                <div className="bg-[#FFF9F5] border border-[#FFD9D9] rounded-xl p-3.5 text-[11px] text-[#A89090] space-y-2">
                  <p className="font-extrabold text-[#FF8E8E] flex items-center gap-1">
                    <span>💡 ขั้นตอนการเชื่อมต่อสำหรับแฟน:</span>
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-1 font-semibold text-left">
                    <li>ให้แฟนสมัครสมาชิกใหม่ก่อน (โดยใช้ไอดีและรหัสผ่านของแฟนเอง)</li>
                    <li>หลังจากแฟนล็อกอินเข้ามาแล้ว ให้เลือกแท็บ <strong className="text-[#FF8E8E]">"เข้าร่วมพื้นที่เดิม 🔑"</strong> นี้</li>
                    <li>กรอกรหัสห้อง (สามารถพิมพ์สั้นๆ แค่ 4 ตัวหลัง เช่น <strong className="text-[#FF8E8E]">MGPH</strong> หรือกรอกรหัสเต็ม <strong className="text-[#FF8E8E]">LOVE-MGPH</strong> ก็เข้าได้เหมือนกันค่ะ!)</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">กรอกรหัสโปรแกรมคู่รัก (Pairing Code):</label>
                  <input
                    type="text"
                    value={pairingCodeInput}
                    onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น MGPH หรือ LOVE-MGPH"
                    className="w-full text-center text-sm font-black p-3.5 rounded-xl border-2 border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden bg-[#FFF9F5] text-[#FF8E8E] font-mono tracking-widest placeholder:text-gray-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSettingUpSpace || !pairingCodeInput}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                >
                  <ArrowRight className="w-4 h-4" />
                  เชื่อมต่อหัวใจแชร์พื้นที่รัก 🌟
                </button>
              </form>
            )}
          </motion.div>
        </div>

        <footer className="text-center text-[10px] text-gray-400 py-4 border-t border-[#F0E6DD]">
          Couple Memory Hub • ระบบจัดเก็บข้อมูลความปลอดภัยขั้นสูง
        </footer>
      </div>
    );
  }

  // 5. Main Application render when fully authenticated and paired
  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#5D4E4E] pb-12 antialiased">
      {/* 1. Header & Kawaii Navigation */}
      <header className="bg-white border-b border-[#F0E6DD] sticky top-0 z-40 shadow-xs">
        {/* Real-time sync identity status bar */}
        <div className="bg-[#FFEFEF] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#F0E6DD] text-center">
          <p className="text-xs text-[#5D4E4E] font-bold flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#FF8E8E] animate-spin" style={{ animationDuration: '4s' }} />
            <span>เชื่อมต่อสำเร็จ! คุณเข้าสู่ระบบในชื่อ: <strong>{activeUser === 'user' ? relationshipInfo.userNickname : relationshipInfo.partnerNickname}</strong></span>
          </p>
          <div className="flex bg-white rounded-full p-1 border border-[#F0E6DD] shadow-2xs text-[10px] font-bold px-3 py-1 text-[#FF8E8E] items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            เชื่อมต่อแบบเรียลไทม์รักกันตลอดเวลา 💑
          </div>
        </div>

        {/* Main Brand Title & Nav Menu */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 bg-linear-to-tr from-[#FF8E8E] to-rose-400 rounded-full flex items-center justify-center text-3xl shadow-md text-white border-2 border-white animate-pulse">
              ❤️
            </span>
            <div>
              <h1 className="font-extrabold text-xl md:text-2xl text-[#5D4E4E] tracking-tight flex items-center gap-1">
                Couple Memory Hub <span className="text-xs bg-[#FFEFEF] text-[#FF8E8E] font-black px-2 py-0.5 rounded-full border border-[#FF8E8E]/10">REALTIME</span>
              </h1>
              <p className="text-[11px] text-[#A89090] font-medium">
                บันทึกรักสองเรา • ปลอดภัย แบ๊ว คิขุ อบอุ่น แชทใช้งานได้จริงพร้อมซิงค์คลาวด์ 🔒
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-1 bg-[#F5F1EE]/60 p-1 rounded-2xl border border-[#F0E6DD]">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              วันครบรอบ
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              ปฏิทินแชร์
            </button>
            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'memories'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              กล่องรัก
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              แชทใช้งานจริง
            </button>
            <button
              onClick={() => setActiveTab('mood')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'mood'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              อุณหภูมิใจ
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              ตั้งค่าบัญชีคู่รัก
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {activeTab === 'home' && (
              <>
                <AnniversarySection
                  info={relationshipInfo}
                  onUpdateInfo={handleUpdateRelationshipInfo}
                  activeUser={activeUser}
                  userName={relationshipInfo.userNickname}
                  partnerName={relationshipInfo.partnerNickname}
                  events={events}
                />
                <DailyFlashbackReminder
                  memories={memories}
                  onSendMessage={handleSendMessage}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  activeUser={activeUser}
                  userNickname={relationshipInfo.userNickname}
                  partnerNickname={relationshipInfo.partnerNickname}
                  onTriggerNotification={triggerNotification}
                />
              </>
            )}

            {activeTab === 'calendar' && (
              <CalendarSection
                events={events}
                memories={memories}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                onUpdateEvent={handleUpdateEvent}
                activeUser={activeUser}
                userNickname={relationshipInfo.userNickname}
                partnerNickname={relationshipInfo.partnerNickname}
              />
            )}

            {activeTab === 'memories' && (
              <MemoryBoxSection
                memories={memories}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                onUpdateMemory={handleUpdateMemory}
                activeUser={activeUser}
                userNickname={relationshipInfo.userNickname}
                partnerNickname={relationshipInfo.partnerNickname}
              />
            )}

            {activeTab === 'chat' && (
              <ChatSection
                messages={messages}
                onSendMessage={handleSendMessage}
                activeUser={activeUser}
                userNickname={relationshipInfo.userNickname}
                partnerNickname={relationshipInfo.partnerNickname}
                onTriggerNotification={triggerNotification}
                onLogout={handleLogout}
              />
            )}

            {activeTab === 'mood' && (
              <MoodLoggerSection
                moodLogs={moodLogs}
                onLogMood={handleLogMood}
                activeUser={activeUser}
                userNickname={relationshipInfo.userNickname}
                partnerNickname={relationshipInfo.partnerNickname}
                onTriggerNotification={triggerNotification}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySection
                memories={memories}
                messages={messages}
                events={events}
                moodLogs={moodLogs}
                relationshipInfo={relationshipInfo}
                currentUser={currentUser}
                currentCouple={currentCouple}
                onRestoreData={handleRestoreData}
                onTriggerNotification={triggerNotification}
                onLogout={handleLogout}
                onUpdatePartnerEmail={handleUpdatePartnerEmail}
                onResetFactory={handleResetFactory}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Real-time floating bouncy notification toasts */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 15 }}
              className="p-4 rounded-2xl bg-white border-2 border-brand-peach shadow-lg text-xs font-bold text-rose-800 flex items-center gap-2.5 pointer-events-auto"
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-base shrink-0 animate-bounce">
                {notif.type === 'love' ? '💖' : notif.type === 'security' ? '🔒' : '🔔'}
              </div>
              <div className="flex-1">
                <p className="leading-relaxed">{notif.message}</p>
                <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                  {notif.timestamp.toLocaleTimeString('th-TH')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. Cute Couple footer */}
      <footer className="text-center text-xs text-rose-500 mt-12 py-6 border-t-2 border-dashed border-brand-cream">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <HeartHandshake className="w-4 h-4" />
          <span>ออกแบบความสุขและความปลอดภัยสำหรับคนสำคัญที่สุดโดยคุณรักปักหมุด</span>
        </div>
        <p className="text-[10px] text-gray-400">
          © 2026 Couple Memory Hub • Real-time Coupled Shared Space Storage Data Vault
        </p>
      </footer>
    </div>
  );
}
