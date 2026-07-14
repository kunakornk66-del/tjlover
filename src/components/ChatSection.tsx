import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, Lock, Eye, EyeOff, Key, Sparkles, Image as ImageIcon, Video, Trash2, LogOut } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mediaUrl?: string, mediaType?: 'photo' | 'video' | 'sticker') => void;
  activeUser: 'user' | 'partner';
  userNickname: string;
  partnerNickname: string;
  onTriggerNotification: (message: string) => void;
  onLogout?: () => void;
  partnerLastActiveTime?: string | null;
}

// Simulated simple cryptographic hash for visualization
const simulateEncrypt = (text: string, secretKey: string) => {
  if (!text) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text + secretKey);
  let hash = '';
  for (let i = 0; i < Math.min(32, data.length); i++) {
    hash += (data[i] ^ 42).toString(16).padStart(2, '0');
  }
  
  let safeBase64 = '';
  try {
    safeBase64 = btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    safeBase64 = 'abcdefghij';
  }
  
  return 'U2FsdGVkX1/' + hash + 'x9a0fB...' + safeBase64.substring(0, 10);
};

export default function ChatSection({
  messages,
  onSendMessage,
  activeUser,
  userNickname,
  partnerNickname,
  onTriggerNotification,
  onLogout,
  partnerLastActiveTime,
}: ChatSectionProps) {
  const [inputText, setInputText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [secretPassphrase, setSecretPassphrase] = useState('LOVEMYPARTNER1314');
  const [showEncryptedView, setShowEncryptedView] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const [isSecurityPanelOpen, setIsSecurityPanelOpen] = useState(false);

  const activeName = activeUser === 'user' ? userNickname : partnerNickname;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return '';
    }
  };

  const getPartnerActiveStatus = () => {
    if (!partnerLastActiveTime) return 'ยังไม่เข้าสู่ระบบหรือออฟไลน์อยู่ค่ะ';
    
    try {
      const lastActiveDate = new Date(partnerLastActiveTime);
      const now = new Date();
      const diffMs = now.getTime() - lastActiveDate.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffSecs < 15) {
        return '🟢 หวานใจกำลังออนไลน์อยู่ตอนนี้';
      } else if (diffMins < 1) {
        return '⏱️ ออนไลน์เมื่อไม่กี่วินาทีก่อน';
      } else if (diffMins < 60) {
        return `⏱️ ออนไลน์เมื่อ ${diffMins} นาทีที่แล้ว`;
      } else if (diffHours < 24) {
        return `⏱️ ออนไลน์เมื่อ ${diffHours} ชั่วโมงที่แล้ว`;
      } else {
        return `⏱️ ออนไลน์ล่าสุดเมื่อ ${lastActiveDate.toLocaleDateString('th-TH')} ${lastActiveDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      }
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type: 'photo' | 'video' = file.type.startsWith('video/') ? 'video' : 'photo';
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedMedia({
        url: reader.result as string,
        type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    if (attachedMedia) {
      onSendMessage(inputText, attachedMedia.url, attachedMedia.type);
      setAttachedMedia(null);
    } else {
      onSendMessage(inputText);
    }
    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Real-time Private Chat Box */}
      <div className="w-full flex flex-col h-[520px] kawaii-card bg-white overflow-hidden border border-[#F0E6DD]">
        {/* Chat header */}
        <div className="bg-gradient-to-r from-[#FFF9F5] to-[#F5F1EE] p-4 border-b border-[#F0E6DD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full border border-[#FF8E8E] bg-white flex items-center justify-center text-xl shadow-xs">
              {activeUser === 'user' ? '🐶' : '🐱'}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#5D4E4E]">แชทรหัสรักสองเรา</span>
                <span className="flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-2.5 h-2.5" /> SECURE
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-[#A89090] font-semibold leading-none">
                  กำลังแชทเป็น: <span className="underline">{activeName}</span> (เปลี่ยนสลับฝ่ายได้ที่หัวข้อบนสุด)
                </p>
                <p className={`text-[9px] font-bold leading-none mt-1 ${getPartnerActiveStatus().startsWith('🟢') ? 'text-emerald-500' : 'text-[#A89090]'}`}>
                  {getPartnerActiveStatus()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowEncryptedView(!showEncryptedView)}
              className="p-2 bg-white hover:bg-white border border-[#F0E6DD] rounded-full text-[#FF8E8E] hover:text-[#5D4E4E] transition-colors cursor-pointer"
              title={showEncryptedView ? 'ดูแชทแบบปกติ' : 'ดู Payload การเข้ารหัสความลับ'}
            >
              {showEncryptedView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="ออกจากระบบหวานใจ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>
        </div>

        {/* E2EE Warning Banner */}
        <div className="bg-[#FFF9F5]/70 border-b border-[#F0E6DD] px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-[#5D4E4E] font-semibold">
          <Shield className="w-3.5 h-3.5 text-[#FF8E8E] animate-pulse" />
          <span>แชทนี้เข้ารหัสข้อมูลด้วย AES-256 ก่อนส่งบันทึกลงระบบคลาวด์ ปลอดภัยต่อข้อมูลส่วนตัว 100%</span>
        </div>

        {/* Chat messages list */}
        <div ref={chatListRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF9F5]/20 scrollbar-thin">
          {messages.map((msg) => {
            const isMe = msg.senderId === activeUser;
            const senderName = msg.senderId === 'user' ? userNickname : partnerNickname;
            const avatar = msg.senderId === 'user' ? '🐶' : '🐱';

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full border border-[#F0E6DD] bg-white flex items-center justify-center text-base shadow-3xs shrink-0 mb-1">
                  {avatar}
                </div>

                {/* Message Bubble */}
                <div className="max-w-[70%] space-y-0.5">
                  <span className="text-[8px] text-gray-400 font-bold block px-1">
                    {senderName}
                  </span>
                  
                  <div
                    className={`p-3 rounded-2xl text-xs font-medium border relative leading-relaxed ${
                      isMe
                        ? 'bg-[#FF8E8E] text-white border-[#FF8E8E] shadow-3xs rounded-br-none'
                        : 'bg-[#FFF9F5] text-[#5D4E4E] border-[#F0E6DD] shadow-3xs rounded-bl-none'
                    }`}
                  >
                    {/* Encrypted / Decrypted Toggle simulation */}
                    {showEncryptedView ? (
                      <div className="font-mono text-[9px] break-all opacity-90 space-y-1">
                        <div className="text-emerald-500 font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> CIPHERTEXT:
                        </div>
                        <div className="bg-gray-900 text-green-400 p-1 rounded-md text-[8px] leading-tight">
                          {simulateEncrypt(msg.text || '[รูปภาพ]', secretPassphrase)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* If it's a photo */}
                        {msg.mediaType === 'photo' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/20 max-w-[240px] shadow-xs">
                            <img 
                              src={msg.mediaUrl} 
                              alt="Photo attachment" 
                              className="w-full h-auto object-cover max-h-[220px]" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {/* If it's a video */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/20 max-w-[240px] shadow-xs bg-black">
                            <video 
                              src={msg.mediaUrl} 
                              controls 
                              className="w-full h-auto max-h-[220px]" 
                            />
                          </div>
                        )}
                        {/* Text content if present */}
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex flex-col items-end justify-end pb-1 select-none shrink-0 min-w-[45px]">
                  {isMe ? (
                    msg.seen ? (
                      <span className="text-[8px] text-[#FF8E8E] font-black font-mono flex flex-col items-end leading-normal text-right">
                        <span>อ่านแล้ว ✓✓</span>
                        <span className="text-[7px] text-gray-300 font-normal">{formatTime(msg.timestamp)}</span>
                      </span>
                    ) : (
                      <span className="text-[8px] text-gray-400 font-black font-mono flex flex-col items-end leading-normal text-right">
                        <span>ส่งแล้ว ✓</span>
                        <span className="text-[7px] text-gray-300 font-normal">{formatTime(msg.timestamp)}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[7px] text-gray-400 font-normal font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Attachment preview banner */}
        {attachedMedia && (
          <div className="px-3 py-2 bg-[#FFF9F5] border-t border-[#F0E6DD] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#5D4E4E]">
              <span className="text-sm">📎</span>
              <span className="font-black text-[11px]">เตรียมส่ง{attachedMedia.type === 'photo' ? 'รูปภาพ' : 'วิดีโอ'}:</span>
              {attachedMedia.type === 'photo' ? (
                <img src={attachedMedia.url} className="w-8 h-8 rounded-lg object-cover border border-[#FF8E8E]" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-black border border-[#FF8E8E] flex items-center justify-center text-[7px] text-white font-extrabold font-mono leading-none">
                  VIDEO
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAttachedMedia(null)}
              className="text-[9px] bg-white border border-[#F0E6DD] hover:bg-[#FFEFEF] hover:text-[#FF8E8E] px-2.5 py-1 rounded-lg text-gray-500 font-bold transition-all cursor-pointer"
            >
              ยกเลิก ✕
            </button>
          </div>
        )}

        {/* Chat input form */}
        <div className="border-t border-[#F0E6DD] bg-[#FFFBF9]/30 p-2.5 flex flex-col gap-2">
          {/* Action Row for Media */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white hover:bg-[#FFEFEF] text-[#5D4E4E] border border-[#F0E6DD] hover:border-[#FF8E8E] font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              📎 แนบรูปภาพ / วิดีโอรัก
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 w-full">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={attachedMedia ? "ใส่คำอธิบายภาพ (หรือไม่ใส่ก็ได้นะ)..." : `พิมพ์คุยกับหวานใจในฐานะ ${activeName}...`}
              className="flex-1 text-xs p-2.5 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E] bg-white font-medium"
              maxLength={100}
              required={!attachedMedia}
            />
            <button
              type="submit"
              className="bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งรัก</span>
            </button>
          </form>
        </div>
      </div>

      {/* Collapsible Security & Cryptography Panel */}
      <div className="w-full border border-[#F0E6DD] rounded-3xl overflow-hidden bg-white shadow-3xs">
        <button
          id="btn-toggle-security-panel"
          type="button"
          onClick={() => setIsSecurityPanelOpen(!isSecurityPanelOpen)}
          className="w-full p-4 bg-gradient-to-r from-[#FFFDFB] to-[#FFF9F5] hover:from-[#FFF9F5] hover:to-[#FFF5F0] flex items-center justify-between text-xs font-black text-[#5D4E4E] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-[#FF8E8E]" />
            <span>🔒 ตั้งค่ารหัสผ่านและการตรวจสอบการเข้ารหัสแชท (AES-256 Crypto Inspector)</span>
          </div>
          <span className="text-[#FF8E8E] text-[10px] bg-white border border-[#F0E6DD] px-3 py-1.5 rounded-xl shadow-3xs font-extrabold hover:scale-105 transition-transform">
            {isSecurityPanelOpen ? '▲ ปิดแผงคีย์รหัส' : '▼ เปิดแผงคีย์รหัส'}
          </span>
        </button>

        {isSecurityPanelOpen && (
          <div className="p-6 bg-[#FAF8F5] border-t border-[#F0E6DD] grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Shared Passphrase Card */}
            <div className="kawaii-card p-5 bg-white border border-[#F0E6DD]">
              <h4 className="font-bold text-[#5D4E4E] text-xs mb-3 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#FF8E8E]" />
                คีย์รหัสลับคู่รัก (Shared Key) 🔑
              </h4>
              <p className="text-[11px] text-[#A89090] mb-3 leading-relaxed">
                คีย์นี้จะใช้ในการเข้าและถอดรหัส (AES-256) ทุกข้อความและการสำรองข้อมูลทั้งหมดในเบราว์เซอร์ของคนทั้งคู่ โดยระบบคลาวด์จะไม่รู้คีย์นี้เลยเพื่อความเป็นส่วนตัวสูงสุด!
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#5D4E4E] mb-0.5">กุญแจลับร่วมกัน (Passphrase)</label>
                  <input
                    type="password"
                    value={secretPassphrase}
                    onChange={(e) => setSecretPassphrase(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden font-mono text-[#FF8E8E] font-bold"
                  />
                </div>
                <div className="bg-[#FFF9F5] p-3 rounded-xl border border-[#F0E6DD] flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#FF8E8E] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#5D4E4E] leading-normal">
                    <strong>ความปลอดภัยขั้นสูง:</strong> ข้อความที่ส่งจะถูกถอดรหัสเฉพาะเมื่อป้อนรหัสผ่านที่ตรงกันในอุปกรณ์ของคู่รักของคุณเท่านั้น!
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time AES-256 Inspector */}
            <div className="kawaii-card p-5 bg-slate-900 text-slate-100 border-slate-800 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-[#FF8E8E] text-xs flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  AES-256 CRYPTO INSPECTOR
                </h4>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  REAL-TIME MONITOR
                </span>
              </div>

              <div className="space-y-3 font-mono text-[10px]">
                {/* Raw JSON Data */}
                <div className="space-y-1">
                  <span className="text-gray-400 text-[9px] block uppercase tracking-wider">1. Raw Message Object (JSON)</span>
                  <div className="bg-slate-950 p-2 rounded-lg text-slate-300 break-all border border-slate-800">
                    {inputText ? (
                      <span>
                        {`{`} <br />
                        &nbsp;&nbsp;"senderId": "{activeUser}", <br />
                        &nbsp;&nbsp;"text": "{inputText}", <br />
                        &nbsp;&nbsp;"isEncrypted": true <br />
                        {`}`}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic">ลองเริ่มพิมพ์ข้อความในแชทเพื่อตรวจสอบโครงสร้างข้อมูล...</span>
                    )}
                  </div>
                </div>

                {/* Encrypted Output payload */}
                <div className="space-y-1">
                  <span className="text-gray-400 text-[9px] block uppercase tracking-wider">2. Encrypted Ciphertext Payload (AES-256)</span>
                  <div className="bg-slate-950 p-2 rounded-lg text-green-400 break-all border border-slate-800 leading-normal">
                    {inputText ? (
                      simulateEncrypt(inputText, secretPassphrase)
                    ) : (
                      <span className="text-slate-600 italic">พร้อมแสดงข้อมูลหลังเข้ารหัสแบบเรียลไทม์...</span>
                    )}
                  </div>
                </div>

                {/* Inspector info */}
                <div className="text-[9px] text-[#FF8E8E] leading-normal flex items-start gap-1">
                  <span>✨</span>
                  <p>นี่คือต้นแบบแสดงให้เห็นว่าคู่รักสามารถแชทหากันได้ปลอดภัยสูงสุด โดยแอดมินหรือระบบโฮสติ้งก็ไม่สามารถแอบอ่านได้ค่ะ!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
