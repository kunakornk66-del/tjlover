import React, { useState, useRef } from 'react';
import { Camera, Video, FileText, Heart, Plus, Trash2, Image as ImageIcon, Sparkles, Pencil, X, ChevronLeft, ChevronRight, Eye, FolderHeart, BookOpen, Save, FileEdit, Download } from 'lucide-react';
import { Memory } from '../types';
import ConfirmModal from './ConfirmModal';

interface MemoryBoxSectionProps {
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  onUpdateMemory: (id: string, memory: Partial<Memory>) => void;
  activeUser: 'user' | 'partner';
  userNickname: string;
  partnerNickname: string;
}

export default function MemoryBoxSection({
  memories,
  onAddMemory,
  onDeleteMemory,
  onUpdateMemory,
  activeUser,
  userNickname,
  partnerNickname,
}: MemoryBoxSectionProps) {
  const [filter, setFilter] = useState<'photo_album' | 'video' | 'note'>('photo_album');
  
  // Note specific states
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteContentInput, setNoteContentInput] = useState('');
  
  // Album creation states
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumContent, setAlbumContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Album Detail View states
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isUploadingToExistingAlbum, setIsUploadingToExistingAlbum] = useState(false);
  const [isProcessingAppendFiles, setIsProcessingAppendFiles] = useState(false);

  // Lightbox view state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxAlbumId, setLightboxAlbumId] = useState<string | null>(null);

  // Lucky Random Memory state
  const [luckyMemory, setLuckyMemory] = useState<Memory | null>(null);

  // Custom Kawaii Confirm Modal state
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

  // Compress helper to resize high-res user photos before storing
  const handleFileChangeHelper = async (files: FileList | null): Promise<string[]> => {
    if (!files) return [];
    const fileList = Array.from(files);
    const promises = fileList.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
            const img = new Image();
            img.src = result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1200;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
              } else {
                resolve(result);
              }
            };
          } else {
            resolve(result);
          }
        };
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  };

  const handleCreateAlbumFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessingFiles(true);
    try {
      const bases = await handleFileChangeHelper(e.target.files);
      setUploadedFiles((prev) => [...prev, ...bases]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleAppendAlbumFiles = async (e: React.ChangeEvent<HTMLInputElement>, album: Memory) => {
    setIsProcessingAppendFiles(true);
    try {
      const bases = await handleFileChangeHelper(e.target.files);
      if (bases.length > 0) {
        const currentUrls = album.mediaUrls || [];
        onUpdateMemory(album.id, {
          mediaUrls: [...currentUrls, ...bases]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAppendFiles(false);
    }
  };

  // Submit new Album
  const handleCreateAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = albumTitle.trim() || (filter === 'photo_album' ? 'อัลบั้มภาพความทรงจำใหม่ 📸' : filter === 'video' ? 'วิดีโอคู่รักใหม่ 🎥' : 'สมุดบันทึกโน้ตรักใหม่ 📝');
    
    const newMemory: Memory = {
      id: Math.random().toString(36).substring(2, 9),
      title: finalTitle,
      type: filter,
      content: albumContent.trim(),
      mediaUrls: uploadedFiles,
      date: new Date().toISOString().split('T')[0],
      creatorId: activeUser,
    };

    onAddMemory(newMemory);
    setAlbumTitle('');
    setAlbumContent('');
    setUploadedFiles([]);
    setIsCreatingAlbum(false);
  };

  // Delete single photo/video from an album
  const handleDeleteMediaFromAlbum = (album: Memory, indexToDelete: number) => {
    const updatedUrls = (album.mediaUrls || []).filter((_, idx) => idx !== indexToDelete);
    if (updatedUrls.length === 0) {
      // If no photos are left, ask or proceed to delete entire album or keep it empty
      onUpdateMemory(album.id, { mediaUrls: [] });
    } else {
      onUpdateMemory(album.id, { mediaUrls: updatedUrls });
    }
    // Adjust lightbox index if opened
    if (lightboxIndex !== null && lightboxIndex >= updatedUrls.length) {
      setLightboxIndex(updatedUrls.length - 1 >= 0 ? updatedUrls.length - 1 : null);
    }
  };

  // Notes operations (iPhone Style)
  const allNotes = memories.filter(m => m.type === 'note');
  const activeNote = allNotes.find(n => n.id === activeNoteId) || null;

  const handleSelectNote = (noteId: string) => {
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
      setActiveNoteId(noteId);
      setNoteTitleInput(note.title);
      setNoteContentInput(note.content);
    }
  };

  const handleCreateNewNote = () => {
    const newNote: Memory = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'บันทึกใหม่ที่เขียนด้วยรัก 📝',
      type: 'note',
      content: '',
      date: new Date().toISOString().split('T')[0],
      creatorId: activeUser,
    };
    onAddMemory(newNote);
    setActiveNoteId(newNote.id);
    setNoteTitleInput('บันทึกใหม่ที่เขียนด้วยรัก 📝');
    setNoteContentInput('');
    setFilter('note');
  };

  const handleSaveActiveNote = () => {
    if (!activeNoteId) return;
    onUpdateMemory(activeNoteId, {
      title: noteTitleInput.trim() || 'บันทึกที่ไม่มีชื่อ',
      content: noteContentInput,
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Lucky Draw feature
  const handleSpinWheel = () => {
    const pool = memories.filter(m => m.type === 'photo_album' || m.type === 'video' || m.type === 'video_album' || m.type === 'note');
    if (pool.length === 0) return;
    const randomIdx = Math.floor(Math.random() * pool.length);
    setLuckyMemory(pool[randomIdx]);
  };

  // Filtered albums for display
  const currentAlbums = memories.filter(m => m.type === filter || (filter === 'video' && m.type === 'video_album'));

  return (
    <div className="space-y-6">
      {/* Memories Tabs Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap bg-[#FFF9F5] border border-[#F0E6DD] rounded-full p-1.5 self-start gap-1 shadow-3xs">
          {(['photo_album', 'video', 'note'] as const).map((t) => (
            <button
              id={`tab-memory-${t}`}
              key={t}
              onClick={() => {
                setFilter(t);
                setSelectedAlbumId(null);
                if (t === 'note' && allNotes.length > 0 && !activeNoteId) {
                  // Select the first note automatically
                  handleSelectNote(allNotes[0].id);
                }
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === t
                  ? 'bg-[#FF8E8E] text-white shadow-xs'
                  : 'text-[#5D4E4E] hover:bg-[#FFEFEF]'
              }`}
            >
              {t === 'photo_album' && (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  อัลบั้มรูปถ่าย 📸
                </>
              )}
              {t === 'video' && (
                <>
                  <Video className="w-3.5 h-3.5" />
                  วิดีโอคู่รัก 🎥
                </>
              )}
              {t === 'note' && (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  สมุดบันทึกโน้ตรัก 📝
                </>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            id="btn-spin-lucky-memory"
            onClick={handleSpinWheel}
            disabled={memories.length === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#FF8E8E] to-[#FFD6D6] hover:brightness-95 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            กล่องเสี่ยงดวงย้อนวันหวาน 🔮
          </button>

          {filter === 'note' ? (
            <button
              id="btn-create-iphone-note"
              onClick={handleCreateNewNote}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 animate-fadeIn"
            >
              <Plus className="w-4 h-4" />
              จดโน้ตใหม่ 📝
            </button>
          ) : (
            <button
              id="btn-create-love-album"
              onClick={() => setIsCreatingAlbum(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 animate-fadeIn"
            >
              <Plus className="w-4 h-4" />
              {filter === 'video' ? 'อัปโหลดวิดีโอ 🎥' : 'สร้างอัลบั้มใหม่ ✨'}
            </button>
          )}
        </div>
      </div>

      {/* Lucky Memory Popover / Reveal */}
      {luckyMemory && (
        <div className="kawaii-card p-5 bg-gradient-to-r from-[#FFF9F5] to-[#F5F1EE] border-[#F0E6DD] relative overflow-hidden animate-fadeIn shadow-lg">
          <div className="absolute top-2 right-2 z-10">
            <button
              id="btn-close-lucky-memory"
              onClick={() => setLuckyMemory(null)}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold px-2 py-1 cursor-pointer bg-white/85 rounded-full border border-gray-100 shadow-3xs"
            >
              ปิดหน้าต่าง [X]
            </button>
          </div>
          <div className="flex flex-col items-center text-center space-y-3 max-w-lg mx-auto">
            <span className="text-sm font-extrabold text-[#5D4E4E] flex items-center gap-1.5">
              🔮 ยินดีด้วย! คุณสุ่มเจอความทรงจำหวานเจี๊ยบ:
            </span>
            <h4 className="text-lg font-black text-[#FF8E8E] flex items-center gap-1">
              {luckyMemory.type === 'note' ? '📝' : luckyMemory.type === 'photo_album' ? '📸 อัลบั้ม:' : '🎥 อัลบั้ม:'} {luckyMemory.title}
            </h4>
            
            {luckyMemory.mediaUrls && luckyMemory.mediaUrls.length > 0 ? (
              <div className="relative w-full overflow-hidden bg-black rounded-2xl border border-[#F0E6DD]">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-48 gap-1 p-1">
                  {luckyMemory.mediaUrls.slice(0, 5).map((url, i) => (
                    <div key={i} className="flex-none w-full h-full snap-center relative bg-black">
                      {luckyMemory.type === 'photo_album' ? (
                        <img
                          src={url}
                          alt={`${luckyMemory.title} - ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {i + 1} / {luckyMemory.mediaUrls.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            <p className="text-xs text-[#5D4E4E] italic leading-relaxed bg-white/60 p-3 rounded-xl border border-gray-100/80 w-full max-w-md">
              "{luckyMemory.content || 'ไม่มีคำบรรยายในความทรงจำนี้ แต่เปี่ยมไปด้วยความรัก ❤️'}"
            </p>
            <span className="text-[10px] text-gray-400 font-semibold">
              บันทึกเมื่อ: {new Date(luckyMemory.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} โดย {luckyMemory.creatorId === 'user' ? '🐶 ' + userNickname : '🐱 ' + partnerNickname}
            </span>
          </div>
        </div>
      )}

      {/* ----------------- PHOTO / VIDEO ALBUM GRID VIEW ----------------- */}
      {filter !== 'note' && (
        <>
          {currentAlbums.length === 0 ? (
            <div className="kawaii-card p-12 bg-white text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <FolderHeart className="w-14 h-14 text-[#FFD6D6] animate-pulse" />
              <p className="font-extrabold text-[#5D4E4E]">
                {filter === 'video' ? 'ยังไม่มีวิดีโอรักของพวกเราเลย' : 'ยังไม่มีอัลบั้มรูปถ่ายรักของพวกเราเลย'}
              </p>
              <p className="text-xs text-[#A89090]">
                {filter === 'video'
                  ? 'มาเริ่มอัปโหลดวิดีโอแรก โมเมนต์เคลื่อนไหวแสนหวานผ่านปุ่ม "อัปโหลดวิดีโอ" กันนะค้าบ 🐰🐻'
                  : 'มาเริ่มสร้างอัลบั้มแรก เก็บสะสมรูปแสนหวานผ่านปุ่ม "สร้างอัลบั้มใหม่" กันนะค้าบ 🐰🐻'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {currentAlbums.map((album) => {
                const mediaCount = album.mediaUrls?.length || 0;
                const coverImage = album.mediaUrls && album.mediaUrls.length > 0 ? album.mediaUrls[0] : null;

                if (filter === 'video') {
                  // Direct Playable Video Gallery
                  return (
                    <div
                      id={`video-card-${album.id}`}
                      key={album.id}
                      className="kawaii-card bg-white border border-[#F0E6DD] rounded-3xl overflow-hidden flex flex-col shadow-3xs"
                    >
                      {/* Video Player Container */}
                      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                        {coverImage ? (
                          <video
                            src={coverImage}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 text-[10px]">
                            <Video className="w-8 h-8 stroke-1 mb-1" />
                            <span>ไม่มีไฟล์วิดีโอ</span>
                          </div>
                        )}
                      </div>

                      {/* Video metadata info */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#FFFDFB]">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-[#5D4E4E] text-sm">
                            {album.title}
                          </h4>
                          <p className="text-xs text-[#A89090] italic leading-relaxed">
                            "{album.content || 'ไม่มีคำบรรยายเพิ่มเติม'}"
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#F0E6DD]/40 flex items-center justify-between text-[10px] text-[#A89090]">
                          <span className="font-semibold text-[#FF8E8E] bg-[#FFEFEF] px-1.5 py-0.5 rounded-md">
                            {album.creatorId === 'user' ? '🐶 ' + userNickname : '🐱 ' + partnerNickname}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {new Date(album.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {coverImage && (
                              <button
                                id={`btn-download-direct-video-${album.id}`}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = coverImage;
                                  link.download = `love-video-${Date.now()}.mp4`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                                title="ดาวน์โหลดวิดีโอนี้"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              id={`btn-delete-direct-video-${album.id}`}
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'ลบวิดีโอนี้ใช่ไหมคะ? 🥺',
                                  message: 'เมื่อลบแล้ว วิดีโอช่วงเวลาหวานๆ อันนี้จะหายไปจากคลังรักเลยน้าาา',
                                  onConfirm: () => {
                                    onDeleteMemory(album.id);
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                              title="ลบวิดีโอนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default Photo Album display
                return (
                  <div
                    id={`album-card-${album.id}`}
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="kawaii-card bg-white group cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative border border-[#F0E6DD] overflow-hidden flex flex-col justify-between"
                  >
                    {/* Album Art Cover with Photo-Stack design */}
                    <div className="relative aspect-4/3 w-full bg-gray-50 border-b border-[#F0E6DD] overflow-hidden flex items-center justify-center">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300">
                          <ImageIcon className="w-12 h-12 stroke-1" />
                          <span className="text-[10px] mt-1">อัลบั้มว่างเปล่า</span>
                        </div>
                      )}

                      {/* Number of media badge */}
                      <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[10px] font-black text-[#FF8E8E] px-2.5 py-1 rounded-full border border-[#FFEFEF] shadow-xs">
                        📸 {mediaCount} รูปภาพ
                      </span>
                    </div>

                    {/* Album metadata info */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#FFFDFB]">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[#5D4E4E] text-sm group-hover:text-[#FF8E8E] transition-colors line-clamp-1">
                          {album.title}
                        </h4>
                        <p className="text-xs text-[#A89090] line-clamp-2 italic leading-relaxed">
                          "{album.content || 'ไม่มีคำบรรยายในอัลบั้มคู่รักนี้'}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F0E6DD]/40 flex items-center justify-between text-[10px] text-[#A89090]">
                        <span className="font-semibold text-[#FF8E8E] bg-[#FFEFEF] px-1.5 py-0.5 rounded-md">
                          {album.creatorId === 'user' ? '🐶 ' + userNickname : '🐱 ' + partnerNickname}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {new Date(album.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <button
                            id={`btn-delete-album-${album.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                title: 'ลบอัลบั้มรักนี้ใช่ไหมคะ? 🥺',
                                message: `คุณแน่ใจว่าต้องการลบอัลบั้ม "${album.title}" พร้อมทั้งรูปภาพแสนรักทั้งหมดในอัลบั้มนี้ใช่ไหมคะ?`,
                                onConfirm: () => {
                                  onDeleteMemory(album.id);
                                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            title="ลบอัลบั้มนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ----------------- IMMERSIVE ALBUM DETAILED EXPANSION POPUP ----------------- */}
      {selectedAlbumId && (
        (() => {
          const album = memories.find(m => m.id === selectedAlbumId);
          if (!album) return null;
          const mediaUrls = album.mediaUrls || [];

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fadeIn">
              <div className="bg-white rounded-3xl border border-[#F0E6DD] shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 md:p-8 space-y-6 relative flex flex-col">
                <button
                  id="btn-close-album-details"
                  onClick={() => setSelectedAlbumId(null)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Album Header description */}
                <div className="space-y-2 border-b border-[#F0E6DD]/60 pb-4">
                  <span className="text-xs font-black text-[#FF8E8E] uppercase tracking-widest bg-[#FFEFEF] px-3 py-1 rounded-full border border-[#FFE3E3]">
                    {album.type === 'photo_album' ? '📸 อัลบั้มรูปภาพแสนรัก' : '🎥 อัลบั้มวิดีโอคู่รัก'}
                  </span>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                    <h2 className="text-xl md:text-2xl font-black text-[#5D4E4E] tracking-tight">{album.title}</h2>
                    <span className="text-xs text-gray-400 font-medium">
                      สร้างเมื่อ: {new Date(album.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} • บันทึกโดย {album.creatorId === 'user' ? '🐶 ' + userNickname : '🐱 ' + partnerNickname}
                    </span>
                  </div>
                  {album.content && (
                    <p className="text-xs md:text-sm text-gray-600 italic bg-[#FFF9F5] p-3 rounded-2xl border border-[#F0E6DD]/40 leading-relaxed">
                      " {album.content} "
                    </p>
                  )}
                </div>

                {/* Media grid section */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#5D4E4E]">
                      จำนวนสื่อทั้งหมด ({mediaUrls.length} ไฟล์):
                    </span>

                    {/* Append more photos action */}
                    <div className="relative">
                      <button
                        id="btn-add-photos-to-album"
                        className="px-3.5 py-1.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มรูปภาพ/วิดีโอลงในอัลบั้มนี้
                      </button>
                      <input
                        type="file"
                        multiple
                        accept={album.type === 'photo_album' ? "image/*" : "video/*"}
                        onChange={(e) => handleAppendAlbumFiles(e, album)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        disabled={isProcessingAppendFiles}
                      />
                    </div>
                  </div>

                  {isProcessingAppendFiles && (
                    <div className="py-2 text-center text-xs text-[#FF8E8E] font-bold animate-pulse">
                      ⚡ กำลังประมวลผลรูปและอัปโหลดเพิ่มเติม กรุณารอสักครู่...
                    </div>
                  )}

                  {mediaUrls.length === 0 ? (
                    <div className="py-12 text-center text-gray-300 text-xs">
                      <ImageIcon className="w-12 h-12 stroke-1 mx-auto text-gray-200 mb-2" />
                      ยังไม่มีรูปถ่ายในอัลบั้มนี้เลยค่ะ ลองกดปุ่ม "+" เพื่ออัปโหลดดูนะจ๊ะ
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-1 scrollbar-thin">
                      {mediaUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-[#F0E6DD] bg-black shadow-3xs group cursor-zoom-in"
                          onClick={() => {
                            setLightboxAlbumId(album.id);
                            setLightboxIndex(idx);
                          }}
                        >
                          {album.type === 'photo_album' ? (
                            <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                          ) : (
                            <video src={url} className="w-full h-full object-cover" />
                          )}
                          
                          {/* Inner hover elements */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="p-2 bg-white/95 rounded-full text-gray-700 hover:text-[#FF8E8E] shadow-md">
                              <Eye className="w-4 h-4" />
                            </span>
                            <button
                              id={`btn-download-media-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `love-album-media-${idx + 1}-${Date.now()}.${album.type === 'photo_album' ? 'jpg' : 'mp4'}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="p-2 bg-white/95 text-gray-700 rounded-full hover:text-emerald-500 shadow-md transition-colors cursor-pointer"
                              title="ดาวน์โหลดไฟล์นี้"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-media-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'ลบไฟล์นี้ออกจากอัลบั้มใช่ไหมคะ? 🥺',
                                  message: 'รูปภาพ/วิดีโอนี้จะถูกลบออกจากอัลบั้มความทรงจำฉบับนี้ไปอย่างถาวรเลยจ้า',
                                  onConfirm: () => {
                                    handleDeleteMediaFromAlbum(album, idx);
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors cursor-pointer"
                              title="ลบไฟล์นี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-[#F0E6DD]/60">
                  <button
                    id="btn-close-detail-modal"
                    onClick={() => setSelectedAlbumId(null)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    เสร็จสิ้น & ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}


      {/* ----------------- IPHONE / ANDROID NATIVE NOTEBOOK SPLIT INTERFACE ----------------- */}
      {filter === 'note' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[550px] bg-white border border-[#F0E6DD] rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
          {/* LEFT SIDEBAR: Notes directory log */}
          <div className="md:col-span-4 border-r border-[#F0E6DD] bg-gradient-to-b from-[#FFFDFB] to-[#FFF9F5] flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-[#F0E6DD] flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#5D4E4E] text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#FF8E8E]" />
                  บันทึกแสนซน 🐻🐰
                </h3>
                <span className="text-[10px] text-gray-400 font-bold">จำนวน {allNotes.length} ฉบับ</span>
              </div>
              <button
                id="btn-sidebar-new-note"
                onClick={handleCreateNewNote}
                className="p-2 bg-[#FFEFEF] text-[#FF8E8E] hover:bg-[#FF8E8E] hover:text-white rounded-full transition-all cursor-pointer shadow-3xs"
                title="เขียนโน้ตใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Notes vertical list scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F0E6DD]/40 scrollbar-thin">
              {allNotes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-[#FFD6D6]" />
                  <p className="font-bold text-[#5D4E4E]">ไม่มีประวัติบันทึก</p>
                  <button
                    id="btn-add-note-empty"
                    onClick={handleCreateNewNote}
                    className="text-[11px] text-[#FF8E8E] font-bold underline"
                  >
                    คลิกเพื่อเขียนฉบับแรก
                  </button>
                </div>
              ) : (
                allNotes.map((note) => {
                  const isSelected = activeNoteId === note.id;
                  const snippet = note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : 'ยังไม่ได้เริ่มเขียนบันทึก';

                  return (
                    <div
                      id={`note-item-${note.id}`}
                      key={note.id}
                      onClick={() => handleSelectNote(note.id)}
                      className={`p-3.5 text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? 'bg-[#FFEFEF]/60 border-l-4 border-l-[#FF8E8E]'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-extrabold text-xs text-[#5D4E4E] line-clamp-1 flex-1">
                          {note.title}
                        </h5>
                        <button
                          id={`btn-delete-note-${note.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              isOpen: true,
                              title: 'ลบโน้ตรักฉบับนี้ใช่ไหมคะ? 🥺',
                              message: `คุณต้องการลบโน้ตเรื่อง "${note.title}" ฉบับนี้ใช่ไหมคะ? ข้อมูลเนื้อหาจะกู้กลับไม่ได้แล้วน้า`,
                              onConfirm: () => {
                                onDeleteMemory(note.id);
                                if (activeNoteId === note.id) {
                                  setActiveNoteId(null);
                                  setNoteTitleInput('');
                                  setNoteContentInput('');
                                }
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="text-gray-300 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors"
                          title="ลบโน้ตนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 leading-relaxed">
                        {snippet}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[9px] text-[#A89090] font-medium">
                        <span className="font-bold text-rose-400">
                          ✏️ {note.creatorId === 'user' ? userNickname : partnerNickname}
                        </span>
                        <span>
                          {new Date(note.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT VIEW: Gorgeous Notebook editor block */}
          <div className="md:col-span-8 flex flex-col max-h-[600px] bg-[#FAF8F5] relative">
            {activeNote ? (
              <div className="flex-1 flex flex-col h-full">
                {/* Editor Header metadata */}
                <div className="p-4 border-b border-[#F0E6DD]/60 flex items-center justify-between bg-white/70 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                    <span className="text-emerald-500 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      💾 บันทึกแบบเรียลไทม์
                    </span>
                    <span>แก้ไขล่าสุด: {new Date(activeNote.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <button
                    id="btn-save-note-manual"
                    onClick={handleSaveActiveNote}
                    className="px-4 py-1.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/90 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    บันทึกโน้ตนี้
                  </button>
                </div>

                {/* iPhone style paper layout */}
                <div className="flex-1 p-6 md:p-8 flex flex-col space-y-4 overflow-y-auto select-text">
                  <input
                    id="input-note-title"
                    type="text"
                    value={noteTitleInput}
                    onChange={(e) => {
                      setNoteTitleInput(e.target.value);
                      // Trigger automatic update of memory title
                      onUpdateMemory(activeNote.id, { title: e.target.value });
                    }}
                    onBlur={handleSaveActiveNote}
                    placeholder="หัวข้อจดบันทึก..."
                    className="w-full text-lg md:text-xl font-black text-[#5D4E4E] bg-transparent outline-hidden focus:outline-hidden border-none p-0 focus:ring-0 placeholder:text-gray-300 placeholder:italic"
                  />
                  
                  <div className="w-12 h-0.5 bg-[#FF8E8E]/40 rounded-full"></div>

                  <textarea
                    id="textarea-note-content"
                    value={noteContentInput}
                    onChange={(e) => {
                      setNoteContentInput(e.target.value);
                      // Trigger automatic update of memory content
                      onUpdateMemory(activeNote.id, { content: e.target.value });
                    }}
                    onBlur={handleSaveActiveNote}
                    placeholder="เริ่มขีดเขียนบันทึกความรู้สึก หรือเรื่องราวความทรงจำหวานๆ วันนี้กันเถอะ..."
                    className="w-full flex-1 text-xs md:text-sm text-gray-700 bg-transparent outline-hidden focus:outline-hidden border-none p-0 focus:ring-0 resize-none leading-relaxed placeholder:text-gray-400 font-sans min-h-[300px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
                <div className="w-16 h-16 bg-white border border-[#F0E6DD] rounded-3xl flex items-center justify-center text-[#FFD6D6] shadow-3xs animate-pulse">
                  <FileEdit className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-[#5D4E4E] text-sm">สมุดโน้ตส่วนตัวของสองเรา</h4>
                <p className="text-xs text-[#A89090] max-w-xs">
                  เลือกโน้ตทางซ้าย หรือกดปุ่ม "จดโน้ตใหม่" เพื่อเริ่มเขียนและแก้ไขบันทึกแบบ Realtime ด้วยกันค่ะ 💖
                </p>
                <button
                  id="btn-notebook-new-note"
                  onClick={handleCreateNewNote}
                  className="px-4 py-2 bg-[#FFEFEF] text-[#FF8E8E] hover:bg-[#FF8E8E] hover:text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
                >
                  ➕ เริ่มโน้ตแรกเลยค่ะ
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ----------------- CREATE ALBUM OVERLAY FORM MODAL ----------------- */}
      {isCreatingAlbum && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#F0E6DD] shadow-2xl max-w-xl w-full p-6 space-y-5 relative">
            <button
              id="btn-close-create-album"
              onClick={() => {
                setIsCreatingAlbum(false);
                setUploadedFiles([]);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-black text-[#5D4E4E] text-base flex items-center gap-2">
                {filter === 'video' ? (
                  <>
                    <Video className="w-5 h-5 text-emerald-500 animate-bounce" />
                    <span>อัปโหลดวิดีโอคู่รักใหม่ 🎥</span>
                  </>
                ) : (
                  <>
                    <FolderHeart className="w-5 h-5 text-[#FF8E8E]" />
                    <span>สร้างอัลบั้มความรักใหม่ ✨</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {filter === 'video'
                  ? 'บันทึกเรื่องราวแสนหวานที่เคลื่อนไหวได้ลงในคลังวิดีโอส่วนตัวของสองเรา'
                  : 'จัดหมวดหมู่ภาพถ่ายและวิดีโอแสนหวานของสองเราให้อยู่ด้วยกันเป็นอัลบั้ม'}
              </p>
            </div>

            <form onSubmit={handleCreateAlbumSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5D4E4E] mb-1">
                  {filter === 'video' ? 'ชื่อคลิปวิดีโอคู่รัก' : 'ชื่ออัลบั้มความทรงจำ'}
                </label>
                <input
                  id="input-album-title"
                  type="text"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder={filter === 'video' ? "เช่น แฟนแอบถ่ายตอนง่วงนอน 😴, โมเมนต์ทำอาหารด้วยกัน 🍳" : "เช่น ทริปสวีททะเลหัวหิน 🌊, นัดเดทแรกของเรา 🌹"}
                  className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden text-[#5D4E4E] bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4E4E] mb-1">คำบรรยายสั้นๆ (เก็บเป็นความทรงจำ)</label>
                <textarea
                  id="textarea-album-content"
                  value={albumContent}
                  onChange={(e) => setAlbumContent(e.target.value)}
                  placeholder="เขียนบรรยายความรู้สึก โมเมนต์หวานๆ ซึ้งๆ หรือเรื่องตลกๆ ในคลิปนี้..."
                  className="w-full text-xs p-3 rounded-xl border border-[#F0E6DD] focus:border-[#FF8E8E] outline-hidden h-20 resize-none text-[#5D4E4E] bg-white font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#5D4E4E]">
                  {filter === 'video' ? 'เลือกไฟล์วิดีโอคู่รัก' : 'อัพโหลดไฟล์เริ่มต้น (เลือกได้หลายไฟล์)'}
                </label>
                <div className="border-2 border-dashed border-[#F0E6DD] rounded-2xl p-6 text-center hover:border-[#FF8E8E] transition-colors relative bg-[#FFF9F5]/40 cursor-pointer">
                  <input
                    id="input-album-files-upload"
                    type="file"
                    multiple={filter !== 'video'}
                    accept={filter === 'video' ? "video/*" : "image/*"}
                    onChange={handleCreateAlbumFiles}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-[#FF8E8E]">
                      {filter === 'video' ? <Video className="w-5 h-5 text-emerald-500" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <p className="text-xs font-bold text-[#5D4E4E]">
                      {isProcessingFiles
                        ? 'กำลังประมวลผลวิดีโอ...'
                        : filter === 'video'
                        ? 'คลิกเพื่อเลือกไฟล์วิดีโอ หรือ ลากไฟล์มาวางที่นี่'
                        : 'คลิกเพื่อเลือกไฟล์รูปถ่าย หรือ ลากไฟล์มาวางที่นี่'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {filter === 'video' ? 'รองรับไฟล์วิดีโอ MP4, WebM หรือ MOV' : 'รองรับรูปถ่ายหลายรูปพร้อมกัน'}
                    </p>
                  </div>
                </div>

                {/* Previews inside Video/Album Create Modal */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-500">ไฟล์ที่เลือกไว้ ({uploadedFiles.length} ไฟล์):</span>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#FFF9F5]/30 rounded-xl border border-[#F0E6DD]">
                      {uploadedFiles.map((dataUrl, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-black group shadow-3xs">
                          {filter === 'photo_album' ? (
                            <img src={dataUrl} className="w-full h-full object-cover" />
                          ) : (
                            <video src={dataUrl} className="w-full h-full object-cover" />
                          )}
                          <button
                            id={`btn-remove-preview-file-${idx}`}
                            type="button"
                            onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  id="btn-cancel-create-album"
                  type="button"
                  onClick={() => {
                    setIsCreatingAlbum(false);
                    setUploadedFiles([]);
                  }}
                  className="px-4 py-2.5 text-xs font-extrabold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-submit-create-album"
                  type="submit"
                  disabled={isProcessingFiles || uploadedFiles.length === 0}
                  className="px-5 py-2.5 bg-[#FF8E8E] hover:bg-[#FF8E8E]/85 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Heart className="w-4 h-4 fill-white text-white" />
                  {filter === 'video' ? 'อัปโหลดวิดีโอแสนหวาน 🎥' : 'สร้างอัลบั้มและเก็บบันทึกรัก 📸'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- LIGHTBOX SLIDESHOW COMPONENT ----------------- */}
      {lightboxIndex !== null && lightboxAlbumId && (
        (() => {
          const album = memories.find(m => m.id === lightboxAlbumId);
          if (!album || !album.mediaUrls) return null;
          const mediaUrls = album.mediaUrls;
          const currentUrl = mediaUrls[lightboxIndex];

          const handlePrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : mediaUrls.length - 1));
          };

          const handleNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLightboxIndex((prev) => (prev !== null && prev < mediaUrls.length - 1 ? prev + 1 : 0));
          };

          return (
            <div
              className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 animate-fadeIn cursor-zoom-out"
              onClick={() => {
                setLightboxIndex(null);
                setLightboxAlbumId(null);
              }}
            >
              {/* Top controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10 pointer-events-none">
                <span className="text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {album.title} ({lightboxIndex + 1} / {mediaUrls.length})
                </span>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    id="btn-download-lightbox"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = currentUrl;
                      link.download = `love-memory-${album.type === 'photo_album' ? 'photo' : 'video'}-${Date.now()}.${album.type === 'photo_album' ? 'jpg' : 'mp4'}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 bg-black/60 rounded-full hover:bg-gray-800 text-white cursor-pointer transition-colors"
                    title="ดาวน์โหลดลงเครื่อง"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                  <button
                    id="btn-close-lightbox"
                    onClick={() => {
                      setLightboxIndex(null);
                      setLightboxAlbumId(null);
                    }}
                    className="p-2 bg-black/60 rounded-full hover:bg-gray-800 pointer-events-auto cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Prev button */}
              <button
                id="btn-prev-lightbox"
                onClick={handlePrev}
                className="absolute left-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white pointer-events-auto transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Center media element */}
              <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center pointer-events-none">
                {album.type === 'photo_album' ? (
                  <img
                    src={currentUrl}
                    alt={`Lightbox ${lightboxIndex}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video
                    src={currentUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
                  />
                )}
              </div>

              {/* Next button */}
              <button
                id="btn-next-lightbox"
                onClick={handleNext}
                className="absolute right-4 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white pointer-events-auto transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          );
        })()
      )}
      
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
