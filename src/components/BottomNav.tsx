import React from 'react';
import { ScreenId, Language } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  language: Language;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  language,
  cartCount = 0
}) => {
  const isZh = language === 'zh';

  // Exactly FIVE tabs in order:
  // 1. 首页 / Home
  // 2. 商城 / Shop
  // 3. 购物车 / Cart
  // 4. 每日护肤 / Daily Routine
  // 5. 个人中心 / Profile
  const navTabs: Array<{ id: ScreenId; label: string; icon: string; badge?: number }> = [
    {
      id: 'home',
      label: isZh ? '首页' : 'Home',
      icon: 'home'
    },
    {
      id: 'shop',
      label: isZh ? '商城' : 'Shop',
      icon: 'storefront'
    },
    {
      id: 'cart',
      label: isZh ? '购物车' : 'Cart',
      icon: 'shopping_bag',
      badge: cartCount > 0 ? cartCount : undefined
    },
    {
      id: 'my-routine',
      label: isZh ? '每日护肤' : 'Daily Routine',
      icon: 'spa'
    },
    {
      id: 'profile',
      label: isZh ? '个人中心' : 'Profile',
      icon: 'person'
    }
  ];

  return (
    <nav className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-[#e5f1f3] pb-safe shadow-[0_-2px_10px_rgba(0,153,167,0.05)]">
      <div className="w-full grid grid-cols-5 items-center h-16 px-1">
        {navTabs.map((tab) => {
          const isActive =
            currentScreen === tab.id ||
            (tab.id === 'home' && (currentScreen === 'assessment' || currentScreen === 'ai-advisor'));

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full py-1 transition-all active:scale-95 relative ${
                isActive ? 'text-[#0099A7] font-semibold' : 'text-[#6b7280] hover:text-[#0099A7]'
              }`}
              type="button"
              aria-label={tab.label}
            >
              <div className="relative">
                <span
                  className="material-symbols-outlined text-[22px] leading-none"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#d22630] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-none text-center truncate max-w-[64px] ${
                  isActive ? 'font-bold text-[#0099A7]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
