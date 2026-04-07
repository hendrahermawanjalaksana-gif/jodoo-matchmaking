

import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, where, orderBy, limit, runTransaction, serverTimestamp, arrayUnion } from "firebase/firestore";
import { questions } from "./data/questions";

export const findMatch = async (userId, gender) => {
  try {
    const queueRef = collection(db, "queue");
    const targetGender = gender === "pria" ? "wanita" : "pria";
    const q = query(queueRef, where("gender", "==", targetGender), orderBy("createdAt", "asc"), limit(5));
    
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      for (const opponentDoc of snapshot.docs) {
        const opponentData = opponentDoc.data();
        if (opponentData.userId === userId) continue;

        try {
          const sessionId = await runTransaction(db, async (transaction) => {
            const currentOpponent = await transaction.get(opponentDoc.ref);
            if (!currentOpponent.exists()) return null; // Already matched by someone else

            transaction.delete(opponentDoc.ref);
            
            const sessionRef = doc(collection(db, "sessions"));
            transaction.set(sessionRef, {
              users: [userId, opponentData.userId],
              questionIndex: 0,
              answers: {},
              createdAt: serverTimestamp(),
              status: "active",
              messages: []
            });
            
            return sessionRef.id;
          });

          if (sessionId) return sessionId;
        } catch (e) {
          console.log("Transaction failed, trying next opponent...", e);
        }
      }
    }

    // No match found, join queue
    await leaveQueue(userId);
    await addDoc(queueRef, { 
      userId, 
      gender,
      createdAt: serverTimestamp() 
    });
    
    return null;
  } catch (error) {
    console.error("Matchmaking Error:", error);
    throw error;
  }
};

export const leaveQueue = async (userId) => {
  const q = query(collection(db, "queue"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
};

export const submitAnswer = async (sessionId, userId, questionIndex, answer) => {
  const sessionRef = doc(db, "sessions", sessionId);
  
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(sessionRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const newAnswers = { ...data.answers, [`${questionIndex}_${userId}`]: answer };
    
    const user1 = data.users[0];
    const user2 = data.users[1];
    const bothAnswered = newAnswers[`${questionIndex}_${user1}`] && newAnswers[`${questionIndex}_${user2}`];

    transaction.update(sessionRef, {
      answers: newAnswers,
      questionIndex: bothAnswered ? questionIndex + 1 : questionIndex,
      status: (bothAnswered && questionIndex === questions.length - 1) ? "completed" : "active"
    });
  });
};

export const sendMessage = async (sessionId, userId, text) => {
  if (!text.trim()) return;
  const sessionRef = doc(db, "sessions", sessionId);
  
  await updateDoc(sessionRef, {
    messages: arrayUnion({ 
      id: Math.random().toString(36).substring(7),
      userId, 
      text, 
      timestamp: Date.now() // Keep numeric for client sorting if needed, or use serverTimestamp
    })
  });
};

