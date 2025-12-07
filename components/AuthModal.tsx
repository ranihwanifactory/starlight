import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { X, Mail, Chrome, Telescope, MapPin } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // New State for Profile
  const [equipment, setEquipment] = useState('');
  const [region, setRegion] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          equipment: equipment,
          region: region,
          createdAt: Date.now(),
          followers: [],
          following: []
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden my-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-display text-gray-900 mb-2 text-center">
            {isLogin ? '돌아오신 것을 환영합니다' : '대원 합류하기'}
          </h2>
          <p className="text-gray-500 text-center mb-8 font-serif italic">
            "우주는 당신에게 이해받을 의무가 없다."
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-800 transition-colors mb-4"
          >
            <Chrome size={20} />
            Google로 계속하기
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는 이메일로 계속하기</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-space-accent placeholder-gray-400"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:border-space-accent placeholder-gray-400"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                     <MapPin size={18} />
                   </div>
                   <input
                    type="text"
                    placeholder="주 활동 지역 (예: 서울, 강원도 영월)"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-space-accent placeholder-gray-400"
                  />
                </div>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                     <Telescope size={18} />
                   </div>
                   <input
                    type="text"
                    placeholder="보유 장비 (예: 셀레스트론 8SE, 쌍안경)"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-space-accent placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-space-accent hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-6"
            >
              <Mail size={20} />
              {loading ? '처리 중...' : (isLogin ? '로그인' : '계정 만들기')}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-500 text-sm">
            {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
            <button
              onClick={toggleMode}
              className="text-space-accent hover:underline font-bold"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;