
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

/** Realtime messages for a session from Firestore subcollection (scalable vs array on session doc). */
export const useMessages = (sessionId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    const messagesRef = collection(db, "sessions", sessionId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            text: data.text,
            createdAt: data.createdAt
          };
        })
      );
    });

    return () => unsub();
  }, [sessionId]);

  return messages;
};
