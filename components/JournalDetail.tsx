import React from 'react';
import { JournalEntry, UserProfile } from '../types';
import { ArrowLeft, Share2, Calendar, MapPin, Telescope, Users, Clock, Trash2, Edit, ExternalLink, ImageIcon } from 'lucide-react';

interface JournalDetailProps {
  entry: JournalEntry;
  currentUser: UserProfile | null;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ entry, currentUser, onBack, onEdit, onDelete }) => {
  const isOwner = currentUser?.uid === entry.userId;

  const handleShare = async () => {
    // Generate Deep Link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?entry=${entry.id}`;
    const shareTitle = `Starlight Journal: ${entry.title}`;
    const shareText = `${entry.observers} 대원의 우주 관측 기록을 확인해보세요!\n관측 대상: ${entry.target}\n\n`;

    try {
      if (entry.imageUrl && navigator.share) {
        try {
          const response = await fetch(entry.imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          const fileType = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
          const extension = fileType.split('/')[1] || 'jpg';
          const fileName = `starlight-${Date.now()}.${extension}`;
          const file = new File([blob], fileName, { type: fileType });
          const shareData: ShareData = {
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            files: [file]
          };
          if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        } catch (fileError) {
          console.warn("File sharing failed", fileError);
        }
      }
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        alert('링크가 복사되었습니다!');
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 기록을 삭제할까요?')) {
      if (entry.id) onDelete(entry.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto scrollbar-hide animate-fade-in font-sans overscroll-contain">
      
      {/* Navigation & Actions */}
      <div className="sticky top-0 left-0 right-0 z-50 p-4 md:px-6 pt-safe flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
        <button 
          onClick={onBack}
          className="p-2 text-gray-900 hover:text-space-accent transition-all flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={24} />
          <span className="hidden md:inline">뒤로가기</span>
        </button>

        <div className="flex gap-2">
          {isOwner && (
            <>
              <button onClick={() => onEdit(entry)} className="p-2 text-gray-500 hover:text-gray-900 transition-all rounded-sm" title="기록 수정">
                <Edit size={20} />
              </button>
              <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-500 transition-all rounded-sm" title="기록 삭제">
                <Trash2 size={20} />
              </button>
            </>
          )}
          <button onClick={handleShare} className="p-2 text-space-accent hover:text-cyan-600 transition-all" title="기록 공유">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold text-space-accent uppercase tracking-widest">
              <Telescope size={14} />
              {entry.target || '대상 미상'}
              <span className="text-gray-300 mx-2">|</span>
              <span className="text-gray-500">{entry.date}</span>
           </div>
           
           <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 leading-tight mb-4">
             {entry.title}
           </h1>

           <div className="flex items-center gap-2 text-gray-500 text-sm">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-space-accent to-purple-500 p-[1px]">
               <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <Users size={14} className="text-gray-900" />
               </div>
             </div>
             <span className="font-bold text-gray-900">{entry.observers}</span>
             <span>•</span>
             <span>{entry.location}</span>
           </div>
        </div>

        {/* Main Image */}
        {entry.imageUrl && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-2xl bg-gray-100 border border-gray-100">
            <img 
              src={entry.imageUrl} 
              alt={entry.title} 
              className="w-full h-auto object-cover"
            />
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
               <span className="flex items-center gap-1"><ImageIcon size={12} /> 시각 관측 자료</span>
               <span className="font-mono">{entry.equipment || '장비 정보 없음'}</span>
            </div>
          </div>
        )}

        {/* Body Text */}
        <div className="prose prose-lg prose-slate max-w-none mb-12">
           <p className="whitespace-pre-wrap leading-loose text-gray-700 font-serif text-lg">
             <span className="text-5xl float-left mr-3 mt-[-10px] font-display text-space-accent">
               {entry.description.charAt(0)}
             </span>
             {entry.description.slice(1)}
           </p>
        </div>

        {/* Metadata Grid */}
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</h4>
              <p className="text-gray-900 font-medium">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Equipment</h4>
              <p className="text-gray-900 font-medium">{entry.equipment || '맨눈 관측'}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</h4>
              <p className="text-gray-900 font-medium">{entry.location}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target</h4>
              <p className="text-gray-900 font-medium">{entry.target}</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default JournalDetail;