import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('agoramind_token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch admin stats");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center h-full text-red-400">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Overview</h1>
          <p className="text-agora-muted mt-1">Global platform statistics across all students.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl border border-red-500/20  relative overflow-hidden"
        >
          <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Total Registered Users</div>
          <div className="text-4xl font-black text-white">{stats.global.total_users}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-orange-500/20  relative overflow-hidden"
        >
          <div className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Total Sessions</div>
          <div className="text-4xl font-black text-white">{stats.global.total_sessions}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-blue-500/20  relative overflow-hidden"
        >
          <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Total Time Learnt</div>
          <div className="text-4xl font-black text-white">{stats.global.total_time_learnt} <span className="text-xl text-agora-muted font-medium">mins</span></div>
        </motion.div>
      </div>

      {/* Global Weak Areas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 md:p-8 rounded-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          Global Weak Areas (Top 10)
        </h2>

        {stats.global.weak_topics.length === 0 ? (
          <div className="text-center py-10 text-agora-muted">No weak areas identified system-wide yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.global.weak_topics.map((area, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <div>
                  <div className="text-sm font-bold text-white">{area.topic}</div>
                  <div className="text-xs text-agora-muted">{area.concept}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black text-red-400">{area.count}</span>
                  <span className="text-[10px] uppercase tracking-wider text-agora-muted">students struggling</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Individual User Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-6 md:p-8 rounded-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Individual User Statistics
        </h2>

        {stats.users.length === 0 ? (
          <div className="text-center py-10 text-agora-muted">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-agora-muted">Username</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-agora-muted">Sessions</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-agora-muted">Time Spent</th>
                  <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-agora-muted">Top Weak Areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.users.map((user, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">{user.username}</td>
                    <td className="py-4 px-4 text-white">{user.total_sessions}</td>
                    <td className="py-4 px-4 text-white">{user.time_spent}</td>
                    <td className="py-4 px-4">
                      {user.weak_topics.length === 0 ? (
                        <span className="text-agora-muted text-sm">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.weak_topics.map((wt, j) => (
                            <span key={j} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-1 rounded-md" title={wt.concept}>
                              {wt.topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </div>
  );
}
