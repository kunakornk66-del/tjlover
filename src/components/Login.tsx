import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Mail, Lock, User, Sparkles, ArrowRight, LogOut, Copy, Check } from 'lucide-react';
import { request } from '../lib/api';

interface LoginProps {
  onLoginSuccess: (user: any, partner: any, couple: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Connection state (when logged in but not connected yet)
  const [tempUser, setTempUser] = useState<any>(null);
  const [partnerInput, setPartnerInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });
        localStorage.setItem('couple_token', res.token);
        checkConnection(res.user);
      } else {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('couple_token', res.token);
        checkConnection(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async (user: any) => {
    try {
      const res = await request('/api/auth/me');
      onLoginSuccess(res.user, res.partner, res.couple);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคู่รัก');
    }
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
        // Successfully connected! Refresh profiles
        const meRes = await request('/api/auth/me');
        onLoginSuccess(meRes.user, meRes.partner, meRes.couple);
      }
    } catch (err: any) {
      setError(err.message || 'ไม่พบผู้ใช้หรือผู้ใช้เชื่อมต่อกับคนอื่นแล้ว');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!tempUser?.inviteCode) return;
    navigator.clipboard.writeText(tempUser.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('couple_token');
    setTempUser(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  if (tempUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-rose-50 to-orange-100 p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border border-rose-100 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-full mb-3 shadow-lg shadow-rose-200">
              <Heart className="w-8 h-8 fill-white animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-[#5D2E46]">ยินดีต้อนรับ, {tempUser.name}!</h2>
            <p className="text-rose-700/80 mt-2 text-sm">ยินดีต้อนรับสู่พื้นที่คู่รักส่วนตัวของคุณ ขั้นตอนสุดท้ายคือการเชื่อมต่อกับคนที่คุณรัก</p>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl mb-6 text-center">
            <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider block mb-1">รหัสคำชวนของคุณ</span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-wider text-rose-600">{tempUser.inviteCode}</span>
              <button 
                onClick={copyCode}
                className="p-1.5 hover:bg-white rounded-lg transition text-rose-500 border border-transparent hover:border-rose-200"
                title="คัดลอกรหัส"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2">ส่งรหัสนี้หรืออีเมลของคุณให้คนรักของคุณกรอกเพื่อเชื่อมต่อ</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">หรือกรอกรหัส/อีเมลของคนรัก</label>
              <input
                type="text"
                placeholder="กรอกรหัสคำชวน หรือ อีเมลของคนรัก"
                value={partnerInput}
                onChange={(e) => setPartnerInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-sm bg-stone-50"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-medium transition duration-200 text-sm shadow-md shadow-rose-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>เชื่อมต่อคู่รัก</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-stone-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-stone-400">เข้าสู่ระบบด้วย {tempUser.email}</span>
            <button 
              onClick={handleLogout}
              className="text-stone-500 hover:text-red-500 flex items-center gap-1.5 font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-rose-50 to-orange-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-pulse delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-md w-full border-2 border-rose-100/50 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-full mb-3 relative shadow-lg shadow-rose-200">
            <Heart className="w-8 h-8 fill-white animate-pulse" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-[#5D2E46] tracking-tight bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">Couple Space</h1>
          <p className="text-rose-700/80 mt-2 text-sm">พื้นที่บันทึกความทรงจำ แชทส่วนตัว และปฏิทินส่วนตัวสำหรับเราสองคน</p>
        </div>

        <div className="flex border-b border-stone-100 mb-6">
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition ${!isSignUp ? 'text-rose-500 border-b-2 border-rose-500' : 'text-stone-400 hover:text-stone-600'}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            เข้าสู่ระบบ
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-semibold transition ${isSignUp ? 'text-rose-500 border-b-2 border-rose-500' : 'text-stone-400 hover:text-stone-600'}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            สร้างบัญชีใหม่
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">ชื่อของคุณ</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="เช่น ฟ้า, ต้น"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-sm bg-stone-50/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-sm bg-stone-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition text-sm bg-stone-50/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center font-medium bg-red-50 border border-red-100 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-medium transition duration-200 text-sm shadow-md shadow-rose-200 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? 'สร้างบัญชีและดำเนินการต่อ' : 'เข้าสู่ระบบ'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-6">
          ข้อมูลแชทและรูปภาพของคุณจะถูกเก็บเป็นความลับสูงสุดเฉพาะคู่ของคุณเท่านั้น 🔒
        </p>
      </motion.div>
    </div>
  );
}
