"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { askCopilot } from "@/actions/gemini";

export function AiCopilot({ contextData }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I am your AI financial advisor. Ask me anything about your current budget or runway." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to screen
    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Call Gemini API
    const aiResponse = await askCopilot(userMsg, contextData);

    // Add AI response to screen
    setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="p-6 rounded-lg border bg-slate-900 shadow-sm text-white flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
        <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          Gemini 2.5
        </span>
        <h2 className="text-lg font-bold">Financial Copilot</h2>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div className={`p-3 rounded-lg text-sm max-w-[80%] ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
            }`}>
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2">
                 <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                 <span className="text-xs text-slate-400">Thinking...</span>
              </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your finances..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={isTyping}
          className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded transition-colors disabled:opacity-50"
        >
          <Send className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}