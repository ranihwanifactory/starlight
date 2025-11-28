import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry, UserProfile } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Sparkles, Save, X, Calendar, MapPin, Telescope, Users } from 'lucide-react';
import { enhanceJournalEntry } from '../services/geminiService';

interface JournalEditorProps {
  user: UserProfile;
  initialData?: JournalEntry; // Optional prop for editing
  onCancel: () => void;
  onSave: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ user, initialData, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [equipment, setEquipment] = useState('');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [observers, setObservers] = useState('아빠와 아들');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setLocation(initialData.location);
      setEquipment(initialData.equipment);
      setTarget(initialData.target);
      setDescription(initialData.description);
      setObservers(initialData.observers);
      if (initialData.imageUrl) {
        setPreviewUrl(initialData.imageUrl);
      }
    }
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEnhance = async () => {
    if (!description || !target) {
      alert("관측 대상과 설명을 먼저 입력해주세요.");
      return;
    }
    setAiLoading(true);
    const enhanced = await enhanceJournalEntry(description, target);
    setDescription(enhanced);
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    try {
      let imageUrl = initialData?.imageUrl || '';

      if (imageFile) {
        // Upload new image
        const storageRef = ref(storage, `journal_images/${user.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const entryData: Partial<JournalEntry> = {
        title,
        date,
        location,
        equipment,
        target,
        description,
        observers,
        imageUrl,
        authorName: user.displayName || '익명의 천문학자',
      };

      if (initialData && initialData.id) {
        // Update existing entry
        const entryRef = doc(db, 'journals', initialData.id);
        await updateDoc(entryRef, entryData);
      } else {
        // Create new entry
        const newEntry: JournalEntry = {
          ...entryData as JournalEntry,
          createdAt: Date.now(),
          userId: user.uid,
        };
        await addDoc(collection(db, 'journals'), newEntry);
      }

      onSave();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("저장에 실패했습니다. 콘솔을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-space-800/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-6 md:p-8 animate-fade-in relative z-20 my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white">
          {initialData ? '관측 일지 수정' : '새로운 관측 일지'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-64 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-space-accent hover:bg-space-700/50 transition-all group overflow-hidden"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-400 group-hover:text-space-accent">
              <Camera size={48} className="mb-2" />
              <p>클릭하여 천체 사진 {initialData ? '변경' : '업로드'}</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1">일지 제목</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 토성을 처음 본 날"
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Telescope size={14} /> 관측 대상
              </label>
              <input
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="예: 목성, M42"
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Users size={14} /> 관측자
              </label>
              <input
                type="text"
                value={observers}
                onChange={e => setObservers(e.target.value)}
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Calendar size={14} /> 관측 날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <MapPin size={14} /> 관측 장소
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="예: 뒷마당, 천문대"
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
              />
            </div>

             <div>
              <label className="block text-space-accent text-sm font-bold uppercase mb-1">관측 장비</label>
              <input
                type="text"
                value={equipment}
                onChange={e => setEquipment(e.target.value)}
                placeholder="예: 셀레스트론 NexStar 8SE"
                className="w-full bg-space-900/50 border border-gray-700 text-white p-3 rounded-lg focus:border-space-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-space-accent text-sm font-bold uppercase">관측 노트</label>
            <button
              type="button"
              onClick={handleAiEnhance}
              disabled={aiLoading}
              className="text-xs flex items-center gap-1 text-purple-300 hover:text-white bg-purple-900/40 px-2 py-1 rounded-full transition-colors border border-purple-500/30"
            >
              <Sparkles size={12} />
              {aiLoading ? 'AI가 글을 다듬는 중...' : 'Gemini AI로 글 다듬기'}
            </button>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={8}
            placeholder="무엇을 보았나요? 색상, 밝기, 대기의 상태 등을 자유롭게 적어보세요..."
            className="w-full bg-space-900/50 border border-gray-700 text-white p-4 rounded-lg focus:border-space-accent focus:outline-none font-serif leading-loose"
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 rounded-lg bg-space-accent text-space-900 font-bold hover:bg-yellow-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          >
            <Save size={18} />
            {loading ? '저장 중...' : (initialData ? '수정 완료' : '일지 저장')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JournalEditor;
