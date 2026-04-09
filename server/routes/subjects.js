/**
 * Routes matières — CRUD + réordonnancement, isolé par établissement.
 * GET    /api/subjects?school=sully[&grade=3EME]
 * POST   /api/subjects
 * PUT    /api/subjects/:id
 * PATCH  /api/subjects/reorder   { ids: ['id1','id2',...] }
 * DELETE /api/subjects/:id
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function rowToSubject(row) {
  return {
    id:           row.id,
    name:         row.name,
    coefficient:  Number(row.coefficient),
    teacherName:  row.teacher_name ?? '',
    school:       row.school ?? 'sully',
    grade:        row.grade ?? null,
    displayOrder: Number(row.display_order ?? 9999),
  };
}

// ─── GET /api/subjects?school=sully[&grade=3EME] ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { school, grade } = req.query;

    if (grade) {
      // Résolution prof par classe : une seule ligne par matière,
      // en préférant l'entrée spécifique à cette classe sur le fallback générique.
      // Triée par display_order de l'entrée générique (= ordre canonique du bulletin).
      const { rows } = await pool.query(
        `SELECT DISTINCT ON (UPPER(TRIM(name)))
                id, name, coefficient, teacher_name, school, grade, display_order
         FROM   subjects
         WHERE  school = $1
           AND  (grade IS NULL OR grade = $2)
         ORDER  BY UPPER(TRIM(name)),
                   (grade IS NOT NULL) DESC`,
        [school ?? 'sully', grade]
      );
      // Trier ensuite par display_order
      rows.sort((a, b) => Number(a.display_order) - Number(b.display_order));
      return res.json(rows.map(rowToSubject));
    }

    // Vue globale — triée par display_order puis nom
    const { rows } = school
      ? await pool.query(
          `SELECT * FROM subjects WHERE school = $1
           ORDER BY display_order, UPPER(TRIM(name)), COALESCE(grade,'')`,
          [school]
        )
      : await pool.query(
          `SELECT * FROM subjects
           ORDER BY display_order, UPPER(TRIM(name)), COALESCE(grade,'')`
        );
    return res.json(rows.map(rowToSubject));
  } catch (err) {
    console.error('Erreur récupération matières:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PATCH /api/subjects/reorder  { ids: ['id1','id2',...] } ─────────────────
// ids = tableau ordonné des IDs de matières → affecte display_order = index+1
router.patch('/reorder', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids requis (tableau).' });
  }
  try {
    // Mise à jour en une seule passe via unnest
    await pool.query(
      `UPDATE subjects AS s
       SET    display_order = o.ord
       FROM   (SELECT UNNEST($1::text[]) AS id, GENERATE_SERIES(1, $2) AS ord) AS o
       WHERE  s.id = o.id`,
      [ids, ids.length]
    );
    return res.json({ updated: ids.length });
  } catch (err) {
    console.error('Erreur réordonnancement:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/subjects ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, coefficient, teacherName, school, grade } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Le nom de la matière est requis.' });

  const normalizedName = name.trim().toUpperCase();
  const targetSchool   = school ?? 'sully';
  const targetGrade    = grade?.trim().toUpperCase() || null;
  const id = `subj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    // Ordre = max existant + 1 (nouvelle matière en bas de liste)
    const { rows: maxRow } = await pool.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
       FROM subjects WHERE school = $1`,
      [targetSchool]
    );
    const nextOrder = maxRow[0].next_order;

    const { rows } = await pool.query(
      `INSERT INTO subjects (id, name, coefficient, teacher_name, school, grade, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, normalizedName, coefficient ?? 1, teacherName?.trim() || null, targetSchool, targetGrade, nextOrder]
    );
    return res.status(201).json(rowToSubject(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `La matière "${normalizedName}" existe déjà.` });
    }
    console.error('Erreur création matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/subjects/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { name, coefficient, teacherName, grade } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Le nom de la matière est requis.' });

  const normalizedName = name.trim().toUpperCase();
  const targetGrade    = grade?.trim().toUpperCase() || null;

  try {
    const { rows } = await pool.query(
      `UPDATE subjects SET name=$1, coefficient=$2, teacher_name=$3, grade=$4 WHERE id=$5 RETURNING *`,
      [normalizedName, coefficient ?? 1, teacherName?.trim() || null, targetGrade, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Matière introuvable.' });
    return res.json(rowToSubject(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `Une autre matière nommée "${normalizedName}" existe déjà.` });
    }
    console.error('Erreur mise à jour matière:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/subjects/:id ─────────────────────────────────────────────────
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
