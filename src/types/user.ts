export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}