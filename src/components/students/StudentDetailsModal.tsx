import React from 'react';
import { X, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import type { Student } from '../../types/student';
import { EditStudentModal } from './EditStudentModal';
import { SiblingsSection } from './SiblingsSection';

import { studentApi } from '../../services/api';
import { FR } from '../../constants/translations';

interface StudentDetailsModalProps {
  student: Student;
  allStudents: Student[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export function StudentDetailsModal({ student, allStudents, onClose, onEdit, onDelete }: StudentDetailsModalProps) {
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [currentStudent, setCurrentStudent] = React.useState(student);

  const handleSave = async (updatedStudent: Omit<Student, 'id'>) => {
    try {
      const updated = await studentApi.update(student.id, updatedStudent);
      setCurrentStudent(updated);
      onEdit(updated);
      setShowEditModal(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Une erreur est survenue lors de la mise à jour');
    }
  };

  if (showEditModal) {
    return (
      <EditStudentModal
        student={currentStudent}
        onSave={handleSave}
        onClose={() => setShowEditModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentStudent.firstName} {currentStudent.lastName}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={() => onDelete(currentStudent)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Photo de profil */}
            <div className="flex-shrink-0">
              {currentStudent.photoUrl ? (
                <img
                  src={currentStudent.photoUrl}
                  alt={`${currentStudent.firstName} ${currentStudent.lastName}`}
                  className="w-48 h-48 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-4xl font-medium">
                    {currentStudent.firstName[0]}{currentStudent.lastName[0]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{FR.students.studentInfo}</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.studentNumber}</dt>
                    <dd className="mt-1 text-sm text-gray-900">N°{currentStudent.studentNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.matricule}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentStudent.matricule ? currentStudent.matricule : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.dateOfBirth}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(currentStudent.dateOfBirth).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.gender}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {currentStudent.gender === 'male' ? FR.students.male : FR.students.female}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.grade}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentStudent.grade}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{FR.students.enrollmentDate}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(currentStudent.enrollmentDate).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{FR.students.parentInfo}</h3>
                <dl className="space-y-4">
                  {/* Father Info */}
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{FR.students.fatherInfo}</dt>
                    <dd className="mt-1">
                      <div className="text-sm text-gray-900">{currentStudent.parentInfo.fatherName}</div>
                      <div className="text-sm text-gray-500">{currentStudent.parentInfo.fatherOccupation}</div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Phone size={14} className="mr-1" />
                        {currentStudent.parentInfo.fatherPhone}
                      </div>
                    </dd>
                  </div>

                  {/* Mother Info */}
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{FR.students.motherInfo}</dt>
                    <dd className="mt-1">
                      <div className="text-sm text-gray-900">{currentStudent.parentInfo.motherName}</div>
                      <div className="text-sm text-gray-500">{currentStudent.parentInfo.motherOccupation}</div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Phone size={14} className="mr-1" />
                        {currentStudent.parentInfo.motherPhone}
                      </div>
                    </dd>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <dt className="text-sm font-medium text-gray-700">{FR.students.contactInfo}</dt>
                    <dd className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={14} className="mr-1" />
                        {currentStudent.parentInfo.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={14} className="mr-1" />
                        {currentStudent.parentInfo.address}
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Fratries */}
          <SiblingsSection
            student={currentStudent}
            allStudents={allStudents}
            onStudentUpdated={(updated) => {
              if (updated.id === currentStudent.id) setCurrentStudent(updated);
            }}
          />
        </div>
      </div>
    </div>
  );
}