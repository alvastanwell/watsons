import React from 'react';
import { WeeklyDayItem } from '../../utils/routineUtils';
import { Language } from '../../types';

interface WeeklyStarStripProps {
  days: WeeklyDayItem[];
  checkedInDates: string[];
  todayStarRef: React.RefObject<HTMLDivElement | null>;
  language: Language;
}

export const WeeklyStarStrip: React.FC<WeeklyStarStripProps> = ({
  days,
  checkedInDates,
  todayStarRef,
  language
}) => {
  const isZh = language === 'zh';

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#e5f1f3] shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#00939F] text-lg">calendar_month</span>
          <span className="text-xs font-bold text-[#1f2937]">
            {isZh ? '本周护肤打卡' : 'This Week\'s Check-ins'}
          </span>
        </div>
        <span className="text-[11px] text-[#6b7280]">
          {isZh ? '每日一次 · 记录好状态' : 'Daily Self-Care'}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const isChecked = checkedInDates.includes(day.dateStr);

          return (
            <div
              key={day.dateStr}
              ref={day.isToday ? todayStarRef : null}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                day.isToday
                  ? 'bg-[#f0f9fa] border-2 border-[#00939F]/40 shadow-xs'
                  : 'bg-transparent border border-transparent'
              }`}
            >
              {/* Day label */}
              <span className={`text-[10px] font-medium leading-tight ${day.isToday ? 'text-[#00939F] font-bold' : 'text-[#6b7280]'}`}>
                {isZh ? day.dayLabelZh : day.dayLabelEn}
              </span>

              {/* Short date */}
              <span className="text-[9px] text-[#9ca3af] mt-0.5 mb-1.5">
                {day.shortDate}
              </span>

              {/* Star Icon */}
              <div className="relative w-7 h-7 flex items-center justify-center">
                {isChecked ? (
                  <span
                    className="material-symbols-outlined text-2xl transition-all duration-300 drop-shadow-xs"
                    style={{
                      color: '#00939F',
                      fontVariationSettings: "'FILL' 1, 'wght' 600"
                    }}
                  >
                    star
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined text-xl text-[#d1d5db] transition-colors"
                    style={{
                      fontVariationSettings: "'FILL' 0, 'wght' 300"
                    }}
                  >
                    star
                  </span>
                )}

                {/* Subtle today indicator dot */}
                {day.isToday && !isChecked && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#00939F]"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
