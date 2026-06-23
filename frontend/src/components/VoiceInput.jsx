import React, { useState, useCallback, useRef } from 'react';
import './VoiceInput.css';

export default function VoiceInput({ onTranscription, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  
  const toggleRecording = useCallback(() => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition. Please use Google Chrome.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setIsProcessing(true);
        onTranscription(text);
        setTimeout(() => setIsProcessing(false), 500);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        setIsProcessing(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, isRecording, onTranscription]);

  const stateClass = isRecording
    ? 'voice-mic-btn--recording'
    : isProcessing
    ? 'voice-mic-btn--processing'
    : '';

  return (
    <button
      id="voice-record-btn"
      className={`voice-mic-btn ${stateClass}`}
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      aria-label={isRecording ? 'Tap to stop' : 'Tap to speak'}
      title={isRecording ? 'Tap to stop' : 'Tap to speak'}
    >
      {isProcessing ? (
        <div className="voice-mic-spinner" aria-hidden="true" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      )}
    </button>
  );
}
