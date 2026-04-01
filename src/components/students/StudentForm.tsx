import React from 'react';
import type { Student, Grade } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { getGradeCycle } from '../../utils/cycles';
import { StudentInfoSection } from './form-sections/StudentInfoSection';
import { ParentInfoSection } from './form-sections/ParentInfoSection';
import { PhotoUploadSection } from './form-sections/PhotoUploadSection';
import { FR } from '../../constants/translations';

interface StudentFormProps {
  student?: Student;
  initialGrade?: Grade;
  onSubmit: (student: Omit<Student, 'id'>) => void;
  onCancel: () => void;
}

const defaultParentInfo = {
  fatherName: '',
  fatherOccupation: '',
  fatherPhone: '',
  motherName: '',
  motherOccupation: '',
  motherPhone: '',
  email: '',
  address: '',
};

export function StudentForm({ student, initialGrade, onSubmit, onCancel }: StudentFormProps) {
  const { currentYear } = useSchoolYear();
  const [formData, setFormData] = React.useState<Omit<Student, 'id'>>({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    commonName: student?.commonName || '',
    dateOfBirth: student?.dateOfBirth || '',
    gender: student?.gender || 'male',
    grade: initialGrade || student?.grade || 'PS',
    cycle: student?.cycle || (initialGrade ? getGradeCycle(initialGrade) : 'CYCLE1'),
    photoUrl: student?.photoUrl || '',
    parentInfo: student?.parentInfo || defaultParentInfo,
    enrollmentDate: student?.enrollmentDate || new Date().toISOString().split('T')[0],
    schoolYear: student?.schoolYear || currentYear,
    studentNumber: student?.studentNumber || 0,
    matricule: student?.matricule || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateStudentInfo = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateParentInfo = (updates: Partial<typeof formData.parentInfo>) => {
    setFormData(prev => ({
      ...prev,
      parentInfo: { ...prev.parentInfo, ...updates },
    }));
  };

  const handlePhotoChange = (photoUrl: string) => {
    updateStudentInfo({ photoUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow">
      <PhotoUploadSection
        currentPhotoUrl={formData.photoUrl}
        onPhotoChange={handlePhotoChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StudentInfoSection
          data={formData}
          onUpdate={updateStudentInfo}
        />
        <ParentInfoSection
          data={formData.parentInfo}
          onUpdate={updateParentInfo}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {FR.common.cancel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {student ? FR.common.save : FR.common.add}
        </button>
      </div>
    </form>
  );
}