import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import VoiceInput from './VoiceInput';

export default function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  isConnected,
  onTranscription,
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full relative">
      
      {/* ---- Header ---- */}
      <div className="flex justify-between items-center py-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">New Dialogue</h2>
          <p className="text-sm text-agora-muted font-medium">Ask anything to begin</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#A5B4FC] font-medium opacity-80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Never gives the answer</span>
        </div>
      </div>

      {/* ---- Messages Area ---- */}
      <div 
        className="flex-1 overflow-y-auto pb-4 flex flex-col"
        ref={chatAreaRef}
        aria-live="polite"
      >
        <AnimatePresence>
          {!isEmpty && (
            <div className="flex flex-col gap-6 mt-auto w-full max-w-4xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Input Area ---- */}
      <div className="pb-8 pt-4 flex flex-col items-center">
        <div className="w-full max-w-4xl flex items-center glass-panel rounded-full px-4 py-2 transition-colors focus-within:bg-white/5">
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-white text-[15px] outline-none px-4 py-3 placeholder:text-agora-muted"
            placeholder={isConnected ? 'Type your reply, or hold the mic to speak' : 'Awaiting connection...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected || isLoading}
            autoFocus
          />
          <div className="flex items-center gap-3 pr-2">
            <VoiceInput onTranscription={onTranscription} disabled={!isConnected || isLoading} />
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center text-agora-muted hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || !isConnected || isLoading}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-agora-muted font-medium flex items-center gap-1">
          Press <span className="bg-[#2A2B36] border border-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">Enter</span> to send
        </div>
      </div>
    </div>
  );
}
