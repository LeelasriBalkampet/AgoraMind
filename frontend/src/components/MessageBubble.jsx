import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const { id, role, content, timestamp } = message;
  const isTutor = role === 'tutor' || role === 'assistant';
  const timeStr = useMemo(() => formatTime(timestamp), [timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 w-full items-end ${isTutor ? 'justify-start' : 'justify-end'}`}
      id={`message-${id}`}
    >
      {/* Tutor Avatar */}
      {isTutor && (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 shadow-sm border border-white/20 mb-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-agora-accent">
             <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div 
        className={`max-w-[75%] p-5 relative break-words shadow-sm ${
          isTutor 
            ? 'glass-panel rounded-2xl rounded-bl-sm text-agora-text' 
            : 'bg-agora-accent/80 backdrop-blur-xl rounded-2xl rounded-br-sm text-white font-medium shadow-md border border-white/10'
        }`}
      >
        <p className="text-[14px] leading-[1.6] whitespace-pre-wrap">{content}</p>
        {timeStr && (
          <time className={`absolute bottom-3 right-4 text-[10px] font-medium opacity-50`}>
            {timeStr}
          </time>
        )}
      </div>
    </motion.div>
  );
}
