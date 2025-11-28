import React from 'react';
import { JournalEntry, UserProfile } from '../types';
import { ArrowLeft, Share2, Calendar, MapPin, Telescope, Users, Clock, Trash2, Edit } from 'lucide-react';

interface JournalDetailProps {
  entry: JournalEntry;
  currentUser: UserProfile | null;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ entry, currentUser, onBack, onEdit, onDelete }) => {
  const isOwner = currentUser?.uid === entry.userId;

  const handleShare = () => {
    const url = window.location.href;
    const text = `Starlight Journal: ${entry.title} - ${entry.observers}`;
    
    if (navigator.share) {
      navigator.share({
        title: entry.title,
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} - ${url}`);
      alert('링크가 복사되었습니다!');
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 관측 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      if (entry.id) onDelete(entry.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto scrollbar-hide animate-fade-in">
      {/* Full Screen Background Image */}
      <div className="fixed inset-0 z-0">
        {entry.imageUrl ? (
          <div 
            className="w-full h-full bg-cover bg-center opacity-60 scale-105"
            style={{ backgroundImage: `url(${entry.imageUrl})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-space-900 via-purple-900/20 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
      </div>

      {/* Navigation & Actions */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10 group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex gap-3 pointer-events-auto">
          {isOwner && (
            <>
              <button 
                onClick={() => onEdit(entry)}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-space-accent hover:text-space-900 transition-all border border-white/10"
                title="수정"
              >
                <Edit size={22} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10"
                title="삭제"
              >
                <Trash2 size={22} />
              </button>
            </>
          )}
          <button 
            onClick={handleShare}
            className="p-3 bg-space-accent/90 backdrop-blur-md rounded-full text-space-900 hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            title="공유"
          >
            <Share2 size={22} />
          </button>
        </div>
      </div>

      {/* Content Scroll Wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Spacer for Parallax Effect */}
        <div className="h-[60vh] md:h-[70vh] flex flex-col justify-end p-6 md:p-12 pb-16">
          <div className="max-w-5xl mx-auto w-full space-y-4">
            <div className="flex flex-wrap items-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <span className="px-3 py-1 bg-space-accent text-space-900 text-xs font-bold uppercase tracking-[0.2em]">
                {entry.target || 'Deep Space'}
              </span>
              <span className="flex items-center gap-2 text-white/80 text-sm font-serif italic">
                <Calendar size={14} /> {entry.date}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-white leading-[0.9] drop-shadow-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {entry.title}
            </h1>
            
            <div className="flex items-center gap-2 text-gray-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
               <span className="h-[1px] w-10 bg-space-accent inline-block"></span>
               <span className="font-serif italic text-lg">by {entry.observers}</span>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="bg-space-900/90 backdrop-blur-xl border-t border-white/10 min-h-[50vh]">
          <div className="max-w-5xl mx-auto px-6 py-16 md:px-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Text */}
            <div className="lg:col-span-8">
               <p className="font-serif text-lg md:text-xl text-gray-300 leading-[2.0] text-justify whitespace-pre-wrap first-letter:text-6xl first-letter:font-display first-letter:text-space-accent first-letter:mr-3 first-letter:float-left first-letter:mt-[-10px]">
                 {entry.description}
               </p>
            </div>

            {/* Sidebar / Metadata */}
            <div className="lg:col-span-4 space-y-8">
              <div className="p-6 border border-white/10 rounded-xl bg-white/5">
                <h3 className="font-display text-xl text-white mb-6 border-b border-white/10 pb-2">Mission Data</h3>
                
                <ul className="space-y-6">
                  <li className="group">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-space-accent transition-colors">
                      <MapPin size={12} /> Location
                    </span>
                    <span className="text-white font-serif text-lg">{entry.location}</span>
                  </li>
                  
                  <li className="group">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-space-accent transition-colors">
                      <Telescope size={12} /> Equipment
                    </span>
                    <span className="text-white font-serif text-lg">{entry.equipment || 'Naked Eye'}</span>
                  </li>

                  <li className="group">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-space-accent transition-colors">
                      <Users size={12} /> Observers
                    </span>
                    <span className="text-white font-serif text-lg">{entry.observers}</span>
                  </li>

                   <li className="group">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-space-accent transition-colors">
                      <Clock size={12} /> Logged At
                    </span>
                    <span className="text-white font-serif text-base">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Footer Decoration */}
          <div className="text-center pb-20 opacity-30">
             <div className="font-display text-4xl text-space-accent">Starlight Journal</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalDetail;
