import type { Grade } from '../types/student';

// Définition des professeurs principaux par classe
const COLLEGE_TEACHERS = {
  '6EME': 'RAZAFIMIHAJA Saholimalala Odile',
  '5EME': 'RAVELOMANANTSOA Miora',
  '4EME': 'TAMARENA Hermann',
  '3EME': 'ANDRIANIRINA N. Micah'
};

// Combine tous les enseignants dans un seul objet
export const mockTeachers: Record<Grade, string | string[]> = {
  // Garder les enseignants existants pour le primaire
  'PS': ['RAMANANTAHIRY Norolalatiana Sylvia', 'RAVAOHARIMALALA Nirinasoa (Rani)'],
  'MS': ['RAMAROSON Berthe', 'RAZAIARIVELO Tafitaniaina Miangalihaingo Tsiverizo'],
  'GS': ['RAKOTONDRANAIVO Mbolatiana Koloina', 'RAZANABELO Farasoa Victoire'],
  'CP': ['RANDRIANARISOA Mioramalala Prisca', 'HELINIAINA Lantoarijaona'],
  'CE1': ['RANDRIANASOLO Raozy Miora'],
  'CE2': ['RAMANANIRAINY Norotahiana'],
  'CM1': ['RASOLOFOMANANA Franck Lalasoa'],
  'CM2': ['RAZAFIMIHAJA Saholimalala Odile'],
  // Professeurs principaux du collège
  ...COLLEGE_TEACHERS
};