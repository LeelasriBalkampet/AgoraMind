import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

export default function VoiceTutor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const speakResponse = useCallback((text) => {
    window.speechSynthesis.cancel();
    
    setIsAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US');
    if (goodVoice) utterance.voice = goodVoice;
    
    utterance.pitch = 1;
    utterance.rate = 1.05;

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setTranscript("");
    };
    
    utterance.onerror = () => setIsAiSpeaking(false);
    
    // Add a slight delay after cancel() to prevent browser speech queue bugs
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  const handleWebSocketMessage = useCallback((msg) => {
    if (msg.type === 'tutor_message') {
      setIsThinking(false);
      setTranscript(msg.content);
      speakResponse(msg.content);
    }
  }, [speakResponse]);

  const studentId = user ? user.username : 'anonymous_voice';
  const { sendMessage, isConnected } = useWebSocket(studentId, handleWebSocketMessage);

  const handleTranscription = useCallback((text) => {
    if (text) {
      setTranscript(text);
      setIsListening(false);
      setIsThinking(true);
      
      sendMessage({
        type: 'text',
        content: text,
        personality: 'Socrates'
      });
    }
  }, [sendMessage]);

  const toggleRecording = useCallback(() => {
    if (!isConnected || isAiSpeaking || isThinking) return;
    
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition:", e);
        }
        if (transcriptRef.current.trim()) {
          handleTranscription(transcriptRef.current.trim());
        } else {
          setTranscript("");
        }
        transcriptRef.current = "";
      }
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      
      let finalT = '';
      transcriptRef.current = '';
      setTranscript('');
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let interim = '';
        let currentFinal = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        finalT += currentFinal;
        const currentText = finalT + interim;
        setTranscript(currentText);
        transcriptRef.current = currentText;
      };
      
      recognition.onerror = (event) => {
        console.error(event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim()) {
          handleTranscription(transcriptRef.current.trim());
          transcriptRef.current = "";
        }
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  }, [isConnected, isAiSpeaking, isThinking, isListening, handleTranscription]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0B0E1A] text-white overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none"></div>
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${isAiSpeaking ? 'bg-indigo-500/30' : isThinking ? 'bg-purple-500/20' : isListening ? 'bg-emerald-500/20' : 'bg-blue-500/10'}`}></div>

      {/* Top Bar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Exit Voice Mode
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-agora-muted">
          <span className={`w-2 h-2 rounded-full ${!isConnected ? 'bg-red-500' : isListening ? 'bg-emerald-500 animate-pulse' : isThinking ? 'bg-purple-500 animate-pulse' : isAiSpeaking ? 'bg-indigo-500 animate-pulse' : 'bg-blue-500'}`}></span>
          {!isConnected ? 'Disconnected' : isListening ? 'Listening...' : isThinking ? 'Thinking...' : isAiSpeaking ? 'AI Speaking' : 'Standby'}
        </div>
      </div>

      {/* Center Voice Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-12">
        <div 
          className="relative rounded-full flex items-center justify-center group"
        >
          {/* Listening State: Expanding Waves */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div 
                  initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50 pointer-events-none"
                />
                <motion.div 
                  initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/30 pointer-events-none"
                />
              </>
            )}
          </AnimatePresence>

          {/* Core Orb */}
          <motion.div 
            animate={{ 
              scale: isAiSpeaking ? [1, 1.15, 0.95, 1.1, 1] : isThinking ? [1, 1.05, 1] : isListening ? 1.05 : 1,
              boxShadow: isAiSpeaking 
                ? ["0 0 40px rgba(99,102,241,0.6)", "0 0 80px rgba(99,102,241,1)", "0 0 40px rgba(99,102,241,0.6)"] 
                : isThinking 
                ? "0 0 60px rgba(168,85,247,0.4)"
                : isListening
                ? "0 0 60px rgba(16,185,129,0.5)"
                : "0 0 40px rgba(59,130,246,0.3)"
            }}
            transition={{ 
              duration: isAiSpeaking ? 0.8 : isThinking ? 2 : 0.3, 
              repeat: isAiSpeaking || isThinking ? Infinity : 0,
              ease: "easeInOut"
            }}
            className={`w-48 h-48 rounded-full flex items-center justify-center border-2 backdrop-blur-xl relative overflow-hidden transition-colors duration-500 ${
              isAiSpeaking ? 'bg-indigo-500/20 border-indigo-400/50' 
              : isThinking ? 'bg-purple-500/10 border-purple-400/30'
              : isListening ? 'bg-emerald-500/10 border-emerald-400/50'
              : 'bg-blue-500/10 border-white/10 group-hover:border-white/30'
            }`}
          >
            {/* Thinking State: Rotating Rings */}
            {isThinking && (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-2 border-dashed border-purple-400/50"
              />
            )}

            {/* Inner rings for depth */}
            <div className={`absolute inset-4 rounded-full border transition-colors duration-500 ${isListening ? 'border-emerald-400/20' : 'border-white/5'}`}></div>
            <div className={`absolute inset-8 rounded-full border transition-colors duration-500 ${isListening ? 'border-emerald-400/20' : 'border-white/5'}`}></div>
            
            {/* Center Icon */}
            {isThinking ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 opacity-80">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isAiSpeaking ? 'text-indigo-300' : isListening ? 'text-emerald-300' : 'text-blue-300/80'}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </motion.div>
        </div>
      </div>

      {/* Transcript / Subtitles */}
      <div className="z-10 text-center max-w-3xl px-6 h-32 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {transcript && !isAiSpeaking && (
            <motion.p 
              key={transcript}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl text-white font-medium leading-relaxed drop-shadow-md"
            >
              "{transcript}"
            </motion.p>
          )}
          {isAiSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 h-12"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ height: ["20%", "100%", "20%"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                  className="w-1.5 bg-indigo-400 rounded-full "
                />
              ))}
            </motion.div>
          )}
          {!transcript && !isListening && !isThinking && !isAiSpeaking && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-agora-muted text-lg tracking-wide"
            >
              Tap the mic to begin speaking
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Microphone Control Button */}
      <div className="absolute bottom-10 w-full flex justify-center z-30">
        <button
          onClick={toggleRecording}
          disabled={!isConnected || isAiSpeaking || isThinking}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-2 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 border-red-400/50 text-white ' 
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white hover:scale-105 backdrop-blur-md'
          } ${(!isConnected || isAiSpeaking || isThinking) ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
          aria-label={isListening ? "Stop Speaking" : "Start Speaking"}
        >
          {isListening ? (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect></svg>
          ) : (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          )}
        </button>
      </div>

    </div>
  );
}
