import * as XLSX from 'xlsx';
import type { Student, Subject } from '../types';
import type { Grade } from '../types/grade';

export interface ImportRow {
  student: Student;
  subjectId: string;
  subjectName: string;
  score: number;
  coefficient: number;
  teacherName: string;
}

export interface ImportResult {
  valid: ImportRow[];
  errors: string[];
  warnings: string[];
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportGrades(
  students: Student[],
  subjects: Subject[],
  grades: Grade[],
  term: 1 | 2 | 3,
  gradeClass: string,
) {
  const termGrades = grades.filter(g => g.term === term);
  const sorted = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName));

  const header = ['Nom', 'Prénom', ...subjects.map(s => s.name)];
  const rows = sorted.map(student => {
    const cols: (string | number)[] = [student.lastName, student.firstName];
    for (const subject of subjects) {
      const g = termGrades.find(x => x.studentId === student.id && x.subjectId === subject.id);
      cols.push(g?.score != null ? g.score : '');
    }
    return cols;
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [{ wch: 22 }, { wch: 22 }, ...subjects.map(() => ({ wch: 14 }))];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `T${term} - ${gradeClass}`);
  XLSX.writeFile(wb, `notes_${gradeClass}_T${term}.xlsx`);
}

// ─── Import ──────────────────────────────────────────────────────────────────

export function parseImportFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false });
        resolve(rows as string[][]);
      } catch {
        reject(new Error('Fichier invalide ou corrompu.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsBinaryString(file);
  });
}

export function validateImport(
  rows: string[][],
  students: Student[],
  subjects: Subject[],
): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const valid: ImportRow[] = [];

  if (rows.length < 2) {
    errors.push('Le fichier est vide ou ne contient pas de données.');
    return { valid, errors, warnings };
  }

  const [header, ...dataRows] = rows;

  // Mapper les colonnes (à partir de la colonne 2) vers des matières
  const subjectCols: { index: number; subject: Subject }[] = [];
  for (let i = 2; i < header.length; i++) {
    const colName = (header[i] ?? '').trim().toUpperCase();
    if (!colName) continue;
    const subject = subjects.find(s => s.name.trim().toUpperCase() === colName);
    if (subject) {
      subjectCols.push({ index: i, subject });
    } else {
      warnings.push(`Colonne "${header[i]}" : matière introuvable, ignorée.`);
    }
  }

  if (subjectCols.length === 0) {
    errors.push('Aucune matière reconnue. Vérifiez que les noms des colonnes correspondent exactement aux matières de la classe.');
    return { valid, errors, warnings };
  }

  dataRows.forEach((row, idx) => {
    const line = idx + 2;
    const lastName  = (row[0] ?? '').trim();
    const firstName = (row[1] ?? '').trim();
    if (!lastName && !firstName) return; // ligne vide

    if (!lastName || !firstName) {
      errors.push(`Ligne ${line} : Nom ou Prénom manquant.`);
      return;
    }

    const student = students.find(
      s =>
        s.lastName.trim().toUpperCase()  === lastName.toUpperCase() &&
        s.firstName.trim().toUpperCase() === firstName.toUpperCase(),
    );

    if (!student) {
      warnings.push(`Ligne ${line} : élève "${firstName} ${lastName}" introuvable dans la classe — ignoré.`);
      return;
    }

    for (const { index, subject } of subjectCols) {
      const raw = (row[index] ?? '').toString().trim().replace(',', '.');
      if (!raw) continue; // cellule vide = pas de note

      const score = parseFloat(raw);
      if (isNaN(score)) {
        warnings.push(`Ligne ${line}, ${subject.name} : valeur "${raw}" invalide — ignorée.`);
        continue;
      }
      if (score < 0 || score > 20) {
        warnings.push(`Ligne ${line}, ${subject.name} : note ${score} hors plage [0-20] — ignorée.`);
        continue;
      }

      valid.push({
        student,
        subjectId:   subject.id,
        subjectName: subject.name,
        score,
        coefficient: subject.coefficient,
        teacherName: subject.teacherName ?? '',
      });
    }
  });

  return { valid, errors, warnings };
}
