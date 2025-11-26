import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { User, UserRole, ChatSession, ModelType, ClassroomConfig } from './types';
import { getSessions, createSession, deleteSession, getClassroom } from './services/storageService';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [classroomConfig, setClassroomConfig] = useState<ClassroomConfig | null>(null);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load user from session storage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('classroom_ai_user');
    const storedClassCode = sessionStorage.getItem('classroom_ai_classcode');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // If user is part of a class (Student OR Teacher), try to load that config
      const codeToLoad = storedClassCode || parsedUser.classCode;
      if (codeToLoad) {
          const config = getClassroom(codeToLoad);
          if (config) {
              setClassroomConfig(config);
          }
      }
    }
  }, []);

  // Poll for classroom config updates (e.g., API key changes by teacher)
  useEffect(() => {
      if (user && classroomConfig) {
          const checkConfig = () => {
              const latest = getClassroom(classroomConfig.code);
              if (latest && (latest.apiKey !== classroomConfig.apiKey || latest.systemInstruction !== classroomConfig.systemInstruction)) {
                  console.log("Detected classroom config update, reloading...");
                  setClassroomConfig(latest);
              }
          };
          
          window.addEventListener('focus', checkConfig);
          // Also check periodically
          const interval = setInterval(checkConfig, 2000);
          
          return () => {
              window.removeEventListener('focus', checkConfig);
              clearInterval(interval);
          };
      }
  }, [user, classroomConfig]);

  // Load sessions when user changes
  useEffect(() => {
    if (user && user.role === UserRole.STUDENT) {
      const userSessions = getSessions(user.id);
      setSessions(userSessions);
      if (userSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(userSessions[0].id);
      }
    }
  }, [user]);

  const handleLogin = (newUser: User, config: ClassroomConfig) => {
    setUser(newUser);
    setClassroomConfig(config);
    sessionStorage.setItem('classroom_ai_user', JSON.stringify(newUser));
    sessionStorage.setItem('classroom_ai_classcode', config.code);
  };

  const handleLogout = () => {
    setUser(null);
    setClassroomConfig(null);
    setSessions([]);
    setCurrentSessionId(null);
    sessionStorage.clear();
  };

  const handleNewChat = () => {
    if (!user || !classroomConfig) return;
    const newSession = createSession(user.id, ModelType.GEMINI_FLASH, classroomConfig.code);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
        deleteSession(id);
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) {
            setCurrentSessionId(null);
        }
    }
  };

  const updateCurrentSession = (updatedSession: ChatSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  // Render Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Render Teacher Dashboard
  if (user.role === UserRole.TEACHER && classroomConfig) {
    return <TeacherDashboard user={user} initialClassroom={classroomConfig} onLogout={handleLogout} />;
  }

  // Render Student Chat Interface
  // Must have a classroom config to proceed (for API key and System Instructions)
  if (!classroomConfig) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-100 p-4 text-center">
              <div>
                  <h1 className="text-xl font-bold text-red-600 mb-2">Configuration Error</h1>
                  <p className="text-gray-600 mb-4">Classroom configuration could not be loaded.</p>
                  <button onClick={handleLogout} className="text-indigo-600 underline">Back to Login</button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          user={user}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setIsMobileMenuOpen(false);
          }}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="md:hidden h-14 bg-slate-900 text-white flex items-center px-4 justify-between flex-shrink-0">
            <button onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={24} />
            </button>
            <span className="font-semibold">Classroom AI</span>
            <div className="w-6"></div>
        </div>

        {currentSessionId && getCurrentSession() ? (
          <ChatArea 
            session={getCurrentSession()!} 
            onUpdateSession={updateCurrentSession}
            apiKey={classroomConfig.apiKey}
            systemInstruction={classroomConfig.systemInstruction}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-center p-4">
            <h2 className="text-xl font-semibold mb-2">Welcome, {user.name}</h2>
            <p className="mb-6 max-w-md">
                You are connected to <strong>Class {classroomConfig.code}</strong>.
                <br/>
                Select a chat from the sidebar or start a new one to begin.
            </p>
            <button 
                onClick={handleNewChat}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors font-medium"
            >
                Start New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;