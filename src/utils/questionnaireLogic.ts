import { 
  SkinProfileQuestionnaireAnswers, 
  QuestionnaireDraft, 
  QuestionnaireHistoryRecord, 
  SkinAssessmentResult,
  UserProfile 
} from '../types';
import { WATSONS_PRODUCT_CATALOGUE, ProductRecord } from '../data/productCatalogue';

export const QUESTIONNAIRE_DRAFT_KEY = 'watsons_questionnaire_draft';
export const QUESTIONNAIRE_HISTORY_KEY = 'watsons_questionnaire_history';

export const createEmptyQuestionnaireAnswers = (): SkinProfileQuestionnaireAnswers => ({
  cleansingSensation: '',
  daytimeOiliness: '',
  drynessFrequency: '',
  productReactions: [],
  environmentalTriggers: [],
  concerns: [],
  customConcernText: '',
  routineCategories: [],
  sunscreenFrequency: '',
  outdoorExposure: '',
  primaryGoal: '',
  texturePreference: '',
  avoidIngredientsInput: '',
  specialNotes: ''
});

// Helper to determine derived skin profile summary
export interface DerivedProfileSummary {
  skinTypeZh: string;
  skinTypeEn: string;
  skinTypeKey: 'normal' | 'dry' | 'oily' | 'combination' | 'not_sure';
  toleranceZh: string;
  toleranceLevel: 'high' | 'moderate' | 'low' | 'unknown';
  concernsZh: string[];
  goalZh: string;
  primaryGoal: string;
  textureZh: string;
  summaryTextZh: string;
}

export function deriveSkinProfileFromAnswers(answers: SkinProfileQuestionnaireAnswers): DerivedProfileSummary {
  // 1. Determine Skin Type
  let skinTypeZh = '待确认肤质（需结合环境观察）';
  let skinTypeEn = 'Undetermined / Normal';
  let skinTypeKey: 'normal' | 'dry' | 'oily' | 'combination' | 'not_sure' = 'not_sure';

  if (answers.daytimeOiliness === 'whole_face' || (answers.cleansingSensation === 'greasy' && answers.drynessFrequency !== 'frequent')) {
    skinTypeZh = '油性肤质（全脸皮脂分泌旺盛）';
    skinTypeEn = 'Oily Skin';
    skinTypeKey = 'oily';
  } else if (answers.daytimeOiliness === 't_zone_only') {
    skinTypeZh = '混合性肤质（T区偏油、颊部平稳或微干）';
    skinTypeEn = 'Combination Skin (Oily T-Zone)';
    skinTypeKey = 'combination';
  } else if (answers.cleansingSensation === 'tight' || answers.drynessFrequency === 'frequent') {
    skinTypeZh = '偏干性肤质（角质屏障易失水紧绷）';
    skinTypeEn = 'Dry Skin';
    skinTypeKey = 'dry';
  } else if (answers.cleansingSensation === 'comfortable' && answers.daytimeOiliness === 'rarely_oily' && answers.drynessFrequency === 'rare') {
    skinTypeZh = '中性健康肤质（水油分泌较为平衡）';
    skinTypeEn = 'Normal / Balanced Skin';
    skinTypeKey = 'normal';
  }

  // 2. Determine Tolerance
  const hasStinging = answers.productReactions.includes('stinging');
  const hasRedness = answers.productReactions.includes('redness');
  const hasTriggers = answers.environmentalTriggers.length > 0 && !answers.environmentalTriggers.includes('none');

  let toleranceZh = '屏障耐受良好';
  let toleranceLevel: 'high' | 'moderate' | 'low' | 'unknown' = 'high';

  if ((hasStinging || hasRedness) && hasTriggers) {
    toleranceZh = '耐受度偏低 / 屏障易敏';
    toleranceLevel = 'low';
  } else if (hasStinging || hasRedness || hasTriggers) {
    toleranceZh = '偶发敏感 / 中度耐受';
    toleranceLevel = 'moderate';
  } else if (answers.productReactions.includes('unsure') || answers.productReactions.length === 0) {
    toleranceZh = '耐受表现暂未明确';
    toleranceLevel = 'unknown';
  }

  // 3. Concerns mapping
  const concernLabelsZh: Record<string, string> = {
    breakouts: '粉刺与痘痘困扰',
    uneven_tone: '暗沉与肤色不均',
    rough_texture: '角质粗糙/颗粒感',
    enlarged_pores: '局部毛孔显见',
    under_eye: '眼周暗沉与细纹',
    redness: '换季泛红脆弱'
  };

  const concernsZh = answers.concerns.map(c => concernLabelsZh[c] || c);
  if (answers.customConcernText.trim()) {
    concernsZh.push(answers.customConcernText.trim());
  }
  if (concernsZh.length === 0) {
    concernsZh.push('日常基础保湿维稳');
  }

  // 4. Goal mapping
  const goalLabelsZh: Record<string, string> = {
    barrier_repair: '强化屏障与舒缓修护',
    oil_control: '控油清爽与清透毛孔',
    brightening: '改善暗沉与提亮肤色',
    deep_hydration: '深层补水与锁水柔润',
    anti_aging: '紧致淡纹与抗初老',
    unsure: '日常基础护理'
  };
  const goalZh = goalLabelsZh[answers.primaryGoal] || '日常科学护肤';

  // 5. Texture mapping
  const textureLabelsZh: Record<string, string> = {
    light_gel: '清爽凝胶/水感凝露',
    silky_lotion: '丝滑轻薄水乳',
    rich_cream: '润泽丰盈滋养霜',
    no_preference: '以功效适成为主'
  };
  const textureZh = textureLabelsZh[answers.texturePreference] || '不限质地';

  const summaryTextZh = `自评归纳为${skinTypeZh}，${toleranceZh}。核心护理诉求围绕${concernsZh.slice(0, 3).join('、')}，期望${goalZh}。`;

  return {
    skinTypeZh,
    skinTypeEn,
    skinTypeKey,
    toleranceZh,
    toleranceLevel,
    concernsZh,
    goalZh,
    primaryGoal: answers.primaryGoal || 'unsure',
    textureZh,
    summaryTextZh
  };
}

