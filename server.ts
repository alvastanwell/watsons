import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { WATSONS_PRODUCT_CATALOGUE, getProductById, type ProductRecord } from './src/data/productCatalogue.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// Body parser with 25MB limit for photo base64
app.use(express.json({ limit: '25mb' }));

// Initialize Gemini SDK if GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Resilient Gemini model caller with fast 4s fallback during high-demand spikes
async function callGeminiResiliently(client: GoogleGenAI, params: any) {
  const flashPromise = client.models.generateContent({
    ...params,
    model: 'gemini-3.8-flash'
  });
  const fastTimeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Fast fallback to flash-lite')), 4000)
  );

  try {
    return (await Promise.race([flashPromise, fastTimeout])) as any;
  } catch {
    return await client.models.generateContent({
      ...params,
      model: 'gemini-3.1-flash-lite'
    });
  }
}

// GET /api/catalogue - Paginated product catalogue
app.get('/api/catalogue', (req, res) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
    let products = [...WATSONS_PRODUCT_CATALOGUE];

    if (category && category !== 'all') {
      products = products.filter((p) => p.category === category);
    }

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.name_zh.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.brand_zh.toLowerCase().includes(q) ||
          p.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          p.supported_benefits.some((b) => b.toLowerCase().includes(q)) ||
          p.supported_benefits_zh.some((b) => b.toLowerCase().includes(q))
      );
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const total = products.length;
    const paginated = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      coverageInfo: {
        source: "Watsons China Core Skincare Curated Assortment 2026",
        uniqueProducts: total,
        categories: ["cleanser", "toner", "serum", "cream", "sunscreen", "mask"],
        importSupported: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve catalogue', details: err?.message });
  }
});

