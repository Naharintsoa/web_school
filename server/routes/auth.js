/**
 * Routes d'authentification
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Identifiant et mot de passe requis.' });
  }

  try {
    // Récupérer l'utilisateur avec son rôle
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.password_hash,
              u.role_id, u.is_active, u.is_super_admin,
              r.label AS role_label, r.permissions
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE LOWER(u.username) = LOWER($1)`,
      [username]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect.' });
    }

    // Mettre à jour lastLoginAt
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Construire la session
    const session = {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      roleId: user.role_id,
      roleLabel: user.role_label,
      permissions: Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions),
      isSuperAdmin: user.is_super_admin,
      loginAt: Date.now(),
    };

    // Créer le JWT (session cookie = pas d'expiration dans le token, durée navigateur)
    const token = jwt.sign(session, process.env.JWT_SECRET);

    // Envoyer le cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      // Pas de maxAge → session cookie (expire à la fermeture du navigateur)
    });

    return res.json(session);
  } catch (err) {
    console.error('Erreur login:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  return res.status(204).end();
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  return res.json(req.user);
});

export default router;
