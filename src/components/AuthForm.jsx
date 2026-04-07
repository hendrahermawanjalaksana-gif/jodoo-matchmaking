
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Heart, LogIn, UserPlus, Chrome } from "lucide-react";

export default function AuthForm() {
  const { login, register, loginWithGoogle, completeGoogleProfile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsGender, setNeedsGender] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!gender) {
          setError("Silakan pilih jenis kelamin Anda.");
          setIsLoading(false);
          return;
        }
        if (!displayName.trim()) {
          setError("Silakan masukkan nama Anda.");
          setIsLoading(false);
          return;
        }
        await register(email, password, displayName, gender);
      }
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Email atau kata sandi salah.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar. Silakan masuk.");
      } else if (err.code === "auth/weak-password") {
        setError("Kata sandi minimal 6 karakter.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError(err.message);
      }
    }
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.needsGender) {
        setNeedsGender(true);
      }
    } catch (err) {
      setError("Gagal masuk dengan Google. Coba lagi.");
    }
    setIsLoading(false);
  };

  const handleGenderSelect = async (selectedGender) => {
    setIsLoading(true);
    await completeGoogleProfile(selectedGender);
    setIsLoading(false);
  };

  // Gender selection screen (for Google users)
  if (needsGender) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card auth-card"
      >
        <div className="icon-wrapper">
          <Heart size={48} fill="#E0006F" color="#E0006F" className="pulse-icon" />
        </div>
        <h1 style={{ fontSize: '1.8rem' }}>Siapa Anda?</h1>
        <p style={{ marginBottom: '2rem' }}>Untuk pengalaman matchmaking yang tepat, beritahu kami jenis kelamin Anda.</p>
        
        <div className="gender-select-grid">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="gender-card"
            onClick={() => handleGenderSelect("pria")}
            disabled={isLoading}
          >
            <span className="gender-emoji">👨</span>
            <span className="gender-label">Pria</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="gender-card"
            onClick={() => handleGenderSelect("wanita")}
            disabled={isLoading}
          >
            <span className="gender-emoji">👩</span>
            <span className="gender-label">Wanita</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="card auth-card"
    >
      <div className="icon-wrapper">
        <Heart size={64} fill="#E0006F" color="#E0006F" className="pulse-icon" />
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Jodoo Match</h1>
      <p style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
        {isLogin ? "Masuk ke perjalanan cinta Anda." : "Mulai perjalanan cinta baru."}
      </p>

      {/* Google Sign-In */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="google-btn"
        onClick={handleGoogle}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Masuk dengan Google
      </motion.button>

      <div className="auth-divider">
        <span>atau</span>
      </div>

      {/* Tabs */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${isLogin ? 'active' : ''}`}
          onClick={() => { setIsLogin(true); setError(""); }}
        >
          <LogIn size={16} /> Masuk
        </button>
        <button
          className={`auth-tab ${!isLogin ? 'active' : ''}`}
          onClick={() => { setIsLogin(false); setError(""); }}
        >
          <UserPlus size={16} /> Daftar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              key="register-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Name field */}
              <div className="auth-input-group">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Nama lengkap"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="auth-input"
                />
              </div>

              {/* Gender selection */}
              <div className="gender-row">
                <button
                  type="button"
                  className={`gender-option ${gender === 'pria' ? 'selected' : ''}`}
                  onClick={() => setGender('pria')}
                >
                  👨 Pria
                </button>
                <button
                  type="button"
                  className={`gender-option ${gender === 'wanita' ? 'selected' : ''}`}
                  onClick={() => setGender('wanita')}
                >
                  👩 Wanita
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div className="auth-input-group">
          <Mail size={18} className="auth-input-icon" />
          <input
            type="email"
            placeholder="Alamat email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />
        </div>

        {/* Password */}
        <div className="auth-input-group">
          <Lock size={18} className="auth-input-icon" />
          <input
            type="password"
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            minLength={6}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="auth-error"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="primary-btn auth-submit"
          disabled={isLoading}
        >
          {isLoading ? "Memproses..." : isLogin ? "Masuk" : "Daftar Sekarang"}
        </motion.button>
      </form>
    </motion.div>
  );
}
