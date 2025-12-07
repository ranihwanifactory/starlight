import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry, UserProfile } from '../types';
import { db, storage } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Sparkles, Save, X, Calendar, MapPin, Telescope, Users, Link as LinkIcon, Upload } from 'lucide-react';
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
  
  // Image handling
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if editing, or user profile defaults if creating new
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
    } else {
      // New Entry: Auto-fill from user profile
      if (user.region) setLocation(user.region);
      if (user.equipment) setEquipment(user.equipment);
      if (user.displayName) setObservers(user.displayName);
    }
  }, [initialData, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setUrlInput(''); // Clear URL input if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    setImageFile(null); // Clear file if URL is typed
    setPreviewUrl(url);
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
        // Option 1: Upload new image file
        const storageRef = ref(storage, `journal_images/${user.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } else if (urlInput) {
        // Option 2: Use provided URL directly
        imageUrl = urlInput;
      }
      // Option 3: Keep existing initialData.imageUrl (already assigned default)

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
          likes: [],     // Initialize likes
          comments: []   // Initialize comments
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
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-xl p-4 md:p-8 animate-fade-in relative z-20 my-4 md:my-8 mb-20 md:mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display text-gray-900">
          {initialData ? '관측 일지 수정' : '새로운 관측 일지'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-900 transition-colors p-2">
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Area */}
        <div>
          <div className="flex gap-6 border-b border-gray-200 mb-4">
             <button 
               type="button"
               onClick={() => setInputType('file')}
               className={`pb-2 px-1 text-base md:text-sm font-bold transition-all flex items-center gap-2 ${inputType === 'file' ? 'text-space-accent border-b-2 border-space-accent' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <Upload size={18} />
               파일 업로드
             </button>
             <button 
               type="button"
               onClick={() => setInputType('url')}
               className={`pb-2 px-1 text-base md:text-sm font-bold transition-all flex items-center gap-2 ${inputType === 'url' ? 'text-space-accent border-b-2 border-space-accent' : 'text-gray-400 hover:text-gray-600'}`}
             >
               <LinkIcon size={18} />
               이미지 URL
             </button>
          </div>

          <div 
            onClick={() => inputType === 'file' && fileInputRef.current?.click()}
            className={`relative w-full h-48 md:h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all group overflow-hidden ${
              inputType === 'file' 
                ? 'cursor-pointer hover:border-space-accent hover:bg-gray-50 border-gray-300' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full h-full group-preview">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    setImageFile(null);
                    setUrlInput('');
                  }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-2 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 group-hover:text-space-accent p-4 text-center">
                {inputType === 'file' ? (
                  <>
                    <Camera size={40} className="mb-2" />
                    <p className="text-sm">클릭하여 천체 사진 {initialData ? '변경' : '업로드'}</p>
                  </>
                ) : (
                   <>
                    <LinkIcon size={40} className="mb-2 opacity-50" />
                    <p className="opacity-50 text-sm">아래에 이미지 주소를 입력하세요</p>
                   </>
                )}
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

          {/* URL Input Field - Only visible in URL mode */}
          {inputType === 'url' && (
            <div className="mt-3 animate-fade-in">
              <input
                type="url"
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded-lg focus:border-space-accent focus:outline-none placeholder-gray-400 font-mono text-base"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">* 공개적으로 접근 가능한 이미지 URL을 입력해주세요.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1">일지 제목</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 토성을 처음 본 날"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Telescope size={14} /> 관측 대상
              </label>
              <input
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="예: 목성, M42"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Users size={14} /> 관측자 (작성자)
              </label>
              <input
                type="text"
                value={observers}
                onChange={e => setObservers(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <Calendar size={14} /> 관측 날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1 flex items-center gap-2">
                <MapPin size={14} /> 관측 장소
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="예: 뒷마당, 천문대"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
              />
            </div>

             <div>
              <label className="block text-gray-700 text-sm font-bold uppercase mb-1">관측 장비</label>
              <input
                type="text"
                value={equipment}
                onChange={e => setEquipment(e.target.value)}
                placeholder="예: 셀레스트론 NexStar 8SE"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-3 rounded-lg focus:border-space-accent focus:outline-none text-base"
              />
              <p className="text-xs text-gray-500 mt-1">이 게시물에 사용된 장비를 입력하세요. (기본값은 프로필에서 가져옵니다)</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-gray-700 text-sm font-bold uppercase">관측 노트</label>
            <button
              type="button"
              onClick={handleAiEnhance}
              disabled={aiLoading}
              className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-100 px-3 py-1.5 rounded-full transition-colors border border-purple-200"
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
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 p-4 rounded-lg focus:border-space-accent focus:outline-none font-serif leading-loose text-base"
          ></textarea>
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full md:w-auto px-6 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors text-base"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 rounded-lg bg-space-accent text-white font-bold hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg text-base"
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