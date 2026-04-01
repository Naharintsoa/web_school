/**
 * Routes élèves — CRUD complet
 * Toutes les routes sont protégées par requireAuth.
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ─── Mapping DB → camelCase ───────────────────────────────────────────────────
function rowToStudent(row) {
  return {
    id: row.id,
    studentNumber: row.student_number,
    matricule: row.matricule,
    firstName: row.first_name,
    lastName: row.last_name,
    commonName: row.common_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    grade: row.grade,
    cycle: row.cycle,
    photoUrl: row.photo_url,
    issNumber: row.iss_number,
    parentInfo: row.parent_info ?? {},
    enrollmentDate: row.enrollment_date,
    schoolYear: row.school_year,
  };
}

// ─── GET /api/students ────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM students ORDER BY last_name, first_name'
    );
    return res.json(rows.map(rowToStudent));
  } catch (err) {
    console.error('Erreur récupération élèves:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/students ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const s = req.body;
  const id = `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO students
         (id, student_number, matricule, first_name, last_name, common_name,
          date_of_birth, gender, grade, cycle, photo_url, iss_number,
          parent_info, enrollment_date, school_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        id,
        s.studentNumber ?? null,
        s.matricule ?? null,
        s.firstName,
        s.lastName,
        s.commonName ?? null,
        s.dateOfBirth ?? null,
        s.gender ?? null,
        s.grade ?? null,
        s.cycle ?? null,
        s.photoUrl ?? null,
        s.issNumber ?? null,
        JSON.stringify(s.parentInfo ?? {}),
        s.enrollmentDate ?? null,
        s.schoolYear ?? null,
      ]
    );
    return res.status(201).json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur création élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/students/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE students SET
         student_number  = $1,
         matricule       = $2,
         first_name      = $3,
         last_name       = $4,
         common_name     = $5,
         date_of_birth   = $6,
         gender          = $7,
         grade           = $8,
         cycle           = $9,
         photo_url       = $10,
         iss_number      = $11,
         parent_info     = $12,
         enrollment_date = $13,
         school_year     = $14
       WHERE id = $15
       RETURNING *`,
      [
        s.studentNumber ?? null,
        s.matricule ?? null,
        s.firstName,
        s.lastName,
        s.commonName ?? null,
        s.dateOfBirth ?? null,
        s.gender ?? null,
        s.grade ?? null,
        s.cycle ?? null,
        s.photoUrl ?? null,
        s.issNumber ?? null,
        JSON.stringify(s.parentInfo ?? {}),
        s.enrollmentDate ?? null,
        s.schoolYear ?? null,
        id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Élève introuvable.' });
    }
    return res.json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/students/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM students WHERE id = $1',
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Élève introuvable.' });
    }
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
