export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  coefficient: number;
}

export interface TeacherAssignment {
  teacherId: string;
  subjectId: string;
  grades: string[]; // List of grades this teacher teaches this subject to
}