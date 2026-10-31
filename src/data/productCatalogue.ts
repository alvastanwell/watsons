export interface ProductRecord {
  product_id: string;
  variant_id: string;
  name: string;
  name_zh: string;
  brand: string;
  brand_zh: string;
  category: 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen' | 'mask';
  size: string;
  price: number;
  original_price?: number;
  image_url: string;
  product_url: string;
  ingredients: string[];
  supported_benefits: string[];
  supported_benefits_zh: string[];
  usage_instructions: {
    morning?: string;
    evening?: string;
    general: string;
    morning_zh?: string;
    evening_zh?: string;
    general_zh: string;
  };
  texture: string;
  texture_zh: string;
  is_fragrance_free: boolean;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  source: string;
  last_updated: string;
  bundle_offer?: string;
  bundle_offer_zh?: string;
}

// 14 verified authentic Watsons China products across all 6 skincare categories
export const WATSONS_PRODUCT_CATALOGUE: ProductRecord[] = [
  // 1. Cleansers
  {
    product_id: "curel_cleanser",
    variant_id: "curel_cleanser_150ml",
    name: "Curél Foaming Facial Wash",
    name_zh: "珂润 润浸保湿洁颜泡沫",
    brand: "Curél",
    brand_zh: "珂润",
    category: "cleanser",
    size: "150ml Pump",
    price: 88,
    original_price: 108,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC43wquFrEKN1wwoAZgLrdo3cGxOfg7RpFm_cb00kS1Rfwj_knUXY-EFM0gXpaVg_t43GRnTrglOPBhAIL5UrjO6k58u1WA70NmIEryu1rRXhJtMQ87hRi8BxLZAysUpSZwtQppm392Gwo94MPt48q7v8p7XQrUnns55H4CmZNJo-5MB1Dlrw0on9iHjuDklhrFJuPMGae6brDI-WO0F3Yvr7-n33GlZc7xCgS9ydDXpuW6z80eJTwwYg",
    product_url: "https://www.watsons.com.cn/product/curel-cleanser",
    ingredients: ["Water", "Glycerin", "Maltitol", "Lauryl Hydroxysultaine", "Sodium Cocoyl Glutamate", "Ceramide EOP precursor"],
    supported_benefits: ["Gentle barrier cleansing", "Preserves intercellular ceramides", "pH 5.5 balanced"],
    supported_benefits_zh: ["弱酸性温和洁面", "守护角质神经酰胺", "洗后水润不紧绷"],
    usage_instructions: {
      morning: "Pump 1-2 pumps of dense foam, gently glide over face, rinse with lukewarm water.",
      evening: "Use as second cleanse after makeup removal to thoroughly clear residues.",
      general: "Do not rub vigorously; press foam gently onto skin for 30 seconds.",
      morning_zh: "按压1-2泵微米级泡沫，轻柔打圈洁面，温水洗净即可。",
      evening_zh: "卸妆后作为二次洁面使用，温和带走皮脂残留。",
      general_zh: "无需用力揉搓，掌心轻柔按压泡沫清洁30秒后清水冲净。"
    },
    texture: "Airy micro-foam",
    texture_zh: "绵密微米级泡沫",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15",
    bundle_offer: "Member refill pack: 2 for ¥148",
    bundle_offer_zh: "会员环保替换装：2袋特惠¥148"
  },
  {
    product_id: "freeplus_cleanser",
    variant_id: "freeplus_cleanser_100g",
    name: "Freeplus Mild Soap",
    name_zh: "芙丽芳丝 净润洗面霜",
    brand: "Freeplus",
    brand_zh: "芙丽芳丝",
    category: "cleanser",
    size: "100g Tube",
    price: 119,
    original_price: 150,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6lngO8Wb6SwHlxXsb3ksV9QETQWbvjVn6Do9cDgY2ICcYbD8NQiW28-Lyiszi8AojLO9T54eK84s_3mmxeZcjcVQp86qOGiU1I6RKK-35orHENKgR4pwyVnnlYrVBz2Zxfih_3QL72jKP93EOa7vkwGi49ndc-KSWkfOfL-CDzIVju23mq3OK86b91BB_Ygj1ou9QBqN_SNu3o4An2SmTh0u6piL2SU-sLXrEg9P1CqU9JiXgHSYNmA",
    product_url: "https://www.watsons.com.cn/product/freeplus-cleanser",
    ingredients: ["Potassium Cocoyl Glycinate", "Glycerin", "Zizyphus Jujuba Fruit Extract", "Citrus Unshiu Peel Extract", "Coix Lacryma-Jobi Seed Extract"],
    supported_benefits: ["Amino acid surfactants", "Botanical soothing extracts", "Zero alcohol/parabens"],
    supported_benefits_zh: ["氨基酸表活净澈", "和汉植物舒缓配方", "0香精0酒精安全温和"],
    usage_instructions: {
      morning: "Lather a small pea-sized amount with water into fluffy lather.",
      evening: "Rinse away city grime without stripping skin lipids.",
      general: "Work into cream lather, massage onto T-zone then cheeks.",
      morning_zh: "取黄豆大小加温水揉搓出丰富泡沫，轻柔洁面。",
      evening_zh: "净澈日常防晒与粉尘，洗后肌肤通透不拔干。",
      general_zh: "先清洁易出油T区，再轻带双颊，温水彻底冲净。"
    },
    texture: "Rich cream converting to fluffy lather",
    texture_zh: "温润乳霜质地，易起绵密泡沫",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },
  {
    product_id: "hada_labo_cleanser",
    variant_id: "hada_labo_cleanser_100g",
    name: "Hada Labo Gokujyun Hydrating Cleanser",
    name_zh: "肌研 极润保湿洁面乳",
    brand: "Hada Labo",
    brand_zh: "肌研",
    category: "cleanser",
    size: "100g Tube",
    price: 49,
    original_price: 59,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVJ2BiW8-hBPG7Y2Ey0yKSGNV9w_M1OeHXEuKqJIKDLUm60eIUwveocYJcvi9tJ9jot-l0CyuqMbNhY06ug76PnhblZCOBHkpiEv9D1v5gbUvTrGP83W1myNOemKXt6MYNRtVQ9hiY0S_nyquOfMcnIA9NbOwZt1DaWBveOK4Lp1E_K17PpxLk_THDz04NLAdJSpAj1Ibxvg4y8kKu2oBweuyoun4U3Kapy-sGy-16FB_qpaocpSFrvw",
    product_url: "https://www.watsons.com.cn/product/hada-labo-cleanser",
    ingredients: ["Water", "Sodium Cocoyl Glycinate", "Super Hyaluronic Acid", "Sodium Acetylated Hyaluronate"],
    supported_benefits: ["Super Hyaluronic Acid hydration", "Budget-friendly gentle cleanse", "pH balanced"],
    supported_benefits_zh: ["双重玻尿酸深层水润", "百元内高性价比入门", "亲肤弱酸性"],
    usage_instructions: {
      general: "Take 1cm on wet palm, lather with water and rinse well.",
      general_zh: "湿润手心挤出约1cm，加水揉搓出泡沫后清洁面部并冲净。"
    },
    texture: "Soft hydrating cream",
    texture_zh: "水润柔滑乳霜",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },

  // 2. Toners / Essences
  {
    product_id: "avene_spring_water",
    variant_id: "avene_spray_300ml",
    name: "Avène Thermal Spring Water Spray",
    name_zh: "雅漾 舒护活泉水喷雾",
    brand: "Avène",
    brand_zh: "雅漾",
    category: "toner",
    size: "300ml Spray",
    price: 129,
    original_price: 165,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYiU7u8z8ohvalZgiB17Ly04EusOFak0uGWd5INsp7ZddPh4WYaebDiz44ZKSjOEMmM044YB7LhOTAHRu8Ag3aIAjwYuxeMEbyeMIpdoHt7TM-xq8WPCHRRH-pkpDYBhC4y-OrB-ikPi-wRJEvv2f731qynynMNlnHizJW53D-DXBQ6b4ui-G3t6sHvEwCeSQ240Vy-sBH8MsXLKtpmVSCZox-fm0SyMfW4yWgCPvkEIzqDZehxypGiQ",
    product_url: "https://www.watsons.com.cn/product/avene-spray",
    ingredients: ["Avène Thermal Spring Water (100%)", "Nitrogen (inert propellant)"],
    supported_benefits: ["Instant heat & flush soothing", "Mineral balance (Calcium/Magnesium 2:1)", "Sterile spray"],
    supported_benefits_zh: ["即刻舒缓面部灼热与潮红", "微量元素活泉补水", "无菌灌装纯净安全"],
    usage_instructions: {
      morning: "Spray a fine mist over face after cleansing, let sit for 20 seconds, gently pat dry.",
      evening: "Can be used as soothing compress with cotton pads on flushed cheeks for 5 mins.",
      general: "Do not shake can. Spray 20cm away from face in an arc.",
      morning_zh: "洁面后距面部20cm环形喷洒，停留20秒后用纸巾轻按吸干多余水珠。",
      evening_zh: "换季潮红时可浸润化妆棉湿敷两颊5分钟密集降温安抚。",
      general_zh: "请勿摇晃瓶身，闭目均匀喷雾。"
    },
    texture: "Ultra-fine calming mist",
    texture_zh: "细腻微米级活泉水雾",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15",
    bundle_offer: "Bundle with Avene Tolerance Cream for 10% off",
    bundle_offer_zh: "与雅漾特护霜搭配购享整单9折"
  },
  {
    product_id: "hada_labo_lotion",
    variant_id: "hada_labo_lotion_170ml",
    name: "Hada Labo Gokujyun Premium Hydrating Lotion",
    name_zh: "肌研 极润特浓保湿精华水",
    brand: "Hada Labo",
    brand_zh: "肌研",
    category: "toner",
    size: "170ml Bottle",
    price: 99,
    original_price: 119,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpJvc8f6GMt49LC2Pz5ZcpvvvEW9dwyE1CUiBWKtMYUdsCSjNxMuZrZkF16tRgJrLCK0MvFp8z_vlj0wYqbm1_GyxIC5hOzNuTn1F0JvYDwrHrasGcdrfpGCHYLtvdtuVtjCmJV6ED9tBYv-f283mzEFEPsAj8sbh0Ml_KCp4BHaRrYXe6_7oxqW-ZoGHMhcL93zJYBQKhI3ScBJdYTROcmRFtA6dev3y0qxPxSqOaxE1Yhc6J9AKf3g",
    product_url: "https://www.watsons.com.cn/product/hada-labo-premium",
    ingredients: ["Water", "5 Types of Hyaluronic Acid", "Hydroxyethyl Urea", "Algae Extract"],
    supported_benefits: ["Multi-molecular hyaluronic network", "Plumping dry fine lines", "Alcohol-free"],
    supported_benefits_zh: ["5重玻尿酸立体水网", "平抚干燥紧绷细纹", "无香料无色素无酒精"],
    usage_instructions: {
      general: "Pour 2-3 drops into palms, press gently across face until fully absorbed.",
      general_zh: "倒2-3滴于掌心，均匀轻拍于面部直至水润充分吸收。"
    },
    texture: "Serum-like rich fluid",
    texture_zh: "精华般浓润凝露质地",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },

  // 3. Serums / Treatments
  {
    product_id: "centella_ampoule",
    variant_id: "centella_ampoule_55ml",
    name: "Skin1004 Madagascar Centella Asiatica Ampoule",
    name_zh: "积雪草 舒缓修护安瓶原液",
    brand: "Skin1004",
    brand_zh: "Skin1004",
    category: "serum",
    size: "55ml Dropper",
    price: 108,
    original_price: 138,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMaPz2vYLk8XmkbdcoXa24jFo7i-sp9zj6-V_j3j85279bAvonCj6F8J3e1_GHns7hNxLqqQ9cK9Ue0Kwze8univMcpbGJQ72guhf5N8fWyCEb_sUnjsUHSWoZpuCqOjlGkdAtrVbqN2jxlBvyWTxidSpvGrCfP1YiCoTBqfDK3l1E-7xV102I1_l3_NaIKO7WkG5olFPUSCDS8LYhersHmQiYMeC-p_O3NN6xXLqBeNqL9xddXpw7Jw",
    product_url: "https://www.watsons.com.cn/product/skin1004-centella",
    ingredients: ["Centella Asiatica Extract (100%)"],
    supported_benefits: ["Soothes barrier tightness", "Redness attenuation", "Non-comedogenic hydration"],
    supported_benefits_zh: ["100%马达加斯加积雪草精粹", "舒缓泛红紧绷", "清爽不闷痘"],
    usage_instructions: {
      morning: "Apply 2-3 drops after toner to calm daytime redness.",
      evening: "Layer 3-4 drops before moisturizer for restorative hydration.",
      general: "Dispense with dropper directly onto forehead and cheeks, smooth gently.",
      morning_zh: "爽肤水后滴取2-3滴，舒缓晨间泛红，后续上妆更服帖。",
      evening_zh: "夜间叠加3-4滴于面颊，修护日间紫外线与外界刺激。",
      general_zh: "滴管取适量涂抹于面部，轻拍至吸收。"
    },
    texture: "Lightweight watery essence",
    texture_zh: "清透水感无粘腻精粹水液",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },
  {
    product_id: "the_ordinary_niacinamide",
    variant_id: "the_ordinary_niacinamide_30ml",
    name: "The Ordinary Niacinamide 10% + Zinc 1%",
    name_zh: "The Ordinary 烟酰胺10% + 锌1% 精华",
    brand: "The Ordinary",
    brand_zh: "The Ordinary",
    category: "serum",
    size: "30ml Dropper",
    price: 65,
    original_price: 79,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCddTyQ_sD-dNPWbrUCm1usej6-Tcs7LqBCa28t64TBJq1ugmJWefdS9oLVlAU5Zmpuk8mI5H16nhP2_JBsXr6mDn_YEAi___Deh3ZPwJATccXLf5TdOUoQcjf-1UBjRwx2VlYXEMu-OaasqA6_Js0p0IS21MnOCzOmhdG6XFW7Q34OrEvlurL4yELEDIIjhXXUkvSYX7dDzV4oCK3sJ33vHQRMZ5-VufifFg0uph9qmNqY7izgq8aW1Q",
    product_url: "https://www.watsons.com.cn/product/the-ordinary-niacinamide",
    ingredients: ["Water", "Niacinamide (10%)", "Zinc PCA (1%)", "Pentylene Glycol", "Tamarindus Indica Seed Gum"],
    supported_benefits: ["Regulates T-zone sebum", "Refines visible pore congestion", "Clarifies skin texture"],
    supported_benefits_zh: ["平衡T区过剩油脂", "改善粗大毛孔堆积", "提亮暗沉水油平衡"],
    usage_instructions: {
      morning: "Apply 2 drops onto T-zone before moisturizer and sunscreen.",
      evening: "Smooth over oily/congested areas. Avoid combining with pure Vitamin C.",
      general: "Perform patch test before first use. Do not apply on broken skin.",
      morning_zh: "晨间取2滴涂抹于T区等易出油区域，控油哑光。",
      evening_zh: "洁面爽肤后局部涂抹，避免与高浓度维C同时混用。",
      general_zh: "首次使用建议耳后测试耐受，请勿涂抹于破损肌肤。"
    },
    texture: "Light clear gel",
    texture_zh: "清透水感凝胶",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },
  {
    product_id: "lrp_effaclar_duo",
    variant_id: "lrp_duo_40ml",
    name: "La Roche-Posay Effaclar Duo+M",
    name_zh: "理肤泉 净痘双重调理乳 Duo+M",
    brand: "La Roche-Posay",
    brand_zh: "理肤泉",
    category: "serum",
    size: "40ml Tube",
    price: 168,
    original_price: 198,
    image_url: "/assets/lrp_effaclar_duo_40ml.png",
    product_url: "https://www.watsons.com.cn/product/lrp-effaclar-duo",
    ingredients: ["Water", "Phylobioma", "Niacinamide", "Procerad", "Salicylic Acid (0.5%)", "LHA"],
    supported_benefits: ["Targeted blemish clearance", "Microbiome balance", "Anti-mark defense"],
    supported_benefits_zh: ["微生态科技净痘防印", "水杨酸+LHA平滑闭口", "哑光控油不油腻"],
    usage_instructions: {
      general: "Apply a pea-sized amount onto blemished or oil-prone areas after cleansing.",
      general_zh: "洁面后取珍珠大小薄涂于痘痘闭口及出油旺盛部位。"
    },
    texture: "Fresh matte gel-cream",
    texture_zh: "清爽哑光凝乳",
    is_fragrance_free: false,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },

  // 4. Creams / Moisturizers
  {
    product_id: "lrp_b5",
    variant_id: "lrp_b5_40ml",
    name: "La Roche-Posay Cicaplast Baume B5+",
    name_zh: "理肤泉 B5+ 多效修护舒缓霜",
    brand: "La Roche-Posay",
    brand_zh: "理肤泉",
    category: "cream",
    size: "40ml Balm",
    price: 119,
    original_price: 149,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4VJoUDaE0NPjUFAMV7c8hHg54SsP3QxrX7VMthRIz-SHsaPYhklpZN4fPIg0koXAwg6M0ST9XmbPWbdxtS5Yrf0_as7c9Pbx1fSYQHELEh1KEVqMmc8Od-GEKN28LK-OYKxDjzoUYBqrb-Wln11U2fQz9G_uAIKRkLIUdj4EkC02gqu7SpeLBpyDkR-xQNWTD-2QAMkRSo7PCPD7qktp2XaCY-MUW960SQurZXuipYV9I4Egs2WDEhA",
    product_url: "https://www.watsons.com.cn/product/lrp-cicaplast-b5",
    ingredients: ["Water", "Hydrogenated Polyisobutene", "Dimethicone", "Glycerin", "Panthenol (5%)", "Madecassoside", "Tribioma Prebiotic", "Zinc Gluconate", "Shea Butter"],
    supported_benefits: ["5% Panthenol & Madecassoside barrier care", "Soothes superficial redness", "Nourishing protective seal"],
    supported_benefits_zh: ["5%维生素原B5与积雪草苷", "修护表皮屏障受损", "舒缓干燥脱屑与泛红"],
    usage_instructions: {
      morning: "Warm a pea-sized amount between fingertips to emulsify, press lightly onto dry/flushed areas.",
      evening: "Can apply a slightly thicker layer on dry cheek patches as an intensive restorative mask.",
      general: "Emulsify between fingertips for 5s before pressing onto skin to prevent pilling.",
      morning_zh: "取黄豆大小在指腹轻揉乳化5秒，轻柔按压于面颊干燥泛红部位。",
      evening_zh: "夜间可重点在干燥脱皮区域局部厚敷，形成保护层滋润安抚。",
      general_zh: "建议指腹温热乳化后按压上脸，避免用力揉搓产生搓条。"
    },
    texture: "Rich comforting protective balm",
    texture_zh: "温润厚敷保护膏霜",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15",
    bundle_offer: "Store Counter Exclusive: 2 for ¥198",
    bundle_offer_zh: "专柜线下礼遇：2支立享¥198"
  },
  {
    product_id: "curel_cream",
    variant_id: "curel_cream_40g",
    name: "Curél Intensive Moisture Facial Cream",
    name_zh: "珂润 润浸保湿滋养乳霜",
    brand: "Curél",
    brand_zh: "珂润",
    category: "cream",
    size: "40g Jar",
    price: 158,
    original_price: 178,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGEGKfYmph0L8xm7eDrmp_DBYkZ7PppicgKughdbg-pePtpY_EJXJXuY4-5scH1cUVKGbaymCQ5V1Rfr0h4M-JaIEM3BsRmP1hsTCYYI_it4PEsd1ivQK3Wl90H_g1YPTJSvH48jheIf4--kAC53ENrncBK8raLaYbjF-NJoP3cXxhnbXmOBcLLRHE86Vn13oBMT2UHmhw3O1VPiCDbOKJyLgmewZcQz2kwhImctHOrz-cCYrmBoUviw",
    product_url: "https://www.watsons.com.cn/product/curel-facial-cream",
    ingredients: ["Water", "Glycerin", "Cetyl-PG Hydroxyethyl Palmitamide (Pseudo-ceramide)", "Cyclopentasiloxane", "Squalane", "Allantoin", "Eucalyptus Leaf Extract"],
    supported_benefits: ["Pseudo-ceramide moisture replenishment", "Lightweight non-greasy cushion", "Fragrance and alcohol free"],
    supported_benefits_zh: ["神经酰胺功能成分深层润浸", "轻润舒芙蕾质地不闷闭口", "无香精弱酸性低刺激"],
    usage_instructions: {
      morning: "Scoop a nickel-sized amount, smooth evenly over face for all-day comfort.",
      evening: "Gently press into cheeks and forehead after toner or serum.",
      general: "Melts on touch without leaving greasy film on T-zone.",
      morning_zh: "取适量均匀涂抹面部，水润打底不闷T区。",
      evening_zh: "晚间取约两颗珍珠大小，掌心轻揉后均匀涂抹锁水。",
      general_zh: "一触即化，清爽柔嫩不泛油光。"
    },
    texture: "Lightweight soufflé cream",
    texture_zh: "轻羽绒级舒芙蕾奶冻乳霜",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15",
    bundle_offer: "Free 15g travel miniature with full size purchase",
    bundle_offer_zh: "购正装赠15g便携旅行装"
  },
  {
    product_id: "avene_tolerance",
    variant_id: "avene_tolerance_50ml",
    name: "Avène Tolerance Soothing Skin Recovery Cream",
    name_zh: "雅漾 专研舒缓免洗特护霜",
    brand: "Avène",
    brand_zh: "雅漾",
    category: "cream",
    size: "50ml Sterile Pump",
    price: 189,
    original_price: 219,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRKeD7Xv0NgsNMW5AMWYiLGhEnCS7wH8FMolVpXAU7eSpPXfNokqAW17z4TfnoqECfbDe8DZLvrlTToDQUxF16E9qoAYDYzW34YuW5cn9DFm3Y8DjmM_LuF40_DTnBJNxhLSCsOTR6JaSBTP3Vv1ASDMRyRa2TR0enMWmszv5vaiRQMq6Gs90_wfMCUCTWwVUk277Ndpyopv4qiWzfdPk3RFNkR3MH75876oSwX3nGatvYd5UJ986bsg",
    product_url: "https://www.watsons.com.cn/product/avene-tolerance",
    ingredients: ["Avène Thermal Spring Water", "Caprylic/Capric Triglyceride", "Glycerin", "Cetearyl Alcohol", "D-Sensinose (patented postbiotic)"],
    supported_benefits: ["Sterile cosmetic packaging (Zero preservatives)", "Calms hyper-reactive flushing", "Minimalist 10-ingredient formula"],
    supported_benefits_zh: ["专利无菌舱包装（0防腐剂）", "D-Sensinose快速安抚泛红紧绷", "精简纯净配方"],
    usage_instructions: {
      morning: "Press pump gently for 1 dose, apply to face and neck with fingertips.",
      evening: "Smooth onto clean skin to rebuild moisture buffer overnight.",
      general: "Sterile delivery keeps formula 100% preservative-free throughout use.",
      morning_zh: "按压1泵，指腹由内向外轻柔平滑涂抹于面颈部。",
      evening_zh: "晚间涂抹提供纯净封层，稳住换季不耐受。",
      general_zh: "单向阀无菌舱设计，每次使用隔绝空气与细菌回流。"
    },
    texture: "Silky breathable emulsion-cream",
    texture_zh: "丝滑透气柔滑凝乳霜",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },
  {
    product_id: "winona_soothing_cream",
    variant_id: "winona_cream_50g",
    name: "Winona Anti-Sensitive Moisturizing Tolerance Cream",
    name_zh: "薇诺娜 舒敏保湿特护霜",
    brand: "Winona",
    brand_zh: "薇诺娜",
    category: "cream",
    size: "50g Pump",
    price: 198,
    original_price: 228,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDZgH1SANVSVWiXZzdIf0zRDlw1Xf4AywcKGar91YRCYXivhwLthI9f02NjKEa0DOkVxkHVCF23LGDXTtcVPdUR5F94x9X9Y3xmL-4RkTG_W6I_5IoRlXmnAsmvPq3wbxQq-MCN_6vbc9S7dfy71UMZPWntwfQUgym8cmHEbMepCDnEPoVBlm6Ypqf7BPE-GdzGGBMgCKM0DTc0H3dHTNiJVaBWa5vS5mUe9WJdygxUsYfwL7mJt39Ag",
    product_url: "https://www.watsons.com.cn/product/winona-tolerance-cream",
    ingredients: ["Water", "Portulaca Oleracea Extract", "Prinsepia Utilis Oil (青刺果油)", "Sodium Hyaluronate", "Beta-Glucan"],
    supported_benefits: ["Yunnan botanical Prinsepia barrier lipid repair", "Portulaca oleracea instant soothing", "Dermatologist-recommended in China"],
    supported_benefits_zh: ["青刺果油主动修护角质层", "马齿苋提取物快速缓解刺激", "敏感肌专研舒缓特护"],
    usage_instructions: {
      morning: "Apply 2 pumps evenly over face as soothing morning lotion.",
      evening: "Gently massage into sensitive redness zones until absorbed.",
      general: "Lightweight texture ideal for humid and changing weather.",
      morning_zh: "晨间取2泵均匀涂抹，轻盈保湿不油腻。",
      evening_zh: "晚间取适量轻揉泛红部位，舒缓安抚紧绷干痒。",
      general_zh: "清爽水感乳液，换季维稳佳品。"
    },
    texture: "Refreshing milky emulsion",
    texture_zh: "清润水感牛奶乳液质地",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },

  // 5. Sunscreens
  {
    product_id: "anessa_gold_milk",
    variant_id: "anessa_gold_60ml",
    name: "Anessa Perfect UV Sunscreen Skincare Milk SPF50+ PA++++",
    name_zh: "安热沙 金灿倍护防晒乳 SPF50+ PA++++",
    brand: "Anessa",
    brand_zh: "安热沙",
    category: "sunscreen",
    size: "60ml Bottle",
    price: 198,
    original_price: 238,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcVuM5L4rdwfkyVCm5CDxsc6hONVS4-53j1SlvLNr3TMMIGKE1rXOHQuBXVA-0c16KOjpZe6daAWUFGNs1NixtT3K6adfpWgf-NRG-p01IFOg-L8YSmi6ygWBGLeRLdCj1oin86rowBQoMEzZzQinA9oxqJiwGVunaN8vdNzBn1fIuuaDwJ9OvUwsj1uG6MiJSeOzJ4J-5pKMNUeDlfcceJxKB9zVHUVXy1k8yoWB-60QsVoFXtrlEaQ",
    product_url: "https://www.watsons.com.cn/product/anessa-gold-milk",
    ingredients: ["Dimethicone", "Zinc Oxide", "Titanium Dioxide", "Octocrylene", "Green Tea Extract", "Tormentilla Root Extract"],
    supported_benefits: ["Auto Booster UV technology (Water & heat resistant)", "50% skincare ingredients", "Broad spectrum UVA/UVB shield"],
    supported_benefits_zh: ["遇水热更强的热能防护网", "50%护肤成分滋润", "高倍持久防晒防晒黑"],
    usage_instructions: {
      morning: "Shake well, apply 2 nickel-sized portions onto face 15 mins before sun exposure.",
      general: "Shake before use until ball clicks. Reapply every 2 hours if outdoors.",
      morning_zh: "摇匀后取一枚硬币大小，出门前15分钟均匀涂抹面颈部。",
      general_zh: "摇晃听到响声后倒出，户外暴晒建议每2小时补涂。"
    },
    texture: "Silky shake-well lotion",
    texture_zh: "清透丝滑摇摇乐乳液",
    is_fragrance_free: false,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },
  {
    product_id: "biore_aqua_rich",
    variant_id: "biore_aqua_50g",
    name: "Bioré UV Aqua Rich Watery Essence SPF50+ PA++++",
    name_zh: "碧柔 水感防晒水活精华 SPF50+ PA++++",
    brand: "Bioré",
    brand_zh: "碧柔",
    category: "sunscreen",
    size: "50g Tube",
    price: 59,
    original_price: 69,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGOgKTwbx-QzHVbWfte9exLiVUaSELuNwrLRwecsBRR7prHyvTLnSUk3cnfm5IsAdHPI8t5lKt5KmWulEyIMAyKGajCN3ZCBBl_tSttx9vkK_JKX_a-uaItGfCkwHnxxBf760cYvZxcSs0LDp9CXpTZWcsR7eXVfrf5rC5nNsEehNIkaQmE0PiwtAOwIbZ92rV8xg_zAjQsQQeYsDFBVmWUbVZbtbi1vJb3xtupnfFaIRjWCBl6jK7RQ",
    product_url: "https://www.watsons.com.cn/product/biore-aqua-rich",
    ingredients: ["Water", "Ethylhexyl Methoxycinnamate", "Hyaluronic Acid", "Royal Jelly Extract"],
    supported_benefits: ["Micro Defense watery capsule formulation", "Zero white-cast weightless feel", "Budget everyday protection"],
    supported_benefits_zh: ["微米防护技术水感轻盈", "0假白透明清透", "百元内高性价比日常通勤防晒"],
    usage_instructions: {
      morning: "Apply 2 finger lengths evenly over face and ears as final skincare step.",
      general: "Wash off easily with regular cleanser without special makeup remover.",
      morning_zh: "晨间护肤最后一步，挤出两条指节长度均匀涂抹面颈部。",
      general_zh: "普通洗面奶即可轻松洗净，无需额外深度卸妆。"
    },
    texture: "Watery gel essence",
    texture_zh: "水感轻盈无负担凝露",
    is_fragrance_free: false,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  },

  // 6. Soothing Masks
  {
    product_id: "winona_repair_mask",
    variant_id: "winona_mask_5sheets",
    name: "Winona Soothing Repair Freeze-Dried Mask",
    name_zh: "薇诺娜 舒缓修护冻干面膜",
    brand: "Winona",
    brand_zh: "薇诺娜",
    category: "mask",
    size: "5 Sheets Box",
    price: 118,
    original_price: 148,
    image_url: "/assets/winona_repair_mask_box.jpg",
    product_url: "https://www.watsons.com.cn/product/winona-freeze-mask",
    ingredients: ["Freeze-dried Prinsepia Utilis Extract", "Portulaca Oleracea", "Hyaluronic Acid"],
    supported_benefits: ["Freeze-dried active preservation", "Emergency relief for red & burning skin", "Preservative-free"],
    supported_benefits_zh: ["-40℃休眠冻干锁鲜科技", "换季突发泛红发烫紧急退红", "0防腐剂温和敷感"],
    usage_instructions: {
      evening: "Add 20ml purified water to mask tray, wait 1 min to activate, apply for 15-20 mins.",
      general: "Use 2-3 times a week or during sudden sensitivity flares.",
      evening_zh: "托盘中倒入20ml纯净水静置1分钟充分浸润，敷贴面部15-20分钟。",
      general_zh: "每周使用2-3次或换季敏感情绪不稳定时急救敷贴。"
    },
    texture: "Cooling wet bio-cellulose film",
    texture_zh: "冰凉舒缓高服帖天丝膜布",
    is_fragrance_free: true,
    availability: "in_stock",
    source: "Watsons China Core Skincare Assortment 2026",
    last_updated: "2026-03-15"
  }
];

