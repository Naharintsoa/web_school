import { Router } from 'express';
import { networkInterfaces } from 'os';
import { createSession, getSession, deleteSession } from '../councilSessions.js';

/** Retourne la première IP LAN non-loopback IPv4 de la machine */
function getLocalIp() {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of (ifaces ?? [])) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const router = Router();

// GET /api/council-sessions/server-info — IP LAN pour le QR code
router.get('/server-info', (_req, res) => {
  res.json({ ip: getLocalIp() });
});

// POST /api/council-sessions — créer une session
router.post('/', (req, res) => {
  try {
    const { grade, term, schoolYear, students } = req.body;
    if (!grade || !term || !schoolYear) {
      return res.status(400).json({ error: 'grade, term et schoolYear sont obligatoires.' });
    }
    const session = createSession({ grade, term, schoolYear, students });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/council-sessions/:id
router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session introuvable.' });
  res.json(session);
});

// DELETE /api/council-sessions/:id
router.delete('/:id', (req, res) => {
  deleteSession(req.params.id);
  res.json({ ok: true });
});

export default router;
