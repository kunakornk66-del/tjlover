import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Edit2, Check, User, Calendar, Smile, ShieldCheck, LogOut } from 'lucide-react';
import { request } from '../lib/api';

interface ProfileProps {
  currentUser: any;
  partner: any;
  couple: any;
  onProfileUpdate: () => void;
  onLogout: () => void;
}

export default function Profile({ currentUser, partner, couple, onProfileUpdate, onLogout }: ProfileProps) {
  const [name, setName] = useState(currentUser.name);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversaryDate || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
          anniversaryDate,
          avatar
        }),
      });
      setSuccessMsg('อัปเดตข้อมูลสำเร็จแล้ว ✨');
      setEditing(false);
      onProfileUpdate();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
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
          
          <h2 className="text-3xl font-black font-heading tracking-tight">
            เราคบกันมาแล้ว
          </h2>
          
          <div className="text-6xl font-extrabold tracking-wider font-heading my-4 animate-bounce">
            {calculateDaysTogether()} <span className="text-2xl font-semibold">วัน</span>
          </div>

          <p className="text-rose-100 text-xs">
            ตั้งแต่เริ่มตกลงเป็นแฟนกันเมื่อวันที่ {couple?.anniversaryDate ? new Date(couple.anniversaryDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
          </p>
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

            <div className="grid sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block font-semibold text-rose-800 mb-1.5">อวาตาร์ของคุณ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                  />
                  <button
                    type="button"
                    onClick={generateRandomAvatar}
                    className="px-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg text-rose-700 font-semibold transition shrink-0"
                  >
                    สุ่มรูปภาพ
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
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
              <span className="font-semibold text-rose-700">รหัสคำชวน</span>
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
