import React from 'react';
import type { Teacher } from '../../types/teacher';
import { SUBJECTS } from '../../data/subjects';
import { SubjectExams } from '../subjects/SubjectExams';

interface TeacherSubjectsProps {
  teacher: Teacher;
  grade: string;
}

export function TeacherSubjects({ teacher, grade }: TeacherSubjectsProps) {
  const teacherSubjects = SUBJECTS.filter(subject => subject.teacherId === teacher.id);

  return (
    <div className="space-y-6">
      {teacherSubjects.map(subject => (
        <SubjectExams key={subject.id} subject={subject} grade={grade} />
      ))}
    </div>
  );
}