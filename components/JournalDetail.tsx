import React from 'react';
import { JournalEntry } from '../types';
import { ArrowLeft, Share2, Calendar, MapPin, Telescope, Users, Clock } from 'lucide-react';

interface JournalDetailProps {
  entry: JournalEntry;
  onBack: () => void;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ entry, onBack }) => {
  const handleShare = () => {
    // Basic sharing simulation
    const url = window.location.href;
    const text = `이 천체 관측 기록을 확인해보세요: ${entry.title} - ${entry.observers} 작성`;
    
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

  return (
    <article className="max-w-4xl mx-auto bg-space-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in pb-10">
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] w-full">
         {entry.imageUrl ? (
              <img 
                src={entry.imageUrl} 
                alt={entry.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-gray-800 to-space-800 flex items-center justify-center">
                 <Telescope size={100} className="text-white/10" />
              </div>
            )}
         <div className="absolute inset-0 bg-gradient-to-t from-space-800 via-space-800/20 to-transparent"></div>
         
         <button 
           onClick={onBack}
           className="absolute top-6 left-6 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
         >
           <ArrowLeft size={24} />
         </button>

         <button 
           onClick={handleShare}
           className="absolute top-6 right-6 p-2 bg-space-accent/80 backdrop-blur-md rounded-full text-space-900 hover:bg-white hover:text-black transition-all"
           title="공유하기"
         >
           <Share2 size={24} />
         </button>

         <div className="absolute bottom-8 left-6 md:left-12 right-6">
            <div className="flex gap-3 mb-4 flex-wrap">
               <span className="px-3 py-1 bg-space-accent text-space-900 text-xs font-bold uppercase tracking-wider rounded">
                 {entry.target}
               </span>
               <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1">
                 <Calendar size={12} /> {entry.date}
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display text-white leading-tight drop-shadow-lg">
              {entry.title}
            </h1>
         </div>
      </div>

      <div className="px-6 md:px-12 mt-8 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <h2 className="text-space-accent font-display text-xl mb-4 border-b border-white/10 pb-2">관측 일지</h2>
          <p className="text-gray-300 font-serif text-lg leading-loose whitespace-pre-wrap first-letter:text-5xl first-letter:font-display first-letter:text-space-accent first-letter:mr-2 first-letter:float-left">
            {entry.description}
          </p>
        </div>

        <div className="md:col-span-1 space-y-6">
           <div className="bg-space-900/50 p-6 rounded-xl border border-white/5">
              <h3 className="text-white font-sans font-bold uppercase tracking-widest text-xs mb-4 text-gray-500">관측 미션 상세</h3>
              
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                    <MapPin className="text-space-accent shrink-0 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase">장소</span>
                      <span className="text-white font-serif">{entry.location}</span>
                    </div>
                 </li>
                 <li className="flex items-start gap-3">
                    <Telescope className="text-space-accent shrink-0 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase">장비</span>
                      <span className="text-white font-serif">{entry.equipment || '맨눈 관측'}</span>
                    </div>
                 </li>
                 <li className="flex items-start gap-3">
                    <Users className="text-space-accent shrink-0 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase">팀</span>
                      <span className="text-white font-serif">{entry.observers}</span>
                    </div>
                 </li>
                  <li className="flex items-start gap-3">
                    <Clock className="text-space-accent shrink-0 mt-1" size={18} />
                    <div>
                      <span className="block text-xs text-gray-500 uppercase">작성일</span>
                      <span className="text-white font-serif">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </article>
  );
};

export default JournalDetail;