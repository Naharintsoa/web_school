import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Retourne le socket Socket.IO (singleton). Crée la connexion si nécessaire. */
export function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// Types partagés session

export interface CouncilParticipant {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface CouncilRemark {
  author: string;
  text: string;
  at: string;
}

export interface CouncilStudent {
  id: string;
  firstName: string;
  lastName: string;
  matricule?: string;
  avg: number;
}

export interface CouncilDiapoData {
  slides: any[];
  subjects: any[];
  classStats: Record<string, { avg: number; min: number; max: number }>;
  classAvg: number;
  isBrevet: boolean;
}

export interface CouncilSession {
  id: string;
  grade: string;
  term: 1 | 2 | 3;
  schoolYear: string;
  students: CouncilStudent[];
  currentStudentIndex: number;
  participants: CouncilParticipant[];
  remarks: Record<string, CouncilRemark[]>;
  phase: 'waiting' | 'active' | 'closed';
  createdAt: string;
  diapoData: CouncilDiapoData | null;
}
