
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Star, Moon, Info, Plus, Clock, User, Save, Trash2, Edit } from 'lucide-react';
import { astronomicalEvents2025 } from '../data/astronomicalEvents';
import { AstronomicalEvent, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface CalendarProps {
  onBack: () => void;
  currentUser: UserProfile | null;
  onLoginRequired: () => void;
}

const AstronomicalCalendar: React.FC<CalendarProps> = ({ onBack, currentUser, onLoginRequired }) => {
  // 1. Initialize with current date instead of fixed 2025 date
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: string, events: AstronomicalEvent[] } | null>(null);
  
  // Custom Events State
  const [customEvents, setCustomEvents] = useState<AstronomicalEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit/Add State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<AstronomicalEvent>>({
      type: 'user',
      date: new Date().toISOString().split('T')[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Custom Events from Firestore
  useEffect(() => {
    // NOTE: Firestore Security Rules (firestore.rules) must allow public read for 'calendar_events'
    // match /calendar_events/{eventId} { allow read: if true; }

    const q = query(collection(db, 'calendar_events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AstronomicalEvent));
        setCustomEvents(events);
    }, (error) => {
        console.error("Error fetching calendar events:", error);
        if (error.code === 'permission-denied') {
            console.warn("캘린더 접근 권한이 없습니다. firestore.rules를 확인해주세요.");
        }
    });
    return unsubscribe;
  }, []);

  // Merge static and custom events
  const allEvents = useMemo(() => {
      return [...astronomicalEvents2025, ...customEvents];
  }, [customEvents]);

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
    const events = allEvents.filter(e => e.date === dateStr);
    
    if (events.length > 0) {
      setSelectedDateEvents({ date: dateStr, events });
    }
  };

  // Open modal for CREATING a new event
  const openAddModal = () => {
      if (!currentUser) {
          onLoginRequired();
          return;
      }
      setEditingEventId(null); // Reset editing state
      setNewEvent({
          type: 'user',
          date: new Date().toISOString().split('T')[0],
          title: '',
          description: '',
          time: ''
      });
      setIsAddModalOpen(true);
  };

  // Open modal for EDITING an existing event
  const openEditModal = (event: AstronomicalEvent) => {
      if (!currentUser) return;
      setEditingEventId(event.id || null);
      setNewEvent({
          ...event
      });
      setIsAddModalOpen(true);
      setSelectedDateEvents(null); // Close detail view to avoid conflict
  };

  const handleDeleteEvent = async (eventId: string) => {
      if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return;
      
      try {
          await deleteDoc(doc(db, "calendar_events", eventId));
          setSelectedDateEvents(null); // Close detail view
      } catch (error) {
          console.error("Error deleting event:", error);
          alert("삭제 중 오류가 발생했습니다.");
      }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !newEvent.title || !newEvent.date || !newEvent.description) return;

      setIsSaving(true);
      try {
          if (editingEventId) {
              // Update existing event
              const eventRef = doc(db, 'calendar_events', editingEventId);
              await updateDoc(eventRef, {
                  title: newEvent.title,
                  date: newEvent.date,
                  time: newEvent.time,
                  type: newEvent.type,
                  description: newEvent.description,
                  // Don't update userId or createdAt
              });
          } else {
              // Create new event
              await addDoc(collection(db, 'calendar_events'), {
                  ...newEvent,
                  userId: currentUser.uid,
                  authorName: currentUser.displayName || '익명의 천문학자',
                  createdAt: Date.now()
              });
          }
          setIsAddModalOpen(false);
      } catch (error) {
          console.error("Error saving event:", error);
          alert("일정을 저장하는데 실패했습니다.");
      } finally {
          setIsSaving(false);
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
      const events = allEvents.filter(e => e.date === dateStr);
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
                <div key={idx} className={`hidden md:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border truncate ${
                    event.type === 'user' 
                    ? 'bg-purple-50 text-purple-700 border-purple-100' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                   {getEventIcon(event.type)}
                   <span className="truncate font-medium">{event.title}</span>
                </div>
              ))}
              {/* Mobile Dot Indicator */}
              <div className="md:hidden flex gap-1 mt-2 justify-center flex-wrap">
                 {events.slice(0, 4).map((e, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e.type)}`} />
                 ))}
                 {events.length > 4 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
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
        case 'user': return <User size={10} className="text-purple-500" />;
        default: return <Info size={10} className="text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
      switch (type) {
        case 'meteor': return 'bg-yellow-400';
        case 'planet': return 'bg-orange-400';
        case 'eclipse': return 'bg-red-400';
        case 'user': return 'bg-purple-400';
        default: return 'bg-blue-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-32">
       {/* Header */}
       <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <div className="flex items-center gap-4">
                <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-500">
                    <ChevronLeft />
                </button>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <CalendarIcon className="text-space-accent" />
                천문 달력
                </h2>
             </div>
             
             {/* Add Event Button (Mobile/Desktop) */}
             <button 
                onClick={openAddModal}
                className="flex items-center gap-1 bg-space-accent hover:bg-cyan-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md transition-all"
             >
                 <Plus size={16} />
                 <span className="hidden md:inline">일정 추가</span>
                 <span className="md:hidden">추가</span>
             </button>
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
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400"></div> 유저 제보</div>
       </div>

       {/* Add/Edit Event Modal */}
       {isAddModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                   <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                       <h3 className="font-display font-bold text-lg text-gray-900">
                           {editingEventId ? '천문 일정 수정' : '천문 일정 추가'}
                       </h3>
                       <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                   </div>
                   <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">제목</label>
                           <input 
                               type="text" 
                               required
                               placeholder="예: 우리 동네 스타파티" 
                               value={newEvent.title}
                               onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                               className="w-full border border-gray-300 rounded-lg p-2 focus:border-space-accent focus:outline-none"
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">날짜</label>
                               <input 
                                   type="date" 
                                   required
                                   value={newEvent.date}
                                   onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                   className="w-full border border-gray-300 rounded-lg p-2 focus:border-space-accent focus:outline-none"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1">시간 (선택)</label>
                               <input 
                                   type="text" 
                                   placeholder="예: 22:00" 
                                   value={newEvent.time}
                                   onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                   className="w-full border border-gray-300 rounded-lg p-2 focus:border-space-accent focus:outline-none"
                               />
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">유형</label>
                           <select 
                               value={newEvent.type}
                               onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                               className="w-full border border-gray-300 rounded-lg p-2 focus:border-space-accent focus:outline-none bg-white"
                           >
                               <option value="user">일반 관측/모임 (유저)</option>
                               <option value="meteor">유성우</option>
                               <option value="planet">행성 현상</option>
                               <option value="eclipse">월식/일식</option>
                               <option value="other">기타</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">설명</label>
                           <textarea 
                               required
                               rows={3}
                               placeholder="이벤트에 대한 자세한 설명을 적어주세요."
                               value={newEvent.description}
                               onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                               className="w-full border border-gray-300 rounded-lg p-2 focus:border-space-accent focus:outline-none resize-none"
                           />
                       </div>
                       <button 
                           type="submit" 
                           disabled={isSaving}
                           className="w-full bg-space-accent text-white font-bold py-3 rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
                       >
                           <Save size={18} />
                           {isSaving ? '저장 중...' : (editingEventId ? '수정 완료' : '일정 저장 및 공유')}
                       </button>
                   </form>
               </div>
           </div>
       )}

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
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${getEventColor(event.type)}`}>
                                    {event.type === 'meteor' ? 'Meteor Shower' : event.type.toUpperCase()}
                                </span>
                                {event.time && <span className="text-xs text-gray-500 flex items-center gap-1"><ClockIcon size={12} /> {event.time}</span>}
                             </div>
                             
                             {/* Actions for User's Own Events */}
                             {currentUser && event.userId === currentUser.uid && event.id && (
                                 <div className="flex gap-1">
                                     <button 
                                        onClick={() => openEditModal(event)}
                                        className="p-1 text-gray-400 hover:text-space-accent hover:bg-gray-100 rounded-full transition-colors"
                                        title="수정"
                                     >
                                         <Edit size={14} />
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteEvent(event.id!)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="삭제"
                                     >
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             )}
                         </div>

                         <h4 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h4>
                         <p className="text-gray-600 leading-relaxed text-sm font-serif">
                            {event.description}
                         </p>
                         {event.authorName && (
                             <p className="text-right text-xs text-gray-400 mt-2 flex justify-end items-center gap-1">
                                 <User size={10} /> 제보: {event.authorName}
                             </p>
                         )}
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
