import React from 'react';
import { JournalEntry } from '../types';
import { Calendar, MapPin, Telescope } from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
}

const JournalList: React.FC<JournalListProps> = ({ entries, onSelect }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Telescope size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-2xl font-display">아직 작성된 관측 일지가 없습니다.</p>
        <p className="font-serif italic mt-2">"하늘이 우리를 부르고 있습니다."</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {entries.map((entry, index) => (
        <article 
          key={entry.id || index}
          onClick={() => onSelect(entry)}
          className="group relative bg-space-800 rounded-xl overflow-hidden cursor-pointer hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 transform hover:-translate-y-1 border border-white/5"
        >
          {/* Image Container */}
          <div className="aspect-[4/3] overflow-hidden bg-space-900 relative">
            {entry.imageUrl ? (
              <img 
                src={entry.imageUrl} 
                alt={entry.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-space-900">
                <Telescope className="text-gray-700" size={48} />
              </div>
            )}
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-transparent to-transparent opacity-80" />
            
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-space-accent border border-space-accent/30">
              {entry.date}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 relative">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-sans uppercase tracking-wider">
               <span className="flex items-center gap-1"><MapPin size={10} /> {entry.location || '장소 미상'}</span>
               <span>•</span>
               <span className="text-space-accent">{entry.target}</span>
            </div>

            <h3 className="text-2xl font-display text-white mb-3 group-hover:text-space-accent transition-colors leading-tight">
              {entry.title}
            </h3>

            <p className="text-gray-400 font-serif text-sm line-clamp-3 leading-relaxed">
              {entry.description}
            </p>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-gray-500">작성자: {entry.observers}</span>
              <span className="text-xs text-space-accent font-bold group-hover:underline">일지 읽기 &rarr;</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default JournalList;