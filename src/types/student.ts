export type Gender = 'male' | 'female';

export type Grade = 
  | 'PS' | 'MS' | 'GS'           // Cycle 1
  | 'CP' | 'CE1' | 'CE2'        // Cycle 2
  | 'CM1' | 'CM2' | '6EME'      // Cycle 3
  | '5EME' | '4EME' | '3EME';   // Cycle 4

export type Cycle = 'CYCLE1' | 'CYCLE2' | 'CYCLE3' | 'CYCLE4';

export interface ParentInfo {
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  email: string;
  address: string;
}

export interface Student {
  id: string;
  studentNumber: number;
  matricule: string;
  firstName: string;
  lastName: string;
  commonName?: string;
  dateOfBirth: string;
  gender: Gender;
  grade: Grade;
  cycle: Cycle;
  photoUrl?: string;
  issNumber?: string;
  familyId?: string;
  parentInfo: ParentInfo;
  enrollmentDate: string;
  schoolYear: string;
}

export interface MatriculeInfo {
  year: string;
  grade: Grade;
  sequence: number;
}