/**
 * Routes utilisateurs (protégé auth + permission admin:users)
 * GET    /api/users
 * POST   /api/users
 * PUT    /api/users/:id
 * PATCH  /api/users/:id/toggle
 * DELETE /api/users/:id
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function checkAdminUsers(req, res) {
  const { isSuperAdmin, permissions } = req.user;
  if (!isSuperAdmin && !permissions.includes('admin:users')) {
    res.status(403).json({ message: 'Permission insuffisante.' });
    return false;
  }
  return true;
}

function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    roleId: row.role_id,
    isActive: row.is_active,
    isSuperAdmin: row.is_super_admin,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    lastLoginAt: row.last_login_at
      ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at)
      : null,
  };
}

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  if (!checkAdminUsers(req, res)) return;
  try {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, email, role_id, is_active, is_super_admin, created_at, last_login_at FROM users ORDER BY created_at'
    );
    return res.json(rows.map(rowToUser));
  } catch (err) {
    console.error('Erreur récupération utilisateurs:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!checkAdminUsers(req, res)) return;
  const { username, fullName, email, password, roleId } = req.body;
  if (!username || !fullName || !password || !roleId) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { rows } = await pool.query(
      `INSERT INTO users (id, username, full_name, email, password_hash, role_id, is_active, is_super_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE, NOW())
       RETURNING id, username, full_name, email, role_id, is_active, is_super_admin, created_at, last_login_at`,
      [id, username, fullName, email ?? '', passwordHash, roleId]
    );
    return res.status(201).json(rowToUser(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "Ce nom d'utilisateur est déjà utilisé." });
    }
    console.error('Erreur création utilisateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  if (!checkAdminUsers(req, res)) return;
  const { id } = req.params;
  const { fullName, email, roleId, isActive, newPassword } = req.body;

  try {
    // Récupérer l'utilisateur actuel
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    const user = existing[0];

    if (user.is_super_admin && isActive === false) {
      return res.status(403).json({ message: 'Le super administrateur ne peut pas être désactivé.' });
    }
    if (user.is_super_admin && roleId && roleId !== 'super_admin') {
      return res.status(403).json({ message: 'Le rôle du super administrateur ne peut pas être modifié.' });
    }

    let passwordHash = user.password_hash;
    if (newPassword) {
      passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const { rows } = await pool.query(
      `UPDATE users SET
         full_name     = $1,
         email         = $2,
         role_id       = $3,
         is_active     = $4,
         password_hash = $5
       WHERE id = $6
       RETURNING id, username, full_name, email, role_id, is_active, is_super_admin, created_at, last_login_at`,
      [
        fullName ?? user.full_name,
        email ?? user.email,
        roleId ?? user.role_id,
        isActive !== undefined ? isActive : user.is_active,
        passwordHash,
        id,
      ]
    );
    return res.json(rowToUser(rows[0]));
  } catch (err) {
    console.error('Erreur mise à jour utilisateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PATCH /api/users/:id/toggle ─────────────────────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  if (!checkAdminUsers(req, res)) return;
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    const user = existing[0];
    if (user.is_super_admin) {
      return res.status(403).json({ message: 'Le super administrateur ne peut pas être désactivé.' });
    }
    const { rows } = await pool.query(
      `UPDATE users SET is_active = NOT is_active WHERE id = $1
       RETURNING id, username, full_name, email, role_id, is_active, is_super_admin, created_at, last_login_at`,
      [id]
    );
    return res.json(rowToUser(rows[0]));
  } catch (err) {
    console.error('Erreur toggle utilisateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  if (!checkAdminUsers(req, res)) return;
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query('SELECT is_super_admin FROM users WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    if (existing[0].is_super_admin) {
      return res.status(403).json({ message: 'Le super administrateur ne peut pas être supprimé.' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression utilisateur:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

export default router;
