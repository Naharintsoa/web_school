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
    id:          row.id,
    name:        row.name,
    coefficient: Number(row.coefficient),
    teacherName: row.teacher_name ?? '',
    school:      row.school ?? 'sully',
    grade:       row.grade ?? null,
  };
}

/**
 * GET /api/subjects?school=sully[&grade=3EME]
 *
 * Sans ?grade : retourne toutes les matières de l'école (vue Professeurs).
 *
 * Avec ?grade=3EME : retourne UNE ligne par matière (nom normalisé),
 *   en préférant l'entrée spécifique à cette classe (grade='3EME')
 *   sur l'entrée générique (grade IS NULL).
 *   → Garantit le bon professeur par classe sur les bulletins.
 */
router.get('/', async (req, res) => {
  try {
    const { school, grade } = req.query;

    if (grade) {
      // Résolution prof par classe :
      // DISTINCT ON (nom normalisé) + ORDER BY classe spécifique en premier
      const { rows } = await pool.query(
        `SELECT DISTINCT ON (UPPER(TRIM(name)))
                id, name, coefficient, teacher_name, school, grade
         FROM   subjects
         WHERE  school = $1
           AND  (grade IS NULL OR grade = $2)
         ORDER  BY UPPER(TRIM(name)),
                   (grade IS NOT NULL) DESC`,   -- classe spécifique avant générique
        [school ?? 'sully', grade]
      );
      return res.json(rows.map(rowToSubject));
    }

    // Vue globale (gestion des professeurs)
    const { rows } = school
      ? await pool.query(
          'SELECT * FROM subjects WHERE school = $1 ORDER BY name, COALESCE(grade,\'\')',
          [school]
        )
      : await pool.query(
          'SELECT * FROM subjects ORDER BY name, COALESCE(grade,\'\')'
        );
    return res.json(rows.map(rowToSubject));
  } catch (err) {
    console.error('Erreur récupération matières:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/subjects
router.post('/', async (req, res) => {
  const { name, coefficient, teacherName, school } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Le nom de la matière est requis.' });

  const normalizedName = name.trim().toUpperCase();
  const targetSchool = school ?? 'sully';
  const id = `subj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    // Vérification doublon (insensible à la casse)
    const { rows: existing } = await pool.query(
      `SELECT id FROM subjects WHERE UPPER(TRIM(name)) = $1 AND school = $2`,
      [normalizedName, targetSchool]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: `La matière "${normalizedName}" existe déjà dans cet établissement.` });
    }

    const { rows } = await pool.query(
      `INSERT INTO subjects (id, name, coefficient, teacher_name, school)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, normalizedName, coefficient ?? 1, teacherName?.trim() || null, targetSchool]
    );
    return res.status(201).json(rowToSubject(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `La matière "${normalizedName}" existe déjà dans cet établissement.` });
    }
    console.error('Erreur création matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
  const { name, coefficient, teacherName } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Le nom de la matière est requis.' });

  const normalizedName = name.trim().toUpperCase();

  try {
    // Vérifier doublon sur le nom (exclure la matière en cours d'édition)
    const { rows: existing } = await pool.query(
      `SELECT id FROM subjects WHERE UPPER(TRIM(name)) = $1 AND school = (SELECT school FROM subjects WHERE id = $2) AND id <> $2`,
      [normalizedName, req.params.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: `Une autre matière nommée "${normalizedName}" existe déjà dans cet établissement.` });
    }

    const { rows } = await pool.query(
      `UPDATE subjects SET name=$1, coefficient=$2, teacher_name=$3 WHERE id=$4 RETURNING *`,
      [normalizedName, coefficient ?? 1, teacherName?.trim() || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Matière introuvable.' });
    return res.json(rowToSubject(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `Une autre matière nommée "${normalizedName}" existe déjà dans cet établissement.` });
    }
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
