import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Flashcards() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const topic = searchParams.get('topic');
  const concept = searchParams.get('concept');

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!topic || !concept) {
      setError("Missing topic or concept parameters.");
      setIsLoading(false);
      return;
    }

    fetch(`/api/flashcards?topic=${encodeURIComponent(topic)}&concept=${encodeURIComponent(concept)}`)
      .then(res => res.json())
      .then(data => {
        if (data.flashcards && data.flashcards.length > 0) {
          setCards(data.flashcards);
        } else {
          setError("Failed to generate flashcards.");
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Error fetching flashcards.");
        setIsLoading(false);
      });
  }, [topic, concept]);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agora-accent mb-4"></div>
        <p className="text-agora-muted">Generating personalized flashcards...</p>
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full text-agora-text flex flex-col items-center justify-center min-h-[80vh]">
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Practice: {topic}</h1>
        <p className="text-agora-muted">{concept}</p>
      </div>

      <div className="text-agora-muted text-sm mb-4 font-bold tracking-widest uppercase">
        Card {currentIndex + 1} of {cards.length}
      </div>

      {/* 3D Scene Container */}
      <div className="relative w-full max-w-2xl h-80 sm:h-96" style={{ perspective: '1000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full absolute inset-0 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              animate={{ rotateX: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full h-full relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 w-full h-full glass-panel rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 sm:p-12 text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-agora-accent text-xs font-bold uppercase tracking-widest mb-4">Question</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-relaxed">{cards[currentIndex].question}</h2>
                <div className="absolute bottom-6 text-xs text-agora-muted opacity-50">Click to flip</div>
              </div>

              {/* Back */}
              <div 
                className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl border border-indigo-500/30  flex flex-col items-center justify-center p-8 sm:p-12 text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
              >
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Answer</div>
                <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed">{cards[currentIndex].answer}</p>
                <div className="absolute bottom-6 text-xs text-indigo-300 opacity-50">Click to flip back</div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6 mt-12">
        <button 
          onClick={prevCard}
          className="w-12 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          Done
        </button>

        <button 
          onClick={nextCard}
          className="w-12 h-12 rounded-full glass-panel border border-agora-accent/30 bg-agora-accent/10 text-agora-accent flex items-center justify-center hover:bg-agora-accent/20 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

    </div>
  );
}
