/**
 * Routes matières — CRUD complet, isolé par établissement (school).
 * GET    /api/subjects?school=sully
 * POST   /api/subjects          { name, coefficient, teacherName, school }
 * PUT    /api/subjects/:id      { name, coefficient, teacherName }
 * DELETE /api/subjects/:id
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function rowToSubject(row) {
  return {
    id: row.id,
    name: row.name,
    coefficient: Number(row.coefficient),
    teacherName: row.teacher_name ?? '',
    school: row.school ?? 'sully',
  };
}

// GET /api/subjects?school=sully
router.get('/', async (req, res) => {
  try {
    const { school } = req.query;
    const { rows } = school
      ? await pool.query('SELECT * FROM subjects WHERE school = $1 ORDER BY name', [school])
      : await pool.query('SELECT * FROM subjects ORDER BY name');
    return res.json(rows.map(rowToSubject));
  } catch (err) {
    console.error('Erreur récupération matières:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/subjects
router.post('/', async (req, res) => {
  const { name, coefficient, teacherName, school } = req.body;
  const id = `subj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO subjects (id, name, coefficient, teacher_name, school)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, coefficient ?? 1, teacherName ?? null, school ?? 'sully']
    );
    return res.status(201).json(rowToSubject(rows[0]));
  } catch (err) {
    console.error('Erreur création matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
  const { name, coefficient, teacherName } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE subjects SET name=$1, coefficient=$2, teacher_name=$3 WHERE id=$4 RETURNING *`,
      [name, coefficient ?? 1, teacherName ?? null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Matière introuvable.' });
    return res.json(rowToSubject(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Matière introuvable.' });
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
