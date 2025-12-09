
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Star, Moon, Sun, Info } from 'lucide-react';
import { astronomicalEvents2025 } from '../data/astronomicalEvents';
import { AstronomicalEvent } from '../types';

interface CalendarProps {
  onBack: () => void;
}

const AstronomicalCalendar: React.FC<CalendarProps> = ({ onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)); // Start at Jan 2025
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: string, events: AstronomicalEvent[] } | null>(null);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = astronomicalEvents2025.filter(e => e.date === dateStr);
    
    if (events.length > 0) {
      setSelectedDateEvents({ date: dateStr, events });
    }
  };

  const renderDays = () => {
    const days = [];
    // Padding for empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 md:h-32 border border-gray-100 bg-gray-50/50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events = astronomicalEvents2025.filter(e => e.date === dateStr);
      const hasEvents = events.length > 0;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div 
          key={day} 
          onClick={() => hasEvents && handleDateClick(day)}
          className={`h-20 md:h-32 border border-gray-100 relative p-2 transition-all ${
            hasEvents 
              ? 'cursor-pointer hover:bg-blue-50 bg-white' 
              : 'bg-white text-gray-400'
          } ${isToday ? 'bg-blue-50/30' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold ${isToday ? 'bg-space-accent text-white w-6 h-6 rounded-full flex items-center justify-center -ml-1 -mt-1' : ''}`}>
              {day}
            </span>
          </div>

          {hasEvents && (
            <div className="mt-1 space-y-1">
              {events.map((event, idx) => (
                <div key={idx} className="hidden md:flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 truncate">
                   {getEventIcon(event.type)}
                   <span className="truncate font-medium">{event.title}</span>
                </div>
              ))}
              {/* Mobile Dot Indicator */}
              <div className="md:hidden flex gap-1 mt-2 justify-center">
                 {events.map((e, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.type)}`} />
                 ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
        case 'meteor': return <Star size={10} className="text-yellow-500" />;
        case 'planet': return <div className="w-2 h-2 rounded-full bg-orange-400" />;
        case 'moon': 
        case 'eclipse': return <Moon size={10} className="text-gray-500" />;
        default: return <Info size={10} className="text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
      switch (type) {
        case 'meteor': return 'bg-yellow-400';
        case 'planet': return 'bg-orange-400';
        case 'eclipse': return 'bg-red-400';
        default: return 'bg-blue-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-32">
       {/* Header */}
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-500">
                <ChevronLeft />
             </button>
             <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
               <CalendarIcon className="text-space-accent" />
               천문 달력
             </h2>
          </div>
          
          <div className="flex items-center gap-4 bg-white shadow-sm border border-gray-200 rounded-full px-2 py-1 md:px-4 md:py-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-lg min-w-[100px] text-center">
                {year}년 {monthNames[month]}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <ChevronRight size={20} />
            </button>
          </div>
       </div>

       {/* Calendar Grid */}
       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
             {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={day} className={`py-3 text-center text-sm font-bold ${i === 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {day}
                </div>
             ))}
          </div>
          
          {/* Days */}
          <div className="grid grid-cols-7">
             {renderDays()}
          </div>
       </div>

       {/* Legend */}
       <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500 justify-end">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> 유성우</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> 행성 현상</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> 월식/일식</div>
       </div>

       {/* Event Detail Modal */}
       {selectedDateEvents && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDateEvents(null)}>
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-space-800 to-space-900 p-6 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Star size={100} />
                   </div>
                   <button onClick={() => setSelectedDateEvents(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                      <X size={24} />
                   </button>
                   <h3 className="text-2xl font-display font-bold mb-1">
                      {new Date(selectedDateEvents.date).toLocaleDateString()}
                   </h3>
                   <p className="text-space-accent text-sm font-bold">천체 관측 예보</p>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                   {selectedDateEvents.events.map((event, idx) => (
                      <div key={idx} className="mb-6 last:mb-0 border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                         <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${getEventColor(event.type)}`}>
                                {event.type === 'meteor' ? 'Meteor Shower' : event.type.toUpperCase()}
                            </span>
                            {event.time && <span className="text-xs text-gray-500 flex items-center gap-1"><ClockIcon size={12} /> {event.time}</span>}
                         </div>
                         <h4 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h4>
                         <p className="text-gray-600 leading-relaxed text-sm font-serif">
                            {event.description}
                         </p>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

// Helper for detail modal
const ClockIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default AstronomicalCalendar;
