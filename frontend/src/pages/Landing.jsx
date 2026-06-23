import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { title: "Socratic Method", desc: "We don't give you the answer. We guide you to find it yourself through targeted questioning.", icon: "🧠" },
    { title: "Adaptive Learning", desc: "The AI adapts its questioning style based on your current understanding and weak areas.", icon: "📈" },
    { title: "Voice Interactive", desc: "Engage in full voice conversations that feel like talking to a real, futuristic mentor.", icon: "🎙️" },
    { title: "Gamified Progress", desc: "Earn XP, badges, and track your Wisdom Score as you master new concepts.", icon: "🏆" },
  ];

  const steps = [
    { num: "01", title: "Pick a Topic", desc: "Choose from Mathematics, Physics, Programming, and more." },
    { num: "02", title: "Face a Challenge", desc: "The mentor presents a problem or concept to explore." },
    { num: "03", title: "Engage in Dialogue", desc: "Answer questions, explain your reasoning, and learn deeply." },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-agora-bg text-agora-text overflow-x-hidden selection:bg-agora-accent/30 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6]  flex items-center justify-center text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-wide text-white">AgoraMind</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-agora-text/80 hover:text-white transition-colors">Log in</Link>
              <button 
                onClick={() => navigate('/signup')}
                className="px-4 py-2 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
              >
                Start Learning
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-screen text-center">
        {/* Background glow elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8b5cf6]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl z-10"
        >
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-agora-accent/30 bg-agora-accent/10 text-agora-accent text-xs font-bold tracking-widest uppercase">
            The Socratic AI Mentor
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight leading-tight mb-8">
            Learn Through Questions,<br />Not Answers.
          </h1>
          <p className="text-lg md:text-xl text-agora-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            True understanding comes from struggling with the material, not just reading the solution. AgoraMind guides your thinking with an AI tutor that acts like a strict, brilliant professor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 rounded-full bg-white text-black text-lg font-bold hover:scale-105 transition-transform  w-full sm:w-auto"
            >
              Get Started for Free
            </button>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white text-lg font-bold hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              See How it Works
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why AgoraMind?</h2>
            <p className="text-agora-muted">A completely new paradigm for online education.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-agora-accent/30 transition-colors group"
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-agora-text/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 relative z-10 bg-black/30 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-agora-muted">Three simple steps to mastery.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-between relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-agora-accent/30 to-transparent -translate-y-1/2 z-0"></div>
            
            {steps.map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex-1 relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#1A1C28] border border-white/10 flex items-center justify-center text-xl font-bold text-agora-accent mb-6 shadow-xl">
                  {s.num}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-agora-text/70 max-w-[250px]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">What Students Say</h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="glass-panel p-8 rounded-2xl relative">
              <div className="text-agora-accent/20 absolute top-4 left-4 text-6xl font-serif">"</div>
              <p className="text-agora-text/90 relative z-10 italic mb-6">"I thought I knew React until AgoraMind grilled me on how useEffect actually works under the hood. It felt like a real technical interview. Incredible."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50"></div>
                <div>
                  <div className="font-bold text-white text-sm">Sarah Jenkins</div>
                  <div className="text-xs text-agora-muted">CS Student</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl relative">
              <div className="text-agora-accent/20 absolute top-4 left-4 text-6xl font-serif">"</div>
              <p className="text-agora-text/90 relative z-10 italic mb-6">"The voice mode is insane. I put on my headphones and debated ethics with 'Socrates'. I actually forgot I was talking to an AI."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50"></div>
                <div>
                  <div className="font-bold text-white text-sm">David Chen</div>
                  <div className="text-xs text-agora-muted">Philosophy Major</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-sm text-agora-muted">
        <p>© 2026 AgoraMind. All rights reserved.</p>
      </footer>

    </div>
  );
}
