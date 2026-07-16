import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image, Trash2, ShieldAlert, Sparkles, Plus, X, Heart, Eye } from 'lucide-react';
import { request } from '../lib/api';
import { ChatMessage } from '../types';
import CoupleConnectWidget from './CoupleConnectWidget';

interface ChatProps {
  currentUser: any;
  partner: any;
  isActive: boolean;
  onNewMessageReceived?: () => void;
  onRefreshData?: () => void;
}

export default function Chat({ currentUser, partner, isActive, onNewMessageReceived, onRefreshData }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load chat notification audio once
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2857/2857-84.wav');
    audioRef.current.volume = 0.5;
  }, []);

  // Poll for messages every 2.5 seconds
  useEffect(() => {
    if (!currentUser.coupleId) return;
    const fetchMessages = async () => {
      try {
        const data = await request('/api/chats');
        setMessages(prev => {
          // If we have new messages and the chat is not active (or active but just arrived), notify
          if (data.length > prev.length && prev.length > 0) {
            const lastMsg = data[data.length - 1];
            if (lastMsg.senderId !== currentUser.id) {
              // Play notification sound
              audioRef.current?.play().catch(() => {});
              // Invoke callback
              if (onNewMessageReceived) {
                onNewMessageReceived();
              }
            }
          }
          return data;
        });
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [currentUser.id, currentUser.coupleId, onNewMessageReceived]);

  // Scroll to bottom on messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle multiple image attachment via base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    e.target.value = '';
  };

  const removeAttachedImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && images.length === 0) return;

    const textToSend = inputText;
    const imagesToSend = images;

    // Reset input right away for responsive UI
    setInputText('');
    setImages([]);
    setLoading(true);

    try {
      const res = await request('/api/chats/send', {
        method: 'POST',
        body: JSON.stringify({
          text: textToSend,
          images: imagesToSend,
        }),
      });
      setMessages(prev => [...prev, res]);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setLoading(false);
    }
  };

  const partnerName = partner ? partner.name : "ที่รักของคุณ";
  const partnerAvatar = partner ? partner.avatar : "https://api.dicebear.com/7.x/adventurer/svg?seed=LovePlaceholder";
  const partnerStatus = partner ? (partner.customStatus || "Happy together! 💕") : "รอที่รักเชื่อมต่ออยู่นะ... ⏳";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] bg-white/80 backdrop-blur-md border border-rose-100 rounded-3xl overflow-hidden shadow-xl relative">
      {/* Top Bar */}
      <div className="bg-white/95 px-6 py-4 border-b border-rose-100 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={partnerAvatar} 
              alt={partnerName} 
              className="w-10 h-10 rounded-full object-cover border border-rose-200" 
              referrerPolicy="no-referrer"
            />
            {partner ? (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            ) : (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-300 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-rose-950 text-sm leading-tight">{partnerName}</h3>
            <span className="text-xs text-rose-450 mt-0.5 block">{partnerStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white font-medium bg-gradient-to-r from-rose-500 to-orange-400 px-3 py-1.5 rounded-full border border-rose-100/30 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
          <span>{partner ? "แชทส่วนตัวเฉพาะเราสองคน" : "แชทลับส่วนตัวของคุณ"}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-rose-50/30 to-orange-50/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-full text-white mb-3 shadow-lg shadow-rose-100 animate-pulse">
              <Heart className="w-8 h-8 fill-rose-100" />
            </div>
            <h4 className="text-rose-900 font-semibold text-sm">เริ่มต้นคุยกันเลย!</h4>
            <p className="text-rose-600/70 text-xs max-w-xs mt-1">ส่งข้อความ รูปภาพ หรือบอกฝันดีให้คนรักของคุณที่นี่ ทุกคำคุยจะคงอยู่อย่างปลอดภัย</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser.id;
            const msgTime = new Date(msg.createdAt).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isMe && (
                  <img 
                    src={partnerAvatar} 
                    alt={partnerName} 
                    className="w-8 h-8 rounded-full object-cover self-end border border-rose-100" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex flex-col space-y-1">
                  <div 
                    className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                      isMe 
                        ? 'bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-br-none shadow-md shadow-rose-200/50' 
                        : 'bg-white text-[#5D2E46] rounded-bl-none border border-rose-100'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>}
                    
                    {/* Render message attached images */}
                    {msg.images && msg.images.length > 0 && (
                      <div className={`grid gap-1.5 mt-2 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {msg.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="relative group overflow-hidden rounded-xl cursor-pointer">
                            <img 
                              src={img} 
                              alt="Uploaded content" 
                              className="max-h-60 w-full object-cover rounded-xl border border-stone-100" 
                              onClick={() => setLightboxImage(img)}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-stone-400 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msgTime}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="bg-white/95 border-t border-rose-100 p-4 shadow-sm z-10">
        {/* Attached Images Preview */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-rose-200 shadow-sm">
                <img src={img} alt="Attached preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachedImage(idx)}
                  className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-rose-200 hover:border-rose-400 flex items-center justify-center cursor-pointer transition text-rose-400 hover:text-rose-500 bg-white">
              <Plus className="w-5 h-5" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <label className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer transition flex-shrink-0">
            <Image className="w-5 h-5" />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <input
            type="text"
            placeholder="พิมพ์ข้อความคุยกันที่นี่..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 py-2.5 px-4 rounded-full border border-rose-150 bg-rose-50/30 text-[#5D2E46] placeholder-rose-450/60 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-sm transition"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && images.length === 0) || loading}
            className="p-2.5 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-full hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition shadow-md shadow-rose-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightboxImage}
              alt="Enlarged view"
              className="max-h-[90vh] max-w-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