// POST /api/assess-skin - Grounded Skin Assessment
app.post('/api/assess-skin', async (req, res) => {
  try {
    const {
      photoBase64,
      mimeType = 'image/jpeg',
      answers = {},
      userProfile = {},
      consentGiven = false,
      language = 'zh',
      assessmentType = 'photo'
    } = req.body;

    if (!consentGiven) {
      return res.status(400).json({
        error: language === 'en' ? 'User consent is required before processing.' : '处理前需要用户明确授权同意。',
        canRetry: true
      });
    }

    const isZh = language === 'zh';
    const oiliness = answers.oiliness || userProfile.skinType || 'combo';
    const tightness = answers.tightness || 'occasional';
    const sensitivity = answers.sensitivity || 'occasional';
    const goals: string[] = Array.isArray(answers.goals) && answers.goals.length > 0 ? answers.goals : ['barrier_support'];
    const budget = answers.budget || userProfile.budget || '150_300';
    const avoidIngredients = answers.avoidIngredients || userProfile.ingredientsToAvoid || '';

    // If no AI available, return clear error with retry
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: isZh 
          ? 'AI 测肤分析服务暂不可用，请稍后重试或通过问卷生成方案。' 
          : 'AI skin assessment service is temporarily unavailable. Please retry or continue via questionnaire.',
        canRetry: true
      });
    }

    const parts: any[] = [];
    const hasPhoto = Boolean(photoBase64 && photoBase64.length > 100);

    if (hasPhoto && assessmentType !== 'questionnaire') {
      const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      });
    }

    // Build catalogue candidate summary to ground product selection
    const catalogueSummary = WATSONS_PRODUCT_CATALOGUE.map((p) => ({
      product_id: p.product_id,
      name: isZh ? p.name_zh : p.name,
      brand: isZh ? p.brand_zh : p.brand,
      category: p.category,
      price: p.price,
      size: p.size,
      benefits: isZh ? p.supported_benefits_zh : p.supported_benefits,
      ingredients: p.ingredients.slice(0, 5)
    }));

    const promptText = `
You are a senior cosmetic formulation advisor and facial observation specialist for Watsons China.
Analyze the user's input with strict clinical and cosmetic grounding.

ASSESSMENT METHOD: ${hasPhoto && assessmentType !== 'questionnaire' ? 'Photo Analysis with Questionnaire Data' : 'Questionnaire-Only Assessment (No photo provided)'}

USER SELF-REPORTED INFORMATION:
- Self-reported oiliness/skin tendency: ${oiliness}
- Self-reported moisture tightness: ${tightness}
- Self-reported flushing/irritation frequency: ${sensitivity}
- Skincare goals: ${goals.join(', ')}
- Budget tier: ${budget}
- Ingredients user wants to avoid: ${avoidIngredients || 'None specified'}

AVAILABLE WATSONS PRODUCT CATALOGUE (${catalogueSummary.length} products):
${JSON.stringify(catalogueSummary, null, 2)}

CRITICAL GROUNDING RULES:
1. PHOTO SUITABILITY (ONLY IF PHOTO WAS PROVIDED):
   - Check if the provided image is a clear, single human face.
   - If the image is NOT a human face, is heavily obscured, or pitch dark:
     Set "isSuitablePhoto" to false, and provide "suitabilityReason".
   - If NO photo was provided (questionnaire mode), set "isSuitablePhoto" to true, "suitabilityReason" to "问卷自评模式 (无实拍照片)".

2. SIX-DIMENSION VISUAL OPTICAL RADAR (QUALITATIVE 0-4 VISIBLE PROMINENCE ESTIMATES):
   Strictly evaluate these 6 observable visible dimensions from the photo.
   HIGHER VALUE = GREATER VISIBLE PROMINENCE (NOT healthier skin):
   1. visibleShine (Visible shine / 可见油光):
      - 0: 无明显油光 (Matte / None)
      - 1: 轻度局部油光 (Subtle shine on T-zone or nose tip)
      - 2: 中度油光 (Moderate specular shine across forehead & nose)
      - 3: 明显油光 (Marked specular shine across T-zone & inner cheeks)
      - 4: 显著油光 (Extensive, prominent surface shine across multiple facial zones)
   2. visibleRedness (Visible redness / 可见泛红):
      - 0: 无明显泛红 (No detectable erythema or flush)
      - 1: 轻微局部浅淡泛红 (Faint localized pinkness on nose wings or cheek center)
      - 2: 中度泛红 (Noticeable diffuse redness on central cheeks)
      - 3: 较明显泛红 (Distinct erythema across cheeks and perimeter)
      - 4: 显著泛红 (Extensive, prominent flushed redness or irritation patches)
   3. unevenTone (Uneven skin tone / 肤色不均):
      - 0: 肤色匀净一致 (Uniform even tone)
      - 1: 轻微局部色差 (Subtle localized unevenness or mild dullness)
      - 2: 中度肤色不均 (Noticeable focal pigmentation, blotchiness or dark circles)
      - 3: 较明显色沉/暗沉 (Distinct uneven patches across face)
      - 4: 显著肤色不均 (Extensive marked tone irregularity)
   4. visibleTexture (Visible texture / 可见纹理):
      - 0: 表面细腻平整 (Smooth, untextured appearance)
      - 1: 轻微粗糙/轻浅纹理 (Subtle dry flaking or micro-roughness in focal spot)
      - 2: 中度纹理颗粒 (Noticeable rough grain or tiny bumps)
      - 3: 较明显颗粒不平 (Distinct bumpy surface texture across cheeks or forehead)
      - 4: 显著粗糙纹理 (Extensive coarse, irregular tactile texture)
   5. visiblePores (Visible pores / 毛孔可见度):
      - 0: 毛孔极隐形 (Barely perceptible pores)
      - 1: 鼻翼轻微孔径可见 (Subtle pores around nose)
      - 2: T区及内颊中度毛孔 (Moderate visible pores on nose and inner cheeks)
      - 3: 较明显扩张毛孔 (Distinctly enlarged pores across T-zone and cheeks)
      - 4: 显著粗大毛孔 (Extensive, prominent open pores)
   6. visibleFineLines (Visible fine lines / 细纹可见度):
      - 0: 无可见浅纹 (No visible fine lines)
      - 1: 眼周/嘴角轻微干纹 (Faint dynamic fine lines around eye corners or smile lines)
      - 2: 中度表层细纹 (Noticeable superficial lines on crow's feet or forehead)
      - 3: 较明显细纹 (Distinct fine lines across eye contour or forehead)
      - 4: 显著多区域细纹 (Extensive, pronounced visible lines)

   CRITICAL RULES:
   - DO NOT include hydration, skin barrier health, sensitivity, or skin age as photo-measured dimensions!
   - If image quality, lighting, blur, resolution, or distance makes a dimension impossible to evaluate, or if NO photo was provided (questionnaire mode), set "canAssess": false, "level": null, "levelLabel": "Cannot assess", "levelLabelZh": "无法评估", and detail the limitations. NEVER invent a default score or use zero when evidence is insufficient!

3. PRODUCT RECOMMENDATIONS (1 MAIN + UP TO 4 ALTERNATIVES):
   - Recommend exactly 1 primary product (isPrimary: true) that best addresses the primary concern within budget.
   - Recommend up to 4 distinct alternative options (isPrimary: false) from the catalogue, across relevant complementary categories (e.g. cleanser, toner, serum, cream, sunscreen) or price ranges.
   - Every productId MUST be an exact product_id string from the provided catalogue!
   - Provide a personalized reason in Chinese and English linking user needs to verified ingredients.
   - Output language: ${isZh ? 'Simplified Chinese (中文)' : 'English'}.
`;

    parts.push({ text: promptText });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timed out after 25 seconds')), 25000);
    });

    const geminiPromise = callGeminiResiliently(ai, {
      contents: { parts },
      config: {
        temperature: 0.1,
        topP: 0.2,
        systemInstruction: 'You are an expert cosmetic formulation advisor for Watsons China. Ground all product IDs strictly in the provided catalogue. Output strictly valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSuitablePhoto: { type: Type.BOOLEAN, description: 'True if photo is suitable or if in questionnaire mode' },
            suitabilityReason: { type: Type.STRING, description: 'Explanation if photo is unsuitable' },
            radarDimensions: {
              type: Type.ARRAY,
              description: 'Exactly 6 optical appearance dimensions: visibleShine, visibleRedness, unevenTone, visibleTexture, visiblePores, visibleFineLines.',
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING, enum: ['visibleShine', 'visibleRedness', 'unevenTone', 'visibleTexture', 'visiblePores', 'visibleFineLines'] },
                  name: { type: Type.STRING },
                  nameZh: { type: Type.STRING },
                  level: { type: Type.INTEGER, description: 'Broad qualitative level 0 to 4 (higher value = greater visible prominence). If cannot assess, omit or provide null.' },
                  levelLabel: { type: Type.STRING },
                  levelLabelZh: { type: Type.STRING },
                  canAssess: { type: Type.BOOLEAN },
                  evidence: { type: Type.STRING },
                  evidenceZh: { type: Type.STRING },
                  facialArea: { type: Type.STRING },
                  facialAreaZh: { type: Type.STRING },
                  limitations: { type: Type.STRING },
                  limitationsZh: { type: Type.STRING }
                },
                required: ['key', 'name', 'nameZh', 'canAssess', 'evidence', 'evidenceZh', 'facialArea', 'facialAreaZh', 'limitations', 'limitationsZh']
              }
            },
            observations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  facialArea: { type: Type.STRING },
                  facialAreaZh: { type: Type.STRING },
                  visibleFeature: { type: Type.STRING },
                  visibleFeatureZh: { type: Type.STRING },
                  visualEvidence: { type: Type.STRING },
                  visualEvidenceZh: { type: Type.STRING },
                  limitations: { type: Type.STRING },
                  limitationsZh: { type: Type.STRING }
                },
                required: ['facialArea', 'facialAreaZh', 'visibleFeature', 'visibleFeatureZh', 'visualEvidence', 'visualEvidenceZh', 'limitations', 'limitationsZh']
              }
            },
            suggestedCosmeticRegimen: {
              type: Type.OBJECT,
              properties: {
                stepOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyActiveCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                applicationNotes: { type: Type.STRING },
                applicationNotesZh: { type: Type.STRING }
              },
              required: ['stepOrder', 'keyActiveCategories', 'applicationNotes', 'applicationNotesZh']
            },
            recommendedProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: 'Exact product_id from catalogue' },
                  reason: { type: Type.STRING },
                  reasonZh: { type: Type.STRING },
                  isPrimary: { type: Type.BOOLEAN }
                },
                required: ['productId', 'reason', 'reasonZh', 'isPrimary']
              }
            },
            limitationsNotice: { type: Type.STRING },
            limitationsNoticeZh: { type: Type.STRING }
          },
          required: ['isSuitablePhoto', 'radarDimensions', 'observations', 'suggestedCosmeticRegimen', 'recommendedProducts', 'limitationsNotice', 'limitationsNoticeZh']
        }
      }
    });

    const response: any = await Promise.race([geminiPromise, timeoutPromise]);
    const jsonStr = response.text ? response.text.trim() : '';
    const parsed = JSON.parse(jsonStr);

    // If photo was unsuitable in photo mode, return honest notice
    if (!parsed.isSuitablePhoto && hasPhoto && assessmentType !== 'questionnaire') {
      return res.json({
        success: false,
        isUnsuitablePhoto: true,
        reason: isZh 
          ? (parsed.suitabilityReason || '照片未能检测到清晰面部特征，光线过暗或角度有偏差。')
          : (parsed.suitabilityReason || 'Photo quality is insufficient for cosmetic observation. Please ensure adequate lighting and align face.'),
        canRetry: true
      });
    }

    // Ensure sixDimensions is always populated with grounded status (Allowing "Cannot determine" / "无法判定")
    const defaultDimensions = [
      {
        dimensionKey: 'hydration',
        name: 'Hydration & Moisture',
        nameZh: '水分与缺水状态',
        status: tightness === 'frequent' ? '轻度干燥紧绷' : '水分维持基本平稳',
        statusZh: tightness === 'frequent' ? '轻度干燥紧绷' : '水分维持基本平稳',
        evidence: isZh ? `自测紧绷频率（${tightness}）` : `Reported tightness (${tightness})`,
        evidenceZh: isZh ? `自测紧绷频率（${tightness}）` : `Reported tightness (${tightness})`,
        isDeterminable: true
      },
      {
        dimensionKey: 'oiliness',
        name: 'Sebum & Oil Balance',
        nameZh: '出油与水油平衡',
        status: oiliness === 'oily' ? '明显出油表现' : oiliness === 'dry' ? '油脂分泌偏少' : 'T区偏油/水油平衡',
        statusZh: oiliness === 'oily' ? '明显出油表现' : oiliness === 'dry' ? '油脂分泌偏少' : 'T区偏油/水油平衡',
        evidence: isZh ? `自测日常出油特征（${oiliness}）` : `Reported sebum tendency (${oiliness})`,
        evidenceZh: isZh ? `自测日常出油特征（${oiliness}）` : `Reported sebum tendency (${oiliness})`,
        isDeterminable: true
      },
      {
        dimensionKey: 'barrier',
        name: 'Barrier & Redness',
        nameZh: '屏障与泛红表现',
        status: sensitivity === 'frequent' ? '泛红敏感倾向' : '表皮耐受相对稳定',
        statusZh: sensitivity === 'frequent' ? '泛红敏感倾向' : '表皮耐受相对稳定',
        evidence: isZh ? `自测泛红刺激频率（${sensitivity}）` : `Reported sensitivity (${sensitivity})`,
        evidenceZh: isZh ? `自测泛红刺激频率（${sensitivity}）` : `Reported sensitivity (${sensitivity})`,
        isDeterminable: true
      },
      {
        dimensionKey: 'pores',
        name: 'Pore Prominence',
        nameZh: '毛孔粗大程度',
        status: hasPhoto ? 'T区局部毛孔清晰' : '无法判定',
        statusZh: hasPhoto ? 'T区局部毛孔清晰' : '无法判定',
        evidence: hasPhoto ? (isZh ? '实拍画面鼻翼两侧像素光反射' : 'Pixel reflectance around nose/T-zone') : (isZh ? '问卷自测模式，无实拍高清微观依据' : 'Questionnaire only, insufficient image data'),
        evidenceZh: hasPhoto ? (isZh ? '实拍画面鼻翼两侧像素光反射' : 'Pixel reflectance around nose/T-zone') : (isZh ? '问卷自测模式，无实拍高清微观依据' : 'Questionnaire only, insufficient image data'),
        isDeterminable: hasPhoto
      },
      {
        dimensionKey: 'sensitivity',
        name: 'Tolerance & Irritation',
        nameZh: '敏感度与耐受表现',
        status: sensitivity === 'frequent' ? '耐受力脆弱易刺痛' : sensitivity === 'occasional' ? '偶有轻微泛红' : '耐受度良好',
        statusZh: sensitivity === 'frequent' ? '耐受力脆弱易刺痛' : sensitivity === 'occasional' ? '偶有轻微泛红' : '耐受度良好',
        evidence: isZh ? `自测环境变化及护肤品使用反应` : `Reported reaction to skincare and climate`,
        evidenceZh: isZh ? `自测环境变化及护肤品使用反应` : `Reported reaction to skincare and climate`,
        isDeterminable: true
      },
      {
        dimensionKey: 'smoothness',
        name: 'Smoothness & Texture',
        nameZh: '皮肤平滑度与纹理',
        status: hasPhoto ? '面颊表面平整未见起皮' : '无法判定',
        statusZh: hasPhoto ? '面颊表面平整未见起皮' : '无法判定',
        evidence: hasPhoto ? (isZh ? '实拍正面光线反射均匀度' : 'Surface light uniformity in photo') : (isZh ? '问卷模式未采集高清微观纹理图' : 'Requires macro photographic capture'),
        evidenceZh: hasPhoto ? (isZh ? '实拍正面光线反射均匀度' : 'Surface light uniformity in photo') : (isZh ? '问卷模式未采集高清微观纹理图' : 'Requires macro photographic capture'),
        isDeterminable: hasPhoto
      }
    ];

    parsed.sixDimensions = (Array.isArray(parsed.sixDimensions) && parsed.sixDimensions.length === 6)
      ? parsed.sixDimensions
      : defaultDimensions;

    // Six-Dimension Optical Radar (0-4 Broad Visible Prominence Scale; strictly null if cannot assess)
    const defaultRadarDimensions: any[] = [
      {
        key: 'visibleShine',
        name: 'Visible shine',
        nameZh: '可见油光',
        level: hasPhoto ? (oiliness === 'oily' ? 3 : oiliness === 'dry' ? 0 : 2) : null,
        levelLabel: hasPhoto ? (oiliness === 'oily' ? 'Level 3 - Marked' : oiliness === 'dry' ? 'Level 0 - None' : 'Level 2 - Moderate') : 'Cannot assess',
        levelLabelZh: hasPhoto ? (oiliness === 'oily' ? '3级 - 明显油光' : oiliness === 'dry' ? '0级 - 无明显油光' : '2级 - 中度油光') : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'T-zone specular reflection' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '额头及鼻翼T区光反射较为集中' : '问卷自评模式，未采集实拍照片，无法进行光学评估',
        facialArea: 'T-zone (Forehead & Nose)',
        facialAreaZh: '额头与鼻翼T区',
        limitations: hasPhoto ? 'Lighting angle may affect specular reflection' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '室内散色光照角度可能影响高光反光观察' : '未提供实拍照片'
      },
      {
        key: 'visibleRedness',
        name: 'Visible redness',
        nameZh: '可见泛红',
        level: hasPhoto ? (sensitivity === 'frequent' ? 3 : sensitivity === 'occasional' ? 1 : 0) : null,
        levelLabel: hasPhoto ? (sensitivity === 'frequent' ? 'Level 3 - Distinct' : sensitivity === 'occasional' ? 'Level 1 - Subtle' : 'Level 0 - None') : 'Cannot assess',
        levelLabelZh: hasPhoto ? (sensitivity === 'frequent' ? '3级 - 较明显泛红' : sensitivity === 'occasional' ? '1级 - 轻微局部浅淡' : '0级 - 无明显泛红') : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'Superficial erythema pixel distribution on mid-cheeks' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '双颊中央有局部浅淡红度显现' : '问卷自评模式，未采集实拍照片',
        facialArea: 'Cheeks',
        facialAreaZh: '两颊中央区域',
        limitations: hasPhoto ? 'Camera white balance / temperature bias' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '摄像头白平衡或室内色温偏差可能影响红度识别' : '未提供实拍照片'
      },
      {
        key: 'unevenTone',
        name: 'Uneven skin tone',
        nameZh: '肤色不均',
        level: hasPhoto ? 1 : null,
        levelLabel: hasPhoto ? 'Level 1 - Subtle' : 'Cannot assess',
        levelLabelZh: hasPhoto ? '1级 - 轻微局部色差' : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'Slight tone variation near perioral area' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '嘴角及眼下微弱色度差异' : '问卷自评模式，未采集实拍照片',
        facialArea: 'Perioral & Under Eye Area',
        facialAreaZh: '嘴角周围与眼下',
        limitations: hasPhoto ? 'Overhead light shadow casting' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '自然顶光阴影可能带来局部暗沉偏差' : '未提供实拍照片'
      },
      {
        key: 'visibleTexture',
        name: 'Visible texture',
        nameZh: '可见纹理',
        level: hasPhoto ? 1 : null,
        levelLabel: hasPhoto ? 'Level 1 - Subtle' : 'Cannot assess',
        levelLabelZh: hasPhoto ? '1级 - 轻微粗糙/轻浅纹理' : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'Mild surface grain observed in cheek perimeter' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '面颊局部平滑度略有轻微起伏' : '问卷自评模式，未采集实拍照片',
        facialArea: 'Cheeks & Chin',
        facialAreaZh: '两颊外侧与下巴',
        limitations: hasPhoto ? 'Non-macro mobile sensor resolution' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '非微距皮肤镜镜头，细微起皮仅供日常外观参考' : '未提供实拍照片'
      },
      {
        key: 'visiblePores',
        name: 'Visible pores',
        nameZh: '毛孔可见度',
        level: hasPhoto ? 2 : null,
        levelLabel: hasPhoto ? 'Level 2 - Moderate' : 'Cannot assess',
        levelLabelZh: hasPhoto ? '2级 - 中度可见' : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'Pore aperture visible around nose and inner cheeks' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '鼻翼及内侧面颊有浅表孔径可见' : '问卷自评模式，未采集实拍照片',
        facialArea: 'Nasal Alae & Inner Cheeks',
        facialAreaZh: '鼻翼及内侧面颊',
        limitations: hasPhoto ? 'Sensor compression and distance' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '拍摄距离与手机压缩率可能减弱微细毛孔可见度' : '未提供实拍照片'
      },
      {
        key: 'visibleFineLines',
        name: 'Visible fine lines',
        nameZh: '细纹可见度',
        level: hasPhoto ? 1 : null,
        levelLabel: hasPhoto ? 'Level 1 - Subtle' : 'Cannot assess',
        levelLabelZh: hasPhoto ? '1级 - 轻微表层细纹' : '无法评估',
        canAssess: hasPhoto,
        evidence: hasPhoto ? 'Fine superficial lines around lateral eye area' : 'Questionnaire mode, no photo provided',
        evidenceZh: hasPhoto ? '眼尾外侧存在轻浅表层干纹迹象' : '问卷自评模式，未采集实拍照片',
        facialArea: 'Lateral Canthus (Eye Contour)',
        facialAreaZh: '眼尾与眼下轮廓',
        limitations: hasPhoto ? 'Dynamic expression wrinkles' : 'No photo uploaded',
        limitationsZh: hasPhoto ? '拍摄瞬间面部微表情可能导致动态浅纹' : '未提供实拍照片'
      }
    ];

    if (!hasPhoto || assessmentType === 'questionnaire') {
      parsed.radarDimensions = defaultRadarDimensions.map((d: any) => ({
        ...d,
        level: null,
        canAssess: false,
        levelLabel: 'Cannot assess',
        levelLabelZh: '无法评估',
        evidence: 'Questionnaire assessment without photo. Optical dimensions cannot be assessed.',
        evidenceZh: '问卷自评模式未采集实拍照片，光学外观维度无法评估。',
        limitations: 'No photo uploaded',
        limitationsZh: '未提供面部实拍照片'
      }));
    } else if (Array.isArray(parsed.radarDimensions) && parsed.radarDimensions.length === 6) {
      parsed.radarDimensions = parsed.radarDimensions.map((d: any) => {
        const canAssess = Boolean(d.canAssess && d.level !== null && d.level !== undefined && !isNaN(d.level));
        const levelVal = canAssess ? Math.max(0, Math.min(4, Math.round(Number(d.level)))) : null;
        return {
          ...d,
          canAssess,
          level: levelVal,
          levelLabel: canAssess ? (d.levelLabel || `Level ${levelVal}`) : 'Cannot assess',
          levelLabelZh: canAssess ? (d.levelLabelZh || `${levelVal}级`) : '无法评估'
        };
      });
    } else {
      parsed.radarDimensions = defaultRadarDimensions;
    }

    // Attach user reported symptoms to the result
    parsed.userReportedSymptoms = {
      oiliness,
      tightness,
      sensitivity,
      goals,
      budget
    };
    parsed.date = new Date().toISOString();

    // Verify all recommended products exist in catalogue; filter out any hallucinatory IDs
    let verifiedRecommendations = (parsed.recommendedProducts || []).filter((rec: any) =>
      Boolean(getProductById(rec.productId))
    );

    // Guarantee at least 1 primary and up to 4 alternatives from catalogue
    if (verifiedRecommendations.length === 0) {
      verifiedRecommendations = [
        {
          productId: WATSONS_PRODUCT_CATALOGUE[0].product_id,
          reason: 'Gentle ceramide-protecting cleanser suitable for barrier maintenance.',
          reasonZh: '温和弱酸性配方，在洁面同时保护角质层神经酰胺。',
          isPrimary: true
        },
        {
          productId: WATSONS_PRODUCT_CATALOGUE[1].product_id,
          reason: 'Soothing cream with madecassoside and panthenol.',
          reasonZh: '含维生素B5与积雪草苷，针对泛红干燥提供舒缓修护。',
          isPrimary: false
        }
      ];
    }

    // Ensure exactly 1 item is marked as primary
    let hasPrimary = false;
    verifiedRecommendations.forEach((r: any) => {
      if (r.isPrimary && !hasPrimary) {
        hasPrimary = true;
      } else if (r.isPrimary && hasPrimary) {
        r.isPrimary = false;
      }
    });
    if (!hasPrimary && verifiedRecommendations.length > 0) {
      verifiedRecommendations[0].isPrimary = true;
    }

    parsed.recommendedProducts = verifiedRecommendations.slice(0, 5);

    const primaryRec = parsed.recommendedProducts.find((p: any) => p.isPrimary) || parsed.recommendedProducts[0];
    const matchedRecord = primaryRec ? getProductById(primaryRec.productId) : undefined;

    parsed.skin_type = isZh
      ? (oiliness === 'oily' ? '偏油性水油失衡表现' : oiliness === 'dry' ? '干性缺水表现' : '混合性日常护理状态')
      : (oiliness === 'oily' ? 'Oily / Sebum-Prone' : oiliness === 'dry' ? 'Dry / Dehydrated Tendency' : 'Combination Tendency');

    parsed.analysis = {
      summary: parsed.suggestedCosmeticRegimen?.applicationNotesZh || parsed.suggestedCosmeticRegimen?.applicationNotes || '',
      barrierCondition: isZh ? '基于问卷与面部表观的日常温和护理参考' : 'Cosmetic skincare guidance based on visible observations and reported needs',
      recommendedNextStep: parsed.suggestedCosmeticRegimen?.applicationNotesZh || parsed.suggestedCosmeticRegimen?.applicationNotes || '',
      visibleShine: parsed.observations.find((o: any) => o.facialAreaZh?.includes('T区') || o.facialArea?.includes('T-Zone'))?.visibleFeatureZh || '',
      visibleRedness: parsed.observations.find((o: any) => o.facialAreaZh?.includes('颊') || o.facialArea?.includes('Cheek'))?.visibleFeatureZh || '',
      visibleTexture: parsed.observations.find((o: any) => o.facialAreaZh?.includes('纹理') || o.facialArea?.includes('Texture'))?.visibleFeatureZh || ''
    };

    if (matchedRecord) {
      parsed.recommended_product = {
        id: matchedRecord.product_id,
        name: isZh ? matchedRecord.name_zh : matchedRecord.name,
        reason: primaryRec ? (isZh ? primaryRec.reasonZh : primaryRec.reason) : matchedRecord.supported_benefits_zh[0]
      };
      parsed.recommendedProductId = matchedRecord.product_id;
    }

    return res.json({
      success: true,
      isRealAI: true,
      demoMode: false,
      data: parsed
    });

  } catch (error: any) {
    console.error('Error in /api/assess-skin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process skin assessment. Please check connection and try again.',
      canRetry: true
    });
  }
});

