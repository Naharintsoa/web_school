/**
 * Routes rôles (protégé auth + permission admin:roles)
 * GET    /api/roles
 * POST   /api/roles
 * PUT    /api/roles/:id
 * DELETE /api/roles/:id
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function checkAdminRoles(req, res) {
  const { isSuperAdmin, permissions } = req.user;
  if (!isSuperAdmin && !permissions.includes('admin:roles')) {
    res.status(403).json({ message: 'Permission insuffisante.' });
    return false;
  }
  return true;
}

function rowToRole(row) {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    permissions: Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions),
    isSystem: row.is_system,
  };
}

// ─── GET /api/roles ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  if (!checkAdminRoles(req, res)) return;
  try {
    const { rows } = await pool.query('SELECT * FROM roles ORDER BY name');
    return res.json(rows.map(rowToRole));
  } catch (err) {
    console.error('Erreur récupération rôles:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/roles ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!checkAdminRoles(req, res)) return;
  const { name, label, permissions } = req.body;
  if (!name || !label) {
    return res.status(400).json({ message: 'Nom et libellé requis.' });
  }
  const safeName = name.toLowerCase().replace(/\s+/g, '_');
  const id = `role-${Date.now()}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO roles (id, name, label, permissions, is_system)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING *`,
      [id, safeName, label, JSON.stringify(permissions ?? [])]
    );
    return res.status(201).json(rowToRole(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Un rôle avec ce nom existe déjà.' });
    }
    console.error('Erreur création rôle:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/roles/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  if (!checkAdminRoles(req, res)) return;
  const { id } = req.params;
  const { label, permissions } = req.body;

  if (id === 'super_admin') {
    return res.status(403).json({ message: 'Le rôle super administrateur ne peut pas être modifié.' });
  }

  try {
    const { rows: existing } = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Rôle introuvable.' });
    }
    const role = existing[0];
    const { rows } = await pool.query(
      `UPDATE roles SET label = $1, permissions = $2 WHERE id = $3 RETURNING *`,
      [
        label ?? role.label,
        JSON.stringify(permissions ?? (Array.isArray(role.permissions) ? role.permissions : JSON.parse(role.permissions))),
        id,
      ]
    );
    return res.json(rowToRole(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour rôle:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/roles/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  if (!checkAdminRoles(req, res)) return;
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query('SELECT is_system FROM roles WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Rôle introuvable.' });
    }
    if (existing[0].is_system) {
      return res.status(403).json({ message: 'Les rôles système ne peuvent pas être supprimés.' });
    }
    // Vérifier si des utilisateurs utilisent ce rôle
    const { rows: usersWithRole } = await pool.query(
      'SELECT id FROM users WHERE role_id = $1 LIMIT 1',
      [id]
    );
    if (usersWithRole.length > 0) {
      return res.status(409).json({
        message: 'Ce rôle est utilisé par des utilisateurs. Veuillez les réassigner avant de supprimer.',
      });
    }
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression rôle:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
