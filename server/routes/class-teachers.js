/**
 * Professeurs principaux par classe.
 * GET  /api/class-teachers?school=sully&grade=6EME
 * PUT  /api/class-teachers/:school/:grade  { teacherName }
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { school, grade } = req.query;
  try {
    if (school && grade) {
      const { rows } = await pool.query(
        `SELECT teacher_name FROM class_teachers WHERE school = $1 AND grade = $2`,
        [school, grade]
      );
      return res.json({ teacherName: rows[0]?.teacher_name ?? '' });
    }
    const { rows } = school
      ? await pool.query(`SELECT * FROM class_teachers WHERE school = $1`, [school])
      : await pool.query(`SELECT * FROM class_teachers`);
    return res.json(rows.map(r => ({ school: r.school, grade: r.grade, teacherName: r.teacher_name })));
  } catch (err) {
    console.error('Erreur lecture prof principal:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:school/:grade', async (req, res) => {
  const { school, grade } = req.params;
  const { teacherName = '' } = req.body;
  try {
    await pool.query(
      `INSERT INTO class_teachers (school, grade, teacher_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (school, grade) DO UPDATE SET teacher_name = EXCLUDED.teacher_name`,
      [school, grade, teacherName.trim()]
    );
    return res.json({ school, grade, teacherName: teacherName.trim() });
  } catch (err) {
    console.error('Erreur mise à jour prof principal:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
