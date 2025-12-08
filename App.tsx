import React, { useEffect, useState, useMemo } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { JournalEntry, UserProfile, ViewState } from './types';

// Components
import StarBackground from './components/StarBackground';
import JournalList from './components/JournalList';
import JournalMap from './components/JournalMap'; // New Map Component
import JournalEditor from './components/JournalEditor';
import JournalDetail from './components/JournalDetail';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import Logo from './components/Logo'; 

// Icons
import { Rocket, PlusSquare, LogOut, User, Download, Heart, Settings, Map, List } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null); 
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);
  
  // Modals
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Auth & User Profile Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // 1. Ensure User Profile Exists (Migration for old users)
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: Date.now(),
              followers: [],
              following: [],
              equipment: '',
              region: ''
            });
          }
        } catch (e) {
          console.warn("Could not check/create user profile. This might be due to permissions.", e);
        }

        // 2. Set up real-time listener with error handling
        unsubscribeProfile = onSnapshot(userRef, 
          (docSnap) => {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              ...(data || {}) // Safe spread if data is undefined
            } as UserProfile);
          }, 
          (error) => {
            console.error("Profile sync error:", error);
            // Fallback: Use basic auth info if Firestore fails
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            } as UserProfile);
          }
        );
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
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
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Data Fetching & Deep Linking
  useEffect(() => {
    // Only listen to feed if not loading, but simple logic is fine
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
          setSelectedEntryId(foundEntry.id || null);
          setView(ViewState.DETAIL);
        }
      }
    }, (error) => {
      console.error("Journal sync error:", error);
    });
    return unsubscribe;
  }, []);

  // Sort entries: Followed users first, then by date
  const sortedEntries = useMemo(() => {
    if (!user || !user.following || user.following.length === 0) {
      return entries;
    }

    return [...entries].sort((a, b) => {
      const isAFollowed = user.following?.includes(a.userId) ? 1 : 0;
      const isBFollowed = user.following?.includes(b.userId) ? 1 : 0;

      // 1. Priority to followed users
      if (isAFollowed > isBFollowed) return -1;
      if (isAFollowed < isBFollowed) return 1;

      // 2. Then sort by date (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [entries, user]);

  // Derive the active entry object from the ID to ensure we always have real-time data
  const activeEntry = useMemo(() => {
    return entries.find(e => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

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
    setSelectedEntryId(entry.id || null);
    setView(ViewState.DETAIL);
  };

  const handleBackToHome = () => {
    setSelectedEntryId(null);
    setEditingEntry(undefined);
    setView(ViewState.HOME);
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

  const toggleViewMode = () => {
    if (view === ViewState.HOME) {
        setView(ViewState.MAP);
    } else if (view === ViewState.MAP) {
        setView(ViewState.HOME);
    }
  };

  return (
    <div className="min-h-[100dvh] text-gray-900 font-sans selection:bg-space-accent selection:text-white overflow-x-hidden bg-white">
      <StarBackground />
      
      {/* Navigation - Feed Style Header */}
      {view !== ViewState.DETAIL && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 pt-safe transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
            {/* Logo area */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}>
                <Logo className="h-8 md:h-10" />
            </div>

            {/* Actions area */}
            <div className="flex items-center gap-4">
              {deferredPrompt && (
                <button onClick={handleInstallClick} className="text-gray-700 hover:text-space-accent">
                   <Download size={24} />
                </button>
              )}
              
              {/* Map Toggle Button */}
              <button 
                onClick={toggleViewMode} 
                className={`text-gray-700 transition-colors ${view === ViewState.MAP ? 'text-space-accent' : 'hover:text-space-accent'}`}
                title={view === ViewState.MAP ? "리스트 보기" : "지도 보기"}
              >
                {view === ViewState.MAP ? <List size={24} /> : <Map size={24} />}
              </button>

              <button onClick={handleCreateClick} className="text-gray-700 hover:text-space-accent transition-colors">
                 <PlusSquare size={24} />
              </button>

              {user ? (
                 <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setProfileModalOpen(true)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:border-space-accent transition-all"
                   >
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                         <User size={16} className="text-gray-500" />
                       </div>
                     )}
                   </button>
                   <button onClick={handleLogout} className="text-gray-700 hover:text-red-500 transition-colors">
                     <LogOut size={24} />
                   </button>
                 </div>
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
          <div className="px-0 md:px-6 max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-space-accent"></div>
              </div>
            ) : (
              <JournalList entries={sortedEntries} onSelect={handleEntrySelect} currentUser={user} />
            )}
          </div>
        )}

        {view === ViewState.MAP && (
           <div className="px-4 md:px-6 max-w-7xl mx-auto h-[calc(100vh-140px)]">
             <JournalMap entries={sortedEntries} onSelect={handleEntrySelect} />
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

        {view === ViewState.DETAIL && activeEntry && (
          <JournalDetail 
            entry={activeEntry}
            currentUser={user}
            onBack={handleBackToHome}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {user && (
        <UserProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setProfileModalOpen(false)} 
          user={user}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
};

export default App;