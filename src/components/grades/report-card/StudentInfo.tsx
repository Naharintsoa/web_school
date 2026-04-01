import React from 'react';
import type { Student } from '../../../types';

interface StudentInfoProps {
  student: Student;
  schoolYear: string;
}

export function StudentInfo({ student, schoolYear }: StudentInfoProps) {
  return (
    <div className="student-info">
      <div className="student-details">
        <table>
          <tbody>
            <tr>
              <th>Nom(s)</th>
              <th><strong>{student.lastName}</strong></th>
            </tr>
            <tr>
              <th>Prénom(s)</th>
              <th><strong>{student.firstName}</strong></th>
            </tr>
            <tr>
              <th>Née le</th>
              <th>{new Date(student.dateOfBirth).toLocaleDateString()}</th>
            </tr>
            <tr>
              <th>Classe</th>
              <th>{student.grade}</th>
            </tr>
            <tr>
              <th>Année scolaire</th>
              <th>{schoolYear}</th>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="parent-info">
        <table>
          <tbody>
            <tr>
              <th>Nom des parents</th>
            </tr>
            <tr>
              <td>{student.parentInfo.fatherName}</td>
            </tr>
            <tr>
              <td>{student.parentInfo.motherName}</td>
            </tr>
            <tr>
              <th>Adresse des parents</th>
            </tr>
            <tr>
              <td>{student.parentInfo.address}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}