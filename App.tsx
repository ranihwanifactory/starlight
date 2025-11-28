import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
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
      setEditingEntry(undefined);
      setView(ViewState.CREATE);
    }
  };

  const handleEntrySelect = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setView(ViewState.DETAIL);
  };

  const handleBackToHome = () => {
    setSelectedEntry(null);
    setEditingEntry(undefined);
    setView(ViewState.HOME);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setView(ViewState.CREATE); // Reuse the CREATE view for editing
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, "journals", entryId));
      handleBackToHome(); // Return home after delete
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-space-accent selection:text-space-900">
      <StarBackground />
      
      {/* Navigation - Hide on Detail view for full immersion, or keep minimalistic */}
      {view !== ViewState.DETAIL && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-space-900/80 backdrop-blur-md border-b border-white/5 h-24 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={handleBackToHome}>
              <div className="bg-space-accent p-2.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all duration-300">
                <Rocket className="text-space-900 transform -rotate-45 group-hover:-translate-y-1 transition-transform" size={28} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-display text-white tracking-[0.15em] leading-none uppercase drop-shadow-md">
                  Starlight<span className="text-space-accent">.</span>Journal
                </h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold mt-1 group-hover:text-space-accent transition-colors">
                  Dad & Son Cosmic Log
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="hidden md:block text-sm text-gray-400 font-serif italic">
                    Commander {user.displayName || 'Guest'}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={20} />
                  </button>
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-space-accent shadow-sm" />
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-white hover:text-space-accent transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                >
                  <User size={18} />
                  로그인
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`min-h-screen ${view !== ViewState.DETAIL ? 'pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto' : ''}`}>
        
        {view === ViewState.HOME && (
          <>
            {/* Header / Hero Section */}
            <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8 animate-fade-in">
               <div>
                  <h2 className="text-4xl md:text-6xl font-display text-white mb-3 tracking-wide">관측 기록</h2>
                  <p className="text-gray-400 font-serif text-lg md:text-xl max-w-xl leading-relaxed">
                    별 하나에 추억 하나, 아빠와 아들이 함께 기록하는 우주의 신비.
                  </p>
               </div>
               
               <button 
                 onClick={handleCreateClick}
                 className="group bg-space-accent hover:bg-white text-space-900 px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-3 transform hover:scale-105 active:scale-95"
               >
                 <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
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
            initialData={editingEntry}
            onCancel={handleBackToHome}
            onSave={handleBackToHome}
          />
        )}

        {view === ViewState.DETAIL && selectedEntry && (
          <JournalDetail 
            entry={selectedEntry}
            currentUser={user}
            onBack={handleBackToHome}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default App;
