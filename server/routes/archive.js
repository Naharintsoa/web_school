/**
 * Routes archive
 * GET    /api/archive
 * POST   /api/archive
 * DELETE /api/archive/:studentId
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function rowToArchived(row) {
  return {
    student: row.student,
    archivedAt: row.archived_at instanceof Date
      ? row.archived_at.toISOString()
      : row.archived_at,
    reason: row.reason ?? undefined,
  };
}

// ─── GET /api/archive ─────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM archive ORDER BY archived_at DESC'
    );
    return res.json(rows.map(rowToArchived));
  } catch (err) {
    console.error('Erreur récupération archive:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/archive ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { student, reason } = req.body;
  if (!student || !student.id) {
    return res.status(400).json({ message: 'Données élève manquantes.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO archive (student_id, student, archived_at, reason)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (student_id) DO UPDATE SET
         student     = EXCLUDED.student,
         archived_at = EXCLUDED.archived_at,
         reason      = EXCLUDED.reason
       RETURNING *`,
      [student.id, JSON.stringify(student), reason ?? null]
    );
    return res.status(201).json(rowToArchived(rows[0]));
  } catch (err) {
    console.error('Erreur archivage:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/archive/:studentId ──────────────────────────────────────────
router.delete('/:studentId', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM archive WHERE student_id = $1',
      [req.params.studentId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Élève archivé introuvable.' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur restauration élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
