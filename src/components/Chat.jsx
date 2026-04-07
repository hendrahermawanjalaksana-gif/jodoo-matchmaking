
import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from "lucide-react";
import { sendMessage } from "../matchmaking";
import { useMessages } from "../hooks/useMessages";
import { isChatMessageUnsafe } from "../utils/chatSafety";
import Avatar from "./Avatar";

const Chat = ({ sessionId, userId, onToast, timeLeft }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const messages = useMessages(sessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || timeLeft <= 0) return;

    if (isChatMessageUnsafe(text)) {
      onToast(
        "Demi keamanan: nomor HP, email, tautan, dan kontak di luar aplikasi tidak diperbolehkan.",
        "warning"
      );
      return;
    }

    const currentText = text;
    setText("");
    await sendMessage(sessionId, userId, currentText);
  };

  return (
    <div className="chat-container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '0.5rem', 
        background: '#fff1f2', 
        fontSize: '0.8rem', 
        fontWeight: 'bold', 
        color: timeLeft <= 60 ? '#e0006f' : 'var(--text-muted)',
        letterSpacing: '2px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div className={timeLeft <= 60 ? "pulse-icon" : ""}>
          SESI BERAKHIR DALAM: {formatTime(timeLeft)}
        </div>
      </div>
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`message-bubble ${m.userId === userId ? 'own' : 'other'}`}
            >
              {m.userId !== userId && <Avatar seed={m.userId} size={32} />}
              <div className="message-content">
                <span className="message-label">
                  {m.userId === userId ? "Anda" : "Resonansi"}
                </span>
                <p>{m.text}</p>
              </div>
              {m.userId === userId && <Avatar seed={m.userId} size={32} />}
            </div>
          ))
        ) : (
           <div className="chat-empty">
             <div className="icon">
               <Smile size={48} strokeWidth={1} />
             </div>
             <p>Penyelarasan jiwa telah tercapai. <br/> Awali resonansi dengan sapaan hangat.</p>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={timeLeft <= 0 ? "Sesi chat telah berakhir" : "Tulis pesan keselarasan..."}
          className="chat-input"
          disabled={timeLeft <= 0}
        />
        <button type="submit" className="chat-send-btn" disabled={timeLeft <= 0}>
          <Send size={20} style={{ transform: 'translateX(2px)' }} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
