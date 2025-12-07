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
import { Rocket, PlusSquare, LogOut, User, Download, Heart } from 'lucide-react';

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
      
      {/* Navigation - Feed Style Header */}
      {view !== ViewState.DETAIL && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-black/90 md:bg-space-900/90 backdrop-blur-md border-b border-white/10 pt-safe transition-all duration-300">
          <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
            {/* Logo area */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}>
                <h1 className="text-xl md:text-2xl font-display text-white tracking-widest uppercase italic">
                  Starlight
                </h1>
            </div>

            {/* Actions area */}
            <div className="flex items-center gap-4">
              {deferredPrompt && (
                <button onClick={handleInstallClick} className="text-white hover:text-space-accent">
                   <Download size={24} />
                </button>
              )}
              
              <button onClick={handleCreateClick} className="text-white hover:text-space-accent transition-colors">
                 <PlusSquare size={24} />
              </button>

              {user ? (
                 <button onClick={handleLogout} className="text-white hover:text-red-400 transition-colors">
                   <LogOut size={24} />
                 </button>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="text-sm font-bold text-space-accent">
                  로그인
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`min-h-[100dvh] w-full ${view !== ViewState.DETAIL ? 'pt-20 pb-12' : ''}`}>
        
        {view === ViewState.HOME && (
          <div className="px-0 md:px-4">
            {/* Stories / Hero area could go here, but kept simple for feed */}
            
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-space-accent"></div>
              </div>
            ) : (
              <JournalList entries={entries} onSelect={handleEntrySelect} />
            )}
          </div>
        )}

        {view === ViewState.CREATE && user && (
           <div className="px-4">
            <JournalEditor 
              user={user}
              initialData={editingEntry}
              onCancel={handleBackToHome}
              onSave={handleBackToHome}
            />
           </div>
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