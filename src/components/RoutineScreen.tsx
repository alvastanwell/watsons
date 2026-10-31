import React, { useState, useEffect, useRef } from 'react';
import { Language, ScreenId, RoutineStep, InStoreAppointment, RoutineReminders, SkinAssessmentResult, ProductItem } from '../types';
import { SafeProductImage } from './common/SafeProductImage';
import { getProductById } from '../data/productCatalogue';
import { WeeklyStarStrip } from './routine/WeeklyStarStrip';
import { RoutineRemindersModal } from './routine/RoutineRemindersModal';
import { RoutineBuilderModal, BuilderMode } from './routine/RoutineBuilderModal';
import { IngredientSuggestionCard } from './routine/IngredientSuggestionCard';
import { getLocalDateString, getWeeklyDays, isTodayCheckedIn } from '../utils/routineUtils';

interface RoutineScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  morningSteps: RoutineStep[];
  setMorningSteps: React.Dispatch<React.SetStateAction<RoutineStep[]>>;
  eveningSteps: RoutineStep[];
  setEveningSteps: React.Dispatch<React.SetStateAction<RoutineStep[]>>;
  appointment: InStoreAppointment;
  onOpenStoreModal: () => void;
  onOpenChatModal: () => void;
  onOpenPassModal: () => void;
  onShowToast: (msg: string) => void;
  defaultTab?: 'morning' | 'evening';
  onTabChange?: (tab: 'morning' | 'evening') => void;
  checkInHistory: string[];
  onCheckInToday: () => void;
  routineName: string;
  onUpdateRoutineName: (name: string) => void;
  routineReminders: RoutineReminders;
  onSaveRoutineReminders: (reminders: RoutineReminders) => void;
  savedAssessment?: SkinAssessmentResult | null;
  onAddToCart?: (product: ProductItem) => void;
}

