import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Copy, Check, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { request } from '../lib/api';

interface CoupleConnectWidgetProps {
  currentUser: any;
  onRefreshData: () => void;
  title: string;
  description: string;
}

export default function CoupleConnectWidget({ currentUser, onRefreshData, title, description }: CoupleConnectWidgetProps) {
  const [partnerInput, setPartnerInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const copyCode = () => {
    if (!currentUser?.inviteCode) return;
    navigator.clipboard.writeText(currentUser.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInput.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await request('/api/couple/connect', {
        method: 'POST',
        body: JSON.stringify({ partnerEmailOrCode: partnerInput }),
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onRefreshData();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'ไม่พบผู้ใช้ หรือ ผู้ใช้เชื่อมต่อกับคนอื่นไปแล้ว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30 text-center relative overflow-hidden"
      >
        {/* Abstract Background Highlights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex p-3 bg-rose-50 text-rose-500 rounded-full mb-4 shadow-sm relative">
            <Heart className="w-8 h-8 fill-rose-500 text-rose-500 animate-pulse" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>

          <h3 className="text-xl font-bold font-heading text-rose-905">{title}</h3>
          <p className="text-stone-500 text-xs mt-2 leading-relaxed">{description}</p>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-semibold flex flex-col items-center gap-2"
            >
              <UserCheck className="w-8 h-8 text-green-500 animate-bounce" />
              <span>เชื่อมต่อสำเร็จแล้ว! กำลังเข้าสู่พื้นที่รักของคุณ... 💕</span>
            </motion.div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Box showing current user invite code */}
              <div className="bg-rose-50/50 border border-rose-100/70 p-4 rounded-2xl text-center">
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block mb-1">รหัสคำชวนของคุณ</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl font-mono font-black tracking-wider text-rose-600">
                    {currentUser?.inviteCode || '-'}
                  </span>
                  <button 
                    onClick={copyCode}
                    className="p-1.5 hover:bg-white rounded-lg transition text-rose-500 border border-transparent hover:border-rose-100 shadow-sm"
                    title="คัดลอกรหัส"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-2">ส่งรหัสนี้หรืออีเมลของคุณ ({currentUser?.email}) ให้แฟนของคุณกรอกเพื่อเชื่อมต่อกัน</p>
              </div>

              {/* Form to input partner invite code or email */}
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-stone-600 mb-1.5 uppercase tracking-wider">หรือกรอกรหัส/อีเมลของคนรัก</label>
                  <input
                    type="text"
                    required
                    placeholder="กรอกรหัสคำชวน หรือ อีเมลของคนรัก"
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-xs bg-stone-50"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-semibold bg-red-50 border border-red-100 py-2 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold transition duration-200 text-xs shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>เชื่อมต่อกับคนรัก</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
