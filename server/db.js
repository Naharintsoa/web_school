/**
 * Collège Sully — Pool PostgreSQL + initialisation DB
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Rôles par défaut ─────────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  'students:view', 'students:create', 'students:edit', 'students:delete',
  'grades:view', 'grades:edit',
  'archive:view', 'archive:manage',
  'reports:view', 'reports:export',
  'exams:view', 'exams:manage',
  'admin:users', 'admin:roles', 'admin:settings',
  'bulletin:view', 'bulletin:print',
  'payments:view',
];

const DEFAULT_ROLES = [
  {
    id: 'super_admin',
    name: 'super_admin',
    label: 'Super Administrateur',
    permissions: ALL_PERMISSIONS,
    is_system: true,
  },
  {
    id: 'gestionnaire',
    name: 'gestionnaire',
    label: 'Gestionnaire',
    permissions: [
      'students:view', 'students:create', 'students:edit', 'students:delete',
      'grades:view', 'grades:edit',
      'archive:view', 'archive:manage',
      'reports:view', 'reports:export',
      'exams:view', 'exams:manage',
      'bulletin:view', 'bulletin:print',
      'payments:view',
    ],
    is_system: true,
  },
  {
    id: 'professeur',
    name: 'professeur',
    label: 'Professeur',
    permissions: [
      'students:view',
      'grades:view', 'grades:edit',
      'reports:view',
      'exams:view',
      'bulletin:view',
    ],
    is_system: true,
  },
  {
    id: 'secretaire',
    name: 'secretaire',
    label: 'Secrétaire',
    permissions: [
      'students:view', 'students:create', 'students:edit',
      'archive:view',
      'reports:view', 'reports:export',
      'bulletin:view', 'bulletin:print',
      'payments:view',
    ],
    is_system: true,
  },
  {
    id: 'parent',
    name: 'parent',
    label: 'Parent',
    permissions: [
      'students:view',
      'grades:view',
      'bulletin:view',
    ],
    is_system: true,
  },
];

// ─── Initialisation ───────────────────────────────────────────────────────────

export async function initDB() {
  const client = await pool.connect();
  try {
    // 1. Exécuter le schéma SQL
    const sql = readFileSync(
      path.join(__dirname, 'migrations/001_schema.sql'),
      'utf8'
    );
    await client.query(sql);

    // 1b. Migrations incrémentales (colonnes ajoutées après la création initiale)
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS family_id TEXT`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality TEXT`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_city TEXT`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_country TEXT`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS exit_date TEXT`);
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'actif'`);

    // 2. Insérer les rôles par défaut si la table est vide
    const { rows: existingRoles } = await client.query('SELECT id FROM roles LIMIT 1');
    if (existingRoles.length === 0) {
      for (const role of DEFAULT_ROLES) {
        await client.query(
          `INSERT INTO roles (id, name, label, permissions, is_system)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [role.id, role.name, role.label, JSON.stringify(role.permissions), role.is_system]
        );
      }
      console.log('Rôles par défaut insérés.');
    }

    // 3. Créer le super admin si absent
    const { rows: admins } = await client.query(
      'SELECT id FROM users WHERE is_super_admin = TRUE LIMIT 1'
    );
    if (admins.length === 0) {
      const passwordHash = await bcrypt.hash('Admin@Sully2024', 12);
      await client.query(
        `INSERT INTO users (id, username, full_name, email, password_hash, role_id, is_active, is_super_admin, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          'super-admin-fixed-id',
          'admin',
          'Administrateur Principal',
          'admin@college-sully.mg',
          passwordHash,
          'super_admin',
        ]
      );
      console.log('Super admin créé.');
    }

    // 4. Insérer les templates de documents par défaut si absents
    await client.query(`ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    const DEFAULT_TEMPLATE_SEEDS = [
      {
        id: 'badge',
        name: 'Badge',
        description: 'Badge élève avec photo, matricule et classe',
      },
      {
        id: 'certificat-scolarite',
        name: 'Certificat de scolarité',
        description: "Atteste qu'un élève est inscrit dans l'établissement",
      },
      {
        id: 'certificat-radiation',
        name: 'Certificat de radiation',
        description: "Atteste qu'un élève a quitté l'établissement",
      },
      {
        id: 'certificat-identite',
        name: "Certificat d'identité",
        description: 'Carte d\'identité scolaire avec photo et informations élève',
      },
    ];
    for (const tpl of DEFAULT_TEMPLATE_SEEDS) {
      await client.query(
        `INSERT INTO document_templates (id, name, description, code)
         VALUES ($1, $2, $3, '')
         ON CONFLICT (id) DO NOTHING`,
        [tpl.id, tpl.name, tpl.description]
      );
    }

    console.log('Base de données initialisée avec succès.');
  } finally {
    client.release();
  }
}
