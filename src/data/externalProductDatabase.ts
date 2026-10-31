export interface CommonSkincareItem {
  id: string;
  brand: string;
  brandZh: string;
  name: string;
  nameZh: string;
  category: 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen' | 'other';
  categoryZh: string;
  isStoreOwned: boolean;
  image?: string;
  tags?: string[];
}

export const COMMON_SKINCARE_DATABASE: CommonSkincareItem[] = [
  // Cleansers
  {
    id: "cerave_cleanser_sa",
    brand: "CeraVe",
    brandZh: "适乐肤",
    name: "SA Smoothing Cleanser",
    nameZh: "适乐肤 水杨酸温和洁面啫喱",
    category: "cleanser",
    categoryZh: "洁面",
    isStoreOwned: false,
    tags: ["水杨酸", "神经酰胺", "疏通毛孔", "温和"]
  },
  {
    id: "cerave_cleanser_hydrating",
    brand: "CeraVe",
    brandZh: "适乐肤",
    name: "Hydrating Facial Cleanser",
    nameZh: "适乐肤 修护保湿洁面乳",
    category: "cleanser",
    categoryZh: "洁面",
    isStoreOwned: false,
    tags: ["神经酰胺", "无泡", "屏障修护"]
  },
  {
    id: "freeplus_cleanser",
    brand: "Freeplus",
    brandZh: "芙丽芳丝",
    name: "Mild Soap Cleanser",
    nameZh: "芙丽芳丝 净润洗面霜",
    category: "cleanser",
    categoryZh: "洁面",
    isStoreOwned: false,
    tags: ["氨基酸洁面", "温和", "无香精"]
  },
  {
    id: "larocheposay_cleanser_toleriane",
    brand: "La Roche-Posay",
    brandZh: "理肤泉",
    name: "Toleriane Hydrating Gentle Cleanser",
    nameZh: "理肤泉 特安舒缓温和洁面乳",
    category: "cleanser",
    categoryZh: "洁面",
    isStoreOwned: false,
    tags: ["烟酰胺", "神经酰胺", "理肤泉温泉水"]
  },
  {
    id: "zhiben_cleanser",
    brand: "Zhiben",
    brandZh: "至本",
    name: "Soothing Cleanser",
    nameZh: "至本 舒颜修护洁面乳",
    category: "cleanser",
    categoryZh: "洁面",
    isStoreOwned: false,
    tags: ["氨基酸", "结晶体系", "屏障修护"]
  },

  // Toners
  {
    id: "avene_thermal_spray",
    brand: "Avène",
    brandZh: "雅漾",
    name: "Thermal Spring Water Spray",
    nameZh: "雅漾 舒护活泉喷雾",
    category: "toner",
    categoryZh: "爽肤水",
    isStoreOwned: false,
    tags: ["活泉水", "舒缓泛红", "无菌包装"]
  },
  {
    id: "larocheposay_toner_toleriane",
    brand: "La Roche-Posay",
    brandZh: "理肤泉",
    name: "Toleriane Soothing Lotion",
    nameZh: "理肤泉 特安舒缓柔肤水",
    category: "toner",
    categoryZh: "爽肤水",
    isStoreOwned: false,
    tags: ["甘油", "温和补水", "低敏配方"]
  },
  {
    id: "origins_mega_mushroom_water",
    brand: "Origins",
    brandZh: "悦木之源",
    name: "Mega-Mushroom Relief & Resilience Treatment Lotion",
    nameZh: "悦木之源 韦博士灵芝焕能强韧好神水",
    category: "toner",
    categoryZh: "爽肤水",
    isStoreOwned: false,
    tags: ["灵芝", "积雪草", "维稳退红"]
  },
  {
    id: "skii_facial_treatment_essence",
    brand: "SK-II",
    brandZh: "SK-II",
    name: "Facial Treatment Essence (Pitera)",
    nameZh: "SK-II 护肤精华露 (神仙水)",
    category: "toner",
    categoryZh: "爽肤水",
    isStoreOwned: false,
    tags: ["Pitera", "酵母精粹", "调理水油", "细致透亮"]
  },
  {
    id: "ipsa_time_reset_aqua",
    brand: "IPSA",
    brandZh: "茵芙莎",
    name: "The Time Reset Aqua",
    nameZh: "IPSA 流金岁月凝润美肤水",
    category: "toner",
    categoryZh: "爽肤水",
    isStoreOwned: false,
    tags: ["传明酸", "水油平衡", "预防闭口"]
  },

  // Serums
  {
    id: "skinceuticals_ce_ferulic",
    brand: "SkinCeuticals",
    brandZh: "修丽可",
    name: "C E Ferulic Combination Antioxidant Treatment",
    nameZh: "修丽可 CE经典复合抗氧化精华液",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["左旋维C", "维生素E", "阿魏酸", "抗氧提亮"]
  },
  {
    id: "skinceuticals_phyto_corrective",
    brand: "SkinCeuticals",
    brandZh: "修丽可",
    name: "Phyto Corrective Gel (Color Correction)",
    nameZh: "修丽可 色修舒缓修护精华露",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["油橄榄叶", "黄瓜提取", "舒缓泛红", "淡化红印"]
  },
  {
    id: "esteelauder_anr",
    brand: "Estée Lauder",
    brandZh: "雅诗兰黛",
    name: "Advanced Night Repair Synchronized Multi-Recovery",
    nameZh: "雅诗兰黛 特润修护肌透精华露 (小棕瓶)",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["二裂酵母", "夜间修护", "维稳强韧", "抗初老"]
  },
  {
    id: "lancome_genifique",
    brand: "Lancôme",
    brandZh: "兰蔻",
    name: "Advanced Génifique Youth Activating Concentrate",
    nameZh: "兰蔻 第二代小黑瓶肌底精华液",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["益生元复配", "屏障修护", "肌底吸收", "提亮"]
  },
  {
    id: "proya_dual_brightening",
    brand: "Proya",
    brandZh: "珀莱雅",
    name: "Dual Brightening Anti-Oxidant Serum",
    nameZh: "珀莱雅 双抗焕亮精华液 3.0",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["麦角硫因", "虾青素", "脱羧肌肽", "抗氧抗糖"]
  },
  {
    id: "proya_ruby_serum",
    brand: "Proya",
    brandZh: "珀莱雅",
    name: "Ruby Anti-Wrinkle Essence",
    nameZh: "珀莱雅 红宝石多肽抗皱紧致精华液",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["六胜肽", "超分子视黄醇", "淡纹紧致"]
  },
  {
    id: "clarins_double_serum",
    brand: "Clarins",
    brandZh: "娇韵诗",
    name: "Double Serum Complete Age Control Concentrate",
    nameZh: "娇韵诗 双萃焕活双动力修护精华",
    category: "serum",
    categoryZh: "精华",
    isStoreOwned: false,
    tags: ["水油双相", "姜黄酮", "滋养焕活"]
  },

  // Creams & Lotions
  {
    id: "cerave_pm_lotion",
    brand: "CeraVe",
    brandZh: "适乐肤",
    name: "PM Facial Moisturizing Lotion",
    nameZh: "适乐肤 PM夜间修护修润乳",
    category: "cream",
    categoryZh: "乳液面霜",
    isStoreOwned: false,
    tags: ["神经酰胺", "烟酰胺", "透明质酸", "MVE缓释"]
  },
  {
    id: "larocheposay_cicaplast_b5",
    brand: "La Roche-Posay",
    brandZh: "理肤泉",
    name: "Cicaplast Baume B5+ Soothing Repairing Balm",
    nameZh: "理肤泉 B5多效保湿修护霜",
    category: "cream",
    categoryZh: "乳液面霜",
    isStoreOwned: false,
    tags: ["维生素原B5", "积雪草苷", "微生态成分", "厚敷退红"]
  },
  {
    id: "kiehls_ultra_facial_cream",
    brand: "Kiehl's",
    brandZh: "科颜氏",
    name: "Ultra Facial Cream",
    nameZh: "科颜氏 高保湿面霜",
    category: "cream",
    categoryZh: "乳液面霜",
    isStoreOwned: false,
    tags: ["角鲨烷", "冰川保护蛋白", "长效锁水"]
  },
  {
    id: "winona_special_care_cream",
    brand: "Winona",
    brandZh: "薇诺娜",
    name: "Anti-Sensitive Special Care Cream",
    nameZh: "薇诺娜 舒敏保湿特护霜",
    category: "cream",
    categoryZh: "乳液面霜",
    isStoreOwned: false,
    tags: ["青刺果油", "马齿苋提取", "速修泛红", "敏感肌"]
  },
  {
    id: "yuze_barrier_cream",
    brand: "Yuze",
    brandZh: "玉泽",
    name: "Skin Barrier Recovery Cream",
    nameZh: "玉泽 皮肤屏障修护保湿霜",
    category: "cream",
    categoryZh: "乳液面霜",
    isStoreOwned: false,
    tags: ["植物仿生脂质", "神经酰胺", "修护干痒"]
  },

  // Sunscreens
  {
    id: "anessa_gold_milk",
    brand: "Anessa",
    brandZh: "安热沙",
    name: "Perfect UV Sunscreen Skincare Milk SPF50+ PA++++",
    nameZh: "安热沙 金灿倍护防晒乳 (小金瓶)",
    category: "sunscreen",
    categoryZh: "防晒",
    isStoreOwned: false,
    tags: ["SPF50+", "PA++++", "热能防晒", "防水防汗"]
  },
  {
    id: "elixir_day_care_revolution",
    brand: "Elixir",
    brandZh: "怡丽丝尔",
    name: "Day Care Revolution SPF50+ PA++++",
    nameZh: "怡丽丝尔 优悦活颜防护精华乳 (金管)",
    category: "sunscreen",
    categoryZh: "防晒",
    isStoreOwned: false,
    tags: ["乳液防晒合一", "胶原蛋白", "轻薄滋润"]
  },
  {
    id: "winona_sunscreen_milk",
    brand: "Winona",
    brandZh: "薇诺娜",
    name: "Clear Sunscreen Milk SPF48 PA+++",
    nameZh: "薇诺娜 清透防晒乳 SPF48 PA+++",
    category: "sunscreen",
    categoryZh: "防晒",
    isStoreOwned: false,
    tags: ["物理化学结合", "马齿苋舒缓", "敏感肌专属"]
  },

  // Others (eye cream, masks, etc.)
  {
    id: "esteelauder_eye_gel",
    brand: "Estée Lauder",
    brandZh: "雅诗兰黛",
    name: "Advanced Night Repair Eye Supercharged Gel-Creme",
    nameZh: "雅诗兰黛 特润修护精华眼霜 (小棕瓶眼霜)",
    category: "other",
    categoryZh: "其他",
    isStoreOwned: false,
    tags: ["眼霜", "淡化黑眼圈", "蓝光防护"]
  }
];
