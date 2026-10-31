import React, { useState, useRef, useEffect } from 'react';
import { Language, ScreenId, SkinAssessmentState, SkinAssessmentResult, UserProfile, ProductItem } from '../types';
import { translations } from '../data/translations';
import { ADVISOR_PROFILE_PHOTO } from '../data/mockData';
import { WATSONS_PRODUCT_CATALOGUE, getProductById, toProductItem } from '../data/productCatalogue';
import { SafeProductImage } from './common/SafeProductImage';
import { SkinRadarChart } from './SkinRadarChart';
import { RoutineSelectionSheet, RoutineSelectionType } from './modals/RoutineSelectionSheet';

interface HomeScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  onOpenStoreModal: () => void;
  onOpenPassModal: () => void;
  onOpenAdvisorChat: () => void;
  onShowToast: (msg: string) => void;
  assessmentState: SkinAssessmentState;
  setAssessmentState: React.Dispatch<React.SetStateAction<SkinAssessmentState>>;
  morningCompletedCount: number;
  totalMorningSteps: number;
  hasSavedRoutine?: boolean;
  isTodayCheckedIn?: boolean;
  cumulativeStars?: number;
  onApplyRecommendationToRoutine?: (product: ProductItem, selection: RoutineSelectionType) => void;
  onAddToCart?: (product: ProductItem) => void;
  userProfile?: UserProfile;
  savedAssessment?: SkinAssessmentResult | null;
  onStartNewAssessment?: () => void;
  assessmentSessionId?: number;
  onSaveCompletedAssessment?: (result: SkinAssessmentResult, method: 'camera' | 'upload' | 'questionnaire') => boolean;
}

type AssessmentStep = 
  | 'start'
  | 'consent'
  | 'capture' 
  | 'questionnaire'
  | 'analyzing' 
  | 'results'
  | 'error';

