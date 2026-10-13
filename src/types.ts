export type UserRole = 'member' | 'admin' | 'visitor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  points: number;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  phone?: string;
  familyRole?: string; // ex: 'Pai', 'Mãe', 'Filho(a)', 'Jovem', 'Casal', 'Outro'
  joinedAt?: number;
}

export interface CellMember {
  id: string;
  name: string;
  role: UserRole;
  points: number;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  familyRole?: string;
  joinedAt: number;
  lastActive?: number;
}

export interface BlogPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  createdAt: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  type: 'cell' | 'church' | 'special';
  snackScale?: string;
  speaker?: string;
  dynamics?: string;
  worship?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  isRead?: boolean;
}

export interface ChatAttachment {
  name: string;
  type: 'image' | 'audio' | 'video' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'file';
  mimeType: string;
  size: number;
  url: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  text: string;
  timestamp: number;
  attachment?: ChatAttachment;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'master' | 'extreme';
  points: number;
}

export interface HangmanLevel {
  word: string;
  hint: string;
}

export interface WordSearchLevel {
  theme: string;
  words: string[];
}
