
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, isResearchMode?: boolean) => void;
  isTyping: boolean;
  onSaveRecommendation: (message: Message) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, onSaveRecommendation }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleResearchClick = () => {
    if (!input.trim()) {
        onSendMessage("Hãy phân tích kỹ thuật chuyên sâu dựa trên mô hình nghiên cứu cho mã FPT", true);
    } else {
        onSendMessage(input, true);
        setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-850 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
             <h2 className="font-semibold text-white leading-none">Trợ lý ảo VN-Index</h2>
             <span className="text-[10px] text-blue-400 font-medium">Agentic RAG + LSTM Logic</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">Powered by Gemini 2.5</div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] lg:max-w-[75%] rounded-2xl p-4 relative group ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              
              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Nguồn tham khảo:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline bg-gray-900/50 px-2 py-1 rounded"
                      >
                        {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`text-[10px] mt-2 flex items-center justify-end gap-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                 {msg.role === 'model' && (
                    <button 
                      onClick={() => onSaveRecommendation(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-blue-400 mr-auto"
                      title="Lưu khuyến nghị"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M10 2a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5h-7.5a.75.75 0 010-1.5h7.5v-7.5A.75.75 0 0110 2z" />
                      </svg>
                      Lưu tin
                    </button>
                 )}
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-none p-4 border border-gray-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-850 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về mã cổ phiếu (VD: FPT thế nào?)..."
            className="w-full bg-gray-900 text-white rounded-full pl-5 pr-14 py-4 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
           {['FPT', 'VCB', 'HPG'].map(ticker => (
             <button 
               key={ticker}
               onClick={() => onSendMessage(`Phân tích cổ phiếu ${ticker}`)}
               className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white whitespace-nowrap transition"
             >
               {ticker}
             </button>
           ))}
           <div className="h-4 w-px bg-gray-700 mx-1"></div>
           <button
              onClick={handleResearchClick}
              className="px-3 py-1 text-xs rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700 hover:bg-indigo-800 hover:text-white whitespace-nowrap transition flex items-center gap-1"
              title="Áp dụng phương pháp từ bài báo khoa học (SMA, RSI, MACD)"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M15.5 2A1.5 1.5 0 0014 3.5v8a1.5 1.5 0 001.5 1.5h3.5a.5.5 0 00.5-.5v-9a1.5 1.5 0 00-1.5-1.5h-2.5zM14 3.5a.5.5 0 01.5-.5h2.5a.5.5 0 01.5.5v7.5h-3.5v-7.5zM3 3a1 1 0 00-1 1v4.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V4a1 1 0 00-1-1H3z" />
                <path d="M3.5 10a.5.5 0 00-.5.5v3.5a1 1 0 001 1h4.5a.5.5 0 00.5-.5V11a1 1 0 00-1-1h-4.5z" />
             </svg>
             Phân tích Research (LSTM)
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
