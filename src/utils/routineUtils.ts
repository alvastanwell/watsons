import { RoutineStep, RoutineCategoryKey } from '../types';

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface WeeklyDayItem {
  date: Date;
  dateStr: string;
  dayLabelZh: string;
  dayLabelEn: string;
  shortDate: string;
  isToday: boolean;
  dayIndex: number; // 0 for Mon, 6 for Sun
}

/**
 * Returns Monday to Sunday for the current week in local time
 */
export const getWeeklyDays = (baseDate: Date = new Date()): WeeklyDayItem[] => {
  const todayStr = getLocalDateString(baseDate);
  // getDay(): 0 is Sun, 1 is Mon, ..., 6 is Sat
  const dayOfWeek = (baseDate.getDay() + 6) % 7; // Mon is 0, Sun is 6
  const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - dayOfWeek);

  const days: WeeklyDayItem[] = [];
  const zhLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const enLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = getLocalDateString(cur);
    days.push({
      date: cur,
      dateStr,
      dayLabelZh: zhLabels[i],
      dayLabelEn: enLabels[i],
      shortDate: `${cur.getMonth() + 1}/${cur.getDate()}`,
      isToday: dateStr === todayStr,
      dayIndex: i
    });
  }

  return days;
};

export const isTodayCheckedIn = (history: string[], baseDate: Date = new Date()): boolean => {
  const todayStr = getLocalDateString(baseDate);
  return Array.isArray(history) && history.includes(todayStr);
};

export interface CategoryOption {
  key: RoutineCategoryKey;
  labelZh: string;
  labelEn: string;
  iconName: string;
  sortRank: number;
}

export const ROUTINE_CATEGORIES: CategoryOption[] = [
  { key: 'cleanser', labelZh: '洁面', labelEn: 'Cleanser', iconName: 'soap', sortRank: 1 },
  { key: 'toner', labelZh: '爽肤水', labelEn: 'Toner', iconName: 'water_drop', sortRank: 2 },
  { key: 'serum', labelZh: '精华', labelEn: 'Serum', iconName: 'science', sortRank: 3 },
  { key: 'cream', labelZh: '乳液面霜', labelEn: 'Cream & Lotion', iconName: 'spa', sortRank: 4 },
  { key: 'sunscreen', labelZh: '防晒', labelEn: 'Sunscreen', iconName: 'wb_sunny', sortRank: 5 },
  { key: 'other', labelZh: '其他', labelEn: 'Other', iconName: 'category', sortRank: 6 }
];

export const getCategoryRank = (categoryStr: string): number => {
  const normalized = (categoryStr || '').toLowerCase();
  if (normalized.includes('clean') || normalized.includes('洁面') || normalized.includes('洗面')) return 1;
  if (normalized.includes('toner') || normalized.includes('水') || normalized.includes('喷雾')) return 2;
  if (normalized.includes('serum') || normalized.includes('精华') || normalized.includes('液') || normalized.includes('次抛')) return 3;
  if (normalized.includes('cream') || normalized.includes('乳') || normalized.includes('霜') || normalized.includes('moistur')) return 4;
  if (normalized.includes('sun') || normalized.includes('防晒') || normalized.includes('uv')) return 5;
  return 6;
};

export const sortStepsByStandardOrder = (steps: RoutineStep[]): RoutineStep[] => {
  const sorted = [...steps].sort((a, b) => {
    const rankA = getCategoryRank(a.categoryZh || a.category);
    const rankB = getCategoryRank(b.categoryZh || b.category);
    if (rankA !== rankB) return rankA - rankB;
    return a.stepNumber - b.stepNumber;
  });

  return sorted.map((s, idx) => ({
    ...s,
    stepNumber: idx + 1
  }));
};
