import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Edit2, Check, User, Calendar, Smile, ShieldCheck, 
  LogOut, Palette, RefreshCw, Sparkles, Image as ImageIcon, Type
} from 'lucide-react';
import { request } from '../lib/api';

interface ProfileProps {
  currentUser: any;
  partner: any;
  couple: any;
  onProfileUpdate: () => void;
  onLogout: () => void;
}

const CHARACTER_SEEDS = ["Leo", "Mia", "Zoe", "Sam", "Eva", "Max", "Ava", "Jack", "Lily", "Coco"];
const EMOJIS = ["💖", "🥰", "😘", "🐱", "🐶", "🐻", "🐰", "🦖", "🦊", "🐼"];
const PRESET_COLORS = [
  { name: 'Rose', hex: 'F43F5E' },
  { name: 'Pink', hex: 'EC4899' },
  { name: 'Orange', hex: 'F97316' },
  { name: 'Purple', hex: 'A855F7' },
  { name: 'Indigo', hex: '6366F1' },
  { name: 'Teal', hex: '14B8A6' },
  { name: 'Blue', hex: '3B82F6' },
  { name: 'Slate', hex: '64748B' }
];

export default function Profile({ currentUser, partner, couple, onProfileUpdate, onLogout }: ProfileProps) {
  const [name, setName] = useState(currentUser.name);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversaryDate || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [partnerAvatar, setPartnerAvatar] = useState(partner?.avatar || '');

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Interactive Avatar Picker States
  const [activePicker, setActivePicker] = useState<'me' | 'partner' | null>(null);
  const [pickerTab, setPickerTab] = useState<'character' | 'emoji' | 'initials' | 'custom'>('character');

  // Initials States
  const [myInitials, setMyInitials] = useState(() => {
    return currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME';
  });
  const [myColor, setMyColor] = useState('F43F5E');

  const [partnerInitials, setPartnerInitials] = useState(() => {
    return partner ? (partner.name ? partner.name.substring(0, 2).toUpperCase() : 'PT') : 'PT';
  });
  const [partnerColor, setPartnerColor] = useState('EC4899');

  // Sync state when props change
  useEffect(() => {
    setName(currentUser.name);
    setCustomStatus(currentUser.customStatus || '');
    setAnniversaryDate(couple?.anniversaryDate || '');
    setAvatar(currentUser.avatar || '');
    setPartnerAvatar(partner?.avatar || '');
    
    if (currentUser.name) {
      setMyInitials(currentUser.name.substring(0, 2).toUpperCase());
    }
    if (partner?.name) {
      setPartnerInitials(partner.name.substring(0, 2).toUpperCase());
    }
  }, [currentUser, partner, couple]);

  // Calculate days together
  const calculateDaysTogether = () => {
    if (!couple?.anniversaryDate) return 0;
    const start = new Date(couple.anniversaryDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const updateMyInitialsAvatar = (initials: string, colorHex: string) => {
    const cleanInitials = initials.trim() || 'ME';
    const cleanColor = colorHex.replace('#', '');
    const url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanInitials)}&backgroundColor=${cleanColor}&radius=50&fontFamily=Arial,Helvetica&fontWeight=750&fontSize=42`;
    setAvatar(url);
  };

  const updatePartnerInitialsAvatar = (initials: string, colorHex: string) => {
    const cleanInitials = initials.trim() || 'PT';
    const cleanColor = colorHex.replace('#', '');
    const url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanInitials)}&backgroundColor=${cleanColor}&radius=50&fontFamily=Arial,Helvetica&fontWeight=750&fontSize=42`;
    setPartnerAvatar(url);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      await request('/api/couple/update', {
        method: 'POST',
        body: JSON.stringify({
          name,
          customStatus,
          anniversaryDate: couple ? anniversaryDate : undefined,
          avatar,
          partnerAvatar: partner ? partnerAvatar : undefined
        }),
      });
      setSuccessMsg('อัปเดตข้อมูลสำเร็จแล้ว ✨');
      setEditing(false);
      setActivePicker(null);
      onProfileUpdate();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Love Meter / Days Together Section */}
      <div className="bg-gradient-to-tr from-rose-500 via-rose-600 to-orange-400 p-8 rounded-3xl text-white text-center shadow-2xl shadow-rose-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 opacity-10">
          <Heart className="w-60 h-60 fill-white" />
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-10 translate-y-10 opacity-10">
          <Heart className="w-44 h-44 fill-white" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex p-3 bg-white/20 backdrop-blur-md rounded-full mb-1">
            <Heart className="w-10 h-10 fill-white text-white animate-pulse" />
          </div>
          
          {couple ? (
            <>
              <h2 className="text-3xl font-black font-heading tracking-tight">
                เราคบกันมาแล้ว
              </h2>
              <div className="text-6xl font-extrabold tracking-wider font-heading my-4 animate-bounce">
                {calculateDaysTogether()} <span className="text-2xl font-semibold">วัน</span>
              </div>
              <p className="text-rose-100 text-xs">
                ตั้งแต่เริ่มตกลงเป็นแฟนกันเมื่อวันที่ {new Date(couple.anniversaryDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold font-heading tracking-tight">
                พื้นที่รักของฉัน
              </h2>
              <p className="text-rose-100 text-xs max-w-md mx-auto mt-2">
                นี่คือหน้าแดชบอร์ดส่วนตัวของคุณ ขั้นตอนสุดท้ายคือนำรหัสคำชวนนี้ไปเชื่อมต่อกับแฟนของคุณเพื่อเปิดห้องแชทลับ บันทึกความทรงจำ และปฏิทินวันสำคัญร่วมกัน 💕
              </p>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Couple Profiles card */}
      <div className="bg-white/95 p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-16">
          {/* Me */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative group">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-full border-4 border-rose-100 object-cover" 
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full text-[10px] font-bold">ฉัน</span>
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">{currentUser.name}</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-[150px] break-words">{currentUser.customStatus || "Happy together! 💕"}</p>
            </div>
          </div>

          {/* Heart spacer */}
          <div className="text-rose-400 font-bold hidden sm:block">
            <Heart className="w-8 h-8 fill-rose-100 animate-pulse text-rose-400" />
          </div>

          {/* Partner */}
          {partner ? (
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="relative">
                <img 
                  src={partner.avatar} 
                  alt={partner.name} 
                  className="w-20 h-20 rounded-full border-4 border-rose-100 object-cover" 
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-full text-[10px] font-bold">ที่รัก</span>
              </div>
              <div>
                <h3 className="font-bold text-stone-800 text-sm">{partner.name}</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-[150px] break-words">{partner.customStatus || "Happy together! 💕"}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-2 opacity-60">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-rose-200 bg-rose-50 flex items-center justify-center text-rose-300">
                  <User className="w-8 h-8" />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-stone-400 text-white p-1 rounded-full text-[10px] font-bold">ว่าง</span>
              </div>
              <div>
                <h3 className="font-bold text-stone-400 text-sm">ยังไม่มีคู่รัก</h3>
                <p className="text-[10px] text-stone-400 mt-1 max-w-[150px]">เชื่อมต่อแฟนเพื่อดูข้อมูล</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings / Edit Profile */}
      <div className="bg-white/95 p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30 space-y-4">
        <div className="flex justify-between items-center border-b border-rose-50 pb-3">
          <h3 className="font-bold text-rose-950 text-sm font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>ตั้งค่าข้อมูลส่วนตัว</span>
          </h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูล</span>
            </button>
          )}
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-green-700 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-rose-800 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  <span>ชื่อของคุณ</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                />
              </div>

              <div>
                <label className="block font-semibold text-rose-800 mb-1.5 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-rose-400" />
                  <span>สเตตัสของคุณ</span>
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                  placeholder="เช่น คิดถึงจังเลย..."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-1 gap-4">
              <div>
                <label className="block font-semibold text-rose-800 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>วันแรกที่คบกัน (วันเริ่มความสัมพันธ์)</span>
                </label>
                <input
                  type="date"
                  required
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                />
              </div>
            </div>

            {/* Avatar Creator Section */}
            <div className="border-t border-rose-50/60 pt-4 space-y-4">
              <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-rose-500" />
                <span>จัดการรูปอวาตาร์และไอคอนตัวย่อ 📸</span>
              </h4>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Me Avatar preview & select */}
                <div className="bg-rose-50/10 p-4 rounded-2xl border border-rose-100/40 flex flex-col items-center">
                  <span className="text-[10px] font-black text-rose-950 mb-2">อวาตาร์ของคุณเอง 👤</span>
                  <img 
                    src={avatar} 
                    alt="My Preview" 
                    className="w-14 h-14 rounded-full border-2 border-rose-300 object-cover mb-2.5" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActivePicker('me');
                      setPickerTab('character');
                    }}
                    className={`text-[10px] font-bold py-1.5 px-3 rounded-lg transition ${
                      activePicker === 'me' ? 'bg-rose-500 text-white' : 'bg-white hover:bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    ปรับแต่งไอคอนของฉัน
                  </button>
                </div>

                {/* Partner Avatar preview & select */}
                {partner ? (
                  <div className="bg-rose-50/10 p-4 rounded-2xl border border-rose-100/40 flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-950 mb-2">อวาตาร์ของที่รัก 💖</span>
                    <img 
                      src={partnerAvatar} 
                      alt="Partner Preview" 
                      className="w-14 h-14 rounded-full border-2 border-rose-300 object-cover mb-2.5" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActivePicker('partner');
                        setPickerTab('character');
                      }}
                      className={`text-[10px] font-bold py-1.5 px-3 rounded-lg transition ${
                        activePicker === 'partner' ? 'bg-rose-500 text-white' : 'bg-white hover:bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      ปรับแต่งไอคอนของแฟน
                    </button>
                  </div>
                ) : (
                  <div className="bg-stone-50/50 p-4 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-center opacity-60">
                    <span className="text-[10px] font-black text-stone-400 mb-1">อวาตาร์ของที่รัก</span>
                    <p className="text-[9px] text-stone-400 max-w-[150px]">เมื่อแฟนทำการเชื่อมต่อแล้ว คุณจะสามารถแต่งตัวหรือสร้างไอคอนให้แฟนได้ทันที!</p>
                  </div>
                )}
              </div>

              {/* Shared Live Customizer Tool */}
              <AnimatePresence>
                {activePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-stone-50/45 border border-rose-100 rounded-2xl p-4 overflow-hidden space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-rose-50 pb-2">
                      <span className="text-[10px] font-black text-rose-950 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>ปรับแต่งสำหรับ: {activePicker === 'me' ? 'ตัวคุณเอง' : 'แฟนของคุณ'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePicker(null)}
                        className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg font-bold transition"
                      >
                        ปิดเครื่องมือ
                      </button>
                    </div>

                    {/* Selector tabs */}
                    <div className="flex bg-rose-50/40 p-1 rounded-xl border border-rose-100/40 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPickerTab('character')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition ${
                          pickerTab === 'character' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-500'
                        }`}
                      >
                        การ์ตูนน่ารัก
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerTab('emoji')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition ${
                          pickerTab === 'emoji' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-500'
                        }`}
                      >
                        อิโมจิบอกรัก
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerTab('initials')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition ${
                          pickerTab === 'initials' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-500'
                        }`}
                      >
                        ไอคอนตัวอักษรย่อ
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerTab('custom')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition ${
                          pickerTab === 'custom' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-500'
                        }`}
                      >
                        ป้อนลิงก์รูปเอง
                      </button>
                    </div>

                    {/* Characters Preset Grid */}
                    {pickerTab === 'character' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-1.5">
                          {CHARACTER_SEEDS.map(seed => {
                            const imgUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                            const isSelected = activePicker === 'me' ? avatar === imgUrl : partnerAvatar === imgUrl;
                            return (
                              <button
                                key={seed}
                                type="button"
                                onClick={() => {
                                  if (activePicker === 'me') setAvatar(imgUrl);
                                  else setPartnerAvatar(imgUrl);
                                }}
                                className={`p-1.5 rounded-xl border transition hover:scale-105 active:scale-95 ${
                                  isSelected ? 'border-rose-500 bg-white shadow-xs' : 'border-rose-100 hover:bg-white'
                                }`}
                              >
                                <img src={imgUrl} alt={seed} className="w-8 h-8 mx-auto" />
                                <span className="text-[8px] text-stone-400 block text-center mt-0.5">{seed}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const seed = Math.random().toString(36).substring(7);
                              const randUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                              if (activePicker === 'me') setAvatar(randUrl);
                              else setPartnerAvatar(randUrl);
                            }}
                            className="text-[9px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-white py-1 px-2.5 border border-rose-100 rounded-lg transition"
                          >
                            <RefreshCw className="w-3 h-3 text-rose-500" />
                            <span>สุ่มคาแรกเตอร์ใหม่ 🎲</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Emoji Preset Grid */}
                    {pickerTab === 'emoji' && (
                      <div className="grid grid-cols-5 gap-2">
                        {EMOJIS.map(emoji => {
                          const imgUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emoji)}&radius=50&backgroundColor=ffe4e6`;
                          const isSelected = activePicker === 'me' ? avatar === imgUrl : partnerAvatar === imgUrl;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                if (activePicker === 'me') setAvatar(imgUrl);
                                else setPartnerAvatar(imgUrl);
                              }}
                              className={`p-2 rounded-xl border transition text-center hover:scale-110 active:scale-95 text-xl ${
                                isSelected ? 'border-rose-500 bg-white shadow-xs' : 'border-rose-100 hover:bg-white'
                              }`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Initials Generator Panel */}
                    {pickerTab === 'initials' && (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block text-[9px] font-bold text-rose-800 mb-1">ตัวอักษรย่อ (สูงสุด 2 ตัว)</label>
                            <input
                              type="text"
                              maxLength={2}
                              value={activePicker === 'me' ? myInitials : partnerInitials}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                if (activePicker === 'me') {
                                  setMyInitials(val);
                                  updateMyInitialsAvatar(val, myColor);
                                } else {
                                  setPartnerInitials(val);
                                  updatePartnerInitialsAvatar(val, partnerColor);
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-rose-100 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 font-extrabold text-center text-xs text-[#5D2E46]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-rose-800 mb-1">เลือกสีพื้นหลัง</label>
                            <div className="grid grid-cols-4 gap-1">
                              {PRESET_COLORS.map(color => {
                                const isSelected = activePicker === 'me' ? myColor === color.hex : partnerColor === color.hex;
                                return (
                                  <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => {
                                      if (activePicker === 'me') {
                                        setMyColor(color.hex);
                                        updateMyInitialsAvatar(myInitials, color.hex);
                                      } else {
                                        setPartnerColor(color.hex);
                                        updatePartnerInitialsAvatar(partnerInitials, color.hex);
                                      }
                                    }}
                                    style={{ backgroundColor: `#${color.hex}` }}
                                    className="w-6 h-6 rounded-full border border-white shadow-3xs relative transition hover:scale-105"
                                    title={color.name}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom URL Field */}
                    {pickerTab === 'custom' && (
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-rose-800 mb-0.5">ลิงก์ภาพโปรไฟล์ URL</label>
                        <input
                          type="text"
                          value={activePicker === 'me' ? avatar : partnerAvatar}
                          onChange={(e) => {
                            if (activePicker === 'me') setAvatar(e.target.value);
                            else setPartnerAvatar(e.target.value);
                          }}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-rose-100 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 text-[10px] text-[#5D2E46]"
                        />
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setActivePicker(null);
                }}
                className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-tr from-rose-500 to-orange-400 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-rose-200"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-xs text-[#5D2E46]">
            <div className="flex justify-between py-1 border-b border-rose-50">
              <span className="font-semibold text-rose-700">อีเมลลงทะเบียน</span>
              <span className="text-rose-950 font-medium">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-rose-50">
              <span className="font-semibold text-rose-700">รหัสคำชวนของคุณ</span>
              <span className="font-mono text-rose-600 font-bold">{currentUser.inviteCode}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-rose-700">ระดับความเป็นส่วนตัว</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <span>เข้ารหัสส่วนตัวแล้ว (Private Space)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full bg-white/90 hover:bg-red-50 hover:text-red-500 text-rose-700 py-3 rounded-2xl text-xs font-semibold transition duration-200 flex items-center justify-center gap-2 border border-rose-100 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
}
