
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, googleProvider } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch profile from Firestore
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Register with email
  const register = async (email, password, displayName, gender) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    // Save profile to Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName,
      email,
      gender,
      photoURL: null,
      createdAt: Date.now()
    });
    setUserProfile({ displayName, email, gender, photoURL: null, createdAt: Date.now() });
    return cred.user;
  };

  // Login with email
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profileDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (profileDoc.exists()) {
      setUserProfile(profileDoc.data());
    }
    return cred.user;
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profileDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!profileDoc.exists()) {
      // First time Google login — need gender selection
      return { user: cred.user, needsGender: true };
    }
    setUserProfile(profileDoc.data());
    return { user: cred.user, needsGender: false };
  };

  // Complete Google profile (set gender)
  const completeGoogleProfile = async (gender) => {
    if (!user) return;
    const profile = {
      displayName: user.displayName || "User",
      email: user.email,
      gender,
      photoURL: user.photoURL || null,
      createdAt: Date.now()
    };
    await setDoc(doc(db, "users", user.uid), profile);
    setUserProfile(profile);
  };

  // Update profile photo
  const updateProfilePhoto = async (photoURL) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { photoURL }, { merge: true });
    setUserProfile(prev => ({ ...prev, photoURL }));
  };

  // Update display name
  const updateDisplayName = async (displayName) => {
    if (!user) return;
    await updateProfile(user, { displayName });
    await setDoc(doc(db, "users", user.uid), { displayName }, { merge: true });
    setUserProfile(prev => ({ ...prev, displayName }));
  };

  // Update full profile data
  const updateFullProfile = async (data) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    completeGoogleProfile,
    updateProfilePhoto,
    updateDisplayName,
    updateFullProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
