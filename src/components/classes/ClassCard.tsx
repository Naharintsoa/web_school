/**
 * Carte d'une classe avec menu déroulant pour accéder aux élèves,
 * aux notes, et au hub Documents (badges, cartes d'identité, certificats).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, BookOpen, Printer } from 'lucide-react';
import type { Grade, Student } from '../../types';
import { ClassStudentsList } from './ClassStudentsList';
import { ClassDocumentsHub } from './documents/ClassDocumentsHub';
import { studentApi } from '../../services/api';
import { useNavigation } from '../../contexts/NavigationContext';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { FR } from '../../constants/translations';

interface ClassCardProps {
  grade: Grade;
  totalStudents: number;
  teachers: string[] | string;
  isSelected?: boolean;
  onSelect: () => void;
}

export function ClassCard({ grade, totalStudents, teachers, isSelected, onSelect }: ClassCardProps) {
  const { navigateToGrades } = useNavigation();
  const { currentYear } = useSchoolYear();
  const [isOpen, setIsOpen] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showDocumentsHub, setShowDocumentsHub] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const all = await studentApi.getAll(currentYear);
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

  const isCollege = ['6EME', '5EME', '4EME', '3EME'].includes(grade);

  return (
    <>
      <div
        className={`bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
          isSelected
            ? 'border-indigo-600 shadow-md ring-2 ring-indigo-100'
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
                totalStudents > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Users size={13} />
                <span>{totalStudents} élève{totalStudents !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {isCollege ? FR.classes.classTeacher : FR.classes.classTeachers}
              </p>
              {Array.isArray(teachers) ? (
                teachers.slice(0, 3).map((teacher, i) => (
                  <p key={i} className="text-sm text-gray-600 pl-1">• {teacher}</p>
                ))
              ) : (
                <p className="text-sm text-gray-600 pl-1">• {teachers}</p>
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
