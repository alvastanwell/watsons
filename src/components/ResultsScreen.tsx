import React, { useState } from 'react';
import { 
  Language, 
  ScreenId, 
  SkinAssessmentState, 
  SkinAssessmentHistoryRecord, 
  SkinAssessmentResult,
  ProductItem
} from '../types';
import { WATSONS_PRODUCT_CATALOGUE, getProductById, toProductItem } from '../data/productCatalogue';
import { SafeProductImage } from './common/SafeProductImage';
import { RoutineSelectionSheet, RoutineSelectionType } from './modals/RoutineSelectionSheet';

interface ResultsScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  onOpenStoreModal?: () => void;
  onOpenChatModal?: () => void;
  onOpenPassModal?: () => void;
  onOpenProductDetail?: (product: ProductItem) => void;
  onAddToCart?: (product: ProductItem) => void;
  onAddToRoutine?: (product: ProductItem) => void;
  onAddToRoutineWithSelection?: (product: ProductItem, selection: RoutineSelectionType) => void;
  onSaveToProfile?: () => void;
  onShowToast?: (msg: string) => void;
  assessmentState: SkinAssessmentState;
  onStartNewAssessment?: () => void;
  viewingHistoryRecord?: SkinAssessmentHistoryRecord | null;
  onCloseHistoryView?: () => void;
}

interface FindingCardItem {
  id: string;
  icon: string;
  titleZh: string;
  titleEn: string;
  observationZh: string;
  observationEn: string;
  statusBadgeZh: string;
  statusBadgeEn: string;
  statusColor: 'teal' | 'emerald' | 'amber' | 'neutral';
  explanationZh: string;
  explanationEn: string;
  regionZh?: string;
  regionEn?: string;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  language,
  onNavigate,
  assessmentState,
  onStartNewAssessment,
  viewingHistoryRecord,
  onCloseHistoryView,
  onAddToCart,
  onAddToRoutine,
  onAddToRoutineWithSelection,
  onOpenProductDetail,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [selectedRoutineProduct, setSelectedRoutineProduct] = useState<ProductItem | null>(null);
  const [isRoutineSheetOpen, setIsRoutineSheetOpen] = useState(false);

  const isHistoryView = Boolean(viewingHistoryRecord);
  const results: SkinAssessmentResult | null = isHistoryView 
    ? (viewingHistoryRecord?.resultsSnapshot ?? null) 
    : (assessmentState.resultsData ?? null);
  const isCompleted = isHistoryView || Boolean(assessmentState.isCompleted && assessmentState.resultsData);

