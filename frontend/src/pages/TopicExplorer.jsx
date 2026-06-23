import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function TopicExplorer() {
  const navigate = useNavigate();

  const topics = [
    { name: "Mathematics", icon: "➗", color: "from-blue-500 to-cyan-500", desc: "Algebra, Calculus, Geometry & more" },
    { name: "Physics", icon: "⚛️", color: "from-purple-500 to-indigo-500", desc: "Mechanics, Quantum, Thermodynamics" },
    { name: "Chemistry", icon: "🧪", color: "from-emerald-500 to-teal-500", desc: "Organic, Inorganic, Physical" },
    { name: "Biology", icon: "🧬", color: "from-green-500 to-lime-500", desc: "Genetics, Anatomy, Evolution" },
    { name: "Programming", icon: "💻", color: "from-gray-700 to-gray-900", desc: "Python, JavaScript, System Design" },
    { name: "Aptitude", icon: "🧩", color: "from-orange-500 to-amber-500", desc: "Logical Reasoning, Quantitative" },
    { name: "Data Structures", icon: "🗄️", color: "from-rose-500 to-red-500", desc: "Trees, Graphs, DP, Algorithms" },
    { name: "Philosophy", icon: "🏛️", color: "from-yellow-600 to-yellow-800", desc: "Ethics, Epistemology, Logic" },
  ];

  const handleSelectTopic = (topic) => {
    navigate('/app/chat', { state: { initialTopic: topic.name } });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Topic Explorer</h1>
        <p className="text-agora-muted">Select a discipline to begin your Socratic dialogue. No need to type.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topics.map((topic, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelectTopic(topic)}
            className="group cursor-pointer relative glass-panel rounded-2xl p-6 overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg hover:"
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${topic.color} opacity-20 group-hover:opacity-40 blur-2xl transition-opacity duration-300`}></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-4xl mb-6 bg-white/5 w-16 h-16 flex items-center justify-center rounded-2xl border border-white/10 group-hover:scale-110 transition-transform origin-left">
                {topic.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{topic.name}</h3>
              <p className="text-sm text-agora-muted leading-relaxed flex-1">{topic.desc}</p>
              
              <div className="mt-6 flex items-center gap-2 text-agora-accent text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <span>Start Session</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
