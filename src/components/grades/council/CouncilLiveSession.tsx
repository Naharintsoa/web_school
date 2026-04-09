/**
 * CouncilLiveSession — vue projetée (administrateur / chef d'établissement).
 *
 * - Affiche le QR code pour que les professeurs rejoignent
 * - Navigation ← → entre les élèves
 * - Liste des participants connectés en temps réel
 * - Remarques par élève en temps réel
 */
import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, Users, ChevronLeft, ChevronRight, MessageSquare,
  Wifi, WifiOff, LogOut,
} from 'lucide-react';
import { getSocket, disconnectSocket } from '../../../services/councilSocket';
import type { CouncilSession } from '../../../services/councilSocket';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function CouncilLiveSession({ sessionId, onClose }: Props) {
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const remarkRef = useRef<HTMLTextAreaElement>(null);

  // Construire l'URL QR avec l'IP LAN réelle (pas localhost)
  useEffect(() => {
    const buildUrl = async () => {
      let base = window.location.origin;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const res = await fetch('/api/council-sessions/server-info');
          const data = await res.json();
          const port = window.location.port || '80';
          base = `${window.location.protocol}//${data.ip}:${port}`;
        } catch {
          // fallback : localhost (fonctionne si même machine)
        }
      }
      setJoinUrl(`${base}/conseil/${sessionId}`);
    };
    buildUrl();
  }, [sessionId]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setConnected(true);
      // L'admin rejoint en tant qu'organisateur
      socket.emit('join-council', { sessionId, name: 'Organisateur', role: 'admin' });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('council-state', (s: CouncilSession) => setSession(s));

    socket.on('council-error', (msg: string) => setError(msg));

    if (socket.connected) {
      setConnected(true);
      socket.emit('join-council', { sessionId, name: 'Organisateur', role: 'admin' });
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('council-state');
      socket.off('council-error');
    };
  }, [sessionId]);

  const navigate = (dir: -1 | 1) => {
    if (!session) return;
    const next = session.currentStudentIndex + dir;
    getSocket().emit('set-student', { sessionId, index: next });
  };

  const closeSession = () => {
    getSocket().emit('close-session', { sessionId });
    disconnectSocket();
    onClose();
  };

  const currentStudent = session?.students[session.currentStudentIndex];
  const currentRemarks = currentStudent ? (session?.remarks[currentStudent.id] ?? []) : [];
  const total = session?.students.length ?? 0;

  // ── Phase fermée ──────────────────────────────────────────────────────────
  if (session?.phase === 'closed') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 text-white text-center p-6">
        <div>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Session terminée</h2>
          <p className="text-slate-400 mb-6">La session de conseil a été clôturée.</p>
          <button onClick={onClose} className="px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col overflow-hidden">

      {/* ── Barre supérieure ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          {connected
            ? <Wifi size={16} className="text-emerald-400" />
            : <WifiOff size={16} className="text-red-400 animate-pulse" />
          }
          <span className="text-white font-semibold text-sm">
            Conseil — {session?.grade ?? '…'} — T{session?.term ?? '…'}
          </span>
          {session && (
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
              <Users size={11} className="inline mr-1" />
              {session.participants.length} connecté{session.participants.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={closeSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
          >
            <LogOut size={13} /> Clôturer
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-900/50 text-red-300 text-sm text-center">{error}</div>
      )}

      {/* ── Corps principal ── */}
      <div className="flex-1 overflow-hidden flex gap-0">

        {/* ─ Colonne gauche : QR + participants ─ */}
        <div className="w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto">

          {/* QR Code */}
          <div className="p-4 border-b border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3 text-center">
              Scanner pour rejoindre
            </p>
            <div className="bg-white rounded-xl p-3 mx-auto w-fit">
              <QRCodeSVG value={joinUrl} size={156} level="M" />
            </div>
            <p className="text-xs text-slate-500 text-center mt-2 break-all">{joinUrl}</p>
          </div>

          {/* Participants */}
          <div className="flex-1 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
              Participants ({session?.participants.length ?? 0})
            </p>
            {session?.participants.length === 0 && (
              <p className="text-xs text-slate-500 italic">En attente…</p>
            )}
            <ul className="space-y-1.5">
              {session?.participants.map(p => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    p.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="truncate">{p.name}</span>
                  {p.role !== 'admin' && (
                    <span className="text-xs text-slate-500 flex-shrink-0">{p.role}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─ Zone centrale : élève courant ─ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {!session && (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Connexion en cours…
              </div>
            </div>
          )}

          {session && (
            <>
              {/* Navigation */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex-shrink-0">
                <button
                  onClick={() => navigate(-1)}
                  disabled={session.currentStudentIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft size={18} /> Précédent
                </button>

                <div className="text-center">
                  <span className="text-slate-400 text-sm">
                    Élève {session.currentStudentIndex + 1} / {total}
                  </span>
                </div>

                <button
                  onClick={() => navigate(1)}
                  disabled={session.currentStudentIndex >= total - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                >
                  Suivant <ChevronRight size={18} />
                </button>
              </div>

              {/* Infos élève */}
              {currentStudent ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Card élève */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl p-6 text-center border border-indigo-700/40">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                      {currentStudent.firstName[0]}{currentStudent.lastName[0]}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {currentStudent.firstName} {currentStudent.lastName}
                    </h2>
                    {currentStudent.matricule && (
                      <p className="text-indigo-300 text-sm mt-1">#{currentStudent.matricule}</p>
                    )}
                    {currentStudent.avg > 0 && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full">
                        <span className="text-slate-300 text-sm">Moyenne</span>
                        <span className={`text-lg font-bold ${
                          currentStudent.avg >= 14 ? 'text-emerald-400' :
                          currentStudent.avg >= 10 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {currentStudent.avg.toFixed(2)}/20
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remarques */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-700/50">
                      <MessageSquare size={15} className="text-indigo-400" />
                      <span className="text-sm font-semibold text-white">
                        Remarques ({currentRemarks.length})
                      </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                      {currentRemarks.length === 0 && (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                          Aucune remarque pour cet élève.
                        </p>
                      )}
                      {currentRemarks.map((r, i) => (
                        <div key={i} className="bg-slate-700/50 rounded-lg px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-indigo-300">{r.author}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(r.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <p className="text-sm">Aucun élève dans cette session.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─ Colonne droite : liste des élèves ─ */}
        <div className="w-52 flex-shrink-0 bg-slate-800 border-l border-slate-700 overflow-y-auto">
          <div className="px-3 py-3 border-b border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Élèves</p>
          </div>
          <ul>
            {session?.students.map((s, i) => {
              const isCurrent = i === session.currentStudentIndex;
              const hasRemarks = (session.remarks[s.id]?.length ?? 0) > 0;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => getSocket().emit('set-student', { sessionId, index: i })}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-5 text-right flex-shrink-0 font-mono opacity-50">{i + 1}</span>
                    <span className="truncate flex-1">{s.firstName} {s.lastName}</span>
                    {hasRemarks && (
                      <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-indigo-400'}`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Pied : saisie remarque admin ── */}
      {session && currentStudent && (
        <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 px-4 py-3 flex gap-3">
          <textarea
            ref={remarkRef}
            rows={2}
            placeholder="Ajouter une remarque pour cet élève (Entrée pour valider)…"
            className="flex-1 bg-slate-700 text-white text-sm rounded-xl px-4 py-2.5 resize-none placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-600"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = remarkRef.current?.value ?? '';
                if (text.trim()) {
                  getSocket().emit('add-remark', { sessionId, studentId: currentStudent.id, text });
                  if (remarkRef.current) remarkRef.current.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const text = remarkRef.current?.value ?? '';
              if (text.trim()) {
                getSocket().emit('add-remark', { sessionId, studentId: currentStudent.id, text });
                if (remarkRef.current) remarkRef.current.value = '';
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl flex-shrink-0"
          >
            Envoyer
          </button>
        </div>
      )}
    </div>
  );
}
