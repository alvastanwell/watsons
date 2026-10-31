import React, { useState } from 'react';
import { Language, ProductItem } from '../../types';
import { SafeProductImage } from '../common/SafeProductImage';

export type RoutineSelectionType = 'morning' | 'evening' | 'both';

interface RoutineSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: RoutineSelectionType) => void;
  product: ProductItem | null;
  language: Language;
}

export const RoutineSelectionSheet: React.FC<RoutineSelectionSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  language
}) => {
  const isZh = language === 'zh';
  const [selectedOption, setSelectedOption] = useState<RoutineSelectionType>('morning');

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  const options: {
    id: RoutineSelectionType;
    titleZh: string;
    titleEn: string;
    descZh: string;
    descEn: string;
    icon: string;
  }[] = [
    {
      id: 'morning',
      titleZh: '晨间护肤',
      titleEn: 'Morning Routine',
      descZh: '日间屏障维稳水润，防御日间外界刺激',
      descEn: 'Daytime hydration & barrier protection',
      icon: 'wb_sunny'
    },
    {
      id: 'evening',
      titleZh: '晚间护肤',
      titleEn: 'Evening Routine',
      descZh: '夜间密集修护锁水，促进角质安抚新生',
      descEn: 'Overnight restorative barrier repair',
      icon: 'bedtime'
    },
    {
      id: 'both',
      titleZh: '晨间和晚间',
      titleEn: 'Morning & Evening',
      descZh: '早晚双重养护，全天候科学护理',
      descEn: 'Full 24h day & night barrier regimen',
      icon: 'autorenew'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl p-5 border-t sm:border border-[#d0eff3] shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5f1f3]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0099A7]">spa</span>
            <h3 className="font-headline font-bold text-sm text-[#1f2937]">
              {isZh ? '选择添加至护肤方案' : 'Add to Skincare Routine'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f0f9fa] text-[#6b7280] hover:text-[#1f2937] hover:bg-[#e0f5f7] flex items-center justify-center transition-colors cursor-pointer"
            type="button"
            aria-label={isZh ? '关闭' : 'Close'}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="p-3 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white border border-[#e5f1f3] p-1 flex items-center justify-center shrink-0">
            <SafeProductImage
              src={product.image}
              alt={isZh ? product.nameZh : product.name}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-[#0099A7] block truncate">
              {product.brand}
            </span>
            <h4 className="font-headline font-bold text-xs text-[#1f2937] truncate">
              {isZh ? product.nameZh : product.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#1f2937]">
                ¥{product.price}
              </span>
              <span className="text-[10px] text-[#6b7280]">
                {product.size}
              </span>
            </div>
          </div>
        </div>

        {/* Option Selection Prompt */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#1f2937]">
            {isZh ? '请选择您想要加入的护肤时段：' : 'Select which routine you would like to add this to:'}
          </p>

          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#0099A7] bg-[#f0f9fa] shadow-2xs'
                      : 'border-[#e5f1f3] bg-white hover:border-[#d0eff3]'
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedOption(opt.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#0099A7] text-white' : 'bg-[#f0f9fa] text-[#0099A7]'
                    }`}>
                      <span className="material-symbols-outlined text-base">{opt.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-[#1f2937]">
                        {isZh ? opt.titleZh : opt.titleEn}
                      </h5>
                      <p className="text-[10px] text-[#6b7280] truncate mt-0.5">
                        {isZh ? opt.descZh : opt.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all ${
                    isSelected
                      ? 'border-[#0099A7] bg-[#0099A7]'
                      : 'border-[#d1d5db] bg-white'
                  }`}>
                    {isSelected && (
                      <span className="material-symbols-outlined text-white text-xs">check</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] text-xs font-bold transition-all cursor-pointer text-center"
            type="button"
          >
            {isZh ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer text-center"
            type="button"
          >
            {isZh ? '确认添加' : 'Confirm Add'}
          </button>
        </div>
      </div>
    </div>
  );
};
