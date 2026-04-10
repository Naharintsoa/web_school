/**
 * Observations / absences / retards du bulletin par élève et trimestre.
 * GET  /api/bulletin-remarks/:studentId/:term
 * PUT  /api/bulletin-remarks/:studentId/:term   { observation, mention, absences, demiJournees, retards }
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function rowToRemark(row) {
  return {
    studentId:    row.student_id,
    term:         row.term,
    observation:  row.observation  ?? '',
    mention:      row.mention      ?? '',
    absences:     row.absences     ?? '',
    demiJournees: row.demi_journees ?? '',
    retards:      row.retards      ?? '',
  };
}

// GET /api/bulletin-remarks/:studentId/:term
router.get('/:studentId/:term', async (req, res) => {
  const { studentId, term } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bulletin_remarks WHERE student_id = $1 AND term = $2`,
      [studentId, Number(term)]
    );
    if (rows.length === 0) return res.json(null);
    return res.json(rowToRemark(rows[0]));
  } catch (err) {
    console.error('Erreur lecture remarque bulletin:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/bulletin-remarks/batch  { studentIds: [...], term }
// Retourne toutes les remarques pour une liste d'élèves et un trimestre
router.post('/batch', async (req, res) => {
  const { studentIds, term } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.json([]);
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bulletin_remarks WHERE student_id = ANY($1) AND term = $2`,
      [studentIds, Number(term)]
    );
    return res.json(rows.map(rowToRemark));
  } catch (err) {
    console.error('Erreur lecture remarques batch:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/bulletin-remarks/:studentId/:term  (upsert)
router.put('/:studentId/:term', async (req, res) => {
  const { studentId, term } = req.params;
  const { observation = '', mention = '', absences = '', demiJournees = '', retards = '' } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO bulletin_remarks (student_id, term, observation, mention, absences, demi_journees, retards)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (student_id, term) DO UPDATE SET
         observation   = EXCLUDED.observation,
         mention       = EXCLUDED.mention,
         absences      = EXCLUDED.absences,
         demi_journees = EXCLUDED.demi_journees,
         retards       = EXCLUDED.retards,
         updated_at    = NOW()
       RETURNING *`,
      [studentId, Number(term), observation, mention, absences, demiJournees, retards]
    );
    return res.json(rowToRemark(rows[0]));
  } catch (err) {
    console.error('Erreur sauvegarde remarque bulletin:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