  // If user lands here with no completed assessment, show polite action to start
  if (!isCompleted || !results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-4 bg-white">
        <div className="w-16 h-16 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7]">
          <span className="material-symbols-outlined text-3xl">face_retouching_natural</span>
        </div>
        <h3 className="text-base font-bold text-[#1f2937]">
          {isZh ? '尚未完成测肤分析' : 'No Assessment Results Yet'}
        </h3>
        <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed">
          {isZh ? '暂无测肤数据。请先在首页拍照测肤或完成问卷自评，以生成专属肤质报告。' : 'Please take a photo or complete the questionnaire to view your skin report.'}
        </p>
        <button
          onClick={() => {
            if (onStartNewAssessment) onStartNewAssessment();
            onNavigate('home');
          }}
          className="px-6 py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold shadow-md hover:bg-[#007d89] active:scale-95 transition-all cursor-pointer"
          type="button"
        >
          {isZh ? '开始测肤' : 'Start Skin Assessment'}
        </button>
      </div>
    );
  }

  // Report Date / ID
  const reportDateFormatted = results.date
    ? new Date(results.date).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : (isZh ? '2026年3月' : 'March 2026');

  // Extract dimensions
  const radarDims = results.radarDimensions || [];
  const getRadarVal = (key: string) => radarDims.find((d) => d.key === key);

  const shineDim = getRadarVal('visibleShine');
  const rednessDim = getRadarVal('visibleRedness');
  const toneDim = getRadarVal('unevenTone');
  const textureDim = getRadarVal('visibleTexture');
  const poresDim = getRadarVal('visiblePores');
  const fineLinesDim = getRadarVal('visibleFineLines');

  // 1. Redness Assessment (connected directly to real redness assessment)
  const rednessCanAssess = rednessDim ? (rednessDim.canAssess && rednessDim.level !== null) : Boolean(results.visibleRedness !== undefined);
  const rednessLevel = rednessDim?.level ?? (results.visibleRedness ? 1 : 0);
  const rednessScore = rednessCanAssess ? Math.max(2.0, Number((9.5 - (rednessLevel * 1.8)).toFixed(1))) : null;

  // 2. Health (健康度)
  const healthCanAssess = true;
  const healthScore = Math.max(3.5, Number((9.2 - (rednessLevel * 1.2 + (textureDim?.level ?? 0) * 0.7)).toFixed(1)));

  // 3. Oiliness (干油性)
  const oilinessCanAssess = shineDim ? shineDim.canAssess && shineDim.level !== null : true;
  const oilinessLevel = shineDim?.level ?? 1;
  const oilinessScore = oilinessCanAssess ? (oilinessLevel === 1 ? 8.5 : oilinessLevel === 2 ? 7.6 : oilinessLevel === 0 ? 8.0 : 6.4) : null;

  // 4. Youthfulness (年轻度)
  const youthCanAssess = fineLinesDim ? fineLinesDim.canAssess && fineLinesDim.level !== null : true;
  const fineLinesLevel = fineLinesDim?.level ?? 0;
  const youthScore = youthCanAssess ? Math.max(4.0, Number((9.4 - (fineLinesLevel * 1.1)).toFixed(1))) : null;

  // 5. Tone Evenness (匀净度)
  const evennessCanAssess = toneDim ? toneDim.canAssess && toneDim.level !== null : true;
  const toneLevel = toneDim?.level ?? 1;
  const evennessScore = evennessCanAssess ? Math.max(3.5, Number((9.3 - (toneLevel * 1.1)).toFixed(1))) : null;

  // 6. Refinement & Texture (细腻度)
  const refinementCanAssess = poresDim ? poresDim.canAssess && poresDim.level !== null : true;
  const poresLevel = poresDim?.level ?? 1;
  const textureLevel = textureDim?.level ?? 0;
  const refinementScore = refinementCanAssess ? Math.max(3.5, Number((9.5 - (poresLevel * 0.8 + textureLevel * 0.8)).toFixed(1))) : null;

  // Overall Score Calculation (averaging assessable dimensions)
  const validScores: number[] = [];
  if (healthScore !== null) validScores.push(healthScore);
  if (oilinessScore !== null) validScores.push(oilinessScore);
  if (youthScore !== null) validScores.push(youthScore);
  if (rednessScore !== null) validScores.push(rednessScore);
  if (evennessScore !== null) validScores.push(evennessScore);
  if (refinementScore !== null) validScores.push(refinementScore);

  const overallScore = validScores.length > 0
    ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10)
    : 85;

  // Radar Polygon Configuration (6 points, strictly consistent)
  const radarRadius = 80;
  const radarCenter = { x: 130, y: 130 };
  const radarAngles = [
    -Math.PI / 2,         // 12:00 健康度
    -Math.PI / 6,         // 2:00 干油性
    Math.PI / 6,          // 4:00 年轻度
    Math.PI / 2,          // 6:00 泛红程度
    (5 * Math.PI) / 6,    // 8:00 匀净度
    (-5 * Math.PI) / 6    // 10:00 细腻度
  ];

  const radarDimensionItems = [
    { nameZh: '健康度', nameEn: 'Health', score: healthScore, canAssess: healthCanAssess },
    { nameZh: '干油性', nameEn: 'Balance', score: oilinessScore, canAssess: oilinessCanAssess },
    { nameZh: '年轻度', nameEn: 'Youth', score: youthScore, canAssess: youthCanAssess },
    { nameZh: '泛红程度', nameEn: 'Redness', score: rednessScore, canAssess: rednessCanAssess },
    { nameZh: '匀净度', nameEn: 'Evenness', score: evennessScore, canAssess: evennessCanAssess },
    { nameZh: '细腻度', nameEn: 'Refinement', score: refinementScore, canAssess: refinementCanAssess },
  ];

  const polygonPoints = radarAngles.map((angle, idx) => {
    const item = radarDimensionItems[idx];
    const val = item.canAssess && item.score !== null ? item.score / 10 : 0.35;
    const r = radarRadius * val;
    const x = radarCenter.x + r * Math.cos(angle);
    const y = radarCenter.y + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // 3. Easy-to-scan Findings Cards Grounded in Real Data
  const findings: FindingCardItem[] = [
    {
      id: 'oiliness',
      icon: 'water_drop',
      titleZh: '水油分泌与平衡',
      titleEn: 'Hydration & Sebum Balance',
      observationZh: oilinessLevel === 0 
        ? '面颊偏干缺水，T区皮脂分泌微弱' 
        : oilinessLevel === 1 
        ? 'T区局部皮脂分泌正常，两颊水油保持基本平稳' 
        : 'T区呈现明显皮脂反光，局部毛孔分泌较旺',
      observationEn: oilinessLevel === 1 ? 'Balanced sebum in T-zone and cheeks' : 'Moderate oiliness observed',
      statusBadgeZh: oilinessLevel === 0 ? '偏干缺水' : oilinessLevel === 1 ? '水油均衡' : 'T区偏油',
      statusBadgeEn: oilinessLevel === 1 ? 'Balanced' : 'T-Zone Shine',
      statusColor: oilinessLevel === 1 ? 'teal' : 'amber',
      regionZh: '额头、鼻翼及两颊',
      regionEn: 'Forehead, nose, cheeks',
      explanationZh: '日常洁面建议选用氨基酸弱酸性配方，避免过度去除天然皮脂膜。晨间涂抹清爽乳液，为角质层维持持续锁水力。',
      explanationEn: 'Use mild pH-balanced cleanser and lightweight hydration to balance natural sebum production.'
    },
    {
      id: 'redness',
      icon: 'shield_with_heart',
      titleZh: '屏障耐受与泛红',
      titleEn: 'Barrier Resilience & Redness',
      observationZh: !rednessCanAssess 
        ? '无法从当前图像充分判断微细血管表现' 
        : rednessLevel === 0 
        ? '角质层耐受稳定，两颊及鼻周未见异常泛红' 
        : '两颊局部存在轻微泛红反光，建议加强屏障舒缓',
      observationEn: rednessLevel === 0 ? 'Stable barrier without visible redness' : 'Mild visible redness detected',
      statusBadgeZh: !rednessCanAssess ? '无法判断' : rednessLevel === 0 ? '屏障耐受良好' : '轻度泛红',
      statusBadgeEn: rednessLevel === 0 ? 'Resilient' : 'Mild Sensitivity',
      statusColor: rednessLevel === 0 ? 'emerald' : 'amber',
      regionZh: '鼻翼周缘与两颊',
      regionEn: 'Cheeks & nasal folds',
      explanationZh: '选用含神经酰胺、积雪草苷或维生素原B5等舒缓修护类成分，换季或日晒后及时修护，减少外界刺激。',
      explanationEn: 'Support with ceramides and centella asiatica to maintain resilient barrier function.'
    },
    {
      id: 'smoothness',
      icon: 'texture',
      titleZh: '皮肤平滑度与纹理',
      titleEn: 'Texture & Smoothness',
      observationZh: textureLevel === 0 
        ? '面颊表皮纹理均匀细腻，未见明显起皮或粗糙' 
        : '局部角质稍有干燥堆积，平滑度有温和提升空间',
      observationEn: 'Even and smooth epidermis with uniform texture',
      statusBadgeZh: textureLevel === 0 ? '细腻柔滑' : '局部粗糙',
      statusBadgeEn: textureLevel === 0 ? 'Smooth' : 'Mild Texture',
      statusColor: textureLevel === 0 ? 'teal' : 'neutral',
      regionZh: '全脸表皮轮廓',
      regionEn: 'Overall facial surface',
      explanationZh: '保持角质水合度是平滑的关键，避免物理颗粒频繁磨砂，建议定期温和补水修护以促进天然代谢。',
      explanationEn: 'Maintain gentle hydration to support smooth epidermal renewal.'
    },
    {
      id: 'pores',
      icon: 'lens_blur',
      titleZh: '毛孔细致程度',
      titleEn: 'Pore Appearance',
      observationZh: poresLevel === 0 
        ? '毛孔微细紧致，分布均匀' 
        : poresLevel === 1 
        ? 'T区局部可见微小毛孔，面颊保持细致' 
        : '鼻翼及额头局部毛孔较明显',
      observationEn: poresLevel === 0 ? 'Refined and tight pores' : 'Minor pore visibility in T-zone',
      statusBadgeZh: poresLevel === 0 ? '细致紧实' : poresLevel === 1 ? '局部微显' : '局部明显',
      statusBadgeEn: poresLevel === 0 ? 'Refined' : 'Noticeable in T-zone',
      statusColor: poresLevel === 0 ? 'teal' : 'neutral',
      regionZh: '鼻部与内侧面颊',
      regionEn: 'Nose & inner cheeks',
      explanationZh: '毛孔粗大常与皮脂氧化或缺水有关，早晚做好彻底乳化洁面与抗氧化，能有效收敛视觉毛孔。',
      explanationEn: 'Prevent sebum oxidation with antioxidant serums and regular gentle cleansing.'
    },
    {
      id: 'eyeArea',
      icon: 'visibility',
      titleZh: '眼周状态与干纹',
      titleEn: 'Eye Area & Fine Lines',
      observationZh: fineLinesLevel === 0 
        ? '眼周表皮弹性良好，未见明显表情干纹' 
        : '眼周伴随轻微干燥细纹，需适度加强眼霜滋养',
      observationEn: fineLinesLevel === 0 ? 'Healthy eye contour with no visible lines' : 'Mild fine dry lines near eye contour',
      statusBadgeZh: fineLinesLevel === 0 ? '紧致无纹' : '轻度干纹',
      statusBadgeEn: fineLinesLevel === 0 ? 'Firm' : 'Dry Lines',
      statusColor: fineLinesLevel === 0 ? 'emerald' : 'amber',
      regionZh: '眼角及眼下轮廓',
      regionEn: 'Under-eye & outer contour',
      explanationZh: '眼周肌肤厚度仅为面部其他部位的1/3，建议取米粒大小眼霜用无名指腹轻点按压，兼顾晨间防晒。',
      explanationEn: 'Gently tap lightweight eye cream to maintain hydration and protect against photo-aging.'
    }
  ];

  // Matched Hero Product Recommendation from Catalogue
  const recommendedProductId = results.recommendedProductId;
  const primaryRecord = recommendedProductId ? getProductById(recommendedProductId) : undefined;
  const recommendedProduct: ProductItem = primaryRecord
    ? toProductItem(primaryRecord, language)
    : toProductItem(WATSONS_PRODUCT_CATALOGUE[1], language);

  const handleOpenRoutineSheetForProduct = (prod: ProductItem) => {
    setSelectedRoutineProduct(prod);
    setIsRoutineSheetOpen(true);
  };

  const handleConfirmAddToRoutine = (selection: RoutineSelectionType) => {
    if (selectedRoutineProduct) {
      if (onAddToRoutineWithSelection) {
        onAddToRoutineWithSelection(selectedRoutineProduct, selection);
      } else if (onAddToRoutine) {
        onAddToRoutine(selectedRoutineProduct);
      }
    }
    setIsRoutineSheetOpen(false);
  };

  const handleDone = () => {
    if (onCloseHistoryView) {
      onCloseHistoryView();
    }
    onNavigate('home');
  };

  return (
    <div className="w-full bg-[#f4fafb] min-h-screen text-[#1f2937] font-sans pb-32">
      {/* Brand & Report Top Banner */}
      <div className="bg-white border-b border-[#e5f1f3] px-5 py-4 shadow-3xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/aistudio/222_00d72993.png" 
              alt="Watsons" 
              className="h-7 w-auto object-contain" 
            />
            <span className="text-[11px] font-bold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full">
              {isZh ? '测肤档案' : 'Skin Report'}
            </span>
          </div>

          <span className="text-[11px] text-[#6b7280]">
            {reportDateFormatted}
          </span>
        </div>

        {/* Disclaimer Chip */}
        <div className="mt-2.5 p-2 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center gap-2 text-[10px] text-[#4b5563]">
          <span className="material-symbols-outlined text-xs text-[#0099A7] shrink-0">info</span>
          <span>{isZh ? 'AI 外观表观估算，仅供护肤参考，非临床医学诊断。' : 'AI visual estimation for cosmetic guidance only, not a clinical measurement.'}</span>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4 max-w-[430px] mx-auto">
        {/* --- 1. CONCISE ASSESSMENT SUMMARY & RADAR CARD --- */}
        <section className="bg-white rounded-3xl p-5 border border-[#e5f1f3] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0099A7] text-lg">radar</span>
              <h2 className="font-headline font-bold text-sm text-[#1f2937]">
                {isZh ? '六维肤质表观评估' : 'Six-Dimension Skin Assessment'}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0f9fa] border border-[#d0eff3]">
              <span className="text-[11px] font-bold text-[#6b7280]">
                {isZh ? '综合状态：' : 'Score:'}
              </span>
              <span className="text-xs font-bold text-[#0099A7]">
                {overallScore} <span className="text-[9px] font-normal text-[#9ca3af]">/ 100</span>
              </span>
            </div>
          </div>

          {/* SVG Radar Chart */}
          <div className="flex flex-col items-center pt-1">
            <div className="relative w-[260px] h-[260px]">
              <svg className="w-full h-full" viewBox="0 0 260 260">
                {/* Concentric grid rings */}
                {[0.33, 0.66, 1.0].map((scale, i) => (
                  <circle
                    key={i}
                    cx={radarCenter.x}
                    cy={radarCenter.y}
                    r={radarRadius * scale}
                    fill="none"
                    stroke="#e5f1f3"
                    strokeWidth="1"
                    strokeDasharray={i === 2 ? 'none' : '3 3'}
                  />
                ))}

                {/* 6 Radial axes */}
                {radarAngles.map((angle, i) => {
                  const x2 = radarCenter.x + radarRadius * Math.cos(angle);
                  const y2 = radarCenter.y + radarRadius * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={x2}
                      y2={y2}
                      stroke="#d0eff3"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Watsons teal polygon fill */}
                <polygon
                  points={polygonPoints}
                  fill="rgba(0, 153, 167, 0.22)"
                  stroke="#0099A7"
                  strokeWidth="2"
                />

                {/* Vertices */}
                {polygonPoints.split(' ').map((pt, i) => {
                  const [px, py] = pt.split(',');
                  return (
                    <circle
                      key={i}
                      cx={px}
                      cy={py}
                      r="3"
                      fill="#0099A7"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>

              {/* Labels & Values positioned cleanly around the 6 axes */}
              {/* 1. Top: 健康度 */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '健康度' : 'Health'}
                </span>
                <span className="text-[10px] font-bold text-[#0099A7]">
                  {healthCanAssess && healthScore !== null ? `${healthScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>

              {/* 2. Upper-right: 干油性 */}
              <div className="absolute top-10 right-0 text-right flex flex-col items-end">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '干油性' : 'Balance'}
                </span>
                <span className="text-[10px] font-bold text-[#0099A7]">
                  {oilinessCanAssess && oilinessScore !== null ? `${oilinessScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>

              {/* 3. Lower-right: 年轻度 */}
              <div className="absolute bottom-10 right-0 text-right flex flex-col items-end">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '年轻度' : 'Youth'}
                </span>
                <span className="text-[10px] font-bold text-[#0099A7]">
                  {youthCanAssess && youthScore !== null ? `${youthScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>

              {/* 4. Bottom: 泛红程度 */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '泛红程度' : 'Redness'}
                </span>
                <span className={`text-[10px] font-bold ${rednessCanAssess ? 'text-[#0099A7]' : 'text-gray-400'}`}>
                  {rednessCanAssess && rednessScore !== null ? `${rednessScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>

              {/* 5. Lower-left: 匀净度 */}
              <div className="absolute bottom-10 left-0 text-left flex flex-col items-start">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '匀净度' : 'Evenness'}
                </span>
                <span className="text-[10px] font-bold text-[#0099A7]">
                  {evennessCanAssess && evennessScore !== null ? `${evennessScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>

              {/* 6. Upper-left: 细腻度 */}
              <div className="absolute top-10 left-0 text-left flex flex-col items-start">
                <span className="text-[11px] font-semibold text-[#1f2937]">
                  {isZh ? '细腻度' : 'Refinement'}
                </span>
                <span className="text-[10px] font-bold text-[#0099A7]">
                  {refinementCanAssess && refinementScore !== null ? `${refinementScore}` : (isZh ? '无法判断' : 'N/A')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#f0f9fa] rounded-2xl border border-[#d0eff3] text-xs text-[#4b5563] leading-relaxed">
            <span className="font-bold text-[#0099A7] block mb-0.5">
              {isZh ? '方案概况与调理重点：' : 'Summary Insights:'}
            </span>
            {isZh 
              ? '当前表观水油比例均衡，角质屏障结构较为稳健。建议维持温和清洁与清透保湿节奏，注重日光防护与局部水润维持。'
              : 'Hydration and barrier appear healthy. Maintain gentle cleanse, balanced hydration and daily SPF.'}
          </div>
        </section>

        {/* --- 2. EASY-TO-SCAN FINDINGS CARDS --- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-[#6b7280]">
              {isZh ? '局部表观细致分析' : 'Visual Assessment Findings'}
            </h3>
            <span className="text-[10px] text-[#0099A7] font-semibold">
              {isZh ? '点击卡片展开解析' : 'Tap to expand'}
            </span>
          </div>

          <div className="space-y-2.5">
            {findings.map((card) => {
              const isExpanded = expandedCardId === card.id;

              return (
                <article
                  key={card.id}
                  className="bg-white rounded-2xl border border-[#e5f1f3] shadow-3xs overflow-hidden transition-all hover:border-[#d0eff3]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7] shrink-0">
                        <span className="material-symbols-outlined text-xl">{card.icon}</span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-headline font-bold text-xs text-[#1f2937]">
                            {isZh ? card.titleZh : card.titleEn}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            card.statusColor === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : card.statusColor === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3]'
                          }`}>
                            {isZh ? card.statusBadgeZh : card.statusBadgeEn}
                          </span>
                        </div>

                        <p className="text-xs text-[#4b5563] leading-snug">
                          {isZh ? card.observationZh : card.observationEn}
                        </p>

                        {card.regionZh && (
                          <div className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                            <span className="material-symbols-outlined text-xs text-[#0099A7]">person_pin_circle</span>
                            <span>{isZh ? `分析区域：${card.regionZh}` : `Area: ${card.regionEn}`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-gray-400 text-lg shrink-0 mt-1 transition-transform">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Expandable Explanation */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#f0f9fa] bg-[#fbfdfd] text-xs space-y-2 animate-fade-in">
                      <div className="flex items-center gap-1 text-[#0099A7] font-bold">
                        <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                        <span>{isZh ? '专业建议与依据' : 'Guidance & Rationale'}</span>
                      </div>
                      <p className="text-[#4b5563] leading-relaxed pl-4">
                        {isZh ? card.explanationZh : card.explanationEn}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* --- 3. MATCHED PRODUCT RECOMMENDATION (Preserved Functionality) --- */}
        <section className="bg-white rounded-3xl p-5 border border-[#e5f1f3] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0099A7] text-lg">verified</span>
              <h3 className="font-headline font-bold text-sm text-[#1f2937]">
                {isZh ? '为您匹配的核心对症配方' : 'Curated Formulation'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full">
              {isZh ? '屈臣氏严选' : 'Watsons Pick'}
            </span>
          </div>

          <div className="flex items-center gap-3.5 bg-[#f0f9fa]/60 p-3 rounded-2xl border border-[#e5f1f3]">
            <div 
              onClick={() => onOpenProductDetail && onOpenProductDetail(recommendedProduct)}
              className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#d0eff3] shrink-0 p-1 flex items-center justify-center cursor-pointer"
            >
              <SafeProductImage
                src={recommendedProduct.image}
                alt={recommendedProduct.nameZh}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#0099A7] bg-white border border-[#d0eff3] px-1.5 py-0.2 rounded">
                {recommendedProduct.brand}
              </span>
              <h4 
                onClick={() => onOpenProductDetail && onOpenProductDetail(recommendedProduct)}
                className="font-bold text-xs sm:text-sm text-[#1f2937] truncate mt-0.5 cursor-pointer hover:text-[#0099A7]"
              >
                {isZh ? recommendedProduct.nameZh : recommendedProduct.name}
              </h4>
              <p className="text-xs font-bold text-[#0099A7] mt-0.5">
                ¥{recommendedProduct.price} <span className="text-[10px] font-normal text-[#9ca3af]">{recommendedProduct.size}</span>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#4b5563] leading-relaxed">
            {isZh ? recommendedProduct.whyMatchesZh : recommendedProduct.whyMatches}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleOpenRoutineSheetForProduct(recommendedProduct)}
              className="py-2.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] text-xs font-bold hover:bg-[#e0f5f7] transition-all flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">spa</span>
              <span>{isZh ? '加入护肤流程' : 'Add to Routine'}</span>
            </button>

            <button
              onClick={() => {
                if (onAddToCart) onAddToCart(recommendedProduct);
                if (onShowToast) onShowToast(isZh ? `已将【${recommendedProduct.nameZh}】加入购物车` : 'Added to cart');
              }}
              className="py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">shopping_cart</span>
              <span>{isZh ? '加入购物车' : 'Add to Cart'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* --- 4. FLOATING "完成" BUTTON (Fixed Bottom-Right, 20px margin, safe area inset) --- */}
      <div className="fixed bottom-5 right-5 z-40 pb-safe">
        <button
          onClick={handleDone}
          className="px-6 py-3 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-xl hover:bg-[#007d89] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
          type="button"
        >
          <span className="material-symbols-outlined text-base">check</span>
          <span>{isZh ? '完成' : 'Done'}</span>
        </button>
      </div>

      {/* Routine Selection Sheet for Adding Recommended Product */}
      <RoutineSelectionSheet
        isOpen={isRoutineSheetOpen}
        onClose={() => setIsRoutineSheetOpen(false)}
        onConfirm={handleConfirmAddToRoutine}
        product={selectedRoutineProduct}
        language={language}
      />
    </div>
  );
};
