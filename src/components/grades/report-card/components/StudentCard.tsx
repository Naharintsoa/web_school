import React from 'react';
import type { Student } from '../../../../types';

interface StudentCardProps {
  student: Student;
  schoolYear: string;
}

export function StudentCard({ student, schoolYear }: StudentCardProps) {
  return (
    <div className="info-card">
      <div className="grid-container">
        <div className="col-span-8">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Nom(s)</label>
              <p className="text-lg font-semibold">{student.lastName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Prénom(s)</label>
              <p className="text-lg font-semibold">{student.firstName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Né(e) le</label>
                <p>{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Classe</label>
                <p>{student.grade}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Parents</label>
              <p>{student.parentInfo.fatherName}</p>
              <p>{student.parentInfo.motherName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Adresse</label>
              <p className="text-sm">{student.parentInfo.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}