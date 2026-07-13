import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, LogIn, Lock, Bell, CheckCircle2, User, Smile, MessageCircle, Calendar, ShieldCheck, HeartHandshake, LogOut, ArrowRight, Compass, Settings, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Memory, ChatMessage, CalendarEvent, MoodLog, RelationshipInfo, CurrentUser, Couple } from './types';
import AnniversarySection from './components/AnniversarySection';
import CalendarSection from './components/CalendarSection';
import MemoryBoxSection from './components/MemoryBoxSection';
import ChatSection from './components/ChatSection';
import MoodLoggerSection from './components/MoodLoggerSection';
import SecuritySection from './components/SecuritySection';

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

  // Customizable Google Client ID (to solve "Access Blocked / Error 400" due to unauthorized origin)
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return localStorage.getItem('custom_google_client_id') || ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '955428006827-example.apps.googleusercontent.com';
  });
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [tempClientId, setTempClientId] = useState('');

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
      const res = await fetch(`/api/chats/${coupleId}`);
      if (res.ok) {
        const chats = await res.json();
        setMessages(chats);
      }

      const resMemories = await fetch(`/api/memories/${coupleId}`);
      if (resMemories.ok) {
        const mems = await resMemories.json();
        setMemories(mems);
      }

      const resEvents = await fetch(`/api/events/${coupleId}`);
      if (resEvents.ok) {
        const evs = await resEvents.json();
        setEvents(evs);
      }

      const resMoods = await fetch(`/api/moods/${coupleId}`);
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

      const response = await fetch('/api/auth/login', {
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

  // Google Sign-In setup inside iframe and external tab fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initGsi = () => {
        if ((window as any).google?.accounts?.id) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (response: any) => {
                const payload = decodeJwt(response.credential);
                if (payload && payload.email) {
                  handleLogin(payload.email, payload.name, payload.picture);
                }
              },
            });
            const btnContainer = document.getElementById('google-signin-btn');
            if (btnContainer) {
              btnContainer.innerHTML = ''; // Clear old button container to avoid duplicates
              (window as any).google.accounts.id.renderButton(btnContainer, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                text: 'signin_with',
              });
            }
          } catch (e) {
            console.error('GSI Init Error:', e);
          }
        }
      };

      // Check if library already loaded, otherwise listen for load
      if ((window as any).google?.accounts?.id) {
        initGsi();
      } else {
        const timer = setInterval(() => {
          if ((window as any).google?.accounts?.id) {
            initGsi();
            clearInterval(timer);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [currentUser, googleClientId]);

  // Periodical long polling for real-time chat & data updates
  useEffect(() => {
    if (!currentUser || !currentUser.coupleId) return;

    // Fast polling for chats (every 2.5 seconds)
    const chatInterval = setInterval(() => {
      fetchCoupleData(currentUser.coupleId!);
    }, 2500);

    return () => clearInterval(chatInterval);
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
    triggerNotification('👋 ออกจากระบบหวานใจเรียบร้อยแล้วค่ะ เจอกันใหม่นะจ๊ะ!', 'info');
  };

  // Setup Couple Space (Create action)
  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSettingUpSpace(true);

    try {
      const response = await fetch('/api/couple/create', {
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
        await fetch(`/api/couple/update-info`, {
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
      const response = await fetch('/api/couple/join', {
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
      const response = await fetch('/api/couple/update-info', {
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
      const response = await fetch(`/api/memories/${currentUser.coupleId}`, {
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
      const response = await fetch(`/api/memories/${currentUser.coupleId}/${id}`, {
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
      const response = await fetch(`/api/memories/${currentUser.coupleId}/${id}`, {
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
      const response = await fetch(`/api/events/${currentUser.coupleId}`, {
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
      const response = await fetch(`/api/events/${currentUser.coupleId}/${id}`, {
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
      const response = await fetch(`/api/events/${currentUser.coupleId}/${id}`, {
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
      const response = await fetch(`/api/moods/${currentUser.coupleId}`, {
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
      const response = await fetch(`/api/chats/${currentUser.coupleId}`, {
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
    const response = await fetch('/api/couple/set-partner', {
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
      await fetch('/api/couple/reset', {
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
            className="w-full max-w-md bg-white border border-[#F0E6DD] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6"
          >
            <div className="space-y-2">
              <span className="inline-block w-14 h-14 bg-linear-to-tr from-brand-pink to-rose-400 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-white mx-auto animate-pulse">
                ❤️
              </span>
              <h1 className="font-extrabold text-2xl text-[#5D4E4E] tracking-tight">
                Couple Memory Hub 💖
              </h1>
              <p className="text-xs text-[#A89090] max-w-sm mx-auto leading-relaxed">
                เซฟโซนรักแบบสองเราแชร์ภาพ ความทรงจำ แชท และความรู้สึกร่วมกันแบบเรียลไทม์ ปลอดภัยและโรแมนติกที่สุด
              </p>
            </div>

            {/* Gmail Manual Login Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (loginEmail.trim()) {
                  const derivedName = loginEmail.trim().split('@')[0];
                  handleLogin(loginEmail.trim(), derivedName);
                }
              }} 
              className="space-y-3 text-left bg-[#FFF9F5] p-4 rounded-2xl border border-[#F0E6DD]"
            >
              <div className="flex items-center gap-1.5 mb-1 justify-center">
                <span className="w-5 h-5 bg-[#FFEFEF] rounded-full flex items-center justify-center text-xs text-[#FF8E8E]">📧</span>
                <p className="text-xs font-black text-[#5D4E4E] tracking-tight">เข้าใช้งานด้วยอีเมล Gmail ของท่าน</p>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#A89090] uppercase mb-0.5">อีเมล Gmail ของจริง:</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="เช่น sweet-couple@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E] font-medium placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
              >
                {isLoggingIn ? 'กำลังเข้าห้องความรัก...' : 'เข้าสู่ระบบ Gmail ของสองเรา 💖'}
              </button>
            </form>

            {/* Google Identity Services Real Sign-In Container */}
            <div className="space-y-3 bg-[#FAF8F6] p-4 rounded-2xl border border-[#F0E6DD]/60">
              <p className="text-[10px] font-extrabold text-[#5D4E4E] uppercase tracking-wider">หรือเชื่อมต่อด่วนด้วย Google One Tap</p>
              <div className="flex justify-center py-1">
                <div id="google-signin-btn" className="inline-block"></div>
              </div>

              {/* Troubleshooting block for "Access Blocked" / Google Origin mismatch */}
              <div className="pt-2 border-t border-[#F0E6DD]/60">
                <button
                  type="button"
                  id="btn-toggle-client-id-info"
                  onClick={() => {
                    setTempClientId(googleClientId);
                    setShowClientIdConfig(!showClientIdConfig);
                  }}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold flex items-center justify-center gap-1 mx-auto transition-colors focus:outline-hidden"
                >
                  {showClientIdConfig ? '✖ ปิดการตั้งค่า' : '❓ เข้าสู่ระบบด้วย Google ขึ้นบล็อก (Access Blocked) แก้ไขยังไง?'}
                </button>

                {showClientIdConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 text-left space-y-3 text-[11px] text-[#5D4E4E] bg-white p-3.5 rounded-xl border border-[#F0E6DD] leading-relaxed"
                  >
                    <p className="font-extrabold text-[#FF8E8E] text-[11px]">
                      ทำไมขึ้น "การเข้าถึงถูกบล็อก" (Access Blocked)?
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      เนื่องจากแอปนี้ทำงานบน URL ชั่วคราวของคุณ เพื่อความปลอดภัยสูงสุด Google จึงบังคับให้ใช้ <strong>Google Client ID ของคุณเอง</strong> ที่มีการตั้งค่าอนุญาตที่มาของเว็บไซต์ (Authorized Origins) เท่านั้นค่ะ!
                    </p>

                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-[9px] space-y-1">
                      <p className="font-extrabold">📌 ขั้นตอนแก้ไขใน 3 นาที:</p>
                      <ol className="list-decimal pl-3 space-y-1">
                        <li>ไปที่ <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#FF8E8E]">Google Cloud Console</a> แล้วสร้าง OAuth Client ID สำหรับ Web Application</li>
                        <li>ใส่ URL ของแอปนี้ลงในช่อง <strong>Authorized JavaScript origins</strong>: <br />
                          <code className="bg-white px-1 py-0.5 rounded border font-mono select-all text-[11px] font-semibold block mt-1 break-all">
                            {typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-lomcjwpka32nadx2p7pgis-955428006827.asia-southeast1.run.app'}
                          </code>
                        </li>
                        <li>ก็อปปี้ Client ID ที่ได้มาวางในช่องด้านล่างนี้ และกดบันทึกความทรงจำได้เลยค่ะ!</li>
                      </ol>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block font-bold text-[10px] text-[#A89090]">ใส่ Google Client ID ของคุณเอง:</label>
                      <input
                        type="text"
                        id="input-custom-client-id"
                        value={tempClientId}
                        onChange={(e) => setTempClientId(e.target.value.trim())}
                        placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                        className="w-full text-[10px] p-2 rounded-lg border border-[#F0E6DD] font-mono focus:border-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E]"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        {googleClientId !== '955428006827-example.apps.googleusercontent.com' && (
                          <button
                            type="button"
                            id="btn-reset-client-id"
                            onClick={() => {
                              localStorage.removeItem('custom_google_client_id');
                              setGoogleClientId('955428006827-example.apps.googleusercontent.com');
                              setTempClientId('955428006827-example.apps.googleusercontent.com');
                              triggerNotification('คืนค่า Google Client ID เริ่มต้นเรียบร้อยแล้วค่ะ! 🐻', 'info');
                              setShowClientIdConfig(false);
                            }}
                            className="px-2.5 py-1.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            คืนค่าเริ่มต้น
                          </button>
                        )}
                        <button
                          type="button"
                          id="btn-save-client-id"
                          onClick={() => {
                            if (!tempClientId) {
                              triggerNotification('กรุณากรอก Google Client ID ก่อนนะคะ! ⚠️', 'security');
                              return;
                            }
                            localStorage.setItem('custom_google_client_id', tempClientId);
                            setGoogleClientId(tempClientId);
                            triggerNotification('อัปเดต Google Client ID เรียบร้อยแล้วค่ะ! ระบบกำลังโหลดปุ่มใหม่ 🌸', 'love');
                            setShowClientIdConfig(false);
                          }}
                          className="px-3 py-1.5 text-[10px] bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 text-white font-extrabold rounded-lg cursor-pointer transition-colors"
                        >
                          บันทึกการตั้งค่า ✨
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-[#F0E6DD]"></div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-[#A89090] uppercase tracking-widest">
                หรือ เข้าใช้แบบจำลองความเร่งด่วน
              </span>
            </div>

            {/* Instant login fallback with no inputs */}
            <div className="space-y-4">
              <button
                onClick={() => handleLogin('couple.simulated@gmail.com', 'คุณหมีน้อย 🐻')}
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#5D4E4E] border border-[#F0E6DD] font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                ใช้บัญชีทดสอบระบบด่วน 🐻🐰
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

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">กรอกรหัสโปรแกรมคู่รัก (Pairing Code):</label>
                  <input
                    type="text"
                    value={pairingCodeInput}
                    onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น LOVE-ABCD"
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
              <AnniversarySection
                info={relationshipInfo}
                onUpdateInfo={handleUpdateRelationshipInfo}
                activeUser={activeUser}
                userName={relationshipInfo.userNickname}
                partnerName={relationshipInfo.partnerNickname}
                events={events}
              />
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
