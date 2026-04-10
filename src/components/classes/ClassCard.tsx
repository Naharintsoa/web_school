/**
 * Carte d'une classe avec menu déroulant pour accéder aux élèves,
 * aux notes, et au hub Documents (badges, cartes d'identité, certificats).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, BookOpen, Printer, Pencil, Save, X } from 'lucide-react';
import type { Student } from '../../types';
import type { ClassLevel } from '../../types/student';
import { ClassStudentsList } from './ClassStudentsList';
import { ClassDocumentsHub } from './documents/ClassDocumentsHub';
import { studentApi } from '../../services/api';
import { classTeachersApi } from '../../services/api/classTeachersApi';
import { useNavigation } from '../../contexts/NavigationContext';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useSchool } from '../../contexts/SchoolContext';
import { FR } from '../../constants/translations';

interface ClassCardProps {
  grade: ClassLevel;
  totalStudents: number;
  teachers: string[] | string;
  isSelected?: boolean;
  onSelect: () => void;
}

export function ClassCard({ grade, totalStudents, teachers, isSelected, onSelect }: ClassCardProps) {
  const { navigateToGrades } = useNavigation();
  const { currentYear } = useSchoolYear();
  const { currentSchool } = useSchool();
  const [isOpen, setIsOpen] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showDocumentsHub, setShowDocumentsHub] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Professeur principal — chargé depuis la base, éditable
  const [principalTeacher, setPrincipalTeacher] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(false);
  const [editTeacherVal, setEditTeacherVal] = useState('');
  const [savingTeacher, setSavingTeacher] = useState(false);

  useEffect(() => {
    classTeachersApi.get(currentSchool, grade).then(name => {
      if (name) setPrincipalTeacher(name);
    });
  }, [currentSchool, grade]);

  const startEditTeacher = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTeacherVal(principalTeacher);
    setEditingTeacher(true);
  };
  const cancelEditTeacher = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTeacher(false);
  };
  const saveTeacher = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingTeacher(true);
    try {
      await classTeachersApi.update(currentSchool, grade, editTeacherVal.trim());
      setPrincipalTeacher(editTeacherVal.trim());
      setEditingTeacher(false);
    } finally {
      setSavingTeacher(false);
    }
  };

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadStudents = async () => {
    const all = await studentApi.getAll(currentYear, currentSchool);
    setStudents(all.filter(s => s.grade === grade));
  };

  const handleViewStudents = async () => {
    await loadStudents();
    setShowStudents(true);
    setIsOpen(false);
  };

  const handleViewGrades = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    navigateToGrades(grade);
  };

  const handleOpenDocuments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await loadStudents();
    setShowDocumentsHub(true);
    setIsOpen(false);
  };

  const isCollege = /^(6EME|5EME|4EME|3EME)(-[AB])?$/.test(grade);
  const isAnnexe = currentSchool === 'sully-annexe';

  return (
    <>
      <div
        className={`bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
          isSelected
            ? isAnnexe
              ? 'border-violet-600 shadow-md ring-2 ring-violet-100'
              : 'border-indigo-600 shadow-md ring-2 ring-indigo-100'
            : isAnnexe
              ? 'border-gray-200 hover:border-violet-300'
              : 'border-gray-200 hover:border-indigo-300'
        }`}
        onClick={onSelect}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{grade}</h3>

            {/* Menu déroulant d'actions */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  isOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Actions"
              >
                <Users size={18} />
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-lg shadow-xl bg-white border border-gray-100 z-20">
                  <div className="py-1">
                    {/* Voir les élèves */}
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleViewStudents(); }}
                    >
                      <Users size={15} className="mr-3 text-gray-400" />
                      {FR.classes.viewStudents}
                    </button>

                    {/* Voir les notes */}
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      onClick={handleViewGrades}
                    >
                      <BookOpen size={15} className="mr-3 text-gray-400" />
                      {FR.classes.viewGrades}
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    {/* Hub Documents (badges, cartes d'identité, certificats) */}
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                      onClick={handleOpenDocuments}
                    >
                      <Printer size={15} className="mr-3 text-gray-400" />
                      Documents de classe
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Infos de la classe */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                totalStudents > 0
                  ? isAnnexe ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <Users size={13} />
                <span>{totalStudents} élève{totalStudents !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {FR.classes.classTeacher}
              </p>
              {editingTeacher ? (
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTeacherVal}
                    onChange={e => setEditTeacherVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveTeacher(e as unknown as React.MouseEvent);
                      if (e.key === 'Escape') cancelEditTeacher(e as unknown as React.MouseEvent);
                    }}
                    autoFocus
                    className="text-xs border border-indigo-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-transparent flex-1 min-w-0"
                    placeholder="Nom du professeur principal"
                  />
                  <button
                    onClick={saveTeacher}
                    disabled={savingTeacher}
                    className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50 shrink-0"
                    title="Enregistrer"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={cancelEditTeacher}
                    className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
                    title="Annuler"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-gray-600 pl-1 flex-1">
                    {principalTeacher ? `• ${principalTeacher}` : <span className="text-gray-400 italic text-xs">Non renseigné</span>}
                  </p>
                  <button
                    onClick={startEditTeacher}
                    className="p-0.5 text-gray-300 hover:text-indigo-500 transition-colors shrink-0"
                    title="Modifier le professeur principal"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStudents && (
        <ClassStudentsList
          grade={grade}
          students={students}
          onClose={() => setShowStudents(false)}
          onStudentsChange={loadStudents}
        />
      )}

      {showDocumentsHub && (
        <ClassDocumentsHub
          grade={grade}
          students={students}
          onClose={() => setShowDocumentsHub(false)}
        />
      )}
    </>
  );
}
