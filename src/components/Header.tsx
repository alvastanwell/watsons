import React from 'react';
import { Language, ScreenId } from '../types';
import { translations } from '../data/translations';
import { USER_AVATAR } from '../data/mockData';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  language,
  onToggleLanguage,
  onOpenNotifications,
}) => {
  const t = translations[language];

  const getSubTitle = () => {
    switch (currentScreen) {
      case 'home':
        return t.navHome;
      case 'shop':
        return language === 'zh' ? '商城' : 'Shop';
      case 'cart':
        return language === 'zh' ? '购物车' : 'Cart';
      case 'assessment':
        return t.navAssessment;
      case 'ai-advisor':
        return t.navAdvisor;
      case 'my-routine':
        return t.navRoutine;
      case 'profile':
        return t.navProfile;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#e5f1f3]">
      <div className="w-full px-4 sm:px-5 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <button 
          className="flex items-center gap-2 cursor-pointer select-none text-left focus:outline-none"
          onClick={() => onNavigate('home')}
          type="button"
          aria-label="Watsons Home"
        >
          <img 
            src="/assets/aistudio/222_00d72993.png" 
            alt="Watsons" 
            className="h-9 sm:h-10 w-auto max-w-[140px] sm:max-w-[160px] object-contain" 
          />
        </button>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Bilingual Switcher */}
          <button
            onClick={onToggleLanguage}
            aria-label="Switch language"
            className="flex items-center gap-1 bg-[#f0f9fa] px-2.5 py-1 rounded-full text-[#4b5563] hover:text-[#0099A7] transition-all text-xs font-semibold border border-[#d0eff3] active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-[#0099A7]">translate</span>
            <span className={language === 'en' ? 'text-[#0099A7] font-bold' : 'text-[#6b7280]'}>EN</span>
            <span className="text-[#6b7280]/60">/</span>
            <span className={language === 'zh' ? 'text-[#0099A7] font-bold' : 'text-[#6b7280]'}>中文</span>
          </button>

          {/* Notifications Button with subtle official Watsons red secondary accent */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-8 h-8 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#4b5563] hover:text-[#0099A7] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d22630] ring-1 ring-white"></span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => onNavigate('profile')}
            aria-label="Profile"
            className={`w-8 h-8 rounded-full overflow-hidden transition-all ${
              currentScreen === 'profile' ? 'ring-2 ring-[#0099A7]' : 'ring-1 ring-[#d0eff3]'
            }`}
            type="button"
          >
            <img 
              src={USER_AVATAR} 
              alt="Lin's profile" 
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
