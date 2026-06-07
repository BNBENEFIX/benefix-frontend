import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Landmark, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatbotService } from '../services/api';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'user' | 'bot' }[]>([
    { id: '1', text: 'Olá! Sou o assistente de benefícios corporativos de IA. Como posso ajudar com seus benefícios, cupons ou pontos hoje?', sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    { label: '🏋️‍♂️ Academias & Sports', text: 'Quais os benefícios de esporte/academia e como utilizo?' },
    { label: '🏆 Níveis de Pontuação', text: 'Como funcionam os pontos de gamificação e os níveis?' },
    { label: '🩺 Ocean Saúde Premium', text: 'O que inclui o plano de saúde Ocean Premium?' },
    { label: '💡 Recomendações', text: 'Você pode me fazer recomendações de bem-estar?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now().toString(), text: textToSend, sender: 'user' as const };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await chatbotService.sendMessage(textToSend);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: reply, sender: 'bot' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Desculpe, estou enfrentando instabilidades técnicas na comunicação com meu servidor de IA.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 group cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-sm font-semibold tracking-wide pr-1">
              Dúvidas? Fale com a IA
            </span>
          </motion.button>
        ) : (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Assistente Analítico IA</h4>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    Gemini 3.5-Flash Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Minimizar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/65 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                        <Sparkles className="w-3 h-3" /> Inteligência Analítica
                      </div>
                    )}
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex items-center gap-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions / Suggestions */}
            {messages.length === 1 && (
              <div className="p-3 bg-slate-100/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase block mb-2">Sugestões de Perguntas Recorrentes</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q.text)}
                      className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/50 py-1.5 px-2.5 rounded-lg text-slate-600 dark:text-slate-300 transition-all font-medium cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte sobre seus benefícios..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:hover:bg-emerald-500 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
