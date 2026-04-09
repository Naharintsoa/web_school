import { Router } from 'express';
import { createSession, getSession, deleteSession } from '../councilSessions.js';

const router = Router();

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
