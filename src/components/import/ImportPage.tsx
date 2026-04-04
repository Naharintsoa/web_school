/**
 * Page d'importation d'élèves depuis un fichier Excel (.xlsx, .xls) ou CSV.
 *
 * Format Excel attendu (dans cet ordre ou dans n'importe quel ordre, détection automatique) :
 *   Numéro mat | Nom | Prénom | Date de naissance | Date d'entrée | Classe | Année scolaire
 *
 * Workflow :
 *   1. Upload du fichier → parsing automatique
 *   2. Prévisualisation avec validation ligne par ligne
 *   3. Confirmation → inscription en base via studentApi
 *   4. Résumé des résultats
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle,
  ArrowRight, RotateCcw, Info, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
// xlsx est chargé dynamiquement pour ne pas alourdir le bundle principal
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useToast } from '../../contexts/ToastContext';
import { SCHOOL_YEARS } from '../../utils/schoolYears';
import type { Student, Grade as GradeType, Cycle } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type RowStatus = 'valid' | 'error';

interface ParsedRow {
  rowIndex: number;
  matricule: string;
  lastName: string;
  firstName: string;
  commonName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  exitDate: string;
  grade: string;
  schoolYear: string;
  genderRaw: string;
  studentNumber: string;
  nationality: string;
  birthCity: string;
  birthCountry: string;
  issNumber: string;
  rowStatus: string;    // "statut" colonne Excel (actif/sorti/…)
  address: string;
  fatherName: string;
  fatherAddress: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail: string;
  motherName: string;
  motherAddress: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail: string;
  // Validation
  status: RowStatus;
  errors: string[];
  mappedGrade?: GradeType;
  mappedGender?: 'male' | 'female';
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const VALID_GRADES: GradeType[] = [
  'PS', 'MS', 'GS',
  'CP', 'CE1', 'CE2',
  'CM1', 'CM2', '6EME',
  '5EME', '4EME', '3EME',
];

const GRADE_TO_CYCLE: Record<GradeType, Cycle> = {
  PS: 'CYCLE1', MS: 'CYCLE1', GS: 'CYCLE1',
  CP: 'CYCLE2', CE1: 'CYCLE2', CE2: 'CYCLE2',
  CM1: 'CYCLE3', CM2: 'CYCLE3', '6EME': 'CYCLE3',
  '5EME': 'CYCLE4', '4EME': 'CYCLE4', '3EME': 'CYCLE4',
};

const GRADE_ALIASES: Record<string, GradeType> = {
  'PS': 'PS', 'PETITE SECTION': 'PS',
  'MS': 'MS', 'MOYENNE SECTION': 'MS',
  'GS': 'GS', 'GRANDE SECTION': 'GS',
  'CP': 'CP', 'COURS PREPARATOIRE': 'CP',
  'CE1': 'CE1', 'CE 1': 'CE1',
  'CE2': 'CE2', 'CE 2': 'CE2',
  'CM1': 'CM1', 'CM 1': 'CM1',
  'CM2': 'CM2', 'CM 2': 'CM2',
  '6EME': '6EME', '6ÈME': '6EME', '6': '6EME',
  '5EME': '5EME', '5ÈME': '5EME', '5': '5EME',
  '4EME': '4EME', '4ÈME': '4EME', '4': '4EME',
  '3EME': '3EME', '3ÈME': '3EME', '3': '3EME',
};

/**
 * Synonymes de colonnes — détection automatique des en-têtes.
 * Clé = version normalisée du libellé (toLowerCase, sans ponctuations spéciales).
 * Valeur = champ interne.
 *
 * Format principal reconnu :
 *   Numéro mat | Nom | Prénom | Date de naissance | Date d'entrée | Classe | Année scolaire
 */
