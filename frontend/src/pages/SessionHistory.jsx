import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrCreateStudentId } from '../utils/studentId';
import { useAuth } from '../context/AuthContext';
import MessageBubble from '../components/MessageBubble';

const formatLocalTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function SessionHistory() {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const studentId = getOrCreateStudentId();

  useEffect(() => {
    if (selectedSession) {
      fetch(`/api/sessions/${selectedSession.id}/messages`)
        .then(res => res.json())
        .then(data => setSessionMessages(data.messages || []))
        .catch(console.error);
    } else {
      setSessionMessages([]);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (!user) return;
    
    fetch(`/api/sessions/${user.username}?student_id=${studentId}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sessions", err);
        setIsLoading(false);
      });
  }, [user]);

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this chat?")) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}?student_id=${user.username}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) setSelectedSession(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    if (!selectedSession) return;
    
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Session Export - AgoraMind</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; padding: 40px; }
      h1 { font-size: 28px; margin-bottom: 5px; color: #000; }
      .meta { color: #555; font-size: 14px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #ddd; }
      h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-size: 15px; color: #1e293b; }
      .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; font-size: 15px; border: 1px solid #e2e8f0; }
      .student { background: #eff6ff; margin-left: 15%; border-color: #bfdbfe; }
      .tutor { background: #f1f5f9; margin-right: 15%; }
      .role { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; color: #64748b; }
    `);
    printWindow.document.write('</style></head><body>');
    
    printWindow.document.write(`<h1>${selectedSession.topic}</h1>`);
    printWindow.document.write(`<div class="meta">${formatLocalTime(selectedSession.date)} &nbsp;•&nbsp; Mentor: ${selectedSession.mentor}</div>`);
    
    printWindow.document.write(`<h3>AI Session Summary</h3>`);
    printWindow.document.write(`<div class="summary">${selectedSession.summary}</div>`);
    
    printWindow.document.write(`<h3>Chat Transcript</h3>`);
    sessionMessages.forEach(msg => {
      const isStudent = msg.role === 'student';
      const cssClass = isStudent ? 'student' : 'tutor';
      const roleName = isStudent ? (user?.username || 'Student') : selectedSession.mentor;
      printWindow.document.write(`
        <div class="message ${cssClass}">
          <div class="role">${roleName}</div>
          <div>${msg.content.replace(/\\n/g, '<br/>')}</div>
        </div>
      `);
    });
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleResume = (sessionId) => {
    navigate('/app/chat', { state: { sessionId } });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-agora-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-agora-text h-full flex flex-col pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Session History</h1>
        <p className="text-agora-muted mt-1">Review your past dialogues and track your progress.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 h-full min-h-0 mt-4">
        
        {/* Session List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-4 scrollbar-hide">
          {sessions.length === 0 ? (
            <div className="text-agora-muted text-center p-8 bg-white/5 rounded-2xl border border-white/5">
              No sessions yet. Start a conversation with the AI!
            </div>
          ) : (
            sessions.map((session) => (
              <motion.div 
                key={session.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedSession(session)}
                className={`p-5 rounded-2xl cursor-pointer border transition-colors ${selectedSession?.id === session.id ? 'bg-agora-accent/10 border-agora-accent ' : 'glass-panel border-white/10 hover:border-white/20'}`}
              >
                <div className="text-xs text-agora-muted font-medium mb-2">{formatLocalTime(session.date)}</div>
                <h3 className="text-lg font-bold text-white mb-4 leading-snug">{session.topic}</h3>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-agora-text/60">
                  <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {session.duration}</span>
                  <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> {session.questionsAsked} Qs</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Session Details */}
        <div className="w-full md:w-2/3 glass-panel border border-[#27272a] rounded-2xl p-4 md:p-8 flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <motion.div 
                key={selectedSession.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6 border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">{selectedSession.topic}</h2>
                    <p className="text-sm text-agora-muted tracking-wide">{formatLocalTime(selectedSession.date)} &nbsp;•&nbsp; Mentor: {selectedSession.mentor}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={handleExportPDF}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Export PDF
                    </button>
                    <button 
                      onClick={() => handleResume(selectedSession.id)}
                      className="px-4 py-2 bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20 rounded-xl text-sm font-semibold hover:bg-[#6366f1]/20 transition-colors"
                    >
                      Resume Chat
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedSession.id)}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Summary */}
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-agora-muted mb-4 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      AI Session Summary
                    </h3>
                    <div className="text-[15px] text-agora-text leading-loose bg-white/5 p-6 rounded-2xl border border-white/10 whitespace-pre-wrap shadow-inner">
                      {selectedSession.summary}
                    </div>
                  </div>

                  {/* Chat History */}
                  <div className="mt-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-agora-muted mb-6 flex items-center gap-2 border-t border-white/5 pt-8">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      Chat Transcript
                    </h3>
                    <div className="flex flex-col gap-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                      {sessionMessages.length === 0 ? (
                        <div className="text-center text-agora-muted py-4">No messages found for this session.</div>
                      ) : (
                        sessionMessages.map(msg => (
                          <MessageBubble key={msg.id} message={msg} />
                        ))
                      )}
                    </div>
                  </div>



                </div>

              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-agora-muted opacity-50">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <p>Select a session to view details.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
