import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, LogOut, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LockScreenProps {
  pinCode: string;
  userNickname: string;
  partnerNickname: string;
  onUnlock: () => void;
  onLogout: () => void;
}

export default function LockScreen({
  pinCode,
  userNickname,
  partnerNickname,
  onUnlock,
  onLogout,
}: LockScreenProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Keyboard input listener for ease of use on computer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [input, pinCode]);

  const handleKeyPress = (num: string) => {
    if (input.length < 4) {
      const newVal = input + num;
      setInput(newVal);
      setError('');

      if (newVal === pinCode) {
        // Correct PIN entered!
        onUnlock();
      } else if (newVal.length === 4) {
        // Incorrect PIN entered (4 digits reached, but doesn't match pinCode)
        setTimeout(() => {
          setError('❌ รหัส PIN ไม่ถูกต้องค่ะ กรุณาลองใหม่อีกครั้งนะคะ');
          setIsShaking(true);
          setInput('');
          // Reset shake state
          setTimeout(() => setIsShaking(false), 500);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setInput((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setInput('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFF9F5]/98 text-[#5D4E4E] flex flex-col justify-between p-6 antialiased select-none overflow-y-auto">
      {/* Background soft blurs for extra aesthetic points */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-100/40 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-100/40 blur-3xl pointer-events-none"></div>

      {/* Top Bar with Logout */}
      <div className="w-full max-w-md mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-1 text-[11px] font-black text-rose-400 bg-rose-50 px-3 py-1 rounded-full border border-rose-100/50">
          <Lock className="w-3 h-3" />
          <span>คุ้มครองความเป็นส่วนตัวสูงสุด</span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs font-bold text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-all hover:scale-105 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-[#F0E6DD] shadow-3xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>สลับบัญชี/ออกจากระบบ</span>
        </button>
      </div>

      {/* Main Lock Screen Card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto my-6 z-10">
        <motion.div
          animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full flex flex-col items-center text-center space-y-6"
        >
          {/* Padlock / Avatar visualizer */}
          <div className="relative">
            <span className="inline-block w-20 h-20 bg-linear-to-tr from-rose-400 to-[#FF8E8E] rounded-full flex items-center justify-center text-4xl shadow-md border-4 border-white animate-pulse">
              🔒
            </span>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-brand-peach">
              <Heart className="w-4 h-4 text-brand-pink fill-current animate-ping absolute opacity-30" />
              <Heart className="w-4 h-4 text-brand-pink fill-current" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-extrabold text-xl tracking-tight">
              รหัสผ่านเข้าถึงห้องรัก 💖
            </h1>
            <p className="text-xs text-[#A89090] font-semibold leading-relaxed max-w-xs mx-auto">
              ห้องรักระหว่าง <strong>{userNickname || 'คุณหมีน้อย'}</strong> กับ <strong>{partnerNickname || 'คุณกระต่าย'}</strong> ถูกล็อกไว้เพื่อความเป็นส่วนตัวสูงสุดค่ะ 💕
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-4.5 my-4">
            {[0, 1, 2, 3].map((index) => {
              const hasVal = input.length > index;
              return (
                <motion.div
                  key={index}
                  animate={{
                    scale: hasVal ? 1.25 : 1,
                    backgroundColor: hasVal ? 'var(--color-brand-pink, #FF8E8E)' : '#E5E7EB',
                  }}
                  className={`w-4 h-4 rounded-full border-2 ${
                    hasVal ? 'border-brand-pink' : 'border-gray-200'
                  } transition-colors`}
                />
              );
            })}
          </div>

          {/* Error message or help */}
          <div className="h-5 text-center">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-xs text-rose-500 font-extrabold"
                >
                  {error}
                </motion.p>
              ) : (
                <p className="text-[11px] text-gray-400 font-bold">
                  กรุณากรอกรหัสผ่าน 4 หลักของคุณ (พิมพ์ผ่านแป้นพิมพ์บนจอหรือคีย์บอร์ดได้เลยจ้า)
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-y-3.5 gap-x-6 w-full max-w-[280px] mx-auto mt-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="w-16 h-16 rounded-full bg-white hover:bg-rose-50/50 border border-[#F0E6DD] text-lg font-black text-[#5D4E4E] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-3xs"
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-gray-200"
            >
              ล้าง
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="w-16 h-16 rounded-full bg-white hover:bg-rose-50/50 border border-[#F0E6DD] text-lg font-black text-[#5D4E4E] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-3xs"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-16 h-16 rounded-full bg-gray-50 hover:bg-rose-50/60 text-xs font-bold text-rose-500 flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-gray-200"
            >
              ลบ ⌫
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer credits or helpful tips */}
      <div className="text-center text-[10px] text-gray-400 font-medium py-2 z-10">
        🛡️ ระบบแอปความปลอดภัยสูง • เข้ารหัสรอยยิ้มความทรงจำส่วนบุคคล 💑
      </div>
    </div>
  );
}