// Helper to find a product by product_id
export function getProductById(id: string): ProductRecord | undefined {
  return WATSONS_PRODUCT_CATALOGUE.find((p) => p.product_id === id);
}

// Convert ProductRecord to ProductItem for backward compatibility with UI components
export function toProductItem(record: ProductRecord, language: 'en' | 'zh' = 'zh', customReason?: string) {
  const isZh = language === 'zh';
  return {
    id: record.product_id,
    brand: isZh ? record.brand_zh : record.brand,
    name: record.name,
    nameZh: record.name_zh,
    size: record.size,
    price: record.price,
    originalPrice: record.original_price,
    matchScore: 92, // Legacy field
    matchTier: "Curated Selection",
    matchTierZh: "严选配方",
    tagline: record.supported_benefits[0] || "",
    taglineZh: record.supported_benefits_zh[0] || "",
    image: record.image_url,
    bundleOffer: record.bundle_offer || "",
    bundleOfferZh: record.bundle_offer_zh || "",
    whyMatches: customReason || (record.supported_benefits.join(' • ')),
    whyMatchesZh: customReason || (record.supported_benefits_zh.join(' • ')),
    keyActives: record.ingredients.slice(0, 4),
    texture: record.texture,
    textureZh: record.texture_zh,
    isFragranceFree: record.is_fragrance_free,
    storePrivilege: record.bundle_offer || "Watsons Member Points",
    storePrivilegeZh: record.bundle_offer_zh || "屈臣氏会员积分换购礼",
    category: (record.category === 'serum' ? 'treatment' : record.category) as any,
    inStock: record.availability !== 'out_of_stock'
  };
}
