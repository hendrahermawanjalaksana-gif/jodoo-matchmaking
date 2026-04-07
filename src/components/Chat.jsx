
import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from "lucide-react";
import { sendMessage } from "../matchmaking";
import Avatar from "./Avatar";

const Chat = ({ sessionId, userId, session, onToast, timeLeft }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const filterMessage = (text) => {
    const patterns = [
      /\b(\+?62|0)8[1-9][0-9]{7,10}\b/, // Indonesian phone numbers
      /\b\d{9,}\b/, // Any sequence of 9+ digits (likely phone or WA)
      /wa\.me/i,
      /api\.whatsapp/i,
      /instagram\.com/i,
      /tiktok\.com/i,
      /facebook\.com/i,
      /twitter\.com/i,
      /t\.me/i, // Telegram
      /@\w+/, // Social handles
    ];
    return patterns.some(p => p.test(text));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (filterMessage(text)) {
      onToast("Demi keamanan, berbagi kontak pribadi (No HP/WA/Sosmed) tidak diperbolehkan.", "warning");
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
        {session?.messages?.length > 0 ? (
          session.messages.map((m) => (
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
          placeholder="Tulis pesan keselarasan..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          <Send size={20} style={{ transform: 'translateX(2px)' }} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
