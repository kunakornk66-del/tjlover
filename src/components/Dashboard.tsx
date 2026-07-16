import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Image as ImageIcon, Calendar as CalendarIcon, User as UserIcon, LogOut, Sparkles, Bell, Copy, Check, X } from 'lucide-react';
import Chat from './Chat';
import Memories from './Memories';
import Calendar from './Calendar';
import Profile from './Profile';
import CoupleConnectWidget from './CoupleConnectWidget';
import PhotoGallery from './PhotoGallery';

interface DashboardProps {
  currentUser: any;
  partner: any;
  couple: any;
  onRefreshData: () => void;
  onLogout: () => void;
}

export default function Dashboard({ currentUser, partner, couple, onRefreshData, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'gallery' | 'memories' | 'calendar' | 'profile'>('chat');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNewMessage = () => {
    if (activeTab !== 'chat') {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const handleTabChange = (tab: 'chat' | 'gallery' | 'memories' | 'calendar' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadMessages(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFF5F7] text-[#5D2E46]">
      {/* Sidebar/Navigation */}
      <aside className="w-full md:w-64 bg-white/95 backdrop-blur-md border-b md:border-b-0 md:border-r border-rose-100 flex flex-col shrink-0 md:h-screen sticky top-0 z-30 shadow-sm">
        {/* Brand Header */}
        <div className="p-5 border-b border-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-linear-to-r from-rose-500 to-orange-400 text-white p-2 rounded-xl shadow-md shadow-rose-200">
              <Heart className="w-5 h-5 fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm font-heading tracking-tight leading-none text-rose-900">Couple Space</h1>
              <span className="text-[10px] text-rose-400 mt-1 block font-medium">แชร์พื้นที่แห่งรักร่วมกัน</span>
            </div>
          </div>

          <div className="md:hidden">
            <button 
              onClick={onLogout}
              className="p-2 text-rose-400 hover:text-rose-600 rounded-lg transition"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Summary Card (only on desktop sidebar) */}
        <div className="hidden md:block p-5 border-b border-rose-50 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 relative">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full border-2 border-white object-cover" 
                referrerPolicy="no-referrer"
              />
              {partner ? (
                <img 
                  src={partner.avatar} 
                  alt={partner.name} 
                  className="w-8 h-8 rounded-full border-2 border-white object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-100 flex items-center justify-center text-rose-400 text-[10px] font-bold">
                  +
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-950">
                {currentUser.name} {partner ? `& ${partner.name}` : ''}
              </p>
              <span className="text-[9px] text-rose-500">
                {partner ? 'คู่รักสุดอบอุ่น 💕' : 'รอเชื่อมต่อคนรัก... ⏳'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex md:flex-col gap-1 p-3 md:p-4 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => handleTabChange('chat')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition w-full shrink-0 md:shrink-1 ${
              activeTab === 'chat' 
                ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm' 
                : 'text-rose-700/70 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadMessages}
                </span>
              )}
            </div>
            <span>ห้องแชทลับ</span>
          </button>

          <button
            onClick={() => handleTabChange('memories')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition w-full shrink-0 md:shrink-1 ${
              activeTab === 'memories' 
                ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm' 
                : 'text-rose-700/70 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>ความทรงจำ</span>
          </button>

          <button
            onClick={() => handleTabChange('gallery')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition w-full shrink-0 md:shrink-1 ${
              activeTab === 'gallery' 
                ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm' 
                : 'text-rose-700/70 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>คลังรูปภาพ 📸</span>
          </button>

          <button
            onClick={() => handleTabChange('calendar')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition w-full shrink-0 md:shrink-1 ${
              activeTab === 'calendar' 
                ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm' 
                : 'text-rose-700/70 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>ปฏิทินคนสำคัญ</span>
          </button>

          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition w-full shrink-0 md:shrink-1 ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm' 
                : 'text-rose-700/70 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>พื้นที่ของเรา</span>
          </button>
        </nav>

        {/* Desktop Logout Button */}
        <div className="mt-auto hidden md:block p-4 border-t border-rose-50">
          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-rose-700 hover:text-rose-900 hover:bg-rose-100/50 rounded-xl text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
        {/* Solo Mode Banner */}
        {!partner && (
          <div className="mb-6 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-orange-400/10 border border-pink-100 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3.5 relative z-10 text-center md:text-left flex-col md:flex-row">
              <div className="bg-white/90 p-3 rounded-2xl text-rose-500 shadow-sm shrink-0">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-rose-950 flex items-center justify-center md:justify-start gap-1.5">
                  กำลังใช้งานในโหมดคนเดียว (รอคุณแฟนเข้าร่วม...) ⏳
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                  คุณสามารถพิมพ์แชท บันทึกความทรงจำ หรือกำหนดวันสำคัญรอไว้ก่อนได้เลย! เมื่อแฟนเชื่อมต่อเข้ามา ข้อมูลทั้งหมดที่คุณทำไว้จะถูกแบ่งปันร่วมกันทันที 💕
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 relative z-10 w-full md:w-auto justify-end">
              <div className="bg-white/95 border border-rose-100 px-3.5 py-2 rounded-xl text-xs font-mono font-black text-rose-600 flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
                <span>รหัสคำชวน: {currentUser?.inviteCode || '-'}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser?.inviteCode || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-stone-400 hover:text-rose-500 transition p-0.5"
                  title="คัดลอกรหัสคำชวน"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={() => setShowConnectModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 active:scale-[0.98] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                <span>เชื่อมต่อคู่รัก</span>
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'chat' && (
              <Chat 
                currentUser={currentUser} 
                partner={partner} 
                isActive={activeTab === 'chat'}
                onNewMessageReceived={handleNewMessage}
                onRefreshData={onRefreshData}
              />
            )}
            
            {activeTab === 'memories' && (
              <Memories 
                currentUser={currentUser} 
                onRefreshData={onRefreshData}
              />
            )}

            {activeTab === 'gallery' && (
              <PhotoGallery 
                currentUser={currentUser} 
                partner={partner}
                onRefreshData={onRefreshData}
              />
            )}

            {activeTab === 'calendar' && (
              <Calendar 
                currentUser={currentUser} 
                couple={couple}
                onRefreshData={onRefreshData}
              />
            )}

            {activeTab === 'profile' && (
              <Profile 
                currentUser={currentUser} 
                partner={partner} 
                couple={couple}
                onProfileUpdate={onRefreshData}
                onLogout={onLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Connect Partner Modal */}
        <AnimatePresence>
          {showConnectModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-md w-full"
              >
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="absolute top-10 right-8 z-50 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition"
                  title="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
                <CoupleConnectWidget 
                  currentUser={currentUser}
                  onRefreshData={() => {
                    setShowConnectModal(false);
                    onRefreshData();
                  }}
                  title="เชื่อมต่อกับคนรักของคุณ 💖"
                  description="สร้างห้องรักแสนอบอุ่นสำหรับคุณสองคนโดยเชื่อมต่อผ่านอีเมลหรือรหัสคำชวน!"
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
