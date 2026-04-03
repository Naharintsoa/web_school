/**
 * Routes élèves — CRUD complet + gestion des fratries
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

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
    nationality: row.nationality ?? undefined,
    birthCity: row.birth_city ?? undefined,
    birthCountry: row.birth_country ?? undefined,
    grade: row.grade,
    cycle: row.cycle,
    photoUrl: row.photo_url,
    issNumber: row.iss_number,
    exitDate: row.exit_date ?? undefined,
    status: row.status ?? 'actif',
    familyId: row.family_id ?? undefined,
    parentInfo: row.parent_info ?? {},
    enrollmentDate: row.enrollment_date,
    schoolYear: row.school_year,
  };
}

async function resolveFamily(parentInfo, excludeId) {
  const fp = (parentInfo?.fatherPhone ?? '').trim();
  const mp = (parentInfo?.motherPhone ?? '').trim();
  const fn = (parentInfo?.fatherName ?? '').trim();
  const mn = (parentInfo?.motherName ?? '').trim();

  if (fp || mp) {
    const conditions = [];
    const params = [];
    if (fp) { params.push(fp); conditions.push("parent_info->>'fatherPhone' = $" + params.length); }
    if (mp) { params.push(mp); conditions.push("parent_info->>'motherPhone' = $" + params.length); }
    if (excludeId) params.push(excludeId);
    const excl = excludeId ? ' AND id != $' + params.length : '';
    const { rows } = await pool.query(
      'SELECT family_id FROM students WHERE (' + conditions.join(' OR ') + ') AND family_id IS NOT NULL' + excl + ' LIMIT 1',
      params
    );
    if (rows.length > 0) return rows[0].family_id;
  }

  if (fn && mn) {
    const params = [fn.toLowerCase(), mn.toLowerCase()];
    if (excludeId) params.push(excludeId);
    const excl = excludeId ? ' AND id != $3' : '';
    const { rows } = await pool.query(
      "SELECT family_id FROM students WHERE LOWER(parent_info->>'fatherName') = $1 AND LOWER(parent_info->>'motherName') = $2 AND family_id IS NOT NULL" + excl + ' LIMIT 1',
      params
    );
    if (rows.length > 0) return rows[0].family_id;
  }

  return null;
}

function newFamilyId() {
  return 'family-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM students';
    const params = [];
    if (year) {
      query += ' WHERE school_year = $1';
      params.push(year);
    }
    query += ' ORDER BY last_name, first_name';
    const { rows } = await pool.query(query, params);
    return res.json(rows.map(rowToStudent));
  } catch (err) {
    console.error('Erreur récupération élèves:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/family/:familyId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM students WHERE family_id = $1 ORDER BY last_name, first_name',
      [req.params.familyId]
    );
    return res.json(rows.map(rowToStudent));
  } catch (err) {
    console.error('Erreur récupération fratries:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Élève introuvable.' });
    return res.json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur récupération élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/', async (req, res) => {
  const s = req.body;
  const id = 'student-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  let familyId = await resolveFamily(s.parentInfo, null);
  if (!familyId) familyId = newFamilyId();
  try {
    const { rows } = await pool.query(
      'INSERT INTO students (id,student_number,matricule,first_name,last_name,common_name,date_of_birth,gender,nationality,birth_city,birth_country,grade,cycle,photo_url,iss_number,exit_date,status,family_id,parent_info,enrollment_date,school_year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *',
      [id, s.studentNumber??null, s.matricule??null, s.firstName, s.lastName, s.commonName??null, s.dateOfBirth??null, s.gender??null, s.nationality??null, s.birthCity??null, s.birthCountry??null, s.grade??null, s.cycle??null, s.photoUrl??null, s.issNumber??null, s.exitDate??null, s.status??'actif', familyId, JSON.stringify(s.parentInfo??{}), s.enrollmentDate??null, s.schoolYear??null]
    );
    return res.status(201).json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur création élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  let familyId = await resolveFamily(s.parentInfo, id);
  if (!familyId) {
    const { rows: cur } = await pool.query('SELECT family_id FROM students WHERE id = $1', [id]);
    familyId = cur[0]?.family_id ?? newFamilyId();
  }
  try {
    const { rows } = await pool.query(
      'UPDATE students SET student_number=$1,matricule=$2,first_name=$3,last_name=$4,common_name=$5,date_of_birth=$6,gender=$7,nationality=$8,birth_city=$9,birth_country=$10,grade=$11,cycle=$12,photo_url=$13,iss_number=$14,exit_date=$15,status=$16,family_id=$17,parent_info=$18,enrollment_date=$19,school_year=$20 WHERE id=$21 RETURNING *',
      [s.studentNumber??null, s.matricule??null, s.firstName, s.lastName, s.commonName??null, s.dateOfBirth??null, s.gender??null, s.nationality??null, s.birthCity??null, s.birthCountry??null, s.grade??null, s.cycle??null, s.photoUrl??null, s.issNumber??null, s.exitDate??null, s.status??'actif', familyId, JSON.stringify(s.parentInfo??{}), s.enrollmentDate??null, s.schoolYear??null, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Élève introuvable.' });
    return res.json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.patch('/:id/family', async (req, res) => {
  const { id } = req.params;
  const resolvedId = req.body.familyId ?? newFamilyId();
  try {
    const { rows } = await pool.query(
      'UPDATE students SET family_id = $1 WHERE id = $2 RETURNING *',
      [resolvedId, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Élève introuvable.' });
    return res.json(rowToStudent(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour famille:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Élève introuvable.' });
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression élève:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /purge-all ──────────────────────────────────────────────────────────
// Supprime TOUS les élèves (et leurs notes en cascade).
// Réservé au super admin — vérifie le mot de passe avant d'exécuter.
router.post('/purge-all', async (req, res) => {
  // 1. Seul le super admin peut déclencher cette action
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: 'Action réservée au Super Administrateur.' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Mot de passe requis.' });
  }

  try {
    // 2. Récupérer le hash du super admin depuis la DB
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_super_admin = TRUE',
      [req.user.userId]
    );
    if (rows.length === 0) {
      return res.status(403).json({ message: 'Compte super admin introuvable.' });
    }

    // 3. Vérifier le mot de passe
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // 4. Compter les élèves avant suppression
    const { rows: countRows } = await pool.query('SELECT COUNT(*) AS total FROM students');
    const total = parseInt(countRows[0].total, 10);

    // 5. Supprimer tous les élèves (grades supprimés en CASCADE via FK)
    await pool.query('DELETE FROM students');

    return res.json({ deleted: total, message: `${total} élève(s) supprimé(s) avec succès.` });
  } catch (err) {
    console.error('Erreur purge-all:', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
});

export default router;
