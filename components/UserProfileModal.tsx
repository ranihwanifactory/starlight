import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Save, Telescope, MapPin, User, Mail } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [equipment, setEquipment] = useState(user.equipment || '');
  const [region, setRegion] = useState(user.region || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        equipment,
        region
      });

      onUpdate({
        ...user,
        displayName,
        equipment,
        region
      });

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-gray-200 p-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-display text-gray-900">프로필 수정</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-space-accent uppercase mb-1 ml-1">활동명 (닉네임)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-space-accent"
                  placeholder="별 보는 탐험가"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-space-accent uppercase mb-1 ml-1">주 활동 지역</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-space-accent"
                  placeholder="예: 서울, 강원도 영월"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-space-accent uppercase mb-1 ml-1">보유 장비 (전체)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Telescope size={18} />
                </div>
                <textarea
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-space-accent min-h-[80px] resize-none"
                  placeholder="보유 중인 망원경, 카메라 등을 적어주세요."
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1 ml-1">* 새 게시물 작성 시 자동으로 입력됩니다.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-space-accent hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <Save size={20} />
              {loading ? '처리 중...' : '프로필 저장'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;