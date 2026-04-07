
import React from 'react';

const Avatar = ({ seed, size = 40, src }) => {
  if (src) {
    return (
      <img 
        src={src} 
        alt="Avatar" 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          border: '2px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          flexShrink: 0
        }} 
      />
    );
  }

  // Simple hash for deterministic color
  const getStringHash = (str) => {
    let hash = 0;
    if (!str) return 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const colors = [
    ['#E0006F', '#FF81B8'], // Jodoo Magenta
    ['#7C3AED', '#C084FC'], // Purple
    ['#2563EB', '#60A5FA'], // Blue
    ['#059669', '#34D399'], // Green
    ['#D97706', '#FBBF24'], // Amber
  ];

  const hash = getStringHash(seed || 'jodoo');
  const palette = colors[Math.abs(hash) % colors.length];

  return (
    <div 
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        flexShrink: 0,
        textTransform: 'uppercase',
        border: '2px solid white'
      }}
    >
      {seed?.charAt(0) || 'J'}
    </div>
  );
};

export default Avatar;
