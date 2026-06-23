import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function WeakAreasPage() {
  const { user } = useAuth();
  const [weakAreas, setWeakAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetch(`/api/weak-areas/${user.username}`)
      .then(res => res.json())
      .then(data => {
        const areas = (data.weakAreas || []).map(area => {
          const hash = String(area.concept || area.topic).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const variance = hash % 10;
          // If a topic is flagged as weak, it shouldn't have a high confidence score.
          // Start the base score at 50, and subtract 15 for every subsequent time it's flagged.
          const baseScore = Math.max(5, 50 - ((area.frequency - 1) * 15));
          const confidence = Math.max(5, baseScore - variance);

          return {
            topic: area.concept || area.topic, // use concept as main title if available
            category: area.topic,
            confidence: confidence,
            frequency: area.frequency
          };
        });
        setWeakAreas(areas);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load weak areas", err);
        setIsLoading(false);
      });
  }, [user]);

  // Sort by lowest confidence first
  const sortedAreas = [...weakAreas].sort((a, b) => a.confidence - b.confidence);
  
  const avgConfidence = weakAreas.length > 0 
    ? Math.round(weakAreas.reduce((sum, a) => sum + a.confidence, 0) / weakAreas.length)
    : 100;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full text-agora-text flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agora-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full text-agora-text space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Weak Areas Analysis</h1>
          <p className="text-agora-muted mt-1">Concepts identified by your mentor that need more attention.</p>
        </div>
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="text-[10px] text-agora-muted font-bold uppercase tracking-wider">Average Confidence</div>
            <div className="text-xl font-bold text-white">{avgConfidence}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          {sortedAreas.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-agora-muted">
              You have no weak areas identified yet! Keep practicing to let the AI analyze your skills.
            </div>
          ) : (
            sortedAreas.map((area, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors"
              >
                {/* Background gradient based on confidence */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl transition-all duration-500"
                  style={{ 
                    backgroundColor: area.confidence < 40 ? '#ef4444' : area.confidence < 60 ? '#f59e0b' : '#3b82f6',
                    opacity: 0.8
                  }}
                ></div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 ml-2">
                  <div>
                    <div className="text-[10px] font-bold text-agora-muted uppercase tracking-wider mb-1">{area.category}</div>
                    <h3 className="text-lg font-bold text-white">{area.topic}</h3>
                  </div>
                  
                  <div className="flex flex-col items-end min-w-[120px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white">{area.confidence}%</span>
                      <span className="text-xs text-agora-muted uppercase tracking-wider">Confidence</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${area.confidence}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        className="h-full rounded-full"
                        style={{ 
                          backgroundColor: area.confidence < 40 ? '#ef4444' : area.confidence < 60 ? '#f59e0b' : '#3b82f6'
                        }}
                      />
                    </div>
                    
                    <Link 
                      to={`/app/flashcards?topic=${encodeURIComponent(area.category)}&concept=${encodeURIComponent(area.topic)}`}
                      className="w-full text-center px-3 py-2 bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/30 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#6366f1]/20 transition-colors"
                    >
                      Practice Flashcards
                    </Link>
                  </div>
                </div>


              </motion.div>
            ))
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-6">


          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">How is this calculated?</h3>
            <p className="text-xs text-agora-muted leading-relaxed">
              Your mentor AI constantly evaluates your responses. Struggling to explain a concept, taking too long, or falling into logical traps lowers your confidence score for that specific topic.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
