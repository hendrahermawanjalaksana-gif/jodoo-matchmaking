
import React, { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { findMatch, submitAnswer, leaveQueue } from "./matchmaking";
import { useSession } from "./hooks/useSession";
import { useMatchmaking } from "./hooks/useMatchmaking";
import { questions } from "./data/questions";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Sparkles, User, LogOut, MessageCircle, X, ChevronDown, Settings, Menu, MapPin, Calendar, Info } from "lucide-react";
import confetti from 'canvas-confetti';
import Chat from "./components/Chat";
import Avatar from "./components/Avatar";
import AuthForm from "./components/AuthForm";
import ProfilePage from "./components/ProfilePage";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

function MainApp() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerData, setPartnerData] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  
  const showToast = (message, type = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isPartnerLoading, setIsPartnerLoading] = useState(false);
  const dropdownRef = useRef(null);

  const autoMatchedId = useMatchmaking(user?.uid, isSearching && !sessionId);

  useEffect(() => {
    if (autoMatchedId) {
      setSessionId(autoMatchedId);
      setIsSearching(false);
      setShowMatchModal(true);
      setIsSessionLoading(true);
    }
  }, [autoMatchedId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleUnload = () => { if (isSearching && user) leaveQueue(user.uid); };
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("scroll", handleScroll);
      handleUnload();
    };
  }, [isSearching, user]);

  const session = useSession(sessionId);

  useEffect(() => {
    if (session) {
      setIsSessionLoading(false);
    }
  }, [session]);

  const calculateScore = () => {
    if (!session?.answers || !user) return 0;
    const opponentId = session.users.find(id => id !== user.uid);
    let matchCount = 0;
    questions.forEach((_, idx) => {
      if (session.answers[`${idx}_${user.uid}`] === session.answers[`${idx}_${opponentId}`]) {
        matchCount++;
      }
    });
    return Math.round((matchCount / questions.length) * 100);
  };

  const fetchPartnerProfile = async () => {
    if (!session || !user || isPartnerLoading) return;
    setIsPartnerLoading(true);
    try {
      const opponentId = session.users.find(id => id !== user.uid);
      if (!opponentId) {
        console.error("Opponent ID not found");
        return;
      }

      const docSnap = await getDoc(doc(db, "users", opponentId));
      if (docSnap.exists()) {
        setPartnerData(docSnap.data());
        setShowPartnerModal(true);
      } else {
        console.warn("Partner profile not found in database");
      }
    } catch (e) {
      console.error("Error fetching partner profile:", e);
    } finally {
      setIsPartnerLoading(false);
    }
  };

  const isCompleted = session?.status === "completed" || (session?.questionIndex >= questions.length);

  useEffect(() => {
    let timer;
    if (isCompleted && sessionId) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSessionId(null);
            setShowChat(false);
            setIsSearching(false);
            showToast("Sesi telah berakhir. Mulailah perjalanan baru!", "info");
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(300);
    }
    return () => clearInterval(timer);
  }, [isCompleted, sessionId]);

  useEffect(() => {
    if (isCompleted) {
      const score = calculateScore();
      if (score > 70) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E0006F', '#FF81B8', '#ffffff']
        });
      }
    }
  }, [isCompleted]);

  if (authLoading) return <div className="app-loading"><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;

  if (!user || !userProfile) return <div className="app-container"><AuthForm /></div>;

  const start = async () => {
    setIsSearching(true);
    const id = await findMatch(user.uid, userProfile.gender);
    if (id) {
      setSessionId(id);
      setIsSearching(false);
      setShowMatchModal(true);
      setIsSessionLoading(true);
    }
  };

  const handleOptionClick = async (option) => {
    const questionIndex = session?.questionIndex || 0;
    if (session?.answers?.[`${questionIndex}_${user.uid}`] || isSubmitting) return;
    setIsSubmitting(true);
    await submitAnswer(sessionId, user.uid, questionIndex, option);
    setIsSubmitting(false);
  };

  const score = calculateScore();

  return (
    <>
      <header className={`luxury-header ${isScrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="brand-left">Jodoo</span>
          <span className="brand-right">Matchmaking</span>
        </div>
        {!sessionId && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <motion.div whileHover={{ scale: 1.02 }} onClick={() => setShowDropdown(!showDropdown)} className="header-profile">
              <div className="desktop-only">
                <span className="header-user-name" style={{ marginRight: '8px' }}>{userProfile.displayName}</span>
                <Avatar src={userProfile?.photoURL} seed={userProfile?.displayName} size={36} />
                <ChevronDown size={14} color="var(--text-muted)" style={{ opacity: 0.6 }} />
              </div>
              <div className="mobile-only hamburger-btn">
                <motion.div animate={{ rotate: showDropdown ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {showDropdown ? <X size={24} /> : <Menu size={24} />}
                </motion.div>
              </div>
            </motion.div>
            <AnimatePresence>
              {showDropdown && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="profile-dropdown">
                  <button onClick={() => { setShowProfile(true); setShowDropdown(false); }} className="dropdown-item"><Settings size={18} /> Edit Profil</button>
                  <button onClick={() => logout()} className="dropdown-item logout-item"><LogOut size={18} /> Keluar</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      <div className="app-container">
        <AnimatePresence>
          {showProfile ? (
            <ProfilePage key="profile" onBack={() => setShowProfile(false)} onToast={showToast} />
          ) : !sessionId ? (
            <motion.div key="home" className="card">
              <div className="icon-wrapper"><img src="/images/logo.png" alt="Jodoo Match" className="home-logo" /></div>
              <h1>Halo, {userProfile.displayName}</h1>
              <p>Tingkatkan koneksi Anda. Rasakan perjalanan matchmaking yang dibalut keanggunan dan presisi tingkat tinggi.</p>
              {!isSearching ? (
                <button onClick={start} className="primary-btn"><Sparkles size={22} style={{ marginRight: '10px' }} /> Mulai Perjalanan</button>
              ) : (
                <div className="searching-container" style={{ width: '100%' }}>
                  <div className="skeleton-pulse" style={{ height: '80px', width: '100%', marginBottom: '1.5rem', borderRadius: '24px' }}></div>
                  <div className="skeleton-pulse" style={{ height: '20px', width: '80%', margin: '0 auto 2.5rem', borderRadius: '10px' }}></div>
                  <p className="search-text" style={{ fontStyle: 'italic', opacity: 0.8 }}>Mencari resonansi sempurna...</p>
                  <button onClick={() => { leaveQueue(user.uid); setIsSearching(false); }} className="secondary-btn cancel-btn" style={{ margin: '0 auto' }}><LogOut size={16} /> Batal</button>
                </div>
              )}
            </motion.div>
          ) : isCompleted ? (
            <motion.div key="result" className="card result-card">
              {!showChat ? (
                <>
                  <h1 style={{ marginTop: '1rem' }}>Hasil Keserasian</h1>
                  <div className="score-ring"><span className="score-val">{score}%</span><span className="score-label">Keselarasan</span></div>
                  <p className="result-desc">
                    {score >= 80 ? "Penyelarasan jiwa yang luar biasa." : score >= 50 ? "Ditemukan resonansi yang mendalam." : "Ditemukan perspektif yang saling melengkapi."}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    {score >= 10 && (
                      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button onClick={() => setShowChat(true)} className="primary-btn" style={{ flex: 1, background: 'white', color: 'var(--primary)', border: '2px solid var(--secondary)' }}><MessageCircle size={20} style={{ marginRight: '8px' }} /> CHAT</button>
                        <button onClick={fetchPartnerProfile} disabled={isPartnerLoading} className="primary-btn" style={{ flex: 1, background: 'var(--primary-light)', color: 'white' }}>
                          {isPartnerLoading ? <Loader2 className="animate-spin" size={20} /> : <><User size={20} style={{ marginRight: '8px' }} /> LIHAT PROFIL</>}
                        </button>
                      </div>
                    )}
                    <button onClick={() => window.location.reload()} className="primary-btn" style={{ width: '100%', opacity: score >= 50 ? 0.8 : 1 }}>COBA LAGI</button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ textAlign: 'left' }}><h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 900, letterSpacing: '1px', margin: 0 }}>RESONANCE CHAT</h2><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>Personal Alignment</span></div>
                    <button onClick={() => setShowChat(false)} style={{ background: '#f8fafc', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                  </div>
                  <Chat sessionId={sessionId} userId={user.uid} session={session} onToast={showToast} timeLeft={timeLeft} />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="game" className="card game-card">
              <div className="avatar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="user-icons" style={{ marginBottom: '1rem' }}>
                  <Avatar src={userProfile?.photoURL} seed={userProfile?.displayName} size={40} /><div className={`vs-line ${session?.answers?.[`${session?.questionIndex}_${user.uid}`] ? 'matched' : ''}`}></div><Avatar seed="other" size={40} />
                </div>
                <div className="progress-bar"><motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${((session?.questionIndex || 0) / questions.length) * 100}%` }} /></div>
              </div>
              <h2 className="question-title">{questions[session?.questionIndex || 0]?.q}</h2>
              <div className="options-container">
                {questions[session?.questionIndex || 0]?.options.map((opt, idx) => (
                  <motion.button key={idx} disabled={session?.answers?.[`${session?.questionIndex}_${user.uid}`]} onClick={() => handleOptionClick(opt)} className={`nav-option ${session?.answers?.[`${session?.questionIndex}_${user.uid}`] === opt ? 'active' : ''}`} whileHover={{ scale: 1.02, x: 10 }}>{opt}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Match Confirmation Modal */}
      <AnimatePresence>
        {showMatchModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="match-modal">
              <div className="match-avatars">
                <Avatar src={userProfile?.photoURL} seed={userProfile?.displayName} size={100} /><Avatar seed="other" size={100} />
                <div className="match-heart-overlay" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '50%', padding: '10px' }}><Heart size={32} fill="var(--primary)" color="var(--primary)" /></div>
              </div>
              <h1 className="match-title">MATCHING!</h1>
              <p className="match-subtitle">Resonansi sempurna telah ditemukan untuk Anda.</p>
              <button onClick={() => setShowMatchModal(false)} className="primary-btn modal-btn">Mulai Tahap Selanjutnya</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partner Profile Modal */}
      <AnimatePresence>
        {showPartnerModal && partnerData && (
          <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ maxWidth: '400px', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-2rem' }}><button onClick={() => setShowPartnerModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <Avatar src={partnerData.photoURL} seed={partnerData.displayName} size={120} />
                <h2 style={{ marginTop: '1.5rem', marginBottom: '0.2rem' }}>{partnerData.displayName}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{partnerData.gender === 'pria' ? 'Pria' : 'Wanita'}</span>
                {partnerData.bio && <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{partnerData.bio}"</p>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><MapPin size={18} color="var(--primary)" /> <div><p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>ALAMAT</p><p style={{ margin: 0, fontWeight: 600 }}>{partnerData.address || "Belum diisi"}</p></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Calendar size={18} color="var(--primary)" /> <div><p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>TANGGAL LAHIR</p><p style={{ margin: 0, fontWeight: 600 }}>{partnerData.dob || "Belum diisi"}</p></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Heart size={18} color="var(--primary)" /> <div><p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.6 }}>MINAT</p><p style={{ margin: 0, fontWeight: 600 }}>{partnerData.interests || "Belum diisi"}</p></div></div>
              </div>

              <button onClick={() => setShowPartnerModal(false)} className="primary-btn" style={{ marginTop: '2rem', width: '100%' }}>Tutup</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Global Toast */}
      <AnimatePresence>
        {toast.visible && (
          <div className="toast-container">
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="toast-popup"
            >
              <div className="toast-icon">
                {toast.type === 'warning' ? <Info size={20} /> : <Sparkles size={20} />}
              </div>
              <div className="toast-message">{toast.message}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (<AuthProvider><MainApp /></AuthProvider>);
}
