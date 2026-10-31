/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ScreenId, 
  Language, 
  RoutineStep, 
  ProductItem, 
  CartItem,
  UserProfile,
  InStoreAppointment,
  SkinAssessmentState,
  SkinAssessmentResult,
  SkinAssessmentHistoryRecord,
  DeliveryAddress,
  OrderRecord,
  QuestionnaireDraft,
  QuestionnaireHistoryRecord,
  SkinProfileQuestionnaireAnswers,
  RoutineReminders
} from './types';
import { getLocalDateString, isTodayCheckedIn } from './utils/routineUtils';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ShopScreen } from './components/ShopScreen';
import { CartScreen } from './components/CartScreen';
import { RoutineScreen } from './components/RoutineScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdvisorScreen } from './components/AdvisorScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { CounterPassModal } from './components/modals/CounterPassModal';
import { AdvisorChatModal } from './components/modals/AdvisorChatModal';
import { StoreDirectionsModal } from './components/modals/StoreDirectionsModal';
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { SkinProfileQuestionnaireModal } from './components/modals/SkinProfileQuestionnaireModal';
import { QuestionnaireHistoryModal } from './components/modals/QuestionnaireHistoryModal';
import { 
  USER_AVATAR,
  INITIAL_MORNING_STEPS, 
  INITIAL_EVENING_STEPS, 
  INITIAL_APPOINTMENT 
} from './data/mockData';
import { WATSONS_PRODUCT_CATALOGUE, ProductRecord, getProductById } from './data/productCatalogue';
import { 
  synthesizeQuestionnaireReport, 
  deriveSkinProfileFromAnswers 
} from './utils/questionnaireLogic';
import { 
  auth, 
  onAuthStateChanged, 
  signOut,
  loadUserDataFromFirestore,
  saveUserProfileToFirestore,
  saveUserRoutineToFirestore,
  saveUserCartToFirestore,
  saveAssessmentRecordToFirestore,
  deleteAssessmentRecordFromFirestore,
  clearAssessmentHistoryFromFirestore,
  saveOrderToFirestore,
  saveQuestionnaireRecordToFirestore,
  User
} from './firebase';
import { AuthScreen } from './components/AuthScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [language, setLanguage] = useState<Language>('zh');

  // Firebase Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // 1. Persistent User Profile (starts empty for new accounts, no hardcoded 'Lin')
  const [userProfile, setUserProfile] = useState<UserProfile>({
    nickname: '',
    avatar: USER_AVATAR,
    skinType: 'not_sure',
    concerns: [],
    budget: '150_300',
    preferences: '',
    ingredientsToAvoid: ''
  });

  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    if (currentUser) {
      saveUserProfileToFirestore(currentUser.uid, updated);
    }
  };

  // Clear in-memory user data when logging out or switching accounts
  const clearUserDataInMemory = () => {
    setUserProfile({
      nickname: '',
      avatar: USER_AVATAR,
      skinType: 'not_sure',
      concerns: [],
      budget: '150_300',
      preferences: '',
      ingredientsToAvoid: ''
    });
    setMorningSteps([]);
    setEveningSteps([]);
    setCartItems([]);
    setOrders([]);
    setHistoryRecords([]);
    setQuestionnaireHistory([]);
    setQuestionnaireDraft(null);
    setCheckInHistory([]);
    setRoutineName('我的护肤方案');
    setRoutineReminders({
      morning: { enabled: false, time: '08:00' },
      evening: { enabled: false, time: '22:00' }
    });
  };

  // 2. Active AI Skin Assessment session state (fresh sessions start empty)
  const [assessmentState, setAssessmentState] = useState<SkinAssessmentState>(() => {
    return {
      consentGiven: false,
      photoUrl: null,
      photoBase64: null,
      mimeType: 'image/jpeg',
      method: null,
      answers: {
        oiliness: 'combo',
        sensitivity: 'occasional',
        goals: ['barrier_support'],
        budget: '150_300'
      },
      isAnalyzing: false,
      isCompleted: false,
      savedToProfile: false,
      resultsData: null,
      userCorrections: {}
    };
  });

  // 2.1 Persistent Skin Assessment History Records
  const [historyStatus, setHistoryStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [historyRecords, setHistoryRecords] = useState<SkinAssessmentHistoryRecord[]>([]);
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<SkinAssessmentHistoryRecord | null>(null);

  // Load and listen to user-isolated data via Firebase Auth and Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setHistoryStatus('loading');

        try {
          // Load data strictly belonging to this authenticated user ID
          const data = await loadUserDataFromFirestore(user.uid);

          if (data.profile) {
            setUserProfile(data.profile);
          } else {
            // New account starts with clean profile using registered nickname
            const newProf: UserProfile = {
              nickname: user.displayName || user.email?.split('@')[0] || (language === 'zh' ? '美肤会员' : 'Member'),
              avatar: USER_AVATAR,
              skinType: 'not_sure',
              concerns: [],
              budget: '150_300',
              preferences: '',
              ingredientsToAvoid: ''
            };
            setUserProfile(newProf);
            await saveUserProfileToFirestore(user.uid, newProf);
          }

          // New account starts with clean empty personal data
          setMorningSteps(data.morningSteps || []);
          setEveningSteps(data.eveningSteps || []);
          setRoutineName(data.routineName || '我的护肤方案');
          setRoutineReminders(data.routineReminders);
          setCheckInHistory(data.checkInHistory || []);
          setCartItems(data.cartItems || []);
          setHistoryRecords(data.assessmentHistory || []);
          setQuestionnaireHistory(data.questionnaireHistory || []);
          setOrders(data.orders || []);
          setHistoryStatus('success');
        } catch (err) {
          console.error('Error loading user data from Firestore:', err);
          setHistoryStatus('error');
        }
      } else {
        setCurrentUser(null);
        clearUserDataInMemory();
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [language]);

  const handleLogout = async () => {
    try {
      clearUserDataInMemory();
      await signOut(auth);
      showToast(language === 'zh' ? '已安全退出登录' : 'Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadHistoryRecords = () => {
    if (currentUser) {
      loadUserDataFromFirestore(currentUser.uid).then((data) => {
        setHistoryRecords(data.assessmentHistory || []);
        setHistoryStatus('success');
      });
    }
  };

  // Save actual completed assessment result to history archive with deduplication
  const handleSaveCompletedAssessment = (
    result: SkinAssessmentResult,
    method: 'camera' | 'upload' | 'questionnaire' | null
  ): boolean => {
    if (!result) return false;

    try {
      const resultTimestamp = result.date ? new Date(result.date).getTime() : Date.now();
      const recordId = `rec_${resultTimestamp}`;

      // Deduplication: prevent duplicate rows if re-rendered or already saved
      const alreadySaved = historyRecords.some(
        (r) => r.id === recordId || (r.resultsSnapshot.date && r.resultsSnapshot.date === result.date)
      );

      if (alreadySaved) {
        setAssessmentState((prev) => ({ ...prev, savedToProfile: true }));
        return true;
      }

      const resolvedMethod = method || (result.observations && result.observations.length > 0 ? 'photo' : 'questionnaire');
      const methodZh = resolvedMethod === 'camera'
        ? '实拍测肤'
        : resolvedMethod === 'upload'
        ? '照片上传'
        : '问卷自评';
      const methodEn = resolvedMethod === 'camera'
        ? 'Camera Scan'
        : resolvedMethod === 'upload'
        ? 'Photo Upload'
        : 'Questionnaire';

      const newRecord: SkinAssessmentHistoryRecord = {
        id: recordId,
        createdAt: result.date || new Date().toISOString(),
        method: resolvedMethod as any,
        methodZh,
        methodEn,
        summary: result.analysis?.summary || result.barrierCondition || '基于当前测肤生成的护肤建议',
        skinType: result.skin_type,
        hasOpticalRadar: Boolean(result.radarDimensions && result.radarDimensions.some(d => d.canAssess && d.level !== null)),
        resultsSnapshot: JSON.parse(JSON.stringify(result)) // Clean snapshot without huge raw photo base64
      };

      const updated = [newRecord, ...historyRecords];
      setHistoryRecords(updated);
      setAssessmentState((prev) => ({ ...prev, savedToProfile: true }));

      // Persist to Firestore for authenticated user
      if (currentUser) {
        saveAssessmentRecordToFirestore(currentUser.uid, newRecord);
      }
      return true;
    } catch (err) {
      console.error('Failed to save assessment record:', err);
      showToast(language === 'zh' ? '测肤档案保存失败，请检查网络连接' : 'Failed to save assessment to history.');
      return false;
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    try {
      const updated = historyRecords.filter((r) => r.id !== recordId);
      setHistoryRecords(updated);
      if (currentUser) {
        deleteAssessmentRecordFromFirestore(currentUser.uid, recordId);
      }
      showToast(language === 'en' ? 'Record deleted.' : '已删除该条测肤记录。');
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const handleClearAllHistory = () => {
    try {
      setHistoryRecords([]);
      if (currentUser) {
        clearAssessmentHistoryFromFirestore(currentUser.uid);
      }
      showToast(language === 'en' ? 'All records deleted.' : '已清空所有测肤档案记录。');
    } catch (err) {
      console.error('Failed to clear records:', err);
    }
  };

  const handleViewRecord = (record: SkinAssessmentHistoryRecord) => {
    setViewingHistoryRecord(record);
    setCurrentScreen('assessment');
  };

  const handleCloseHistoryView = () => {
    setViewingHistoryRecord(null);
  };

  // Legacy single saved assessment fallback for backwards compatibility
  const savedAssessment = historyRecords[0]?.resultsSnapshot || null;

  const handleSaveAssessmentToProfile = () => {
    if (assessmentState.resultsData) {
      handleSaveCompletedAssessment(assessmentState.resultsData, assessmentState.method);
      showToast(language === 'en' ? 'Saved summary to your profile.' : '已将测肤摘要保存至个人中心！');
    }
  };

  // 2.2 Questionnaire Persistent Draft & History State
  const [questionnaireDraft, setQuestionnaireDraft] = useState<QuestionnaireDraft | null>(() => {
    try {
      const raw = localStorage.getItem('watsons_questionnaire_draft');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [questionnaireHistory, setQuestionnaireHistory] = useState<QuestionnaireHistoryRecord[]>(() => {
    try {
      const raw = localStorage.getItem('watsons_questionnaire_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [isQuestionnaireHistoryOpen, setIsQuestionnaireHistoryOpen] = useState(false);

  const handleDiscardQuestionnaireDraft = () => {
    try {
      localStorage.removeItem('watsons_questionnaire_draft');
    } catch {}
    setQuestionnaireDraft(null);
    showToast(language === 'zh' ? '自评问卷草稿已清空' : 'Draft discarded');
  };

  const handleSubmitQuestionnaire = (answers: SkinProfileQuestionnaireAnswers) => {
    try {
      // 1. Synthesize grounded report using real answers and product catalogue
      const synthesizedReport = synthesizeQuestionnaireReport(
        answers,
        savedAssessment || assessmentState.resultsData,
        userProfile
      );

      // 2. Derive summary for archive
      const summary = deriveSkinProfileFromAnswers(answers);
      const now = new Date();
      const qId = `Q-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

      const historyRecord: QuestionnaireHistoryRecord = {
        id: qId,
        createdAt: now.toISOString(),
        summary,
        answers: JSON.parse(JSON.stringify(answers)),
        associatedReport: synthesizedReport
      };

      const updatedHistory = [historyRecord, ...questionnaireHistory];
      setQuestionnaireHistory(updatedHistory);
      if (currentUser) {
        saveQuestionnaireRecordToFirestore(currentUser.uid, historyRecord);
      }
      setQuestionnaireDraft(null);

      // 3. Update active assessment state & savedAssessment
      setAssessmentState((prev) => ({
        ...prev,
        isCompleted: true,
        savedToProfile: true,
        resultsData: synthesizedReport,
        method: prev.method || 'questionnaire'
      }));

      // Also append to main assessment history records
      handleSaveCompletedAssessment(synthesizedReport, 'questionnaire');

      // 4. Update userProfile if skinType or concerns were specified
      if (summary.skinTypeKey && summary.skinTypeKey !== 'not_sure') {
        const updatedProf: UserProfile = {
          ...userProfile,
          skinType: summary.skinTypeKey,
          concerns: Array.from(new Set([...userProfile.concerns, ...answers.concerns])),
          preferences: answers.texturePreference ? `${userProfile.preferences}、${summary.textureZh}` : userProfile.preferences,
          ingredientsToAvoid: answers.avoidIngredientsInput || userProfile.ingredientsToAvoid
        };
        handleSaveProfile(updatedProf);
      }

      // Close modal & notify
      setIsQuestionnaireModalOpen(false);
      showToast(language === 'zh' ? '问卷已提交，已更新多维自评护肤方案！' : 'Questionnaire submitted! Report updated.');
      
      // Navigate to assessment results screen to view the updated report immediately
      setViewingHistoryRecord(null);
      setCurrentScreen('assessment');
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
      showToast(language === 'zh' ? '提交失败，请重试' : 'Submission failed.');
    }
  };

  const handleViewQuestionnaireReport = (report: SkinAssessmentResult, record: QuestionnaireHistoryRecord) => {
    // Convert to viewing history snapshot
    const historySnapshot: SkinAssessmentHistoryRecord = {
      id: `rec_${record.id}`,
      createdAt: record.createdAt,
      method: 'questionnaire',
      methodZh: `自评问卷 (${record.summary.skinTypeZh})`,
      methodEn: `Questionnaire (${record.summary.skinTypeEn})`,
      summary: record.summary.summaryTextZh || `自评【${record.summary.skinTypeZh}】`,
      skinType: record.summary.skinTypeZh,
      hasOpticalRadar: Boolean(report.radarDimensions && report.radarDimensions.length > 0),
      resultsSnapshot: report
    };
    setViewingHistoryRecord(historySnapshot);
    setIsQuestionnaireHistoryOpen(false);
    setCurrentScreen('assessment');
  };

  // Shared startNewAssessment function for ALL entry points (Home, Profile, Results)
  const [assessmentSessionId, setAssessmentSessionId] = useState<number>(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const startNewAssessment = () => {
    // 1. Abort any active in-flight request
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    // 2. Increment session ID so any pending response is discarded
    setAssessmentSessionId((prev) => prev + 1);

    // 3. Clear any viewing history record
    setViewingHistoryRecord(null);

    // 4. Reset active session state completely
    setAssessmentState({
      consentGiven: false,
      photoUrl: null,
      photoBase64: null,
      mimeType: 'image/jpeg',
      method: null,
      answers: {
        oiliness: 'combo',
        sensitivity: 'occasional',
        goals: ['barrier_support'],
        budget: '150_300'
      },
      isAnalyzing: false,
      isCompleted: false,
      savedToProfile: false,
      resultsData: null,
      error: null,
      userCorrections: {}
    });

    // 4. Navigate to Home
    setCurrentScreen('home');
  };

  // 3. Persistent Cart state (user-isolated)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Sync cart to Firestore for authenticated user
  useEffect(() => {
    if (currentUser) {
      saveUserCartToFirestore(currentUser.uid, cartItems);
    }
  }, [currentUser, cartItems]);

  const handleAddToCart = (product: ProductItem, quantityToAdd: number = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        // Increase quantity of existing product variant - NO DUPLICATE ROWS
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          variantId: `${product.id}_default`,
          product,
          quantity: quantityToAdd,
          selected: true
        };
        return [...prev, newItem];
      }
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast(language === 'en' ? 'Item removed from cart' : '已从购物车移除商品');
  };

  const handleToggleCartSelect = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleSelectAllCart = () => {
    setCartItems((prev) => {
      const allSelected = prev.every((item) => item.selected);
      return prev.map((item) => ({ ...item, selected: !allSelected }));
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // 3.5. Persistent Orders State (Empty for new users!)
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const handleCreateOrder = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (currentUser) {
      saveOrderToFirestore(currentUser.uid, newOrder);
    }
  };

  // 3.6. Persistent Delivery Addresses State
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>(() => {
    try {
      const saved = localStorage.getItem('watsons_addresses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'addr_default_lin',
        recipient: 'Lin',
        phone: '13812345678',
        region: '上海市 静安区',
        detail: '南京西路1601号 越洋广场 22层',
        isDefault: true
      }
    ];
  });

  const handleSaveAddress = (address: DeliveryAddress) => {
    setSavedAddresses((prev) => {
      const exists = prev.some((a) => a.id === address.id);
      let updated: DeliveryAddress[];
      if (exists) {
        updated = prev.map((a) => (a.id === address.id ? address : a));
      } else {
        updated = [address, ...prev];
      }
      try {
        localStorage.setItem('watsons_addresses', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 4. Persistent Morning & Evening Routine state (Empty for new accounts)
  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
  const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);

  // Auto-sync routine to Firestore for authenticated user
  useEffect(() => {
    if (currentUser) {
      saveUserRoutineToFirestore(currentUser.uid, {
        morningSteps,
        eveningSteps,
        routineName,
        routineReminders,
        checkInHistory
      });
    }
  }, [currentUser, morningSteps, eveningSteps, routineName, routineReminders, checkInHistory]);

  // 4.1 Daily Single Check-in Persistence (Array of YYYY-MM-DD local strings)
  const [checkInHistory, setCheckInHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('watsons_checkin_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const handleCheckInToday = () => {
    const todayStr = getLocalDateString();
    setCheckInHistory((prev) => {
      if (prev.includes(todayStr)) return prev;
      const updated = [...prev, todayStr];
      try {
        localStorage.setItem('watsons_checkin_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 4.2 Persistent Routine Name (defaults to "我的护肤方案")
  const [routineName, setRoutineName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('watsons_routine_name');
      if (saved) return saved;
    } catch {}
    return '我的护肤方案';
  });

  const handleUpdateRoutineName = (name: string) => {
    setRoutineName(name);
    try {
      localStorage.setItem('watsons_routine_name', name);
    } catch {}
  };

  // 4.3 Persistent Routine Reminders Settings
  const [routineReminders, setRoutineReminders] = useState<RoutineReminders>(() => {
    try {
      const saved = localStorage.getItem('watsons_routine_reminders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      morning: { enabled: false, time: '08:00' },
      evening: { enabled: false, time: '22:00' }
    };
  });

  const handleSaveRoutineReminders = (reminders: RoutineReminders) => {
    setRoutineReminders(reminders);
    try {
      localStorage.setItem('watsons_routine_reminders', JSON.stringify(reminders));
    } catch {}
  };

  const [appointment, setAppointment] = useState<InStoreAppointment>(INITIAL_APPOINTMENT);

  // Modals state
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Routine active tab state for navigating to relevant routine tab
  const [routineActiveTab, setRoutineActiveTab] = useState<'morning' | 'evening'>('morning');

  // Custom Catalogue state (if imported by user)
  const [customCatalogue, setCustomCatalogue] = useState<ProductRecord[] | undefined>(undefined);

  // Toast feedback state with optional action
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onAction: () => void } | null>(null);

  const showToast = (message: string, action?: { label: string; onAction: () => void }) => {
    setToastMessage(message);
    setToastAction(action || null);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
      setToastAction(null);
    }, 3500);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'zh' : 'en';
    setLanguage(next);
    showToast(next === 'en' ? 'Switched to English' : '已切换至简体中文');
  };

  // Adding product to routine with duplicate check
  const handleAddToRoutine = (product: ProductItem, timeOfDay: 'morning' | 'evening' = 'morning') => {
    const targetSteps = timeOfDay === 'morning' ? morningSteps : eveningSteps;

    // Duplicate check: Notify user instead of silently duplicating!
    const alreadyExists = targetSteps.some(
      (s) => s.productId === product.id || s.title === product.name || s.titleZh === product.nameZh
    );

    if (alreadyExists) {
      showToast(
        language === 'en'
          ? `【${product.name}】is already in your ${timeOfDay} routine!`
          : `【${product.nameZh}】已存在于您的${timeOfDay === 'morning' ? '晨间' : '晚间'}方案中，无需重复添加！`
      );
      return;
    }

    const newStep: RoutineStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stepNumber: targetSteps.length + 1,
      productId: product.id,
      category: `Step ${targetSteps.length + 1} • ${product.category.toUpperCase()}`,
      categoryZh: `第 ${targetSteps.length + 1} 步 • ${product.category}`,
      title: product.name,
      titleZh: product.nameZh,
      subtitle: product.keyActives.slice(0, 2).join(' • '),
      subtitleZh: product.keyActives.slice(0, 2).join(' • '),
      details: product.whyMatches,
      detailsZh: product.whyMatchesZh,
      howToUse: product.texture,
      howToUseZh: product.textureZh,
      whyInRoutine: product.whyMatches,
      whyInRoutineZh: product.whyMatchesZh,
      image: product.image,
      completed: false,
      timeOfDay
    };

    if (timeOfDay === 'morning') {
      setMorningSteps((prev) => [...prev, newStep]);
    } else {
      setEveningSteps((prev) => [...prev, newStep]);
    }

    showToast(
      language === 'en'
        ? `Added ${product.name} to ${timeOfDay} routine!`
        : `已将【${product.nameZh}】添加至${timeOfDay === 'morning' ? '晨间' : '晚间'}护肤方案！`
    );
  };

  // Dedicated routine recommendation handler for AI skin assessment
  const handleApplyRecommendationToRoutine = (
    product: ProductItem,
    selection: 'morning' | 'evening' | 'both' = 'morning'
  ) => {
    const isZh = language === 'zh';
    const primaryRecord = getProductById(product.id);
    const prodId = primaryRecord?.product_id || product.id;
    const variantId = primaryRecord?.variant_id;
    const prodTitle = primaryRecord?.name || product.name;
    const prodTitleZh = primaryRecord?.name_zh || product.nameZh;

    const existsInMorning = morningSteps.some(
      (s) =>
        (variantId && s.variantId === variantId) ||
        (s.productId && s.productId === prodId) ||
        s.title === prodTitle ||
        s.titleZh === prodTitleZh
    );

    const existsInEvening = eveningSteps.some(
      (s) =>
        (variantId && s.variantId === variantId) ||
        (s.productId && s.productId === prodId) ||
        s.title === prodTitle ||
        s.titleZh === prodTitleZh
    );

    const createStep = (targetTime: 'morning' | 'evening', existingCount: number): RoutineStep => {
      const stepIdx = existingCount + 1;
      return {
        id: `step_${targetTime}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stepNumber: stepIdx,
        productId: prodId,
        variantId: variantId || `${prodId}_variant`,
        category: `Step ${stepIdx} • ${((primaryRecord?.category || product.category) as string).toUpperCase()}`,
        categoryZh: `第 ${stepIdx} 步 • ${primaryRecord?.category || product.category}`,
        title: prodTitle,
        titleZh: prodTitleZh,
        subtitle: primaryRecord?.ingredients ? primaryRecord.ingredients.slice(0, 2).join(' • ') : product.keyActives.slice(0, 2).join(' • '),
        subtitleZh: primaryRecord?.ingredients ? primaryRecord.ingredients.slice(0, 2).join(' • ') : product.keyActives.slice(0, 2).join(' • '),
        details: targetTime === 'morning'
          ? (primaryRecord?.usage_instructions.morning || primaryRecord?.usage_instructions.general || product.whyMatches)
          : (primaryRecord?.usage_instructions.evening || primaryRecord?.usage_instructions.general || product.whyMatches),
        detailsZh: targetTime === 'morning'
          ? (primaryRecord?.usage_instructions.morning_zh || primaryRecord?.usage_instructions.general_zh || product.whyMatchesZh)
          : (primaryRecord?.usage_instructions.evening_zh || primaryRecord?.usage_instructions.general_zh || product.whyMatchesZh),
        howToUse: primaryRecord?.texture || product.texture,
        howToUseZh: primaryRecord?.texture_zh || product.textureZh,
        whyInRoutine: primaryRecord?.supported_benefits[0] || product.whyMatches,
        whyInRoutineZh: primaryRecord?.supported_benefits_zh[0] || product.whyMatchesZh,
        image: primaryRecord?.image_url || product.image,
        completed: false,
        timeOfDay: targetTime
      };
    };

    if (selection === 'morning') {
      if (existsInMorning) {
        showToast(
          isZh
            ? `【${prodTitleZh}】已存在于晨间护肤中，无需重复添加`
            : `【${prodTitle}】is already in your morning routine`
        );
        return;
      }
      setMorningSteps((prev) => [...prev, createStep('morning', prev.length)]);
      setRoutineActiveTab('morning');
      showToast(
        isZh ? '已加入晨间护肤' : 'Added to morning routine',
        {
          label: isZh ? '查看护肤方案' : 'View Routine',
          onAction: () => setCurrentScreen('my-routine')
        }
      );
    } else if (selection === 'evening') {
      if (existsInEvening) {
        showToast(
          isZh
            ? `【${prodTitleZh}】已存在于晚间护肤中，无需重复添加`
            : `【${prodTitle}】is already in your evening routine`
        );
        return;
      }
      setEveningSteps((prev) => [...prev, createStep('evening', prev.length)]);
      setRoutineActiveTab('evening');
      showToast(
        isZh ? '已加入晚间护肤' : 'Added to evening routine',
        {
          label: isZh ? '查看护肤方案' : 'View Routine',
          onAction: () => setCurrentScreen('my-routine')
        }
      );
    } else if (selection === 'both') {
      if (existsInMorning && existsInEvening) {
        showToast(
          isZh
            ? `【${prodTitleZh}】已存在于晨间与晚间护肤中，无需重复添加`
            : `【${prodTitle}】is already in both morning and evening routines`
        );
        return;
      } else if (existsInMorning && !existsInEvening) {
        setEveningSteps((prev) => [...prev, createStep('evening', prev.length)]);
        setRoutineActiveTab('evening');
        showToast(
          isZh ? '已加入晚间护肤（晨间已有该产品）' : 'Added to evening routine (already in morning routine)',
          {
            label: isZh ? '查看护肤方案' : 'View Routine',
            onAction: () => setCurrentScreen('my-routine')
          }
        );
      } else if (!existsInMorning && existsInEvening) {
        setMorningSteps((prev) => [...prev, createStep('morning', prev.length)]);
        setRoutineActiveTab('morning');
        showToast(
          isZh ? '已加入晨间护肤（晚间已有该产品）' : 'Added to morning routine (already in evening routine)',
          {
            label: isZh ? '查看护肤方案' : 'View Routine',
            onAction: () => setCurrentScreen('my-routine')
          }
        );
      } else {
        setMorningSteps((prev) => [...prev, createStep('morning', prev.length)]);
        setEveningSteps((prev) => [...prev, createStep('evening', prev.length)]);
        setRoutineActiveTab('morning');
        showToast(
          isZh ? '已加入晨间和晚间护肤' : 'Added to morning and evening routine',
          {
            label: isZh ? '查看护肤方案' : 'View Routine',
            onAction: () => setCurrentScreen('my-routine')
          }
        );
      }
    }
  };

  const morningCompletedCount = morningSteps.filter((s) => s.completed).length;
  const totalCartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Smooth loading splash screen while Firebase determines auth state (prevents login screen flashing)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4fafb] flex items-center justify-center p-4">
        <div className="w-full max-w-[430px] bg-white rounded-3xl p-8 shadow-2xl border border-[#d0eff3] flex flex-col items-center justify-center text-center space-y-4">
          <img 
            src="/assets/aistudio/222_00d72993.png" 
            alt="Watsons" 
            className="h-10 w-auto object-contain mb-2" 
          />
          <div className="w-9 h-9 rounded-full border-3 border-[#0099A7] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-[#0099A7]">
            {language === 'zh' ? '正在连接屈臣氏美肤会员中心...' : 'Connecting to Watsons Member Center...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render registration & login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f4fafb] flex justify-center text-[#1f2937] overflow-x-hidden">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col relative overflow-x-hidden border-x border-[#e5f1f3]">
          <AuthScreen
            language={language}
            onAuthSuccess={(profile) => {
              setUserProfile(profile);
              setCurrentScreen('home');
            }}
            onShowToast={showToast}
          />
          {toastMessage && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1f2937] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold max-w-[92%] border border-[#374151] animate-fade-in">
              <span className="material-symbols-outlined text-sm text-[#0099A7] shrink-0">check_circle</span>
              <span className="truncate">{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4fafb] flex justify-center text-[#1f2937] overflow-x-hidden">
      {/* Mobile viewport container */}
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col relative overflow-x-hidden border-x border-[#e5f1f3]">
        {/* Sticky Top Header with authentic Watsons Logo */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          language={language}
          onToggleLanguage={toggleLanguage}
          onOpenNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        />

        {/* Notification Sheet Dropdown */}
        {isNotificationOpen && (
          <div className="absolute top-16 left-0 right-0 z-50 px-4 pt-2">
            <div className="w-full bg-white rounded-2xl p-4 shadow-xl border border-[#d0eff3] animate-fade-in flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0099A7]">
                  <span className="material-symbols-outlined text-sm">notifications_active</span>
                  <span>{language === 'en' ? 'Reminders & Notifications' : '提醒与消息中心'}</span>
                </div>
                <button 
                  onClick={() => setIsNotificationOpen(false)}
                  className="w-6 h-6 rounded-full bg-[#f0f9fa] flex items-center justify-center text-[#4b5563]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#f0f9fa] border border-[#d0eff3]">
                <span className="material-symbols-outlined text-base text-[#0099A7] shrink-0 mt-0.5">redeem</span>
                <div className="text-xs">
                  <p className="font-semibold text-[#1f2937]">
                    {language === 'en' ? 'Counter Sample Ready' : '专柜试用小样已备妥'}
                  </p>
                  <p className="text-[11px] text-[#4b5563] mt-0.5">
                    {language === 'en' 
                      ? 'Curél / Cicaplast travel sample reserved at Shanghai West Nanjing Road Flagship.'
                      : '专柜精选修护旅行装小样已在南京西路旗舰店备妥，欢迎明日到店体验。'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col w-full">
          {/* TAB 1: 首页 / Home */}
          {currentScreen === 'home' && (
            <HomeScreen
              language={language}
              onNavigate={setCurrentScreen}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
              onOpenPassModal={() => setIsPassModalOpen(true)}
              onOpenAdvisorChat={() => setCurrentScreen('ai-advisor')}
              onShowToast={showToast}
              assessmentState={assessmentState}
              setAssessmentState={setAssessmentState}
              morningCompletedCount={morningCompletedCount}
              totalMorningSteps={morningSteps.length}
              hasSavedRoutine={morningSteps.length > 0 || eveningSteps.length > 0}
              isTodayCheckedIn={isTodayCheckedIn(checkInHistory)}
              cumulativeStars={checkInHistory.length}
              onApplyRecommendationToRoutine={handleApplyRecommendationToRoutine}
              onAddToCart={handleAddToCart}
              userProfile={userProfile}
              savedAssessment={savedAssessment}
              onStartNewAssessment={startNewAssessment}
              assessmentSessionId={assessmentSessionId}
              onSaveCompletedAssessment={handleSaveCompletedAssessment}
            />
          )}

          {/* TAB 2: 商城 / Shop */}
          {currentScreen === 'shop' && (
            <ShopScreen
              language={language}
              onNavigate={setCurrentScreen}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setIsProductDetailOpen(true);
              }}
              onAddToCart={handleAddToCart}
              onAddToRoutine={(p) => handleAddToRoutine(p, 'morning')}
              onShowToast={showToast}
              customCatalogue={customCatalogue}
              onImportCatalogue={setCustomCatalogue}
            />
          )}

          {/* TAB 3: 购物车 / Cart */}
          {currentScreen === 'cart' && (
            <CartScreen
              language={language}
              onNavigate={setCurrentScreen}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onToggleSelect={handleToggleCartSelect}
              onToggleSelectAll={handleToggleSelectAllCart}
              onClearCart={handleClearCart}
              onShowToast={showToast}
              savedAddresses={savedAddresses}
              onSaveAddress={handleSaveAddress}
              onCreateOrder={handleCreateOrder}
            />
          )}

          {/* TAB 4: 每日护肤 / Daily Routine */}
          {currentScreen === 'my-routine' && (
            <RoutineScreen
              language={language}
              onNavigate={setCurrentScreen}
              morningSteps={morningSteps}
              setMorningSteps={setMorningSteps}
              eveningSteps={eveningSteps}
              setEveningSteps={setEveningSteps}
              appointment={appointment}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
              onOpenChatModal={() => setIsChatModalOpen(true)}
              onOpenPassModal={() => setIsPassModalOpen(true)}
              onShowToast={showToast}
              defaultTab={routineActiveTab}
              onTabChange={setRoutineActiveTab}
              checkInHistory={checkInHistory}
              onCheckInToday={handleCheckInToday}
              routineName={routineName}
              onUpdateRoutineName={handleUpdateRoutineName}
              routineReminders={routineReminders}
              onSaveRoutineReminders={handleSaveRoutineReminders}
              savedAssessment={savedAssessment || assessmentState.resultsData}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* TAB 5: 个人中心 / Profile */}
          {currentScreen === 'profile' && (
            <ProfileScreen
              language={language}
              onNavigate={setCurrentScreen}
              appointment={appointment}
              onOpenPassModal={() => setIsPassModalOpen(true)}
              onOpenChatModal={() => setCurrentScreen('ai-advisor')}
              onShowToast={showToast}
              assessmentState={assessmentState}
              savedAssessment={savedAssessment}
              historyRecords={historyRecords}
              historyStatus={historyStatus}
              onViewRecord={handleViewRecord}
              onDeleteRecord={handleDeleteRecord}
              onClearAllHistory={handleClearAllHistory}
              onRetryLoadHistory={loadHistoryRecords}
              onStartNewAssessment={startNewAssessment}
              userProfile={userProfile}
              onSaveProfile={handleSaveProfile}
              orders={orders}
              questionnaireDraft={questionnaireDraft}
              questionnaireHistory={questionnaireHistory}
              onOpenQuestionnaire={() => {
                try {
                  const raw = localStorage.getItem('watsons_questionnaire_draft');
                  setQuestionnaireDraft(raw ? JSON.parse(raw) : null);
                } catch {}
                setIsQuestionnaireModalOpen(true);
              }}
              onOpenQuestionnaireHistory={() => setIsQuestionnaireHistoryOpen(true)}
              onViewQuestionnaireReport={handleViewQuestionnaireReport}
              onDiscardQuestionnaireDraft={handleDiscardQuestionnaireDraft}
              userEmail={currentUser?.email || ''}
              onLogout={handleLogout}
            />
          )}

          {/* Fullscreen Dedicated View: AI Advisor Conversation Screen */}
          {currentScreen === 'ai-advisor' && (
            <AdvisorScreen
              language={language}
              onNavigate={setCurrentScreen}
              userProfile={userProfile}
              assessmentState={assessmentState}
              morningSteps={morningSteps}
              eveningSteps={eveningSteps}
              cartItems={cartItems}
              onOpenProductDetail={(p) => {
                setSelectedProduct(p);
                setIsProductDetailOpen(true);
              }}
              onAddToCart={handleAddToCart}
              onAddToRoutine={(p) => handleAddToRoutine(p, 'morning')}
              onShowToast={showToast}
            />
          )}

          {/* Fullscreen Dedicated View: Skin Assessment Results */}
          {currentScreen === 'assessment' && (
            <ResultsScreen
              language={language}
              onNavigate={setCurrentScreen}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
              onOpenChatModal={() => setCurrentScreen('ai-advisor')}
              onOpenPassModal={() => setIsPassModalOpen(true)}
              onOpenProductDetail={(p) => {
                setSelectedProduct(p);
                setIsProductDetailOpen(true);
              }}
              onAddToCart={handleAddToCart}
              onAddToRoutine={(p) => handleAddToRoutine(p, 'morning')}
              onAddToRoutineWithSelection={handleAddToRoutineWithSelection}
              onSaveToProfile={handleSaveAssessmentToProfile}
              onShowToast={showToast}
              assessmentState={assessmentState}
              onStartNewAssessment={startNewAssessment}
              viewingHistoryRecord={viewingHistoryRecord}
              onCloseHistoryView={handleCloseHistoryView}
            />
          )}
        </main>

        {/* Sticky Bottom Navigation: Exactly 5 tabs in specified order (hidden on full report view) */}
        {currentScreen !== 'assessment' && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            language={language}
            cartCount={totalCartItemCount}
          />
        )}

        {/* Global Toast Feedback */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1f2937] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold max-w-[92%] border border-[#374151] animate-fade-in">
            <span className="material-symbols-outlined text-sm text-[#0099A7] shrink-0">check_circle</span>
            <span className="truncate">{toastMessage}</span>
            {toastAction && (
              <button
                onClick={() => {
                  toastAction.onAction();
                  setToastMessage(null);
                  setToastAction(null);
                }}
                className="ml-1 px-2.5 py-0.5 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                type="button"
              >
                {toastAction.label}
              </button>
            )}
          </div>
        )}

        {/* Modals */}
        <CounterPassModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          appointment={appointment}
          language={language}
        />

        <AdvisorChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          language={language}
          productContext={selectedProduct?.name || 'Curél / La Roche-Posay'}
        />

        <StoreDirectionsModal
          isOpen={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          appointment={appointment}
          language={language}
        />

        <ProductDetailModal
          product={selectedProduct}
          isOpen={isProductDetailOpen}
          onClose={() => setIsProductDetailOpen(false)}
          onAddToCart={(p, qty) => {
            handleAddToCart(p, qty);
            showToast(language === 'en' ? `Added ${qty} item(s) to cart` : `已将 ${qty} 件商品加入购物车`);
          }}
          onAddToRoutine={(p) => handleAddToRoutine(p, 'morning')}
          onReserveSample={() => {
            setIsPassModalOpen(true);
            showToast(language === 'en' ? 'Sample reservation pass generated!' : '专柜试用领样码已生成！');
          }}
          language={language}
        />

        {/* Optional Skin-Profile Questionnaire Modal */}
        <SkinProfileQuestionnaireModal
          isOpen={isQuestionnaireModalOpen}
          onClose={() => setIsQuestionnaireModalOpen(false)}
          onSubmit={handleSubmitQuestionnaire}
          initialDraft={questionnaireDraft}
          onDiscardDraft={handleDiscardQuestionnaireDraft}
          onShowToast={showToast}
          language={language}
        />

        {/* Questionnaire History Modal */}
        <QuestionnaireHistoryModal
          isOpen={isQuestionnaireHistoryOpen}
          onClose={() => setIsQuestionnaireHistoryOpen(false)}
          records={questionnaireHistory}
          onViewReport={handleViewQuestionnaireReport}
          language={language}
        />
      </div>
    </div>
  );
}