const COL_SYNONYMS: Record<string, string> = {
  // ── Matricule ──
  'numéro mat': 'matricule',
  'numero mat': 'matricule',
  'num mat': 'matricule',
  'numéro matricule': 'matricule',
  'matricule': 'matricule',
  'mle': 'matricule',
  'mat': 'matricule',

  // ── Nom ──
  'nom': 'lastName',
  'noms': 'lastName',
  'last name': 'lastName',
  'name': 'lastName',

  // ── Prénom ──
  'prénom': 'firstName',
  'prenom': 'firstName',
  'prénoms': 'firstName',
  'prenoms': 'firstName',
  'first name': 'firstName',

  // ── Date de naissance ──
  'date de naissance': 'dateOfBirth',
  'naissance': 'dateOfBirth',
  'date naissance': 'dateOfBirth',
  'ddn': 'dateOfBirth',

  // ── Date d'entrée / d'inscription ──
  'date dentrée': 'enrollmentDate',   // "Date d'entrée" après suppression apostrophe
  'date dentree': 'enrollmentDate',
  'date entree': 'enrollmentDate',
  'date dinscription': 'enrollmentDate',
  'inscription': 'enrollmentDate',

  // ── Classe ──
  'classe': 'grade',
  'class': 'grade',
  'niveau': 'grade',

  // ── Année scolaire ──
  'année scolaire': 'schoolYear',
  'annee scolaire': 'schoolYear',
  'année': 'schoolYear',
  'annee': 'schoolYear',

  // ── Numéro élève (séparé du matricule, optionnel) ──
  'n°': 'studentNumber',
  'no': 'studentNumber',
  'num': 'studentNumber',
  'numéro': 'studentNumber',
  'numero': 'studentNumber',
  'n° élève': 'studentNumber',

  // ── Genre ──
  'sexe': 'gender',
  'genre': 'gender',
  'f/g': 'gender',
  'f / g': 'gender',
  'sex': 'gender',

  // ── Prénom usuel ──
  'prénom usuel': 'commonName',
  'prenom usuel': 'commonName',
  'nom usuel': 'commonName',
  'surnom': 'commonName',

  // ── Nationalité ──
  'nationalité': 'nationality',
  'nationalite': 'nationality',

  // ── Ville de naissance ──
  'ville de naissance': 'birthCity',
  'ville naissance': 'birthCity',
  'lieu de naissance': 'birthCity',
  'lieu naissance': 'birthCity',

  // ── Pays de naissance ──
  'pays de naissance': 'birthCountry',
  'pays naissance': 'birthCountry',

  // ── Date de sortie ──
  'date de sortie': 'exitDate',
  'date sortie': 'exitDate',
  'date de radiation': 'exitDate',
  'date dentree de radiation': 'exitDate',

  // ── Numéro ISS ──
  'numéro iss': 'issNumber',
  'numero iss': 'issNumber',
  'n° iss': 'issNumber',
  'iss': 'issNumber',
  'matricule iss': 'issNumber',

  // ── Statut ──
  'statut': 'status',
  'état': 'status',
  'etat': 'status',

  // ── Adresse élève ──
  'adresse': 'address',
  'adresse élève': 'address',
  'adresse elève': 'address',
  'adresse eleve': 'address',

  // ── Père ──
  'nom du père': 'fatherName',
  'nom du pere': 'fatherName',
  'père': 'fatherName',
  'pere': 'fatherName',
  'nom père': 'fatherName',
  'nom pere': 'fatherName',

  'adresse du père': 'fatherAddress',
  'adresse du pere': 'fatherAddress',
  'adresse père': 'fatherAddress',
  'adresse pere': 'fatherAddress',

  'profession du père': 'fatherOccupation',
  'profession du pere': 'fatherOccupation',
  'profession père': 'fatherOccupation',
  'profession pere': 'fatherOccupation',

  'téléphone père': 'fatherPhone',
  'telephone père': 'fatherPhone',
  'telephone pere': 'fatherPhone',
  'tél père': 'fatherPhone',
  'tel pere': 'fatherPhone',

  'email père': 'fatherEmail',
  'email pere': 'fatherEmail',
  'mail père': 'fatherEmail',
  'mail pere': 'fatherEmail',

  // ── Mère ──
  'nom de la mère': 'motherName',
  'nom de la mere': 'motherName',
  'mère': 'motherName',
  'mere': 'motherName',
  'nom mère': 'motherName',
  'nom mere': 'motherName',

  'adresse de la mère': 'motherAddress',
  'adresse de la mere': 'motherAddress',
  'adresse mère': 'motherAddress',
  'adresse mere': 'motherAddress',

  'profession de la mère': 'motherOccupation',
  'profession de la mere': 'motherOccupation',
  'profession mère': 'motherOccupation',
  'profession mere': 'motherOccupation',

  'téléphone mère': 'motherPhone',
  'telephone mère': 'motherPhone',
  'telephone mere': 'motherPhone',
  'tél mère': 'motherPhone',
  'tel mere': 'motherPhone',

  'email mère': 'motherEmail',
  'email mere': 'motherEmail',
  'mail mère': 'motherEmail',
  'mail mere': 'motherEmail',
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function normalizeGrade(raw: string): GradeType | null {
  const key = raw.trim().toUpperCase()
    .replace(/È/g, 'E').replace(/É/g, 'E').replace(/Ê/g, 'E');
  return GRADE_ALIASES[key] ?? null;
}

function normalizeGender(raw: string): 'male' | 'female' | null {
  const v = raw.trim().toUpperCase();
  if (v === 'F' || v === 'FILLE' || v === 'FEMININ' || v === 'FÉMININ') return 'female';
  if (v === 'G' || v === 'M' || v === 'GARCON' || v === 'GARÇON' || v === 'MASCULIN') return 'male';
  return null;
}

/**
 * Détecte le champ interne correspondant à un libellé de colonne Excel.
 * Normalise : minuscules, supprime la ponctuation sauf espaces et quelques accents.
 */
function detectColumn(header: string): string | null {
  const key = header.trim().toLowerCase()
    .replace(/[^a-zéèêàùî0-9°\/\s]/g, '') // garder les lettres accentuées
    .replace(/\s+/g, ' ')
    .trim();
  return COL_SYNONYMS[key] ?? null;
}

/**
 * Normalise une date vers le format ISO YYYY-MM-DD.
 * Gère DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, et les objets Date (Excel cellDates).
 */
function normalizeDate(raw: string | Date): string {
  if (!raw) return '';
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return '';
    return raw.toISOString().split('T')[0];
  }
  const s = String(raw).trim();
  if (!s) return '';
  // DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
  // DD-MM-YYYY
  const m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  // YYYY-MM-DD déjà OK
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s; // retourner brut si format inconnu
}

