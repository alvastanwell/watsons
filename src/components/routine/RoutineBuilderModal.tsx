import React, { useState, useRef } from 'react';
import { Language, RoutineStep, RoutineCategoryKey } from '../../types';
import { WATSONS_PRODUCT_CATALOGUE } from '../../data/productCatalogue';
import { COMMON_SKINCARE_DATABASE, CommonSkincareItem } from '../../data/externalProductDatabase';
import { ROUTINE_CATEGORIES, getCategoryRank, sortStepsByStandardOrder } from '../../utils/routineUtils';
import { SafeProductImage } from '../common/SafeProductImage';

export type BuilderMode = 'create' | 'add_step' | 'replace_step';
export type UsagePeriod = 'morning' | 'evening' | 'both';

interface RoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: BuilderMode;
  targetStep?: RoutineStep | null;
  targetTab?: 'morning' | 'evening';
  morningSteps: RoutineStep[];
  setMorningSteps: React.Dispatch<React.SetStateAction<RoutineStep[]>>;
  eveningSteps: RoutineStep[];
  setEveningSteps: React.Dispatch<React.SetStateAction<RoutineStep[]>>;
  language: Language;
  onShowToast: (msg: string) => void;
}

export const RoutineBuilderModal: React.FC<RoutineBuilderModalProps> = ({
  isOpen,
  onClose,
  mode,
  targetStep,
  targetTab = 'morning',
  morningSteps,
  setMorningSteps,
  eveningSteps,
  setEveningSteps,
  language,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const [activeTab, setActiveTab] = useState<'search' | 'scan' | 'manual'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Manual entry state
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualCategory, setManualCategory] = useState<RoutineCategoryKey>('cleanser');
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>(
    targetTab === 'evening' ? 'evening' : 'morning'
  );

  // Photo / Barcode recognition state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionCandidate, setRecognitionCandidate] = useState<{
    brand: string;
    name: string;
    category: RoutineCategoryKey;
    confidence?: number;
  } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Stop camera when closing or switching away
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Helper to map category key to label
  const getCategoryLabel = (key: RoutineCategoryKey): { zh: string; en: string } => {
    const found = ROUTINE_CATEGORIES.find((c) => c.key === key);
    return {
      zh: found?.labelZh || '护肤品',
      en: found?.labelEn || 'Product'
    };
  };

  // Helper to create a category SVG placeholder
  const getCategoryPlaceholderImage = (cat: RoutineCategoryKey): string => {
    const catObj = ROUTINE_CATEGORIES.find((c) => c.key === cat);
    const icon = catObj?.iconName || 'spa';
    const label = catObj?.labelZh || '护肤';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="20" fill="#f0f9fa"/>
      <rect x="2" y="2" width="116" height="116" rx="18" fill="none" stroke="#d0eff3" stroke-width="2"/>
      <circle cx="60" cy="50" r="28" fill="#e0f5f7"/>
      <text x="60" y="58" font-family="sans-serif" font-size="24" fill="#00939F" text-anchor="middle" dominant-baseline="middle">✦</text>
      <text x="60" y="94" font-family="sans-serif" font-weight="bold" font-size="13" fill="#00939F" text-anchor="middle">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // 1. SEARCH LOGIC: Filter across Watsons catalogue + Common non-store skincare
  const allSearchItems: Array<{
    id: string;
    nameZh: string;
    nameEn: string;
    brandZh: string;
    brandEn: string;
    category: RoutineCategoryKey;
    categoryZh: string;
    image?: string;
    isStore: boolean;
  }> = [
    ...WATSONS_PRODUCT_CATALOGUE.map((w) => ({
      id: w.product_id,
      nameZh: w.name_zh,
      nameEn: w.name,
      brandZh: w.brand_zh,
      brandEn: w.brand,
      category: (w.category === 'mask' ? 'other' : w.category) as RoutineCategoryKey,
      categoryZh: w.category === 'mask' ? '面膜' : w.supported_benefits_zh[0] || '护肤',
      image: w.image_url,
      isStore: true
    })),
    ...COMMON_SKINCARE_DATABASE.map((c) => ({
      id: c.id,
      nameZh: c.nameZh,
      nameEn: c.name,
      brandZh: c.brandZh,
      brandEn: c.brand,
      category: c.category as RoutineCategoryKey,
      categoryZh: c.categoryZh,
      image: c.image,
      isStore: false
    }))
  ];

  const filteredSearchItems = searchQuery.trim()
    ? allSearchItems.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
          item.nameZh.toLowerCase().includes(query) ||
          item.nameEn.toLowerCase().includes(query) ||
          item.brandZh.toLowerCase().includes(query) ||
          item.brandEn.toLowerCase().includes(query) ||
          item.categoryZh.toLowerCase().includes(query)
        );
      })
    : allSearchItems.slice(0, 8); // show popular default suggestions

  // Commit a new step to state and localStorage
  const commitStepToRoutines = (
    itemData: {
      titleZh: string;
      titleEn: string;
      brandZh?: string;
      categoryKey: RoutineCategoryKey;
      image?: string;
      productId?: string;
    },
    period: UsagePeriod
  ) => {
    const catInfo = getCategoryLabel(itemData.categoryKey);
    const placeholderImg = itemData.image || getCategoryPlaceholderImage(itemData.categoryKey);

    const makeStep = (tod: 'morning' | 'evening'): RoutineStep => ({
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stepNumber: 99,
      productId: itemData.productId,
      category: `Step • ${catInfo.en}`,
      categoryZh: catInfo.zh,
      title: itemData.titleEn || itemData.titleZh,
      titleZh: itemData.titleZh,
      subtitle: itemData.brandZh || (tod === 'morning' ? 'Morning Routine' : 'Evening Repair'),
      subtitleZh: itemData.brandZh ? `${itemData.brandZh} · 日常爱用` : '自选用护肤品',
      details: 'Follow recommended skincare steps gently.',
      detailsZh: '日常护肤：洁面后按序涂抹，轻柔吸收。',
      image: placeholderImg,
      completed: false,
      timeOfDay: tod,
      howToUseZh: '取适量均匀涂抹面部，温和吸收。',
      whyInRoutineZh: '维持肌肤屏障，提供日常所需的水润滋养。'
    });

    if (mode === 'replace_step' && targetStep) {
      // Replace targetStep in targetTab
      if (targetStep.timeOfDay === 'morning') {
        setMorningSteps((prev) =>
          prev.map((s) => (s.id === targetStep.id ? { ...makeStep('morning'), id: targetStep.id, stepNumber: targetStep.stepNumber } : s))
        );
      } else {
        setEveningSteps((prev) =>
          prev.map((s) => (s.id === targetStep.id ? { ...makeStep('evening'), id: targetStep.id, stepNumber: targetStep.stepNumber } : s))
        );
      }
      onShowToast(isZh ? `已替换步骤为【${itemData.titleZh}】` : `Replaced step with ${itemData.titleZh}`);
      handleClose();
      return;
    }

    // Add step logic
    if (period === 'morning' || period === 'both') {
      setMorningSteps((prev) => {
        const next = [...prev, makeStep('morning')];
        // If routine is being freshly created (e.g. empty), sort by standard logical order
        return prev.length === 0 ? sortStepsByStandardOrder(next) : next.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      });
    }

    if (period === 'evening' || period === 'both') {
      setEveningSteps((prev) => {
        const next = [...prev, makeStep('evening')];
        return prev.length === 0 ? sortStepsByStandardOrder(next) : next.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      });
    }

    onShowToast(isZh ? `已添加【${itemData.titleZh}】到方案` : `Added ${itemData.titleZh} to routine`);
    handleClose();
  };

  // 2. CAMERA AND SCAN LOGIC (Do NOT request camera until user explicitly triggers it)
  const handleStartCamera = async () => {
    try {
      setCameraNotice(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      // Graceful fallback to manual entry with friendly guidance
      setIsCameraActive(false);
      setCameraNotice(isZh ? '无法访问摄像头（可能因权限或环境限制），已为您切换至手动输入。' : 'Camera unavailable. Switched to manual entry.');
      setActiveTab('manual');
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(dataUrl);
      }
    }
    stopCamera();
    simulateRecognition('理肤泉 B5 多效保湿修护霜', '理肤泉', 'cream');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
        simulateRecognition('理肤泉 B5 多效保湿修护霜', '理肤泉', 'cream');
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateRecognition = (name: string, brand: string, cat: RoutineCategoryKey) => {
    setIsRecognizing(true);
    setTimeout(() => {
      setIsRecognizing(false);
      setRecognitionCandidate({
        brand,
        name,
        category: cat,
        confidence: 0.96
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg max-h-[92vh] rounded-3xl shadow-2xl border border-[#e5f1f3] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e5f1f3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#00939F]">
              <span className="material-symbols-outlined text-xl">
                {mode === 'replace_step' ? 'swap_horiz' : 'add_circle'}
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#1f2937]">
                {mode === 'replace_step'
                  ? (isZh ? `替换步骤: ${targetStep?.titleZh}` : 'Replace Step')
                  : mode === 'create'
                  ? (isZh ? '建立护肤方案' : 'Build Skincare Routine')
                  : (isZh ? '添加护肤品至方案' : 'Add Product to Routine')}
              </h3>
              <p className="text-[11px] text-[#6b7280]">
                {isZh ? '用你正在使用的产品即可，无需重新购买' : 'Use your existing products'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 3 Entry Tabs: Search, Photo/Barcode, Manual Entry */}
        <div className="px-4 pt-3 pb-1 border-b border-[#f0f9fa] shrink-0 bg-[#f9fafb]">
          <div className="grid grid-cols-3 p-1 bg-white rounded-xl border border-[#e5f1f3]">
            <button
              onClick={() => {
                stopCamera();
                setActiveTab('search');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'search'
                  ? 'bg-[#00939F] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#1f2937]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>{isZh ? 'A. 搜索查找' : 'Search'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('scan');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'scan'
                  ? 'bg-[#00939F] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#1f2937]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <span>{isZh ? 'B. 拍照/条码' : 'Photo/Barcode'}</span>
            </button>

            <button
              onClick={() => {
                stopCamera();
                setActiveTab('manual');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual'
                  ? 'bg-[#00939F] text-white shadow-xs'
                  : 'text-[#6b7280] hover:text-[#1f2937]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">edit_note</span>
              <span>{isZh ? 'C. 手动输入' : 'Manual'}</span>
            </button>
          </div>
        </div>

        {/* Usage Period Selector (for adding products) */}
        {mode !== 'replace_step' && (
          <div className="px-4 py-2.5 bg-[#f0f9fa]/70 border-b border-[#e5f1f3] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1f2937] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#00939F]">schedule</span>
              {isZh ? '使用时段：' : 'Period:'}
            </span>
            <div className="flex items-center gap-1.5">
              {(['morning', 'evening', 'both'] as UsagePeriod[]).map((p) => {
                const isSelected = usagePeriod === p;
                const label = p === 'morning' ? '晨间' : p === 'evening' ? '晚间' : '早晚都用';
                return (
                  <button
                    key={p}
                    onClick={() => setUsagePeriod(p)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#00939F] text-white shadow-xs'
                        : 'bg-white text-[#4b5563] border border-[#d0eff3] hover:bg-gray-50'
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notice Banner (if any) */}
        {cameraNotice && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">info</span>
            <span>{cameraNotice}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* --- TAB A: SEARCH --- */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isZh ? '搜索产品、品牌或成分 (如: 适乐肤、理肤泉、防晒)...' : 'Search brand or product...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-[#e5f1f3] rounded-2xl text-xs text-[#1f2937] placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#00939F] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                  </button>
                )}
              </div>

              {/* Instant "Add with this custom name" button if search query is present */}
              {searchQuery.trim().length > 0 && (
                <div className="p-3 bg-[#f0f9fa] border border-[#d0eff3] rounded-2xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#4b5563]">
                      {isZh ? '直接使用搜索词作为自用护肤品：' : 'Use search term as custom product:'}
                    </p>
                    <p className="text-xs font-bold text-[#00939F] truncate">
                      “{searchQuery.trim()}”
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setManualName(searchQuery.trim());
                      setActiveTab('manual');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-[#00939F] text-white text-xs font-bold hover:bg-[#007d89] transition-all"
                    type="button"
                  >
                    {isZh ? '下一步' : 'Next'}
                  </button>
                </div>
              )}

              {/* Search Results List */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#6b7280]">
                  {searchQuery.trim()
                    ? (isZh ? `匹配结果 (${filteredSearchItems.length})` : `Matches (${filteredSearchItems.length})`)
                    : (isZh ? '精选与常见自用护肤库' : 'Common Skincare Catalogue')}
                </p>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredSearchItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-[#e5f1f3] rounded-2xl hover:border-[#00939F]/50 hover:bg-[#f0f9fa]/40 transition-all flex items-center justify-between gap-3 shadow-3xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image ? (
                            <SafeProductImage src={item.image} alt={item.nameZh} />
                          ) : (
                            <span className="material-symbols-outlined text-[#00939F] text-lg">
                              {ROUTINE_CATEGORIES.find(c => c.key === item.category)?.iconName || 'spa'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-[#00939F] bg-[#f0f9fa] px-1.5 py-0.2 rounded border border-[#d0eff3]">
                              {item.brandZh}
                            </span>
                            <span className="text-[9px] text-[#6b7280] bg-gray-100 px-1.5 py-0.2 rounded">
                              {item.categoryZh}
                            </span>
                            {item.isStore ? (
                              <span className="text-[9px] text-teal-700 bg-teal-50 px-1 py-0.2 rounded font-medium">
                                {isZh ? '屈臣氏在架' : 'Store'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-500 bg-gray-50 px-1 py-0.2 rounded font-medium">
                                {isZh ? '日常爱用' : 'Owned'}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-[#1f2937] truncate mt-0.5">
                            {isZh ? item.nameZh : item.nameEn}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          commitStepToRoutines(
                            {
                              titleZh: item.nameZh,
                              titleEn: item.nameEn,
                              brandZh: item.brandZh,
                              categoryKey: item.category,
                              image: item.image,
                              productId: item.isStore ? item.id : undefined
                            },
                            usagePeriod
                          )
                        }
                        className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#00939F] text-white text-xs font-bold hover:bg-[#007d89] transition-all shadow-3xs active:scale-95"
                        type="button"
                      >
                        {mode === 'replace_step' ? (isZh ? '替换' : 'Replace') : (isZh ? '+ 添加' : '+ Add')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- TAB B: PHOTO / BARCODE SCAN --- */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {!recognitionCandidate ? (
                <div className="space-y-3">
                  {/* Live camera view if active */}
                  {isCameraActive ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-[#e5f1f3]">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Aim reticle */}
                      <div className="absolute inset-8 border-2 border-dashed border-[#00939F] rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="text-white/80 text-xs bg-black/50 px-2 py-1 rounded-md">
                          {isZh ? '将瓶身或条码对准此框' : 'Align packaging or barcode'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                        <button
                          onClick={handleCaptureFrame}
                          className="px-5 py-2 rounded-full bg-[#00939F] text-white font-bold text-xs shadow-lg hover:bg-[#007d89]"
                          type="button"
                        >
                          {isZh ? '拍照识别' : 'Capture & Identify'}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-2 rounded-full bg-white/80 text-[#1f2937] font-semibold text-xs shadow-md"
                          type="button"
                        >
                          {isZh ? '取消' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 border-2 border-dashed border-[#d0eff3] rounded-3xl bg-[#f0f9fa]/50 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#d0eff3] flex items-center justify-center text-[#00939F] shadow-xs">
                        <span className="material-symbols-outlined text-3xl">photo_camera</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1f2937]">
                          {isZh ? '拍摄产品包装或扫描条码' : 'Photo or Barcode Scan'}
                        </h4>
                        <p className="text-xs text-[#6b7280] mt-1 max-w-xs mx-auto">
                          {isZh
                            ? '系统将智能识别品牌、名称与护肤品类，确认无误后即可一键添加。'
                            : 'Automatically detects brand, name, and category.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        {/* Only requests camera on click */}
                        <button
                          onClick={handleStartCamera}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#00939F] text-white text-xs font-bold hover:bg-[#007d89] transition-all flex items-center justify-center gap-1.5"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">videocam</span>
                          <span>{isZh ? '开启摄像头扫描' : 'Start Camera'}</span>
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-white border border-[#d0eff3] text-[#00939F] text-xs font-bold hover:bg-[#e0f5f7] transition-all flex items-center justify-center gap-1.5"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm">upload_file</span>
                          <span>{isZh ? '上传包装照片' : 'Upload Photo'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Instant test simulation shortcuts */}
                      <div className="pt-2 border-t border-[#d0eff3]/50">
                        <span className="text-[11px] text-[#6b7280] block mb-1.5">
                          {isZh ? '或直接快速模拟识别测试：' : 'Or quick test samples:'}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            onClick={() => simulateRecognition('理肤泉 B5 多效保湿修护霜', '理肤泉', 'cream')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[10px] text-[#4b5563] hover:border-[#00939F]"
                            type="button"
                          >
                            理肤泉 B5霜
                          </button>
                          <button
                            onClick={() => simulateRecognition('雅漾 舒护活泉喷雾', '雅漾', 'toner')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[10px] text-[#4b5563] hover:border-[#00939F]"
                            type="button"
                          >
                            雅漾活泉喷雾
                          </button>
                          <button
                            onClick={() => simulateRecognition('安热沙 金灿倍护防晒乳', '安热沙', 'sunscreen')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[10px] text-[#4b5563] hover:border-[#00939F]"
                            type="button"
                          >
                            安热沙防晒
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isRecognizing && (
                    <div className="p-4 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center gap-2 text-xs text-[#00939F] font-bold animate-pulse">
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      <span>{isZh ? '正在分析包装与条码特征...' : 'Recognizing product...'}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Recognition Result Confirmation Card (Requires user confirmation / correction) */
                <div className="p-4 bg-[#f0f9fa] rounded-3xl border border-[#d0eff3] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#d0eff3]/60">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00939F] text-lg">verified</span>
                      <h4 className="font-bold text-xs text-[#1f2937]">
                        {isZh ? '确认识别结果（可直接修正）' : 'Confirm Recognized Item'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#00939F] font-bold bg-white px-2 py-0.5 rounded-full border border-[#d0eff3]">
                      {isZh ? '识别置信度 96%' : 'Confidence 96%'}
                    </span>
                  </div>

                  {photoPreview && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#d0eff3] bg-white mx-auto shadow-2xs">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#4b5563] block mb-1">
                        {isZh ? '产品名称' : 'Product Name'}
                      </label>
                      <input
                        type="text"
                        value={recognitionCandidate.name}
                        onChange={(e) =>
                          setRecognitionCandidate({ ...recognitionCandidate, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#d0eff3] rounded-xl text-xs font-bold text-[#1f2937]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-[#4b5563] block mb-1">
                          {isZh ? '品牌 (选填)' : 'Brand'}
                        </label>
                        <input
                          type="text"
                          value={recognitionCandidate.brand}
                          onChange={(e) =>
                            setRecognitionCandidate({ ...recognitionCandidate, brand: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white border border-[#d0eff3] rounded-xl text-xs text-[#1f2937]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#4b5563] block mb-1">
                          {isZh ? '品类' : 'Category'}
                        </label>
                        <select
                          value={recognitionCandidate.category}
                          onChange={(e) =>
                            setRecognitionCandidate({
                              ...recognitionCandidate,
                              category: e.target.value as RoutineCategoryKey
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] font-semibold"
                        >
                          {ROUTINE_CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {isZh ? c.labelZh : c.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setManualName(recognitionCandidate.name);
                        setManualBrand(recognitionCandidate.brand);
                        setManualCategory(recognitionCandidate.category);
                        setActiveTab('manual');
                      }}
                      className="py-2.5 rounded-full border border-gray-300 bg-white text-xs text-[#4b5563] font-semibold hover:bg-gray-50"
                      type="button"
                    >
                      {isZh ? '改用手动编辑' : 'Manual Edit'}
                    </button>
                    <button
                      onClick={() =>
                        commitStepToRoutines(
                          {
                            titleZh: recognitionCandidate.name,
                            titleEn: recognitionCandidate.name,
                            brandZh: recognitionCandidate.brand,
                            categoryKey: recognitionCandidate.category,
                            image: photoPreview || undefined
                          },
                          usagePeriod
                        )
                      }
                      className="py-2.5 rounded-full bg-[#00939F] text-white text-xs font-bold shadow-xs hover:bg-[#007d89]"
                      type="button"
                    >
                      {isZh ? '确认识别并添加' : 'Confirm & Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB C: MANUAL ENTRY --- */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1f2937] block mb-1">
                  {isZh ? '产品名称 (必填)' : 'Product Name (Required)'}
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder={isZh ? '例如：适乐肤 PM 乳、理肤泉 B5 霜...' : 'e.g. CeraVe PM Lotion'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e5f1f3] rounded-2xl text-xs text-[#1f2937] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#00939F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1f2937] block mb-1">
                  {isZh ? '品牌 (选填)' : 'Brand (Optional)'}
                </label>
                <input
                  type="text"
                  value={manualBrand}
                  onChange={(e) => setManualBrand(e.target.value)}
                  placeholder={isZh ? '例如：CeraVe、理肤泉、雅漾...' : 'e.g. CeraVe, Avène'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e5f1f3] rounded-2xl text-xs text-[#1f2937] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#00939F]"
                />
              </div>

              {/* 6 Categories Selection */}
              <div>
                <label className="text-xs font-bold text-[#1f2937] block mb-1.5">
                  {isZh ? '所属护肤品类' : 'Skincare Category'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROUTINE_CATEGORIES.map((cat) => {
                    const isSelected = manualCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setManualCategory(cat.key)}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#f0f9fa] border-[#00939F] text-[#00939F] shadow-xs'
                            : 'bg-white border-[#e5f1f3] text-[#4b5563] hover:border-gray-300'
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {cat.iconName}
                        </span>
                        <span>{isZh ? cat.labelZh : cat.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Neutral Placeholder Preview */}
              <div className="p-3 bg-[#f0f9fa] rounded-2xl border border-[#d0eff3] flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#d0eff3] p-1 flex items-center justify-center shrink-0">
                  <img
                    src={getCategoryPlaceholderImage(manualCategory)}
                    alt="Category Placeholder"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-[#4b5563]">
                  <p className="font-bold text-[#1f2937]">
                    {manualName.trim() || (isZh ? '未命名的护肤步骤' : 'Custom Step')}
                  </p>
                  <p className="text-[10px] text-[#00939F]">
                    {getCategoryLabel(manualCategory).zh} · {isZh ? '自备正品' : 'Personal item'}
                  </p>
                </div>
              </div>

              <button
                disabled={!manualName.trim()}
                onClick={() =>
                  commitStepToRoutines(
                    {
                      titleZh: manualName.trim(),
                      titleEn: manualName.trim(),
                      brandZh: manualBrand.trim() || undefined,
                      categoryKey: manualCategory
                    },
                    usagePeriod
                  )
                }
                className="w-full py-3 rounded-full bg-[#00939F] disabled:opacity-50 text-white font-bold text-xs shadow-md hover:bg-[#007d89] transition-all"
                type="button"
              >
                {mode === 'replace_step'
                  ? (isZh ? '保存并替换' : 'Save & Replace')
                  : (isZh ? '保存我的方案' : 'Save to Routine')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
