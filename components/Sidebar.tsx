import React from 'react';
import { ChatSession, User } from '../types';
import { MessageSquare, Plus, LogOut, Trash2 } from 'lucide-react';

interface SidebarProps {
  user: User;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLogout,
}) => {
  return (
    <div className="w-72 bg-slate-900 flex flex-col h-full border-r border-slate-800 flex-shrink-0">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {user.id.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-white font-medium truncate">{user.name}</h3>
            <p className="text-slate-400 text-xs">Student Account</p>
          </div>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium text-sm"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Chats ({sessions.length}/20)
        </div>
        
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No chats yet. Start a new one!
          </div>
        ) : (
          <ul className="space-y-1 px-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group relative ${
                    currentSessionId === session.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="truncate text-sm pr-6">
                    {session.title || 'Untitled Chat'}
                  </span>
                  
                  <div
                    onClick={(e) => onDeleteSession(e, session.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm rounded-lg hover:bg-slate-800"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;