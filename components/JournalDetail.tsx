
import React, { useState, useEffect } from 'react';
import { JournalEntry, UserProfile, Comment } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ArrowLeft, Share2, Calendar, MapPin, Telescope, Users, Clock, Trash2, Edit, ExternalLink, ImageIcon, UserPlus, UserCheck, Heart, MessageCircle, Send, User, Sparkles, X, Check } from 'lucide-react';
import { getLocationInfo } from '../services/geminiService';

interface JournalDetailProps {
  entry: JournalEntry;
  currentUser: UserProfile | null;
  onBack: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onLoginRequired: () => void;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ entry, currentUser, onBack, onEdit, onDelete, onLoginRequired }) => {
  const isOwner = currentUser?.uid === entry.userId;
  const isFollowing = currentUser?.following?.includes(entry.userId);
  
  // Likes
  const likes = entry.likes || [];
  const isLiked = currentUser ? likes.includes(currentUser.uid) : false;
  
  // Comments
  const comments = entry.comments || [];
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Comment Editing State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // AI Location Info
  const [aiLocationInfo, setAiLocationInfo] = useState<{text: string, links: {title: string, uri: string}[]} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch AI Location info on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLocationInfo = async () => {
        if (!entry.location) return;
        setAiLoading(true);
        try {
            const lat = entry.coordinates?.lat;
            const lng = entry.coordinates?.lng;
            const info = await getLocationInfo(entry.location, lat, lng);
            if (isMounted) setAiLocationInfo(info);
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted) setAiLoading(false);
        }
    };
    fetchLocationInfo();
    return () => { isMounted = false; };
  }, [entry.location, entry.coordinates]);

  const handleShare = async () => {
    // Generate Deep Link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?entry=${entry.id}`;
    const shareTitle = `UJU: ${entry.title}`;
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

  const handleFollow = async () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', entry.userId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, { following: arrayRemove(entry.userId) });
        try {
           await updateDoc(targetUserRef, { followers: arrayRemove(currentUser.uid) });
        } catch (e) {
           console.warn("Could not update target user's follower count (permission denied?)", e);
        }
      } else {
        // Follow
        await updateDoc(currentUserRef, { following: arrayUnion(entry.userId) });
        try {
           await updateDoc(targetUserRef, { followers: arrayUnion(currentUser.uid) });
        } catch (e) {
           console.warn("Could not update target user's follower count (permission denied?)", e);
        }
      }
    } catch (error) {
      console.error("Follow error:", error);
      alert("팔로우 처리 중 오류가 발생했습니다.");
    }
  };

  const toggleLike = async () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    if (!entry.id) return;

    const entryRef = doc(db, 'journals', entry.id);
    try {
      if (isLiked) {
        await updateDoc(entryRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(entryRef, { likes: arrayUnion(currentUser.uid) });
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    if (!newComment.trim() || !entry.id) return;

    setCommentLoading(true);
    const commentData: Comment = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: currentUser.displayName || '익명의 대원',
      text: newComment,
      createdAt: Date.now()
    };

    try {
      const entryRef = doc(db, 'journals', entry.id);
      await updateDoc(entryRef, {
        comments: arrayUnion(commentData)
      });
      setNewComment('');
    } catch (error) {
      console.error("Comment error:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setCommentLoading(false);
    }
  };

  // --- Comment Edit/Delete Handlers ---

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const saveEditedComment = async (commentId: string) => {
    if (!entry.id || !editingText.trim()) return;

    // We must update the entire array to modify one item
    const updatedComments = comments.map(c => {
        if (c.id === commentId) {
            return { ...c, text: editingText };
        }
        return c;
    });

    try {
        await updateDoc(doc(db, 'journals', entry.id), {
            comments: updatedComments
        });
        setEditingCommentId(null);
        setEditingText('');
    } catch (e) {
        console.error("Error updating comment", e);
        alert("댓글 수정에 실패했습니다.");
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!entry.id || !window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    // We filter out the deleted item
    const updatedComments = comments.filter(c => c.id !== commentId);

    try {
        await updateDoc(doc(db, 'journals', entry.id), {
            comments: updatedComments
        });
    } catch (e) {
        console.error("Error deleting comment", e);
        alert("댓글 삭제에 실패했습니다.");
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
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 pb-32">
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

           <div className="flex items-center flex-wrap gap-4 text-gray-500 text-sm">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-space-accent to-purple-500 p-[1px]">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Users size={14} className="text-gray-900" />
                 </div>
               </div>
               <span className="font-bold text-gray-900">{entry.observers}</span>
             </div>
             
             {!isOwner && (
               <button 
                 onClick={handleFollow}
                 className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                   isFollowing 
                     ? 'bg-gray-100 text-gray-600 border border-gray-300' 
                     : 'bg-space-accent text-white hover:bg-cyan-500 shadow-md'
                 }`}
               >
                 {isFollowing ? (
                   <>
                     <UserCheck size={14} /> 팔로잉
                   </>
                 ) : (
                   <>
                     <UserPlus size={14} /> 팔로우
                   </>
                 )}
               </button>
             )}

             <span className="hidden md:inline text-gray-300">•</span>
             <span className="flex items-center gap-1">
               <MapPin size={14} /> {entry.location}
             </span>
           </div>
        </div>

        {/* Main Image */}
        {entry.imageUrl && (
          <div className="mb-6 rounded-xl overflow-hidden shadow-2xl bg-gray-100 border border-gray-100">
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

        {/* Social Actions (Like & Comment Counts) */}
        <div className="flex items-center gap-6 mb-10 py-3 border-y border-gray-100">
          <button 
            onClick={toggleLike}
            className={`flex items-center gap-2 font-bold transition-all ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-lg">{likes.length}</span>
            <span className="text-xs font-normal opacity-70">좋아요</span>
          </button>

          <div className="flex items-center gap-2 text-gray-500">
            <MessageCircle size={24} />
            <span className="text-lg font-bold">{comments.length}</span>
            <span className="text-xs font-normal opacity-70">댓글</span>
          </div>
        </div>

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
        <div className="bg-gray-50 rounded-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-100 mb-12">
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
        
        {/* Gemini Maps Grounding Section - Render only if we have data or are loading */}
        {(aiLoading || aiLocationInfo) && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-blue-100 mb-12 animate-fade-in">
               <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-space-accent" />
                  <h3 className="font-display font-bold text-lg text-gray-900">AI Location Insight</h3>
               </div>
               
               {aiLoading ? (
                   <div className="flex items-center gap-2 text-gray-500 text-sm">
                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-space-accent border-t-transparent"></div>
                       Gemini가 위치 정보를 분석하고 있습니다...
                   </div>
               ) : (
                   <>
                      <p className="text-gray-700 leading-relaxed text-sm mb-4">
                          {aiLocationInfo?.text}
                      </p>
                      {aiLocationInfo && aiLocationInfo.links.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                              {aiLocationInfo.links.map((link, idx) => (
                                  <a 
                                      key={idx} 
                                      href={link.uri} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors"
                                  >
                                      <MapPin size={12} />
                                      {link.title}
                                      <ExternalLink size={10} />
                                  </a>
                              ))}
                          </div>
                      )}
                   </>
               )}
          </div>
        )}

        {/* Comment Section */}
        <div className="border-t border-gray-200 pt-10">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
            댓글 <span className="text-space-accent">{comments.length}</span>
          </h3>

          {/* Comment Form */}
          <form onSubmit={submitComment} className="flex items-start gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onClick={() => !currentUser && onLoginRequired()}
                  readOnly={!currentUser}
                  placeholder={currentUser ? "이 관측에 대한 생각을 남겨주세요..." : "댓글을 작성하려면 터치하여 로그인하세요."}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pr-12 focus:outline-none focus:border-space-accent focus:bg-white transition-all resize-none h-24"
                />
                {currentUser && (
                    <button 
                    type="submit" 
                    disabled={!newComment.trim() || commentLoading}
                    className="absolute bottom-3 right-3 p-2 bg-space-accent text-white rounded-full hover:bg-cyan-600 disabled:opacity-50 disabled:hover:bg-space-accent transition-colors"
                    >
                    <Send size={16} />
                    </button>
                )}
              </div>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">아직 작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-100">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-xl rounded-tl-none p-4 inline-block min-w-[200px] w-full md:w-auto relative group-comment">
                      
                      {/* Edit Mode vs View Mode */}
                      {editingCommentId === comment.id ? (
                          <div className="w-full min-w-[250px]">
                              <textarea 
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-space-accent mb-2 font-serif"
                                  rows={3}
                                  autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={cancelEditingComment} 
                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                                    title="취소"
                                  >
                                      <X size={16} />
                                  </button>
                                  <button 
                                    onClick={() => saveEditedComment(comment.id)} 
                                    className="p-1.5 text-space-accent hover:text-white hover:bg-space-accent rounded-full transition-colors"
                                    title="저장"
                                  >
                                      <Check size={16} />
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <>
                            <div className="flex items-center justify-between mb-1 gap-4">
                                <span className="font-bold text-sm text-gray-900">{comment.userName}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                    
                                    {/* Action Buttons for Comment Owner */}
                                    {currentUser?.uid === comment.userId && (
                                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => startEditingComment(comment)}
                                                className="text-gray-400 hover:text-blue-500 p-1 hover:bg-blue-50 rounded-full"
                                                title="수정"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button 
                                                onClick={() => deleteComment(comment.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full"
                                                title="삭제"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed break-words">{comment.text}</p>
                          </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JournalDetail;
