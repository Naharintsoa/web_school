/**
 * CouncilTeacherJoin — vue mobile pour les professeurs.
 * Accessible via /conseil/:sessionId sans authentification.
 *
 * Étapes :
 *  1. Saisir son nom + rôle → rejoindre la session
 *  2. Voir l'élève courant + ajouter des remarques en temps réel
 */
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket, disconnectSocket } from '../../../services/councilSocket';
import type { CouncilSession } from '../../../services/councilSocket';
import { MessageSquare, Send, Users, Wifi, WifiOff } from 'lucide-react';

const ROLES = ['Professeur', 'Professeur principal', 'Directeur', 'Surveillant', 'Autre'];

export function CouncilTeacherJoin() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep]         = useState<'form' | 'session' | 'closed'>('form');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState('Professeur');
  const [session, setSession]   = useState<CouncilSession | null>(null);
  const [error, setError]       = useState('');
  const [connected, setConnected] = useState(false);
  const [remark, setRemark]     = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    if (socket.connected) setConnected(true);

    socket.on('council-state', (s: CouncilSession) => {
      setSession(s);
      if (s.phase === 'closed') setStep('closed');
      else if (step === 'form') {} // still on form
      else setStep('session');
    });

    socket.on('council-error', (msg: string) => setError(msg));

    return () => {
      socket.off('connect');
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

  const handleJoin = () => {
    if (!name.trim()) { setError('Veuillez saisir votre nom.'); return; }
    setError('');
    const socket = getSocket();
    socket.emit('join-council', { sessionId, name: name.trim(), role });
    setStep('session');
  };

  const handleSendRemark = () => {
    const text = remark.trim();
    if (!text || !session) return;
    setSending(true);
    getSocket().emit('add-remark', {
      sessionId,
      studentId: currentStudent?.id,
      text,
    });
    setRemark('');
    setSending(false);
  };

  const currentStudent = session ? session.students[session.currentStudentIndex] : null;
  const currentRemarks = currentStudent ? (session?.remarks[currentStudent.id] ?? []) : [];

  // ── Styles communs ─────────────────────────────────────────────────────────
  const pageClass = 'min-h-screen bg-slate-900 text-white flex flex-col';

  // ── Session clôturée ──────────────────────────────────────────────────────
  if (step === 'closed') {
    return (
      <div className={`${pageClass} items-center justify-center text-center p-6`}>
        <div className="text-5xl mb-4">🏁</div>
        <h2 className="text-xl font-bold mb-2">Session terminée</h2>
        <p className="text-slate-400 text-sm">Le conseil de classe est clôturé. Merci pour votre participation.</p>
      </div>
    );
  }

  // ── Formulaire d'entrée ───────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className={`${pageClass} items-center justify-center p-6`}>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🏫</div>
            <h1 className="text-2xl font-bold">Conseil de classe</h1>
            <p className="text-slate-400 text-sm mt-1">Rejoindre la session en cours</p>
            <div className={`flex items-center justify-center gap-1.5 mt-2 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? 'Connecté' : 'Connexion…'}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Votre nom</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Ex : RAZAFY Jean"
                autoFocus
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">Rôle</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!connected}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50"
          >
            Rejoindre le conseil
          </button>
        </div>
      </div>
    );
  }

  // ── Vue session ───────────────────────────────────────────────────────────
  return (
    <div className={pageClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div>
          <p className="font-semibold text-sm">{session?.grade} — T{session?.term}</p>
          <div className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? 'En direct' : 'Reconnexion…'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users size={13} />
          {session?.participants.length ?? 0} participant{(session?.participants.length ?? 0) > 1 ? 's' : ''}
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
                Élève {(session?.currentStudentIndex ?? 0) + 1} / {session?.students.length}
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
          <p className="text-slate-400 text-sm text-center">En attente…</p>
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
            Aucune remarque pour cet élève.<br />Soyez le premier à en ajouter.
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
            disabled={sending || !remark.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 flex-shrink-0"
          >
            <Send size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
