import React, { useState } from 'react';
import { Smile, Heart, Sparkles, MessageSquare, Send, Bell, Compass } from 'lucide-react';
import { MoodLog } from '../types';

interface MoodLoggerSectionProps {
  moodLogs: MoodLog[];
  onLogMood: (mood: string, note: string) => void;
  activeUser: 'user' | 'partner';
  userNickname: string;
  partnerNickname: string;
  onTriggerNotification: (message: string) => void;
}

const MOODS = [
  { key: 'love', emoji: '🥰', label: 'คลั่งรักสุดๆ', bg: 'bg-rose-100 hover:bg-rose-200 border-rose-300', text: 'text-rose-700' },
  { key: 'happy', emoji: '😊', label: 'มีความสุขจัง', bg: 'bg-pink-100 hover:bg-pink-200 border-pink-300', text: 'text-pink-700' },
  { key: 'shy', emoji: '😳', label: 'เขินแก้มแดง', bg: 'bg-amber-100 hover:bg-amber-200 border-amber-300', text: 'text-amber-700' },
  { key: 'chill', emoji: '🥱', label: 'ชิวๆ ง่วงนอน', bg: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300', text: 'text-indigo-700' },
  { key: 'sad', emoji: '😭', label: 'งอน/น้อยใจนะ', bg: 'bg-blue-100 hover:bg-blue-200 border-blue-300', text: 'text-blue-700' },
  { key: 'angry', emoji: '😤', label: 'จาหยิกหลังนะ', bg: 'bg-purple-100 hover:bg-purple-200 border-purple-300', text: 'text-purple-700' },
];

export default function MoodLoggerSection({
  moodLogs,
  onLogMood,
  activeUser,
  userNickname,
  partnerNickname,
  onTriggerNotification,
}: MoodLoggerSectionProps) {
  const [selectedMood, setSelectedMood] = useState('love');
  const [moodNote, setMoodNote] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = moodLogs.find((l) => l.date === todayStr);

  const handleSaveMood = () => {
    onLogMood(selectedMood, moodNote);
    setMoodNote('');
    
    // Auto-generate cute message for partner
    const selectedMoodObj = MOODS.find(m => m.key === selectedMood);
    const activeName = activeUser === 'user' ? userNickname : partnerNickname;
    onTriggerNotification(`💝 ${activeName} บันทึกความรู้สึกว่า "${selectedMoodObj?.emoji} ${selectedMoodObj?.label}" แล้วนะค้าบ!`);
  };

  const handlePoke = () => {
    const activeName = activeUser === 'user' ? userNickname : partnerNickname;
    const partnerName = activeUser === 'user' ? partnerNickname : userNickname;
    onTriggerNotification(`👉 *สะกิด สะกิด* ${activeName} ได้ทำการสะกิดอ้อน ${partnerName} ให้มาลงบันทึกความรู้สึกจ้า!`);
  };

  const getMoodDetail = (key?: string) => {
    if (!key) return { emoji: '❓', label: 'ยังไม่ได้ระบุ', text: 'text-gray-400' };
    return MOODS.find((m) => m.key === key) || { emoji: '😊', label: 'ปานกลาง', text: 'text-gray-700' };
  };

  // Recent 5 logs
  const sortedLogs = [...moodLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Log mood today */}
      <div className="lg:col-span-7 space-y-4">
        <div className="kawaii-card p-5 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-[#FFEFEF] text-[#FF8E8E] text-xs px-2.5 py-1 rounded-full font-bold">
                DAILY MOOD LOGGER
              </span>
              <h3 className="font-bold text-[#5D4E4E] text-sm mt-1.5">
                วันนี้หวานใจรู้สึกอย่างไรบ้างคะ?
              </h3>
            </div>
            <button
              onClick={handlePoke}
              className="px-3 py-1.5 bg-white hover:bg-[#FFEFEF] border border-[#F0E6DD] rounded-full text-xs text-[#5D4E4E] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-[#FF8E8E] animate-swing" />
              สะกิดอ้อนแฟน 🐶
            </button>
          </div>

          {/* Emojis selection */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m.key)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  selectedMood === m.key
                    ? 'border-[#FF8E8E] bg-[#FFEFEF] ring-1 ring-[#FF8E8E]/30 scale-105 font-bold'
                    : 'border-[#F0E6DD] bg-white hover:bg-[#FFF9F5]'
                }`}
              >
                <span className="text-3xl mb-1 filter drop-shadow-xs">{m.emoji}</span>
                <span className={`text-[10px] font-bold ${selectedMood === m.key ? 'text-[#FF8E8E]' : 'text-gray-500'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                บอกเล่าเรื่องสั้นๆ ให้แฟนฟัง (เช่น วันนี้เหนื่อยจัง / คิดถึงที่สุดเลย)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="เขียนข้อความอ้อนๆ ตรงนี้เลย..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
                  maxLength={60}
                />
                <button
                  onClick={handleSaveMood}
                  className="bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  แชร์อารมณ์
                </button>
              </div>
            </div>
          </div>

          {/* Today's logged mood result */}
          <div className="mt-5 pt-4 border-t border-[#F0E6DD] bg-[#FFF9F5] p-3 rounded-2xl">
            <h4 className="text-xs font-bold text-[#5D4E4E] mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              อุณหภูมิใจของเราทั้งคู่ในวันนี้:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Active User Mood */}
              <div className="bg-white p-3 rounded-xl border border-[#F0E6DD] flex items-center gap-3">
                <div className="text-3xl bg-[#FFEFEF] w-11 h-11 rounded-full flex items-center justify-center">
                  {todayLog?.userMood ? getMoodDetail(todayLog.userMood).emoji : '❓'}
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold block">{userNickname} (คุณ)</span>
                  <span className="text-xs font-bold text-[#5D4E4E]">
                    {todayLog?.userMood ? getMoodDetail(todayLog.userMood).label : 'ยังไม่ได้บอกเลย'}
                  </span>
                  {todayLog?.userNote && (
                    <p className="text-[10px] text-gray-500 italic mt-0.5 truncate max-w-[120px]">
                      "{todayLog.userNote}"
                    </p>
                  )}
                </div>
              </div>

              {/* Partner Mood */}
              <div className="bg-white p-3 rounded-xl border border-[#F0E6DD] flex items-center gap-3">
                <div className="text-3xl bg-[#FFF9F5] w-11 h-11 rounded-full flex items-center justify-center">
                  {todayLog?.partnerMood ? getMoodDetail(todayLog.partnerMood).emoji : '❓'}
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold block">{partnerNickname} (หวานใจ)</span>
                  <span className="text-xs font-bold text-[#5D4E4E]">
                    {todayLog?.partnerMood ? getMoodDetail(todayLog.partnerMood).label : 'แฟนยังไม่มาลงน้า'}
                  </span>
                  {todayLog?.partnerNote && (
                    <p className="text-[10px] text-gray-500 italic mt-0.5 truncate max-w-[120px]">
                      "{todayLog.partnerNote}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="lg:col-span-5">
        <div className="kawaii-card p-5 bg-white h-full flex flex-col">
          <h3 className="font-bold text-[#5D4E4E] text-xs mb-3 flex items-center gap-1">
            <Compass className="w-4 h-4 text-[#FF8E8E]" />
            สมุดบันทึกย้อนหลัง 📖
          </h3>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {sortedLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">ยังไม่มีประวัติอุณหภูมิใจเลยจ้า</p>
              </div>
            ) : (
              sortedLogs.map((log) => {
                const userMoodInfo = getMoodDetail(log.userMood);
                const partnerMoodInfo = getMoodDetail(log.partnerMood);
                const isToday = log.date === todayStr;

                return (
                  <div
                    key={log.date}
                    className={`p-3 rounded-2xl border flex flex-col space-y-2 relative transition-all ${
                      isToday ? 'border-[#FF8E8E] bg-[#FFEFEF]/10' : 'border-[#F0E6DD] bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#5D4E4E] bg-[#FFF9F5] px-2 py-0.5 rounded-full border border-[#F0E6DD]">
                        {new Date(log.date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {isToday && ' (วันนี้)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* User's state */}
                      <div className="border-r border-[#F0E6DD] pr-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{userMoodInfo.emoji}</span>
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold block">{userNickname}</span>
                            <span className="text-[10px] font-bold text-gray-700">{userMoodInfo.label}</span>
                          </div>
                        </div>
                        {log.userNote && (
                          <p className="text-[9px] text-gray-500 italic mt-1 bg-[#FFF9F5] p-1 rounded-md">
                            "{log.userNote}"
                          </p>
                        )}
                      </div>

                      {/* Partner's state */}
                      <div className="pl-1">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{partnerMoodInfo.emoji}</span>
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold block">{partnerNickname}</span>
                            <span className="text-[10px] font-bold text-gray-700">{partnerMoodInfo.label}</span>
                          </div>
                        </div>
                        {log.partnerNote && (
                          <p className="text-[9px] text-gray-500 italic mt-1 bg-[#FFF9F5] p-1 rounded-md">
                            "{log.partnerNote}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
