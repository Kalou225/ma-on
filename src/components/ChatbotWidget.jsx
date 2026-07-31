import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Bonjour ! Je suis **Eco-Bot**, votre assistant virtuel IA. 🤖\n\nComment puis-je vous aider aujourd'hui concernant le fonctionnement d'**Eco-Finance** ?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const supportEmail = 'ecoilluminati@gmail.com';

  const quickQuestions = [
    'Comment activer mon compte ?',
    'Combien rapporte un parrainage ?',
    'Comment faire un retrait ?',
    'Quels sont les rangs MLM ?',
  ];

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      // Build previous conversation history
      const history = messages
        .filter((m) => m.sender === 'user' || m.sender === 'bot')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await api.chat.sendMessage(text, history);
      const botMsg = { sender: 'bot', text: res.reply || 'Désolé, je rencontre une difficulté temporaire.' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Désolé, je rencontre un problème de réseau. Vous pouvez contacter le support par email : **${supportEmail}**`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 p-3.5 rounded-full gold-gradient-bg text-black shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center space-x-2 border-2 border-black/40 group"
        title="Discuter avec l'assistant IA Eco-Bot"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-black" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full" />
        </div>
        <span className="text-xs font-extrabold hidden sm:inline text-black">Eco-Bot IA</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] max-w-sm h-[520px] bg-[#101416] border border-[#d4af37]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Chat Header */}
          <div className="p-4 bg-[#191c1e] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl gold-gradient-bg p-[2px] shadow-lg">
                <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#F2CA50]" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm text-white">Eco-Bot IA</h3>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    En Ligne
                  </span>
                </div>
                <p className="text-[11px] text-[#99907c]">Assistant virtuel Eco-Finance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full bg-[#272a2d] hover:bg-[#323538] text-[#99907c] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Support Email Top Banner */}
          <div className="px-3 py-2 bg-[#F2CA50]/10 border-b border-[#F2CA50]/20 flex items-center justify-between text-[11px] text-[#d0c5af]">
            <div className="flex items-center space-x-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-[#F2CA50] shrink-0" />
              <span className="truncate">Support :</span>
              <a href={`mailto:${supportEmail}`} className="text-[#F2CA50] font-mono font-bold hover:underline truncate">
                {supportEmail}
              </a>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'gold-gradient-bg text-black font-medium rounded-br-none shadow-md'
                      : 'bg-[#191c1e] text-[#e0e3e6] border border-white/10 rounded-bl-none shadow-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#191c1e] text-[#99907c] p-3 rounded-2xl border border-white/10 rounded-bl-none flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F2CA50]" />
                  <span>Eco-Bot réfléchit...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-[#101416] border-t border-white/5 overflow-x-auto flex space-x-1.5 no-scrollbar">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-[#191c1e] hover:bg-[#272a2d] text-[#F2CA50] border border-[#d4af37]/30 text-[10px] whitespace-nowrap transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#191c1e] border-t border-white/10 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Posez votre question à Eco-Bot..."
              className="flex-1 bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#F2CA50]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2 rounded-xl gold-gradient-bg text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
