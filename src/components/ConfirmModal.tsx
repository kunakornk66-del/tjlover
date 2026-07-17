import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยันที่จะลบ 🗑️',
  cancelText = 'คิดดูก่อนนะ 🌸',
  onConfirm,
  onCancel,
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        {/* Backdrop with a soft blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white border-2 border-[#F0E6DD] rounded-3xl p-6 shadow-2xl space-y-4 text-center z-10"
        >
          {/* Header Icon with dynamic color scheme */}
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-white ${
            isDanger ? 'bg-rose-100 text-rose-500 animate-bounce' : 'bg-pink-100 text-[#FF8E8E]'
          }`}>
            {isDanger ? '🥺' : '💖'}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-[#5D4E4E] tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed px-2">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold rounded-xl text-xs cursor-pointer transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full py-2.5 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm transition-all active:scale-95 ${
                isDanger
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600'
                  : 'bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
