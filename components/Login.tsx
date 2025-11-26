import React, { useState } from 'react';
import { User, UserRole, ClassroomConfig } from '../types';
import { getClassroom, createClassroom, getAllClassrooms } from '../services/storageService';
import { School, UserCircle, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, classroomConfig: ClassroomConfig) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.STUDENT);
  
  // Student State
  const [studentId, setStudentId] = useState('');
  const [classCode, setClassCode] = useState('');
  
  // Teacher State
  const [teacherName, setTeacherName] = useState('');
  
  const [error, setError] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId.trim() || !classCode.trim()) {
      setError('Please enter both your Student ID and Class Code.');
      return;
    }

    const classroom = getClassroom(classCode.trim().toUpperCase());
    if (!classroom) {
      setError('Invalid Class Code. Please ask your teacher for the correct code.');
      return;
    }

    onLogin(
      { id: studentId.trim(), role: UserRole.STUDENT, name: `Student ${studentId}`, classCode: classroom.code },
      classroom
    );
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherName.trim()) {
        setError('Please enter your name.');
        return;
    }

    // In a local app, we'll check if a classroom exists for this "Teacher Name" (simplified auth)
    // Or just create a new one. For better UX in this demo, let's look for existing or create new.
    const allClassrooms = getAllClassrooms();
    let classroom = allClassrooms.find(c => c.teacherName.toLowerCase() === teacherName.trim().toLowerCase());

    if (!classroom) {
        // Create new classroom for this teacher
        classroom = createClassroom(teacherName.trim());
    }

    onLogin(
        { id: `teacher-${classroom.code}`, role: UserRole.TEACHER, name: teacherName, classCode: classroom.code },
        classroom
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all">
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-slate-900 to-black"></div>
          <School className="w-14 h-14 mx-auto mb-3 relative z-10 text-indigo-400" />
          <h1 className="text-3xl font-bold relative z-10">Classroom AI</h1>
          <p className="text-slate-300 text-sm mt-1 relative z-10">Connect & Learn Securely</p>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === UserRole.STUDENT
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => {
                setActiveTab(UserRole.STUDENT);
                setError('');
            }}
          >
            <UserCircle size={20} /> Student
          </button>
          <button
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === UserRole.TEACHER
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => {
                setActiveTab(UserRole.TEACHER);
                setError('');
            }}
          >
            <ShieldCheck size={20} /> Teacher
          </button>
        </div>

        <div className="p-8">
          {activeTab === UserRole.STUDENT ? (
            <form onSubmit={handleStudentLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Student Number / ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. 2024001"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Class Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white font-mono uppercase tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                    placeholder="e.g. X7Y9Z2"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter the code provided by your teacher.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                   <div className="mt-0.5">⚠️</div>
                   <div>{error}</div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                Enter Classroom <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleTeacherLogin} className="space-y-5">
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 mb-4">
                  Create or access your classroom to get a <strong>Class Code</strong> for your students. You will need to provide your own Gemini API Key.
               </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. Mr. Anderson"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                   {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                Access Dashboard
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;