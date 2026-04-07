
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export const useMessages = (sessionId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      collection(db, "messages"),
      where("sessionId", "==", sessionId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [sessionId]);

  return messages;
};
