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
      // Try to share with file if image exists and API supports it
      if (entry.imageUrl && navigator.share) {
        try {
          // Fetch the image to create a File object with CORS mode
          const response = await fetch(entry.imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          
          // Determine file extension and type
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
          } else {
            console.warn("Navigator.canShare returned false for files");
          }
        } catch (fileError) {
          console.warn("File sharing failed or not supported, falling back to text/url", fileError);
        }
      }

      // Fallback: Standard Share
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback: Clipboard
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
        alert('링크가 복사되었습니다! 친구들에게 공유해보세요.');
      }

    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 기록을 삭제할까요? 삭제된 기록은 되돌릴 수 없어요.')) {
      if (entry.id) onDelete(entry.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D17] overflow-y-auto scrollbar-hide animate-fade-in font-sans overscroll-contain">
      {/* Full Screen Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {entry.imageUrl ? (
          <div 
            className="w-full h-full bg-cover bg-center opacity-40 scale-105 blur-sm"
            style={{ backgroundImage: `url(${entry.imageUrl})` }}
          />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-space-700 via-space-900 to-black" />
        )}
        {/* Holographic Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-space-900/60 to-[#0B0D17]"></div>
      </div>

      {/* Navigation & Actions - Added safe area padding */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pt-safe flex justify-between items-start pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-space-accent text-white hover:text-space-accent transition-all group clip-path-slanted mt-2"
          style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex gap-3 mt-2 pointer-events-auto">
          {isOwner && (
            <>
              <button 
                onClick={() => onEdit(entry)}
                className="p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-space-accent text-white hover:text-space-accent transition-all rounded-sm"
                title="기록 수정"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-3 bg-black/40 backdrop-blur-md border border-white/10 hover:border-red-500 text-red-400 hover:text-red-500 transition-all rounded-sm"
                title="기록 삭제"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
          <button 
            onClick={handleShare}
            className="group flex items-center gap-2 px-4 md:px-6 py-3 bg-space-accent/10 backdrop-blur-md border border-space-accent text-space-accent hover:bg-space-accent hover:text-black transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] rounded-sm"
            title="기록 공유"
          >
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold tracking-wider text-xs md:text-sm">공유하기</span>
          </button>
        </div>
      </div>

      {/* Content Scroll Wrapper */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {/* Spacer for Parallax Effect - Adjusted height for mobile */}
        <div className="h-[45vh] md:h-[65vh] flex flex-col justify-end p-6 md:p-12 pb-8 md:pb-16">
          <div className="max-w-6xl mx-auto w-full space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 px-3 py-1 bg-space-accent/10 border border-space-accent/50 text-space-accent text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
                <Telescope size={12} />
                {entry.target || '대상 미상'}
              </div>
              <div className="flex items-center gap-2 text-space-accent/80 text-xs md:text-sm font-display tracking-widest">
                <Calendar size={12} /> {entry.date}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-display text-white leading-[0.9] drop-shadow-[0_0_30px_rgba(0,212,255,0.3)] animate-slide-up uppercase break-keep" style={{ animationDelay: '0.2s' }}>
              {entry.title}
            </h1>
            
            <div className="flex items-center gap-4 text-gray-300 animate-slide-up mt-4" style={{ animationDelay: '0.3s' }}>
               <div className="h-[2px] w-8 md:w-12 bg-space-accent shadow-[0_0_10px_#00D4FF]"></div>
               <span className="font-sans text-sm md:text-lg tracking-widest text-gray-400">작성자: <span className="text-white font-bold">{entry.observers}</span></span>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="bg-[#0B0D17]/95 backdrop-blur-xl border-t border-space-accent/20 min-h-[60vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-safe">
          <div className="max-w-6xl mx-auto px-6 py-10 md:px-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
            
            {/* Main Text & Image */}
            <div className="lg:col-span-8 order-2 lg:order-1">
               
               {/* Full Width Image Display */}
               {entry.imageUrl && (
                <div className="mb-8 md:mb-12 relative group animate-fade-in">
                  {/* Decorative Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-space-accent via-purple-500 to-space-accent rounded-lg opacity-20 group-hover:opacity-40 blur-lg transition duration-1000"></div>
                  
                  {/* Image Container */}
                  <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black shadow-2xl">
                    <img 
                      src={entry.imageUrl} 
                      alt={entry.title} 
                      className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-[1.02]"
                    />
                    
                    {/* Tech Overlays - Corners */}
                    <div className="absolute top-4 left-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-space-accent/70 rounded-tl-sm"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-space-accent/70 rounded-tr-sm"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-space-accent/70 rounded-bl-sm"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-space-accent/70 rounded-br-sm"></div>
                  </div>

                  {/* Caption */}
                  <div className="mt-3 flex justify-between items-center text-[10px] md:text-xs text-space-accent/60 font-display tracking-[0.2em] uppercase">
                     <span className="flex items-center gap-2"><ImageIcon size={12} /> 그림 1.0 // 시각 관측 자료</span>
                     <span>{entry.target || '심우주 천체'}</span>
                  </div>
                </div>
               )}

               <p className="font-sans text-base md:text-xl text-gray-300 leading-[2.0] text-justify whitespace-pre-wrap font-light tracking-wide">
                 <span className="text-4xl md:text-5xl font-display text-space-accent float-left mr-3 md:mr-4 mt-[-4px] md:mt-[-8px] drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
                   {entry.description.charAt(0)}
                 </span>
                 {entry.description.slice(1)}
               </p>
            </div>

            {/* Sidebar / Metadata */}
            <div className="lg:col-span-4 space-y-6 md:space-y-8 order-1 lg:order-2">
              <div className="p-6 md:p-8 border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-space-accent to-transparent opacity-50"></div>
                
                <h3 className="font-display text-lg md:text-xl text-white mb-6 md:mb-8 flex items-center gap-2">
                  <span className="text-space-accent">///</span> 탐사 데이터
                </h3>
                
                <ul className="space-y-6 md:space-y-8">
                  <li className="relative pl-4 border-l-2 border-white/10 hover:border-space-accent transition-colors">
                    <span className="block text-[10px] font-bold text-space-accent uppercase tracking-[0.2em] mb-1">
                      관측 장소
                    </span>
                    <span className="text-white font-display text-base md:text-lg tracking-wide break-words">{entry.location}</span>
                  </li>
                  
                  <li className="relative pl-4 border-l-2 border-white/10 hover:border-space-accent transition-colors">
                    <span className="block text-[10px] font-bold text-space-accent uppercase tracking-[0.2em] mb-1">
                      사용 장비
                    </span>
                    <span className="text-white font-display text-base md:text-lg tracking-wide break-words">{entry.equipment || '맨눈 관측'}</span>
                  </li>

                  <li className="relative pl-4 border-l-2 border-white/10 hover:border-space-accent transition-colors">
                    <span className="block text-[10px] font-bold text-space-accent uppercase tracking-[0.2em] mb-1">
                      함께한 대원
                    </span>
                    <span className="text-white font-display text-base md:text-lg tracking-wide break-words">{entry.observers}</span>
                  </li>

                   <li className="relative pl-4 border-l-2 border-white/10 hover:border-space-accent transition-colors">
                    <span className="block text-[10px] font-bold text-space-accent uppercase tracking-[0.2em] mb-1">
                      기록 시간
                    </span>
                    <span className="text-white font-display text-base md:text-lg tracking-wide">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Footer Decoration */}
          <div className="flex justify-center items-center pb-20 pt-10 opacity-30 pointer-events-none">
             <div className="text-center">
                <div className="text-space-accent mb-2">✦ ✦ ✦</div>
                <div className="font-display text-xl md:text-3xl tracking-[0.5em] text-white uppercase">Starlight Journal</div>
                <div className="text-[10px] uppercase tracking-[1em] text-gray-500 mt-2">기록 끝</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalDetail;