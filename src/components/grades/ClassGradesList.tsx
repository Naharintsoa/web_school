/**
 * Vue des notes pour une classe donnée.
 * - Sélection du trimestre et de l'élève
 * - Saisie des notes matière par matière (optionnel)
 * - Gestion des matières (ajouter/supprimer)
 * - Génération et impression du bulletin
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, Printer, ArrowLeft, Settings2, Users, BookOpen, UserCircle, Calculator, Download, Upload } from 'lucide-react';
import { GradeInput } from './GradeInput';
import { SubjectManager } from './SubjectManager';
import { SubjectGradeEntry } from './SubjectGradeEntry';
import { ReportCard } from './report-card/ReportCard';
import { ClassCouncilView } from './ClassCouncilView';
import { GradesImportModal } from './GradesImportModal';
import { exportGrades } from '../../utils/gradesExportImport';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useSchool } from '../../contexts/SchoolContext';
import { studentApi, gradesApi } from '../../services/api';
import { subjectsApi } from '../../services/api/subjectsApi';
import { mockTeachers } from '../../data/mockTeachers';
import { calculateAverage, calculateClassStats } from '../../utils/grades';
import type { Student, Subject } from '../../types';
import type { Grade } from '../../types/grade';

interface ClassGradesListProps {
  grade: string;
  onBack: () => void;
}

/** Statistiques de classe par matière (pour le bulletin) */
interface ClassSubjectStats {
  avg: number;
  min: number;
  max: number;
}

