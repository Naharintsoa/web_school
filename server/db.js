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
    await client.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'sully'`);
    // Rétro-compatibilité : s'assurer que les élèves existants ont bien school = 'sully'
    await client.query(`UPDATE students SET school = 'sully' WHERE school IS NULL`);

    // Supprimer les doublons existants avant de créer l'index unique
    // Garde la ligne avec l'id le plus récent pour chaque (nom normalisé, école)
    await client.query(`
      DELETE FROM subjects
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY UPPER(TRIM(name)), school
              ORDER BY id DESC
            ) AS rn
          FROM subjects
        ) ranked
        WHERE rn > 1
      )
    `);

    // Colonne grade sur subjects (NULL = toutes classes, ex: '3EME' = spécifique)
    await client.query(`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS grade TEXT`);

    // Supprimer l'ancien index unique (sans grade) s'il existe
    await client.query(`DROP INDEX IF EXISTS idx_subjects_unique_name_school`);

    // Supprimer les doublons avant de créer le nouvel index
    await client.query(`
      DELETE FROM subjects
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY UPPER(TRIM(name)), school, COALESCE(grade, '')
              ORDER BY id DESC
            ) AS rn
          FROM subjects
        ) ranked
        WHERE rn > 1
      )
    `);

    // Contrainte unicité matières : (nom normalisé, école, classe) — idempotent
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_unique_name_school_grade
      ON subjects (UPPER(TRIM(name)), school, COALESCE(grade, ''))
    `);

    // Colonne display_order : ordre d'affichage dans le bulletin
    await client.query(`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 9999`);
    // Initialiser display_order pour les lignes existantes (ordre alpha par défaut)
    await client.query(`
      UPDATE subjects s
      SET    display_order = ranked.rn
      FROM   (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY school ORDER BY UPPER(TRIM(name))) AS rn
        FROM   subjects
        WHERE  display_order = 9999 OR display_order IS NULL
      ) ranked
      WHERE  s.id = ranked.id
    `);

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

    // 4a. Table bulletin_remarks (observations, absences, retards par élève et trimestre)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bulletin_remarks (
        student_id    TEXT NOT NULL,
        term          SMALLINT NOT NULL CHECK (term IN (1, 2, 3)),
        observation   TEXT NOT NULL DEFAULT '',
        mention       TEXT NOT NULL DEFAULT '',
        absences      TEXT NOT NULL DEFAULT '',
        demi_journees TEXT NOT NULL DEFAULT '',
        retards       TEXT NOT NULL DEFAULT '',
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (student_id, term)
      )
    `);

    // 4b. Table subjects + colonne school
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        coefficient  INTEGER NOT NULL DEFAULT 1,
        teacher_name TEXT,
        school       TEXT NOT NULL DEFAULT 'sully'
      )
    `);
    // Migration : ajouter school si la table existait sans cette colonne
    await client.query(`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS school TEXT NOT NULL DEFAULT 'sully'`);
    // Rétro-compat : s'assurer que toutes les lignes sans school ont 'sully'
    await client.query(`UPDATE subjects SET school = 'sully' WHERE school IS NULL OR school = ''`);

    const sullySubjects = [
      { id: 'sully-1',  name: 'MATHEMATIQUES',              coefficient: 1,  teacher: 'ANDRIANIRINA N. Micah' },
      { id: 'sully-2',  name: 'TECHNOLOGIE',                coefficient: 1,  teacher: 'ANDRIANIRINA N. Micah' },
      { id: 'sully-3',  name: 'PHYSIQUE CHIMIE',             coefficient: 1,  teacher: 'ANDRIANIRINA N. Micah' },
      // HISTOIRE GEOGRAPHIE / E.M.C géré séparément par classe ci-dessous (6EME/5EME séparés, 3EME/4EME combinés)
      { id: 'sully-5',  name: 'ANGLAIS',                    coefficient: 1,  teacher: "RAVELOMANANTSOA Mioran'i Avo" },
      { id: 'sully-6',  name: 'ARTS PLASTIQUES',            coefficient: 1,  teacher: 'RAZAFINIMANANA Solofotiana' },
      { id: 'sully-7',  name: 'EPS',                        coefficient: 1,  teacher: 'ANDRIAMANORO Tahiry' },
      { id: 'sully-8',  name: 'EDUCATION MUSICALE',         coefficient: 1,  teacher: 'ANDRIAMANORO Tahiry' },
      { id: 'sully-9',  name: 'ESPAGNOL',                   coefficient: 1,  teacher: 'RABEARIVELO Avotra H.' },
      // FRANCAIS géré séparément par classe ci-dessous
      { id: 'sully-11', name: 'SVT',                        coefficient: 1,  teacher: 'RAZAFIMIHAJA Saholy' },
      { id: 'sully-12', name: 'MALAGASY',                   coefficient: 1,  teacher: 'RANOMENJANAHARY Fameno Lafatriniaina' },
    ];

    // Matières Annexe — mêmes intitulés, profs à assigner ultérieurement
    const annexeSubjects = [
      { id: 'annexe-1',  name: 'MATHEMATIQUES',              coefficient: 1 },
      { id: 'annexe-2',  name: 'TECHNOLOGIE',                coefficient: 1 },
      { id: 'annexe-3',  name: 'PHYSIQUE CHIMIE',             coefficient: 1 },
      { id: 'annexe-4',  name: 'HISTOIRE GEOGRAPHIE/ E.M.C', coefficient: 1 },
      { id: 'annexe-5',  name: 'ANGLAIS',                    coefficient: 1 },
      { id: 'annexe-6',  name: 'ARTS PLASTIQUES',            coefficient: 1 },
      { id: 'annexe-7',  name: 'EPS',                        coefficient: 1 },
      { id: 'annexe-8',  name: 'EDUCATION MUSICALE',         coefficient: 1 },
      { id: 'annexe-9',  name: 'ESPAGNOL',                   coefficient: 1 },
      { id: 'annexe-10', name: 'FRANCAIS',                   coefficient: 1 },
      { id: 'annexe-11', name: 'SVT',                        coefficient: 1 },
      { id: 'annexe-12', name: 'MALAGASY',                   coefficient: 1 },
    ];

    // Insérer les matières Sully (avec profs)
    for (const s of sullySubjects) {
      await client.query(
        `INSERT INTO subjects (id, name, coefficient, teacher_name, school)
         VALUES ($1, $2, $3, $4, 'sully')
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.coefficient, s.teacher ?? null]
      );
    }
    // Insérer les matières Annexe (sans profs — à compléter)
    for (const s of annexeSubjects) {
      await client.query(
        `INSERT INTO subjects (id, name, coefficient, teacher_name, school)
         VALUES ($1, $2, $3, NULL, 'sully-annexe')
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.coefficient]
      );
    }

    // Rétro-compat : les anciennes lignes (id 1..12) héritent de sully + profs
    const legacyTeachers = {
      '1': 'ANDRIANIRINA N. Micah', '2': 'ANDRIANIRINA N. Micah', '3': 'ANDRIANIRINA N. Micah',
      '4': 'TAMARENA Hermann', '5': "RAVELOMANANTSOA Mioran'i Avo", '6': 'RAZAFINIMANANA Solofotiana',
      '7': 'ANDRIAMANORO Tahiry', '8': 'ANDRIAMANORO Tahiry', '9': 'RABEARIVELO Avotra H.',
      '10': 'RASOLOFOMANANA Lalasoa', '11': 'RAZAFIMIHAJA Saholy', '12': 'RANOMENJANAHARY Fameno Lafatriniaina',
    };
    for (const [id, teacher] of Object.entries(legacyTeachers)) {
      await client.query(
        `UPDATE subjects SET school = 'sully', teacher_name = COALESCE(NULLIF(teacher_name,''), $1)
         WHERE id = $2`,
        [teacher, id]
      );
    }

    // ─── FRANÇAIS Sully : un prof par classe de collège ──────────────────────
    // Supprimer les anciennes entrées FRANÇAIS/sully (génériques ou doublons)
    // sauf celles qu'on va créer/mettre à jour
    const francaisSullyIds = [
      'sully-francais-3eme',
      'sully-francais-6eme',
      'sully-francais-5eme',
      'sully-francais-4eme',
    ];
    await client.query(
      `DELETE FROM subjects
       WHERE UPPER(TRIM(name)) = 'FRANCAIS' AND school = 'sully' AND id != ALL($1)`,
      [francaisSullyIds]
    );

    const francaisSully = [
      { id: 'sully-francais-3eme', grade: '3EME', teacher: 'RASOLOFOMANANA Lalasoa' },
      { id: 'sully-francais-6eme', grade: '6EME', teacher: 'ZO LALAINA Rindratiana' },
      { id: 'sully-francais-5eme', grade: '5EME', teacher: 'ZO LALAINA Rindratiana' },
      { id: 'sully-francais-4eme', grade: '4EME', teacher: 'ZO LALAINA Rindratiana' },
    ];
    for (const { id, grade, teacher } of francaisSully) {
      await client.query(
        `INSERT INTO subjects (id, name, coefficient, teacher_name, school, grade)
         VALUES ($1, 'FRANCAIS', 1, $2, 'sully', $3)
         ON CONFLICT (id) DO UPDATE
           SET teacher_name = EXCLUDED.teacher_name,
               grade        = EXCLUDED.grade`,
        [id, teacher, grade]
      );
    }

    // ─── HISTOIRE GEOGRAPHIE / E.M.C : séparés en 6EME et 5EME ─────────────
    // En 6EME et 5EME : deux matières distinctes (HISTOIRE GEOGRAPHIE + E.M.C)
    // En 3EME et 4EME : matière combinée (HISTOIRE GEOGRAPHIE/ E.M.C)
    // Supprimer l'entrée générique (grade=NULL) pour éviter qu'elle s'affiche partout
    await client.query(
      `DELETE FROM subjects
       WHERE school = 'sully'
         AND UPPER(TRIM(name)) = 'HISTOIRE GEOGRAPHIE/ E.M.C'
         AND id NOT IN (
           'sully-hg-emc-3eme', 'sully-hg-emc-4eme',
           'sully-hg-6eme', 'sully-emc-6eme',
           'sully-hg-5eme', 'sully-emc-5eme'
         )`
    );

    const hgEmcEntries = [
      // Combiné pour 3EME et 4EME
      { id: 'sully-hg-emc-3eme', name: 'HISTOIRE GEOGRAPHIE/ E.M.C', grade: '3EME', teacher: 'TAMARENA Hermann' },
      { id: 'sully-hg-emc-4eme', name: 'HISTOIRE GEOGRAPHIE/ E.M.C', grade: '4EME', teacher: 'TAMARENA Hermann' },
      // Séparés pour 6EME
      { id: 'sully-hg-6eme',  name: 'HISTOIRE GEOGRAPHIE', grade: '6EME', teacher: 'TAMARENA Hermann' },
      { id: 'sully-emc-6eme', name: 'E.M.C',               grade: '6EME', teacher: 'TAMARENA Hermann' },
      // Séparés pour 5EME
      { id: 'sully-hg-5eme',  name: 'HISTOIRE GEOGRAPHIE', grade: '5EME', teacher: 'TAMARENA Hermann' },
      { id: 'sully-emc-5eme', name: 'E.M.C',               grade: '5EME', teacher: 'TAMARENA Hermann' },
    ];
    for (const { id, name, grade, teacher } of hgEmcEntries) {
      await client.query(
        `INSERT INTO subjects (id, name, coefficient, teacher_name, school, grade)
         VALUES ($1, $2, 1, $3, 'sully', $4)
         ON CONFLICT (id) DO UPDATE
           SET teacher_name = EXCLUDED.teacher_name,
               grade        = EXCLUDED.grade,
               name         = EXCLUDED.name`,
        [id, name, teacher, grade]
      );
    }

    // ─── LITTÉRATURE : obligatoire pour 6EME et 5EME uniquement ─────────────
    // Supprimer toute entrée LITTÉRATURE qui n'est pas spécifiquement 6EME ou 5EME
    await client.query(
      `DELETE FROM subjects
       WHERE school = 'sully'
         AND UPPER(TRIM(name)) = 'LITTERATURE'
         AND (grade IS NULL OR grade NOT IN ('6EME', '5EME'))`
    );
    // S'assurer que LITTÉRATURE existe bien pour 6EME et 5EME
    const litteratureEntries = [
      { id: 'sully-litt-6eme', grade: '6EME', teacher: 'ZO LALAINA Rindratiana' },
      { id: 'sully-litt-5eme', grade: '5EME', teacher: 'ZO LALAINA Rindratiana' },
    ];
    for (const { id, grade, teacher } of litteratureEntries) {
      await client.query(
        `INSERT INTO subjects (id, name, coefficient, teacher_name, school, grade)
         VALUES ($1, 'LITTERATURE', 1, $2, 'sully', $3)
         ON CONFLICT (id) DO UPDATE
           SET teacher_name = EXCLUDED.teacher_name,
               grade        = EXCLUDED.grade`,
        [id, teacher, grade]
      );
    }

    console.log('Matières Sully et Sully Annexe initialisées.');

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
