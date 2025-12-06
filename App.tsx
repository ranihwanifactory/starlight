import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { JournalEntry, UserProfile, ViewState } from './types';

// Components
import StarBackground from './components/StarBackground';
import JournalList from './components/JournalList';
import JournalEditor from './components/JournalEditor';
import JournalDetail from './components/JournalDetail';
import AuthModal from './components/AuthModal';

// Icons
import { Rocket, Plus, LogOut, User, Download } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Auth Listener with Firestore Profile Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let additionalData = {};
          if (userDocSnap.exists()) {
            additionalData = userDocSnap.data();
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            ...additionalData // Merge equipment and region
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to basic auth info
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Data Fetching & Deep Linking
  useEffect(() => {
    const q = query(collection(db, 'journals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JournalEntry));
      setEntries(fetchedEntries);

      // Deep Link Check
      const params = new URLSearchParams(window.location.search);
      const entryId = params.get('entry');
      if (entryId) {
        const foundEntry = fetchedEntries.find(e => e.id === entryId);
        if (foundEntry) {
          setSelectedEntry(foundEntry);
          setView(ViewState.DETAIL);
        }
      }
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
    // Clear URL params on back to home
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setView(ViewState.CREATE);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, "journals", entryId));
      handleBackToHome();
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-[100dvh] text-gray-100 font-sans selection:bg-space-accent selection:text-space-900 overflow-x-hidden">
      <StarBackground />
      
      {/* Navigation - Hide on Detail view for full immersion, or keep minimalistic */}
      {view !== ViewState.DETAIL && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-space-900/90 backdrop-blur-md border-b border-space-accent/20 pt-safe transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={handleBackToHome}>
              <div className="bg-space-accent/10 p-2 rounded-full border border-space-accent/50 shadow-[0_0_15px_rgba(0,212,255,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.6)] transition-all duration-300">
                <Rocket className="text-space-accent transform -rotate-45 group-hover:-translate-y-1 transition-transform" size={20} md:size={28} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl md:text-3xl font-display text-white tracking-[0.1em] leading-none uppercase drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
                  Starlight<span className="text-space-accent">.</span>Log
                </h1>
                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-space-accent font-bold mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  우주 탐사 기록 보관소
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 text-xs md:text-sm font-bold text-space-900 bg-space-accent hover:bg-white transition-all px-3 py-2 rounded shadow-[0_0_10px_rgba(0,212,255,0.3)] animate-pulse"
                >
                  <Download size={16} />
                  <span className="hidden md:inline">앱 설치</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="hidden md:block text-sm text-space-accent font-display tracking-wider">
                    탐사대원 {user.displayName || '손님'}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={20} />
                  </button>
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-space-accent shadow-[0_0_10px_rgba(0,212,255,0.4)]" />
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 text-xs md:text-sm font-bold text-space-900 bg-space-accent hover:bg-white transition-all px-4 py-2 md:px-6 rounded-none clip-path-polygon"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                >
                  <User size={16} md:size={18} />
                  로그인
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content - Handle SafeArea and Nav Height */}
      <main className={`min-h-[100dvh] w-full ${view !== ViewState.DETAIL ? 'pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto pb-safe' : ''}`}>
        
        {view === ViewState.HOME && (
          <>
            {/* Header / Hero Section */}
            <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8 animate-fade-in mt-2">
               <div className="w-full">
                  <h2 className="text-3xl md:text-6xl font-display text-white mb-3 tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                    우주 탐사 일지
                  </h2>
                  <p className="text-space-accent/80 font-sans text-base md:text-xl max-w-xl leading-relaxed tracking-wide">
                    별 하나, 추억 하나. 우리만의 우주를 기록해봐요.
                  </p>
               </div>
               
               <button 
                 onClick={handleCreateClick}
                 className="w-full md:w-auto justify-center group bg-transparent border border-space-accent text-space-accent hover:bg-space-accent hover:text-space-900 px-8 py-3 font-display tracking-widest font-bold transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] flex items-center gap-3 uppercase active:scale-95"
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