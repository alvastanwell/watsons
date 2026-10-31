export type Language = 'en' | 'zh';

// Exactly 5 bottom tabs: 'home' | 'shop' | 'cart' | 'my-routine' | 'profile'
// Full-screen views accessible from home: 'ai-advisor' | 'assessment'
export type ScreenId = 'home' | 'shop' | 'cart' | 'my-routine' | 'profile' | 'ai-advisor' | 'assessment';

export interface ProductItem {
  id: string;
  brand: string;
  name: string;
  nameZh: string;
  size: string;
  price: number;
  originalPrice?: number;
  matchScore?: number;
  matchTier?: string;
  matchTierZh?: string;
  tagline?: string;
  taglineZh?: string;
  image: string;
  bundleOffer?: string;
  bundleOfferZh?: string;
  whyMatches: string;
  whyMatchesZh: string;
  keyActives: string[];
  texture: string;
  textureZh: string;
  isFragranceFree: boolean;
  storePrivilege?: string;
  storePrivilegeZh?: string;
  category: 'treatment' | 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen' | 'mask';
  inStock: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  product: ProductItem;
  quantity: number;
  selected: boolean;
}

export interface RoutineStep {
  id: string;
  stepNumber: number;
  productId?: string;
  variantId?: string;
  category: string;
  categoryZh: string;
  title: string;
  titleZh: string;
  subtitle: string;
  subtitleZh: string;
  details: string;
  detailsZh: string;
  image: string;
  isKeyHero?: boolean;
  completed: boolean;
  timeOfDay: 'morning' | 'evening';
  howToUse?: string;
  howToUseZh?: string;
  whyInRoutine?: string;
  whyInRoutineZh?: string;
  ingredients?: string[];
}

export interface AssessmentAnswers {
  oiliness?: string;
  tightness?: string;
  sensitivity?: string;
  routine?: string[];
  goals?: string[];
  budget?: string;
  avoidIngredients?: string;
}

export interface GroundedObservation {
  facialArea: string;
  facialAreaZh: string;
  visibleFeature: string;
  visibleFeatureZh: string;
  visualEvidence: string;
  visualEvidenceZh: string;
  limitations: string;
  limitationsZh: string;
}

export type OpticalDimensionKey = 
  | 'visibleShine' 
  | 'visibleRedness' 
  | 'unevenTone' 
  | 'visibleTexture' 
  | 'visiblePores' 
  | 'visibleFineLines';

export interface VisualRadarDimension {
  key: OpticalDimensionKey;
  name: string;
  nameZh: string;
  level: number | null; // Broad 0-4 scale: higher = greater visible prominence; null if cannot assess
  levelLabel?: string;   // e.g. "Level 2 (Moderate)"
  levelLabelZh?: string; // e.g. "2级 (中度可见)"
  canAssess: boolean;
  evidence: string;
  evidenceZh: string;
  facialArea: string;
  facialAreaZh: string;
  limitations: string;
  limitationsZh: string;
}

export interface SixDimensionObservation {
  dimensionKey: 'hydration' | 'oiliness' | 'barrier' | 'pores' | 'sensitivity' | 'smoothness';
  name: string;
  nameZh: string;
  status: string;
  statusZh: string;
  evidence: string;
  evidenceZh: string;
  isDeterminable: boolean;
}

export interface SkinAssessmentResult {
  isSuitablePhoto: boolean;
  suitabilityReason?: string;
  observations: GroundedObservation[];
  sixDimensions?: SixDimensionObservation[];
  radarDimensions?: VisualRadarDimension[];
  userReportedSymptoms: {
    oiliness: string;
    tightness: string;
    sensitivity: string;
    goals: string[];
    budget: string;
  };
  suggestedCosmeticRegimen: {
    stepOrder: string[];
    keyActiveCategories: string[];
    applicationNotes: string;
    applicationNotesZh: string;
  };
  recommendedProducts: Array<{
    productId: string;
    reason: string;
    reasonZh: string;
    isPrimary: boolean;
  }>;
  limitationsNotice: string;
  limitationsNoticeZh: string;
  date: string;
  // Compatibility shortcuts
  skin_type?: string;
  confidenceNotice?: string;
  barrierCondition?: string;
  recommendedNextStep?: string;
  visibleShine?: string;
  visibleRedness?: string;
  visibleTexture?: string;
  recommendedProductId?: string;
  analysis?: {
    summary?: string;
    barrierCondition?: string;
    recommendedNextStep?: string;
    visibleShine?: string;
    visibleRedness?: string;
    visibleTexture?: string;
  };
  recommended_product?: {
    id: string;
    name: string;
    reason: string;
  };
}

