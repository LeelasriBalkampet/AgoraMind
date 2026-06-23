import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function DashboardHub() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    wisdomScore: 0,
    streak: 0,
    timeSpent: "0m",
    topicsStudied: 0,
    totalSessions: 0,
    xp: 0,
    nextLevelXp: 5000
  });

  const [weakAreas, setWeakAreas] = useState([]);

  const [timeframe, setTimeframe] = useState('weekly');
  const [historicalData, setHistoricalData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetch(`/api/stats/${user.username}`)
      .then(res => res.json())
      .then(data => {
        const dbStats = data.stats;
        setStats({
          wisdomScore: dbStats.wisdomScore,
          streak: dbStats.streak,
          timeSpent: dbStats.timeSpent,
          topicsStudied: dbStats.topicsStudied,
          totalSessions: dbStats.totalSessions || 0,
          xp: dbStats.xp,
          nextLevelXp: Math.max(5000, Math.ceil(dbStats.xp / 5000) * 5000)
        });
        
        if (data.allHistoricalData) {
          setHistoricalData(data.allHistoricalData);
        }
        if (data.weakAreas) {
          setWeakAreas(data.weakAreas);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load stats", err);
        setIsLoading(false);
      });
  }, [user]);

  const badges = [
    { name: "Curious Thinker", icon: "🥉", color: "from-orange-400 to-red-400", locked: stats.xp < 1000 },
    { name: "Critical Reasoner", icon: "🥈", color: "from-gray-300 to-gray-500", locked: stats.xp < 3000 },
    { name: "Master Learner", icon: "🥇", color: "from-yellow-300 to-yellow-600", locked: stats.xp < 5000 },
  ];

  const level = Math.floor(stats.xp / 500) + 1;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agora-accent"></div>
      </div>
    );
  }

  const getChartData = () => {
    let grouped = {};
    
    const today = new Date();
    let startDate = new Date();
    
    if (historicalData.length > 0) {
      const earliest = new Date(Math.min(...historicalData.map(d => new Date(d.date))));
      startDate = new Date(earliest);
    }
    
    // Ensure minimum range
    if (timeframe === 'weekly') {
      const minStart = new Date();
      minStart.setDate(minStart.getDate() - 6);
      if (startDate > minStart) startDate = minStart;
    } else if (timeframe === 'monthly') {
      const minStart = new Date();
      minStart.setMonth(minStart.getMonth() - 5);
      if (startDate > minStart) startDate = minStart;
    } else if (timeframe === 'yearly') {
      const minStart = new Date();
      minStart.setFullYear(minStart.getFullYear() - 2);
      if (startDate > minStart) startDate = minStart;
    }

    let curr = new Date(today);
    curr.setHours(12, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    while (curr >= startDate) {
      let key = "";
      let label = "";

      if (timeframe === 'weekly') {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        key = `${yyyy}-${mm}-${dd}`;
        label = `${dd}/${mm}`;
        grouped[key] = { label, time: 0, sortKey: key };
        curr.setDate(curr.getDate() - 1);
      } else if (timeframe === 'monthly') {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        key = `${yyyy}-${mm}`;
        label = `${mm}/${yyyy}`;
        grouped[key] = { label, time: 0, sortKey: key };
        curr.setMonth(curr.getMonth() - 1);
      } else if (timeframe === 'yearly') {
        const yyyy = curr.getFullYear();
        key = `${yyyy}`;
        label = key;
        grouped[key] = { label, time: 0, sortKey: key };
        curr.setFullYear(curr.getFullYear() - 1);
      }
    }

    historicalData.forEach(item => {
      const date = new Date(item.date);
      let key = "";
      if (timeframe === 'weekly') {
        key = item.date;
      } else if (timeframe === 'monthly') {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        key = `${year}-${month}`;
      } else if (timeframe === 'yearly') {
        key = `${date.getFullYear()}`;
      }
      if (grouped[key]) {
        grouped[key].time += item.time;
      }
    });

    return Object.values(grouped).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  };

  const chartData = getChartData();
  const maxTime = Math.max(...(chartData.length > 0 ? chartData.map(d => d.time) : [0]), 60);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Welcome, {user?.username || 'Student'}!</h1>
          <p className="text-agora-muted mt-1">Track your progress and mastery on your Learning Dashboard.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-xs text-agora-muted font-bold uppercase tracking-wider">Streak</div>
            <div className="text-lg font-bold text-white leading-tight">{stats.streak} Days</div>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Time Learning", value: stats.timeSpent, icon: "⏱️" },
          { label: "Total Sessions", value: stats.totalSessions, icon: "📚" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-5 rounded-2xl flex flex-col justify-between"
          >
            <div className="text-agora-text/60 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="flex items-end justify-between">
              <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-2xl opacity-80">{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Graph Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Time Spent Analysis</h2>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-agora-muted focus:ring-0 cursor-pointer"
            >
              <option value="weekly" className="bg-[#0f172a]">Weekly</option>
              <option value="monthly" className="bg-[#0f172a]">Monthly</option>
              <option value="yearly" className="bg-[#0f172a]">Yearly</option>
            </select>
          </div>
          
          {/* Custom CSS Horizontal Bar Chart (Vertical Scroll) */}
          <div className="relative h-72 w-full pt-4 rounded-xl border border-white/10 bg-black/20 overflow-y-auto custom-scrollbar p-4">
            <div className="flex flex-col gap-4">
              {chartData.map((row, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  {/* Label (e.g. 23/06 or 06/2026) */}
                  <div className="w-16 shrink-0 text-sm text-agora-muted font-bold text-right tracking-wider">
                    {row.label}
                  </div>
                  
                  {/* Bar Container */}
                  <div className="flex-1 h-8 bg-black/40 rounded-md relative overflow-hidden flex items-center">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.time / maxTime) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.02 }}
                      className="h-full bg-gradient-to-r from-agora-accent/40 to-agora-accent/80 rounded-r-md border border-agora-accent/50 border-l-0 group-hover:from-agora-accent/60 group-hover:to-indigo-400 transition-colors"
                      style={{ minWidth: row.time > 0 ? '4px' : '0px' }}
                    />
                  </div>

                  {/* Value */}
                  <div className="w-12 shrink-0 text-sm text-white font-bold">
                    {row.time}m
                  </div>
                </div>
              ))}
              {chartData.length === 0 && (
                <div className="text-center text-agora-muted py-8 text-sm">No historical data available.</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weak Topics Section */}
      <div className="mt-8 glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Areas for Improvement</h2>
        {weakAreas.length === 0 ? (
          <div className="text-agora-muted bg-white/5 p-6 rounded-2xl text-center border border-white/5">
            You don't have any weak areas right now. Great job!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weakAreas.map((area, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-white mb-1">{area.topic}</h3>
                  <p className="text-sm text-agora-muted leading-snug mb-4">{area.concept}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agora-accent">
                    Needs Review
                  </span>
                  <span className="text-xs text-agora-muted bg-white/5 px-2 py-1 rounded-md">
                    {area.frequency} misses
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
