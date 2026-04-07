
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export const useMatchmaking = (userId, enabled) => {
  const [matchedId, setMatchedId] = useState(null);

  useEffect(() => {
    if (!userId || !enabled) {
      setMatchedId(null);
      return;
    }

    // Listen for sessions where this user is invited/included
    const q = query(
      collection(db, "sessions"),
      where("users", "array-contains", userId),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort by createdAt to get the latest one if multiple exist
        const latest = snapshot.docs.sort((a,b) => b.data().createdAt - a.data().createdAt)[0];
        setMatchedId(latest.id);
      }
    });

    return () => unsub();
  }, [userId, enabled]);

  return matchedId;
};
