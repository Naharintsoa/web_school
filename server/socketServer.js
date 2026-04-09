import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { sessions } from './councilSessions.js';

export function attachSocketIO(app, allowedOrigin) {
  const httpServer = createServer(app);

  const io = new SocketIO(httpServer, {
    cors: {
      origin: allowedOrigin ?? '*',
      credentials: true,
    },
  });

  io.on('connection', socket => {

    // ── Rejoindre une session ─────────────────────────────────────────────
    socket.on('join-council', ({ sessionId, name, role = 'Professeur' }) => {
      const session = sessions.get(sessionId);
      if (!session) {
        socket.emit('council-error', 'Session introuvable ou expirée.');
        return;
      }
      if (session.phase === 'closed') {
        socket.emit('council-error', 'Cette session est terminée.');
        return;
      }

      // Éviter les doublons (reconnexion)
      session.participants = session.participants.filter(p => p.id !== socket.id);
      session.participants.push({
        id: socket.id,
        name: name?.trim() || 'Anonyme',
        role,
        joinedAt: new Date().toISOString(),
      });

      socket.data.sessionId = sessionId;
      socket.data.name = name?.trim() || 'Anonyme';
      socket.join(sessionId);

      if (session.phase === 'waiting') session.phase = 'active';

      io.to(sessionId).emit('council-state', session);
    });

    // ── Changer l'élève affiché ───────────────────────────────────────────
    socket.on('set-student', ({ sessionId, index }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.currentStudentIndex = Math.max(0, Math.min(session.students.length - 1, index));
      io.to(sessionId).emit('council-state', session);
    });

    // ── Ajouter une remarque ──────────────────────────────────────────────
    socket.on('add-remark', ({ sessionId, studentId, text }) => {
      const session = sessions.get(sessionId);
      if (!session || !text?.trim()) return;
      if (!session.remarks[studentId]) session.remarks[studentId] = [];
      session.remarks[studentId].push({
        author: socket.data.name ?? 'Anonyme',
        text: text.trim(),
        at: new Date().toISOString(),
      });
      io.to(sessionId).emit('council-state', session);
    });

    // ── Clôturer la session ───────────────────────────────────────────────
    socket.on('close-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      session.phase = 'closed';
      io.to(sessionId).emit('council-state', session);
    });

    // ── Déconnexion ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const sid = socket.data.sessionId;
      if (!sid) return;
      const session = sessions.get(sid);
      if (!session) return;
      session.participants = session.participants.filter(p => p.id !== socket.id);
      io.to(sid).emit('council-state', session);
    });
  });

  return httpServer;
}
