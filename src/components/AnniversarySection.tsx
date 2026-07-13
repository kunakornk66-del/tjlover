import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, Calendar, Gift, Settings, Check, Clock, Camera, X, RefreshCw } from 'lucide-react';
import { RelationshipInfo, CalendarEvent } from '../types';

interface AnniversarySectionProps {
  info: RelationshipInfo;
  onUpdateInfo: (info: RelationshipInfo) => void;
  activeUser: 'user' | 'partner';
  userName: string;
  partnerName: string;
  events?: CalendarEvent[];
}

export default function AnniversarySection({
  info,
  onUpdateInfo,
  activeUser,
  userName,
  partnerName,
  events = [],
}: AnniversarySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAnniversary, setEditAnniversary] = useState(info.anniversaryDate);
  const [editUserNickname, setEditUserNickname] = useState(info.userNickname);
  const [editPartnerNickname, setEditPartnerNickname] = useState(info.partnerNickname);
  const [editLoveMessage, setEditLoveMessage] = useState(info.loveMessage);
  const [editUserAvatar, setEditUserAvatar] = useState(info.userAvatar || '');
  const [editPartnerAvatar, setEditPartnerAvatar] = useState(info.partnerAvatar || '');

  // Keep state synced with props when they update (especially after reload/save)
  useEffect(() => {
    setEditAnniversary(info.anniversaryDate);
    setEditUserNickname(info.userNickname);
    setEditPartnerNickname(info.partnerNickname);
    setEditLoveMessage(info.loveMessage);
    setEditUserAvatar(info.userAvatar || '');
    setEditPartnerAvatar(info.partnerAvatar || '');
  }, [info]);

  // Camera settings & states
  const [activeCameraTarget, setActiveCameraTarget] = useState<'user' | 'partner' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (activeCameraTarget) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      })
      .then((s) => {
        activeStream = s;
        setCameraStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setCameraError(null);
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setCameraError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้องของคุณ");
      });
    } else {
      setCameraStream(null);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeCameraTarget, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      if (activeCameraTarget === 'user') {
        setEditUserAvatar(dataUrl);
      } else {
        setEditPartnerAvatar(dataUrl);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setActiveCameraTarget(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'user' | 'partner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'user') {
        setEditUserAvatar(base64String);
      } else {
        setEditPartnerAvatar(base64String);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // For ticking timer
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    years: 0,
    remainingDays: 0,
  });

  const [countdown, setCountdown] = useState<{ days: number; text: string } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const anniversary = new Date(info.anniversaryDate || new Date());
      const now = new Date();
      const diffMs = now.getTime() - anniversary.getTime();
      
      if (diffMs < 0) {
        setTimeElapsed({ days: 0, hours: 0, minutes: 0, seconds: 0, years: 0, remainingDays: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Calculate years and remaining days
      let years = now.getFullYear() - anniversary.getFullYear();
      let mDiff = now.getMonth() - anniversary.getMonth();
      if (mDiff < 0 || (mDiff === 0 && now.getDate() < anniversary.getDate())) {
        years--;
      }
      const lastAnniversary = new Date(anniversary);
      lastAnniversary.setFullYear(anniversary.getFullYear() + (years > 0 ? years : 0));
      const diffMsAfterYears = now.getTime() - lastAnniversary.getTime();
      const remainingDays = Math.max(0, Math.floor(diffMsAfterYears / (1000 * 60 * 60 * 24)));

      setTimeElapsed({ days, hours, minutes, seconds, years: Math.max(0, years), remainingDays });

      // Calculate countdown to next anniversary (same month/day next year)
      const currentYear = now.getFullYear();
      let nextAnniversary = new Date(currentYear, anniversary.getMonth(), anniversary.getDate());
      
      if (nextAnniversary.getTime() < now.getTime()) {
        nextAnniversary = new Date(currentYear + 1, anniversary.getMonth(), anniversary.getDate());
      }
      
      const diffNextMs = nextAnniversary.getTime() - now.getTime();
      const nextDays = Math.ceil(diffNextMs / (1000 * 60 * 60 * 24));
      
      // Calculate years
      const yearsDiff = nextAnniversary.getFullYear() - anniversary.getFullYear();
      setCountdown({
        days: nextDays,
        text: `ครบรอบ ${yearsDiff} ปี (${nextAnniversary.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })})`,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [info.anniversaryDate]);

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const todayEventsList = (events || []).filter((e) => getDaysDiff(e.date) === 0);
  const upcomingEventsList = (events || [])
    .filter((e) => {
      const diff = getDaysDiff(e.date);
      return diff > 0 && diff <= 14;
    })
    .sort((a, b) => getDaysDiff(a.date) - getDaysDiff(b.date));

  const handleSave = () => {
    onUpdateInfo({
      anniversaryDate: editAnniversary,
      userNickname: editUserNickname,
      partnerNickname: editPartnerNickname,
      loveMessage: editLoveMessage,
      userAvatar: editUserAvatar,
      partnerAvatar: editPartnerAvatar,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Love Stats Card */}
      <div id="anniversary-main-card" className="kawaii-card p-6 md:p-8 bg-gradient-to-br from-[#FFF9F5] to-[#F5F1EE] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 text-[#FF8E8E] opacity-20 w-32 h-32 animate-pulse pointer-events-none">
          <Heart className="w-full h-full fill-[#FFD6D6] text-[#FF8E8E]" />
        </div>
        <div className="absolute -bottom-6 -left-6 text-[#FF8E8E] opacity-20 w-24 h-24 pointer-events-none">
          <Sparkles className="w-full h-full text-brand-pink" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <span className="bg-[#FFEFEF] text-[#FF8E8E] text-xs px-3 py-1.5 rounded-full font-bold tracking-wider flex items-center gap-1.5 border border-[#FF8E8E]/30 shadow-xs animate-bounce">
            <Heart className="w-3.5 h-3.5 fill-[#FF8E8E] text-[#FF8E8E]" />
            STATION OF LOVE
          </span>

          {/* Nicknames & Heart */}
          <div className="flex items-center justify-center gap-4 md:gap-8 my-2">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#FF8E8E] bg-[#FFEFEF] flex items-center justify-center text-3xl shadow-md overflow-hidden relative">
                {info.userAvatar ? (
                  <img src={info.userAvatar} alt="user avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>🐶</span>
                )}
              </div>
              <span className="font-bold text-lg text-[#5D4E4E] mt-2">{info.userNickname || userName}</span>
              <span className="text-xs text-[#A89090] font-semibold">ฝ่ายน่ารัก</span>
            </div>

            <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16">
              <Heart className="w-12 h-12 md:w-16 md:h-16 fill-[#FF8E8E] text-[#FF8E8E] animate-pulse absolute" />
              <span className="absolute text-white font-bold text-xs md:text-sm">รักที่สุด</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-400 bg-[#D6E4FF] flex items-center justify-center text-3xl shadow-md overflow-hidden relative">
                {info.partnerAvatar ? (
                  <img src={info.partnerAvatar} alt="partner avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>🐱</span>
                )}
              </div>
              <span className="font-bold text-lg text-[#5D4E4E] mt-2">{info.partnerNickname || partnerName}</span>
              <span className="text-xs text-[#A89090] font-semibold">ฝ่ายอ้อน</span>
            </div>
          </div>

          {/* Days count */}
          <div className="bg-white/90 backdrop-blur-xs py-4 px-6 md:px-8 rounded-2xl border border-[#F0E6DD] shadow-xs text-center min-w-[280px]">
            <span className="text-[#A89090] text-sm font-semibold tracking-wide">เรารักกันมาแล้ว</span>
            <div className="text-4xl md:text-5xl font-black text-[#FF8E8E] mt-1 mb-0.5 font-mono tracking-tight drop-shadow-xs">
              {timeElapsed.days} <span className="text-2xl font-bold font-sans">วัน</span>
            </div>
            {timeElapsed.years > 0 && (
              <div className="text-xs md:text-sm font-black text-[#FF8E8E]/85 mb-2 bg-[#FFF9F5] px-3 py-1 rounded-full border border-[#FFEFEF] inline-block animate-pulse">
                ✨ คิดเป็น {timeElapsed.years} ปี {timeElapsed.remainingDays} วัน ✨
              </div>
            )}
            <p className="text-[#A89090] text-xs flex items-center justify-center gap-1.5 font-mono border-t border-[#F0E6DD]/40 pt-2 mt-1">
              <Clock className="w-3.5 h-3.5 text-[#FF8E8E]" />
              {timeElapsed.hours} ชม. : {timeElapsed.minutes} นาที : {timeElapsed.seconds} วินาที
            </p>
          </div>

          <div className="max-w-md">
            <p className="text-[#5D4E4E] italic text-sm md:text-base font-medium px-4">
              " {info.loveMessage || 'การได้พบเธอคือสิ่งที่ดีที่สุดในชีวิตรักของฉันเลยนะ'} "
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
            <div className="bg-white/95 p-3 rounded-xl border border-[#F0E6DD] flex flex-col items-center">
              <span className="text-[10px] text-[#A89090] uppercase tracking-wider font-bold">วันเริ่มต้นความรัก</span>
              <span className="text-xs text-[#5D4E4E] font-bold mt-1">
                {new Date(info.anniversaryDate).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-[#F0E6DD] flex flex-col items-center">
              <span className="text-[10px] text-[#A89090] uppercase tracking-wider font-bold">วันครบรอบครั้งถัดไป</span>
              <span className="text-xs text-[#5D4E4E] font-bold mt-1">
                อีก {countdown?.days} วัน
              </span>
            </div>
          </div>

          {countdown && (
            <div className="text-xs text-[#5D4E4E] font-semibold bg-[#FFEFEF] px-3 py-1 rounded-full border border-[#F0E6DD] flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#FF8E8E]" />
              เป้าหมายถัดไป: {countdown.text}
            </div>
          )}

          {/* Edit settings toggle */}
          <button
            id="edit-info-toggle-btn"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-[#FF8E8E] hover:text-[#5D4E4E] font-bold flex items-center gap-1 mt-2 underline cursor-pointer decoration-dotted"
          >
            <Settings className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
            ปรับแต่งชื่อคู่รักและวันครบรอบ
          </button>
        </div>
      </div>

      {/* Editing Form Panel */}
      {isEditing && (
        <div id="editing-form-card" className="kawaii-card p-6 bg-white border border-[#F0E6DD] space-y-4 animate-fadeIn">
          <h3 className="font-bold text-[#5D4E4E] flex items-center gap-2">
            <Heart className="w-5 h-5 fill-[#FF8E8E] text-[#FF8E8E]" />
            ตั้งค่าประวัติความรัก
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Avatar and Nickname Settings Block */}
            <div className="bg-[#FFFBF9] p-4 rounded-2xl border border-[#F5EBE6] space-y-3">
              <span className="text-xs font-bold text-[#FF8E8E] flex items-center gap-1">👤 รูปภาพ & ชื่อเล่นของคุณ</span>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full border-2 border-[#FF8E8E] bg-[#FFEFEF] flex items-center justify-center text-2xl overflow-hidden shadow-xs shrink-0">
                  {editUserAvatar ? (
                    <img src={editUserAvatar} alt="user avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>🐶</span>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-center">
                    เปลี่ยน
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'user')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">ชื่อเล่นของคุณ 🐶</label>
                  <input
                    type="text"
                    value={editUserNickname}
                    onChange={(e) => setEditUserNickname(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
                    placeholder="ชื่อน่ารักๆ ของคุณ"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-center text-[11px] bg-white border border-dashed border-[#F0E6DD] hover:border-[#FF8E8E] py-1.5 rounded-xl cursor-pointer text-gray-500 transition-colors font-medium">
                  📁 เลือกอัปโหลดรูปภาพของคุณ
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'user')}
                    className="hidden"
                  />
                </label>
                <button
                  id="btn-camera-user"
                  type="button"
                  onClick={() => {
                    setActiveCameraTarget('user');
                    setFacingMode('user');
                  }}
                  className="w-full text-center text-[11px] bg-[#FFEFEF] border border-[#FF8E8E]/30 hover:bg-[#FF8E8E]/10 py-1.5 rounded-xl cursor-pointer text-[#FF8E8E] transition-colors font-bold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 ถ่ายรูปของคุณจากกล้อง</span>
                </button>
              </div>
            </div>

            {/* Partner Avatar and Nickname Settings Block */}
            <div className="bg-[#F8FBFF] p-4 rounded-2xl border border-[#E9F1FE] space-y-3">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">👥 รูปภาพ & ชื่อเล่นของแฟน</span>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full border-2 border-indigo-300 bg-[#E9F1FE] flex items-center justify-center text-2xl overflow-hidden shadow-xs shrink-0">
                  {editPartnerAvatar ? (
                    <img src={editPartnerAvatar} alt="partner avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>🐱</span>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-center">
                    เปลี่ยน
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'partner')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">ชื่อเล่นของแฟน 🐱</label>
                  <input
                    type="text"
                    value={editPartnerNickname}
                    onChange={(e) => setEditPartnerNickname(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
                    placeholder="ชื่อน่ารักๆ ของแฟน"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label className="block text-center text-[11px] bg-white border border-dashed border-[#F0E6DD] hover:border-indigo-400 py-1.5 rounded-xl cursor-pointer text-gray-500 transition-colors font-medium">
                  📁 เลือกอัปโหลดรูปภาพของแฟน
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'partner')}
                    className="hidden"
                  />
                </label>
                <button
                  id="btn-camera-partner"
                  type="button"
                  onClick={() => {
                    setActiveCameraTarget('partner');
                    setFacingMode('user');
                  }}
                  className="w-full text-center text-[11px] bg-[#E9F1FE] border border-indigo-300/30 hover:bg-indigo-50 py-1.5 rounded-xl cursor-pointer text-indigo-500 transition-colors font-bold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 ถ่ายรูปของแฟนจากกล้อง</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#5D4E4E] mb-1">วันแรกที่รักกัน / วันครบรอบ 📅</label>
              <input
                type="date"
                value={editAnniversary}
                onChange={(e) => setEditAnniversary(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#5D4E4E] mb-1">สโลแกนหรือข้อความรักสั้นๆ 💬</label>
              <input
                type="text"
                value={editLoveMessage}
                onChange={(e) => setEditLoveMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
                placeholder="คำอ้อนๆ หรือคำสัญญา"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-[#FF8E8E] rounded-xl hover:bg-[#FF8E8E]/85 shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              บันทึกข้อมูลหวานใจ
            </button>
          </div>
        </div>
      )}

      {/* Anniversary & Important Days Notifications Widget */}
      <div className="kawaii-card p-5 bg-white border border-[#F0E6DD] space-y-4">
        <h4 className="font-extrabold text-xs text-[#5D4E4E] flex items-center gap-1.5 border-b border-[#F0E6DD] pb-2">
          <span>🔔</span>
          <span>กล่องแจ้งเตือนวันสำคัญ & กิจกรรมหวานใจ</span>
        </h4>

        {todayEventsList.length === 0 && upcomingEventsList.length === 0 ? (
          <div className="p-4 bg-[#FFF9F5]/50 border border-dashed border-[#F0E6DD] rounded-2xl text-center text-[#A89090] flex flex-col items-center gap-2">
            <span className="text-2xl">🌸</span>
            <p className="text-xs font-bold text-[#5D4E4E]">ช่วงนี้ไม่มีวันพิเศษใน 14 วันข้างหน้าจ้า</p>
            <p className="text-[10px]">มีวันครบรอบหรือวันเกิดไหมนะ? ลองแวะไปบันทึกที่ปฏิทินเพื่อเริ่มการแจ้งเตือนนะงับ!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Today events list */}
            {todayEventsList.map((ev) => (
              <div 
                key={ev.id} 
                className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎉</span>
                  <div>
                    <p className="text-xs font-black text-rose-700">วันนี้คือวันสำคัญนะคนเก่ง!</p>
                    <p className="text-xs font-bold text-gray-800">{ev.title}</p>
                    {ev.notes && <p className="text-[10px] text-gray-500">{ev.notes}</p>}
                  </div>
                </div>
                <span className="text-[10px] font-black bg-red-200 text-red-800 px-2.5 py-1 rounded-lg shrink-0">
                  วันนี้แล้ว! 💖
                </span>
              </div>
            ))}

            {/* Upcoming events list */}
            {upcomingEventsList.map((ev) => {
              const daysLeft = getDaysDiff(ev.date);
              return (
                <div 
                  key={ev.id} 
                  className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{ev.title}</p>
                      <p className="text-[10px] text-gray-500">
                        วันที่ {new Date(ev.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}
                        {ev.notes ? ` • ${ev.notes}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg shrink-0">
                    อีก {daysLeft} วัน 🎉
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {activeCameraTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-[#F0E6DD] shadow-xl flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#FFF9F5] to-[#F5F1EE] border-b border-[#F0E6DD] flex items-center justify-between">
              <span className="font-extrabold text-[#5D4E4E] text-xs flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF8E8E]" />
                ถ่ายรูปโปรไฟล์ของ {activeCameraTarget === 'user' ? 'คุณ 🐶' : 'แฟน 🐱'}
              </span>
              <button
                id="btn-close-camera-modal"
                type="button"
                onClick={() => {
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                  }
                  setCameraStream(null);
                  setActiveCameraTarget(null);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Camera Feed */}
            <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-red-400 text-xs font-semibold space-y-2">
                  <span>⚠️</span>
                  <p>{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  {/* Subtle decorative guide circle */}
                  <div className="absolute inset-0 border-[3px] border-[#FF8E8E]/30 rounded-full m-8 pointer-events-none border-dashed animate-pulse" />
                </>
              )}
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-gray-50 flex flex-col gap-3">
              {!cameraError && (
                <div className="flex justify-between items-center gap-3">
                  <button
                    id="btn-switch-camera-facing"
                    type="button"
                    onClick={toggleFacingMode}
                    className="px-3 py-2 text-[11px] font-bold text-gray-500 bg-white border border-[#F0E6DD] hover:bg-gray-50 rounded-xl flex items-center gap-1.5 shadow-3xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
                    สลับกล้อง ({facingMode === 'user' ? 'กล้องหน้า' : 'กล้องหลัง'})
                  </button>
                  
                  <button
                    id="btn-capture-camera"
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    กดถ่ายรูป 📸
                  </button>
                </div>
              )}

              <p className="text-[10px] text-center text-[#A89090] font-medium leading-relaxed">
                *ระบบจะดึงภาพจากกล้องมาเป็นรูปโปรไฟล์ทันทีเมื่อกดปุ่มถ่ายรูป โดยไม่มีการส่งภาพไปประมวลผลภายนอกเบราว์เซอร์เพื่อความเป็นส่วนตัวสูงสุดค่ะ ✨
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
