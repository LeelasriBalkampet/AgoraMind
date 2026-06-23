import React from 'react';
import './ModeToggle.css';

/* Inline SVG icons — no icon library needed */
const KeyboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
  </svg>
);

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

export default function ModeToggle({ mode, onToggle }) {
  return (
    <div className="mode-toggle" role="radiogroup" aria-label="Input mode">
      <button
        id="mode-text"
        className={`mode-toggle-btn ${mode === 'text' ? 'mode-toggle-btn--active' : ''}`}
        onClick={() => onToggle('text')}
        role="radio"
        aria-checked={mode === 'text'}
        title="Text input"
      >
        <KeyboardIcon />
        <span>Text</span>
      </button>

      <button
        id="mode-voice"
        className={`mode-toggle-btn ${mode === 'voice' ? 'mode-toggle-btn--active' : ''}`}
        onClick={() => onToggle('voice')}
        role="radio"
        aria-checked={mode === 'voice'}
        title="Voice input"
      >
        <MicIcon />
        <span>Voice</span>
      </button>

      {/* Sliding pill indicator */}
      <div
        className="mode-toggle-indicator"
        style={{ transform: mode === 'voice' ? 'translateX(100%)' : 'translateX(0)' }}
        aria-hidden="true"
      />
    </div>
  );
}
