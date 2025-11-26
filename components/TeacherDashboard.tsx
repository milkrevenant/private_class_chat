import React, { useState, useEffect } from 'react';
import { ClassroomConfig, User, ChatSession } from '../types';
import { saveClassroom, getClassroom, getSessionsByClass } from '../services/storageService';
import { 
  Save, LogOut, Settings, Key, BookOpen, Copy, Check, LayoutDashboard, 
  MessageSquare, Users, AlertTriangle, Eye, ChevronRight, ChevronDown, Image as ImageIcon 
} from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  initialClassroom: ClassroomConfig;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'settings' | 'apikey' | 'logs';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, initialClassroom, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [classroom, setClassroom] = useState<ClassroomConfig>(initialClassroom);
  
  // Form States
  const [instruction, setInstruction] = useState(initialClassroom.systemInstruction);
  const [apiKey, setApiKey] = useState(initialClassroom.apiKey);
  
  // Logs State
  const [classSessions, setClassSessions] = useState<ChatSession[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // UI States
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Refresh classroom data
    const current = getClassroom(classroom.code);
    if (current) setClassroom(current);

    // Refresh logs when tab is active
    if (activeTab === 'logs') {
        const sessions = getSessionsByClass(classroom.code);
        setClassSessions(sessions);
    }
  }, [activeTab, classroom.code]);

  const handleSave = () => {
    const updatedClassroom = {
      ...classroom,
      systemInstruction: instruction,
      apiKey: apiKey
    };
    saveClassroom(updatedClassroom);
    setClassroom(updatedClassroom);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group sessions by UserId for the logs view
  const getGroupedSessions = () => {
    const groups: {[key: string]: ChatSession[]} = {};
    classSessions.forEach(s => {
        if (!groups[s.userId]) groups[s.userId] = [];
        groups[s.userId].push(s);
    });
    return groups;
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
             <LayoutDashboard size={24} />
             <span>Teacher Admin</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">Hello, {user.name}</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Overview" />
          <SidebarItem id="logs" icon={Users} label="Student Logs" />
          <SidebarItem id="apikey" icon={Key} label="API Configuration" />
          <SidebarItem id="settings" icon={BookOpen} label="System Guidelines" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
           <h1 className="text-2xl font-bold text-gray-800">
             {activeTab === 'dashboard' && 'Classroom Overview'}
             {activeTab === 'logs' && 'Student Activity Logs'}
             {activeTab === 'apikey' && 'API Key Settings'}
             {activeTab === 'settings' && 'AI Behavior Guidelines'}
           </h1>
           <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Class Code: <span className="font-mono font-bold text-gray-800">{classroom.code}</span>
           </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wide text-xs">Your Class Code</h3>
                <div 
                    onClick={copyCode}
                    className="text-5xl font-mono font-bold text-indigo-600 bg-indigo-50 px-8 py-4 rounded-xl border-2 border-dashed border-indigo-200 cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center gap-4 group"
                    title="Click to copy"
                >
                    {classroom.code}
                    <Copy size={24} className="text-indigo-400 group-hover:text-indigo-600" />
                </div>
                <p className="mt-4 text-sm text-gray-500 max-w-xs">
                  Share this code with your students. They will need it combined with their Student ID to log in.
                </p>
                {copied && <span className="mt-2 text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12}/> Copied to clipboard!</span>}
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
                <h3 className="font-bold text-xl mb-2">Instructions</h3>
                <ul className="space-y-3 text-indigo-100 text-sm">
                   <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                      <span>Go to the <strong>API Configuration</strong> tab and enter your Google Gemini API Key.</span>
                   </li>
                   <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                      <span>Set global rules in the <strong>System Guidelines</strong> tab.</span>
                   </li>
                   <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                      <span>Monitor student progress in the <strong>Student Logs</strong> tab.</span>
                   </li>
                </ul>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm flex items-start gap-3">
                    <Eye size={20} className="flex-shrink-0 mt-0.5" />
                    <p>
                        This dashboard shows chat sessions stored on this device associated with Class Code <strong>{classroom.code}</strong>. 
                        Use this to monitor student activity during class.
                    </p>
                </div>

                {classSessions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <Users size={48} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900">No Activity Yet</h3>
                        <p className="text-gray-500">Students need to log in and start chatting for logs to appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                        {/* Student List */}
                        <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                                Students ({Object.keys(getGroupedSessions()).length})
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {Object.entries(getGroupedSessions()).map(([userId, sessions]) => (
                                    <div key={userId} className="border-b border-gray-100 last:border-0">
                                        <button 
                                            onClick={() => setExpandedUser(expandedUser === userId ? null : userId)}
                                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${expandedUser === userId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                                        >
                                            <span className="font-medium">Student {userId}</span>
                                            {expandedUser === userId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        
                                        {expandedUser === userId && (
                                            <div className="bg-gray-50 px-4 py-2 space-y-1">
                                                {sessions.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setSelectedSessionId(s.id)}
                                                        className={`w-full text-left text-xs py-2 px-3 rounded-md flex items-center gap-2 transition-colors ${selectedSessionId === s.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                                                    >
                                                        <MessageSquare size={12} />
                                                        <span className="truncate">{s.title || 'Untitled Chat'}</span>
                                                        <span className="ml-auto opacity-70">{new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transcript View */}
                        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                                Transcript View
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                {selectedSessionId ? (
                                    <div className="space-y-4">
                                        {classSessions.find(s => s.id === selectedSessionId)?.messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-lg p-3 text-sm border ${
                                                    msg.role === 'user' 
                                                    ? 'bg-white border-indigo-200 text-indigo-900' 
                                                    : 'bg-white border-gray-200 text-gray-800'
                                                }`}>
                                                    <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-wider">
                                                        {msg.role === 'user' ? 'Student' : 'AI Model'}
                                                    </div>
                                                    <div>{msg.text}</div>
                                                    {msg.attachment && (
                                                        <div className="mt-2 border border-gray-100 rounded overflow-hidden">
                                                            <div className="flex items-center gap-1 text-xs text-gray-500 p-1 bg-gray-50 border-b border-gray-100">
                                                                <ImageIcon size={12} /> Generated Image
                                                            </div>
                                                            <img 
                                                              src={`data:image/png;base64,${msg.attachment}`} 
                                                              alt="Transcript attachment" 
                                                              className="max-w-full h-auto"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                                        <MessageSquare size={32} />
                                        <p>Select a session to view the transcript</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}

          {/* API KEY TAB */}
          {activeTab === 'apikey' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                    <Key size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Google Gemini API Key</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Required for the chatbot to function. This key is used for all student requests in this classroom.
                        <br />
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            Get an API key here &rarr;
                        </a>
                    </p>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="block text-sm font-medium text-gray-700">Enter API Key</label>
                 <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder="AIzaSy..."
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                        {showKey ? "Hide" : "Show"}
                    </button>
                 </div>
                 
                 {!apiKey && (
                     <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertTriangle size={14} />
                        Warning: Students cannot chat until a valid API key is saved.
                     </div>
                 )}
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                 <button
                    onClick={handleSave}
                    className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2 ${
                        saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                 >
                    <Save size={18} />
                    {saved ? 'Settings Saved' : 'Save API Key'}
                 </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-[calc(100vh-140px)] flex flex-col">
               <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <Settings size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">System Prompt & Guidelines</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Define how the AI should behave. This instruction is hidden from students but guides every response.
                    </p>
                </div>
              </div>

              <textarea
                className="flex-1 w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed mb-6"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., You are a strict physics tutor. Do not give direct answers, but guide the student to the solution..."
              />

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                 <span className="text-xs text-gray-400">Changes apply to new messages immediately.</span>
                 <button
                    onClick={handleSave}
                    className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2 ${
                        saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                 >
                    <Save size={18} />
                    {saved ? 'Settings Saved' : 'Save Guidelines'}
                 </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;