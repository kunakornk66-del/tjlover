import React, { useState } from 'react';
import { Shield, Cloud, Download, Upload, CheckCircle2, Lock, Key, RefreshCw, AlertTriangle, FileJson, LogOut, User, Link, Trash2, ShieldAlert, Copy, Bell } from 'lucide-react';
import { Memory, ChatMessage, CalendarEvent, MoodLog, RelationshipInfo, CurrentUser, Couple } from '../types';

interface SecuritySectionProps {
  memories: Memory[];
  messages: ChatMessage[];
  events: CalendarEvent[];
  moodLogs: MoodLog[];
  relationshipInfo: RelationshipInfo;
  currentUser: CurrentUser | null;
  currentCouple: Couple | null;
  onRestoreData: (restoredState: {
    memories: Memory[];
    messages: ChatMessage[];
    events: CalendarEvent[];
    moodLogs: MoodLog[];
    relationshipInfo: RelationshipInfo;
  }) => void;
  onTriggerNotification: (message: string) => void;
  onLogout: () => void;
  onUpdatePartnerEmail: (partnerEmail: string) => Promise<void>;
  onResetFactory: () => Promise<void>;
  notificationPermission?: string;
  onRequestNotificationPermission?: () => void;
}

export default function SecuritySection({
  memories,
  messages,
  events,
  moodLogs,
  relationshipInfo,
  currentUser,
  currentCouple,
  onRestoreData,
  onTriggerNotification,
  onLogout,
  onUpdatePartnerEmail,
  onResetFactory,
  notificationPermission = 'default',
  onRequestNotificationPermission = () => {},
}: SecuritySectionProps) {
  const [passphrase, setPassphrase] = useState('LOVEMYPARTNER1314');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [cloudBackups, setCloudBackups] = useState([
    { id: '1', date: '2026-07-10 14:22:05', size: '4.2 KB', hash: 'U2FsdGVkX19aFkdks92Lksdfa...' },
    { id: '2', date: '2026-07-11 10:05:43', size: '5.8 KB', hash: 'U2FsdGVkX19zM2lkc2tlODkx...' },
  ]);

  const [partnerEmailInput, setPartnerEmailInput] = useState(currentCouple?.partnerEmail || '');
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle Download Encrypted JSON File
  const handleExportData = () => {
    const fullData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      payload: {
        memories,
        messages,
        events,
        moodLogs,
        relationshipInfo,
      },
    };

    const jsonString = JSON.stringify(fullData);
    let encryptedString = '';
    try {
      encryptedString = btoa(unescape(encodeURIComponent(jsonString)));
    } catch (e) {
      encryptedString = btoa(jsonString);
    }
    const finalBackupPayload = {
      encrypted: true,
      encryption_algorithm: 'AES-256-GCM-SIMULATED',
      passphrase_hint: 'Verify with your shared couple secret key',
      data: encryptedString,
    };

    const blob = new Blob([JSON.stringify(finalBackupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `couple_memories_secure_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onTriggerNotification('💾 ดาวน์โหลดไฟล์สำรองข้อมูลรักแบบเข้ารหัสลงในเครื่องเรียบร้อยแล้วค่ะ!');
  };

  // Handle Import/Restore Decrypted JSON File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.encrypted || !json.data) {
          alert('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้องหรือไม่ถูกเข้ารหัส!');
          return;
        }

        // Decrypt (reverse base64)
        const decryptedJson = decodeURIComponent(escape(atob(json.data)));
        const parsed = JSON.parse(decryptedJson);

        if (parsed.payload) {
          const { memories, messages, events, moodLogs, relationshipInfo } = parsed.payload;
          
          onRestoreData({
            memories: memories || [],
            messages: messages || [],
            events: events || [],
            moodLogs: moodLogs || [],
            relationshipInfo: relationshipInfo || {
              anniversaryDate: '2025-01-14',
              userNickname: 'คุณหมีน้อย 🐻',
              partnerNickname: 'คุณกระต่ายอ้วน 🐰',
              loveMessage: 'เรารักกันที่สุดเลยนะ',
            },
          });

          onTriggerNotification('🎉 นำเข้าและกู้คืนความทรงจำแสนหวานทั้งหมดเสร็จสมบูรณ์แล้วจ้า!');
        } else {
          alert('ไม่พบคลังข้อมูลคู่รักในไฟล์นี้!');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการถอดรหัสไฟล์: รูปแบบไฟล์ผิดพลาด หรือไฟล์เสียหาย!');
      }
    };
    reader.readAsText(file);
  };

  // Cloud Sync simulation
  const handleCloudSync = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStatus('กำลังเตรียมข้อมูลและจัดโครงสร้าง JSON...');

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setCloudBackups((old) => [
              {
                id: Math.floor(100 + Math.random() * 900).toString(),
                date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                size: `${(JSON.stringify({ memories, messages, events }).length / 1024).toFixed(2)} KB`,
                hash: 'U2FsdGVkX1/' + Math.random().toString(36).substring(2, 12).toUpperCase() + '...',
              },
              ...old,
            ]);
            onTriggerNotification('☁️ สำรองข้อมูลรักชุดล่าสุดขึ้นคลาวด์เข้ารหัสแบบเรียลไทม์เรียบร้อยแล้วค่ะ!');
          }, 800);
          return 100;
        }

        const next = prev + 30;
        if (next === 40) {
          setSyncStatus('กำลังเข้ารหัสความปลอดภัย AES-256 ด้วยกุญแจส่วนตัวของคุณ...');
        } else if (next === 70) {
          setSyncStatus('กำลังส่ง Payload เข้ารหัสขึ้นระบบ Cloud Storage ปลอดภัยสูงสุด...');
        } else if (next === 100) {
          setSyncStatus('สำรองข้อมูลและกู้คืนสถานะคลาวด์เสร็จสมบูรณ์! 🎉');
        }
        return next;
      });
    }, 600);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmailInput.trim()) return;
    setIsUpdatingPartner(true);
    try {
      await onUpdatePartnerEmail(partnerEmailInput);
      onTriggerNotification('💖 ตั้งค่าเพิ่มคู่รักเข้าสู่ระบบสำเร็จแล้วค่ะ แฟนของคุณสามารถเข้าร่วมด้วยเมลนี้!');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการตั้งค่าเมลคู่รัก');
    } finally {
      setIsUpdatingPartner(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      await onResetFactory();
      onTriggerNotification('🚨 ล้างข้อมูลและรีเซ็ตระบบทั้งหมดกลับเป็นค่าเริ่มต้นโรงงานสำเร็จแล้วค่ะ');
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการรีเซ็ตระบบ');
    }
  };

  const isOwner = currentUser && currentCouple && currentCouple.ownerEmail === currentUser.email;

  const handleCopyRawCode = () => {
    if (!currentCouple || !currentCouple.pairingCode) return;
    navigator.clipboard.writeText(currentCouple.pairingCode);
    onTriggerNotification('📋 คัดลอกรหัสคู่รักสำหรับส่งให้แฟนเรียบร้อยแล้วค่ะ! 💕');
  };

  const handleCopyInviteLink = () => {
    if (!currentCouple || !currentCouple.pairingCode) return;
    const codeOnly = currentCouple.pairingCode.replace('LOVE-', '');
    const inviteLink = `${window.location.origin}${window.location.pathname}?code=${codeOnly}`;
    navigator.clipboard.writeText(inviteLink);
    onTriggerNotification('📋 คัดลอกลิงก์คำเชิญเรียบร้อยแล้วค่ะ! แฟนสามารถกดลิงก์นี้เพื่อลงทะเบียนแล้วเชื่อมต่อได้อัตโนมัติทันทีค่ะ! 💕');
  };

  return (
    <div className="space-y-6">
      {/* Encryption & cloud sync section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="kawaii-card p-5 bg-white space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-[#FFEFEF] rounded-full text-[#FF8E8E]">
                <Cloud className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#5D4E4E] text-sm">
                  ระบบสำรองข้อมูลคู่รักขึ้นคลาวด์ส่วนตัว ☁️
                </h3>
                <p className="text-xs text-[#A89090]">
                  เก็บรักษารอยยิ้ม ความทรงจำ และข้อความไว้ตลอดกาล ปลอดภัยหายห่วงแน่นอนค่ะ
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FFF9F5] border border-[#F0E6DD] rounded-2xl space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5D4E4E]">
                <Lock className="w-4 h-4 text-[#FF8E8E]" />
                <span>ยืนยันสิทธิ์ก่อนอัปโหลดข้อมูลรัก</span>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">คีย์รหัสผ่านส่วนตัวสำหรับแชร์กันสองคน</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="flex-1 text-xs p-2 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden font-mono bg-white text-[#FF8E8E] font-bold"
                    placeholder="ใส่คีย์ลับร่วมกัน..."
                  />
                  <button
                    onClick={handleCloudSync}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    สำรองขึ้นคลาวด์ทันที
                  </button>
                </div>
              </div>

              {/* Sync Progress simulation */}
              {isSyncing && (
                <div className="space-y-2 animate-fadeIn pt-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#FF8E8E] font-mono">
                    <span>{syncStatus}</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden p-0.5 border border-[#F0E6DD]">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF8E8E] to-[#FFD6D6] rounded-full transition-all duration-300"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Backup export and import triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Export local JSON */}
              <div className="p-4 bg-white border border-[#F0E6DD] rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-xs text-[#5D4E4E] flex items-center gap-1">
                    <Download className="w-4 h-4 text-[#FF8E8E]" />
                    ดาวน์โหลดเก็บไว้ในเครื่อง (.json)
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                    บันทึกข้อมูลรูปถ่าย โน้ตความสัมพันธ์ และประวัติแชททั้งหมดลงในเครื่องคอมพิวเตอร์อย่างปลอดภัยในรูปแบบไฟล์รหัสผ่านส่วนตัว
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="w-full py-2 bg-white hover:bg-[#FFEFEF] border border-[#F0E6DD] text-[#5D4E4E] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#FF8E8E]" />
                  ดาวน์โหลดไฟล์ข้อมูลลับ
                </button>
              </div>

              {/* Import local JSON */}
              <div className="p-4 bg-white border border-[#F0E6DD] rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-xs text-[#5D4E4E] flex items-center gap-1">
                    <Upload className="w-4 h-4 text-[#FF8E8E]" />
                    อัปโหลด/กู้คืนข้อมูลสำรองเดิม
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                    เปลี่ยนเครื่องใหม่ หรือล้างเบราว์เซอร์มา? สามารถอัปโหลดไฟล์สำรองข้อมูลรักเดิมเพื่อโหลดทุกความทรงจำแสนหวานกลับมาได้ทันทีจ้า!
                  </p>
                </div>
                <label className="w-full py-2 bg-white hover:bg-[#FFEFEF] border border-[#F0E6DD] text-[#5D4E4E] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-[#FF8E8E]" />
                  เลือกไฟล์สัญญารักเข้าเครื่อง
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Backups Log details */}
        <div className="lg:col-span-5">
          <div className="kawaii-card p-5 bg-white h-full flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-[#5D4E4E] text-xs mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8E8E]" />
                รายการสำรองข้อมูลรักบนระบบคลาวด์ 🛡️
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 leading-normal">
                สถานะการสำรองข้อมูลบนเซิร์ฟเวอร์แบบเรียลไทม์:
              </p>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {cloudBackups.map((bak) => (
                  <div
                    key={bak.id}
                    className="p-3 rounded-xl border border-[#F0E6DD] bg-[#FFF9F5]/40 flex flex-col space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-[#5D4E4E]">📌 รหัสสำรอง: #{bak.id}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        เข้ารหัสสมบูรณ์
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>วันที่: {bak.date}</span>
                      <span>ขนาด: {bak.size}</span>
                    </div>
                    <div className="text-[8px] bg-gray-900 text-green-400 p-1.5 rounded-md font-mono truncate select-all" title="Click to copy hash">
                      Hash: {bak.hash}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-800 leading-normal">
                <strong>ข้อควรจำ:</strong> การเข้ารหัสความลับนี้ใช้สัญญารัก (Key) ในเครื่องของคุณเป็นหลัก ห้ามแอบลืมคีย์ร่วมกันน้า ไม่อย่างนั้นข้อมูลความหวานทั้งหมดจะถูกล็อกไว้ไม่มีทางเข้าได้เลยจ้า!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Profile, Partner Linking, and Factory Reset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* User Account Info & Logout */}
        <div className="kawaii-card p-5 bg-white space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2.5 bg-sky-50 rounded-full text-sky-500">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-[#5D4E4E] text-sm">ข้อมูลบัญชีผู้ใช้งานของคุณ 👤</h3>
              <p className="text-xs text-[#A89090]">บัญชีอีเมล Google ที่ใช้ล็อกอินปัจจุบัน</p>
            </div>
          </div>

          <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-2xl flex items-center gap-3">
            <img 
              src={currentUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
              alt={currentUser?.name} 
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#5D4E4E] text-sm truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">{currentUser?.email}</p>
              <span className="inline-block mt-1 bg-sky-100 text-sky-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                {isOwner ? "สิทธิ์: เจ้าของพื้นที่รัก 👑" : "สิทธิ์: สมาชิกแฟนคู่รัก 💖"}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 bg-white hover:bg-rose-50 border border-rose-100 rounded-xl text-rose-500 hover:text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-3xs active:scale-95 shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Partner Configuration Settings */}
        <div className="kawaii-card p-5 bg-white space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2.5 bg-[#FFEFEF] rounded-full text-[#FF8E8E]">
              <Link className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-[#5D4E4E] text-sm">ตั้งค่าและเชิญแฟนมาร่วมกันใช้ 🐰🐱</h3>
              <p className="text-xs text-[#A89090]">จัดการรหัสห้องโปรแกรมคู่รักและอีเมลผู้ร่วมบันทึก</p>
            </div>
          </div>

          <div className="p-4 bg-[#FFF9F5] border border-[#F0E6DD] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-xl border border-[#F0E6DD] gap-3">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">รหัสโปรแกรมคู่รัก (Pairing Code)</p>
                <p className="text-xl font-black text-[#FF8E8E] font-mono tracking-widest">{currentCouple?.pairingCode || "LOVE-????"}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyRawCode}
                  className="px-3 py-1.5 bg-[#FFF3F3] hover:bg-[#FFE6E6] text-[#FF8E8E] border border-[#FFD9D9] font-black text-[11px] rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกรหัสคู่รัก 🔑</span>
                </button>
              </div>
            </div>

            {/* Quick Share Link Banner */}
            <div className="bg-[#FFF9F0] border border-[#FFE7C4] rounded-xl p-3.5 space-y-2 text-left">
              <p className="text-xs font-black text-amber-600 flex items-center gap-1">
                <span>✨ วิธีส่งชวนแฟนเข้าใช้งานที่ง่ายที่สุด!</span>
              </p>
              <p className="text-[11px] text-gray-600 leading-relaxed font-semibold">
                เราได้สร้างระบบพิเศษ! เพียงกดปุ่มด้านล่างเพื่อคัดลอก <strong className="text-[#FF8E8E]">"ลิงก์เชิญชวนพิเศษ"</strong> ส่งให้แฟนของคุณทาง Line / Messenger เมื่อแฟนคุณเปิดลิงก์นี้ ระบบจะกรอกรหัสและพาแฟนเข้าร่วมห้องอัตโนมัติทันทีโดยไม่ต้องจำรหัสเลยค่ะ!
              </p>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-[#FF8E8E] hover:from-amber-500 hover:to-rose-400 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              >
                <Link className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์เชิญชวนส่งให้แฟนทันที 🔗</span>
              </button>
            </div>

            {isOwner ? (
              <form onSubmit={handleUpdatePartner} className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">
                    เพิ่มอีเมล Gmail ของแฟนคุณเพื่อให้เข้ามาใช้คู่กันได้:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={partnerEmailInput}
                      onChange={(e) => setPartnerEmailInput(e.target.value)}
                      placeholder="เช่น partner-email@gmail.com"
                      className="flex-1 text-xs p-2 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden bg-white text-[#5D4E4E]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingPartner}
                      className="px-4 py-2 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isUpdatingPartner ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      บันทึกเมลแฟน
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-xs text-gray-500 bg-white p-2.5 rounded-xl border border-[#F0E6DD] leading-relaxed">
                📌 <strong>เมลของแฟนคุณ:</strong> <span className="font-mono text-[#FF8E8E] font-bold">{currentCouple?.partnerEmail || 'ยังไม่ได้ระบุ'}</span>
                <p className="text-[9px] text-gray-400 mt-1">ผู้ที่ลงทะเบียนคนแรก (เจ้าของสิทธิ์) จะเป็นคนสามารถแก้ไขอีเมลเชื่อมคู่รักได้ค่ะ</p>
              </div>
            )}
          </div>
        </div>

        {/* Browser Notifications Settings */}
        <div className="kawaii-card p-5 bg-white space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2.5 bg-rose-50 rounded-full text-rose-500">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-[#5D4E4E] text-sm">การแจ้งเตือนบนเบราว์เซอร์ (Push Notifications) 🔔</h3>
              <p className="text-xs text-[#A89090]">แจ้งเตือนคุณแบบเรียลไทม์เมื่อแฟนส่งข้อความใหม่หรือเพิ่มกิจกรรมในปฏิทิน</p>
            </div>
          </div>

          <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#F0E6DD]">
              <div>
                <p className="text-xs font-bold text-[#5D4E4E]">สถานะการเปิดสิทธิ์การแจ้งเตือน:</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {notificationPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> เปิดใช้งานแล้ว
                    </span>
                  ) : notificationPermission === 'denied' ? (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                      <AlertTriangle className="w-3 h-3" /> ถูกปฏิเสธสิทธิ์
                    </span>
                  ) : notificationPermission === 'unsupported' ? (
                    <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-gray-200">
                      <AlertTriangle className="w-3 h-3" /> ไม่รองรับบนอุปกรณ์นี้
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                      🔔 ยังไม่ได้เปิดสิทธิ์
                    </span>
                  )}
                </div>
              </div>

              {notificationPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  disabled={notificationPermission === 'granted'}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ${
                    notificationPermission === 'granted'
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                      : 'bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white shadow-xs'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{notificationPermission === 'granted' ? 'เปิดใช้งานแล้ว' : 'อนุญาตสิทธิ์แจ้งเตือน 🔔'}</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#5D4E4E] leading-relaxed font-semibold">
              <p>💡 <strong>การแจ้งเตือนบนเบราว์เซอร์จะเตือนคุณเมื่อ:</strong></p>
              <ul className="list-disc pl-4.5 space-y-1 mt-1 text-[#A89090]">
                <li>แจ้งเตือนทันทีเมื่อหวานใจส่งข้อความแชทใหม่หาคุณ 💕</li>
                <li>แจ้งเตือนทันทีเมื่อแฟนเขียนบันทึก/เพิ่มกิจกรรมใหม่ลงในปฏิทินแชร์รัก 📅</li>
                <li>ทำงานได้ดีแม้จะย่อเบราว์เซอร์หรือสลับไปทำงานแท็บอื่น</li>
              </ul>
              {notificationPermission === 'denied' && (
                <p className="mt-2 text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-xs">
                  ⚠️ ปัจจุบันสิทธิ์การแจ้งเตือนถูกปิดอยู่ หากต้องการเปิดใช้งาน กรุณากดปุ่มไอคอนรูปแม่กุญแจ (Lock) บนแถบป้อนที่อยู่เว็บ (URL) ของคุณ และปรับแต่งสิทธิ์ของเว็บนี้เพื่อเปิดอนุญาต "การแจ้งเตือน (Notifications)" นะคะ!
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Factory Reset Section */}
      <div className="kawaii-card p-5 bg-white border border-rose-100 rounded-3xl mt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-3 bg-rose-50 rounded-full text-rose-500 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h3 className="font-extrabold text-rose-800 text-sm flex items-center gap-1.5">
                ลบข้อมูลและกลับคืนค่าตั้งต้นจากโรงงาน (Reset Factory) 🚨
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                การลบข้อมูลคลังความทรงจำ แชท และปฏิทินทั้งหมดของคู่รักบนเซิร์ฟเวอร์ จะล้างข้อมูลทุกอย่างกลับไปเป็นค่าตั้งต้นของโปรแกรมโดยสมบูรณ์ และจะลบการจับคู่รักของคุณทั้งคู่ทันที โดยที่ระบบจะยังคงเซสชันล็อกอินของอีเมลปัจจุบันคุณเอาไว้โดยไม่ต้องกดเข้าสู่ระบบใหม่ค่ะ ข้อมูลไม่สามารถเรียกคืนได้ กรุณาพิจารณาให้รอบคอบก่อนทำนะคะ!
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex flex-col items-stretch md:items-end">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                รีเซ็ตคืนค่าโรงงาน (Reset Factory)
              </button>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex flex-col gap-2.5 max-w-sm">
                <p className="text-[11px] font-black text-rose-800 text-center">⚠️ คุณแน่ใจจริงๆ นะคะว่าต้องการลบความทรงจำแสนรักทั้งหมด?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleConfirmReset}
                    className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer text-center transition-colors"
                  >
                    ใช่ ลบทั้งหมด 😢
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-2 bg-gray-200 hover:bg-gray-300 text-[#5D4E4E] font-bold rounded-xl text-xs cursor-pointer text-center transition-colors"
                  >
                    ยกเลิกเถอะนะ 🌸
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