export function ClassGradesList({ grade, onBack }: ClassGradesListProps) {
  const { currentYear } = useSchoolYear();
  const { currentSchool } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allClassGrades, setAllClassGrades] = useState<Grade[]>([]);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [showCouncil, setShowCouncil] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [entryMode, setEntryMode] = useState<'student' | 'subject'>('student');

  // Professeur principal de la classe
  const principalTeacher = (() => {
    const t = mockTeachers[grade];
    if (typeof t === 'string') return t;
    if (Array.isArray(t)) return t[0];
    return '';
  })();

  useEffect(() => { loadData(); }, [grade, currentYear, currentSchool]);
  useEffect(() => { loadAllClassGrades(); }, [grade, selectedTerm, currentYear, currentSchool]);

  // S'abonner aux modifications de matières
  useEffect(() => {
    const unsubscribe = subjectsApi.subscribe(() => {
      // Passer la classe : récupère le bon prof par classe
      subjectsApi.getAll(currentSchool, grade).then(setSubjects);
    });
    return unsubscribe;
  }, [currentSchool, grade]);

  const loadData = useCallback(async () => {
    const [loadedStudents, loadedSubjects] = await Promise.all([
      studentApi.getAll(currentYear, currentSchool),
      subjectsApi.getAll(currentSchool, grade),
    ]);
    setStudents(loadedStudents.filter(s => s.grade === grade));
    setSubjects(loadedSubjects);
  }, [grade, currentYear, currentSchool]);

  const loadAllClassGrades = useCallback(async () => {
    const [allStudents, allGrades] = await Promise.all([
      studentApi.getAll(currentYear, currentSchool),
      gradesApi.getAll(),
    ]);
    const classIds = new Set(allStudents.filter(s => s.grade === grade).map(s => s.id));
    setAllClassGrades(allGrades.filter(g => classIds.has(g.studentId) && g.term === selectedTerm));
  }, [grade, selectedTerm, currentYear, currentSchool]);

  const handleSubjectsChange = async () => {
    const updated = await subjectsApi.getAll(currentSchool, grade);
    setSubjects(updated);
  };

  const loadGrades = useCallback(async (student: Student) => {
    const studentGrades = await gradesApi.getByStudent(student.id);
    setGrades(studentGrades);
    // Recharger aussi les stats de classe pour que les notes soient à jour
    await loadAllClassGrades();
  }, [loadAllClassGrades]);

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    await loadGrades(student);
  };

  useEffect(() => {
    if (selectedStudent) loadGrades(selectedStudent);
  }, [selectedTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGradeChange = async (subjectId: string, score: number, comments?: string) => {
    if (!selectedStudent) return;
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const gradeRecord: Grade = {
      id: `${selectedStudent.id}-${subjectId}-${selectedTerm}`,
      studentId: selectedStudent.id,
      subjectId,
      term: selectedTerm,
      score,
      comments,
      subjectName: subject.name,
      teacherName: subject.teacherName ?? '',
      coefficient: subject.coefficient,
      classAverage: 0,
      minScore: 0,
      maxScore: 20,
    };

    await gradesApi.update(gradeRecord);
    await loadGrades(selectedStudent);
  };

  const handleGradeDelete = async (subjectId: string) => {
    if (!selectedStudent) return;
    await gradesApi.deleteByCompositeKey(selectedStudent.id, subjectId, selectedTerm);
    await loadGrades(selectedStudent);
  };

  /** Calcul des stats de classe par matière */
  const getClassStats = (): Record<string, ClassSubjectStats> => {
    const stats: Record<string, ClassSubjectStats> = {};
    for (const subject of subjects) {
      const sg = allClassGrades.filter(g => g.subjectId === subject.id);
      stats[subject.id] = calculateClassStats(sg);
    }
    return stats;
  };

  // N'inclure que les matières encore actives (les supprimées sont exclues du bulletin)
  const activeSubjectIds = new Set(subjects.map(s => s.id));
  const currentTermGrades = grades.filter(
    g => g.term === selectedTerm && activeSubjectIds.has(g.subjectId)
  );
  const studentAverage = calculateAverage(currentTermGrades);

  const otherTermsAverages = ([1, 2, 3] as const)
    .filter(t => t !== selectedTerm)
    .map(t => ({
      term: t,
      average: calculateAverage(grades.filter(g => g.term === t)),
      hasGrades: grades.some(g => g.term === t),
    }))
    .filter(t => t.hasGrades);

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Vue Conseil de classe (plein écran, imprimable)
  if (showCouncil) {
    return (
      <ClassCouncilView
        grade={grade}
        term={selectedTerm}
        students={students}
        subjects={subjects}
        onClose={() => setShowCouncil(false)}
      />
    );
  }

  // Vue bulletin (plein écran, prête à imprimer)
  if (showReportCard && selectedStudent) {
    return (
      <ReportCard
        student={selectedStudent}
        grades={currentTermGrades}
        allGrades={grades}
        subjects={subjects}
        classStats={getClassStats()}
        term={selectedTerm}
        schoolYear={currentYear}
        classAverage={calculateAverage(allClassGrades)}
        teacherName={principalTeacher}
        otherTermsAverages={otherTermsAverages}
        onClose={() => setShowReportCard(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notes — {grade}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{currentYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Par élève / Par matière */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              <button
                onClick={() => setEntryMode('student')}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                  entryMode === 'student'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCircle size={15} />
                <span className="hidden sm:inline">Par élève</span>
              </button>
              <button
                onClick={() => setEntryMode('subject')}
                className={`flex items-center gap-1.5 px-3 py-2 border-l border-gray-300 transition-colors ${
                  entryMode === 'subject'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BookOpen size={15} />
                <span className="hidden sm:inline">Par matière</span>
              </button>
            </div>

            <button
              onClick={() => exportGrades(students, subjects, allClassGrades.length > 0 ? allClassGrades : [], selectedTerm, grade)}
              title="Exporter les notes en Excel"
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              onClick={() => setShowImport(true)}
              title="Importer des notes depuis Excel/CSV"
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importer</span>
            </button>
            <button
              onClick={() => setShowSubjectManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">Gérer les matières</span>
            </button>
            <button
              onClick={() => setShowCouncil(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Conseil de classe</span>
            </button>
            {selectedStudent && entryMode === 'student' && (
              <button
                onClick={() => setShowReportCard(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Printer size={16} />
                <span>Bulletin</span>
              </button>
            )}
          </div>
        </div>

        {/* Trimestres */}
        <div className="flex gap-2 mb-5">
          {([1, 2, 3] as const).map(term => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTerm === term
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trimestre {term}
            </button>
          ))}
        </div>

        {/* Recherche — uniquement en mode "par élève" */}
        {entryMode === 'student' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un élève…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* ── Vue PAR MATIÈRE ── */}
      {entryMode === 'subject' && (
        <SubjectGradeEntry
          students={students}
          subjects={subjects}
          term={selectedTerm}
          grade={grade}
        />
      )}

      {/* ── Vue PAR ÉLÈVE ── */}
      {entryMode === 'student' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Liste élèves */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Élèves ({filteredStudents.length})
          </h3>
          <div className="space-y-1">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun élève</p>
            ) : filteredStudents.map(student => {
              const tg = grades.filter(g => g.studentId === student.id && g.term === selectedTerm);
              const avg = calculateAverage(tg);
              const isSel = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isSel ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{student.firstName} {student.lastName}</div>
                      <div className={`text-xs ${isSel ? 'text-indigo-200' : 'text-gray-400'}`}>
                        N°{student.studentNumber}
                      </div>
                    </div>
                    {tg.length > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSel ? 'bg-indigo-500 text-white' :
                        avg >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {avg.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saisie notes */}
        {selectedStudent ? (
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-xs text-gray-500">
                  Trimestre {selectedTerm} — {grade}
                  {currentTermGrades.length > 0 && (
                    <span className="ml-2 font-semibold text-indigo-600">
                      Moy: {studentAverage.toFixed(2)}/20
                    </span>
                  )}
                </p>
              </div>
              {currentTermGrades.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Calculator size={13} />
                  <span>{currentTermGrades.length}/{subjects.length} matière(s) notée(s)</span>
                </div>
              )}
            </div>

            <GradeInput
              studentId={selectedStudent.id}
              subjects={subjects}
              term={selectedTerm}
              grades={grades}
              onGradeChange={handleGradeChange}
              onGradeDelete={handleGradeDelete}
            />
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-5 flex items-center justify-center min-h-[300px]">
            <div className="text-center text-gray-400">
              <Calculator size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-base">Sélectionnez un élève</p>
              <p className="text-sm mt-1">pour saisir ses notes</p>
            </div>
          </div>
        )}
      </div>
      )}

      {showSubjectManager && (
        <SubjectManager
          subjects={subjects}
          onSubjectsChange={handleSubjectsChange}
          onClose={() => setShowSubjectManager(false)}
        />
      )}

      {showImport && (
        <GradesImportModal
          students={students}
          subjects={subjects}
          term={selectedTerm}
          grade={grade}
          onClose={() => setShowImport(false)}
          onImported={async () => {
            await loadAllClassGrades();
            if (selectedStudent) await loadGrades(selectedStudent);
          }}
        />
      )}
    </div>
  );
}
