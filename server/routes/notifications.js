/**
 * Notifications en temps réel — Server-Sent Events (SSE)
 * GET /api/notifications/stream  (superadmin uniquement)
 *
 * broadcastLoginEvent() est appelé depuis auth.js à chaque connexion réussie.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Connexions SSE actives des superadmins
const clients = new Set();

// ─── GET /api/notifications/stream ───────────────────────────────────────────
router.get('/stream', requireAuth, (req, res) => {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Réservé au superadmin' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx : désactiver le buffering
  res.flushHeaders();

  // Ping toutes les 30 s pour garder la connexion ouverte
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 30_000);

  clients.add(res);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});

// ─── Diffuser un événement de connexion à tous les superadmins connectés ─────
export function broadcastLoginEvent(loginInfo) {
  if (clients.size === 0) return;
  const payload = `data: ${JSON.stringify(loginInfo)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

export default router;
