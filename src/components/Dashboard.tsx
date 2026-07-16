import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Image as ImageIcon, Calendar as CalendarIcon, User as UserIcon, LogOut, Sparkles, Bell } from 'lucide-react';
import Chat from './Chat';
import Memories from './Memories';
import Calendar from './Calendar';
import Profile from './Profile';

interface DashboardProps {
  currentUser: any;
  partner: any;
  couple: any;
  onRefreshData: () => void;
  onLogout: () => void;
}

export default function Dashboard({ currentUser, partner, couple, onRefreshData, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'memories' | 'calendar' | 'profile'>('chat');
  const [unreadMessages, setUnreadMessages] = useState(0);

  const handleNewMessage = () => {
    if (activeTab !== 'chat') {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const handleTabChange = (tab: 'chat' | 'memories' | 'calendar' | 'profile') => {
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
              <img 
                src={partner.avatar} 
                alt={partner.name} 
                className="w-8 h-8 rounded-full border-2 border-white object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-950">{currentUser.name} & {partner.name}</p>
              <span className="text-[9px] text-rose-500">คู่รักสุดอบอุ่น 💕</span>
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
      <main className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="p-4 md:p-8"
          >
            {activeTab === 'chat' && (
              <Chat 
                currentUser={currentUser} 
                partner={partner} 
                isActive={activeTab === 'chat'}
                onNewMessageReceived={handleNewMessage}
              />
            )}
            
            {activeTab === 'memories' && (
              <Memories 
                currentUser={currentUser} 
              />
            )}

            {activeTab === 'calendar' && (
              <Calendar 
                currentUser={currentUser} 
                couple={couple}
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
      </main>
    </div>
  );
}
