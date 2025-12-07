import React from 'react';
import { JournalEntry } from '../types';
import { MapPin, MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Telescope, Star } from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
}

const JournalList: React.FC<JournalListProps> = ({ entries, onSelect }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
        <div className="w-24 h-24 rounded-full border-2 border-gray-700 flex items-center justify-center mb-4">
           <Telescope size={40} className="opacity-50" />
        </div>
        <h3 className="text-xl font-display text-white mb-2">게시물 없음</h3>
        <p className="font-serif text-sm">첫 번째 우주 관측 기록을 남겨보세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[470px] mx-auto pb-20">
      {entries.map((entry, index) => (
        <article 
          key={entry.id || index}
          className="bg-space-900 md:bg-black md:border md:border-white/10 md:rounded-lg mb-6 md:mb-8 overflow-hidden flex flex-col"
        >
          {/* Feed Header */}
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar Placeholder */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-space-accent to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                   <Telescope size={14} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-white leading-none mb-[2px]">{entry.observers}</span>
                <span className="text-[11px] text-gray-400 leading-none flex items-center gap-1">
                  {entry.location && <>{entry.location}</>}
                </span>
              </div>
            </div>
            <button className="text-white hover:text-space-accent transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Feed Image */}
          <div 
            className="w-full aspect-square bg-space-800 relative cursor-pointer group"
            onClick={() => onSelect(entry)}
          >
            {entry.imageUrl ? (
              <img 
                src={entry.imageUrl} 
                alt={entry.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-600">
                <Telescope size={48} className="mb-2 opacity-50" />
                <span className="text-xs tracking-widest uppercase">No Image</span>
              </div>
            )}
            
            {/* Hover overlay for Desktop */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
               <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">자세히 보기</span>
            </div>
          </div>

          {/* Feed Actions */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button className="text-white hover:text-red-500 transition-colors" onClick={() => onSelect(entry)}>
                  <Heart size={24} />
                </button>
                <button className="text-white hover:text-space-accent transition-colors" onClick={() => onSelect(entry)}>
                  <MessageCircle size={24} />
                </button>
                <button className="text-white hover:text-space-accent transition-colors" onClick={() => onSelect(entry)}>
                  <Send size={24} />
                </button>
              </div>
              <button className="text-white hover:text-yellow-400 transition-colors">
                <Bookmark size={24} />
              </button>
            </div>

            {/* Likes (Fake/Visual) */}
            <div className="mb-2">
              <span className="text-sm font-bold text-white">별 {Math.floor(Math.random() * 50) + 1}개</span>
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <div className="text-sm text-gray-100 leading-relaxed line-clamp-2">
                <span className="font-bold mr-2 text-white">{entry.observers}</span>
                {entry.description}
              </div>
              <div className="text-sm text-space-accent cursor-pointer mt-1" onClick={() => onSelect(entry)}>
                 <span className="font-bold mr-2">🔭 관측 대상:</span> #{entry.target?.replace(/\s+/g, '') || '우주'}
              </div>
              
              <button 
                onClick={() => onSelect(entry)}
                className="text-gray-500 text-sm mt-1 hover:text-gray-300"
              >
                댓글 모두 보기
              </button>
              
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-2">
                {entry.date}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default JournalList;