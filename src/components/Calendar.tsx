import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Tag, ChevronLeft, ChevronRight, X, Heart, Sparkles } from 'lucide-react';
import { request } from '../lib/api';
import { CalendarEvent } from '../types';

interface CalendarProps {
  currentUser: any;
  couple: any;
}

export default function Calendar({ currentUser, couple }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'anniversary' | 'date' | 'milestone' | 'general'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const data = await request('/api/calendar');
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Prev month / Next month
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNamesTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const categoryLabels = {
    anniversary: { label: "วันครบรอบ", color: "bg-rose-100 text-rose-600 border-rose-200" },
    date: { label: "นัดเดท", color: "bg-pink-100 text-pink-600 border-pink-200" },
    milestone: { label: "เป้าหมายร่วมกัน", color: "bg-purple-100 text-purple-600 border-purple-200" },
    general: { label: "เรื่องสำคัญอื่นๆ", color: "bg-amber-100 text-amber-600 border-amber-200" }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !category) {
      setError('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await request('/api/calendar/create', {
        method: 'POST',
        body: JSON.stringify({ title, date, description, category }),
      });
      setTitle('');
      setDescription('');
      setIsAdding(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มกิจกรรม');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('ต้องการลบกิจกรรมนี้ออกจากปฏิทิน?')) return;
    try {
      await request(`/api/calendar/${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  // Get events on a specific day
  const getDayEvents = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dayStr);
  };

  // Calculate countdown to the next anniversary or special event
  const getCountdown = (eventDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "วันนี้! 🎉";
    if (diffDays > 0) return `อีก ${diffDays} วัน`;
    return `ผ่านมาแล้ว ${Math.abs(diffDays)} วัน`;
  };

  // Render calendar days
  const calendarDays = [];
  // Empty slots for previous month offset
  // Adjust so firstDayOfMonth (0=Sunday, 6=Saturday) leaves right offsets
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-14 md:h-16 bg-stone-50/40 rounded-lg"></div>);
  }

  // Days in active month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = getDayEvents(d);
    const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

    calendarDays.push(
      <div 
        key={`day-${d}`} 
        className={`h-14 md:h-16 p-1 bg-white border border-stone-100 rounded-xl relative hover:bg-stone-50 transition ${isToday ? 'ring-2 ring-rose-400 ring-offset-1' : ''}`}
      >
        <span className={`text-xs font-semibold ${isToday ? 'text-rose-600 font-bold' : 'text-stone-600'}`}>{d}</span>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 justify-center flex-wrap max-h-5 overflow-hidden">
            {dayEvents.map((e, idx) => (
              <span 
                key={e.id} 
                className={`w-2 h-2 rounded-full ${
                  e.category === 'anniversary' ? 'bg-rose-500' :
                  e.category === 'date' ? 'bg-pink-500' :
                  e.category === 'milestone' ? 'bg-purple-500' : 'bg-amber-500'
                }`}
                title={e.title}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
      {/* Left Column: Calendar Main Grid */}
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white/95 p-5 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30">
          {/* Calendar Controller */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-md font-bold font-heading text-[#5D2E46] bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              {monthNamesTH[month]} {year + 543}
            </h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={prevMonth}
                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center flex-wrap bg-white/90 p-3 rounded-2xl border border-rose-100 text-[10px] text-rose-700 font-semibold shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>วันครบรอบ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>นัดเดท</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>เป้าหมายร่วมกัน</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>เรื่องสำคัญอื่นๆ</span>
          </div>
        </div>
      </div>

      {/* Right Column: Events & Anniversaries countdown */}
      <div className="space-y-4">
        <div className="bg-white/95 p-5 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30 flex flex-col h-full min-h-[350px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-rose-950 text-sm font-heading">กิจกรรมและวันครบรอบ 📆</h3>
              <p className="text-[10px] text-rose-500/80 mt-0.5">บันทึกนัดหมายหรือวันสำคัญที่กำลังมาถึง</p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="p-2 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-xl transition shadow-md shadow-rose-100 flex-shrink-0"
              title="เพิ่มนัดหมายใหม่"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Event list */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-1">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="p-3 bg-rose-50 rounded-full text-rose-400 mb-2">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <p className="text-xs text-stone-500">ยังไม่มีนัดหมายในระบบ</p>
                <p className="text-[10px] text-stone-400 mt-0.5">กดปุ่มสีแดงด้านบนเพื่อบันทึกวันสำคัญของคุณ</p>
              </div>
            ) : (
              [...events]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => {
                  const eventType = categoryLabels[event.category] || categoryLabels.general;
                  const formattedEventDate = new Date(event.date).toLocaleDateString('th-TH', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div 
                      key={event.id}
                      className="p-3 border border-stone-100 rounded-xl bg-stone-50/30 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${eventType.color}`}>
                            {eventType.label}
                          </span>
                          <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {getCountdown(event.date)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-stone-800">{event.title}</h4>
                        {event.description && (
                          <p className="text-[10px] text-stone-500 leading-normal">{event.description}</p>
                        )}
                        <span className="text-[9px] text-stone-400 block">{formattedEventDate}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-md transition"
                        title="ลบกิจกรรม"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-5 shadow-2xl max-w-sm w-full border border-rose-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-[#5D2E46] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>บันทึกวันสำคัญใหม่</span>
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-1 hover:bg-rose-50 rounded-full text-rose-450 hover:text-rose-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">หัวข้อ / วันสำคัญ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น วันครบรอบ, วันเกิดตูน, ทริปหัวหิน"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-800 mb-1">วันที่</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-rose-800 mb-1">ประเภท</label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-rose-50/20 text-[#5D2E46]"
                    >
                      <option value="general">เรื่องสำคัญอื่นๆ</option>
                      <option value="anniversary">วันครบรอบ 💖</option>
                      <option value="date">นัดเดท 🍿</option>
                      <option value="milestone">เป้าหมายร่วมกัน 🎯</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-600 mb-1">รายละเอียด (ตัวเลือกเพิ่มเติม)</label>
                  <textarea
                    rows={2}
                    placeholder="รายละเอียดเพิ่มเติมความประทับใจ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-stone-50/50 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-center font-semibold mt-1">{error}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-tr from-rose-500 to-orange-400 text-white px-4 py-2 rounded-lg transition flex items-center justify-center font-semibold shadow-md shadow-rose-200"
                  >
                    {loading ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
