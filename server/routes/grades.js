/**
 * Routes notes
 * GET  /api/grades
 * GET  /api/grades/student/:studentId
 * POST /api/grades  (upsert)
 * DELETE /api/grades/:id
 * DELETE /api/grades?studentId=&subjectId=&term=
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function rowToGrade(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    teacherName: row.teacher_name,
    term: row.term,
    score: row.score !== null ? Number(row.score) : null,
    coefficient: Number(row.coefficient),
    classAverage: row.class_average !== null ? Number(row.class_average) : null,
    minScore: row.min_score !== null ? Number(row.min_score) : null,
    maxScore: row.max_score !== null ? Number(row.max_score) : null,
    comments: row.comments,
  };
}

// ─── GET /api/grades ──────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM grades ORDER BY student_id, term, subject_name'
    );
    return res.json(rows.map(rowToGrade));
  } catch (err) {
    console.error('Erreur récupération notes:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── GET /api/grades/student/:studentId ───────────────────────────────────────
router.get('/student/:studentId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM grades WHERE student_id = $1 ORDER BY term, subject_name',
      [req.params.studentId]
    );
    return res.json(rows.map(rowToGrade));
  } catch (err) {
    console.error('Erreur récupération notes élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/grades (upsert) ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const g = req.body;
  const id = g.id || `grade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO grades
         (id, student_id, subject_id, subject_name, teacher_name,
          term, score, coefficient, class_average, min_score, max_score, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (student_id, subject_id, term) DO UPDATE SET
         id            = EXCLUDED.id,
         subject_name  = EXCLUDED.subject_name,
         teacher_name  = EXCLUDED.teacher_name,
         score         = EXCLUDED.score,
         coefficient   = EXCLUDED.coefficient,
         class_average = EXCLUDED.class_average,
         min_score     = EXCLUDED.min_score,
         max_score     = EXCLUDED.max_score,
         comments      = EXCLUDED.comments
       RETURNING *`,
      [
        id,
        g.studentId,
        g.subjectId,
        g.subjectName,
        g.teacherName ?? null,
        g.term,
        g.score ?? null,
        g.coefficient ?? 1,
        g.classAverage ?? null,
        g.minScore ?? null,
        g.maxScore ?? null,
        g.comments ?? null,
      ]
    );
    return res.status(200).json(rowToGrade(rows[0]));
  } catch (err) {
    console.error('Erreur upsert note:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/grades/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM grades WHERE id = $1',
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Note introuvable.' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression note:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/grades?studentId=&subjectId=&term= ───────────────────────────
router.delete('/', async (req, res) => {
  const { studentId, subjectId, term } = req.query;
  if (!studentId || !subjectId || !term) {
    return res.status(400).json({ message: 'studentId, subjectId et term sont requis.' });
  }
  try {
    await pool.query(
      'DELETE FROM grades WHERE student_id = $1 AND subject_id = $2 AND term = $3',
      [studentId, subjectId, Number(term)]
    );
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression note composite:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
