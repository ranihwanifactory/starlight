import React, { useState } from 'react';
import { JournalEntry, UserProfile, Comment } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { MapPin, MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Telescope, UserPlus, Check } from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
  currentUser: UserProfile | null;
}

const JournalList: React.FC<JournalListProps> = ({ entries, onSelect, currentUser }) => {
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

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

  const handleLike = async (entry: JournalEntry) => {
    if (!currentUser || !entry.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    const entryRef = doc(db, 'journals', entry.id);
    const isLiked = entry.likes?.includes(currentUser.uid);

    try {
      if (isLiked) {
        await updateDoc(entryRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(entryRef, {
          likes: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
       alert("로그인이 필요합니다.");
       return;
    }
    
    // In a real app, you'd update both the current user's 'following' array 
    // and the target user's 'followers' array.
    try {
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const isFollowing = currentUser.following?.includes(targetUserId);
        
        if (isFollowing) {
            await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
            // Ideally update target user's followers too
        } else {
            await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
            // Ideally update target user's followers too
        }
    } catch (error) {
        console.error("Follow error", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent, entry: JournalEntry) => {
    e.preventDefault();
    if (!currentUser || !entry.id) return;
    
    const text = commentText[entry.id];
    if (!text?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: currentUser.displayName || '익명',
      text: text,
      createdAt: Date.now()
    };

    try {
      const entryRef = doc(db, 'journals', entry.id);
      await updateDoc(entryRef, {
        comments: arrayUnion(newComment)
      });
      setCommentText(prev => ({ ...prev, [entry.id!]: '' }));
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div className="max-w-[470px] mx-auto pb-20">
      {entries.map((entry, index) => {
        const isLiked = currentUser && entry.likes?.includes(currentUser.uid);
        const isFollowing = currentUser && currentUser.following?.includes(entry.userId);
        const isSelf = currentUser && currentUser.uid === entry.userId;

        return (
          <article 
            key={entry.id || index}
            className="bg-space-900 md:bg-black md:border md:border-white/10 md:rounded-lg mb-6 md:mb-8 overflow-hidden flex flex-col"
          >
            {/* Feed Header */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-space-accent to-purple-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                     <UserPlus size={14} className="text-white" /> 
                     {/* In a real app, fetch user avatar by entry.userId */}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white leading-none">{entry.authorName || entry.observers}</span>
                    {currentUser && !isSelf && (
                      <button 
                        onClick={() => handleFollow(entry.userId)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${isFollowing ? 'bg-gray-800 text-gray-400' : 'bg-space-accent text-black'}`}
                      >
                        {isFollowing ? '팔로잉' : '팔로우'}
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 leading-none flex items-center gap-1 mt-1">
                    {entry.location && <>{entry.location}</>}
                  </span>
                </div>
              </div>
              <button className="text-white hover:text-space-accent transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Equipment Tag (New Feature) */}
            {entry.equipment && (
              <div className="px-3 pb-2 text-[11px] text-space-accent/80 flex items-center gap-1 font-mono">
                <Telescope size={10} />
                <span>{entry.equipment}</span>
              </div>
            )}

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
            </div>

            {/* Feed Actions */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button 
                    className={`${isLiked ? 'text-red-500' : 'text-white hover:text-gray-400'} transition-colors`} 
                    onClick={() => handleLike(entry)}
                  >
                    <Heart size={26} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <button 
                    className="text-white hover:text-space-accent transition-colors" 
                    onClick={() => setShowComments(prev => ({...prev, [entry.id!]: !prev[entry.id!]}))}
                  >
                    <MessageCircle size={26} />
                  </button>
                  <button className="text-white hover:text-space-accent transition-colors" onClick={() => onSelect(entry)}>
                    <Send size={26} />
                  </button>
                </div>
                <button className="text-white hover:text-yellow-400 transition-colors">
                  <Bookmark size={26} />
                </button>
              </div>

              {/* Likes Count */}
              <div className="mb-2">
                <span className="text-sm font-bold text-white">좋아요 {entry.likes?.length || 0}개</span>
              </div>

              {/* Caption */}
              <div className="space-y-1 mb-2">
                <div className="text-sm text-gray-100 leading-relaxed">
                  <span className="font-bold mr-2 text-white">{entry.authorName}</span>
                  {entry.description}
                </div>
                <div className="text-sm text-space-accent cursor-pointer mt-1" onClick={() => onSelect(entry)}>
                   <span className="font-bold mr-2">🔭 관측 대상:</span> #{entry.target?.replace(/\s+/g, '') || '우주'}
                </div>
              </div>

              {/* Comments Section */}
              <div className="text-sm text-gray-400 cursor-pointer mb-2" onClick={() => setShowComments(prev => ({...prev, [entry.id!]: !prev[entry.id!]}))}>
                {entry.comments && entry.comments.length > 0 
                  ? `댓글 ${entry.comments.length}개 모두 보기` 
                  : '댓글 없음 (첫 댓글을 남겨보세요)'}
              </div>
              
              {showComments[entry.id!] && entry.comments && (
                <div className="mb-3 space-y-1 animate-fade-in max-h-32 overflow-y-auto">
                  {entry.comments.map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <span className="font-bold text-white mr-2">{comment.userName}</span>
                      <span className="text-gray-300">{comment.text}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">
                {entry.date}
              </p>

              {/* Add Comment Input */}
              {currentUser && (
                <form onSubmit={(e) => handleSubmitComment(e, entry)} className="border-t border-white/10 pt-3 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="댓글 달기..."
                    className="bg-transparent text-sm w-full text-white placeholder-gray-500 focus:outline-none"
                    value={commentText[entry.id!] || ''}
                    onChange={(e) => setCommentText({...commentText, [entry.id!]: e.target.value})}
                  />
                  <button 
                    type="submit" 
                    disabled={!commentText[entry.id!]?.trim()}
                    className="text-space-accent text-sm font-bold disabled:opacity-30"
                  >
                    게시
                  </button>
                </form>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default JournalList;