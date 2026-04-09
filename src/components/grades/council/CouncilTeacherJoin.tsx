/**
 * CouncilTeacherJoin — diaporama en lecture seule pour les participants.
 * Accessible via /conseil/:sessionId sans authentification.
 * Affiche le CouncilDiapo synchronisé en temps réel avec l'admin.
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSocket, disconnectSocket } from '../../../services/councilSocket';
import type { CouncilSession } from '../../../services/councilSocket';
import { CouncilDiapo } from '../CouncilDiapo';
import type { StudentSlide } from '../CouncilDiapo';
import type { Subject } from '../../../types/subject';

export function CouncilTeacherJoin() {
  const location = useLocation();
  const sessionId = location.pathname.split('/conseil/')[1] || '';
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = getSocket();

    const join = () => {
      socket.emit('join-council', { sessionId, name: 'Participant', role: 'Spectateur' });
    };

    if (socket.connected) {
      join();
    } else {
      socket.on('connect', join);
    }

    socket.on('council-state', (s: CouncilSession) => {
      setSession(s);
      if (s.phase === 'closed') setClosed(true);
    });

    socket.on('council-error', (msg: string) => setError(msg));

    return () => {
      socket.off('connect', join);
      socket.off('council-state');
      socket.off('council-error');
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session clôturée ──────────────────────────────────────────────────────
  if (closed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center p-6">
        <div>
          <div className="text-6xl mb-5">🏁</div>
          <h2 className="text-2xl font-bold mb-2">Session terminée</h2>
          <p className="text-slate-400">Le conseil de classe est clôturé. Merci.</p>
        </div>
      </div>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center p-6">
        <div>
          <div className="text-6xl mb-5">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Impossible de rejoindre</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connexion au diaporama…</p>
        </div>
      </div>
    );
  }

  // ── Diaporama en lecture seule (synchronisé avec l'admin) ─────────────────
  if (session.diapoData) {
    const { slides, subjects, classStats, classAvg, isBrevet } = session.diapoData;
    return (
      <CouncilDiapo
        slides={slides as StudentSlide[]}
        subjects={subjects as Subject[]}
        classStats={classStats}
        classAvg={classAvg}
        isBrevet={isBrevet}
        term={session.term}
        grade={session.grade}
        externalIdx={session.currentStudentIndex}
        readOnly
        onClose={() => {}}
      />
    );
  }

  // Fallback si pas de diapoData (session créée sans diaporama)
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center p-6">
      <p className="text-slate-400">Aucun diaporama disponible pour cette session.</p>
    </div>
  );
}
