import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Image as ImageIcon, Send, Heart, MessageCircle, 
  Trash2, ArrowRight, Download, Filter, Search, Grid, Folder, 
  Calendar, User, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { request } from '../lib/api';
import { Memory } from '../types';

interface PhotoGalleryProps {
  currentUser: any;
  partner?: any;
  onRefreshData?: () => void;
}

const ALBUM_CATEGORIES = [
  { name: 'ทั่วไป 🌸', icon: '🌸', color: 'from-pink-400 to-rose-400' },
  { name: 'ทริปท่องเที่ยว ✈️', icon: '✈️', color: 'from-blue-400 to-teal-400' },
  { name: 'วันสำคัญ 🗓️', icon: '🗓️', color: 'from-purple-400 to-indigo-400' },
  { name: 'อาหาร & คาเฟ่ 🍰', icon: '🍰', color: 'from-amber-400 to-orange-400' },
  { name: 'ช่วงเวลาตลก 🤪', icon: '🤪', color: 'from-green-400 to-emerald-400' }
];

export default function PhotoGallery({ currentUser, partner, onRefreshData }: PhotoGalleryProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // View states
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('ทั้งหมด 💖');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [createdByFilter, setCreatedByFilter] = useState<'all' | 'me' | 'partner'>('all');
  
  // Upload states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState('ทั่วไป 🌸');
  const [isDragging, setIsDragging] = useState(false);

  // Lightbox slider states
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await request('/api/memories');
      setMemories(data);
    } catch (err) {
      console.error('Failed to load gallery photos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [currentUser.coupleId]);

  // Extract separate photos from memories to treat each image as an individual gallery item
  const allPhotos = memories.flatMap(memory => 
    (memory.images || []).map((imgUrl, idx) => ({
      url: imgUrl,
      id: `${memory.id}-${idx}`,
      memoryId: memory.id,
      title: memory.title,
      content: memory.content,
      date: memory.date,
      createdBy: memory.createdBy,
      creatorName: memory.creatorName,
      category: memory.category || 'ทั่วไป 🌸',
      likes: memory.likes || [],
      comments: memory.comments || [],
      createdAt: memory.createdAt,
      memory: memory
    }))
  );

  // Handle Drag & Drop Uploading
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

  // Submit new photo gallery memory
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await request('/api/memories/create', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || 'ภาพถ่ายแสนพิเศษ 📸',
          content: content.trim() || 'แชร์รูปภาพลงในแกลเลอรีแสนอบอุ่นของเรา',
          date: date || new Date().toISOString().split('T')[0],
          images: images,
          category: category
        }),
      });

      // Reset
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setImages([]);
      setCategory('ทั่วไป 🌸');
      setIsUploading(false);
      fetchPhotos();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ');
    } finally {
      setLoading(false);
    }
  };

  // Handle Liking
  const handleLike = async (memoryId: string) => {
    try {
      const updated = await request('/api/memories/like', {
        method: 'POST',
        body: JSON.stringify({ memoryId }),
      });
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
    } catch (err) {
      console.error('Failed to like photo', err);
    }
  };

  // Handle Commenting
  const handleAddComment = async (e: React.FormEvent, memoryId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const updated = await request('/api/memories/comment', {
        method: 'POST',
        body: JSON.stringify({ memoryId, text: commentText.trim() }),
      });
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  // Handle Deleting photo memory
  const handleDeletePhoto = async (memoryId: string) => {
    if (!confirm('คุณต้องการลบภาพความทรงจำนี้ใช่หรือไม่? (การดำเนินการนี้จะลบทั้งบันทึกของรูปภาพนี้)')) return;
    try {
      await request(`/api/memories/${memoryId}`, { method: 'DELETE' });
      setLightboxIndex(null);
      fetchPhotos();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to delete photo', err);
    }
  };

  // Filters and Sorters
  const filteredPhotos = allPhotos
    .filter(photo => {
      // Album Filter
      if (selectedAlbum !== 'ทั้งหมด 💖' && photo.category !== selectedAlbum) {
        return false;
      }
      // Creator Filter
      if (createdByFilter === 'me' && photo.createdBy !== currentUser.id) {
        return false;
      }
      if (createdByFilter === 'partner' && (photo.createdBy === currentUser.id || !partner)) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = photo.title.toLowerCase().includes(query);
        const matchesContent = photo.content.toLowerCase().includes(query);
        const matchesCreator = photo.creatorName.toLowerCase().includes(query);
        return matchesTitle || matchesContent || matchesCreator;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'popular') {
        return b.likes.length - a.likes.length;
      }
      return 0;
    });

  // Calculate album counts
  const getAlbumCount = (albumName: string) => {
    if (albumName === 'ทั้งหมด 💖') return allPhotos.length;
    return allPhotos.filter(photo => photo.category === albumName).length;
  };

  // Navigation for Lightbox slideshow
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    } else if (lightboxIndex === 0) {
      setLightboxIndex(filteredPhotos.length - 1);
    }
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && lightboxIndex < filteredPhotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    } else if (lightboxIndex === filteredPhotos.length - 1) {
      setLightboxIndex(0);
    }
  };

  // Safe fetch of current lightbox photo
  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  // Sync lightbox photo when state/memories update (so likes & comments are live)
  const syncLightboxPhoto = currentLightboxPhoto 
    ? allPhotos.find(p => p.id === currentLightboxPhoto.id) || currentLightboxPhoto
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Upper header card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/95 p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-100/30 gap-4">
        <div>
          <h2 className="text-xl font-black font-heading text-rose-950 flex items-center gap-2">
            คลังภาพความทรงจำร่วมกัน 📸
          </h2>
          <p className="text-rose-600/70 text-xs mt-0.5">คลังแกลเลอรีรูปภาพส่วนตัวที่เราทั้งสองคนอัปโหลด บันทึก และแบ่งปันร่วมกัน</p>
        </div>
        <button
          onClick={() => setIsUploading(true)}
          className="bg-gradient-to-tr from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-rose-200 transition flex items-center gap-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>เก็บความทรงจำใหม่</span>
        </button>
      </div>

      {/* Album Horizontal Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
        <button
          onClick={() => setSelectedAlbum('ทั้งหมด 💖')}
          className={`p-4 rounded-2xl text-left border transition relative overflow-hidden flex flex-col justify-between h-24 ${
            selectedAlbum === 'ทั้งหมด 💖'
              ? 'bg-gradient-to-tr from-rose-500 to-pink-500 border-rose-200 text-white shadow-lg shadow-rose-100'
              : 'bg-white border-rose-100 text-rose-950 hover:bg-rose-50/50'
          }`}
        >
          <div className="bg-white/20 p-1.5 rounded-lg w-fit text-lg">💖</div>
          <div>
            <p className="text-xs font-black truncate">รูปภาพทั้งหมด</p>
            <span className={`text-[10px] font-bold ${selectedAlbum === 'ทั้งหมด 💖' ? 'text-rose-100' : 'text-rose-450'}`}>
              {getAlbumCount('ทั้งหมด 💖')} รูป
            </span>
          </div>
        </button>

        {ALBUM_CATEGORIES.map((album) => {
          const isActive = selectedAlbum === album.name;
          const count = getAlbumCount(album.name);
          return (
            <button
              key={album.name}
              onClick={() => setSelectedAlbum(album.name)}
              className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between h-24 ${
                isActive
                  ? `bg-gradient-to-tr ${album.color} border-stone-200/20 text-white shadow-lg`
                  : 'bg-white border-rose-100 text-[#5D2E46] hover:bg-rose-50/40'
              }`}
            >
              <div className="bg-stone-100/10 p-1.5 rounded-lg w-fit text-lg">{album.icon}</div>
              <div className="truncate w-full">
                <p className="text-xs font-black truncate">{album.name.split(' ')[0]}</p>
                <span className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-stone-400'}`}>
                  {count} รูป
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters & Actions Panel */}
      <div className="bg-white/90 p-4 rounded-2xl border border-rose-100/80 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-rose-450" />
          <input
            type="text"
            placeholder="ค้นหาชื่อรูปภาพ, เรื่องราว หรือคนอัปโหลด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-rose-100/60 bg-rose-50/10 text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Badges & Sorts */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
          {/* Created by filter */}
          <div className="flex bg-rose-50/50 p-1 rounded-xl border border-rose-100/40">
            <button
              onClick={() => setCreatedByFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                createdByFilter === 'all' ? 'bg-white text-rose-600 shadow-xs' : 'text-stone-500 hover:text-rose-950'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setCreatedByFilter('me')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                createdByFilter === 'me' ? 'bg-white text-rose-600 shadow-xs' : 'text-stone-500 hover:text-rose-950'
              }`}
            >
              โดยฉัน
            </button>
            {partner && (
              <button
                onClick={() => setCreatedByFilter('partner')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  createdByFilter === 'partner' ? 'bg-white text-rose-600 shadow-xs' : 'text-stone-500 hover:text-rose-950'
                }`}
              >
                โดยที่รัก
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-rose-100/30 text-stone-600">
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none font-bold text-stone-700 cursor-pointer"
            >
              <option value="newest">ล่าสุด ⏳</option>
              <option value="oldest">เก่าที่สุด 🗓️</option>
              <option value="popular">ยอดนิยม 🔥</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload/Creation Modal */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-rose-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-rose-950">อัปโหลดรูปภาพเข้าแกลเลอรี 📂</h3>
                </div>
                <button
                  onClick={() => setIsUploading(false)}
                  className="p-1.5 hover:bg-rose-50 rounded-full text-rose-400 hover:text-rose-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Drag and drop zone */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-2">เลือกรูปภาพแสนสวย</label>
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      isDragging 
                        ? 'border-rose-450 bg-rose-50/50' 
                        : 'border-rose-200 hover:border-rose-450 bg-rose-50/10 hover:bg-rose-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="gallery-direct-image-input"
                    />
                    <label htmlFor="gallery-direct-image-input" className="cursor-pointer block">
                      <div className="p-3 bg-white shadow-sm inline-flex rounded-full text-rose-400 mb-2">
                        <Plus className="w-6 h-6 text-rose-500" />
                      </div>
                      <p className="text-xs font-bold text-rose-950">ลากรูปภาพมาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-[10px] text-rose-500 mt-1">สามารถเลือกได้หลายภาพพร้อมกัน</p>
                    </label>
                  </div>

                  {/* Image thumbnails display */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-rose-50/30 border border-rose-100 rounded-2xl">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-rose-100 shrink-0">
                          <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">หัวข้อรูปภาพ / แฟลชความรู้สึก</label>
                  <input
                    type="text"
                    placeholder="เช่น ไอติมถ้วยโปรดของเรา, วันที่ไปทะเลด้วยกัน"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs bg-rose-50/20 text-[#5D2E46] font-medium"
                  />
                </div>

                {/* Category Album Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">จัดเก็บเข้าอัลบั้ม</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-rose-100 bg-rose-50/20 text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 font-bold"
                    >
                      {ALBUM_CATEGORIES.map(album => (
                        <option key={album.name} value={album.name}>{album.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">วันที่บันทึก</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-rose-100 bg-rose-50/20 text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1">เรื่องราวประทับใจของภาพนี้</label>
                  <textarea
                    rows={3}
                    placeholder="ใส่คำบรรยาย ความทรงจำ หรือความประทับใจที่คุณสองคนมีร่วมกันลงในภาพถ่ายนี้..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs bg-rose-50/20 text-[#5D2E46] resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center">{error}</p>
                )}

                {/* Submit button bar */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploading(false)}
                    className="px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl font-bold text-xs transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading || images.length === 0}
                    className="bg-gradient-to-tr from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-200 transition flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>อัปโหลดเข้าแกลเลอรี</span>
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

      {/* Main Grid Photo List */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-rose-100 text-center shadow-md max-w-lg mx-auto mt-6">
          <div className="p-4 bg-rose-50 text-rose-450 rounded-full inline-flex mb-3">
            <ImageIcon className="w-8 h-8 fill-rose-100 text-rose-500 animate-pulse" />
          </div>
          <h3 className="font-bold text-rose-950 text-sm">ไม่พบรูปภาพความทรงจำ</h3>
          <p className="text-stone-400 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
            ยังไม่มีรูปภาพในอัลบั้ม "{selectedAlbum}" หรือไม่มีภาพถ่ายที่ตรงตามการค้นหาของคุณ ลองเปลี่ยนประเภทตัวกรองหรืออัปโหลดรูปภาพใหม่ร่วมกัน
          </p>
          <button
            onClick={() => setIsUploading(true)}
            className="mt-5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 mx-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เริ่มอัปโหลดรูปภาพแรกร่วมกัน</span>
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredPhotos.map((photo, index) => {
            const hasLiked = photo.likes.includes(currentUser.id);
            return (
              <motion.div
                key={photo.id}
                layout
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxIndex(index)}
                className="break-inside-avoid relative group rounded-2xl overflow-hidden border border-rose-100/70 bg-white shadow-sm hover:shadow-xl transition duration-300 cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-auto object-cover max-h-[350px]"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Category Badge on top left */}
                <span className="absolute top-2.5 left-2.5 bg-black/55 backdrop-blur-xs text-[9px] text-white font-extrabold px-2 py-1 rounded-lg z-10 shadow-sm">
                  {photo.category.split(' ')[0]}
                </span>

                {/* Subtle Polaroid style label overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                  <h4 className="font-extrabold text-[11px] line-clamp-1">{photo.title}</h4>
                  <div className="flex justify-between items-center text-[9px] text-stone-200 mt-1">
                    <span className="font-medium">โดย {photo.creatorName}</span>
                    <span>{new Date(photo.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-bold border-t border-white/15 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-300'}`} /> 
                      {photo.likes.length}
                    </span>
                    <span className="flex items-center gap-1 text-stone-200">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> 
                      {photo.comments.length}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Advanced Fullscreen Lightbox / Slideshow Slider */}
      <AnimatePresence>
        {syncLightboxPhoto && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Slide Navigation - Prev button */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full transition z-50 shadow-lg border border-white/10"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Slide Navigation - Next button */}
            <button
              onClick={handleNextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full transition z-50 shadow-lg border border-white/10"
              title="ถัดไป"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()} // Stop closing lightbox when clicking on container
              className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full max-h-[92vh] md:max-h-[85vh] shadow-2xl border border-stone-800/10 flex flex-col md:flex-row relative"
            >
              {/* Photo View Pane (Left / Top) */}
              <div className="flex-1 bg-[#121212] flex items-center justify-center relative p-2 min-h-[300px] max-h-[40vh] md:max-h-full">
                <img
                  src={syncLightboxPhoto.url}
                  alt={syncLightboxPhoto.title}
                  className="max-w-full max-h-[38vh] md:max-h-[82vh] object-contain select-text"
                  referrerPolicy="no-referrer"
                />

                {/* Close Button on Image Pane (Mobile Only) */}
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition md:hidden z-10"
                  title="ปิด"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Album Category Badge */}
                <span className="absolute top-4 left-4 bg-rose-500/90 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">
                  {syncLightboxPhoto.category}
                </span>
              </div>

              {/* Sidebar Info/Comments Pane (Right / Bottom) */}
              <div className="w-full md:w-85 border-t md:border-t-0 md:border-l border-rose-50 flex flex-col h-[50vh] md:h-auto max-h-[50vh] md:max-h-[85vh] bg-white text-[#5D2E46]">
                
                {/* Photo Details / Header */}
                <div className="p-4 border-b border-rose-50 shrink-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-extrabold text-rose-950 text-sm leading-tight">{syncLightboxPhoto.title}</h4>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Download */}
                      <a
                        href={syncLightboxPhoto.url}
                        download={`couple-photo-${syncLightboxPhoto.id}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-rose-600 transition"
                        title="ดาวน์โหลดรูปภาพ"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {/* Delete */}
                      {syncLightboxPhoto.createdBy === currentUser.id && (
                        <button
                          onClick={() => handleDeletePhoto(syncLightboxPhoto.memoryId)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition"
                          title="ลบรูปภาพแกลเลอรี"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Close button (Desktop) */}
                      <button
                        onClick={() => setLightboxIndex(null)}
                        className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-rose-600 transition hidden md:block"
                        title="ปิด"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-rose-500 mt-2 font-bold bg-rose-50/40 px-2.5 py-1.5 rounded-xl border border-rose-100/40">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> โดย {syncLightboxPhoto.creatorName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(syncLightboxPhoto.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  {syncLightboxPhoto.content && (
                    <p className="text-xs text-stone-500 mt-2.5 max-h-20 overflow-y-auto leading-relaxed border-l-2 border-rose-300 pl-2 bg-stone-50/50 p-1.5 rounded-r-lg">
                      {syncLightboxPhoto.content}
                    </p>
                  )}
                </div>

                {/* Interactions details */}
                <div className="px-4 py-2.5 bg-rose-50/15 border-b border-rose-50 flex items-center justify-between shrink-0">
                  <button
                    onClick={() => handleLike(syncLightboxPhoto.memoryId)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition ${
                      syncLightboxPhoto.likes.includes(currentUser.id) ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${syncLightboxPhoto.likes.includes(currentUser.id) ? 'fill-rose-500' : ''}`} />
                    <span>{syncLightboxPhoto.likes.length} ถูกใจ</span>
                  </button>
                  <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-rose-450" /> {syncLightboxPhoto.comments.length} ข้อคิดเห็น
                  </span>
                </div>

                {/* Photo comments list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/20">
                  {syncLightboxPhoto.comments.length === 0 ? (
                    <div className="text-center text-stone-400 py-10 flex flex-col items-center gap-1">
                      <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
                      <p className="text-[10px] font-bold">ยังไม่มีข้อคิดเห็น</p>
                      <p className="text-[9px] text-stone-400">เขียนสิ่งน่ารักๆ ลงในรูปภาพความทรงจำนี้สิ 💕</p>
                    </div>
                  ) : (
                    syncLightboxPhoto.comments.map((comment: any) => (
                      <div key={comment.id} className="text-xs border-b border-rose-50/30 pb-2">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-extrabold text-rose-950">{comment.userName}</span>
                          <span className="text-[8px] text-stone-400">
                            {new Date(comment.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-stone-600 break-all pl-1 text-[11px] leading-relaxed">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post comment form */}
                <form
                  onSubmit={(e) => handleAddComment(e, syncLightboxPhoto.memoryId)}
                  className="p-3 border-t border-rose-50 bg-white shrink-0 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="เขียนสิ่งน่ารักๆ ถึงกัน..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 py-2 px-3 rounded-xl border border-rose-100 bg-rose-50/10 text-xs text-[#5D2E46] focus:outline-none focus:ring-1 focus:ring-rose-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-xl hover:opacity-90 transition shadow-sm active:scale-95"
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
