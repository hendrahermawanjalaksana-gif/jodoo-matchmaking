
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const useSession = (sessionId) => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      setSession(snap.data());
    });

    return () => unsub();
  }, [sessionId]);

  return session;
};
