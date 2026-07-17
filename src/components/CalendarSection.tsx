import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Heart, Sparkles, Plus, Trash2, Tag, Gift, Award, Clock, BookOpen, Save, X, Edit3 } from 'lucide-react';
import { CalendarEvent, Memory } from '../types';
import ConfirmModal from './ConfirmModal';

interface CalendarSectionProps {
  events: CalendarEvent[];
  memories?: Memory[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  activeUser: 'user' | 'partner';
  userNickname: string;
  partnerNickname: string;
}

export default function CalendarSection({
  events,
  memories = [],
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  activeUser,
  userNickname,
  partnerNickname,
}: CalendarSectionProps) {
  const getLocalDateString = (dateObj: Date = new Date()) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getLocalDateString(new Date())
  );
  
  // State for creating a new event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'anniversary' | 'date' | 'special' | 'other'>('date');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Daily Diary states
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  const [diaryText, setDiaryText] = useState('');

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 1. Reset edit state and update text when selectedDateStr changes
  useEffect(() => {
    const existing = events.find((e) => e.date === selectedDateStr && e.category === 'diary');
    setDiaryText(existing?.notes || '');
    setIsEditingDiary(false);
  }, [selectedDateStr]);

  // 2. Only update text from background polling when the user is NOT editing
  useEffect(() => {
    if (!isEditingDiary) {
      const existing = events.find((e) => e.date === selectedDateStr && e.category === 'diary');
      setDiaryText(existing?.notes || '');
    }
  }, [events, selectedDateStr, isEditingDiary]);

  const handleSaveDiary = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = events.find((e) => e.date === selectedDateStr && e.category === 'diary');
    if (existing) {
      if (!diaryText.trim()) {
        onDeleteEvent(existing.id);
      } else {
        onUpdateEvent(existing.id, { notes: diaryText, creatorId: activeUser });
      }
    } else {
      if (diaryText.trim()) {
        const newDiary: CalendarEvent = {
          id: `ev-${Date.now()}`,
          title: 'บันทึกไดอารี่ประจำวัน 📖',
          date: selectedDateStr,
          category: 'diary',
          notes: diaryText,
          creatorId: activeUser,
        };
        onAddEvent(newDiary);
      }
    }
    setIsEditingDiary(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper arrays
  const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const monthsThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Calendar logic
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);

