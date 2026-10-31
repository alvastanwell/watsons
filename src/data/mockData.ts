import { ProductItem, RoutineStep, InStoreAppointment } from '../types';
import { WATSONS_PRODUCT_CATALOGUE, toProductItem } from './productCatalogue';

export const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuDI2Ez8zHbssmL-dIQbXnsORNiF9mfZm8MePlvFRksO9vX5EBGoyZy-Yt-Jxy6Q_UubZKl2PMfwmYr-nm7g35ImuX7GFCi521QcQeDHxcrGY2lWdobmp8AaOMHWQpSSAO6fQiUIMycGeHZNP5S_bKELB50Ha5-iHWoUB_ydVhT4qYQ7qjzuIUT3ltuc1u-MUSYJ4uWN9PvJFD5kuISxOIY39FYuJN9_NiygQNwm3GMF4tiXFYcYuaksbQ";

export const ADVISOR_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuB42N8Y6VVfay1O58_3Z7CSpqvw9wVP3--9ClHADQ7cZ8Dh9qX_yOGCBr-m0mSqxhYWQ3nRrnwGRWW35tRL9ETqJ5SIrNNQC4qnYQG7dp5wpndWox_EH_NdiwK2r36nQlEzHy5FGInf8fgybD90TShtMKOTBuQa2lYZkhwhf820bxT2mHcl1OdY6JSfAqgN-StI0dlia3-uxFBWsOrU3m55-UHo0SnD2AHGXbpPwf9yvnDR5YboCRJlRQ";

export const ADVISOR_PROFILE_PHOTO = "https://lh3.googleusercontent.com/aida-public/AB6AXuD6IN7eCwGIMGKc78IiORHmzQjCqfqxzwn9yJrMi4OITDxKka8-77TZUJj3ZjSpo3Wdw1fX4vXJS0mr8EXlH4IgZFecAFczUvITdnSmAL6PKXRazoOCMxiJHZZFK3f7MqWX8Qge27NEJi4rsJmU_1-GNjIiAASqa0MKDlB0N42EHePkVb7k17lZja1B7oDrJQbAnc9LNFLNJH8vBXCdePDJY0hkGJ5Sa343Pn2_-26VkOnz0sEVz-oaGg";

export const SKIN_SCAN_PREVIEW = "https://lh3.googleusercontent.com/aida-public/AB6AXuDkD5uUlRoXG3wpG4i0I8680zgQR8uc60sFbPg56oGaLIinr3RYSw-6saa5GcctpyGgfeN27Ht47Du_qLtJVTo2qUJXFPSv1Bel0EGi41rv07SGCPUQ2V2qHQvCv2-ifLKJeaRicm4BYosvpHeYc1aoPaVkCYMAee7TuWL2Wi_9RQGtldnbVSDHMOxD4nh40CKUuybM6KhhabXyXkBXkltd3VJzzb29DL8LSjO4HL-tbBIkR0HP9p4GZg";

// Dynamically expose curated products converted from shared catalogue
export const CURATED_PRODUCTS: ProductItem[] = WATSONS_PRODUCT_CATALOGUE.map((p) =>
  toProductItem(p, 'zh')
);

