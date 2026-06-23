import React from 'react';
import './LoadingIndicator.css';

export default function LoadingIndicator() {
  return (
    <div className="loading-bubble" role="status" aria-label="Tutor is thinking">
      <div className="loading-avatar" aria-hidden="true">🎓</div>
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      <span className="visually-hidden">Tutor is thinking…</span>
    </div>
  );
}
