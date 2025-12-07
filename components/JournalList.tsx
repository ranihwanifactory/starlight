import React, { useState } from 'react';
import { JournalEntry, UserProfile, Comment } from '../types';
import { Telescope, Heart, MessageCircle, MapPin } from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
  currentUser: UserProfile | null;
}

const JournalList: React.FC<JournalListProps> = ({ entries, onSelect, currentUser }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
        <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4 bg-white">
           <Telescope size={40} className="opacity-50" />
        </div>
        <h3 className="text-xl font-display text-gray-900 mb-2">게시물 없음</h3>
        <p className="font-serif text-sm">첫 번째 우주 관측 기록을 남겨보세요.</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* Grid Container */}
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-0.5 md:gap-6 max-w-7xl mx-auto">
        {entries.map((entry) => {
          const likesCount = entry.likes?.length || 0;
          const commentsCount = entry.comments?.length || 0;

          return (
            <div 
              key={entry.id}
              onClick={() => onSelect(entry)}
              className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-100 md:rounded-sm shadow-sm"
            >
              {entry.imageUrl ? (
                <img 
                  src={entry.imageUrl} 
                  alt={entry.title} 
                  className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center">
                  <Telescope size={32} className="mb-2 opacity-50" />
                  <span className="text-[10px] md:text-xs font-bold truncate w-full px-2 text-gray-500">{entry.title}</span>
                </div>
              )}

              {/* Desktop Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Heart size={20} fill="white" />
                  <span>{likesCount}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-bold">
                  <MessageCircle size={20} fill="white" />
                  <span>{commentsCount}</span>
                </div>
              </div>

              {/* Mobile Gradient Overlay (Always visible for readability, or subtle) */}
              <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                 <p className="text-white text-[10px] font-bold truncate">{entry.title}</p>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JournalList;