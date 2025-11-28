import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { JournalEntry, UserProfile, ViewState } from './types';

// Components
import StarBackground from './components/StarBackground';
import JournalList from './components/JournalList';
import JournalEditor from './components/JournalEditor';
import JournalDetail from './components/JournalDetail';
import AuthModal from './components/AuthModal';

// Icons
import { Rocket, Plus, LogOut, User } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Fetching
  useEffect(() => {
    const q = query(collection(db, 'journals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JournalEntry));
      setEntries(fetchedEntries);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setView(ViewState.HOME);
  };

  const handleCreateClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setView(ViewState.CREATE);
    }
  };

  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setView(ViewState.DETAIL);
  };

  const handleBackToHome = () => {
    setSelectedEntry(null);
    setView(ViewState.HOME);
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-space-accent selection:text-space-900">
      <StarBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-space-900/80 backdrop-blur-md border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToHome}>
            <div className="bg-space-accent p-2 rounded-full">
              <Rocket className="text-space-900 transform -rotate-45" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display text-white tracking-tight">별빛 관측 일지</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-space-accent font-bold">아빠와 아들의 우주 탐험</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden md:block text-sm text-gray-400 font-serif italic">
                  사령관 {user.displayName || '게스트'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="로그아웃"
                >
                  <LogOut size={20} />
                </button>
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-space-accent" />
                )}
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 text-sm font-bold text-white hover:text-space-accent transition-colors"
              >
                <User size={18} />
                로그인
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        
        {view === ViewState.HOME && (
          <>
            {/* Header / Hero Section */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
               <div>
                  <h2 className="text-4xl md:text-5xl font-display text-white mb-2">관측 기록</h2>
                  <p className="text-gray-400 font-serif text-lg max-w-xl">
                    별 하나에 추억 하나, 아빠와 아들이 함께 기록하는 우주의 신비.
                  </p>
               </div>
               
               <button 
                 onClick={handleCreateClick}
                 className="group bg-space-accent hover:bg-white text-space-900 px-6 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
               >
                 <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                 새 기록 작성
               </button>
            </header>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-space-accent"></div>
              </div>
            ) : (
              <JournalList entries={entries} onSelect={handleEntrySelect} />
            )}
          </>
        )}

        {view === ViewState.CREATE && user && (
          <JournalEditor 
            user={user}
            onCancel={handleBackToHome}
            onSave={handleBackToHome}
          />
        )}

        {view === ViewState.DETAIL && selectedEntry && (
          <JournalDetail 
            entry={selectedEntry}
            onBack={handleBackToHome}
          />
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default App;