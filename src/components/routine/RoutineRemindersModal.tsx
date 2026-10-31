import React, { useState } from 'react';
import { RoutineReminders, Language } from '../../types';

interface RoutineRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: RoutineReminders;
  onSaveReminders: (updated: RoutineReminders) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

export const RoutineRemindersModal: React.FC<RoutineRemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onSaveReminders,
  language,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const [localSettings, setLocalSettings] = useState<RoutineReminders>(reminders);

  if (!isOpen) return null;

  const handleToggleMorning = async () => {
    const nextState = !localSettings.morning.enabled;
    if (nextState && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          onShowToast(isZh ? '已开启通知权限' : 'Notifications allowed');
        }
      } catch {}
    }
    setLocalSettings((prev) => ({
      ...prev,
      morning: { ...prev.morning, enabled: nextState }
    }));
  };

  const handleToggleEvening = async () => {
    const nextState = !localSettings.evening.enabled;
    if (nextState && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          onShowToast(isZh ? '已开启通知权限' : 'Notifications allowed');
        }
      } catch {}
    }
    setLocalSettings((prev) => ({
      ...prev,
      evening: { ...prev.evening, enabled: nextState }
    }));
  };

  const handleSave = () => {
    onSaveReminders(localSettings);
    onShowToast(isZh ? '提醒设置已保存' : 'Reminders saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#e5f1f3] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f0f9fa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#00939F]">
              <span className="material-symbols-outlined text-base">notifications</span>
            </div>
            <h3 className="font-headline font-bold text-base text-[#1f2937]">
              {isZh ? '护肤打卡提醒设置' : 'Routine Reminders'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 py-1">
          {/* Morning reminder */}
          <div className="p-3.5 bg-[#f0f9fa]/60 rounded-2xl border border-[#e5f1f3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">light_mode</span>
                <div>
                  <h4 className="text-xs font-bold text-[#1f2937]">
                    {isZh ? '晨间护肤提醒' : 'Morning Reminder'}
                  </h4>
                  <p className="text-[10px] text-[#6b7280]">
                    {isZh ? '唤醒清晨护肤仪式感' : 'Daily morning skincare alert'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.morning.enabled}
                  onChange={handleToggleMorning}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00939F]"></div>
              </label>
            </div>

            {localSettings.morning.enabled && (
              <div className="flex items-center justify-between pt-2 border-t border-[#d0eff3]/50">
                <span className="text-xs text-[#4b5563]">{isZh ? '提醒时间' : 'Time'}</span>
                <input
                  type="time"
                  value={localSettings.morning.time}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      morning: { ...prev.morning, time: e.target.value }
                    }))
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-[#00939F] bg-white border border-[#d0eff3] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#00939F]"
                />
              </div>
            )}
          </div>

          {/* Evening reminder */}
          <div className="p-3.5 bg-[#f0f9fa]/60 rounded-2xl border border-[#e5f1f3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-lg">nightlight</span>
                <div>
                  <h4 className="text-xs font-bold text-[#1f2937]">
                    {isZh ? '晚间修护提醒' : 'Evening Reminder'}
                  </h4>
                  <p className="text-[10px] text-[#6b7280]">
                    {isZh ? '睡前温和修护与放松' : 'Daily evening skincare alert'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.evening.enabled}
                  onChange={handleToggleEvening}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00939F]"></div>
              </label>
            </div>

            {localSettings.evening.enabled && (
              <div className="flex items-center justify-between pt-2 border-t border-[#d0eff3]/50">
                <span className="text-xs text-[#4b5563]">{isZh ? '提醒时间' : 'Time'}</span>
                <input
                  type="time"
                  value={localSettings.evening.time}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      evening: { ...prev.evening, time: e.target.value }
                    }))
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-[#00939F] bg-white border border-[#d0eff3] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#00939F]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onClose}
            className="py-2.5 rounded-full border border-gray-200 text-[#4b5563] text-xs font-semibold hover:bg-gray-50 transition-colors"
            type="button"
          >
            {isZh ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="py-2.5 rounded-full bg-[#00939F] text-white text-xs font-bold shadow-xs hover:bg-[#007d89] transition-all"
            type="button"
          >
            {isZh ? '保存设置' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
