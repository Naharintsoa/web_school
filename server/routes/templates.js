/**
 * Routes CRUD pour les templates de documents Twig.
 * GET  /api/templates        — liste tous les templates
 * GET  /api/templates/:id    — récupère un template
 * PUT  /api/templates/:id    — met à jour le code Twig
 * POST /api/templates/:id/reset — réinitialise au template par défaut
 */
import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── Liste tous les templates ─────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description, updated_at FROM document_templates ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /templates:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Récupère un template ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM document_templates WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Template introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /templates/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Met à jour le code Twig ──────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({ error: 'Le code du template est requis' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE document_templates
       SET code = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [code, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Template introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /templates/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Réinitialise au template par défaut ──────────────────────────────────────
router.post('/:id/reset', requireAuth, async (req, res) => {
  const { defaultCode } = req.body;
  if (typeof defaultCode !== 'string' || defaultCode.trim() === '') {
    return res.status(400).json({ error: 'Le code par défaut est requis' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE document_templates
       SET code = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [defaultCode, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Template introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /templates/:id/reset:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
