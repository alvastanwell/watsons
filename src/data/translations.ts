import { Language } from '../types';

export const translations = {
  en: {
    // Nav
    navHome: "Home",
    navAssessment: "AI Skin Test",
    navAdvisor: "AI Advisor",
    navRoutine: "My Routine",
    navProfile: "Profile",

    // Home
    homeGreeting: "Hello",
    homeSubtitle: "Personalized Skincare Guidance",
    skinStatusBadge: "Balanced & Hydrated",
    
    // Main Hero on Home
    aiSkinAssessmentTitle: "AI Skin Assessment",
    aiSkinAssessmentSubtitle: "Take or upload a photo to get personalized skincare advice.",
    startAssessmentBtn: "Take Photo for Assessment",
    uploadAssessmentBtn: "Upload Photo",
    skincareSmallNote: "For daily skincare reference only, not a medical diagnosis.",
    questionnaireAltLink: "Or complete questionnaire self-test (no photo)",
    assessmentTag: "AI Skin Assessment",

    // Secondary Actions on Home
    askAdvisorTitle: "Ask AI Advisor",
    askAdvisorSubtitle: "Instant formulation advice & store chat",
    myRoutineTitle: "My Routine",
    myRoutineSubtitle: "Morning & evening barrier regimen",
    currentRegimenPace: "AM Routine: 3 steps",

    // In-store BA Card
    storeConsultationTitle: "In-Store Counter Consultation",
    storeConsultationDesc: "Visit West Nanjing Rd Flagship for free sample testing with Sherry Chen.",
    storeDirectionsBtn: "View Store",
    showPassBtn: "Offline Pass",

    // Assessment: Step 1 Introduction & Consent
    assessmentIntroTitle: "Authorization & Privacy Notice",
    assessmentCosmeticNotice: "For daily skincare reference only, not a medical diagnosis.",
    consentCheckboxText: "I have read and consent to submitting photo for cosmetic analysis.",
    consentPrivacyDetailed: "Your photo will be securely transmitted to the Google Gemini multimodal model for cosmetic observation and product matching. It will not be shared publicly. This is for daily skincare reference only and does not constitute a medical diagnosis.",
    consentErrorText: "Please agree to the authorization notice to proceed.",
    methodCamera: "Take Photo for Assessment",
    methodUpload: "Upload Photo",
    cameraPermissionDenied: "Camera access was denied or is unavailable. You can still complete the assessment by uploading a photo or answering a quick questionnaire.",

    // Assessment: Step 2 Photo Guide & Capture
    photoGuideTitle: "Align Face & Facial Contours",
    photoGuideInstructions: "Align your face within the scanning outline in natural lighting. Avoid heavy filters for accurate bone structure & barrier observation.",
    retakePhotoBtn: "Retake",
    deletePhotoBtn: "Delete Photo",
    confirmPhotoBtn: "Confirm & Continue",
    takePhotoTrigger: "Capture & Start Bone Scan",
    uploadPhotoTrigger: "Choose Photo from Album",

    // Step Progress / Buttons
    stepProgress: "Step",
    ofText: "of",
    backBtn: "Back",
    cancelBtn: "Cancel",

    // Assessment: Analyzing
    analyzingTitle: "Multidimensional Radar Scanning & AI Analysis...",
    analyzingSubtitle: "Fixed feature anchors locked. Gemini Multimodal AI is calculating barrier resilience and sebum spectrometry...",
    cancelAnalysisBtn: "Cancel Scan",

    // Assessment: Results
    demoModeTag: "DEMO MODE",
    demoResultNotice: "Sample results shown for demonstration. Not generated from clinical diagnostic equipment.",
    assessmentResultsTitle: "Your Skin Summary",
    barrierConditionLabel: "Observed Tendency",
    barrierConditionValue: "Combination skin with mild cheek barrier sensitivity",
    recommendedNextStepLabel: "Recommended Next Step",
    recommendedNextStepValue: "Strengthen stratum corneum with soothing panthenol and lightweight barrier balm.",
    
    // Expandable Observation Details
    viewObservationsBtn: "View Detailed Observations",
    hideObservationsBtn: "Hide Detailed Observations",
    obsShineTitle: "Visible Shine",
    obsShineDesc: "Light shine observed in T-zone forehead area.",
    obsRednessTitle: "Visible Redness",
    obsRednessDesc: "Mild superficial flushing detected on mid-cheeks.",
    obsToneTitle: "Texture & Tone",
    obsToneDesc: "Generally even with subtle dryness near mouth area.",
    correctResultPrompt: "Does this look accurate?",
    correctYes: "Yes, looks accurate",
    correctAdjust: "I'd like to adjust",

    // Results CTAs
    viewMatchingProductsBtn: "View Products for Me",
    generateRoutineBtn: "Generate Daily Routine",
    consultStaffBtn: "Ask Store Consultant",
    saveToProfileBtn: "Save Summary to Profile",
    savedToProfileSuccess: "Saved to your profile with your consent.",
    deleteSummaryBtn: "Delete Summary",
    deletedSuccess: "Assessment data deleted.",

    // Product Recommendations (Simplified)
    recommendationsTitle: "Recommended for Your Skin",
    primaryRecommendationBadge: "Top Match",
    compareAlternativesBtn: "Compare 2 Alternatives",
    hideAlternativesBtn: "Hide Alternatives",
    whyThisMatchesLabel: "Why this matches you",
    viewIngredientsBtn: "View Ingredients & Efficacy",
    hideIngredientsBtn: "Hide Ingredients",
    viewOfferBtn: "View Store Offer",
    addToRoutineBtn: "Add to Routine",
    tryInStoreBtn: "Try in Store",
    demoDataTitle: "Demo Data:",
    demoDataText: "Sample product information, formulations, and prices shown for prototype demonstration.",

    // Routine (Simplified)
    routineTitle: "My Routine",
    routinePrescribed: "Tailored for barrier comfort",
    tabMorning: "Morning (3 Steps)",
    tabEvening: "Evening (4 Steps)",
    stepDetailsBtn: "Details",
    completedToday: "Done ✓",
    markDone: "Mark as done",
    
    // Profile
    vipMemberTag: "Watsons Green VIP Member",
    vipPoints: "2,450 Beauty Points",
    skinHealthJournal: "Skin Health Journal",
    skinLogGood: "Barrier integrity steady at 94%",
    activePasses: "Saved In-Store Passes",
    viewCounterQRCode: "View Counter QR Code",
    privacySettings: "PIPL Privacy & On-Device Storage",
    dataOnDeviceOnly: "Skin biometric scans stored strictly on-device",

    // Toast Messages
    toastSaved: "Saved successfully",
    toastAdded: "Added to your routine",

    // Errors & Retries
    errorTitle: "Assessment Processing Error",
    errorMessage: "We were unable to complete the analysis. Please try again or continue with the questionnaire.",
    retryBtn: "Retry Analysis",
    cameraFailedTitle: "Camera Unavailable",
    cameraFailedMsg: "Camera access was not granted or is not supported. You can upload a photo from your gallery or complete the assessment via questionnaire.",
    cameraBlockedIframeTitle: "Camera Blocked by Preview Iframe",
    cameraBlockedIframeDesc: "The preview iframe's security permissions policy restricts direct camera hardware access. You can open the app in a standalone HTTPS tab to test the live camera, or upload a photo directly below.",
    cameraDeniedTitle: "Camera Permission Denied",
    cameraDeniedDesc: "Permission was denied in your browser settings. To allow camera access, click the lock or camera icon in your browser's address bar, select 'Allow', then click 'Retry Camera'.",
    cameraNotFoundTitle: "No Camera Detected",
    cameraNotFoundDesc: "No camera or webcam was found on this device. Please connect a webcam or choose 'Upload Photo' to proceed.",
    cameraInUseTitle: "Camera Busy or Hardware Error",
    cameraInUseDesc: "The camera is currently in use by another tab or app, or encountered a hardware conflict. Please close other camera tabs and click 'Retry Camera'.",
    cameraUnsupportedTitle: "Browser Unsupported or Insecure Origin",
    cameraUnsupportedDesc: "Camera access requires a secure HTTPS context and modern WebRTC support in your browser.",
    retryCameraBtn: "Retry Camera",
    openStandaloneBtn: "Open in Standalone Tab ↗",
    copyStandaloneLink: "Copy Standalone Link",
    linkCopied: "Link copied to clipboard",
    startCameraTrigger: "Start Camera",
    matchedHeroProductLabel: "Matched Cosmetic Formulation",
    realAiTag: "Gemini AI Analysis"
  },

  zh: {
    // Nav
    navHome: "首页",
    navAssessment: "AI测肤",
    navAdvisor: "AI 顾问",
    navRoutine: "每日护肤",
    navProfile: "个人中心",

    // Home
    homeGreeting: "您好",
    homeSubtitle: "个性化护肤方案指引",
    skinStatusBadge: "平衡水润",

    // Main Hero on Home
    aiSkinAssessmentTitle: "AI 智能测肤",
    aiSkinAssessmentSubtitle: "拍照或上传照片，获取护肤参考建议。",
    startAssessmentBtn: "拍照测肤",
    uploadAssessmentBtn: "上传照片",
    skincareSmallNote: "仅供日常护肤参考，非医疗诊断。",
    questionnaireAltLink: "或填写问卷自评（免拍照）",
    assessmentTag: "AI 智能测肤",

    // Secondary Actions on Home
    askAdvisorTitle: "咨询 AI 顾问",
    askAdvisorSubtitle: "专柜顾问直连与配方比对",
    myRoutineTitle: "每日护肤打卡",
    myRoutineSubtitle: "早晚屏障维稳护理步骤",
    currentRegimenPace: "晨间方案：3步",

    // In-store BA Card
    storeConsultationTitle: "专柜探访与小样体验",
    storeConsultationDesc: "前往上海南京西路旗舰店，专柜顾问 Sherry 已为您备好试用装。",
    storeDirectionsBtn: "查看门店",
    showPassBtn: "专柜领样码",

    // Assessment: Step 1 Introduction & Consent
    assessmentIntroTitle: "授权与隐私说明",
    assessmentCosmeticNotice: "仅供日常护肤参考，非医疗诊断。",
    consentCheckboxText: "我已阅读并同意授权提交照片用于护肤分析",
    consentPrivacyDetailed: "照片将通过云端安全接口提交由 Google Gemini 多模态模型进行多维度护肤特征与表观观察分析，仅用于为您生成日常护肤参考建议与屈臣氏正品匹配，不会公开传播。分析结果仅供日常护肤参考，非医疗诊断。",
    consentErrorText: "请先勾选同意授权说明以继续。",
    methodCamera: "拍照测肤",
    methodUpload: "上传照片",
    cameraPermissionDenied: "相机权限未开启或不可用。您可以直接上传相册照片或选择问卷自评。",

    // Assessment: Step 2 Photo Guide & Capture
    photoGuideTitle: "对准面部与骨相轮廓",
    photoGuideInstructions: "请在自然光线下正对屏幕并对准骨相参考线，避免浓妆与美颜滤镜，以便获取精准的骨相轮廓与肤质观察。",
    retakePhotoBtn: "重新拍摄",
    deletePhotoBtn: "删除相片",
    confirmPhotoBtn: "确认并继续",
    takePhotoTrigger: "拍摄并启动骨相分析",
    uploadPhotoTrigger: "从相册中选择",

    // Step Progress / Buttons
    stepProgress: "第",
    ofText: "步，共",
    backBtn: "返回",
    cancelBtn: "取消",

    // Assessment: Analyzing
    analyzingTitle: "高精骨相雷达扫描与多维波纹解析中...",
    analyzingSubtitle: "固定特征锚点已精准锁定，Gemini 多模态引擎正在深度计算屏障韧性与微观水油...",
    cancelAnalysisBtn: "取消扫描",

    // Assessment: Results
    demoModeTag: "演示模式",
    demoResultNotice: "示例结果，并非根据你的照片生成。仅供原型交互演示参考。",
    assessmentResultsTitle: "测肤评估概览",
    barrierConditionLabel: "初步状态观察",
    barrierConditionValue: "混合性肤质，伴有两颊轻度屏障不耐受与受干泛红倾向",
    recommendedNextStepLabel: "核心护理建议",
    recommendedNextStepValue: "选用温和弱酸性洁面，搭配维生素原B5与积雪草苷厚涂修护两颊，早间做好轻薄防晒。",

    // Expandable Observation Details
    viewObservationsBtn: "展开查看面部观察细节",
    hideObservationsBtn: "收起观察细节",
    obsShineTitle: "面部光泽观察",
    obsShineDesc: "额头T区存在轻微视觉油光反应。",
    obsRednessTitle: "表层泛红观察",
    obsRednessDesc: "双颊有局部轻微潮红表现。",
    obsToneTitle: "平滑度与肤色",
    obsToneDesc: "整体平滑，嘴角及鼻翼周围略有干燥起皮。",
    correctResultPrompt: "这些观察与您的实际感受相符吗？",
    correctYes: "符合实际情况",
    correctAdjust: "我想修正选项",

    // Results CTAs
    viewMatchingProductsBtn: "查看适合我的产品",
    generateRoutineBtn: "生成每日护肤方案",
    consultStaffBtn: "咨询门店人员",
    saveToProfileBtn: "保存结果至个人档案",
    savedToProfileSuccess: "已在您的授权下保存至个人档案。",
    deleteSummaryBtn: "删除本次测肤记录",
    deletedSuccess: "测肤记录已清除。",

    // Product Recommendations (Simplified)
    recommendationsTitle: "为您精选的契合方案",
    primaryRecommendationBadge: "最佳契合",
    compareAlternativesBtn: "查看另外 2 款对比产品",
    hideAlternativesBtn: "收起对比产品",
    whyThisMatchesLabel: "为何契合您的肌肤",
    viewIngredientsBtn: "查看成分与功效分析",
    hideIngredientsBtn: "收起成分分析",
    viewOfferBtn: "查看专柜优惠",
    addToRoutineBtn: "加入护肤流程",
    tryInStoreBtn: "专柜免费试用",
    demoDataTitle: "演示数据提示：",
    demoDataText: "页面所展示的产品规格、配方及价格仅供原型体验展示使用。",

    // Routine (Simplified)
    routineTitle: "我的每日护肤",
    routinePrescribed: "屏障维稳联合配方",
    tabMorning: "晨间护肤 (3 步)",
    tabEvening: "晚间修护 (4 步)",
    stepDetailsBtn: "使用方法",
    completedToday: "今日完成 ✓",
    markDone: "标为完成",

    // Profile
    vipMemberTag: "屈臣氏绿卡尊享会员",
    vipPoints: "2,450 美肤积分",
    skinHealthJournal: "肌肤健康监测记录",
    skinLogGood: "屏障耐受指数维持在 94%（良好）",
    activePasses: "已保存的专柜兑换凭证",
    viewCounterQRCode: "出示专柜核销二维码",
    privacySettings: "个人信息与端侧安全设置",
    dataOnDeviceOnly: "面部特征分析数据仅保存在手机端本地",

    // Toast Messages
    toastSaved: "操作已保存",
    toastAdded: "已加入护肤流程",

    // Errors & Retries
    errorTitle: "测肤分析未完成",
    errorMessage: "未能成功连接并分析面部特征，请检查网络后重试，或直接使用问卷模式。",
    retryBtn: "重新分析",
    cameraFailedTitle: "摄像头暂不可用",
    cameraFailedMsg: "未能获取摄像头权限。您可以从手机相册中选择照片上传，或直接填写问卷完成评估。",
    cameraBlockedIframeTitle: "预览框架权限受限",
    cameraBlockedIframeDesc: "当前预览框架（iframe）的安全策略阻止了直接调用摄像头。您可以在独立新标签页中打开完整网页测试相机，或直接在下方上传照片。",
    cameraDeniedTitle: "摄像头权限未开启",
    cameraDeniedDesc: "浏览器中未允许本页面使用摄像头。请点击地址栏的锁形/相机图标，设置为【允许】后点击“重试摄像头”。",
    cameraNotFoundTitle: "未检测到摄像头设备",
    cameraNotFoundDesc: "系统未检测到可用的摄像头或摄像头已被移除。请连接摄像头或直接在下方上传照片。",
    cameraInUseTitle: "摄像头被占用或发生冲突",
    cameraInUseDesc: "摄像头当前正被其他应用或浏览器标签页占用。请关闭占用相机的程序后点击“重试摄像头”。",
    cameraUnsupportedTitle: "非安全环境或浏览器不支持",
    cameraUnsupportedDesc: "调用摄像头需要安全的 HTTPS 环境与支持 WebRTC 的现代浏览器。",
    retryCameraBtn: "重试摄像头",
    openStandaloneBtn: "在独立新标签页中打开 ↗",
    copyStandaloneLink: "复制独立链接",
    linkCopied: "链接已复制到剪贴板",
    startCameraTrigger: "开启摄像头",
    matchedHeroProductLabel: "为您匹配的核心针对性配方",
    realAiTag: "Gemini AI 智能解析"
  }
};
