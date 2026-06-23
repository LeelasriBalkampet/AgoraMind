import React from 'react';
import { motion } from 'framer-motion';

export default function LearningPath() {
  const roadmap = [
    { id: 1, title: "Variables & Data Types", status: "completed", desc: "Understanding the building blocks of state." },
    { id: 2, title: "Loops & Control Flow", status: "completed", desc: "Making decisions and repeating logic." },
    { id: 3, title: "Functions & Scope", status: "current", desc: "Encapsulating logic for reuse." },
    { id: 4, title: "Arrays & Objects", status: "upcoming", desc: "Working with collections of data." },
    { id: 5, title: "Recursion", status: "upcoming", desc: "Functions that call themselves." },
    { id: 6, title: "Asynchronous Programming", status: "upcoming", desc: "Promises, async/await, and event loops." },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full text-agora-text space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-agora-accent/20 to-transparent p-6 rounded-2xl border border-agora-accent/30">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personalized Path</h1>
          <p className="text-agora-muted mt-1">AI-generated syllabus based on your initial assessment.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-agora-accent uppercase tracking-wider">Current Level</span>
          <span className="text-2xl font-black text-white">Beginner</span>
        </div>
      </div>

      <div className="relative mt-12 pl-4 md:pl-0">
        {/* Vertical Line */}
        <div className="absolute left-[31px] md:left-[50%] top-0 bottom-0 w-1 bg-white/10 -translate-x-1/2 rounded-full"></div>
        <div className="absolute left-[31px] md:left-[50%] top-0 h-[40%] w-1 bg-agora-accent -translate-x-1/2 rounded-full "></div>

        <div className="space-y-12 relative z-10">
          {roadmap.map((node, i) => {
            const isLeft = i % 2 === 0;
            const isCompleted = node.status === 'completed';
            const isCurrent = node.status === 'current';

            return (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col md:flex-row items-start md:items-center w-full ${isLeft ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Content Box */}
                <div className={`w-full md:w-1/2 flex ${isLeft ? 'md:justify-start pl-16 md:pl-8' : 'md:justify-end pl-16 md:pl-0 md:pr-8'}`}>
                  <div className={`p-5 rounded-2xl border w-full max-w-sm transition-all duration-300 ${isCurrent ? 'bg-agora-accent/10 border-agora-accent  scale-105' : isCompleted ? 'glass-panel border-white/10 opacity-80' : 'bg-transparent border-white/5 opacity-50 border-dashed'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-agora-muted">Module {node.id}</span>
                      {isCompleted && <span className="text-green-400">✓</span>}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-agora-accent animate-pulse"></span>}
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isCurrent ? 'text-white' : 'text-agora-text'}`}>{node.title}</h3>
                    <p className="text-sm text-agora-muted leading-relaxed">{node.desc}</p>
                    
                    {isCurrent && (
                      <button className="mt-4 w-full py-2 bg-agora-accent hover:bg-indigo-400 text-white text-sm font-bold rounded-lg transition-colors">
                        Continue Learning
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Node */}
                <div className="absolute left-0 md:relative md:left-auto w-16 h-16 flex items-center justify-center -translate-x-2 md:-translate-x-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-agora-bg z-10 transition-colors ${isCompleted ? 'bg-agora-accent' : isCurrent ? 'bg-white border-agora-accent' : 'bg-gray-800 border-white/10'}`}>
                    {isCompleted && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    {isCurrent && <div className="w-3 h-3 bg-agora-accent rounded-full animate-ping"></div>}
                  </div>
                </div>

                {/* Empty Space for alignment */}
                <div className="hidden md:block w-1/2"></div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
