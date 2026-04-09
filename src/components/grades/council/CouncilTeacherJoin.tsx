/**
 * CouncilTeacherJoin — vue mobile pour les professeurs.
 * Accessible via /conseil/:sessionId sans authentification.
 * Rejoindre automatiquement à l'ouverture du lien.
 */
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket, disconnectSocket } from '../../../services/councilSocket';
import type { CouncilSession } from '../../../services/councilSocket';
import { MessageSquare, Send, Users, Wifi, WifiOff } from 'lucide-react';

export function CouncilTeacherJoin() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [closed, setClosed]   = useState(false);
  const [error, setError]     = useState('');
  const [connected, setConnected] = useState(false);
  const [remark, setRemark]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Connexion et rejoindre automatiquement sans formulaire
  useEffect(() => {
    const socket = getSocket();

    const join = () => {
      setConnected(true);
      socket.emit('join-council', { sessionId, name: 'Participant', role: 'Professeur' });
    };

    if (socket.connected) {
      join();
    } else {
      socket.on('connect', join);
    }

    socket.on('disconnect', () => setConnected(false));

    socket.on('council-state', (s: CouncilSession) => {
      setSession(s);
      if (s.phase === 'closed') setClosed(true);
    });

    socket.on('council-error', (msg: string) => setError(msg));

    return () => {
      socket.off('connect', join);
      socket.off('disconnect');
      socket.off('council-state');
      socket.off('council-error');
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll vers les nouvelles remarques
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.remarks]);

  const handleSendRemark = () => {
    const text = remark.trim();
    if (!text || !currentStudent) return;
    getSocket().emit('add-remark', { sessionId, studentId: currentStudent.id, text });
    setRemark('');
  };

  const currentStudent = session ? session.students[session.currentStudentIndex] : null;
  const currentRemarks = currentStudent ? (session?.remarks[currentStudent.id] ?? []) : [];

  // ── Session clôturée ──────────────────────────────────────────────────────
  if (closed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center p-6">
        <div>
          <div className="text-5xl mb-4">🏁</div>
          <h2 className="text-xl font-bold mb-2">Session terminée</h2>
          <p className="text-slate-400 text-sm">Le conseil de classe est clôturé. Merci.</p>
        </div>
      </div>
    );
  }

  // ── Erreur (session introuvable, etc.) ────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center p-6">
        <div>
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Impossible de rejoindre</h2>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Chargement / en attente de connexion ──────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Connexion au conseil en cours…</p>
        </div>
      </div>
    );
  }

  // ── Vue session ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div>
          <p className="font-semibold text-sm">{session.grade} — Trimestre {session.term}</p>
          <div className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? 'En direct' : 'Reconnexion…'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users size={13} />
          {session.participants.length} participant{session.participants.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Élève courant */}
      <div className="flex-shrink-0 bg-gradient-to-br from-indigo-900 to-slate-800 px-4 py-5 border-b border-slate-700">
        {currentStudent ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {currentStudent.firstName[0]}{currentStudent.lastName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-indigo-300 mb-0.5">
                Élève {(session.currentStudentIndex) + 1} / {session.students.length}
              </div>
              <h2 className="text-lg font-bold leading-tight truncate">
                {currentStudent.firstName} {currentStudent.lastName}
              </h2>
              {currentStudent.avg > 0 && (
                <span className={`text-sm font-semibold ${
                  currentStudent.avg >= 14 ? 'text-emerald-400' :
                  currentStudent.avg >= 10 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {currentStudent.avg.toFixed(2)}/20
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center">En attente du démarrage…</p>
        )}
      </div>

      {/* Remarques */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Remarques ({currentRemarks.length})
          </span>
        </div>

        {currentRemarks.length === 0 && (
          <p className="text-sm text-slate-500 italic text-center py-6">
            Aucune remarque pour cet élève.
          </p>
        )}

        {currentRemarks.map((r, i) => (
          <div key={i} className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-indigo-300">{r.author}</span>
              <span className="text-xs text-slate-500">
                {new Date(r.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{r.text}</p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Saisie remarque */}
      {currentStudent && (
        <div className="flex-shrink-0 px-4 py-3 bg-slate-800 border-t border-slate-700 flex gap-2 items-end">
          <textarea
            value={remark}
            onChange={e => setRemark(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendRemark();
              }
            }}
            rows={2}
            placeholder="Votre remarque sur cet élève…"
            className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-xl px-4 py-2.5 resize-none placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSendRemark}
            disabled={!remark.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 flex-shrink-0"
          >
            <Send size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
