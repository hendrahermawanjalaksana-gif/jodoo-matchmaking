
import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Camera, Save, LogOut, ArrowLeft, User, MapPin, Calendar, Heart } from "lucide-react";

export default function ProfilePage({ onBack, onToast }) {
  const { user, userProfile, updateProfilePhoto, updateDisplayName, updateFullProfile, logout } = useAuth();
  const [name, setName] = useState(userProfile?.displayName || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [address, setAddress] = useState(userProfile?.address || "");
  const [dob, setDob] = useState(userProfile?.dob || "");
  const [interests, setInterests] = useState(userProfile?.interests || "");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onToast("Silakan pilih file gambar.", "warning");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onToast("Ukuran file maksimal 2MB.", "warning");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        await updateProfilePhoto(dataURL);
        setIsUploading(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await updateFullProfile({
      displayName: name.trim(),
      bio: bio.trim(),
      address: address.trim(),
      dob: dob.trim(),
      interests: interests.trim()
    });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const photoURL = userProfile?.photoURL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ overflowY: 'auto', maxHeight: '90vh' }}
      className="card profile-card no-scrollbar"
    >
      <button onClick={onBack} className="profile-back-btn">
        <ArrowLeft size={20} /> Kembali
      </button>

      <h1 style={{ fontSize: '1.8rem', marginTop: '1rem', marginBottom: '2rem' }}>Profil Saya</h1>

      {/* Avatar & Bio */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
          {photoURL ? (
            <img src={photoURL} alt="Profil" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">
              <User size={48} color="var(--primary-light)" />
            </div>
          )}
          <div className="profile-avatar-overlay">
            <Camera size={20} color="white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        {isUploading && <p className="profile-upload-status">Mengunggah...</p>}
        
        {/* Bio Input */}
        <textarea 
          placeholder="Tulis bio singkat Anda..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="auth-input"
          style={{ 
            marginTop: '1.5rem', 
            borderRadius: '16px', 
            height: '80px', 
            padding: '12px', 
            fontSize: '0.9rem',
            resize: 'none'
          }}
        />
      </div>

      {/* Detail Input */}
      <div className="profile-info-section" style={{ marginTop: '2rem' }}>
        <div className="profile-field">
          <label className="profile-label">Nama Lengkap</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            style={{ paddingLeft: '1.5rem' }}
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">Alamat</label>
          <div className="auth-input-group">
            <MapPin size={18} className="auth-input-icon" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="auth-input"
              placeholder="Kota tinggal saat ini"
            />
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Tanggal Lahir</label>
          <div className="auth-input-group">
            <Calendar size={18} className="auth-input-icon" />
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="auth-input"
            />
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-label">Minat / Kesukaan</label>
          <div className="auth-input-group">
            <Heart size={18} className="auth-input-icon" />
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="auth-input"
              placeholder="Contoh: Golf, Traveling, Saham"
            />
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveAll}
        className="primary-btn"
        style={{ marginTop: '2.5rem', width: '100%', display: 'flex', gap: '10px' }}
        disabled={isSaving}
      >
        {saved ? "✓ Profil Disimpan" : <><Save size={20} /> Simpan Semua Perubahan</>}
      </motion.button>
    </motion.div>
  );
}
