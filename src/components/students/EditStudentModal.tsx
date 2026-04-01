import React from 'react';
import { X } from 'lucide-react';
import type { Student } from '../../types';
import { StudentForm } from './StudentForm';
import { FR } from '../../constants/translations';

interface EditStudentModalProps {
  student: Student;
  onSave: (updatedStudent: Omit<Student, 'id'>) => void;
  onClose: () => void;
}

export function EditStudentModal({ student, onSave, onClose }: EditStudentModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {FR.students.firstName} {student.firstName} {student.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-129px)]">
          <StudentForm
            student={student}
            onSubmit={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}