  const daysGrid: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Previous month filler days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    daysGrid.push({ day: i, isCurrentMonth: true, dateStr });
  }

  // Next month filler days to complete grid (usually 42 cells)
  const totalCellsNeeded = 42;
  const nextMonthFillerCount = totalCellsNeeded - daysGrid.length;
  for (let i = 1; i <= nextMonthFillerCount; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    daysGrid.push({ day: i, isCurrentMonth: false, dateStr });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const event: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEventTitle,
      date: selectedDateStr,
      category: newEventCategory,
      notes: newEventNotes,
      creatorId: activeUser,
    };

    onAddEvent(event);
    setNewEventTitle('');
    setNewEventNotes('');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'anniversary':
        return 'bg-rose-500 text-white';
      case 'date':
        return 'bg-pink-400 text-white';
      case 'special':
        return 'bg-purple-400 text-white';
      case 'diary':
        return 'bg-emerald-500 text-white';
      default:
        return 'bg-amber-400 text-white';
    }
  };

  const getCategoryBorder = (cat: string) => {
    switch (cat) {
      case 'anniversary':
        return 'border-rose-300 bg-rose-50';
      case 'date':
        return 'border-pink-200 bg-pink-50';
      case 'special':
        return 'border-purple-200 bg-purple-50';
      case 'diary':
        return 'border-emerald-200 bg-emerald-50';
      default:
        return 'border-amber-200 bg-amber-50';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'anniversary':
        return '❤️ ครบรอบสำคัญ';
      case 'date':
        return '🌹 เดทสุดหวาน';
      case 'special':
        return '✨ ความทรงจำพิเศษ';
      case 'diary':
        return '📖 ไดอารี่ความรักประจำวัน';
      default:
        return '📌 เรื่องทั่วไป';
    }
  };

  // Events and Memories on the selected day
  const selectedDayEvents = events.filter((e) => e.date === selectedDateStr);
  const selectedDayMemories = memories.filter((m) => m.date === selectedDateStr);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Calendar Grid card */}
      <div className="lg:col-span-7 kawaii-card p-5 bg-white flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FFEFEF] rounded-full text-brand-pink">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-[#5D4E4E] text-lg">
              ปฏิทินรักของสองเรา
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-[#FFF9F5] border border-[#F0E6DD] rounded-full px-2 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#FF8E8E] hover:bg-[#FFEFEF] rounded-full cursor-pointer text-sm font-bold"
            >
              &lt;
            </button>
            <span className="text-xs md:text-sm font-bold text-[#5D4E4E] px-2 min-w-[100px] text-center">
              {monthsThai[month]} {year + 543}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#FF8E8E] hover:bg-[#FFEFEF] rounded-full cursor-pointer text-sm font-bold"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#5D4E4E] mb-2 border-b border-[#F0E6DD] pb-2">
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={idx === 0 || idx === 6 ? 'text-[#FF8E8E]' : 'text-[#A89090]'}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid cells */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {daysGrid.map((cell, idx) => {
            const isSelected = selectedDateStr === cell.dateStr;
            const isToday = getLocalDateString(new Date()) === cell.dateStr;
            const dayEvents = events.filter((e) => e.date === cell.dateStr);
            const dayMemories = memories.filter((m) => m.date === cell.dateStr);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[60px] md:min-h-[75px] p-1.5 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative ${
                  cell.isCurrentMonth
                    ? 'bg-white hover:bg-[#FFF9F5]'
                    : 'bg-[#F5F1EE]/40 text-[#A89090] border-dashed border-[#F0E6DD]'
                } ${
                  isSelected
                    ? 'border-[#FF8E8E] ring-1 ring-[#FF8E8E]/40 bg-[#FFEFEF]/30'
                    : 'border-[#F0E6DD]'
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-[#FF8E8E] text-white'
                        : isSelected
                        ? 'text-[#FF8E8E] font-extrabold'
                        : cell.isCurrentMonth
                        ? 'text-[#5D4E4E]'
                        : 'text-[#A89090]'
                    }`}
                  >
                    {cell.day}
                  </span>
                  
                  {isToday && (
                    <span className="text-[9px] font-black text-[#FF8E8E] px-1 bg-[#FFEFEF] rounded-sm scale-90">
                      วันนี้
                    </span>
                  )}
                </div>

                {/* Event & Memory Indicators */}
                <div className="flex flex-wrap gap-0.5 justify-center w-full max-h-[30px] overflow-hidden mt-1">
                  {dayEvents.slice(0, 3).map((ev, eIdx) => (
                    <div
                      key={`ev-${eIdx}`}
                      className={`w-1.5 h-1.5 rounded-full ${
                        ev.category === 'anniversary'
                          ? 'bg-[#FF8E8E] animate-ping'
                          : ev.category === 'date'
                          ? 'bg-[#FFD6D6]'
                          : ev.category === 'special'
                          ? 'bg-[#D6E4FF]'
                          : ev.category === 'diary'
                          ? 'bg-emerald-400'
                          : 'bg-[#E8D9CE]'
                      }`}
                      title={ev.title}
                    />
                  ))}
                  {dayMemories.slice(0, 2).map((m, mIdx) => (
                    <div
                      key={`mem-${mIdx}`}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      title={`เรื่องราว: ${m.title}`}
                    />
                  ))}
                  {dayEvents.length + dayMemories.length > 3 && (
                    <span className="text-[8px] font-bold text-[#FF8E8E] leading-none">
                      +{dayEvents.length + dayMemories.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold mt-4 pt-4 border-t border-[#F0E6DD] text-[#A89090]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF8E8E]" />
            <span>ครบรอบ</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD6D6]" />
            <span>เดทสวีท</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6E4FF]" />
            <span>บันทึกปฏิทิน</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>ไดอารี่ประจำวัน 📖</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span>เรื่องราวในคลังรัก</span>
          </div>
        </div>
      </div>

      {/* Events & Add Event form cards */}
      <div className="lg:col-span-5 space-y-4">
        {/* 1. Daily Diary Note Card (สมุดไดอารี่หวานใจประจำวัน) */}
        <div className="kawaii-card p-5 bg-white border border-[#F0E6DD] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-emerald-50 to-transparent pointer-events-none rounded-tr-3xl" />
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed border-[#F0E6DD]">
            <h4 className="font-extrabold text-xs text-[#5D4E4E] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>สมุดไดอารี่หัวใจประจำวัน 📖</span>
            </h4>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
              {new Date(selectedDateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {isEditingDiary ? (
            <form onSubmit={handleSaveDiary} className="space-y-3 animate-fadeIn">
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder="วันนี้คู่ของเราทำอะไรกันมานะ? หรือมีเรื่องราวที่อยากบันทึกความรู้สึกไว้ ผลัดกันมาบันทึกตรงนี้ได้เลยน้า... 🥰"
                className="w-full text-xs p-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-hidden bg-[#FFFDFB] h-32 text-[#5D4E4E] font-medium leading-relaxed resize-none"
                maxLength={400}
                required
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const existing = events.find((e) => e.date === selectedDateStr && e.category === 'diary');
                    setDiaryText(existing?.notes || '');
                    setIsEditingDiary(false);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 font-extrabold rounded-lg text-[10px] cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Save className="w-3 h-3" />
                  บันทึกไดอารี่รัก
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 animate-fadeIn">
              {(() => {
                const existing = events.find((e) => e.date === selectedDateStr && e.category === 'diary');
                if (!existing) {
                  return (
                    <div className="py-4 text-center space-y-2.5">
                      <p className="text-[11px] text-[#A89090] italic">
                        " วันนี้ยังไม่มีการจดไดอารี่ความในใจเลยค่ะ 🐰🐻 "
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEditingDiary(true)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold rounded-xl text-[10px] cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <Edit3 className="w-3 h-3" />
                        เริ่มเขียนไดอารี่คู่รักวันนี้ ✍️
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="bg-[#FFFDF6] border border-[#F5EAD6] p-4 rounded-2xl text-xs text-[#5D4E4E] font-medium leading-relaxed italic shadow-3xs relative">
                      {/* Notebook line effect */}
                      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-red-200/50" />
                      <p className="whitespace-pre-wrap pl-4 pr-1">{existing.notes}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-[#A89090]">
                      <span>
                        จดบันทึกโดย: <span className="font-bold text-emerald-600">{existing.creatorId === 'user' ? userNickname : partnerNickname}</span>
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingDiary(true)}
                          className="px-2 py-1 border border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50 rounded-md font-bold cursor-pointer transition-colors"
                        >
                          แก้ไข ✍️
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'ต้องการลบบันทึกไดอารี่ใช่ไหมคะ? 🥺',
                              message: 'เมื่อลบแล้ว ข้อความบันทึกความในใจแสนหวานของวันนี้จะหายไปถาวรเลยน้าาา',
                              onConfirm: () => {
                                onDeleteEvent(existing.id);
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="px-2 py-1 border border-red-200 text-red-500 bg-white hover:bg-red-50 rounded-md font-bold cursor-pointer transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 2. Events details on selected date */}
        <div className="kawaii-card p-5 bg-white">
          <h4 className="font-bold text-[#5D4E4E] border-b border-[#F0E6DD] pb-2 mb-3 flex items-center justify-between text-xs">
            <span>
              วันพิเศษสำหรับ: {' '}
              <span className="text-[#FF8E8E] underline">
                {new Date(selectedDateStr).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </span>
            <span className="text-[10px] bg-[#FFF9F5] px-2 py-1 rounded-md text-[#5D4E4E] font-bold">
              กิจกรรม {selectedDayEvents.filter(e => e.category !== 'diary').length + selectedDayMemories.length} รายการ
            </span>
          </h4>

          {selectedDayEvents.filter(e => e.category !== 'diary').length === 0 && selectedDayMemories.length === 0 ? (
            <div className="py-6 text-center text-[#A89090] flex flex-col items-center justify-center space-y-2 animate-fadeIn">
              <Sparkles className="w-8 h-8 text-[#FFD6D6] animate-pulse" />
              <p className="text-xs">วันนี้ยังไม่มีกิจกรรมหรือเรื่องราวร่วมกันเลย</p>
              <p className="text-[11px] text-[#A89090]">ลองเพิ่มกิจกรรมคู่รักในปฏิทินที่ด้านล่างนี้ได้เลยค่ะ! 💖</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 animate-fadeIn scrollbar-thin">
              {/* Calendar Events List (excluding diary) */}
              {selectedDayEvents.filter(e => e.category !== 'diary').map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-2xl border flex items-start justify-between gap-2 transition-all ${getCategoryBorder(
                    ev.category
                  )}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-[#5D4E4E]">{ev.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white font-bold border border-[#F0E6DD]">
                        {getCategoryBadge(ev.category)}
                      </span>
                    </div>
                    {ev.notes && <p className="text-xs text-[#A89090]">{ev.notes}</p>}
                    <p className="text-[9px] text-[#A89090] flex items-center gap-1">
                      <span>เขียนโดย: {ev.creatorId === 'user' ? userNickname : partnerNickname}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'ลบกิจกรรมนี้ใช่ไหมคะ? 🥺',
                        message: `คุณแน่ใจว่าต้องการลบกิจกรรม "${ev.title}" ออกจากปฏิทินสองเราใช่ไหมคะ?`,
                        onConfirm: () => {
                          onDeleteEvent(ev.id);
                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        }
                      });
                    }}
                    className="p-1 text-[#A89090] hover:text-[#FF8E8E] rounded-full hover:bg-[#FFEFEF] transition-colors cursor-pointer self-start"
                    title="ลบกิจกรรม"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Memory Box Stories List */}
              {selectedDayMemories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-start gap-3 transition-all"
                >
                  {m.mediaUrls && m.mediaUrls.length > 0 ? (
                    <img 
                      src={m.mediaUrls[0]} 
                      alt={m.title} 
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : m.mediaUrl ? (
                    <img 
                      src={m.mediaUrl} 
                      alt={m.title} 
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-[#5D4E4E] truncate">{m.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold">
                        📖 ความทรงจำในกล่องรัก
                      </span>
                    </div>
                    <p className="text-xs text-[#5D4E4E] line-clamp-2 leading-relaxed">{m.content}</p>
                    <p className="text-[9px] text-[#A89090] flex items-center gap-1">
                      <span>บันทึกโดย: {m.creatorId === 'user' ? userNickname : partnerNickname}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Form to add event */}
        <div className="kawaii-card p-5 bg-white border border-[#F0E6DD]">
          <h4 className="font-bold text-[#5D4E4E] text-xs mb-3 flex items-center gap-1">
            <Plus className="w-4 h-4 text-[#FF8E8E]" />
            เขียนบันทึกกิจกรรมลงปฏิทิน 📌
          </h4>
          <form onSubmit={handleAddEventSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#5D4E4E] mb-0.5">ชื่อกิจกรรมคู่รัก</label>
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="เช่น ไปกินหมูกระทะฉลอง, แฟนแอบเซอร์ไพรส์"
                className="w-full text-xs p-2 rounded-lg border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E]"
                maxLength={40}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#5D4E4E] mb-0.5">ประเภทกิจกรรม</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E]"
                >
                  <option value="anniversary">❤️ ครบรอบ</option>
                  <option value="date">🌹 นัดเดท</option>
                  <option value="special">✨ วันสำคัญพิเศษ</option>
                  <option value="other">📌 เรื่องทั่วไป</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5D4E4E] mb-0.5">ผู้จดบันทึก</label>
                <div className="w-full text-xs p-2 rounded-lg border border-[#F0E6DD] bg-[#FDFBF9] font-bold text-[#5D4E4E]">
                  {activeUser === 'user' ? '🐶 ' + userNickname : '🐱 ' + partnerNickname}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5D4E4E] mb-0.5">รายละเอียดความรู้สึก/สถานที่ (ถ้ามี)</label>
              <textarea
                value={newEventNotes}
                onChange={(e) => setNewEventNotes(e.target.value)}
                placeholder="ระบุสถานที่ หรือความทรงจำหวานๆ ซึ้งๆ ของกิจกรรมนี้..."
                className="w-full text-xs p-2 rounded-lg border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden resize-none h-14 text-[#5D4E4E]"
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              บันทึกกิจกรรมรักแชร์ปฏิทิน
            </button>
          </form>
        </div>
      </div>
      
      {/* Kawaii Custom Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