export const INITIAL_MORNING_STEPS: RoutineStep[] = [
  {
    id: "m_step_1",
    stepNumber: 1,
    productId: "curel_cleanser",
    variantId: "curel_cleanser_150ml",
    category: "Step 1 • Cleanser",
    categoryZh: "第 1 步 • 洁面",
    title: "Curél Foaming Facial Wash",
    titleZh: "珂润 润浸保湿洁颜泡沫",
    subtitle: "pH 5.5 Balanced • Ceramides",
    subtitleZh: "弱酸性 pH 5.5 • 神经酰胺复配",
    details: "Use 1-2 pumps of dense foam with lukewarm water.",
    detailsZh: "按压1-2泵微米级泡沫，温水轻柔打圈清洗。",
    howToUse: "Pump 1-2 pumps onto damp hands, glide foam over face for 30s without harsh rubbing, rinse with lukewarm water.",
    howToUseZh: "按压1-2泵于湿润双手，在面部轻柔按压清洁30秒，温水彻底冲净即可。",
    whyInRoutine: "Sulfate-free amino acid cleanse preserving your natural lipid barrier during morning prep.",
    whyInRoutineZh: "弱酸性低刺激氨基酸表活，温和洗净夜间多余皮脂，守住角质层神经酰胺。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC43wquFrEKN1wwoAZgLrdo3cGxOfg7RpFm_cb00kS1Rfwj_knUXY-EFM0gXpaVg_t43GRnTrglOPBhAIL5UrjO6k58u1WA70NmIEryu1rRXhJtMQ87hRi8BxLZAysUpSZwtQppm392Gwo94MPt48q7v8p7XQrUnns55H4CmZNJo-5MB1Dlrw0on9iHjuDklhrFJuPMGae6brDI-WO0F3Yvr7-n33GlZc7xCgS9ydDXpuW6z80eJTwwYg",
    isKeyHero: false,
    completed: true,
    timeOfDay: "morning"
  },
  {
    id: "m_step_2",
    stepNumber: 2,
    productId: "curel_cream",
    variantId: "curel_cream_40g",
    category: "Step 2 • Moisturizer",
    categoryZh: "第 2 步 • 乳霜锁水",
    title: "Curél Intensive Moisture Facial Cream",
    titleZh: "珂润 润浸保湿滋养乳霜",
    subtitle: "Ceramide Care • Soufflé Whip",
    subtitleZh: "神经酰胺修护 • 轻羽绒奶冻质地",
    details: "Scoop a nickel-sized amount, smooth evenly over face.",
    detailsZh: "取珍珠大小均匀涂抹面部，水润舒缓不闷T区。",
    howToUse: "Smooth a pearl-sized amount gently across cheeks and forehead after cleansing. Tap lightly until absorbed.",
    howToUseZh: "洁面后取两颗珍珠大小，轻柔涂抹于面颊与额头，指腹轻按至轻盈吸收。",
    whyInRoutine: "Direct pseudo-ceramide moisture replenishment providing cushion and resilience without greasy residue.",
    whyInRoutineZh: "神经酰胺功能成分深层润浸角质层，质地轻盈柔润，解决混合肌干燥而T区易出油的矛盾。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGEGKfYmph0L8xm7eDrmp_DBYkZ7PppicgKughdbg-pePtpY_EJXJXuY4-5scH1cUVKGbaymCQ5V1Rfr0h4M-JaIEM3BsRmP1hsTCYYI_it4PEsd1ivQK3Wl90H_g1YPTJSvH48jheIf4--kAC53ENrncBK8raLaYbjF-NJoP3cXxhnbXmOBcLLRHE86Vn13oBMT2UHmhw3O1VPiCDbOKJyLgmewZcQz2kwhImctHOrz-cCYrmBoUviw",
    isKeyHero: true,
    completed: false,
    timeOfDay: "morning"
  },
  {
    id: "m_step_3",
    stepNumber: 3,
    productId: "biore_aqua_rich",
    variantId: "biore_aqua_50g",
    category: "Step 3 • Sun Protection",
    categoryZh: "第 3 步 • 防护隔离",
    title: "Bioré UV Aqua Rich SPF50+ PA++++",
    titleZh: "碧柔 水感防晒水活精华 SPF50+",
    subtitle: "Watery Essence • Zero White Cast",
    subtitleZh: "水感轻盈 • 0假白防晒",
    details: "Apply 2 finger lengths 15 mins before heading out.",
    detailsZh: "出门前15分钟均匀涂抹两指长份量，形成均匀UV防护薄膜。",
    howToUse: "Dispense 2 finger-lengths, apply evenly over face and ears as the final morning step. Reapply as needed.",
    howToUseZh: "晨间护肤最后一步，取两条指节长度均匀涂抹面颈部，温和成膜。",
    whyInRoutine: "Essential UV shield preventing daily photo-aging and environmental stress on your skin barrier.",
    whyInRoutineZh: "高倍持久防护阻隔UVA/UVB，水感质地清爽无负担，预防日晒引起的屏障干红。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGOgKTwbx-QzHVbWfte9exLiVUaSELuNwrLRwecsBRR7prHyvTLnSUk3cnfm5IsAdHPI8t5lKt5KmWulEyIMAyKGajCN3ZCBBl_tSttx9vkK_JKX_a-uaItGfCkwHnxxBf760cYvZxcSs0LDp9CXpTZWcsR7eXVfrf5rC5nNsEehNIkaQmE0PiwtAOwIbZ92rV8xg_zAjQsQQeYsDFBVmWUbVZbtbi1vJb3xtupnfFaIRjWCBl6jK7RQ",
    isKeyHero: false,
    completed: false,
    timeOfDay: "morning"
  }
];