interface CameraErrorInfo {
  type: 'iframe_policy_blocked' | 'permission_denied' | 'not_found' | 'in_use' | 'unsupported_or_insecure' | 'unknown';
  title: string;
  description: string;
  isIframeBlocked: boolean;
  canRetry: boolean;
  grantInstructions?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onNavigate,
  onOpenStoreModal,
  onOpenPassModal,
  onOpenAdvisorChat,
  onShowToast,
  assessmentState,
  setAssessmentState,
  morningCompletedCount,
  totalMorningSteps,
  hasSavedRoutine = true,
  isTodayCheckedIn = false,
  cumulativeStars = 0,
  onApplyRecommendationToRoutine,
  onAddToCart,
  userProfile,
  savedAssessment,
  onStartNewAssessment,
  assessmentSessionId,
  onSaveCompletedAssessment
}) => {
  const t = translations[language];

  // Assessment step state
  const [assessmentStep, setAssessmentStep] = useState<AssessmentStep>(
    assessmentState.isCompleted && assessmentState.resultsData ? 'results' : 'start'
  );
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'upload'>('camera');
  // Consent is strictly NOT preselected: defaults to false!
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [showObservationDetails, setShowObservationDetails] = useState(false);
  const [cameraErrorInfo, setCameraErrorInfo] = useState<CameraErrorInfo | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Questionnaire state for alternative assessment without camera
  const [questionnaireData, setQuestionnaireData] = useState({
    oiliness: assessmentState.answers?.oiliness || 'combo',
    tightness: assessmentState.answers?.tightness || 'occasional',
    sensitivity: assessmentState.answers?.sensitivity || 'occasional',
    goals: assessmentState.answers?.goals || ['barrier_support'],
    budget: assessmentState.answers?.budget || '150_300'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const standaloneUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // When assessmentSessionId changes (new assessment started), reset to clean start state
  useEffect(() => {
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setConsentChecked(false);
    setErrorMessage(null);
    setCameraErrorInfo(null);
    setAssessmentStep('start');
  }, [assessmentSessionId]);

  // Sync assessmentStep with assessmentState completion
  useEffect(() => {
    if (!assessmentState.isCompleted || !assessmentState.resultsData) {
      if (assessmentStep === 'results') {
        setAssessmentStep('start');
      }
    } else {
      setAssessmentStep('results');
    }
  }, [assessmentState.isCompleted, assessmentState.resultsData]);

  // Classify getUserMedia error accurately
  const classifyCameraError = (err: any): CameraErrorInfo => {
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
    let isIframeBlocked = false;

    // Check Permissions-Policy API if available
    if (typeof document !== 'undefined' && (document as any).permissionsPolicy?.allowsFeature) {
      try {
        if (!(document as any).permissionsPolicy.allowsFeature('camera')) {
          isIframeBlocked = true;
        }
      } catch {}
    }

    const errName = err?.name || '';
    const errMsg = (err?.message || '').toLowerCase();

    // Check if blocked by iframe permissions policy
    if (
      isIframeBlocked ||
      errMsg.includes('permissions policy') ||
      errMsg.includes('feature policy') ||
      errMsg.includes('disallowed by permissions policy') ||
      (isInsideIframe && (errName === 'SecurityError' || errMsg.includes('permission denied by system')))
    ) {
      return {
        type: 'iframe_policy_blocked',
        title: t.cameraBlockedIframeTitle,
        description: t.cameraBlockedIframeDesc,
        isIframeBlocked: true,
        canRetry: true,
        grantInstructions: language === 'en'
          ? 'The preview frame restricts camera hardware access. Open the app in a standalone HTTPS tab to test the live camera, or upload a photo directly below.'
          : '当前预览 iframe 限制了摄像头硬件权限。请点击下方【在独立新标签页中打开】直接体验，或在下方选择【上传照片】。'
      };
    }

    // Insecure context or API missing
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return {
        type: 'unsupported_or_insecure',
        title: t.cameraUnsupportedTitle,
        description: t.cameraUnsupportedDesc + (language === 'en' ? ' (Insecure context: Not HTTPS or localhost)' : '（非安全上下文：非HTTPS环境）'),
        isIframeBlocked: false,
        canRetry: false
      };
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        type: 'unsupported_or_insecure',
        title: t.cameraUnsupportedTitle,
        description: t.cameraUnsupportedDesc,
        isIframeBlocked: false,
        canRetry: false
      };
    }

    // Permission denied
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      if (isInsideIframe) {
        return {
          type: 'permission_denied',
          title: t.cameraDeniedTitle,
          description: t.cameraDeniedDesc,
          isIframeBlocked: true,
          canRetry: true,
          grantInstructions: language === 'en'
            ? '1. Check the lock/camera icon in your browser address bar.\n2. Ensure camera is set to "Allow".\n3. If running inside a preview iframe, try "Open in Standalone Tab".'
            : '1. 请检查浏览器地址栏中的锁形或摄像头图标。\n2. 确保摄像头权限设置为【允许】。\n3. 若在预览环境受限，可点击【在独立新标签页中打开】。'
        };
      }

      return {
        type: 'permission_denied',
        title: t.cameraDeniedTitle,
        description: t.cameraDeniedDesc,
        isIframeBlocked: false,
        canRetry: true,
        grantInstructions: language === 'en'
          ? 'Click the camera or lock icon in your browser address bar → select "Allow" → click "Retry Camera".'
          : '请点击浏览器地址栏的锁形或相机图标 → 选择【允许】访问摄像头 → 点击【重试摄像头】。'
      };
    }

    // Camera not found
    if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      return {
        type: 'not_found',
        title: t.cameraNotFoundTitle,
        description: t.cameraNotFoundDesc,
        isIframeBlocked: false,
        canRetry: true,
        grantInstructions: language === 'en'
          ? 'Make sure a webcam is connected and recognized by your system, then click "Retry Camera".'
          : '请确保已连接摄像头设备并已被系统识别，然后点击【重试摄像头】。'
      };
    }

    // Camera in use / hardware error
    if (errName === 'NotReadableError' || errName === 'TrackStartError' || errName === 'AbortError') {
      return {
        type: 'in_use',
        title: t.cameraInUseTitle,
        description: t.cameraInUseDesc,
        isIframeBlocked: false,
        canRetry: true,
        grantInstructions: language === 'en'
          ? 'Close other video apps (Zoom, Teams, FaceTime) or other browser tabs that may be using the camera.'
          : '请关闭其他可能正在占用摄像头的应用（如会议软件）或其他浏览器标签页，然后重试。'
      };
    }

    return {
      type: 'unknown',
      title: t.cameraFailedTitle,
      description: `${t.cameraFailedMsg} (${errName}: ${err?.message || 'unknown'})`,
      isIframeBlocked: isInsideIframe,
      canRetry: true
    };
  };

  // Real Camera Activation (Requests camera only when called, uses front camera when available without resolution requirements)
  const startCamera = async () => {
    setCameraErrorInfo(null);
    stopCamera();
    setIsStartingCamera(true);

    try {
      if (!window.isSecureContext) {
        throw new Error('Insecure context: Camera requires HTTPS.');
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      // Front camera when available without requiring specific resolution
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
      } catch (facingErr: any) {
        // Fallback without facingMode in case of OverconstrainedError
        if (
          facingErr.name === 'OverconstrainedError' ||
          facingErr.name === 'ConstraintNotSatisfiedError'
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } else {
          throw facingErr;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      const errorInfo = classifyCameraError(err);
      setCameraErrorInfo(errorInfo);
      setIsCameraActive(false);
      setIsStartingCamera(false);
    }
  };

  // Copy standalone URL to clipboard
  const handleCopyStandaloneLink = () => {
    if (navigator.clipboard && standaloneUrl) {
      navigator.clipboard.writeText(standaloneUrl).then(() => {
        onShowToast(t.linkCopied);
      }).catch(() => {
        onShowToast(standaloneUrl);
      });
    } else {
      onShowToast(standaloneUrl);
    }
  };

  // Initiate assessment method with explicit consent step before access
  const handleInitiateMethod = (method: 'camera' | 'upload') => {
    setSelectedMethod(method);
    setConsentChecked(false); // strictly not preselected!
    setAssessmentStep('consent');
  };

  // Direct Execution calling server /api/assess-skin with captured photo or questionnaire
  const executeDirectAnalysis = async (
    photoBase64Str: string = '',
    mime: string = 'image/jpeg',
    assessmentType: 'camera' | 'upload' | 'questionnaire' = 'camera',
    customAnswers?: any
  ) => {
    // Hide live camera feed immediately
    stopCamera();
    setAssessmentStep('analyzing');
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Minimum delay to showcase the biometric analysis animation
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const activeAnswers = customAnswers || questionnaireData;
      const fetchPromise = fetch('/api/assess-skin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          photoBase64: photoBase64Str,
          mimeType: mime,
          consentGiven: true,
          language,
          assessmentType: assessmentType === 'questionnaire' ? 'questionnaire' : 'photo',
          answers: activeAnswers
        })
      });

      // Await both the minimum animation and the Gemini API response
      const [response] = await Promise.all([fetchPromise, minDelayPromise]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAssessmentState((prev) => ({
          ...prev,
          photoUrl: photoBase64Str || null,
          photoBase64: photoBase64Str || null,
          mimeType: mime,
          method: assessmentType,
          answers: activeAnswers,
          isAnalyzing: false,
          isCompleted: true,
          isRealAI: result.isRealAI,
          demoMode: result.demoMode,
          demoLabel: result.demoLabel,
          resultsData: result.data,
          savedToProfile: true,
          error: null
        }));
        setAssessmentStep('results');

        // Immediately save the completed result to archive using authorized consent
        if (onSaveCompletedAssessment) {
          onSaveCompletedAssessment(result.data, assessmentType);
        }
      } else {
        throw new Error(result.reason || result.error || t.errorMessage);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User cancelled
      }
      console.error('Skin assessment call failed:', err);
      setErrorMessage(err.message || t.errorMessage);
      setAssessmentStep('error');
    }
  };

  // Real File Upload handler: uploads photo and directly begins scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast(language === 'en' ? 'Please select an image file.' : '请选择有效的图片文件。');
      return;
    }

    const mime = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCameraErrorInfo(null);
      stopCamera();

      setAssessmentState((prev) => ({
        ...prev,
        photoUrl: result,
        photoBase64: result,
        mimeType: mime,
        method: 'upload',
        consentGiven: true
      }));

      // Directly enter scanning waiting state and execute analysis
      executeDirectAnalysis(result, mime, 'upload');
    };
    reader.onerror = () => {
      onShowToast(language === 'en' ? 'Failed to read image.' : '读取相册照片失败，请重试。');
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Real Shutter Snapshot: captures Canvas Base64 and directly starts scanning
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw mirrored video frame for front-facing camera
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();

      setAssessmentState((prev) => ({
        ...prev,
        photoUrl: dataUrl,
        photoBase64: dataUrl,
        mimeType: 'image/jpeg',
        method: 'camera',
        consentGiven: true
      }));

      // Directly enter scanning waiting state and execute analysis
      executeDirectAnalysis(dataUrl, 'image/jpeg', 'camera');
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAssessmentStep('capture');
    startCamera();
  };

  const handleResetAssessment = () => {
    stopCamera();
    setAssessmentState((prev) => ({
      ...prev,
      photoUrl: null,
      photoBase64: null,
      isCompleted: false,
      resultsData: null,
      error: null
    }));
    setAssessmentStep('capture');
    startCamera();
  };

  // Find recommended product based on assessment result from shared catalogue
  const recommendedProductId = assessmentState.resultsData?.recommendedProductId;
  const primaryRecord = recommendedProductId ? getProductById(recommendedProductId) : undefined;
  const matchedHeroProduct: ProductItem = primaryRecord
    ? toProductItem(primaryRecord, language)
    : toProductItem(WATSONS_PRODUCT_CATALOGUE[0], language);

  // Routine selection sheet modal state
  const [isRoutineSheetOpen, setIsRoutineSheetOpen] = useState(false);

  const handleOpenRoutineSheet = () => {
    setIsRoutineSheetOpen(true);
  };

  const handleConfirmAddToRoutine = (selection: RoutineSelectionType) => {
    if (onApplyRecommendationToRoutine) {
      onApplyRecommendationToRoutine(matchedHeroProduct, selection);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-5 py-4 space-y-5 pb-8">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* User Greeting & Status Indicator: Hidden unless supported by saved assessment or user-provided profile */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-headline text-xl font-bold text-[#1f2937] leading-tight">
            {userProfile?.nickname 
              ? (language === 'zh' ? `您好，${userProfile.nickname}` : `Hello, ${userProfile.nickname}`) 
              : (language === 'zh' ? '您好' : 'Hello')}
          </h2>
          <p className="text-xs text-[#4b5563] mt-0.5">
            {t.homeSubtitle}
          </p>
        </div>
        {Boolean(savedAssessment || (userProfile?.skinType && userProfile.skinType !== 'not_sure')) && (
          <div className="flex items-center gap-1.5 bg-[#f0f9fa] border border-[#d0eff3] px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span className="text-xs font-semibold text-[#0099A7]">
              {savedAssessment?.skin_type || (
                userProfile?.skinType === 'oily' ? (language === 'zh' ? '油性肌' : 'Oily') :
                userProfile?.skinType === 'dry' ? (language === 'zh' ? '干性肌' : 'Dry') :
                userProfile?.skinType === 'combination' ? (language === 'zh' ? '混合肌' : 'Combination') :
                userProfile?.skinType === 'normal' ? (language === 'zh' ? '中性肌' : 'Normal') :
                (language === 'zh' ? '已评估' : 'Assessed')
              )}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          PRIMARY ON-HOMEPAGE AI SKIN ASSESSMENT MODULE
         ========================================================================= */}
      <section className="w-full rounded-3xl bg-white border border-[#e5f1f3] shadow-sm overflow-hidden flex flex-col transition-all">
        {/* Module Header Bar (only displayed during active sub-steps: capture, analyzing, error, results) */}
        {assessmentStep !== 'start' && assessmentStep !== 'consent' && (
          <div className="bg-gradient-to-r from-[#007d89] to-[#0099A7] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-base">face_retouching_natural</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#d2eff2] uppercase tracking-wider block">
                  {t.assessmentTag}
                </span>
                <h3 className="font-headline font-bold text-sm text-white leading-tight">
                  {t.aiSkinAssessmentTitle}
                </h3>
              </div>
            </div>

            {assessmentStep !== 'results' && (
              <button
                onClick={() => {
                  stopCamera();
                  setAssessmentStep('start');
                }}
                className="text-xs text-white/80 hover:text-white"
                type="button"
              >
                {t.cancelBtn}
              </button>
            )}

            {assessmentStep === 'results' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {assessmentState.method === 'questionnaire'
                  ? (language === 'zh' ? '问卷自评' : 'Questionnaire')
                  : (language === 'zh' ? 'Gemini 视觉分析' : 'Gemini Vision')}
              </span>
            )}
          </div>
        )}

        {/* --- STATE 0: SIMPLIFIED HOMEPAGE CARD (EXACT USER SPECIFICATION) --- */}
        {assessmentStep === 'start' && (
          <div className="p-6 flex flex-col gap-4">
            {/* Simple icon, clear typography, generous spacing */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7] shrink-0">
                <span className="material-symbols-outlined text-2xl">face_retouching_natural</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline font-bold text-lg text-[#1f2937] leading-snug">
                  {language === 'zh' ? 'AI 智能测肤' : 'AI Skin Assessment'}
                </h3>
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  {language === 'zh' ? '拍照或上传照片，获取护肤参考建议。' : 'Take or upload a photo to get personalized skincare advice.'}
                </p>
              </div>
            </div>

            {/* Action buttons: Primary prominent, Secondary less prominent */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Primary button: 拍照测肤 */}
              <button
                onClick={() => handleInitiateMethod('camera')}
                className="w-full py-3.5 px-4 rounded-full bg-[#0099A7] text-white font-bold text-sm shadow-sm hover:bg-[#007d89] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                <span>{language === 'zh' ? '拍照测肤' : 'Take Photo for Assessment'}</span>
              </button>

              {/* Secondary button: 上传照片 (less visually prominent) */}
              <button
                onClick={() => handleInitiateMethod('upload')}
                className="w-full py-2.5 px-4 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-[#334155] font-semibold text-xs hover:bg-[#f1f5f9] hover:border-[#cbd5e1] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-base text-[#64748b]">upload_file</span>
                <span>{language === 'zh' ? '上传照片' : 'Upload Photo'}</span>
              </button>

              {/* Preserved questionnaire alternative */}
              <button
                onClick={() => setAssessmentStep('questionnaire')}
                className="mt-0.5 text-center text-xs text-[#0099A7] hover:underline font-medium py-1 transition-all"
                type="button"
              >
                {language === 'zh' ? '或填写问卷自评（免拍照）' : 'Or complete questionnaire self-test (no photo)'}
              </button>
            </div>

            {/* Small note at bottom */}
            <p className="text-center text-[11px] text-[#9ca3af] mt-1">
              {language === 'zh' ? '仅供日常护肤参考，非医疗诊断。' : 'For daily skincare reference only, not a medical diagnosis.'}
            </p>
          </div>
        )}

        {/* --- STATE: STEP 2 EXPLICIT CONSENT NOTICE (BEFORE CAMERA ACCESS OR PHOTO SUBMISSION) --- */}
        {assessmentStep === 'consent' && (
          <div className="p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f9fa]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#0099A7]">verified_user</span>
                <h4 className="font-headline font-bold text-xs text-[#1f2937]">
                  {language === 'zh' ? '授权与隐私说明' : 'Authorization & Privacy Notice'}
                </h4>
              </div>
              <button
                onClick={() => setAssessmentStep('start')}
                className="text-xs text-[#6b7280] hover:text-[#0099A7]"
                type="button"
              >
                {t.backBtn}
              </button>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] text-xs text-[#4b5563] space-y-2 leading-relaxed">
              <p>
                {language === 'zh'
                  ? '您的面部照片将通过云端安全接口提交由 Google Gemini 多模态模型进行多维度护肤特征与表观观察分析，仅用于为您生成日常护肤参考建议与屈臣氏正品匹配，不会公开传播。'
                  : 'Your photo will be securely transmitted to the Google Gemini multimodal model for cosmetic observation and product matching. It will not be shared publicly.'}
              </p>
              <p className="text-[11px] text-[#6b7280]">
                {language === 'zh'
                  ? '分析结果仅供日常护肤参考，非医疗诊断。'
                  : 'Skincare guidance is for daily cosmetic reference only, not a medical diagnosis.'}
              </p>
            </div>

            {/* Strictly NOT preselected consent checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="w-4 h-4 rounded text-[#0099A7] accent-[#0099A7] mt-0.5 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-[#1f2937] font-medium leading-relaxed">
                {language === 'zh'
                  ? '我已阅读并同意授权提交照片用于护肤分析'
                  : 'I have read and consent to submitting my photo for cosmetic analysis'}
              </span>
            </label>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  if (!consentChecked) {
                    onShowToast(language === 'zh' ? '请先勾选同意授权说明以继续。' : 'Please agree to the authorization notice to proceed.');
                    return;
                  }
                  setAssessmentState((prev) => ({ ...prev, consentGiven: true, method: selectedMethod }));
                  if (selectedMethod === 'camera') {
                    setAssessmentStep('capture');
                    startCamera();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full py-3 px-4 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-sm hover:bg-[#007d89] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  {selectedMethod === 'camera' ? 'photo_camera' : 'upload_file'}
                </span>
                <span>
                  {selectedMethod === 'camera'
                    ? (language === 'zh' ? '授权并开启摄像头' : 'Authorize & Start Camera')
                    : (language === 'zh' ? '授权并选择照片' : 'Authorize & Select Photo')}
                </span>
              </button>

              <button
                onClick={() => setAssessmentStep('start')}
                className="w-full py-2 rounded-full text-xs text-[#6b7280] hover:text-[#1f2937]"
                type="button"
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 1: BONE SCAN CAMERA CAPTURE (LIVE STREAM & DIAGNOSED FALLBACK) --- */}
        {assessmentStep === 'capture' && (
          <div className="p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1f2937]">
                {t.photoGuideTitle}
              </span>
              <button
                onClick={() => {
                  stopCamera();
                  setAssessmentStep('start');
                }}
                className="text-xs text-[#4b5563] hover:text-[#0099A7]"
                type="button"
              >
                {t.backBtn}
              </button>
            </div>

            {/* CAMERA ERROR / PERMISSION BLOCKED CARD */}
            {cameraErrorInfo ? (
              <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] space-y-3">
                <div className="flex items-center gap-2 text-[#991b1b]">
                  <span className="material-symbols-outlined text-lg">videocam_off</span>
                  <h5 className="font-bold text-xs">{cameraErrorInfo.title}</h5>
                </div>
                
                <p className="text-xs text-[#7f1d1d] leading-relaxed">
                  {cameraErrorInfo.description}
                </p>

                {cameraErrorInfo.grantInstructions && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-[#fecaca] text-[11px] text-[#7f1d1d] whitespace-pre-line leading-relaxed">
                    {cameraErrorInfo.grantInstructions}
                  </div>
                )}

                {/* Standalone Tab Link if inside iframe or preview environment */}
                {cameraErrorInfo.isIframeBlocked && (
                  <div className="p-3 bg-white rounded-xl border border-[#d0eff3] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#0099A7]">
                        {language === 'en' ? 'Standalone HTTPS Tab' : '独立安全窗口运行'}
                      </span>
                      <button
                        onClick={handleCopyStandaloneLink}
                        className="text-[10px] text-[#0099A7] hover:underline flex items-center gap-1 font-semibold"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-xs">content_copy</span>
                        <span>{t.copyStandaloneLink}</span>
                      </button>
                    </div>
                    <a
                      href={standaloneUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-[#f0f9fa] text-[#0099A7] font-bold text-xs text-center hover:bg-[#e0f5f7] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>{t.openStandaloneBtn}</span>
                    </a>
                  </div>
                )}

                {/* Primary Fallback Actions: Retry Camera or Direct Photo Upload */}
                <div className="flex flex-col gap-2 pt-1">
                  {cameraErrorInfo.canRetry && (
                    <button
                      onClick={startCamera}
                      className="w-full py-2.5 rounded-full bg-white border border-[#d0eff3] text-[#0099A7] font-semibold text-xs hover:bg-[#f0f9fa] flex items-center justify-center gap-1.5"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      <span>{t.retryCameraBtn}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setCameraErrorInfo(null);
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-3 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-sm hover:bg-[#007d89] flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    <span>{t.methodUpload}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* LIVE CAMERA FEED WITH BONE STRUCTURE SCANNING MESH OVERLAY */
              <div className="relative w-full h-72 rounded-2xl bg-[#00181c] overflow-hidden flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />

                {/* High-Tech Facial Bone Structure Alignment Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Outer Face Oval */}
                  <div className="w-48 h-60 rounded-[50%] border-2 border-[#0099A7]/80 shadow-[0_0_25px_rgba(0,153,167,0.35)] relative flex flex-col items-center justify-between py-5">
                    {/* Top Guide Pill */}
                    <span className="bg-black/70 backdrop-blur-md text-[#d2eff2] text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-xs">
                      {language === 'en' ? 'Align Facial Bone Contours' : '对准骨相与面部轮廓'}
                    </span>

                    {/* Landmark Crosshair Indicators */}
                    <div className="w-full px-6 flex justify-between items-center opacity-60">
                      <div className="w-3 h-0.5 bg-[#0099A7]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d2eff2] animate-ping"></div>
                      <div className="w-3 h-0.5 bg-[#0099A7]"></div>
                    </div>

                    {/* Chin Target Indicator */}
                    <div className="w-12 h-0.5 bg-[#0099A7]/80 rounded-full"></div>
                  </div>

                  {/* Corner Targeting Brackets */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#0099A7]/70"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#0099A7]/70"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#0099A7]/70"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#0099A7]/70"></div>
                </div>

                {isStartingCamera && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-2 z-10">
                    <span className="material-symbols-outlined text-2xl animate-spin text-[#0099A7]">refresh</span>
                    <span className="text-xs">{language === 'en' ? 'Starting camera stream...' : '正在开启摄像头...'}</span>
                  </div>
                )}
              </div>
            )}

            {!cameraErrorInfo && (
              <>
                <p className="text-[11px] text-[#4b5563] leading-relaxed">
                  {t.photoGuideInstructions}
                </p>

                {/* Shutter Button & Upload Option */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleCaptureSnapshot}
                    disabled={!isCameraActive}
                    className="w-full py-3.5 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-md hover:bg-[#007d89] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    <span>{t.takePhotoTrigger}</span>
                  </button>

                  <button
                    onClick={() => {
                      stopCamera();
                      setAssessmentStep('questionnaire');
                    }}
                    className="w-full py-2.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] font-semibold text-xs hover:bg-[#e0f5f7] flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    <span>{language === 'en' ? 'Switch to Questionnaire (No Photo)' : '切换问卷自测 (免开启摄像头)'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- STATE 1.5: INTERACTIVE QUESTIONNAIRE ALTERNATIVE --- */}
        {assessmentStep === 'questionnaire' && (
          <div className="p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#0099A7] text-base">quiz</span>
                <span className="text-xs font-bold text-[#1f2937]">
                  {language === 'en' ? 'Skincare Preference Questionnaire' : '护肤诉求与肤质自评问卷'}
                </span>
              </div>
              <button
                onClick={() => setAssessmentStep('start')}
                className="text-xs text-[#4b5563] hover:text-[#0099A7]"
                type="button"
              >
                {t.backBtn}
              </button>
            </div>

            <p className="text-[11px] text-[#6b7280]">
              {language === 'en' 
                ? 'Answer these 4 questions to generate a clinically grounded regimen from authentic Watsons products.' 
                : '如不方便使用摄像头或上传相片，完成以下 4 个日常护肤自选问题，AI 即可在正品库中为您匹配针对性配方。'}
            </p>

            {/* Q1: Oiliness tendency */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1f2937] block">
                {language === 'en' ? '1. Daily sebum & oiliness tendency:' : '1. 日常面部出油与水油倾向：'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'dry', labelZh: '干性缺水', labelEn: 'Dry' },
                  { value: 'combo', labelZh: '混合T区偏油', labelEn: 'Combination' },
                  { value: 'oily', labelZh: '偏油/易油光', labelEn: 'Oily' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuestionnaireData((prev) => ({ ...prev, oiliness: opt.value }))}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                      questionnaireData.oiliness === opt.value
                        ? 'bg-[#0099A7] text-white border-[#0099A7] shadow-xs'
                        : 'bg-[#f0f9fa] text-[#4b5563] border-[#d0eff3] hover:bg-[#e0f5f7]'
                    }`}
                  >
                    {language === 'en' ? opt.labelEn : opt.labelZh}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Tightness & Sensitivity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1f2937] block">
                {language === 'en' ? '2. Flushing & tightness frequency:' : '2. 洗脸后紧绷感与泛红刺激频率：'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'minimal', labelZh: '耐受稳定/极少', labelEn: 'Minimal' },
                  { value: 'occasional', labelZh: '换季偶尔紧绷泛红', labelEn: 'Occasional' },
                  { value: 'frequent', labelZh: '经常紧绷刺痛发热', labelEn: 'Frequent' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuestionnaireData((prev) => ({ ...prev, tightness: opt.value, sensitivity: opt.value }))}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                      questionnaireData.tightness === opt.value
                        ? 'bg-[#0099A7] text-white border-[#0099A7] shadow-xs'
                        : 'bg-[#f0f9fa] text-[#4b5563] border-[#d0eff3] hover:bg-[#e0f5f7]'
                    }`}
                  >
                    {language === 'en' ? opt.labelEn : opt.labelZh}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Primary Skincare Goals */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1f2937] block">
                {language === 'en' ? '3. Primary skincare target:' : '3. 核心护肤调理目标（单选或多选）：'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'barrier_support', labelZh: '屏障修护 (神经酰胺/B5)', labelEn: 'Barrier Support' },
                  { value: 'redness_relief', labelZh: '舒缓褪红 (积雪草/马齿苋)', labelEn: 'Redness Relief' },
                  { value: 'oil_balance', labelZh: '补水控油与毛孔调理', labelEn: 'Hydration & Pores' },
                  { value: 'anti_aging', labelZh: '淡纹紧致修护', labelEn: 'Firming Care' }
                ].map((opt) => {
                  const isSelected = questionnaireData.goals.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setQuestionnaireData((prev) => {
                          const exists = prev.goals.includes(opt.value);
                          if (exists && prev.goals.length > 1) {
                            return { ...prev, goals: prev.goals.filter((g) => g !== opt.value) };
                          } else if (!exists) {
                            return { ...prev, goals: [...prev.goals, opt.value] };
                          }
                          return prev;
                        });
                      }}
                      className={`py-2 px-2 text-left rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#f0f9fa] text-[#0099A7] border-[#0099A7]'
                          : 'bg-white text-[#4b5563] border-[#e5f1f3] hover:bg-[#f0f9fa]'
                      }`}
                    >
                      <span>{language === 'en' ? opt.labelEn : opt.labelZh}</span>
                      <span className="material-symbols-outlined text-xs">
                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q4: Budget Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1f2937] block">
                {language === 'en' ? '4. Preferred budget tier:' : '4. 护肤品单品预算区间：'}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { value: 'under_150', labelZh: '< ¥150', labelEn: '< 150' },
                  { value: '150_300', labelZh: '¥150-300', labelEn: '150-300' },
                  { value: '300_600', labelZh: '¥300-600', labelEn: '300-600' },
                  { value: 'above_600', labelZh: '> ¥600', labelEn: '> 600' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuestionnaireData((prev) => ({ ...prev, budget: opt.value }))}
                    className={`py-1.5 text-center rounded-xl text-xs font-semibold border transition-all ${
                      questionnaireData.budget === opt.value
                        ? 'bg-[#0099A7] text-white border-[#0099A7]'
                        : 'bg-[#f0f9fa] text-[#4b5563] border-[#d0eff3]'
                    }`}
                  >
                    {language === 'en' ? opt.labelEn : opt.labelZh}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Questionnaire */}
            <div className="pt-2">
              <button
                onClick={() => executeDirectAnalysis('', '', 'questionnaire', questionnaireData)}
                className="w-full py-3.5 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white font-bold text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span>{language === 'en' ? 'Generate Skincare Analysis & Regimen' : '提交问卷并生成 AI 调理建议'}</span>
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 2: IMMERSIVE FULL-CONTAINER RADAR SCAN & RIPPLE HUD (科技感雷达扫描/波纹加载动画) --- */}
        {assessmentStep === 'analyzing' && (
          <div className="relative w-full py-8 px-4 bg-gradient-to-b from-[#00181c] via-[#00262c] to-[#00181c] rounded-3xl overflow-hidden flex flex-col items-center text-center space-y-5 text-white">
            {/* Background High-Tech Cyan Matrix Grid */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,153,167,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,153,167,0.3) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Corner Targeting HUD Reticles */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#0099A7]"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#0099A7]"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#0099A7]"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#0099A7]"></div>

            {/* Top Telemetry Header */}
            <div className="w-full flex items-center justify-between text-[10px] text-[#d2eff2] font-mono tracking-wider px-2 z-10">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0099A7] animate-ping"></span>
                <span>BIOMETRIC RADAR SCAN</span>
              </span>
              <span>FREQ: 98.4 GHz</span>
            </div>

            {/* THE CENTRAL 360° ROTATING RADAR WITH EXPANDING SONAR RIPPLE WAVES */}
            <div className="relative w-60 h-60 rounded-full border border-[#0099A7]/30 flex items-center justify-center bg-[#001215]/90 shadow-[0_0_50px_rgba(0,153,167,0.15)] my-1">
              {/* Concentric Radar Distance Rings */}
              <div className="absolute w-44 h-44 rounded-full border border-dashed border-[#0099A7]/25"></div>
              <div className="absolute w-28 h-28 rounded-full border border-[#0099A7]/35"></div>
              <div className="absolute w-14 h-14 rounded-full border border-[#0099A7]/45"></div>

              {/* Radar Coordinate Axes */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#0099A7]/25"></div>
              <div className="absolute inset-y-0 left-1/2 w-px bg-[#0099A7]/25"></div>

              {/* 360-Degree Continuous Rotating Radar Sweep Beam */}
              <div 
                className="absolute inset-0 rounded-full animate-spin pointer-events-none" 
                style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}
              >
                <div 
                  className="w-full h-full rounded-full" 
                  style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, rgba(0,153,167,0) 0deg, rgba(0,153,167,0) 240deg, rgba(0,153,167,0.08) 280deg, rgba(0,153,167,0.45) 360deg)'
                  }}
                />
              </div>

              {/* Concentric Expanding Sonar Ripple Waves */}
              <div 
                className="absolute w-24 h-24 rounded-full border-2 border-[#0099A7]/60 animate-ping pointer-events-none"
                style={{ animationDuration: '2s' }}
              />
              <div 
                className="absolute w-40 h-40 rounded-full border border-[#d2eff2]/40 animate-ping pointer-events-none"
                style={{ animationDuration: '2.8s', animationDelay: '0.7s' }}
              />

              {/* Center Core Biometric Beacon */}
              <div className="relative z-10 w-5 h-5 rounded-full bg-[#0099A7]/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0099A7] shadow-[0_0_12px_#0099A7] animate-pulse"></div>
              </div>

              {/* Fixed Feature Anchors Locked on Radar Screen */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#d2eff2] shadow-[0_0_8px_#d2eff2] animate-ping"></div>
                <span className="text-[8px] font-mono text-[#d2eff2] font-bold tracking-tight bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  T-ZONE [SEBUM]
                </span>
              </div>

              <div className="absolute top-[48%] left-8 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#0099A7] shadow-[0_0_8px_#0099A7]"></div>
                <span className="text-[8px] font-mono text-[#d2eff2] font-bold tracking-tight bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  BARRIER [L]
                </span>
              </div>

              <div className="absolute top-[48%] right-8 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#0099A7] shadow-[0_0_8px_#0099A7]"></div>
                <span className="text-[8px] font-mono text-[#d2eff2] font-bold tracking-tight bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  BARRIER [R]
                </span>
              </div>

              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[#0099A7] shadow-[0_0_8px_#0099A7]"></div>
                <span className="text-[8px] font-mono text-[#d2eff2] font-bold tracking-tight bg-black/60 px-1 rounded mt-0.5 whitespace-nowrap">
                  BONE CONTOUR
                </span>
              </div>
            </div>

            {/* Radar Scan Status Text */}
            <div className="space-y-1.5 z-10">
              <h4 className="font-headline font-bold text-sm text-white flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#0099A7] animate-spin">radar</span>
                <span>{t.analyzingTitle}</span>
              </h4>
              <p className="text-xs text-[#d2eff2]/80 max-w-xs leading-relaxed">
                {t.analyzingSubtitle}
              </p>
            </div>

            {/* Futuristic Live Analysis Checklist */}
            <div className="w-full max-w-xs space-y-1.5 text-left text-[11px] z-10">
              <div className="p-2 rounded-xl bg-[#003138]/70 border border-[#0099A7]/30 text-[#d2eff2] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#0099A7]">check_circle</span>
                <span>{language === 'en' ? 'Facial bone contours & 4 feature anchors locked' : '骨相轮廓与 4 组特征锚点已精准锁定'}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#003138]/50 border border-[#0099A7]/20 text-[#d2eff2] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#0099A7] animate-spin">autorenew</span>
                <span>{language === 'en' ? 'Calculating barrier resilience & sebum spectrometry' : '正在计算表层屏障韧性与微观水油毛孔'}</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-[#0099A7]/10 text-white/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-white/40">radio_button_unchecked</span>
                <span>{language === 'en' ? 'Generating 6D diagnostic radar & Watsons regimen' : '生成六维多模态雷达图与屈臣氏专研配方'}</span>
              </div>
            </div>

            <button
              onClick={handleCancelAnalysis}
              className="text-xs text-white/60 hover:text-white underline pt-1 z-10 cursor-pointer"
              type="button"
            >
              {t.cancelAnalysisBtn}
            </button>
          </div>
        )}

        {/* --- STATE 3: ERROR STATE WITH RETRY & RE-CAPTURE --- */}
        {assessmentStep === 'error' && (
          <div className="p-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-xl">error</span>
              <h4 className="font-headline font-bold text-sm">
                {t.errorTitle}
              </h4>
            </div>

            <p className="text-xs text-[#4b5563] leading-relaxed">
              {errorMessage || t.errorMessage}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  if (assessmentState.photoBase64) {
                    executeDirectAnalysis(
                      assessmentState.photoBase64,
                      assessmentState.mimeType || 'image/jpeg',
                      assessmentState.method === 'camera' ? 'camera' : 'upload'
                    );
                  } else {
                    executeDirectAnalysis('', '', 'questionnaire', questionnaireData);
                  }
                }}
                className="w-full py-2.5 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-sm hover:bg-[#007d89] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                <span>{language === 'en' ? 'Retry Analysis' : '重新尝试分析'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="py-2 rounded-full bg-white border border-[#d0eff3] text-[#0099A7] font-semibold text-xs hover:bg-[#f0f9fa] flex items-center justify-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>{language === 'en' ? 'Upload Photo' : '上传相册照片'}</span>
                </button>

                <button
                  onClick={() => {
                    setAssessmentStep('questionnaire');
                  }}
                  className="py-2 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] font-semibold text-xs hover:bg-[#e0f5f7] flex items-center justify-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">quiz</span>
                  <span>{language === 'en' ? 'Questionnaire' : '问卷自测评定'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STATE 5: RESULTS SUMMARY ON HOMEPAGE --- */}
        {assessmentStep === 'results' && assessmentState.resultsData && (
          <div className="p-5 flex flex-col space-y-4">
            {/* Real AI or Labelled Demo Notice */}
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
              assessmentState.isRealAI 
                ? 'bg-[#f0f9fa] border-[#d0eff3] text-[#007d89]' 
                : 'bg-white border-[#e5f1f3] text-[#4b5563]'
            }`}>
              <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">
                {assessmentState.isRealAI ? 'auto_awesome' : 'info'}
              </span>
              <div>
                <p className="font-medium">
                  {assessmentState.demoLabel || assessmentState.resultsData.confidenceNotice || t.demoResultNotice}
                </p>
              </div>
            </div>

            {/* Photo Thumbnail / Method Header */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f0f9fa] border border-[#e5f1f3]">
              {assessmentState.photoUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#d0eff3] relative shadow-xs">
                  <img
                    src={assessmentState.photoUrl}
                    alt="Analyzed Skin"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                    {language === 'en' ? 'Photo Scan' : '实拍分析'}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white border border-[#d0eff3] text-[#0099A7] flex flex-col items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">quiz</span>
                  <span className="text-[9px] font-semibold text-[#0099A7] mt-0.5">{language === 'en' ? 'Survey' : '问卷自评'}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                {assessmentState.resultsData.skin_type && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0099A7] text-white shadow-2xs">
                      {assessmentState.resultsData.skin_type}
                    </span>
                  </div>
                )}
                <span className="text-[10px] uppercase font-bold text-[#6b7280] tracking-wider block">
                  {t.barrierConditionLabel}
                </span>
                <h4 className="font-headline font-bold text-xs text-[#1f2937] mt-0.5 leading-snug">
                  {assessmentState.resultsData.barrierCondition}
                </h4>
              </div>
            </div>

            {/* 2. Six-dimensional skin characteristic cards (Simplified: Title + Main Conclusion only) */}
            {assessmentState.resultsData.sixDimensions && assessmentState.resultsData.sixDimensions.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#e5f1f3] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#0099A7]">fact_check</span>
                    <h5 className="font-headline font-bold text-xs text-[#1f2937]">
                      {language === 'en' ? 'Six Skin Dimensions' : '六维肤质表现特征'}
                    </h5>
                  </div>
                  <span className="text-[10px] text-[#0099A7] font-semibold bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'Evidence-based' : '客观证据'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  {assessmentState.resultsData.sixDimensions.map((dim) => {
                    const isUndetermined = !dim.isDeterminable || dim.statusZh === '无法判定' || dim.status === 'Cannot determine';
                    return (
                      <div key={dim.dimensionKey} className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3] flex flex-col justify-between gap-1.5 min-h-[60px]">
                        <span className="font-bold text-xs text-[#1f2937] leading-tight">
                          {language === 'zh' ? dim.nameZh : dim.name}
                        </span>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block leading-tight ${
                            isUndetermined
                              ? 'bg-gray-100 text-gray-500 border border-gray-200'
                              : 'bg-white text-[#0099A7] border border-[#d0eff3]'
                          }`}>
                            {language === 'zh' ? dim.statusZh : dim.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Six-dimensional appearance radar chart, fully visible by default */}
            {assessmentState.resultsData.radarDimensions && assessmentState.resultsData.radarDimensions.length > 0 && (
              <SkinRadarChart
                dimensions={assessmentState.resultsData.radarDimensions}
                language={language}
              />
            )}

            {/* 4. Core skincare recommendations */}
            <div className="p-3.5 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3]">
              <span className="text-[10px] uppercase font-bold text-[#0099A7] tracking-wider block">
                {language === 'zh' ? '核心护理建议' : t.recommendedNextStepLabel}
              </span>
              <p className="text-xs text-[#1f2937] mt-1 leading-relaxed">
                {assessmentState.resultsData.recommendedNextStep}
              </p>
            </div>

            {/* MATCHED HERO PRODUCT CARD DIRECTLY CONNECTED */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#e5f1f3] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#0099A7] uppercase tracking-wider">
                  {t.matchedHeroProductLabel}
                </span>
                <span className="text-[11px] font-bold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full">
                  {language === 'en' ? 'Curated Selection' : '严选适配'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3] p-1 flex items-center justify-center shrink-0">
                  <SafeProductImage
                    src={matchedHeroProduct.image}
                    alt={matchedHeroProduct.name}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#0099A7] block">
                    {matchedHeroProduct.brand}
                  </span>
                  <h5 className="font-headline font-bold text-xs text-[#1f2937] truncate">
                    {language === 'en' ? matchedHeroProduct.name : matchedHeroProduct.nameZh}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-[#1f2937]">
                      ¥{matchedHeroProduct.price}
                    </span>
                    <span className="text-[10px] text-[#4b5563]">
                      ({matchedHeroProduct.size})
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#4b5563] leading-relaxed">
                "{language === 'en' ? matchedHeroProduct.whyMatches : matchedHeroProduct.whyMatchesZh}"
              </p>

              <div className="pt-1 flex gap-2">
                <button
                  onClick={handleOpenRoutineSheet}
                  className="flex-1 py-2 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-2xs hover:bg-[#007d89] flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">spa</span>
                  <span>{t.addToRoutineBtn}</span>
                </button>
                <button
                  onClick={() => {
                    if (onAddToCart) onAddToCart(matchedHeroProduct);
                    onShowToast(language === 'zh' ? `已将【${matchedHeroProduct.nameZh}】加入购物车` : `Added ${matchedHeroProduct.name} to Cart`);
                  }}
                  className="flex-1 py-2 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] font-bold text-xs hover:bg-[#e0f5f7] flex items-center justify-center gap-1 active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                  <span>{language === 'zh' ? '加入购物车' : 'Add to Cart'}</span>
                </button>
              </div>
            </div>

            {/* Archive Saved Confirmation */}
            <div className="p-3 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-between text-xs text-[#0099A7]">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-base">task_alt</span>
                <span>{language === 'zh' ? '已在授权下同步归档至个人测肤档案' : 'Saved to your skin profile archive'}</span>
              </div>
              <button
                onClick={() => onNavigate('profile')}
                className="text-[11px] font-bold text-[#0099A7] hover:underline flex items-center gap-0.5"
                type="button"
              >
                <span>{language === 'zh' ? '查看档案' : 'View Archive'}</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onNavigate('assessment')}
                className="w-full py-3 px-4 rounded-full bg-[#0099A7] text-white font-bold text-xs shadow-sm hover:bg-[#007d89] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">assessment</span>
                <span>{language === 'zh' ? '查看多维详细报告与备选对比' : 'View Full Report & Compare Alternatives'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <button
                onClick={() => onNavigate('my-routine')}
                className="w-full py-2.5 px-4 rounded-full bg-white border border-[#d0eff3] text-[#0099A7] font-semibold text-xs hover:bg-[#f0f9fa] flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">spa</span>
                <span>{t.generateRoutineBtn}</span>
              </button>
            </div>


            {/* Retake & Store Advice */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                onClick={onStartNewAssessment || handleResetAssessment}
                className="text-[#0099A7] hover:underline font-semibold flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>{language === 'en' ? 'Retake Assessment' : '重新测肤'}</span>
              </button>
              <button
                onClick={onOpenAdvisorChat}
                className="text-[#4b5563] hover:text-[#0099A7] flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">support_agent</span>
                <span>{t.consultStaffBtn}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Secondary Quick Entries (2 Columns, Clean & Uncluttered) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Entry 1: Ask AI Advisor */}
        <button
          onClick={() => onNavigate('ai-advisor')}
          className="p-4 rounded-2xl bg-white border border-[#e5f1f3] shadow-2xs hover:border-[#d0eff3] hover:bg-[#f0f9fa] transition-all text-left flex flex-col justify-between gap-3 active:scale-[0.98]"
          type="button"
        >
          <div className="w-10 h-10 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-[#1f2937] leading-tight">
              {t.askAdvisorTitle}
            </h4>
            <p className="text-[11px] text-[#4b5563] mt-1 leading-snug">
              {t.askAdvisorSubtitle}
            </p>
          </div>
        </button>

        {/* Entry 2: My Routine */}
        <button
          onClick={() => onNavigate('my-routine')}
          className="p-4 rounded-2xl bg-white border border-[#e5f1f3] shadow-2xs hover:border-[#d0eff3] hover:bg-[#f0f9fa] transition-all text-left flex flex-col justify-between gap-3 active:scale-[0.98]"
          type="button"
        >
          <div className="w-10 h-10 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">spa</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-[#1f2937] leading-tight">
              {language === 'zh' ? '每日护肤' : 'Daily Routine'}
            </h4>
            <div className="mt-1">
              {!hasSavedRoutine ? (
                <p className="text-[11px] text-[#4b5563] leading-snug">
                  {language === 'zh' ? '建立我的护肤方案' : 'Build My Routine'}
                </p>
              ) : !isTodayCheckedIn ? (
                <p className="text-[11px] text-[#4b5563] leading-snug">
                  {language === 'zh' ? '今天还没打卡' : 'Not checked in today'}
                </p>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-[11px] text-[#00939F] font-semibold leading-snug">
                    {language === 'zh' ? '今天已点亮 ⭐' : 'Lit up today ⭐'}
                  </p>
                  <p className="text-[10px] text-[#6b7280]">
                    {language === 'zh' ? `累计点亮 ${cumulativeStars} 颗星` : `Total ${cumulativeStars} stars lit`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* In-Store Counter Consultation Card */}
      <div className="p-4 rounded-2xl bg-white border border-[#e5f1f3] shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={ADVISOR_PROFILE_PHOTO}
              alt="Sherry Chen"
              className="w-11 h-11 rounded-full object-cover border border-[#d0eff3]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>
          <div className="min-w-0">
            <h4 className="font-headline font-bold text-xs text-[#1f2937] truncate">
              {t.storeConsultationTitle}
            </h4>
            <p className="text-[11px] text-[#4b5563] mt-0.5 line-clamp-1">
              {t.storeConsultationDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenStoreModal}
            className="px-3 py-1.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] text-xs font-semibold hover:bg-[#e0f5f7] transition-colors"
            type="button"
          >
            {t.storeDirectionsBtn}
          </button>
          <button
            onClick={onOpenPassModal}
            className="px-3 py-1.5 rounded-full bg-[#0099A7] text-white text-xs font-semibold hover:bg-[#007d89] transition-colors"
            type="button"
          >
            {t.showPassBtn}
          </button>
        </div>
      </div>

      {/* Routine Selection Sheet for Recommendations */}
      <RoutineSelectionSheet
        isOpen={isRoutineSheetOpen}
        onClose={() => setIsRoutineSheetOpen(false)}
        onConfirm={handleConfirmAddToRoutine}
        product={matchedHeroProduct}
        language={language}
      />
    </div>
  );
};
