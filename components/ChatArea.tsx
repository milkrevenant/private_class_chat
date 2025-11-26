
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, ModelType } from '../types';
import { sendMessageToGemini, generateImage } from '../services/geminiService';
import { saveSession } from '../services/storageService';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Zap, AlertCircle, Image as ImageIcon, MessageCircle } from 'lucide-react';

interface ChatAreaProps {
  session: ChatSession;
  onUpdateSession: (updatedSession: ChatSession) => void;
  apiKey: string;
  systemInstruction: string;
}

// Simple Markdown Renderer (Duplicated to avoid complex file structure changes for now)
const MarkdownView: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (part.startsWith('```')) {
            const content = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
            return (
              <div key={index} className="my-2 p-3 bg-slate-900 text-slate-50 rounded-md font-mono text-xs overflow-x-auto">
                {content}
              </div>
            );
          } else {
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
              <span key={index}>
                {boldParts.map((subPart, subIndex) => {
                  if (subPart.startsWith('**') && subPart.endsWith('**')) {
                    return <strong key={subIndex} className="font-bold">{subPart.slice(2, -2)}</strong>;
                  }
                  return subPart;
                })}
              </span>
            );
          }
        })}
      </div>
    );
  };

const ChatArea: React.FC<ChatAreaProps> = ({ session, onUpdateSession, apiKey, systemInstruction }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Local state for model selection (persisted in session)
  const [selectedModel, setSelectedModel] = useState<string>(session.modelId || ModelType.GEMINI_PRO);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    setSelectedModel(session.modelId || ModelType.GEMINI_PRO);
  }, [session.messages, session.id]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    const updated = { ...session, modelId: model };
    onUpdateSession(updated);
    saveSession(updated);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // 1. Add User Message
    const userText = input.trim();
    setInput('');
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    let updatedSession = {
      ...session,
      messages: [...session.messages, userMsg],
      title: session.messages.length === 0 ? userText.slice(0, 30) + (userText.length > 30 ? '...' : '') : session.title,
      modelId: selectedModel 
    };

    onUpdateSession(updatedSession);
    saveSession(updatedSession);
    
    // Safety check for API Key AFTER adding user message so they see their input
    if (!apiKey) {
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "⚠️ SYSTEM ERROR: The Teacher has not configured the API Key yet. Please ask your teacher to enter the API Key in the 'API Configuration' tab of the dashboard.",
            timestamp: Date.now(),
        };
        const errorSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, errorMsg],
        };
        onUpdateSession(errorSession);
        saveSession(errorSession);
        return;
    }

    setIsLoading(true);

    try {
      if (selectedModel === ModelType.GEMINI_IMAGE) {
        // --- IMAGE GENERATION MODE ---
        const base64Image = await generateImage(userText, apiKey);
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "Here is the image you requested:",
          timestamp: Date.now(),
          attachment: base64Image
        };

        const finalSession = {
          ...updatedSession,
          messages: [...updatedSession.messages, aiMsg],
        };
        onUpdateSession(finalSession);
        saveSession(finalSession);

      } else {
        // --- TEXT CHAT MODE ---
        const aiResponseText = await sendMessageToGemini(
          session.messages, 
          userText,
          systemInstruction, // Use prop
          apiKey,            // Use prop
          selectedModel
        );

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: aiResponseText,
          timestamp: Date.now(),
        };

        const finalSession = {
          ...updatedSession,
          messages: [...updatedSession.messages, aiMsg],
        };

        onUpdateSession(finalSession);
        saveSession(finalSession);
      }

    } catch (error) {
        console.error("Chat error", error);
        
        let errorMessage = "Error: Unable to reach the AI service.";
        if (error instanceof Error) {
            errorMessage = `Error: ${error.message}`;
        }

        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: errorMessage,
            timestamp: Date.now(),
        };
        const errorSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, errorMsg],
        };
        onUpdateSession(errorSession);
        saveSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-10">
        <h2 className="font-semibold text-gray-800 truncate max-w-md">
          {session.title || 'New Chat'}
        </h2>
        
        {/* Model Selector */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleModelChange(ModelType.GEMINI_PRO)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedModel === ModelType.GEMINI_PRO
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles size={14} /> Gemini 3.0 Pro
          </button>
          <button
            onClick={() => handleModelChange(ModelType.GEMINI_FLASH)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedModel === ModelType.GEMINI_FLASH
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap size={14} /> Gemini Flash
          </button>
          <button
            onClick={() => handleModelChange(ModelType.GEMINI_IMAGE)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedModel === ModelType.GEMINI_IMAGE
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon size={14} /> Image Gen
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {!apiKey && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3 text-sm mb-4">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                <p><strong>Configuration Required:</strong> The teacher has not saved an API Key yet.</p>
            </div>
        )}

        {session.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <Bot size={64} className="mb-4" />
            <p>Start a conversation or generate an image</p>
          </div>
        )}
        
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className="flex flex-col gap-1 w-full"
          >
             <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                    {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${
                    msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                    }`}
                >
                    <MarkdownView text={msg.text} />
                    
                    {/* Image Attachment */}
                    {msg.attachment && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                        src={`data:image/png;base64,${msg.attachment}`} 
                        alt="Generated Content" 
                        className="w-full h-auto object-cover max-h-[400px]"
                        />
                    </div>
                    )}
                </div>
                </div>
             </div>

             {/* Feedback Display */}
             {msg.feedback && (
                 <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] ${msg.role === 'user' ? 'mr-11' : 'ml-11'}`}>
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs p-3 rounded-xl rounded-tr-sm shadow-sm relative animate-in fade-in slide-in-from-top-1">
                             <div className="absolute -top-1.5 right-4 w-3 h-3 bg-yellow-50 border-t border-l border-yellow-200 transform rotate-45"></div>
                             <div className="flex items-start gap-2">
                                <MessageCircle size={14} className="mt-0.5 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <span className="font-bold block text-yellow-700 mb-0.5">Teacher Feedback:</span>
                                    {msg.feedback}
                                </div>
                             </div>
                        </div>
                     </div>
                 </div>
             )}
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex max-w-[80%] gap-3">
               <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="p-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-gray-400" />
                 <span className="text-gray-400 text-sm">
                   {selectedModel === ModelType.GEMINI_IMAGE ? 'Generating Image...' : 'Thinking...'}
                 </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all bg-white shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel === ModelType.GEMINI_IMAGE ? "Describe the image you want to create..." : "Type your message here..."}
            className="w-full max-h-32 min-h-[44px] py-3 px-3 bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-400"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-lg mb-0.5 transition-colors flex-shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
           {selectedModel === ModelType.GEMINI_IMAGE ? 'Images are generated using Gemini Flash Image.' : 'AI can make mistakes. Please check important information.'}
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