export const RoutineScreen: React.FC<RoutineScreenProps> = ({
  language,
  onNavigate,
  morningSteps,
  setMorningSteps,
  eveningSteps,
  setEveningSteps,
  appointment,
  onOpenStoreModal,
  onOpenChatModal,
  onOpenPassModal,
  onShowToast,
  defaultTab = 'morning',
  onTabChange,
  checkInHistory,
  onCheckInToday,
  routineName,
  onUpdateRoutineName,
  routineReminders,
  onSaveRoutineReminders,
  savedAssessment,
  onAddToCart
}) => {
  const isZh = language === 'zh';
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>(defaultTab);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Editable routine name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempRoutineName, setTempRoutineName] = useState(routineName);

  // Modals state
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('add_step');
  const [targetReplaceStep, setTargetReplaceStep] = useState<RoutineStep | null>(null);

  // Flying star animation state
  const [isFlyingStar, setIsFlyingStar] = useState(false);
  const [flyDelta, setFlyDelta] = useState<{ dx: number; dy: number; targetX: number; targetY: number } | null>(null);
  const checkInButtonRef = useRef<HTMLButtonElement | null>(null);
  const todayStarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    setTempRoutineName(routineName);
  }, [routineName]);

  const handleSelectTab = (tab: 'morning' | 'evening') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const hasAnyRoutine = morningSteps.length > 0 || eveningSteps.length > 0;
  const currentSteps = activeTab === 'morning' ? morningSteps : eveningSteps;
  const todayChecked = isTodayCheckedIn(checkInHistory);
  const weeklyDays = getWeeklyDays();
  const cumulativeStars = checkInHistory.length;

  // Single daily check-in handler with flying star animation
  const handleCheckIn = () => {
    if (todayChecked) return;

    const buttonRect = checkInButtonRef.current?.getBoundingClientRect();
    const starRect = todayStarRef.current?.getBoundingClientRect();
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (buttonRect && starRect && !prefersReducedMotion) {
      const startX = buttonRect.left + buttonRect.width / 2;
      const startY = buttonRect.top + buttonRect.height / 2;
      const targetX = starRect.left + starRect.width / 2;
      const targetY = starRect.top + starRect.height / 2;

      setFlyDelta({
        dx: startX - targetX,
        dy: startY - targetY,
        targetX,
        targetY
      });
      setIsFlyingStar(true);

      setTimeout(() => {
        setIsFlyingStar(false);
        setFlyDelta(null);
      }, 750);
    }

    onCheckInToday();
    onShowToast(isZh ? '今天也好好照顾了自己 ⭐' : 'Took great care of your skin today! ⭐');
  };

  // Reordering steps up / down while preserving custom user ordering
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetSteps = activeTab === 'morning' ? [...morningSteps] : [...eveningSteps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= targetSteps.length) return;

    const temp = targetSteps[index];
    targetSteps[index] = targetSteps[newIndex];
    targetSteps[newIndex] = temp;

    // Recalculate step numbers
    const updated = targetSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

    if (activeTab === 'morning') {
      setMorningSteps(updated);
    } else {
      setEveningSteps(updated);
    }
  };

  const handleRemoveStep = (id: string, stepTitle: string) => {
    if (activeTab === 'morning') {
      setMorningSteps((prev) => prev.filter((s) => s.id !== id).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
    } else {
      setEveningSteps((prev) => prev.filter((s) => s.id !== id).map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
    }
    onShowToast(isZh ? `已将【${stepTitle}】移出方案` : `Removed ${stepTitle} from routine`);
  };

  const handleOpenReplace = (step: RoutineStep) => {
    setTargetReplaceStep(step);
    setBuilderMode('replace_step');
    setIsBuilderOpen(true);
  };

  const handleOpenAddStep = () => {
    setTargetReplaceStep(null);
    setBuilderMode('add_step');
    setIsBuilderOpen(true);
  };

  const handleOpenCreateRoutine = () => {
    setTargetReplaceStep(null);
    setBuilderMode('create');
    setIsBuilderOpen(true);
  };

  const handleSaveRoutineName = () => {
    if (tempRoutineName.trim()) {
      onUpdateRoutineName(tempRoutineName.trim());
      setIsEditingName(false);
      onShowToast(isZh ? '方案名称已更新' : 'Routine renamed');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-5 py-4 space-y-4 pb-14 relative">
      {/* Flying Star Particle Animation */}
      {isFlyingStar && flyDelta && (
        <div
          className="fixed z-50 pointer-events-none flex items-center justify-center animate-fly-star"
          style={{
            left: flyDelta.targetX - 16,
            top: flyDelta.targetY - 16,
            width: 32,
            height: 32,
            '--fly-dx': `${flyDelta.dx}px`,
            '--fly-dy': `${flyDelta.dy}px`
          } as React.CSSProperties}
        >
          <span
            className="material-symbols-outlined text-3xl drop-shadow-lg"
            style={{
              color: '#00939F',
              fontVariationSettings: "'FILL' 1, 'wght' 700"
            }}
          >
            star
          </span>
        </div>
      )}

      {/* --- 1. PAGE HEADER: EDITABLE ROUTINE NAME & REMINDER SETTINGS --- */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
        <div className="flex-1 min-w-0 pr-2">
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempRoutineName}
                onChange={(e) => setTempRoutineName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRoutineName()}
                className="px-2.5 py-1 text-base font-bold text-[#1f2937] border border-[#00939F] rounded-lg bg-white focus:outline-hidden"
                autoFocus
              />
              <button
                onClick={handleSaveRoutineName}
                className="w-7 h-7 rounded-lg bg-[#00939F] text-white flex items-center justify-center shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg sm:text-xl font-bold text-[#1f2937] truncate">
                {routineName || (isZh ? '我的护肤方案' : 'My Skincare Routine')}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-[#00939F] transition-colors p-1"
                title={isZh ? '修改方案名称' : 'Rename routine'}
                type="button"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>
          )}
          <p className="text-[11px] text-[#6b7280] mt-0.5">
            {isZh ? '量肤定制 · 自选产品与精细护理步骤' : 'Customized steps for your skin'}
          </p>
        </div>

        {/* Reminders Button */}
        <button
          onClick={() => setIsRemindersOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#00939F] hover:bg-[#e0f5f7] transition-all text-xs font-semibold shrink-0 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-sm">
            {routineReminders.morning.enabled || routineReminders.evening.enabled
              ? 'notifications_active'
              : 'notifications'}
          </span>
          <span>{isZh ? '打卡提醒' : 'Reminders'}</span>
        </button>
      </div>

      {/* --- 2. EMPTY STATE: WHEN NO ROUTINE SAVED YET --- */}
      {!hasAnyRoutine ? (
        <div className="py-10 px-4 rounded-3xl bg-white border border-[#e5f1f3] shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#00939F]">
            <span className="material-symbols-outlined text-3xl">spa</span>
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-headline text-lg font-bold text-[#1f2937]">
              {isZh ? '建立你自己的护肤方案' : 'Build Your Own Routine'}
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              {isZh
                ? '用你已经在用的产品就可以，不需要重新购买。'
                : 'Use products you already own. No purchases required.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
            <button
              onClick={handleOpenCreateRoutine}
              className="w-full py-3 px-4 rounded-full bg-[#00939F] text-white text-xs font-bold shadow-md hover:bg-[#007d89] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{isZh ? '生成我的护肤方案' : 'Create My Routine'}</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="text-xs font-semibold text-[#00939F] hover:underline py-1 transition-colors"
              type="button"
            >
              {isZh ? '先做 AI 测肤，让我帮你推荐' : 'Take AI skin assessment for recommendations'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* --- 3. WEEKLY STAR STRIP & DAILY SINGLE CHECK-IN (REPLACES STEP CHECKBOXES) --- */}
          <div className="space-y-3">
            {/* Weekly Strip */}
            <WeeklyStarStrip
              days={weeklyDays}
              checkedInDates={checkInHistory}
              todayStarRef={todayStarRef}
              language={language}
            />

            {/* Daily Single Check-in Action Bar */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5f1f3] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    backgroundColor: todayChecked ? '#f0f9fa' : '#f0fdf4',
                    border: todayChecked ? '1px solid #d0eff3' : '1px solid #bbf7d0'
                  }}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{
                      color: todayChecked ? '#00939F' : '#16a34a',
                      fontVariationSettings: todayChecked ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    {todayChecked ? 'star' : 'task_alt'}
                  </span>
                </div>

                <div>
                  <h4 className="font-headline font-bold text-xs sm:text-sm text-[#1f2937]">
                    {todayChecked
                      ? (isZh ? '今天已点亮 ⭐' : 'Checked In Today ⭐')
                      : (isZh ? '今日护肤打卡' : 'Daily Skincare Check-in')}
                  </h4>
                  <p className="text-[11px] text-[#6b7280]">
                    {isZh ? `累计点亮 ${cumulativeStars} 颗星` : `Total Stars Lit: ${cumulativeStars}`}
                  </p>
                </div>
              </div>

              {/* Single Check-in Button */}
              <button
                ref={checkInButtonRef}
                onClick={handleCheckIn}
                disabled={todayChecked}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  todayChecked
                    ? 'bg-[#f0f9fa] text-[#00939F] border border-[#d0eff3] cursor-default'
                    : 'bg-[#00939F] text-white hover:bg-[#007d89] active:scale-95 cursor-pointer'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: todayChecked ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {todayChecked ? 'star' : 'done'}
                </span>
                <span>{todayChecked ? (isZh ? '今天已点亮' : 'Checked In') : (isZh ? '今天护肤完成' : 'Routine Completed')}</span>
              </button>
            </div>
          </div>

          {/* --- 4. MORNING & EVENING TABS (Step counts only, no fractions) --- */}
          <div className="grid grid-cols-2 p-1 bg-[#f0f9fa] rounded-full border border-[#e5f1f3]">
            <button
              onClick={() => handleSelectTab('morning')}
              className={`py-2 px-3 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'morning'
                  ? 'bg-white text-[#00939F] shadow-xs font-bold'
                  : 'text-[#6b7280] hover:text-[#1f2937]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">light_mode</span>
              <span>
                {isZh ? `晨间 · ${morningSteps.length} 步` : `Morning · ${morningSteps.length} Steps`}
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('evening')}
              className={`py-2 px-3 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'evening'
                  ? 'bg-white text-[#00939F] shadow-xs font-bold'
                  : 'text-[#6b7280] hover:text-[#1f2937]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">nightlight</span>
              <span>
                {isZh ? `晚间 · ${eveningSteps.length} 步` : `Evening · ${eveningSteps.length} Steps`}
              </span>
            </button>
          </div>

          {/* --- 5. STEPS LIST (NO PER-STEP CHECKBOXES) --- */}
          {currentSteps.length === 0 ? (
            <div className="py-8 px-4 rounded-2xl bg-white border border-[#e5f1f3] text-center space-y-2">
              <span className="material-symbols-outlined text-3xl text-gray-300">spa</span>
              <p className="text-xs font-bold text-[#1f2937]">
                {isZh
                  ? `当前暂无${activeTab === 'morning' ? '晨间' : '晚间'}步骤`
                  : `No steps in ${activeTab} routine`}
              </p>
              <p className="text-[11px] text-[#6b7280]">
                {isZh ? '可从自备产品中添加第一步' : 'Add your first product to this routine'}
              </p>
              <button
                onClick={handleOpenAddStep}
                className="mt-2 px-4 py-1.5 rounded-full bg-[#00939F] text-white text-xs font-semibold hover:bg-[#007d89]"
                type="button"
              >
                {isZh ? '+ 添加第一步' : '+ Add Step'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSteps.map((step, index) => {
                const isExpanded = expandedStepId === step.id;
                const record = step.productId ? getProductById(step.productId) : undefined;
                const title = isZh ? step.titleZh : step.title;
                const subtitle = isZh ? step.subtitleZh : step.subtitle;

                const howToUseText = isZh
                  ? (step.howToUseZh || record?.usage_instructions.general_zh || step.detailsZh || '取适量均匀涂抹面部，温和吸收。')
                  : (step.howToUse || record?.usage_instructions.general || step.details || 'Apply an appropriate amount gently onto face.');

                const whyInRoutineText = isZh
                  ? (step.whyInRoutineZh || record?.supported_benefits_zh?.join('；') || '强化肌肤屏障，提供水润保湿支持。')
                  : (step.whyInRoutine || record?.supported_benefits?.join(' • ') || 'Maintains moisture barrier and delivers daily soothing.');

                return (
                  <article
                    key={step.id}
                    className="bg-white rounded-2xl p-4 border border-[#e5f1f3] shadow-2xs space-y-2.5 transition-all"
                  >
                    {/* Step Header: Step Number, Category, and Reorder Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#00939F] bg-[#f0f9fa] border border-[#d0eff3] px-2.5 py-0.5 rounded-full">
                          Step {index + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-[#6b7280]">
                          {isZh ? step.categoryZh : step.category}
                        </span>
                      </div>

                      {/* Reorder and Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, 'up')}
                          className="w-6 h-6 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-gray-500 transition-colors"
                          title={isZh ? '上移' : 'Move up'}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          disabled={index === currentSteps.length - 1}
                          onClick={() => handleMoveStep(index, 'down')}
                          className="w-6 h-6 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center text-gray-500 transition-colors"
                          title={isZh ? '下移' : 'Move down'}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                      </div>
                    </div>

                    {/* Product Lockup */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#e5f1f3] shrink-0 p-1 flex items-center justify-center">
                        <SafeProductImage
                          src={step.image}
                          alt={title}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline font-bold text-sm text-[#1f2937] leading-snug">
                          {title}
                        </h4>
                        <p className="text-xs text-[#00939F] mt-0.5 font-medium truncate">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Step Action Controls: Replace, Remove, Instructions */}
                    <div className="pt-2 border-t border-[#f0f9fa] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenReplace(step)}
                          className="text-[11px] font-semibold text-[#00939F] hover:underline flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-xs">swap_horiz</span>
                          <span>{isZh ? '替换' : 'Replace'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveStep(step.id, title)}
                          className="text-[11px] text-gray-400 hover:text-[#d22630] transition-colors flex items-center gap-0.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-xs">delete_outline</span>
                          <span>{isZh ? '移除' : 'Remove'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                        className="text-xs font-semibold text-[#00939F] hover:underline flex items-center gap-0.5 cursor-pointer"
                        type="button"
                      >
                        <span>{isExpanded ? (isZh ? '收起详情' : 'Less') : (isZh ? '使用指导与理由' : 'Instructions & Reason')}</span>
                        <span className="material-symbols-outlined text-sm">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>

                    {/* Expandable Section: How to use & Why in routine */}
                    {isExpanded && (
                      <div className="p-3 bg-[#f0f9fa] rounded-xl border border-[#e5f1f3] text-xs space-y-2.5 animate-fade-in">
                        <div>
                          <div className="flex items-center gap-1 font-bold text-[#00939F] mb-1">
                            <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                            <span>{isZh ? '使用方法 (How to use)' : 'How to use'}</span>
                          </div>
                          <p className="text-[#4b5563] leading-relaxed pl-4">
                            {howToUseText}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#d0eff3]/60">
                          <div className="flex items-center gap-1 font-bold text-[#00939F] mb-1">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            <span>{isZh ? '入选理由 (Why this is in your routine)' : 'Why this is in your routine'}</span>
                          </div>
                          <p className="text-[#4b5563] leading-relaxed pl-4">
                            {whyInRoutineText}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 5. Optional Ingredient Suggestion based on AI Assessment */}
                    <IngredientSuggestionCard
                      step={step}
                      savedAssessment={savedAssessment || null}
                      language={language}
                      onAddToCart={onAddToCart}
                      onShowToast={onShowToast}
                    />
                  </article>
                );
              })}

              {/* Add Step Button */}
              <button
                onClick={handleOpenAddStep}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-[#d0eff3] hover:border-[#00939F] hover:bg-[#f0f9fa]/50 text-[#00939F] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>{isZh ? '+ 添加一步' : '+ Add Step'}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* --- 6. IN-STORE COUNTER CONSULTATION PASS CARD (Label changed to "出示领取码") --- */}
      <div className="p-4 rounded-3xl bg-white border border-[#e5f1f3] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00939F] text-lg">storefront</span>
            <h4 className="font-headline font-bold text-xs text-[#1f2937]">
              {isZh ? '专柜核销与免费领样' : 'Store Check-in & Free Sample'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {isZh ? '预约生效中' : 'Confirmed'}
          </span>
        </div>

        <p className="text-xs text-[#4b5563]">
          {isZh
            ? '明日 14:30 – 15:00 屈臣氏上海南京西路旗舰店，专属顾问 Sherry 现场协助。'
            : 'Tomorrow 14:30 – 15:00 at West Nanjing Rd Flagship with Sherry Chen.'}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenStoreModal}
            className="py-2.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#00939F] text-xs font-semibold hover:bg-[#e0f5f7] cursor-pointer"
            type="button"
          >
            {isZh ? '到店导航' : 'Directions'}
          </button>
          <button
            onClick={onOpenPassModal}
            className="py-2.5 rounded-full bg-[#00939F] text-white text-xs font-semibold hover:bg-[#007d89] cursor-pointer"
            type="button"
          >
            {isZh ? '出示领取码' : 'View QR Pass'}
          </button>
        </div>
      </div>

      {/* --- 7. BOTTOM DISCLAIMER --- */}
      <div className="pt-2 pb-6 text-center">
        <p className="text-[11px] text-[#9ca3af]">
          {isZh ? '仅供日常护肤参考，非医疗诊断' : 'For daily skincare reference only, not a medical diagnosis'}
        </p>
      </div>

      {/* Modals */}
      <RoutineRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminders={routineReminders}
        onSaveReminders={onSaveRoutineReminders}
        language={language}
        onShowToast={onShowToast}
      />

      <RoutineBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        mode={builderMode}
        targetStep={targetReplaceStep}
        targetTab={activeTab}
        morningSteps={morningSteps}
        setMorningSteps={setMorningSteps}
        eveningSteps={eveningSteps}
        setEveningSteps={setEveningSteps}
        language={language}
        onShowToast={onShowToast}
      />
    </div>
  );
};
