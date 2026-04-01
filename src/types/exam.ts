export interface ExamSubject {
  id: string;
  subjectId: string;
  year: string;
  term: 1 | 2 | 3;
  grade: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExamFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}