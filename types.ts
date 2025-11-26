
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export interface User {
  id: string;
  role: UserRole;
  name?: string;
  classCode?: string; // Links student to a specific classroom configuration
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachment?: string; // Base64 string for images
  feedback?: string; // Teacher's feedback on this specific message
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  modelId: string;
  classCode?: string; // Which class context was this session created in
}

export interface ClassroomConfig {
  code: string; // Unique 6-char code (e.g., "A1B2C3")
  teacherName: string;
  apiKey: string;
  systemInstruction: string;
  createdAt: number;
}

export enum ModelType {
  GEMINI_PRO = 'gemini-3-pro-preview',
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_IMAGE = 'gemini-2.5-flash-image',
}
