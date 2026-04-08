export type Gender = 'male' | 'female';

export type SchoolId = 'sully' | 'sully-annexe';

/** Classes du Collège Sully (site principal) */
export type SullyClassLevel =
  | 'PS' | 'MS' | 'GS'           // Cycle 1
  | 'CP' | 'CE1' | 'CE2'         // Cycle 2
  | 'CM1' | 'CM2' | '6EME'       // Cycle 3
  | '5EME' | '4EME' | '3EME';    // Cycle 4

/** Classes de Sully Annexe — 2 sections parallèles A et B par niveau */
export type AnnexeClassLevel =
  | 'PS-A' | 'PS-B' | 'MS-A' | 'MS-B' | 'GS-A' | 'GS-B'
  | 'CP-A' | 'CP-B' | 'CE1-A' | 'CE1-B' | 'CE2-A' | 'CE2-B'
  | 'CM1-A' | 'CM1-B' | 'CM2-A' | 'CM2-B' | '6EME-A' | '6EME-B'
  | '5EME-A' | '5EME-B' | '4EME-A' | '4EME-B' | '3EME-A' | '3EME-B';

export type ClassLevel = SullyClassLevel | AnnexeClassLevel;

export type Cycle = 'CYCLE1' | 'CYCLE2' | 'CYCLE3' | 'CYCLE4';

export interface ParentInfo {
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail?: string;
  fatherAddress?: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail?: string;
  motherAddress?: string;
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
  nationality?: string;
  birthCity?: string;
  birthCountry?: string;
  grade: ClassLevel;
  cycle: Cycle;
  photoUrl?: string;
  issNumber?: string;
  exitDate?: string;
  status?: string;
  familyId?: string;
  parentInfo: ParentInfo;
  enrollmentDate: string;
  schoolYear: string;
  school: SchoolId;
}

export interface MatriculeInfo {
  year: string;
  grade: ClassLevel;
  sequence: number;
}