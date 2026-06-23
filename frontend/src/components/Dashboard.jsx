import React from 'react';

export default function Dashboard({ stats }) {
  if (!stats) return null;

  const score = stats.mastery_score || 0;
  
  const getStage = (s) => {
    if (s <= 20) return "Novice Thinker";
    if (s <= 40) return "Curious Learner";
    if (s <= 60) return "Analytical Scholar";
    if (s <= 80) return "Independent Reasoner";
    return "Master Philosopher";
  };

  return (
    <div className="flex flex-col gap-5 mt-auto">
      {/* Wisdom Score & Learning Stage */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-agora-text/80 text-[11px] font-semibold tracking-wider uppercase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span>Wisdom Score</span>
          </div>
          <span className="font-bold text-sm">{score}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-agora-text rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        
        <div className="text-[11px] text-agora-accent font-medium mt-1">
          Current Stage: <span className="text-white font-semibold">{getStage(score)}</span>
        </div>
      </div>

      {/* Exchanges */}
      <div className="flex items-end gap-2 text-agora-text/80 text-[11px] font-semibold tracking-wider uppercase">
        <span>Exchanges</span>
        <span className="font-bold text-3xl text-agora-text leading-none">{stats.message_count || 0}</span>
      </div>

      {/* Growth Areas */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center gap-1.5 text-agora-text/80 text-[11px] font-semibold tracking-wider uppercase">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Growth Areas</span>
        </div>
        {stats.weak_areas?.length > 0 ? (
          <ul className="text-[11px] text-agora-text/90 font-medium leading-relaxed list-disc pl-4 space-y-1">
            {stats.weak_areas.map((area, idx) => (
              <li key={idx}>{typeof area === 'string' ? area : (area.concept || area.topic || 'Unknown')}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-agora-text/60 italic font-medium leading-relaxed">
            None identified yet.
          </p>
        )}
      </div>

      {/* Mentor Guidance */}
      <div className="mt-2 glass-panel rounded-xl p-4 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-agora-accent"></div>
        <h4 className="text-[10px] font-bold text-agora-accent tracking-wider mb-2 uppercase">Mentor Guidance</h4>
        <p className="text-[11.5px] text-agora-text/90 font-medium leading-relaxed">
          {stats.recommendation || "Engage in dialogue to receive mentor guidance."}
        </p>
      </div>
    </div>
  );
}
