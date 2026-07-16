import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Loader } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { request } from './lib/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('couple_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await request('/api/auth/me');
      setCurrentUser(res.user);
      setPartner(res.partner);
      setCouple(res.couple);
    } catch (err) {
      console.error('Failed to load profile', err);
      // Clear invalid token
      localStorage.removeItem('couple_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLoginSuccess = (user: any, partnerData: any, coupleData: any) => {
    setCurrentUser(user);
    setPartner(partnerData);
    setCouple(coupleData);
  };

  const handleLogout = () => {
    localStorage.removeItem('couple_token');
    setCurrentUser(null);
    setPartner(null);
    setCouple(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-radial from-rose-50 to-stone-50">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-rose-500 mb-4"
        >
          <Heart className="w-12 h-12 fill-rose-500 text-rose-500" />
        </motion.div>
        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
          <Loader className="w-4 h-4 animate-spin text-rose-400" />
          <span>กำลังเปิดพื้นที่ส่วนตัวของคุณ...</span>
        </div>
      </div>
    );
  }

  // If we are logged in AND we have a matched partner / couple room, go to dashboard
  if (currentUser && currentUser.coupleId && partner) {
    return (
      <Dashboard 
        currentUser={currentUser}
        partner={partner}
        couple={couple}
        onRefreshData={fetchProfile}
        onLogout={handleLogout}
      />
    );
  }

  // Otherwise, render login component which handles login, signup, and pairing screens
  return (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}
