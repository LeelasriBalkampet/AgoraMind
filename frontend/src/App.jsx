import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getOrCreateStudentId } from './utils/studentId';
import useWebSocket from './hooks/useWebSocket';
import ChatInterface from './components/ChatInterface';
import { useAuth } from './context/AuthContext';

export default function App() {
  const location = useLocation();
  const initialTopic = location.state?.initialTopic || null;
  const sessionId = location.state?.sessionId || null;
  const { user } = useAuth();
  const studentId = useMemo(() => user?.username || getOrCreateStudentId(), [user]);

  const [messages, setMessages] = useState([]);
  const [personality, setPersonality] = useState("Socrates");
  const [stats, setStats] = useState({
    mastery_score: 0,
    messages_count: 0,
    weak_areas: [],
    recommendation: null
  });

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'chat_history') {
      setMessages(data.messages || []);
      // If there's an initial topic from the Topic Explorer and history is empty or we want to start a new chat, 
      // we could inject it here. For now, we'll let the user type it.
    } else if (data.type === 'chat_message') {
      setMessages(prev => {
        if (prev.find(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } else if (data.type === 'tutor_message') {
      setMessages(prev => [
        ...prev, 
        { id: Date.now() + Math.random(), role: 'tutor', content: data.content, timestamp: new Date().toISOString() }
      ]);
      if (data.stats) {
        setStats(prev => ({ ...prev, ...data.stats }));
      }
    } else if (data.type === 'stats_update') {
      setStats(prev => ({ ...prev, ...data.stats }));
    }
  }, []);

  const { isConnected, sendMessage, isLoading } = useWebSocket(
    studentId,
    handleWebSocketMessage,
    sessionId
  );

  const handleSendMessage = (content) => {
    if (!isConnected) return;
    
    const studentMsg = { id: Date.now() + Math.random(), role: 'student', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, studentMsg]);
    
    sendMessage({ type: 'text', content, personality });
  };

  const handleTranscription = (text) => {
    if (text) {
      handleSendMessage(text);
    }
  };

  const personalities = [
    "Socrates",
    "Friendly Teacher",
    "Strict Professor",
    "Interview Coach",
    "Coding Mentor"
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Mentor Chat</h2>
          <p className="text-xs text-agora-muted mt-1">
            {initialTopic ? `Exploring: ${initialTopic}` : "Socratic dialogue with your AI mentor."}
          </p>
        </div>
        
        <div className="relative">
          <select 
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 text-white text-sm font-medium rounded-xl pl-4 pr-10 py-2 outline-none focus:border-agora-accent transition-colors cursor-pointer"
          >
            {personalities.map(p => (
              <option key={p} value={p} className="bg-gray-900">{p}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-agora-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
      
      <ChatInterface 
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        isConnected={isConnected}
        onTranscription={handleTranscription}
      />
    </div>
  );
}