export interface SkinAssessmentHistoryRecord {
  id: string;
  createdAt: string; // ISO timestamp of completion
  method: 'camera' | 'upload' | 'questionnaire' | 'photo';
  methodZh: string;
  methodEn: string;
  summary: string;
  skinType?: string;
  hasOpticalRadar: boolean;
  resultsSnapshot: SkinAssessmentResult;
}

export interface SkinAssessmentState {
  consentGiven: boolean;
  photoUrl: string | null;
  photoBase64: string | null;
  mimeType: string;
  method: 'camera' | 'upload' | 'questionnaire' | null;
  answers: AssessmentAnswers;
  isAnalyzing: boolean;
  isCompleted: boolean;
  savedToProfile: boolean;
  error?: string | null;
  isRealAI?: boolean;
  demoMode?: boolean;
  demoLabel?: string;
  resultsData?: SkinAssessmentResult | null;
  userCorrections: {
    shineCorrected?: string;
    rednessCorrected?: string;
    toneCorrected?: string;
  };
}

export interface UserProfile {
  nickname: string;
  avatar: string;
  skinType: 'normal' | 'dry' | 'oily' | 'combination' | 'not_sure';
  concerns: string[];
  budget: 'under_150' | '150_300' | '300_600' | 'above_600';
  preferences: string;
  ingredientsToAvoid: string;
  lastUpdated?: string;
}

export interface InStoreAppointment {
  storeName: string;
  storeNameZh: string;
  storeCode: string;
  address: string;
  addressZh: string;
  distance: string;
  date: string;
  dateZh: string;
  time: string;
  advisorName: string;
  advisorRole: string;
  advisorRoleZh: string;
  advisorAvatar: string;
  perkName: string;
  perkNameZh: string;
  status: 'confirmed' | 'pending' | 'completed';
  qrCodeId: string;
}

export interface DeliveryAddress {
  id: string;
  recipient: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  nameZh: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  purchaseMethod: 'online_delivery' | 'in_store_plan';
  deliveryAddress?: DeliveryAddress;
  storeInfo?: {
    storeName: string;
    storeNameZh: string;
    address: string;
    addressZh: string;
  };
  status: 'pending_dispatch' | 'plan_saved' | 'completed';
  statusZh: string;
  isDemo: boolean;
}

// -------------------------------------------------------------
// Optional Skin-Profile Questionnaire Types
// -------------------------------------------------------------

export interface SkinProfileQuestionnaireAnswers {
  // Group A: Perceived skin characteristics
  cleansingSensation: 'tight' | 'comfortable' | 'greasy' | 'unsure' | '';
  daytimeOiliness: 't_zone_only' | 'whole_face' | 'rarely_oily' | 'unsure' | '';
  drynessFrequency: 'frequent' | 'seasonal' | 'rare' | 'unsure' | '';

  // Group B: Self-reported reactions and tolerance
  productReactions: string[]; // e.g. ['stinging', 'redness', 'breakouts', 'none_known', 'unsure']
  environmentalTriggers: string[]; // e.g. ['temp_shifts', 'ac_heating', 'sun_exposure', 'dry_wind', 'none']

  // Group C: Current skin concerns
  concerns: string[]; // e.g. ['breakouts', 'uneven_tone', 'rough_texture', 'enlarged_pores', 'under_eye', 'redness']
  customConcernText: string;

  // Group D: Existing skincare habits
  routineCategories: string[]; // e.g. ['cleanser', 'toner', 'serum', 'cream', 'sunscreen', 'mask']
  sunscreenFrequency: 'daily' | 'sunny_days_only' | 'rarely' | 'unsure' | '';
  outdoorExposure: 'low' | 'moderate' | 'high' | 'unsure' | '';

  // Group E: Priorities and preferences
  primaryGoal: 'barrier_repair' | 'oil_control' | 'brightening' | 'deep_hydration' | 'anti_aging' | 'unsure' | '';
  texturePreference: 'light_gel' | 'silky_lotion' | 'rich_cream' | 'no_preference' | '';
  avoidIngredientsInput: string;
  specialNotes: string;
}

export interface QuestionnaireDraft {
  savedAt: string; // ISO string
  currentStep: number; // 0 to 4
  answers: SkinProfileQuestionnaireAnswers;
}

export interface QuestionnaireHistoryRecord {
  id: string; // e.g. "Q-20261031-1824"
  createdAt: string; // ISO string
  summary: {
    skinTypeZh: string;
    skinTypeEn: string;
    concernsZh: string[];
    toleranceZh: string;
    goalZh: string;
    textureZh: string;
    summaryTextZh?: string;
    primaryGoal?: string;
  };
  answers: SkinProfileQuestionnaireAnswers;
  associatedReport: SkinAssessmentResult;
}

export interface RoutineReminders {
  morning: {
    enabled: boolean;
    time: string;
  };
  evening: {
    enabled: boolean;
    time: string;
  };
}

export type RoutineCategoryKey = 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen' | 'other';
