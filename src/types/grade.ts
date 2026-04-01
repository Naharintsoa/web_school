export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  term: 1 | 2 | 3;
  score: number;
  coefficient: number;
  classAverage: number;
  minScore: number;
  maxScore: number;
  comments?: string;
}