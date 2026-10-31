import React, { useState } from 'react';
import { Language } from '../../types';
import { ADVISOR_PROFILE_PHOTO, ADVISOR_AVATAR } from '../../data/mockData';

interface AdvisorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  productContext?: string;
}

interface ChatMessage {
  id: string;
  sender: 'advisor' | 'user';
  text: string;
  time: string;
}

export const AdvisorChatModal: React.FC<AdvisorChatModalProps> = ({
  isOpen,
  onClose,
  language,
  productContext = 'La Roche-Posay Cicaplast B5+'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'advisor',
      text: language === 'en'
        ? `Hello Lin! I'm Sherry Chen from Watsons Shanghai West Nanjing Road Flagship. I noticed you're exploring ${productContext}. How can I assist with your routine?`
        : `您好林女士！我是屈臣氏上海南京西路旗舰店的资深护肤顾问 Sherry。看到您正在查看【${productContext}】，关于成分搭配或专柜试用有什么想了解的吗？`,
      time: '14:22'
    }
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: inputText.trim(),
      time: 'Just now'
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulated reply
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'advisor',
        text: language === 'en'
          ? "Great question! For Cicaplast B5+, warm a pea-sized amount between clean fingertips for 5 seconds before pressing gently onto your redness zones. This prevents pilling under sunscreen. Your 15ml sample will be waiting at our 2F Skin Sanctuary tomorrow!"
          : "非常棒的护肤疑问！使用理肤泉B5+时，建议先在手心或指腹乳化5秒，然后轻轻按压在脸颊泛红区域，这样能完全避免后续跟防晒搓条。明天的 15ml 正装中样已在 2F 美肤专柜给您留好啦！",
        time: 'Just now'
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm h-[580px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#c7e5da]/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-[#e5f1f3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={ADVISOR_PROFILE_PHOTO} 
                alt="Advisor Sherry Chen"
                className="w-10 h-10 rounded-full object-cover border border-[#d0eff3]" 
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-bold text-sm text-[#1f2937]">Sherry Chen</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] font-semibold">
                  {language === 'en' ? 'Senior BA' : '资深BA'}
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                {language === 'en' ? 'Shanghai West Nanjing Rd #108' : '南京西路旗舰店 2F 专区'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f9fa] flex items-center justify-center text-[#4b5563] hover:text-[#0099A7]"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f0f9fa]">
          <div className="text-center my-1">
            <span className="text-[10px] text-[#6b7280] bg-white px-2 py-0.5 rounded-full border border-[#e5f1f3]">
              {language === 'en' ? 'Today • In-Store Direct Line' : '今日 • 门店顾问直通热线'}
            </span>
          </div>

          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex items-end gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'advisor' && (
                <img 
                  src={ADVISOR_AVATAR} 
                  alt="Sherry" 
                  className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" 
                />
              )}
              <div 
                className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-[#0099A7] text-white rounded-br-xs' 
                    : 'bg-white text-[#1f2937] border border-[#e5f1f3] rounded-bl-xs shadow-xs'
                }`}
              >
                <p>{m.text}</p>
                <span className={`block text-[9px] mt-1 text-right ${m.sender === 'user' ? 'text-[#d2eff2]' : 'text-[#6b7280]'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-white border-t border-[#e5f1f3] flex gap-1.5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setInputText(language === 'en' ? 'How to avoid pilling with SPF?' : '如何搭配防晒避免搓泥？')}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f0f9fa] border border-[#e5f1f3] text-[#4b5563] hover:text-[#0099A7] hover:border-[#d0eff3]"
          >
            {language === 'en' ? 'Layering with SPF?' : '搭配防晒指南'}
          </button>
          <button 
            onClick={() => setInputText(language === 'en' ? 'Is the 15ml sample reserved for me?' : '15ml 体验小样留好了吗？')}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f0f9fa] border border-[#e5f1f3] text-[#4b5563] hover:text-[#0099A7] hover:border-[#d0eff3]"
          >
            {language === 'en' ? 'Confirm Sample' : '确认小样配额'}
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#e5f1f3] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'en' ? 'Ask Sherry anything about ingredients...' : '向 Sherry 咨询成分与护理手法...'}
            className="flex-1 bg-[#f0f9fa] border border-[#d0eff3] rounded-full px-4 py-2 text-xs text-[#1f2937] focus:outline-none focus:border-[#0099A7]"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
