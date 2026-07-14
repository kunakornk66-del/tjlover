import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Calendar, MessageCircle, RefreshCw, ArrowRight, BookOpen, Bell } from 'lucide-react';
import { Memory } from '../types';

interface DailyFlashbackReminderProps {
  memories: Memory[];
  onSendMessage: (text: string, mediaUrl?: string, mediaType?: 'photo' | 'video' | 'sticker') => Promise<void>;
  onNavigateToTab: (tab: 'home' | 'calendar' | 'memories' | 'chat' | 'mood' | 'security') => void;
  activeUser: 'user' | 'partner';
  userNickname: string;
  partnerNickname: string;
  onTriggerNotification: (message: string, type: 'info' | 'love' | 'security') => void;
}

export default function DailyFlashbackReminder({
  memories,
  onSendMessage,
  onNavigateToTab,
  activeUser,
  userNickname,
  partnerNickname,
  onTriggerNotification,
}: DailyFlashbackReminderProps) {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  // Initialize or shuffle memory
  const shuffleMemory = () => {
    if (memories.length === 0) {
      setSelectedMemory(null);
      return;
    }
    
    // Pick a random memory
    // If we have multiple memories, try to pick one different from current
    let randomIndex = Math.floor(Math.random() * memories.length);
    if (memories.length > 1 && selectedMemory) {
      let attempts = 0;
      while (memories[randomIndex].id === selectedMemory.id && attempts < 10) {
        randomIndex = Math.floor(Math.random() * memories.length);
        attempts++;
      }
    }
    
    setSelectedMemory(memories[randomIndex]);
    setIsSent(false);
    setAnimateKey((prev) => prev + 1);
  };

  // Select a memory on mount or if memories are loaded
  useEffect(() => {
    if (memories.length > 0 && !selectedMemory) {
      shuffleMemory();
    }
  }, [memories, selectedMemory]);

  const handleShareToChat = async () => {
    if (!selectedMemory) return;
    
    const senderName = activeUser === 'user' ? (userNickname || 'เรา') : (partnerNickname || 'หวานใจ');
    const displayDate = new Date(selectedMemory.date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const shareText = `✨ [ย้อนวันวานความรัก] 💖\n${senderName} ได้แชร์ความทรงจำเก่าสุดประทับใจมาสะกิดหัวใจเธอในวันนี้!\n\n🌸 เรื่อง: "${selectedMemory.title}"\n📅 วันที่บันทึก: ${displayDate}\n📝 บันทึกว่า: "${selectedMemory.content.slice(0, 100)}${selectedMemory.content.length > 100 ? '...' : ''}"\n\nย้อนวันวานไปด้วยกันนะคะ 💕`;

    try {
      await onSendMessage(shareText, selectedMemory.mediaUrl, selectedMemory.type === 'note' ? undefined : 'photo');
      setIsSent(true);
      onTriggerNotification('💕 แชร์ความทรงจำแสนหวานลงในห้องแชทของสองเราแล้วค่ะ!', 'love');
    } catch (error) {
      console.error('Error sharing memory:', error);
      onTriggerNotification('เกิดข้อผิดพลาดในการแชร์ความทรงจำค่ะ', 'info');
    }
  };

  // Helper for readable relative time or nice tag
  const getRelativeTimeTag = (dateStr: string) => {
    try {
      const recordedDate = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - recordedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `เมื่อ ${diffDays} วันที่แล้ว 🌱`;
      } else {
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
          return `เมื่อ ${diffMonths} เดือนก่อน 📅`;
        } else {
          const diffYears = Math.floor(diffMonths / 12);
          const remainingMonths = diffMonths % 12;
          return `เมื่อ ${diffYears} ปี ${remainingMonths > 0 ? `${remainingMonths} เดือน` : ''}ที่แล้ว 🎉`;
        }
      }
    } catch (e) {
      return 'เมื่อวันวาน ✨';
    }
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div id="daily-flashback-container" className="w-full bg-white border border-[#F0E6DD] rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
      {/* Decorative Hearts and Background Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-linear-to-bl from-rose-100/40 via-[#FFF9F5]/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-linear-to-tr from-pink-50/50 via-[#FFF9F5]/10 to-transparent rounded-full -ml-12 -mb-12 pointer-events-none" />

      {/* Header section with pulsating bell/sparkles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EDE6] mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF3F3] border border-[#FFD9D9] rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] bg-[#FFEFEF] text-[#FF8E8E] font-black px-2 py-0.5 rounded-full border border-[#FFD9D9] uppercase tracking-wider">
              In-app Flashback Reminder
            </span>
            <h2 className="text-base font-extrabold text-[#5D4E4E] mt-0.5 flex items-center gap-1.5">
              <span>สะกิดบันทึกรักวันวาน</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h2>
          </div>
        </div>

        {memories.length > 0 && (
          <button
            type="button"
            onClick={shuffleMemory}
            className="text-xs bg-[#FFF9F5] hover:bg-[#FFF3F3] text-[#FF8E8E] border border-[#FFD5D5] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer shadow-3xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>สุ่มความทรงจำใหม่ 🎲</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {memories.length === 0 ? (
        <div className="text-center py-6 px-4 space-y-4">
          <div className="w-16 h-16 bg-[#FFF9F5] border border-[#F5EDE6] rounded-full flex items-center justify-center mx-auto text-3xl">
            📸
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-[#5D4E4E]">
              "ยังไม่มีภาพถ่ายหรือความทรงจำที่ถูกบันทึกไว้..."
            </h3>
            <p className="text-xs text-[#A89090] max-w-md mx-auto leading-relaxed">
              เมื่อคุณสร้างกล่องความทรงจำร่วมกับคู่รักแล้ว ระบบจะช่วยสุ่มย้อนความหลังสุดประทับใจมาเตือนให้อมยิ้มด้วยกันในที่นี่ทุกๆ วันค่ะ!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('memories')}
            className="inline-flex items-center gap-1.5 text-xs bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 text-white font-black px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>เริ่มบันทึกความทรงจำแรกกันเถอะ ✍️</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {selectedMemory && (
            <motion.div
              key={animateKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 relative z-10"
            >
              {/* Memory Preview Card */}
              <div className="bg-[#FFFDFB] border border-[#F5EDE6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                {/* Time Badge and Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span className="text-xs font-black text-[#FF8E8E]">
                      {getRelativeTimeTag(selectedMemory.date)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A89090] font-bold bg-gray-100 px-2 py-0.5 rounded-md">
                    {selectedMemory.type === 'photo_album' ? '🖼️ อัลบั้มภาพ' : 
                     selectedMemory.type === 'video_album' ? '📹 อัลบั้มวิดีโอ' :
                     selectedMemory.type === 'video' ? '🎬 วิดีโอสั้น' : '📝 บันทึกโน้ตรัก'}
                  </span>
                </div>

                {/* Media and Text */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {selectedMemory.mediaUrl && (
                    <div className="md:col-span-4 rounded-xl overflow-hidden bg-gray-50 border border-[#F0E6DD] aspect-4/3 flex items-center justify-center relative shadow-3xs max-h-40 md:max-h-full">
                      <img
                        src={selectedMemory.mediaUrl}
                        alt={selectedMemory.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500';
                        }}
                      />
                    </div>
                  )}

                  <div className={`${selectedMemory.mediaUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-2 text-left`}>
                    <h4 className="font-extrabold text-[#5D4E4E] text-base leading-tight">
                      {selectedMemory.title}
                    </h4>
                    
                    <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3 md:line-clamp-4">
                      {selectedMemory.content}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>วันที่จดจำ: {formatDate(selectedMemory.date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action and Interaction Panel */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareToChat}
                    disabled={isSent}
                    className={`text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-3xs cursor-pointer border ${
                      isSent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 text-white border-[#FF8E8E]'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isSent ? 'ส่งแชร์เข้าแชทสำเร็จแล้วค่ะ 🎉' : 'แชร์หวานให้คู่รักผ่านห้องแชท 💬'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToTab('memories')}
                  className="text-xs text-[#A89090] hover:text-[#5D4E4E] font-extrabold px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>ดูคลังความทรงจำทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
