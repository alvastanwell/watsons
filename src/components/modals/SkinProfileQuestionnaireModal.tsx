import React, { useState, useEffect } from 'react';
import { 
  Language, 
  SkinProfileQuestionnaireAnswers, 
  QuestionnaireDraft 
} from '../../types';
import { 
  createEmptyQuestionnaireAnswers, 
  QUESTIONNAIRE_DRAFT_KEY 
} from '../../utils/questionnaireLogic';

interface SkinProfileQuestionnaireModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: SkinProfileQuestionnaireAnswers) => void;
  initialDraft?: QuestionnaireDraft | null;
  onDiscardDraft?: () => void;
  onShowToast: (msg: string) => void;
}

export const SkinProfileQuestionnaireModal: React.FC<SkinProfileQuestionnaireModalProps> = ({
  language,
  isOpen,
  onClose,
  onSubmit,
  initialDraft,
  onDiscardDraft,
  onShowToast
}) => {
  const isZh = language === 'zh';

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<SkinProfileQuestionnaireAnswers>(createEmptyQuestionnaireAnswers());
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // Initialize from draft if provided
  useEffect(() => {
    if (isOpen) {
      if (initialDraft && initialDraft.answers) {
        setAnswers(initialDraft.answers);
        setCurrentStep(Math.min(Math.max(initialDraft.currentStep || 0, 0), 4));
        if (initialDraft.savedAt) {
          const d = new Date(initialDraft.savedAt);
          setLastSavedTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
        }
      } else {
        // Check localStorage directly
        try {
          const raw = localStorage.getItem(QUESTIONNAIRE_DRAFT_KEY);
          if (raw) {
            const parsed: QuestionnaireDraft = JSON.parse(raw);
            if (parsed && parsed.answers) {
              setAnswers(parsed.answers);
              setCurrentStep(Math.min(Math.max(parsed.currentStep || 0, 0), 4));
              if (parsed.savedAt) {
                const d = new Date(parsed.savedAt);
                setLastSavedTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
              }
            }
          } else {
            setAnswers(createEmptyQuestionnaireAnswers());
            setCurrentStep(0);
          }
        } catch {
          setAnswers(createEmptyQuestionnaireAnswers());
          setCurrentStep(0);
        }
      }
    }
  }, [isOpen, initialDraft]);

  // Auto-save draft on any change
  const saveDraftLocally = (newAnswers: SkinProfileQuestionnaireAnswers, step: number) => {
    try {
      const now = new Date();
      const draft: QuestionnaireDraft = {
        savedAt: now.toISOString(),
        currentStep: step,
        answers: newAnswers
      };
      localStorage.setItem(QUESTIONNAIRE_DRAFT_KEY, JSON.stringify(draft));
      setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch (err) {
      console.warn('Failed to save questionnaire draft:', err);
    }
  };

  const updateAnswer = <K extends keyof SkinProfileQuestionnaireAnswers>(
    key: K, 
    value: SkinProfileQuestionnaireAnswers[K]
  ) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    saveDraftLocally(updated, currentStep);
  };

  const toggleArrayItem = (key: 'productReactions' | 'environmentalTriggers' | 'concerns' | 'routineCategories', item: string) => {
    const current = [...answers[key]];
    let updated: string[];

    if (item === 'none' || item === 'none_known' || item === 'unsure') {
      // If clicking none or unsure, clear conflicting specific symptoms
      if (current.includes(item)) {
        updated = current.filter(x => x !== item);
      } else {
        updated = [item];
      }
    } else {
      // Remove none/unsure if selecting specific item
      const filtered = current.filter(x => x !== 'none' && x !== 'none_known' && x !== 'unsure');
      if (filtered.includes(item)) {
        updated = filtered.filter(x => x !== item);
      } else {
        updated = [...filtered, item];
      }
    }

    updateAnswer(key, updated);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveDraftLocally(answers, next);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveDraftLocally(answers, prev);
    }
  };

  const handleExitAndSave = () => {
    saveDraftLocally(answers, currentStep);
    onShowToast(isZh ? '问卷草稿已保存，可随时继续填写' : 'Questionnaire draft saved.');
    onClose();
  };

  const handleDiscard = () => {
    try {
      localStorage.removeItem(QUESTIONNAIRE_DRAFT_KEY);
    } catch {}
    setAnswers(createEmptyQuestionnaireAnswers());
    setCurrentStep(0);
    setLastSavedTime('');
    setShowDiscardConfirm(false);
    if (onDiscardDraft) onDiscardDraft();
    onShowToast(isZh ? '草稿已清空' : 'Draft discarded');
  };

  const handleSubmit = () => {
    // Check if at least some answers have been provided
    onSubmit(answers);
  };

  if (!isOpen) return null;

  const stepTitles = [
    { titleZh: '肤质触感与出油', titleEn: 'Skin Feel & Oiliness' },
    { titleZh: '耐受度与外界反应', titleEn: 'Reactions & Tolerance' },
    { titleZh: '核心困扰与微观问题', titleEn: 'Skin Concerns' },
    { titleZh: '日常护肤习惯', titleEn: 'Skincare Habits' },
    { titleZh: '诉求与质地偏好', titleEn: 'Goals & Texture' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#d0eff3] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-[#f0f9fa] border-b border-[#d0eff3] flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0099A7] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-base">quiz</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-[#1f2937]">
                  {isZh ? '深度肤质自评问卷' : 'Skin Profile Questionnaire'}
                </h3>
                <span className="text-[10px] text-[#6b7280]">
                  {isZh 
                    ? `第 ${currentStep + 1} / 5 步：${stepTitles[currentStep].titleZh}` 
                    : `Step ${currentStep + 1} of 5: ${stepTitles[currentStep].titleEn}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExitAndSave}
                className="px-2.5 py-1 rounded-full bg-white border border-[#d0eff3] text-[11px] font-semibold text-[#0099A7] hover:bg-[#e5f8fa] flex items-center gap-1 shadow-2xs"
                type="button"
                title={isZh ? '保存草稿并退出' : 'Save draft and exit'}
              >
                <span className="material-symbols-outlined text-xs">bookmark_added</span>
                <span>{isZh ? '稍后再填' : 'Save & Exit'}</span>
              </button>

              <button
                onClick={handleExitAndSave}
                className="w-7 h-7 rounded-full bg-white border border-[#e5f1f3] flex items-center justify-center text-[#6b7280] hover:text-[#1f2937]"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#d0eff3] h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-[#0099A7] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
            />
          </div>

          {/* Non-medical Disclaimer Notice */}
          <div className="flex items-center justify-between text-[10px] text-[#0099A7] bg-white/80 px-2.5 py-1 rounded-lg border border-[#d0eff3]/60">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              <span>{isZh ? '问卷选填，仅供日常护肤与选品参考，非仪器测量或医疗诊断。' : 'Optional reference only, not a clinical diagnosis.'}</span>
            </span>
            {lastSavedTime && (
              <span className="text-[#6b7280] shrink-0 ml-1">
                {isZh ? `草稿 ${lastSavedTime}` : `Draft ${lastSavedTime}`}
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[#1f2937]">
          
          {/* STEP 1: 肤质触感与出油特征 */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#f0f9fa] pb-2">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider block">
                  Group A • 基础肤质与出油感知
                </span>
                <h4 className="font-headline font-bold text-sm text-[#1f2937] mt-0.5">
                  {isZh ? '洗脸后肤感与日常出油分布' : 'Post-Cleansing Sensation & Oil Distribution'}
                </h4>
              </div>

              {/* Q1: Sensation after cleansing */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#374151]">
                  1. 洁面并擦干后 15 分钟内，两颊通常感觉如何？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'tight', labelZh: '紧绷、干燥或微涩', labelEn: 'Tight / Dry' },
                    { key: 'comfortable', labelZh: '温和柔润、舒适无不适', labelEn: 'Comfortable' },
                    { key: 'greasy', labelZh: '较快冒油光或黏腻', labelEn: 'Quickly oily' },
                    { key: 'unsure', labelZh: '不确定 / 不清楚', labelEn: 'Not sure' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('cleansingSensation', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.cleansingSensation === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.cleansingSensation === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Daytime oil distribution */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  2. 日常白天（到午后时分），面部出油主要分布在？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 't_zone_only', labelZh: '仅 T区（额头/鼻翼）偏油', labelEn: 'T-zone only' },
                    { key: 'whole_face', labelZh: '全脸均明显出油发亮', labelEn: 'Whole face oily' },
                    { key: 'rarely_oily', labelZh: '全天基本不出油甚至偏干', labelEn: 'Rarely oily / Dry' },
                    { key: 'unsure', labelZh: '不确定 / 不清楚', labelEn: 'Not sure' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('daytimeOiliness', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.daytimeOiliness === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.daytimeOiliness === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Dryness / tightness frequency */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  3. 您平时感到面部干燥或紧绷的频率如何？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'frequent', labelZh: '经常出现（几乎每天）', labelEn: 'Frequent' },
                    { key: 'seasonal', labelZh: '换季或秋冬时偶尔出现', labelEn: 'Seasonal' },
                    { key: 'rare', labelZh: '极少感到干燥紧绷', labelEn: 'Rarely / Never' },
                    { key: 'unsure', labelZh: '不确定 / 不清楚', labelEn: 'Not sure' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('drynessFrequency', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.drynessFrequency === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.drynessFrequency === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 耐受度与外界反应 */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#f0f9fa] pb-2">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider block">
                  Group B • 屏障耐受度与诱发反应
                </span>
                <h4 className="font-headline font-bold text-sm text-[#1f2937] mt-0.5">
                  {isZh ? '自评护肤刺激体验与外界诱因（可多选）' : 'Reactions to Products & External Triggers'}
                </h4>
              </div>

              {/* Q4: Product reactions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#374151]">
                  4. 使用新护肤品或高浓度功效成分时，是否曾出现以下现象？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'stinging', labelZh: '刺痛、发热灼烧感' },
                    { key: 'redness', labelZh: '颊部泛红脆弱或起皮' },
                    { key: 'breakouts', labelZh: '易闷闭口或诱发粉刺' },
                    { key: 'none_known', labelZh: '耐受良好，极少不适' },
                    { key: 'unsure', labelZh: '不确定 / 未曾注意' }
                  ].map((opt) => {
                    const isSelected = answers.productReactions.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleArrayItem('productReactions', opt.key)}
                        className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                            : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                        }`}
                      >
                        <span>{opt.labelZh}</span>
                        <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#0099A7]' : 'text-[#d1d5db]'}`}>
                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q5: Environmental triggers */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  5. 以下哪些环境变化容易让您的肌肤感到不适或泛红？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'temp_shifts', labelZh: '温差突变（冷热交替）' },
                    { key: 'ac_heating', labelZh: '长时间密闭空调/暖气房' },
                    { key: 'sun_exposure', labelZh: '户外日晒紫外线照射' },
                    { key: 'dry_wind', labelZh: '大风干燥/季节交替' },
                    { key: 'none', labelZh: '无明显环境易感现象' }
                  ].map((opt) => {
                    const isSelected = answers.environmentalTriggers.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleArrayItem('environmentalTriggers', opt.key)}
                        className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                            : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                        }`}
                      >
                        <span>{opt.labelZh}</span>
                        <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#0099A7]' : 'text-[#d1d5db]'}`}>
                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 核心困扰与微观问题 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#f0f9fa] pb-2">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider block">
                  Group C • 当前核心困扰
                </span>
                <h4 className="font-headline font-bold text-sm text-[#1f2937] mt-0.5">
                  {isZh ? '希望重点调理的肌肤困扰（可多选）' : 'Skin Concerns to Target'}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'breakouts', labelZh: '粉刺闭口与反复长痘', icon: 'dermatology' },
                  { key: 'uneven_tone', labelZh: '暗沉发黄与肤色不均', icon: 'wb_sunny' },
                  { key: 'rough_texture', labelZh: '粗糙颗粒感与平整度低', icon: 'grain' },
                  { key: 'enlarged_pores', labelZh: '鼻翼及颊部毛孔显见', icon: 'blur_on' },
                  { key: 'under_eye', labelZh: '眼周暗沉与细纹干纹', icon: 'visibility' },
                  { key: 'redness', labelZh: '换季两颊泛红脆弱', icon: 'water_drop' }
                ].map((opt) => {
                  const isSelected = answers.concerns.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleArrayItem('concerns', opt.key)}
                      className={`p-3 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#0099A7]' : 'text-[#6b7280]'}`}>
                          {opt.icon}
                        </span>
                        <span>{opt.labelZh}</span>
                      </div>
                      <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#0099A7]' : 'text-[#d1d5db]'}`}>
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Free-text custom concern input */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  其他具体困扰或局部说明（选填）：
                </label>
                <input
                  type="text"
                  value={answers.customConcernText}
                  onChange={(e) => updateAnswer('customConcernText', e.target.value)}
                  placeholder="例如：熬夜后下巴易发大红痘、鼻翼两侧总泛红..."
                  className="w-full px-3.5 py-2.5 bg-[#f0f9fa] border border-[#d0eff3] rounded-2xl text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
                />
              </div>
            </div>
          )}

          {/* STEP 4: 日常护肤习惯 */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#f0f9fa] pb-2">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider block">
                  Group D • 护肤习惯与紫外线防护
                </span>
                <h4 className="font-headline font-bold text-sm text-[#1f2937] mt-0.5">
                  {isZh ? '现有护肤步骤与日晒情况' : 'Existing Steps & UV Protection'}
                </h4>
              </div>

              {/* Routine Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#374151]">
                  6. 您目前日常护肤中包含哪些品类？（可多选）
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'cleanser', labelZh: '洁面产品' },
                    { key: 'toner', labelZh: '爽肤水/喷雾' },
                    { key: 'serum', labelZh: '功效精华' },
                    { key: 'cream', labelZh: '乳液或面霜' },
                    { key: 'sunscreen', labelZh: '日常防晒' },
                    { key: 'mask', labelZh: '贴片/涂抹面膜' }
                  ].map((opt) => {
                    const isSelected = answers.routineCategories.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleArrayItem('routineCategories', opt.key)}
                        className={`p-2 rounded-xl text-center border text-xs transition-all ${
                          isSelected
                            ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                            : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                        }`}
                      >
                        {opt.labelZh}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sunscreen frequency */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  7. 您使用防晒霜的规律是？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'daily', labelZh: '每天出门均涂抹防晒' },
                    { key: 'sunny_days_only', labelZh: '仅阳光烈或长时间户外' },
                    { key: 'rarely', labelZh: '偶尔或基本不涂防晒' },
                    { key: 'unsure', labelZh: '不确定 / 不清楚' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('sunscreenFrequency', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.sunscreenFrequency === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.sunscreenFrequency === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outdoor exposure */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  8. 白天户外暴露时间通常为？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'low', labelZh: '少于 1 小时（室内办公为主）' },
                    { key: 'moderate', labelZh: '1 - 3 小时（通勤与户外活动）' },
                    { key: 'high', labelZh: '超过 3 小时（户外工作/运动）' },
                    { key: 'unsure', labelZh: '不确定 / 不规律' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('outdoorExposure', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.outdoorExposure === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.outdoorExposure === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: 诉求与质地偏好 */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#f0f9fa] pb-2">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider block">
                  Group E • 首要目标与质地偏好
                </span>
                <h4 className="font-headline font-bold text-sm text-[#1f2937] mt-0.5">
                  {isZh ? '首要改善方向与配方偏好' : 'Primary Goal & Texture Preference'}
                </h4>
              </div>

              {/* Primary Goal */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#374151]">
                  9. 未来 1-3 个月，您最期望重点达成的目标是？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'barrier_repair', labelZh: '修护屏障、舒缓泛红稳定' },
                    { key: 'oil_control', labelZh: '水油平衡、清爽控油防痘' },
                    { key: 'brightening', labelZh: '改善暗黄暗沉、提亮光采' },
                    { key: 'deep_hydration', labelZh: '充盈补水、告别干燥起皮' },
                    { key: 'anti_aging', labelZh: '紧致弹润、淡化浅表细纹' },
                    { key: 'unsure', labelZh: '日常维稳、按需调整' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('primaryGoal', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.primaryGoal === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.primaryGoal === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texture preference */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  10. 您更青睐的面霜/乳液质地？
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'light_gel', labelZh: '清透啫喱/水感凝露（秒吸收）' },
                    { key: 'silky_lotion', labelZh: '轻盈水乳（轻润水感）' },
                    { key: 'rich_cream', labelZh: '丰盈滋养霜（长效包裹锁水）' },
                    { key: 'no_preference', labelZh: '不限，以功效调理优先' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateAnswer('texturePreference', opt.key as any)}
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                        answers.texturePreference === opt.key
                          ? 'border-[#0099A7] bg-[#f0f9fa] text-[#0099A7] font-bold shadow-2xs'
                          : 'border-[#e5f1f3] hover:border-[#0099A7]/40 bg-white text-[#4b5563]'
                      }`}
                    >
                      <span>{opt.labelZh}</span>
                      {answers.texturePreference === opt.key && (
                        <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avoid ingredients input */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-[#374151]">
                  需要避开的成分或过敏原（选填）：
                </label>
                <input
                  type="text"
                  value={answers.avoidIngredientsInput}
                  onChange={(e) => updateAnswer('avoidIngredientsInput', e.target.value)}
                  placeholder="如：变性乙醇、高浓度香精、果酸、水杨酸..."
                  className="w-full px-3.5 py-2.5 bg-[#f0f9fa] border border-[#d0eff3] rounded-2xl text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
                />
              </div>

              {/* Special notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#374151]">
                  其他护肤备注（选填）：
                </label>
                <input
                  type="text"
                  value={answers.specialNotes}
                  onChange={(e) => updateAnswer('specialNotes', e.target.value)}
                  placeholder="如：正在使用维A醇、换季经常泛红、经常熬夜..."
                  className="w-full px-3.5 py-2.5 bg-[#f0f9fa] border border-[#d0eff3] rounded-2xl text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#f0f9fa] border-t border-[#d0eff3] flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-full bg-white border border-[#d0eff3] text-xs font-bold text-[#4b5563] hover:text-[#1f2937] active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>{isZh ? '上一步' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                className="text-[11px] text-[#6b7280] hover:text-red-500 font-medium underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-xs">delete_sweep</span>
                <span>{isZh ? '清空草稿' : 'Clear draft'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] active:scale-95 transition-all shadow-md flex items-center gap-1"
              >
                <span>{isZh ? '下一步' : 'Next'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                <span>{isZh ? '提交问卷并更新报告' : 'Submit Questionnaire & Update Report'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Discard Draft Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl border border-[#d0eff3] space-y-3">
              <h5 className="font-bold text-sm text-[#1f2937]">
                {isZh ? '确认清空问卷草稿？' : 'Discard Questionnaire Draft?'}
              </h5>
              <p className="text-xs text-[#6b7280]">
                {isZh ? '清空后已填写的问卷选项将被重置，您可随时重新填写。' : 'All unsaved responses will be cleared.'}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-[#4b5563] hover:bg-gray-100 font-semibold"
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-3.5 py-1.5 rounded-full text-xs text-white bg-red-500 hover:bg-red-600 font-bold shadow-xs"
                >
                  {isZh ? '确认清空' : 'Discard'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