export const INITIAL_EVENING_STEPS: RoutineStep[] = [
  {
    id: "e_step_1",
    stepNumber: 1,
    productId: "freeplus_cleanser",
    variantId: "freeplus_cleanser_100g",
    category: "Step 1 • Evening Cleanse",
    categoryZh: "第 1 步 • 净澈洁面",
    title: "Freeplus Mild Soap",
    titleZh: "芙丽芳丝 净润洗面霜",
    subtitle: "Amino Acid • Botanical Soothing",
    subtitleZh: "氨基酸温和表活 • 和汉植物精萃",
    details: "Lather pea-sized amount to dissolve sunscreen & city dust.",
    detailsZh: "加水揉出细腻泡沫，净澈日间防晒与城市粉尘。",
    howToUse: "Work a small amount into rich foam with water. Massage T-zone then cheeks for 60s, rinse clean.",
    howToUseZh: "取黄豆大小加水搓出泡沫，重点清洁T区再带过两颊，温水洗净。",
    whyInRoutine: "Thoroughly lifts away water-resistant daily SPF without stripping epidermal lipids.",
    whyInRoutineZh: "轻松卸除日常防晒残留，植物精萃温和舒缓，洗后柔嫩不拔干。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6lngO8Wb6SwHlxXsb3ksV9QETQWbvjVn6Do9cDgY2ICcYbD8NQiW28-Lyiszi8AojLO9T54eK84s_3mmxeZcjcVQp86qOGiU1I6RKK-35orHENKgR4pwyVnnlYrVBz2Zxfih_3QL72jKP93EOa7vkwGi49ndc-KSWkfOfL-CDzIVju23mq3OK86b91BB_Ygj1ou9QBqN_SNu3o4An2SmTh0u6piL2SU-sLXrEg9P1CqU9JiXgHSYNmA",
    completed: false,
    timeOfDay: "evening"
  },
  {
    id: "e_step_2",
    stepNumber: 2,
    productId: "centella_ampoule",
    variantId: "centella_ampoule_55ml",
    category: "Step 2 • Calming Serum",
    categoryZh: "第 2 步 • 舒缓安瓶",
    title: "Skin1004 Madagascar Centella Ampoule",
    titleZh: "积雪草 舒缓修护安瓶原液",
    subtitle: "100% Centella Asiatica",
    subtitleZh: "高纯度积雪草精粹 • 快速退红",
    details: "Pat 3-4 drops gently across face and neck.",
    detailsZh: "滴取 3-4 滴掌心，轻按于面颊及颈部至吸收。",
    howToUse: "Dispense 3-4 drops with dropper, smooth over cheeks and sensitive redness zones until absorbed.",
    howToUseZh: "滴管取3-4滴，轻柔涂抹于两颊及泛红敏感处，轻拍促进渗透。",
    whyInRoutine: "High-purity botanical actives soothe superficial redness and rehydrate after sun exposure.",
    whyInRoutineZh: "高纯度积雪草苷快速缓解日间换季引起的微红紧绷，补充深层水分。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMaPz2vYLk8XmkbdcoXa24jFo7i-sp9zj6-V_j3j85279bAvonCj6F8J3e1_GHns7hNxLqqQ9cK9Ue0Kwze8univMcpbGJQ72guhf5N8fWyCEb_sUnjsUHSWoZpuCqOjlGkdAtrVbqN2jxlBvyWTxidSpvGrCfP1YiCoTBqfDK3l1E-7xV102I1_l3_NaIKO7WkG5olFPUSCDS8LYhersHmQiYMeC-p_O3NN6xXLqBeNqL9xddXpw7Jw",
    completed: false,
    timeOfDay: "evening"
  },
  {
    id: "e_step_3",
    stepNumber: 3,
    productId: "lrp_b5",
    variantId: "lrp_b5_40ml",
    category: "Step 3 • Night Restorative Balm",
    categoryZh: "第 3 步 • 夜间屏障修护",
    title: "La Roche-Posay Cicaplast Baume B5+",
    titleZh: "理肤泉 B5+ 多效修护舒缓霜",
    subtitle: "5% Panthenol • Madecassoside",
    subtitleZh: "5% 维生素原B5 • 积雪草苷",
    details: "Emulsify pea-sized amount between fingers, press gently.",
    detailsZh: "指腹温热乳化5秒后轻柔按压，在干燥泛红处形成保护膜。",
    howToUse: "Warm a small pea-sized amount between clean fingertips for 5s, press lightly onto cheeks or dry spots.",
    howToUseZh: "取黄豆大小在指腹轻揉乳化5秒，轻柔按压在两颊干燥泛红部位，避免大力摩擦。",
    whyInRoutine: "Intensive stratum corneum recovery overnight with 5% Panthenol and Madecassoside.",
    whyInRoutineZh: "5%高浓度维生素原B5密集修护角质层，夜间封层锁水，次日清晨肌肤平滑安抚。",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4VJoUDaE0NPjUFAMV7c8hHg54SsP3QxrX7VMthRIz-SHsaPYhklpZN4fPIg0koXAwg6M0ST9XmbPWbdxtS5Yrf0_as7c9Pbx1fSYQHELEh1KEVqMmc8Od-GEKN28LK-OYKxDjzoUYBqrb-Wln11U2fQz9G_uAIKRkLIUdj4EkC02gqu7SpeLBpyDkR-xQNWTD-2QAMkRSo7PCPD7qktp2XaCY-MUW960SQurZXuipYV9I4Egs2WDEhA",
    isKeyHero: true,
    completed: false,
    timeOfDay: "evening"
  }
];

export const INITIAL_APPOINTMENT: InStoreAppointment = {
  storeName: "Watsons Shanghai West Nanjing Road Flagship",
  storeNameZh: "屈臣氏 上海南京西路旗舰店",
  storeCode: "Store #108 • 2F Skin Sanctuary",
  address: "1088 West Nanjing Rd, Jing'an District, Shanghai",
  addressZh: "上海市静安区南京西路1088号2层美肤专区",
  distance: "0.8 km",
  date: "Tomorrow",
  dateZh: "明日",
  time: "14:30 – 15:00",
  advisorName: "Sherry Chen",
  advisorRole: "Senior Skincare Consultant",
  advisorRoleZh: "资深专柜美肤顾问",
  advisorAvatar: ADVISOR_AVATAR,
  perkName: "Curél / Cicaplast travel sample ready at counter",
  perkNameZh: "专柜精选修护旅行装小样（已备妥待领）",
  status: "confirmed",
  qrCodeId: "WAT-SH-9820-LIN"
};