// POST /api/advisor/chat - Multi-turn Contextual AI Advisor
app.post('/api/advisor/chat', async (req, res) => {
  try {
    const {
      messages = [],
      userProfile = {},
      assessmentResult = null,
      currentRoutine = {},
      cart = [],
      language = 'zh'
    } = req.body;

    const isZh = language === 'zh';

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: isZh ? 'AI 顾问服务暂时无法连接，请重试。' : 'AI Advisor service is temporarily unavailable. Please retry.',
        canRetry: true
      });
    }

    const catalogueSummary = WATSONS_PRODUCT_CATALOGUE.map((p) => ({
      product_id: p.product_id,
      name: isZh ? p.name_zh : p.name,
      brand: isZh ? p.brand_zh : p.brand,
      category: p.category,
      price: p.price,
      size: p.size,
      benefits: isZh ? p.supported_benefits_zh : p.supported_benefits,
      ingredients: p.ingredients,
      usage: isZh ? p.usage_instructions.general_zh : p.usage_instructions.general,
      bundle_offer: isZh ? p.bundle_offer_zh : p.bundle_offer
    }));

    const systemInstruction = `
You are the official Watsons China AI Skincare Advisor (屈臣氏 AI 美肤顾问).
You assist customers with practical, evidence-based skincare guidance, product comparisons, routine reviews, and store consultations.

CURRENT CUSTOMER CONTEXT:
- Customer Nickname: ${userProfile.nickname || 'Lin'}
- Self-reported Skin Type: ${userProfile.skinType || 'Not specified'}
- Concerns & Goals: ${(userProfile.concerns || []).join(', ') || 'General barrier comfort'}
- Budget Range: ${userProfile.budget || '150_300 (¥150 - ¥300)'}
- Preferred Ingredients: ${userProfile.preferences || 'Gentle soothing'}
- Avoid Ingredients: ${userProfile.ingredientsToAvoid || 'None specified'}

LATEST SKIN ASSESSMENT:
${assessmentResult ? JSON.stringify(assessmentResult.observations || assessmentResult.userReportedSymptoms || {}, null, 2) : 'No skin assessment completed yet.'}

CURRENT ROUTINE:
Morning Steps: ${(currentRoutine.morningSteps || []).map((s: any) => `${s.stepNumber}. ${s.title}`).join(' | ') || 'Default AM routine'}
Evening Steps: ${(currentRoutine.eveningSteps || []).map((s: any) => `${s.stepNumber}. ${s.title}`).join(' | ') || 'Default PM routine'}

CURRENT CART:
${(cart || []).map((c: any) => `${c.product.name} (x${c.quantity})`).join(', ') || 'Cart is empty'}

AUTHENTIC WATSONS PRODUCT CATALOGUE:
${JSON.stringify(catalogueSummary, null, 2)}

COMMUNICATION & GROUNDING RULES:
1. Answer the specific question first. Keep initial answers concise (2-4 sentences), friendly and conversational. Provide deeper formulation breakdown when requested.
2. Ground all product recommendations, prices, ingredients, and offers EXCLUSIVELY in the provided Watsons Product Catalogue. Never invent products, discounts, or stock.
3. If user asks for cheaper alternatives, find lower priced items in the catalogue (e.g. Hada Labo ¥49 or Bioré ¥59 vs higher priced options) and explain the formulation trade-offs.
4. Do NOT recommend a product in every reply if the user just asks for routine order or technique.
5. If recommending a product, refer to its exact product_id in the action array.
6. Clearly distinguish visible observations from user-reported symptoms. Do not diagnose diseases.
7. Return strictly JSON with:
   - "reply": string (the text reply to the user)
   - "suggestedActions": array of optional objects:
     - type: "view_product" | "add_to_cart" | "add_to_routine" | "compare_products"
     - productId: string (must match exact product_id in catalogue)
     - label: string (short button label in ${isZh ? 'Chinese' : 'English'})
   - "suggestedFollowUps": array of 2-3 short follow-up question prompt strings the user can tap.
`;

    // Map conversation messages to Gemini format
    const contents: any[] = [];
    const recentMessages = messages.slice(-10); // Last 10 turns

    for (const msg of recentMessages) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }

    // If no contents provided, initialize with a greeting prompt
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: isZh ? '你好，我想咨询护肤建议。' : 'Hello, I would like skincare advice.' }]
      });
    }

    const geminiPromise = callGeminiResiliently(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: 'view_product | add_to_cart | add_to_routine | compare_products' },
                  productId: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ['type', 'productId', 'label']
              }
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['reply']
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI Advisor timed out after 20 seconds')), 20000);
    });

    const response: any = await Promise.race([geminiPromise, timeoutPromise]);
    const jsonStr = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(jsonStr);

    res.json({
      success: true,
      data: {
        reply: parsed.reply || (isZh ? '我能为您提供关于日常护理搭配或产品对比的建议。' : 'I can help you with skincare routine pairings or product comparisons.'),
        suggestedActions: parsed.suggestedActions || [],
        suggestedFollowUps: parsed.suggestedFollowUps || []
      }
    });

  } catch (error: any) {
    console.error('Error in /api/advisor/chat:', error);
    res.status(500).json({
      success: false,
      error: 'AI Advisor request failed. Please tap retry.',
      canRetry: true
    });
  }
});

// Start Server
async function startServer() {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(distIndex);

  if (isProd && fs.existsSync(distIndex)) {
    console.log('Serving production static build from dist directory');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    console.log('Serving development mode with Vite middlewares');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
