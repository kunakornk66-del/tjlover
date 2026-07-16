import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Calendar, Plus, X, Image as ImageIcon, Send, User, Trash2, ArrowRight, LayoutGrid, Eye } from 'lucide-react';
import { request } from '../lib/api';
import { Memory } from '../types';

interface MemoriesProps {
  currentUser: any;
}

export default function Memories({ currentUser }: MemoriesProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<any | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Active memory for comments expansion
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMemories = async () => {
    try {
      const data = await request('/api/memories');
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories', err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // Keep selectedLightboxImage in sync with updated memories
  useEffect(() => {
    if (selectedLightboxImage) {
      const foundMemory = memories.find(m => m.id === selectedLightboxImage.memoryId);
      if (foundMemory) {
        setSelectedLightboxImage(prev => prev ? {
          ...prev,
          likes: foundMemory.likes,
          comments: foundMemory.comments,
          memory: foundMemory
        } : null);
      } else {
        setSelectedLightboxImage(null);
      }
    }
  }, [memories]);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) return;
    setLoading(true);
    const galleryTitle = title.trim() || 'ภาพความทรงจำแสนพิเศษ ✨';
    try {
      await request('/api/memories/create', {
        method: 'POST',
        body: JSON.stringify({
          title: galleryTitle,
          content: 'บันทึกรูปภาพจากคลังแกลเลอรีความทรงจำ',
          date: date || new Date().toISOString().split('T')[0],
          images: images
        }),
      });
      setTitle('');
      setImages([]);
      fetchMemories();
    } catch (err) {
      console.error('Failed to upload image to gallery', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError('กรุณากรอกชื่อหัวข้อและวันที่');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await request('/api/memories/create', {
        method: 'POST',
        body: JSON.stringify({ title, content, date, images }),
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setImages([]);
      setIsCreating(false);
      fetchMemories();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกความทรงจำ');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (memoryId: string) => {
    try {
      const updated = await request('/api/memories/like', {
        method: 'POST',
        body: JSON.stringify({ memoryId }),
      });
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
    } catch (err) {
      console.error('Failed to like memory', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent, memoryId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const updated = await request('/api/memories/comment', {
        method: 'POST',
        body: JSON.stringify({ memoryId, text: commentText }),
      });
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าจะลบความทรงจำนี้?')) return;
    try {
      await request(`/api/memories/${memoryId}`, { method: 'DELETE' });
      fetchMemories();
    } catch (err) {
      console.error('Failed to delete memory', err);
    }
  };

  // Extract all images from memories for the masonry layout
  const allImages = memories.flatMap(memory => 
    (memory.images || []).map((imgUrl, idx) => ({
      url: imgUrl,
      id: `${memory.id}-${idx}`,
      memoryId: memory.id,
      memoryTitle: memory.title,
      memoryContent: memory.content,
      date: memory.date,
      creatorName: memory.creatorName,
      likes: memory.likes,
      comments: memory.comments,
      memory: memory
    }))
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Feed Header */}
      <div className="flex justify-between items-center bg-white/95 p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30">
        <div>
          <h2 className="text-xl font-bold font-heading text-rose-950">ไทม์ไลน์ความทรงจำของเรา 🌸</h2>
          <p className="text-rose-600/70 text-xs mt-0.5">แบ่งปันรูปภาพ สถานที่ และช่วงเวลาดีๆ ร่วมกัน</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-tr from-rose-500 to-orange-400 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-rose-200 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>เขียนบันทึกใหม่</span>
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-rose-50/50 p-1 rounded-2xl border border-rose-100/40">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            viewMode === 'timeline'
              ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm'
              : 'text-rose-750/70 hover:text-rose-900 hover:bg-rose-50/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>ไทม์ไลน์ความทรงจำ</span>
        </button>
        <button
          onClick={() => setViewMode('gallery')}
          className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            viewMode === 'gallery'
              ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm'
              : 'text-rose-750/70 hover:text-rose-900 hover:bg-rose-50/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>คลังภาพโมเสก (Masonry Gallery)</span>
        </button>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
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
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-stone-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold font-heading text-[#5D2E46] bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">บันทึกความทรงจำใหม่ 🌸</h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 hover:bg-rose-50 rounded-full text-rose-450 hover:text-rose-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-rose-850 mb-1">หัวข้อความทรงจำ</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ไปเดทที่สวนจตุจักร, วันวาเลนไทน์ปีแรก"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-sm bg-rose-50/20 transition text-[#5D2E46]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-rose-850 mb-1">วันที่ผ่านพ้นมา</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-rose-400" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-sm bg-rose-50/20 transition text-[#5D2E46]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-850 mb-1">เรื่องราวประทับใจ</label>
                  <textarea
                    rows={4}
                    placeholder="เล่ารายละเอียดหรือความรู้สึกของคุณตรงนี้..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-sm bg-rose-50/20 transition resize-none text-[#5D2E46]"
                  />
                </div>

                {/* Drag and Drop Upload */}
                <div>
                  <label className="block text-xs font-semibold text-rose-850 mb-2">อัปโหลดรูปภาพ (เลือกได้หลายรูป)</label>
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      isDragging 
                        ? 'border-rose-400 bg-rose-50/50' 
                        : 'border-rose-200 hover:border-rose-400 bg-rose-50/10 hover:bg-rose-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="memory-image-input"
                    />
                    <label htmlFor="memory-image-input" className="cursor-pointer">
                      <div className="p-3 bg-white shadow-sm inline-flex rounded-full text-rose-400 mb-2">
                        <ImageIcon className="w-6 h-6 text-rose-500" />
                      </div>
                      <p className="text-sm font-medium text-[#5D2E46]">ลากรูปภาพมาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-xs text-rose-500 mt-1">อัปโหลดได้หลายภาพพร้อมกัน</p>
                    </label>
                  </div>

                  {/* Thumbnail previews */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-3 bg-stone-50 border border-stone-150 rounded-xl">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-rose-100">
                          <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-xs text-center font-medium">{error}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl font-medium text-xs transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-tr from-rose-500 to-orange-400 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-rose-200 transition flex items-center gap-1.5"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>บันทึกความทรงจำ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area based on ViewMode */}
      {viewMode === 'timeline' ? (
        /* Timeline Feed */
        <div className="space-y-6">
          {memories.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200/50 text-center shadow-sm">
              <div className="p-4 bg-rose-50 text-rose-400 rounded-full inline-flex mb-3">
                <ImageIcon className="w-8 h-8 fill-rose-100" />
              </div>
              <h3 className="font-semibold text-stone-700 text-sm">ยังไม่มีความทรงจำบันทึกไว้</h3>
              <p className="text-stone-400 text-xs max-w-xs mx-auto mt-1">เริ่มต้นสร้างบันทึกแรก อัปโหลดรูปภาพทริปเที่ยววันหยุด หรือความประทับใจร่วมกัน</p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-4 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 py-2 px-4 rounded-xl hover:bg-rose-100 transition"
              >
                เขียนบันทึกแรกของคุณสองคน
              </button>
            </div>
          ) : (
            memories.map((memory) => {
              const hasLiked = memory.likes.includes(currentUser.id);
              const formattedDate = new Date(memory.date).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <motion.article
                  layout
                  key={memory.id}
                  className="bg-white/95 rounded-3xl border border-rose-100 shadow-lg shadow-rose-100/20 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-5 flex justify-between items-start border-b border-rose-50">
                    <div className="flex gap-3 items-center">
                      <div className="bg-gradient-to-tr from-rose-500 to-orange-400 text-white p-2.5 rounded-xl">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-rose-950 text-sm leading-snug">{memory.title}</h3>
                        <span className="text-[10px] text-rose-450 block mt-0.5">บันทึกเมื่อ {formattedDate} โดย {memory.creatorName}</span>
                      </div>
                    </div>
                    {memory.createdBy === currentUser.id && (
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg transition"
                        title="ลบบันทึก"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  {memory.content && (
                    <div className="px-6 py-4">
                      <p className="text-stone-600 text-xs leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                    </div>
                  )}

                  {/* Multiple Images Grid */}
                  {memory.images && memory.images.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className={`grid gap-2 ${
                        memory.images.length === 1 
                          ? 'grid-cols-1' 
                          : memory.images.length === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-3'
                      }`}>
                        {memory.images.map((img, index) => (
                          <div 
                            key={index} 
                            className={`relative overflow-hidden rounded-xl border border-stone-100 shadow-xs ${
                              memory.images.length === 1 ? 'max-h-96' : 'aspect-square'
                            }`}
                          >
                            <img 
                              src={img} 
                              alt={`${memory.title} file`} 
                              className="w-full h-full object-cover hover:scale-[1.02] transition duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactions Row */}
                  <div className="px-6 py-3 border-t border-b border-rose-50 bg-rose-50/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(memory.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                          hasLiked ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
                        <span>{memory.likes.length} ถูกใจ</span>
                      </button>

                      <button
                        onClick={() => setCommentingId(commentingId === memory.id ? null : memory.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                          commentingId === memory.id ? 'text-rose-500' : 'text-stone-400 hover:text-stone-600'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{memory.comments.length} ความคิดเห็น</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {commentingId === memory.id && (
                    <div className="p-5 bg-stone-50/30 space-y-4">
                      {/* List of comments */}
                      {memory.comments.length > 0 && (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                          {memory.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 text-xs">
                              <div className="font-semibold text-stone-800 shrink-0">{comment.userName}:</div>
                              <div className="text-stone-600 break-words flex-1">{comment.text}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New comment form */}
                      <form onSubmit={(e) => handleAddComment(e, memory.id)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="เขียนความคิดเห็นที่นี่..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 text-xs transition"
                        />
                        <button
                          type="submit"
                          className="px-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-medium text-xs transition flex items-center justify-center"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </motion.article>
              );
            })
          )}
        </div>
      ) : (
        /* Masonry Grid View */
        <div className="space-y-6 animate-fade-in">
          {/* Gallery View Upload Panel */}
          <div className="bg-white/95 p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="font-bold text-sm text-[#5D2E46] bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">อัปโหลดรูปภาพใหม่เข้าแกลเลอรี</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging 
                      ? 'border-rose-400 bg-rose-50/50' 
                      : 'border-rose-200 hover:border-rose-400 bg-rose-50/10 hover:bg-rose-50/30'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    id="gallery-image-input"
                  />
                  <label htmlFor="gallery-image-input" className="cursor-pointer">
                    <div className="p-3 bg-white shadow-xs inline-flex rounded-full text-rose-400 mb-2">
                      <Plus className="w-6 h-6 text-rose-500" />
                    </div>
                    <p className="text-xs font-semibold text-[#5D2E46]">ลากรูปภาพมาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                    <p className="text-[10px] text-rose-500 mt-1">อัปโหลดได้หลายภาพพร้อมกัน</p>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-rose-850 mb-1">คำบรรยาย/หัวข้อรูปภาพ</label>
                  <input
                    type="text"
                    placeholder="ภาพความทรงจำแสนพิเศษ ✨"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs bg-rose-50/20 text-[#5D2E46]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-850 mb-1">วันที่ผ่านพ้นมา</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs bg-rose-50/20 text-[#5D2E46]"
                  />
                </div>
                <button
                  onClick={handleGalleryUploadSubmit}
                  disabled={loading || images.length === 0}
                  className="w-full bg-gradient-to-tr from-rose-500 to-orange-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : 'อัปโหลดภาพเข้าคลัง'}
                </button>
              </div>
            </div>

            {/* Thumbnail previews inside upload box */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-rose-50/20 border border-rose-100 rounded-2xl">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-rose-100">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Masonry Grid */}
          {allImages.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200/50 text-center shadow-sm">
              <div className="p-4 bg-rose-50 text-rose-400 rounded-full inline-flex mb-3">
                <ImageIcon className="w-8 h-8 fill-rose-100" />
              </div>
              <h3 className="font-semibold text-stone-700 text-sm">ยังไม่มีรูปภาพบันทึกไว้</h3>
              <p className="text-stone-400 text-xs max-w-xs mx-auto mt-1">เริ่มต้นเลือกและอัปโหลดรูปภาพแรกของคุณสองคนร่วมกัน</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
              {allImages.map((imgItem) => (
                <motion.div
                  key={imgItem.id}
                  layout
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedLightboxImage(imgItem)}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden border border-rose-100 bg-white shadow-sm hover:shadow-lg transition duration-300 cursor-pointer mb-4"
                >
                  <img
                    src={imgItem.url}
                    alt={imgItem.memoryTitle}
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover Overlay with info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                    <p className="font-bold text-[11px] line-clamp-1">{imgItem.memoryTitle}</p>
                    <div className="flex justify-between items-center mt-1 text-[9px] text-white/80">
                      <span>{imgItem.creatorName}</span>
                      <span>{new Date(imgItem.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex gap-2 mt-1.5 text-[9px] font-bold">
                      <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> {imgItem.likes.length}</span>
                      <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5 text-blue-400" /> {imgItem.comments.length}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Image inspector modal */}
      <AnimatePresence>
        {selectedLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} // Prevent close on card click
              className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl border border-rose-100/20 flex flex-col md:flex-row"
            >
              {/* Left Side: Image display */}
              <div className="flex-1 bg-neutral-950 flex items-center justify-center relative p-2 min-h-[300px] md:max-h-[85vh]">
                <img
                  src={selectedLightboxImage.url}
                  alt={selectedLightboxImage.memoryTitle}
                  className="max-w-full max-h-[40vh] md:max-h-[80vh] object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setSelectedLightboxImage(null)}
                  className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Right Side: details, likes, comments */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-rose-100 flex flex-col h-[40vh] md:h-auto max-h-[45vh] md:max-h-[85vh] bg-white">
                {/* Header info */}
                <div className="p-4 border-b border-rose-50 shrink-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-rose-950 text-sm leading-snug">{selectedLightboxImage.memoryTitle}</h4>
                    <button
                      onClick={() => setSelectedLightboxImage(null)}
                      className="p-1.5 hover:bg-rose-50 rounded-full text-rose-450 hover:text-rose-600 transition hidden md:block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-rose-500 mt-1.5 font-semibold">
                    <span>โดย {selectedLightboxImage.creatorName}</span>
                    <span>{new Date(selectedLightboxImage.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {selectedLightboxImage.memoryContent && (
                    <p className="text-xs text-stone-600 mt-2 bg-rose-50/20 p-2.5 rounded-xl border border-rose-100/30 max-h-16 overflow-y-auto leading-relaxed">{selectedLightboxImage.memoryContent}</p>
                  )}
                </div>

                {/* Interactions row */}
                <div className="px-4 py-2 bg-rose-50/10 border-b border-rose-50 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => handleLike(selectedLightboxImage.memoryId)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                      selectedLightboxImage.likes.includes(currentUser.id) ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${selectedLightboxImage.likes.includes(currentUser.id) ? 'fill-rose-500' : ''}`} />
                    <span>{selectedLightboxImage.likes.length} ถูกใจ</span>
                  </button>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {selectedLightboxImage.comments.length} ความคิดเห็น
                  </span>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/20">
                  {selectedLightboxImage.comments.length === 0 ? (
                    <p className="text-center text-[11px] text-stone-400 py-6">ยังไม่มีความคิดเห็น เขียนคนแรกเลย!</p>
                  ) : (
                    selectedLightboxImage.comments.map((comment: any) => (
                      <div key={comment.id} className="text-xs leading-normal">
                        <span className="font-bold text-rose-950 mr-1.5">{comment.userName}:</span>
                        <span className="text-stone-600 break-all">{comment.text}</span>
                        <span className="block text-[8px] text-stone-400 mt-0.5">
                          {new Date(comment.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Inline Comment Form */}
                <form
                  onSubmit={(e) => handleAddComment(e, selectedLightboxImage.memoryId)}
                  className="p-3 border-t border-rose-50 bg-white shrink-0 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="เขียนความคิดเห็น..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-rose-100 bg-rose-50/10 text-xs text-[#5D2E46] focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-xl hover:opacity-90 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