/**
 * Formate une date ISO pour l'affichage : YYYY-MM-DD → JJ/MM/AAAA
 */
function displayDate(iso: string): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

// ─── Composant principal ───────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'done';

export function ImportPage() {
  const { currentYear } = useSchoolYear();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importYear, setImportYear] = useState<string>(currentYear);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Parsing du fichier ────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true }); // cellDates → dates JS
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

    if (raw.length < 2) {
      showToast('Le fichier est vide ou ne contient pas de données.', 'error');
      return;
    }

    // Détecter les colonnes depuis la première ligne (en-têtes)
    const headers = (raw[0] as unknown[]).map(h => String(h));
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const mapped = detectColumn(h);
      if (mapped && !(mapped in colMap)) colMap[mapped] = i;
    });

    // Vérifier les colonnes obligatoires
    const required = ['lastName', 'firstName', 'grade'];
    const missing = required.filter(k => !(k in colMap));
    if (missing.length > 0) {
      const labels: Record<string, string> = {
        grade: 'Classe', lastName: 'Nom', firstName: 'Prénom',
      };
      showToast(
        `Colonnes introuvables : ${missing.map(m => labels[m]).join(', ')}. Vérifiez les en-têtes du fichier.`,
        'error'
      );
      return;
    }

    // Lire une cellule (gère les strings, nombres et objets Date)
    const getCell = (row: unknown[], key: string): string => {
      if (colMap[key] === undefined) return '';
      const val = row[colMap[key]];
      if (val instanceof Date) return normalizeDate(val);
      return String(val ?? '').trim();
    };

    // Parser chaque ligne de données
    const parsed: ParsedRow[] = (raw.slice(1) as unknown[][])
      .filter(r => (r as unknown[]).some(c => String(c).trim() !== ''))
      .map((r, i) => {
        const matricule        = getCell(r, 'matricule');
        const lastName         = getCell(r, 'lastName');
        const firstName        = getCell(r, 'firstName');
        const commonName       = getCell(r, 'commonName');
        const dateOfBirthRaw   = getCell(r, 'dateOfBirth');
        const enrollDateRaw    = getCell(r, 'enrollmentDate');
        const exitDateRaw      = getCell(r, 'exitDate');
        const gradeRaw         = getCell(r, 'grade');
        const schoolYearRaw    = getCell(r, 'schoolYear');
        const genderRaw        = getCell(r, 'gender');
        const studentNumber    = getCell(r, 'studentNumber');
        const nationality      = getCell(r, 'nationality');
        const birthCity        = getCell(r, 'birthCity');
        const birthCountry     = getCell(r, 'birthCountry');
        const issNumber        = getCell(r, 'issNumber');
        const rowStatus        = getCell(r, 'status');
        const address          = getCell(r, 'address');
        const fatherName       = getCell(r, 'fatherName');
        const fatherAddress    = getCell(r, 'fatherAddress');
        const fatherOccupation = getCell(r, 'fatherOccupation');
        const fatherPhone      = getCell(r, 'fatherPhone');
        const fatherEmail      = getCell(r, 'fatherEmail');
        const motherName       = getCell(r, 'motherName');
        const motherAddress    = getCell(r, 'motherAddress');
        const motherOccupation = getCell(r, 'motherOccupation');
        const motherPhone      = getCell(r, 'motherPhone');
        const motherEmail      = getCell(r, 'motherEmail');

        const errors: string[] = [];
        let mappedGrade: GradeType | undefined;
        let mappedGender: 'male' | 'female' | undefined;

        // Validation Classe
        if (!gradeRaw) {
          errors.push('Classe manquante');
        } else {
          const g = normalizeGrade(gradeRaw);
          if (!g) errors.push(`Classe inconnue : "${gradeRaw}"`);
          else mappedGrade = g;
        }

        // Validation Nom / Prénom
        if (!lastName)  errors.push('Nom manquant');
        if (!firstName) errors.push('Prénom manquant');

        // Validation Matricule : exactement 4 chiffres, sans tiret
        if (matricule && !/^\d{4}$/.test(matricule)) {
          errors.push(`Matricule invalide : "${matricule}" (exactement 4 chiffres attendus, sans tiret)`);
        }

        // Genre optionnel
        if (genderRaw) {
          const g = normalizeGender(genderRaw);
          if (!g) errors.push(`Genre inconnu : "${genderRaw}" (attendu F ou G)`);
          else mappedGender = g;
        }

        return {
          rowIndex: i + 2,
          matricule,
          lastName,
          firstName,
          commonName,
          dateOfBirth: normalizeDate(dateOfBirthRaw),
          enrollmentDate: normalizeDate(enrollDateRaw),
          exitDate: normalizeDate(exitDateRaw),
          grade: gradeRaw,
          schoolYear: schoolYearRaw,
          genderRaw,
          studentNumber,
          nationality,
          birthCity,
          birthCountry,
          issNumber,
          rowStatus,
          address,
          fatherName,
          fatherAddress,
          fatherOccupation,
          fatherPhone,
          fatherEmail,
          motherName,
          motherAddress,
          motherOccupation,
          motherPhone,
          motherEmail,
          status: errors.length === 0 ? 'valid' : 'error',
          errors,
          mappedGrade,
          mappedGender,
        } satisfies ParsedRow;
      });

    setRows(parsed);
    setSelectedRows(new Set(parsed.filter(r => r.status === 'valid').map(r => r.rowIndex)));
    setStep('preview');
  }, [showToast]);

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Sélection des lignes ─────────────────────────────────────────────────

  const toggleRow = (rowIndex: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      return next;
    });
  };

  const toggleAll = () => {
    const validIndices = rows.filter(r => r.status === 'valid').map(r => r.rowIndex);
    if (validIndices.every(i => selectedRows.has(i))) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(validIndices));
    }
  };

  // ── Importation ───────────────────────────────────────────────────────────

  const handleImport = async () => {
    setImporting(true);
    const toImport = rows.filter(r => r.status === 'valid' && selectedRows.has(r.rowIndex));
    const existingStudents = await studentApi.getAll();
    const existingMatricules = new Set(existingStudents.map(s => s.matricule));

    let imported = 0, skipped = 0, errors = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const row of toImport) {
      // Doublon par matricule
      if (row.matricule && existingMatricules.has(row.matricule)) {
        skipped++;
        continue;
      }

      // Génération du matricule auto si absent : 5 chiffres
      // Génération auto : 4 chiffres (1001 → 9999)
      const matriculeFinal = row.matricule
        || String(1001 + imported + skipped + errors).padStart(4, '0');

      // Numéro élève : soit depuis la colonne dédiée, soit depuis le matricule
      const studentNum = row.studentNumber
        ? parseInt(row.studentNumber, 10) || 0
        : (row.matricule ? parseInt(row.matricule, 10) || 0 : 0);

      try {
        const studentData: Omit<Student, 'id'> = {
          studentNumber: studentNum,
          matricule: matriculeFinal,
          firstName: row.firstName,
          lastName: row.lastName.toUpperCase(),
          commonName: row.commonName || undefined,
          dateOfBirth: row.dateOfBirth || '',
          gender: row.mappedGender ?? 'male',
          nationality: row.nationality || undefined,
          birthCity: row.birthCity || undefined,
          birthCountry: row.birthCountry || undefined,
          grade: row.mappedGrade!,
          cycle: GRADE_TO_CYCLE[row.mappedGrade!],
          issNumber: row.issNumber || undefined,
          exitDate: row.exitDate || undefined,
          status: row.rowStatus || 'actif',
          parentInfo: {
            fatherName: row.fatherName || '',
            fatherOccupation: row.fatherOccupation || '',
            fatherPhone: row.fatherPhone || '',
            fatherEmail: row.fatherEmail || undefined,
            fatherAddress: row.fatherAddress || undefined,
            motherName: row.motherName || '',
            motherOccupation: row.motherOccupation || '',
            motherPhone: row.motherPhone || '',
            motherEmail: row.motherEmail || undefined,
            motherAddress: row.motherAddress || undefined,
            email: '',
            address: row.address || '',
          },
          enrollmentDate: row.enrollmentDate || today,
          schoolYear: importYear,
        };
        await studentApi.create(studentData);
        if (row.matricule) existingMatricules.add(row.matricule);
        imported++;
      } catch {
        errors++;
      }
    }

    setResult({ imported, skipped, errors });
    setStep('done');
    setImporting(false);
  };

  // ── Réinitialiser ─────────────────────────────────────────────────────────

  const reset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setResult(null);
    setSelectedRows(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Téléchargement du modèle Excel ──────────────────────────────────────

  const downloadTemplate = useCallback(async () => {
    const XLSX = await import('xlsx');
    const headers = [
      'Classe', 'Année scolaire', 'Nom', 'Prénom', 'Prénom usuel', 'Matricule', 'Sexe',
      'Date de naissance', 'Nationalité', 'Ville de naissance', 'Pays de naissance',
      "Date d'entrée", 'Date de sortie', 'Numéro ISS', 'Statut', 'Adresse',
      'Nom du père', 'Adresse du père', 'Profession du père', 'Téléphone père', 'Email père',
      'Nom de la mère', 'Adresse de la mère', 'Profession de la mère', 'Téléphone mère', 'Email mère',
    ];
    const examples = [
      ['6EME', '2024-2025', 'DUPONT', 'Jean', 'Jeannot', '1042', 'G', '15/03/2010', 'Malagasy', 'Antananarivo', 'Madagascar', '01/09/2024', '', 'ISS-001', 'actif', 'Lot IV Ambohipo', 'DUPONT Pierre', 'Ambohipo', 'Médecin', '034 00 001 01', 'pierre@mail.mg', 'RABE Marie', 'Ambohipo', 'Enseignante', '033 00 002 02', 'marie@mail.mg'],
      ['5EME', '2024-2025', 'MARTIN', 'Marie', '', '1017', 'F', '22/07/2011', 'Malagasy', 'Antsirabe', 'Madagascar', '01/09/2024', '', 'ISS-002', 'actif', 'Lot V Ankadivato', 'MARTIN Paul', 'Ankadivato', 'Comptable', '034 00 003 03', '', 'RAKOTON Chantal', 'Ankadivato', 'Commerçante', '033 00 004 04', ''],
      ['CM2', '2024-2025', 'BENALI', 'Youssef', '', '', 'G', '08/11/2012', 'Comorienne', 'Moroni', 'Comores', '01/09/2024', '', '', 'actif', 'Rue des Fleurs', 'BENALI Ahmed', '', 'Ingénieur', '034 00 005 05', '', 'SAID Fatima', '', 'Sans emploi', '033 00 006 06', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Élèves');
    XLSX.writeFile(wb, 'modele_import_eleves.xlsx');
  }, []);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const validCount    = rows.filter(r => r.status === 'valid').length;
  const errorCount    = rows.filter(r => r.status === 'error').length;
  const selectedCount = rows.filter(r => r.status === 'valid' && selectedRows.has(r.rowIndex)).length;

  // ─── Rendu ────────────────────────────────────────────────────────────────

  const STEPS = [
    { key: 'upload',  label: 'Fichier',       num: 1 },
    { key: 'preview', label: 'Vérification',  num: 2 },
    { key: 'done',    label: 'Résultat',       num: 3 },
  ] as const;

  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Bandeau en-tête gradient ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-800 px-6 py-8 mb-6 shadow-lg">
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-lg">
              <FileSpreadsheet size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Importation d'élèves</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Inscrivez des élèves en masse depuis Excel ou CSV</p>
            </div>
          </div>

          {/* Stepper horizontal */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const isDone   = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone   ? 'bg-emerald-400 text-white shadow-md shadow-emerald-500/30' :
                      isActive ? 'bg-white text-indigo-700 shadow-md shadow-white/30 ring-2 ring-white/40' :
                                 'bg-white/20 text-white/60'
                    }`}>
                      {isDone ? <CheckCircle size={14} /> : s.num}
                    </div>
                    <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                      isActive ? 'text-white' : isDone ? 'text-emerald-300' : 'text-indigo-300'
                    }`}>{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`w-10 h-0.5 mx-1 mb-5 transition-all duration-500 ${i < stepIndex ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 space-y-5">

        {/* ════════════════════════════════════════════════════
            ÉTAPE 1 : Upload
        ════════════════════════════════════════════════════ */}
        {step === 'upload' && (
          <>
            {/* Sélecteur d'année scolaire d'importation */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Année scolaire d'importation</p>
                <p className="text-xs text-slate-400">Tous les élèves importés seront enregistrés pour cette année</p>
              </div>
              <select
                value={importYear}
                onChange={e => setImportYear(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {SCHOOL_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Zone de dépôt principale */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                isDragging
                  ? 'ring-2 ring-violet-500 shadow-xl shadow-violet-500/20'
                  : 'ring-1 ring-slate-200 hover:ring-2 hover:ring-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10'
              } bg-white`}
            >
              {/* Fond animé sur drag */}
              <div className={`absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />

              <div className="relative py-16 px-8 text-center">
                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDragging
                    ? 'bg-violet-600 shadow-lg shadow-violet-500/40 scale-110'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 group-hover:scale-105'
                }`}>
                  <Upload size={32} className="text-white" />
                </div>

                <p className="text-lg font-bold text-slate-800 mb-1">
                  {isDragging ? 'Relâchez pour importer' : 'Glissez votre fichier ici'}
                </p>
                <p className="text-sm text-slate-500 mb-5">ou cliquez pour sélectionner depuis votre ordinateur</p>

                <div className="flex items-center justify-center gap-2">
                  {['.xlsx', '.xls', '.csv'].map(ext => (
                    <span key={ext} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-mono font-semibold rounded-full border border-slate-200">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Guide de format */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
              {/* En-tête du guide */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Info size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Format attendu du fichier</p>
                    <p className="text-xs text-slate-400">L'ordre des colonnes n'a pas d'importance</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/40 active:scale-95"
                >
                  <Download size={13} />
                  Télécharger le modèle
                </button>
              </div>

              {/* Colonnes du format */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-600 mb-3">Colonnes reconnues (26 au total) :</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { col: 'Classe', req: true },
                    { col: 'Nom', req: true },
                    { col: 'Prénom', req: true },
                    { col: 'Année scolaire', req: false },
                    { col: 'Prénom usuel', req: false },
                    { col: 'Matricule', req: false },
                    { col: 'Sexe', req: false },
                    { col: 'Date de naissance', req: false },
                    { col: 'Nationalité', req: false },
                    { col: 'Ville de naissance', req: false },
                    { col: 'Pays de naissance', req: false },
                    { col: "Date d'entrée", req: false },
                    { col: 'Date de sortie', req: false },
                    { col: 'Numéro ISS', req: false },
                    { col: 'Statut', req: false },
                    { col: 'Adresse', req: false },
                    { col: 'Nom du père', req: false },
                    { col: 'Adresse du père', req: false },
                    { col: 'Profession du père', req: false },
                    { col: 'Téléphone père', req: false },
                    { col: 'Email père', req: false },
                    { col: 'Nom de la mère', req: false },
                    { col: 'Adresse de la mère', req: false },
                    { col: 'Profession de la mère', req: false },
                    { col: 'Téléphone mère', req: false },
                    { col: 'Email mère', req: false },
                  ].map(({ col, req }) => (
                    <div key={col} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${req ? 'bg-violet-500' : 'bg-slate-300'}`} />
                      <span className="text-xs text-slate-600 font-mono truncate">{col}</span>
                      {req && <span className="ml-auto text-[10px] text-violet-500 font-semibold flex-shrink-0">requis</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes en grille */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-slate-100">
                {[
                  { title: 'Classes', body: VALID_GRADES.join(', ') },
                  { title: 'Matricule', body: '4 chiffres exactement. Ex : 1017. Auto-généré si absent.' },
                  { title: 'Dates', body: 'JJ/MM/AAAA ou AAAA-MM-JJ. Dates Excel natives reconnues.' },
                  { title: 'Optionnels', body: 'Seuls Classe, Nom et Prénom sont obligatoires. Toutes les autres colonnes sont facultatives.' },
                ].map((note, i) => (
                  <div key={i} className={`px-4 py-3 text-xs ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                    <p className="font-semibold text-slate-700 mb-1">{note.title}</p>
                    <p className="text-slate-500 leading-relaxed">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            ÉTAPE 2 : Prévisualisation
        ════════════════════════════════════════════════════ */}
        {step === 'preview' && (
          <>
            {/* Barre de stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 leading-none">{validCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Ligne{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-500 leading-none">{errorCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Erreur{errorCount > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl ring-1 ring-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload size={20} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-700 leading-none">{selectedCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Sélectionné{selectedCount > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Info fichier + toggle erreurs */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={16} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-slate-700">{fileName}</span>
                  <span className="text-xs text-slate-400 ml-2">· {rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              {errorCount > 0 && (
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    showErrors ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle size={13} />
                  {showErrors ? 'Masquer' : 'Afficher'} les {errorCount} erreur{errorCount > 1 ? 's' : ''}
                  {showErrors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </div>

            {/* Tableau prévisualisation */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left w-8">
                        <input
                          type="checkbox"
                          checked={validCount > 0 && rows.filter(r => r.status === 'valid').every(r => selectedRows.has(r.rowIndex))}
                          onChange={toggleAll}
                          className="rounded accent-violet-600"
                        />
                      </th>
                      {['#', 'Statut', 'Matricule', 'Nom', 'Prénom', 'Naissance', 'Entrée', 'Classe', 'Année', 'Problème'].map(h => (
                        <th key={h} className="px-3 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows
                      .filter(r => showErrors || r.status === 'valid')
                      .map(row => {
                        const isValid    = row.status === 'valid';
                        const isSelected = selectedRows.has(row.rowIndex);
                        return (
                          <tr
                            key={row.rowIndex}
                            className={`transition-colors ${
                              !isValid    ? 'bg-rose-50/60' :
                              isSelected  ? 'bg-violet-50/70' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="px-4 py-2.5">
                              {isValid && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRow(row.rowIndex)}
                                  className="rounded accent-violet-600"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{row.rowIndex}</td>
                            <td className="px-3 py-2.5">
                              {isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold whitespace-nowrap">
                                  <CheckCircle size={11} /> Valide
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-semibold whitespace-nowrap">
                                  <XCircle size={11} /> Erreur
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[11px]">
                              {row.matricule
                                ? <span className={/^\d{4}$/.test(row.matricule) ? 'text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded' : 'text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded'}>{row.matricule}</span>
                                : <span className="text-slate-400 italic">auto</span>}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-800 uppercase whitespace-nowrap tracking-wide text-[11px]">
                              {row.lastName || <span className="text-rose-400 font-normal not-italic">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                              {row.firstName || <span className="text-rose-400">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{displayDate(row.dateOfBirth)}</td>
                            <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{displayDate(row.enrollmentDate)}</td>
                            <td className="px-3 py-2.5">
                              {row.mappedGrade ? (
                                <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                                  {row.mappedGrade}
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[11px]">
                                  {row.grade || '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{row.schoolYear || '—'}</td>
                            <td className="px-3 py-2.5 text-rose-500 max-w-[200px] whitespace-normal leading-tight">
                              {row.errors.join(' · ')}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {rows.filter(r => showErrors || r.status === 'valid').length === 0 && (
                <div className="py-14 text-center">
                  <AlertTriangle size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">Aucune ligne valide trouvée.</p>
                  <p className="text-xs text-slate-400 mt-1">Vérifiez le format et les en-têtes de colonnes.</p>
                </div>
              )}
            </div>

            {/* Barre d'actions flottante */}
            <div className="sticky bottom-4 bg-white/90 backdrop-blur-md rounded-2xl ring-1 ring-slate-200 shadow-xl shadow-slate-900/10 px-5 py-3 flex justify-between items-center">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                <RotateCcw size={14} />
                Changer de fichier
              </button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="flex items-center gap-2 px-6 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95 transition-all"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importation en cours…
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Importer {selectedCount} élève{selectedCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            ÉTAPE 3 : Résultat
        ════════════════════════════════════════════════════ */}
        {step === 'done' && result && (
          <div className="flex flex-col items-center py-8">
            {/* Cercle animé succès */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <CheckCircle size={44} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-1">Importation réussie !</h2>
            <p className="text-slate-500 text-sm mb-8">
              <span className="font-medium text-slate-700">{fileName}</span> a été traité
            </p>

            {/* Cartes résultat */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 w-full max-w-lg">
              <div className="flex-1 min-w-[130px] bg-white rounded-2xl ring-1 ring-slate-200 p-5 text-center shadow-sm">
                <p className="text-4xl font-black text-emerald-500 mb-1">{result.imported}</p>
                <p className="text-xs text-slate-500 font-medium">
                  Élève{result.imported > 1 ? 's' : ''} importé{result.imported > 1 ? 's' : ''}
                </p>
              </div>
              {result.skipped > 0 && (
                <div className="flex-1 min-w-[130px] bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-5 text-center">
                  <p className="text-4xl font-black text-amber-500 mb-1">{result.skipped}</p>
                  <p className="text-xs text-amber-700 font-medium">
                    Doublon{result.skipped > 1 ? 's' : ''} ignoré{result.skipped > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {result.errors > 0 && (
                <div className="flex-1 min-w-[130px] bg-rose-50 rounded-2xl ring-1 ring-rose-200 p-5 text-center">
                  <p className="text-4xl font-black text-rose-500 mb-1">{result.errors}</p>
                  <p className="text-xs text-rose-700 font-medium">Erreur{result.errors > 1 ? 's' : ''}</p>
                </div>
              )}
            </div>

            {result.skipped > 0 && (
              <div className="flex items-start gap-2.5 max-w-md bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-8">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  {result.skipped} élève{result.skipped > 1 ? 's ont' : ' a'} été ignoré{result.skipped > 1 ? 's' : ''} car leur matricule existe déjà dans la base.
                </span>
              </div>
            )}

            <button
              onClick={reset}
              className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95 transition-all text-sm"
            >
              <Upload size={16} />
              Importer un autre fichier
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
