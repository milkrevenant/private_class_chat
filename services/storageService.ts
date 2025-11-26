import { ChatSession, ClassroomConfig } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'classroom_ai_sessions',
  CLASSROOMS: 'classroom_ai_classrooms',
  LAST_TEACHER: 'classroom_ai_last_teacher' // To remember the teacher login
};

// --- Classroom / Teacher Management ---

const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const getClassroom = (code: string): ClassroomConfig | null => {
  const classrooms = getAllClassrooms();
  return classrooms.find(c => c.code === code) || null;
};

export const getAllClassrooms = (): ClassroomConfig[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
  return stored ? JSON.parse(stored) : [];
};

export const saveClassroom = (config: ClassroomConfig) => {
  const classrooms = getAllClassrooms();
  const index = classrooms.findIndex(c => c.code === config.code);
  
  if (index >= 0) {
    classrooms[index] = config;
  } else {
    classrooms.push(config);
  }
  
  localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(classrooms));
};

export const createClassroom = (teacherName: string): ClassroomConfig => {
  const newConfig: ClassroomConfig = {
    code: generateCode(),
    teacherName,
    apiKey: '', // Teacher must set this
    systemInstruction: "You are a helpful and polite teaching assistant. Answer questions clearly and concisely suitable for students.",
    createdAt: Date.now()
  };
  saveClassroom(newConfig);
  return newConfig;
};

// --- Session Management ---

export const getSessions = (userId: string): ChatSession[] => {
  const allSessionsStr = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  const allSessions: ChatSession[] = allSessionsStr ? JSON.parse(allSessionsStr) : [];
  return allSessions
    .filter(s => s.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

// New function: Get all sessions belonging to a specific class code (For Teachers)
export const getSessionsByClass = (classCode: string): ChatSession[] => {
  const allSessionsStr = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  const allSessions: ChatSession[] = allSessionsStr ? JSON.parse(allSessionsStr) : [];
  return allSessions
    .filter(s => s.classCode === classCode)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const saveSession = (session: ChatSession) => {
  const allSessionsStr = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  let allSessions: ChatSession[] = allSessionsStr ? JSON.parse(allSessionsStr) : [];

  // Remove existing version of this session if it exists
  allSessions = allSessions.filter(s => s.id !== session.id);
  
  // Add updated session
  allSessions.push(session);

  // Enforce 20 session limit per user
  const userSessions = allSessions
    .filter(s => s.userId === session.userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (userSessions.length > 20) {
    const sessionsKeep = userSessions.slice(0, 20);
    const sessionIdsToKeep = new Set(sessionsKeep.map(s => s.id));
    // Remove the oldest ones for this user from the global list
    allSessions = allSessions.filter(s => s.userId !== session.userId || sessionIdsToKeep.has(s.id));
  }

  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
};

export const createSession = (userId: string, modelId: string, classCode?: string): ChatSession => {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    userId,
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    modelId,
    classCode
  };
  saveSession(newSession);
  return newSession;
};

export const deleteSession = (sessionId: string) => {
    const allSessionsStr = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    let allSessions: ChatSession[] = allSessionsStr ? JSON.parse(allSessionsStr) : [];
    allSessions = allSessions.filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
}