// Select recommended products from authentic Watsons catalogue matching questionnaire answers
export function pickQuestionnaireRecommendations(
  summary: DerivedProfileSummary,
  avoidIngredientsInput: string
): Array<{ productId: string; reason: string; reasonZh: string; isPrimary: boolean }> {
  const avoidList = avoidIngredientsInput
    .toLowerCase()
    .split(/[,，、\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const filterAvoid = (prod: ProductRecord) => {
    if (avoidList.length === 0) return true;
    const text = (prod.ingredients.join(' ') + ' ' + prod.name + ' ' + prod.name_zh).toLowerCase();
    for (const avoid of avoidList) {
      if (text.includes(avoid)) return false;
    }
    return true;
  };

  const available = WATSONS_PRODUCT_CATALOGUE.filter(filterAvoid);
  const pool = available.length >= 2 ? available : WATSONS_PRODUCT_CATALOGUE;

  const recs: Array<{ productId: string; reason: string; reasonZh: string; isPrimary: boolean }> = [];

  // Match primary product
  if (summary.toleranceLevel === 'low' || summary.primaryGoal === 'barrier_repair') {
    // Curél Cream or La Roche-Posay B5
    const curel = pool.find(p => p.product_id === 'curel_cream') || pool[0];
    recs.push({
      productId: curel.product_id,
      isPrimary: true,
      reason: "Rich in pseudo-ceramide to replenish skin lipids and calm reported stinging or barrier sensitivity.",
      reasonZh: "针对您问卷反馈的屏障易敏与紧绷感，蕴含神经酰胺功能成分，深层修护屏障脂质，温和无香精。"
    });
  } else if (summary.skinTypeKey === 'oily' || summary.primaryGoal === 'oil_control' || summary.concernsZh.some(c => c.includes('痘痘') || c.includes('控油'))) {
    // La Roche-Posay Duo or Winona Anti-Acne
    const duo = pool.find(p => p.product_id === 'laroche_duo') || pool.find(p => p.category === 'serum') || pool[0];
    recs.push({
      productId: duo.product_id,
      isPrimary: true,
      reason: "Formulated with targeted actives to balance excess oil and clear congested pores.",
      reasonZh: "针对您问卷反馈的油光与痘痘闭口困扰，定向疏通毛孔堆积皮脂，调理水油平衡。"
    });
  } else if (summary.primaryGoal === 'brightening' || summary.concernsZh.some(c => c.includes('暗沉') || c.includes('肤色不均'))) {
    // Proya Dual Anti-Oxidant or Olay
    const proya = pool.find(p => p.product_id === 'proya_antiox_serum') || pool.find(p => p.category === 'serum') || pool[0];
    recs.push({
      productId: proya.product_id,
      isPrimary: true,
      reason: "Antioxidant complex designed to improve reported dullness and restore radiant glow.",
      reasonZh: "结合自评暗沉与肤色不均诉求，多重抗氧协同，改善熬夜氧化暗黄，焕亮肤色。"
    });
  } else {
    // Default gentle hydration
    const bio = pool.find(p => p.product_id === 'biohyalux_ha_ampoule') || pool.find(p => p.category === 'serum') || pool[0];
    recs.push({
      productId: bio.product_id,
      isPrimary: true,
      reason: "Micro-molecular hyaluronic acid delivering non-comedogenic deep hydration.",
      reasonZh: "自评补水首选，微分子玻尿酸深层润泽干燥角质层，轻盈水感好吸收。"
    });
  }

  // Supporting items (cleanser, sunscreen or soothing toner)
  const cleanser = pool.find(p => p.category === 'cleanser' && !recs.some(r => r.productId === p.product_id));
  if (cleanser) {
    recs.push({
      productId: cleanser.product_id,
      isPrimary: false,
      reason: "Gentle weakly acidic cleansing that does not strip skin lipids.",
      reasonZh: "弱酸性氨基酸/神经酰胺保护性洁面，洗后水润不紧绷，保护自评屏障。"
    });
  }

  const sunscreen = pool.find(p => p.category === 'sunscreen' && !recs.some(r => r.productId === p.product_id));
  if (sunscreen) {
    recs.push({
      productId: sunscreen.product_id,
      isPrimary: false,
      reason: "Daily broad-spectrum UV protection to prevent barrier damage and dark spots.",
      reasonZh: "日常广谱高倍防晒，防护紫外光损伤，守护稳定肤况。"
    });
  }

  const soothing = pool.find(p => (p.category === 'toner' || p.category === 'cream') && !recs.some(r => r.productId === p.product_id));
  if (soothing) {
    recs.push({
      productId: soothing.product_id,
      isPrimary: false,
      reason: "Soothing care to balance and calm facial comfort.",
      reasonZh: "温和修护搭配，补充角质水分，舒缓外界刺激带来的不适。"
    });
  }

  return recs;
}

// Synthesize or update a skin assessment report
export function synthesizeQuestionnaireReport(
  answers: SkinProfileQuestionnaireAnswers,
  existingAssessment: SkinAssessmentResult | null,
  userProfile?: UserProfile
): SkinAssessmentResult {
  const summary = deriveSkinProfileFromAnswers(answers);
  const nowIso = new Date().toISOString();
  const avoidInput = answers.avoidIngredientsInput || (userProfile?.ingredientsToAvoid || '');
  const recs = pickQuestionnaireRecommendations(summary, avoidInput);

  // If there was an existing assessment that came from a real photo (contains observations or optical radar):
  if (existingAssessment && existingAssessment.radarDimensions && existingAssessment.radarDimensions.length > 0) {
    return {
      ...existingAssessment,
      date: nowIso,
      skin_type: `${existingAssessment.skin_type || '实拍表观'} + 自评【${summary.skinTypeZh}】`,
      userReportedSymptoms: {
        oiliness: answers.daytimeOiliness === 'whole_face' ? '全脸偏油' : answers.daytimeOiliness === 't_zone_only' ? 'T区偏油' : '出油少',
        tightness: answers.cleansingSensation === 'tight' ? '洗后紧绷' : '洗后舒适',
        sensitivity: summary.toleranceZh,
        goals: summary.concernsZh,
        budget: userProfile?.budget || '150_300'
      },
      analysis: {
        ...existingAssessment.analysis,
        summary: `【实拍光学表观 + 深度自评问卷综合】面部表观分析与您自评的【${summary.skinTypeZh}】及【${summary.toleranceZh}】高度契合。建议针对${summary.concernsZh.slice(0, 2).join('、')}展开温和修护与维稳管理。`,
        barrierCondition: summary.toleranceZh,
        recommendedNextStep: `遵循${summary.textureZh}搭配：温和洁面 -> ${summary.goalZh}针对精华 -> 屏障锁水霜 -> 日常防晒。`
      },
      suggestedCosmeticRegimen: {
        stepOrder: ['温和微泡洁面', '舒缓调理水', '自评针对精华', '修护润泽乳/霜', '清透倍护防晒'],
        keyActiveCategories: summary.toleranceLevel === 'low' 
          ? ['神经酰胺', '积雪草苷', '维生素原B5'] 
          : ['水杨酸/果酸衍生物', '烟酰胺', '微分子玻尿酸'],
        applicationNotes: `Based on your questionnaire, priority is given to ${summary.goalZh} with ${summary.textureZh} texture.`,
        applicationNotesZh: `问卷显示您偏好【${summary.textureZh}】，优先关注【${summary.goalZh}】。请避免揉搓泛红区域，晨间务必落实防晒。`
      },
      recommendedProducts: recs,
      limitationsNotice: "AI facial appearance estimate combined with self-reported questionnaire; for daily cosmetic reference only, not a medical diagnosis.",
      limitationsNoticeZh: "AI外观估计与自评问卷联合方案，仅供日常护肤参考，非仪器测量或医疗诊断。"
    };
  }

  // Pure questionnaire-based report (No fake photo radar! Strictly distinguishes as questionnaire-based)
  return {
    isSuitablePhoto: false,
    suitabilityReason: "基于用户自主护肤自评问卷生成，无面部实拍照片",
    observations: [],
    radarDimensions: undefined, // Explicitly no fake radar polygon
    userReportedSymptoms: {
      oiliness: answers.daytimeOiliness === 'whole_face' ? '全脸偏油' : answers.daytimeOiliness === 't_zone_only' ? 'T区偏油' : '出油较少',
      tightness: answers.cleansingSensation === 'tight' ? '洁面后紧绷干燥' : '洁面后温润舒适',
      sensitivity: summary.toleranceZh,
      goals: summary.concernsZh,
      budget: userProfile?.budget || '150_300'
    },
    suggestedCosmeticRegimen: {
      stepOrder: ['弱酸温和洁面', '平衡舒缓水', '针对修护精华', '保湿锁水乳霜', '清透广谱防晒'],
      keyActiveCategories: summary.toleranceLevel === 'low'
        ? ['神经酰胺', '红没药醇', '泛醇B5']
        : ['烟酰胺', '抗氧化胜肽', '透明质酸钠'],
      applicationNotes: `Personalized regimen based on your self-reported responses for ${summary.skinTypeEn}.`,
      applicationNotesZh: `根据您的深度自评反馈，为您量身定制【${summary.skinTypeZh}】日常护肤方案。优先推荐${summary.textureZh}护肤品，温和无负担。`
    },
    recommendedProducts: recs,
    limitationsNotice: "Self-reported cosmetic questionnaire summary; for daily skincare reference only, not a clinical diagnosis.",
    limitationsNoticeZh: "本报告完全依据用户自主填写的问卷反馈生成，仅供日常护肤参考，非仪器测量或医疗诊断。",
    date: nowIso,
    skin_type: `自评【${summary.skinTypeZh}】`,
    barrierCondition: summary.toleranceZh,
    recommendedNextStep: `先修护再改善：落实每日精简四步护理，配合【${summary.textureZh}】质地产品。`,
    analysis: {
      summary: summary.summaryTextZh,
      barrierCondition: summary.toleranceZh,
      recommendedNextStep: `建议日常护肤以【${summary.goalZh}】为主线，优选屈臣氏正品库中通过严选测试的低敏配方。`
    }
  };
}
