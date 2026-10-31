import React, { useState } from 'react';
import { 
  Language, 
  ScreenId, 
  InStoreAppointment, 
  SkinAssessmentState, 
  SkinAssessmentResult, 
  SkinAssessmentHistoryRecord,
  UserProfile, 
  OrderRecord,
  QuestionnaireDraft,
  QuestionnaireHistoryRecord 
} from '../types';
import { USER_AVATAR } from '../data/mockData';
import { getProductById } from '../data/productCatalogue';
import { SafeProductImage } from './common/SafeProductImage';
import { SkinRadarChart } from './SkinRadarChart';

interface ProfileScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  appointment: InStoreAppointment;
  onOpenPassModal: () => void;
  onOpenChatModal: () => void;
  onShowToast: (msg: string) => void;
  assessmentState: SkinAssessmentState;
  savedAssessment?: SkinAssessmentResult | null;
  historyRecords?: SkinAssessmentHistoryRecord[];
  historyStatus?: 'loading' | 'success' | 'error';
  onViewRecord?: (record: SkinAssessmentHistoryRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
  onClearAllHistory?: () => void;
  onRetryLoadHistory?: () => void;
  onDeleteAssessment?: () => void;
  onStartNewAssessment: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  orders: OrderRecord[];
  questionnaireDraft?: QuestionnaireDraft | null;
  questionnaireHistory?: QuestionnaireHistoryRecord[];
  onOpenQuestionnaire?: () => void;
  onOpenQuestionnaireHistory?: () => void;
  onViewQuestionnaireReport?: (report: SkinAssessmentResult, record: QuestionnaireHistoryRecord) => void;
  onDiscardQuestionnaireDraft?: () => void;
  userEmail?: string;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onNavigate,
  appointment,
  onOpenPassModal,
  onOpenChatModal,
  onShowToast,
  assessmentState,
  savedAssessment,
  historyRecords = [],
  historyStatus = 'success',
  onViewRecord,
  onDeleteRecord,
  onClearAllHistory,
  onRetryLoadHistory,
  onDeleteAssessment,
  onStartNewAssessment,
  userProfile,
  onSaveProfile,
  orders,
  questionnaireDraft = null,
  questionnaireHistory = [],
  onOpenQuestionnaire,
  onOpenQuestionnaireHistory,
  onViewQuestionnaireReport,
  onDiscardQuestionnaireDraft,
  userEmail,
  onLogout
}) => {
  const isZh = language === 'zh';
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({ ...userProfile });
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderRecord | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);

  const hasRecords = historyRecords.length > 0;

  const skinTypeOptions = [
    { value: 'not_sure', labelEn: 'Not sure', labelZh: '未确定 / 不清楚' },
    { value: 'normal', labelEn: 'Normal', labelZh: '中性肌' },
    { value: 'dry', labelEn: 'Dry', labelZh: '干性肌' },
    { value: 'oily', labelEn: 'Oily', labelZh: '油性肌' },
    { value: 'combination', labelEn: 'Combination', labelZh: '混合肌' }
  ];

  const concernOptions = [
    { value: 'barrier_support', labelEn: 'Barrier Support', labelZh: '屏障修护' },
    { value: 'redness_relief', labelEn: 'Redness Relief', labelZh: '舒缓褪红' },
    { value: 'hydration', labelEn: 'Deep Hydration', labelZh: '深层水润' },
    { value: 'oil_balance', labelEn: 'Oil Balance & Pores', labelZh: '水油平衡与控油' },
    { value: 'anti_aging', labelEn: 'Firming Care', labelZh: '紧致淡纹' }
  ];

  const budgetOptions = [
    { value: 'under_150', labelEn: '< ¥150 (Budget)', labelZh: '¥150 以下（亲民精选）' },
    { value: '150_300', labelEn: '¥150 - ¥300 (Standard)', labelZh: '¥150 - ¥300（日常进阶）' },
    { value: '300_600', labelEn: '¥300 - ¥600 (Premium)', labelZh: '¥300 - ¥600（专研高阶）' },
    { value: 'above_600', labelEn: '> ¥600', labelZh: '¥600 以上（整套全效）' }
  ];

  const handleStartEdit = () => {
    setEditForm({ ...userProfile });
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditForm({ ...userProfile });
    setIsEditingProfile(false);
    onShowToast(isZh ? '已取消修改，未保存更改已丢弃' : 'Cancelled edits');
  };

  const handleSaveEdit = () => {
    if (!editForm.nickname.trim()) {
      onShowToast(isZh ? '昵称不能为空' : 'Nickname cannot be empty');
      return;
    }
    onSaveProfile({
      ...editForm,
      lastUpdated: new Date().toISOString()
    });
    setIsEditingProfile(false);
    onShowToast(isZh ? '个人护肤偏好已保存！' : 'Profile preferences saved successfully!');
  };

  const toggleConcern = (value: string) => {
    setEditForm((prev) => {
      const exists = prev.concerns.includes(value);
      return {
        ...prev,
        concerns: exists ? prev.concerns.filter((c) => c !== value) : [...prev.concerns, value]
      };
    });
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-5 py-4 space-y-4 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#e5f1f3] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={userProfile.avatar || USER_AVATAR}
              alt={userProfile.nickname}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#0099A7]/30"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0099A7] text-white flex items-center justify-center text-[10px] shadow-xs">
              <span className="material-symbols-outlined text-xs">auto_awesome</span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-headline font-bold text-base text-[#1f2937] truncate">
                {userProfile.nickname || (isZh ? '美肤会员' : 'Member')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#fff5f5] text-[#d22630] border border-[#fecaca] font-bold shrink-0">
                VIP
              </span>
            </div>

            {userEmail && (
              <p className="text-[11px] text-[#6b7280] truncate mt-0.5 font-mono">
                {userEmail}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0099A7] text-white">
                {skinTypeOptions.find((o) => o.value === userProfile.skinType)?.[isZh ? 'labelZh' : 'labelEn'] || (isZh ? '自测偏好' : 'Self-Reported')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3]">
                {budgetOptions.find((b) => b.value === userProfile.budget)?.[isZh ? 'labelZh' : 'labelEn'] || '¥150-300'}
              </span>
            </div>

            <p className="text-[11px] font-mono text-[#0099A7] font-semibold mt-1">
              {isZh ? '屈臣氏美肤会员 • 积分: 2,480' : 'VIP Member • Points: 2,480'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPassModal}
          className="w-9 h-9 rounded-full bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] flex items-center justify-center hover:bg-[#e0f5f7] shrink-0"
          type="button"
          title={isZh ? '会员专柜领样码' : 'Membership QR Pass'}
        >
          <span className="material-symbols-outlined text-lg">qr_code</span>
        </button>
      </div>

      {/* Editable Profile Preferences Section */}
      <div className="bg-white rounded-3xl p-5 border border-[#e5f1f3] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0099A7]">tune</span>
            <h4 className="font-headline font-bold text-xs text-[#1f2937]">
              {isZh ? '自主护肤偏好档案' : 'Self-Reported Skincare Profile'}
            </h4>
          </div>

          {!isEditingProfile ? (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1 rounded-full text-xs font-semibold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] hover:bg-[#e0f5f7] flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              <span>{isZh ? '编辑' : 'Edit'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCancelEdit}
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#6b7280] bg-gray-100 hover:bg-gray-200"
                type="button"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#0099A7] hover:bg-[#007d89]"
                type="button"
              >
                {isZh ? '保存' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {isEditingProfile ? (
          /* Edit Form */
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '会员昵称' : 'Nickname'}
              </label>
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                className="w-full px-3 py-2 bg-[#f0f9fa] border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '认证邮箱 (只读)' : 'Authenticated Email (Read-only)'}
              </label>
              <input
                type="text"
                value={userEmail || '—'}
                disabled
                readOnly
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-[#6b7280] cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '自主感知肤质类型' : 'Self-Reported Skin Type'}
              </label>
              <select
                value={editForm.skinType}
                onChange={(e) => setEditForm({ ...editForm, skinType: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#f0f9fa] border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
              >
                {skinTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isZh ? opt.labelZh : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1.5">
                {isZh ? '护肤诉求与目标（多选）' : 'Skincare Concerns & Goals (Multi-select)'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {concernOptions.map((opt) => {
                  const selected = editForm.concerns.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleConcern(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        selected
                          ? 'bg-[#0099A7] text-white shadow-2xs'
                          : 'bg-[#f0f9fa] text-[#4b5563] border border-[#e5f1f3]'
                      }`}
                    >
                      {isZh ? opt.labelZh : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '日常预算区间' : 'Budget Range in RMB'}
              </label>
              <select
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#f0f9fa] border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
              >
                {budgetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isZh ? opt.labelZh : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '偏好成分（如：神经酰胺、积雪草）' : 'Preferred Ingredients'}
              </label>
              <input
                type="text"
                value={editForm.preferences}
                onChange={(e) => setEditForm({ ...editForm, preferences: e.target.value })}
                placeholder={isZh ? '例如：神经酰胺、B5、无香精' : 'e.g. Ceramides, Panthenol, Fragrance-Free'}
                className="w-full px-3 py-2 bg-[#f0f9fa] border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
              />
            </div>

            <div>
              <label className="block text-[#4b5563] font-semibold mb-1">
                {isZh ? '需避开成分（可选）' : 'Ingredients to Avoid (Optional)'}
              </label>
              <input
                type="text"
                value={editForm.ingredientsToAvoid}
                onChange={(e) => setEditForm({ ...editForm, ingredientsToAvoid: e.target.value })}
                placeholder={isZh ? '例如：酒精、高浓度酸类、香精' : 'e.g. Alcohol, Fragrance'}
                className="w-full px-3 py-2 bg-[#f0f9fa] border border-[#d0eff3] rounded-xl text-xs text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40"
              />
            </div>
          </div>
        ) : (
          /* View Profile */
          <div className="space-y-2.5 text-xs text-[#4b5563]">
            <div className="flex items-center justify-between py-1 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{isZh ? '感知肤质' : 'Skin Type'}</span>
              <span className="font-semibold text-[#1f2937]">
                {skinTypeOptions.find((o) => o.value === userProfile.skinType)?.[isZh ? 'labelZh' : 'labelEn'] || '未设置'}
              </span>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{isZh ? '主要诉求' : 'Concerns'}</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                {userProfile.concerns.length > 0 ? (
                  userProfile.concerns.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[10px] text-[#0099A7]">
                      {concernOptions.find((opt) => opt.value === c)?.[isZh ? 'labelZh' : 'labelEn'] || c}
                    </span>
                  ))
                ) : (
                  <span className="text-[#9ca3af]">{isZh ? '未勾选' : 'None specified'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{isZh ? '预算偏好' : 'Budget'}</span>
              <span className="font-semibold text-[#1f2937]">
                {budgetOptions.find((b) => b.value === userProfile.budget)?.[isZh ? 'labelZh' : 'labelEn'] || '未设置'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{isZh ? '偏好成分' : 'Preferred Ingredients'}</span>
              <span className="font-semibold text-[#1f2937]">
                {userProfile.preferences || (isZh ? '温和保湿配方' : 'Gentle soothing')}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#6b7280]">{isZh ? '避开成分' : 'Avoid Ingredients'}</span>
              <span className="font-semibold text-[#1f2937]">
                {userProfile.ingredientsToAvoid || (isZh ? '无特殊避讳' : 'None specified')}
              </span>
            </div>

            {/* Optional Skin-Profile Questionnaire Section */}
            <div className="pt-3.5 mt-2 border-t border-[#f0f9fa] space-y-2.5">
              {/* Draft Status Banner (if an in-progress draft exists) */}
              {questionnaireDraft && questionnaireDraft.answers && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0099A7]">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    <span>{isZh ? '草稿已保存' : 'Draft Saved'}</span>
                    {questionnaireDraft.savedAt && (
                      <span className="text-[10px] text-[#6b7280] font-normal">
                        ({new Date(questionnaireDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </div>
                  {onDiscardQuestionnaireDraft && (
                    <button
                      type="button"
                      onClick={onDiscardQuestionnaireDraft}
                      className="text-[10px] text-[#9ca3af] hover:text-red-500 font-normal hover:underline"
                    >
                      {isZh ? '舍弃草稿' : 'Discard'}
                    </button>
                  )}
                </div>
              )}

              {/* Completed Status Banner (if past completed questionnaire exists and not editing a draft) */}
              {questionnaireHistory.length > 0 && !(questionnaireDraft && questionnaireDraft.answers) && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#f0f9fa] border border-[#d0eff3] text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0099A7]">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>{isZh ? '已完成问卷' : 'Questionnaire Completed'}</span>
                  </div>
                  <span className="text-[10px] text-[#6b7280]">
                    {new Date(questionnaireHistory[0].createdAt).toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 提交
                  </span>
                </div>
              )}

              {/* Main Questionnaire Action Buttons */}
              {questionnaireDraft && questionnaireDraft.answers ? (
                <button
                  type="button"
                  onClick={onOpenQuestionnaire}
                  className="w-full py-2.5 px-4 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">edit_document</span>
                  <span>{isZh ? '继续填写问卷' : 'Continue Questionnaire'}</span>
                </button>
              ) : questionnaireHistory.length > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewQuestionnaireReport && questionnaireHistory[0]) {
                        onViewQuestionnaireReport(questionnaireHistory[0].associatedReport, questionnaireHistory[0]);
                      } else if (onOpenQuestionnaireHistory) {
                        onOpenQuestionnaireHistory();
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">analytics</span>
                    <span>{isZh ? '查看问卷与报告' : 'View Questionnaire & Report'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQuestionnaire}
                    className="py-2.5 px-3 rounded-full bg-[#f0f9fa] border border-[#d0eff3] hover:bg-[#e5f8fa] text-[#0099A7] font-semibold text-xs active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span>{isZh ? '重新填写' : 'Retake'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenQuestionnaire}
                  className="w-full py-2.5 px-4 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">assignment</span>
                  <span>{isZh ? '填写问卷，完善肤质报告' : 'Complete Questionnaire to Enhance Report'}</span>
                </button>
              )}

              {/* Supporting Note */}
              <p className="text-[10px] text-[#6b7280] text-center leading-relaxed px-1">
                {isZh
                  ? '问卷选填，不影响现有测肤与报告；填写内容可保存，稍后继续。'
                  : 'Optional questionnaire. Saves automatically and does not affect photo assessment.'}
              </p>

              {/* Secondary Action: 查看问卷记录 */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={onOpenQuestionnaireHistory}
                  className="text-[11px] text-[#0099A7] hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-xs">history</span>
                  <span>{isZh ? '查看问卷记录' : 'View Questionnaire Records'}</span>
                  {questionnaireHistory.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#0099A7]/10 text-[9px] font-bold text-[#0099A7]">
                      {questionnaireHistory.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Skin Assessment History Card - Collapsible */}
      <div className="bg-white rounded-3xl border border-[#e5f1f3] shadow-xs overflow-hidden transition-all">
        {/* Compact Collapsible Header */}
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          aria-expanded={isHistoryExpanded}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#fcfefe] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-lg text-[#0099A7] shrink-0">face_retouching_natural</span>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h4 className="font-headline font-bold text-xs text-[#1f2937] shrink-0">
                {isZh ? 'AI 视觉测肤档案' : 'AI Skin Assessment History'}
              </h4>
              <span className="text-[10px] font-bold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full shrink-0">
                {isZh ? `共 ${historyRecords.length} 条测肤记录` : `${historyRecords.length} records`}
              </span>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-[#0099A7] text-xl transition-transform duration-200 shrink-0 ml-2 ${
              isHistoryExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>

        {/* Collapsible Body */}
        {isHistoryExpanded && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 space-y-3.5 border-t border-[#e5f1f3]">
            {/* Top row with explanation and action controls */}
            <div className="flex items-center justify-between pt-3 pb-1 flex-wrap gap-2">
              <p className="text-[10px] text-[#6b7280]">
                {hasRecords
                  ? (isZh ? `已安全归档 ${historyRecords.length} 条真实测肤记录` : `${historyRecords.length} verified records saved`)
                  : (isZh ? '基于实拍照片表观与问卷授权保存' : 'Saved with consent based on actual analysis')}
              </p>

              <div className="flex items-center gap-1.5 ml-auto">
                {hasRecords && onClearAllHistory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearAllHistory();
                    }}
                    className="text-[11px] text-[#9ca3af] hover:text-[#d22630] transition-colors px-2 py-1 cursor-pointer"
                    type="button"
                    title={isZh ? '清空所有档案' : 'Clear all history'}
                  >
                    <span>{isZh ? '清空' : 'Clear'}</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartNewAssessment();
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[11px] font-semibold text-[#0099A7] hover:bg-[#e0f5f7] flex items-center gap-1 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">add</span>
                  <span>{hasRecords ? (isZh ? '再次测试' : 'New Test') : (isZh ? '开始测肤' : 'Start Test')}</span>
                </button>
              </div>
            </div>

            {/* State 1: Loading saved records */}
            {historyStatus === 'loading' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-7 h-7 rounded-full border-2 border-[#0099A7] border-t-transparent animate-spin"></div>
                <p className="text-xs text-[#6b7280]">
                  {isZh ? '正在读取测肤档案记录...' : 'Loading skin assessment records...'}
                </p>
              </div>
            )}

            {/* State 2: Failed to load records */}
            {historyStatus === 'error' && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                  <span className="material-symbols-outlined text-xl">error_outline</span>
                </div>
                <h4 className="font-bold text-xs text-[#1f2937]">
                  {isZh ? '档案读取失败' : 'Failed to Load Records'}
                </h4>
                <p className="text-[11px] text-[#6b7280] max-w-xs">
                  {isZh ? '读取本地测肤记录时发生异常，请点击重试。' : 'An error occurred while loading saved assessment records.'}
                </p>
                {onRetryLoadHistory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryLoadHistory();
                    }}
                    className="mt-1 px-3.5 py-1.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-xs font-semibold text-[#0099A7] hover:bg-[#e0f5f7] cursor-pointer"
                    type="button"
                  >
                    {isZh ? '重试加载' : 'Retry'}
                  </button>
                )}
              </div>
            )}

            {/* State 3: Successfully loaded with NO records */}
            {historyStatus === 'success' && !hasRecords && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7]">
                  <span className="material-symbols-outlined text-2xl">no_photography</span>
                </div>
                <h4 className="font-bold text-xs text-[#1f2937]">
                  {isZh ? '暂无肌肤测试记录' : 'No skin assessment yet'}
                </h4>
                <p className="text-[11px] text-[#6b7280] max-w-xs leading-relaxed">
                  {isZh 
                    ? '完成实拍或问卷测肤后，经您明确授权同意，测肤结果摘要将安全存放在此处。' 
                    : 'Complete an assessment on the Home screen to view your personalized observations here.'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartNewAssessment();
                  }}
                  className="mt-2 px-4 py-2 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>{isZh ? '开始肌肤测试' : 'Start Assessment'}</span>
                </button>
              </div>
            )}

            {/* State 4: Successfully loaded with real historical records */}
            {historyStatus === 'success' && hasRecords && (
              <div className="space-y-3">
                {historyRecords.map((record) => {
                  const dateObj = new Date(record.createdAt);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? (isZh
                        ? `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
                        : dateObj.toLocaleString())
                    : record.createdAt;

                  const snapshot = record.resultsSnapshot;
                  const hasOptical = record.hasOpticalRadar || (snapshot?.radarDimensions && snapshot.radarDimensions.some(d => d.canAssess && d.level !== null));

                  return (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] flex flex-col gap-2.5 transition-all"
                    >
                      {/* Top row: Method badge, Skin type, and Timestamp */}
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0099A7] border border-[#d0eff3]">
                            <span className="material-symbols-outlined text-xs">
                              {record.method === 'camera' ? 'photo_camera' : record.method === 'upload' ? 'upload_file' : 'quiz'}
                            </span>
                            <span>{isZh ? record.methodZh : record.methodEn}</span>
                          </span>

                          {record.skinType && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0099A7] text-white truncate max-w-[140px]">
                              {record.skinType}
                            </span>
                          )}
                        </div>

                        <span className="font-mono text-[10px] text-[#6b7280] shrink-0">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Concise summary directly from saved result */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#1f2937] leading-snug">
                          {record.summary}
                        </p>
                        {snapshot?.suggestedCosmeticRegimen?.stepOrder && snapshot.suggestedCosmeticRegimen.stepOrder.length > 0 && (
                          <p className="text-[10px] text-[#6b7280] flex items-center gap-1 flex-wrap">
                            <span className="font-medium text-[#0099A7]">{isZh ? '护理步骤：' : 'Regimen: '}</span>
                            <span>{snapshot.suggestedCosmeticRegimen.stepOrder.join(' → ')}</span>
                          </p>
                        )}
                      </div>

                      {/* Bottom row: Optical tag and View Results CTA */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#d0eff3]/60 text-[11px]">
                        <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#0099A7]">
                            {hasOptical ? 'radar' : 'assignment'}
                          </span>
                          <span>
                            {hasOptical 
                              ? (isZh ? '包含六维外观雷达分析' : 'Includes 6D optical radar')
                              : (isZh ? '问卷自评客观档案' : 'Questionnaire profile')}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onDeleteRecord && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRecord(record.id);
                              }}
                              className="text-[11px] text-[#9ca3af] hover:text-[#d22630] transition-colors p-1 cursor-pointer"
                              type="button"
                              title={isZh ? '删除此记录' : 'Delete record'}
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}

                          {onViewRecord && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewRecord(record);
                              }}
                              className="px-3 py-1 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-[11px] font-bold shadow-2xs flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer"
                              type="button"
                            >
                              <span>{isZh ? '查看结果' : 'View Results'}</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counter Appointment Status */}
      <div className="bg-white rounded-3xl p-5 border border-[#e5f1f3] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#0099A7]">calendar_month</span>
            <h4 className="font-headline font-bold text-xs text-[#1f2937]">
              {isZh ? '专柜服务预约' : 'Counter Appointment'}
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {isZh ? '已确认' : 'Confirmed'}
          </span>
        </div>

        <p className="text-xs text-[#4b5563]">
          {isZh ? appointment.storeNameZh : appointment.storeName}
        </p>
        <p className="text-xs text-[#6b7280]">
          {isZh ? `时间：${appointment.dateZh} ${appointment.time}` : `Time: ${appointment.date} ${appointment.time}`}
        </p>

        <div className="pt-1">
          <button
            onClick={onOpenPassModal}
            className="w-full py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] transition-all flex items-center justify-center gap-1.5 shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">qr_code</span>
            <span>{isZh ? '出示到店核销凭证' : 'Show Counter Pass'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MY ORDERS (我的订单) - Connected to Cart & Checkout Flow
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#e5f1f3] shadow-xs overflow-hidden transition-all">
        {/* Compact Collapsible Header */}
        <button
          type="button"
          onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
          aria-expanded={isOrdersExpanded}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#fcfefe] transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-lg text-[#0099A7] shrink-0">receipt_long</span>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h4 className="font-headline font-bold text-xs text-[#1f2937] shrink-0">
                {isZh ? '我的订单记录' : 'My Orders'}
              </h4>
              <span className="text-[10px] font-bold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full shrink-0">
                {isZh ? `共 ${orders.length} 笔订单` : `${orders.length} Orders`}
              </span>
            </div>
          </div>

          <span
            className={`material-symbols-outlined text-[#0099A7] text-xl transition-transform duration-200 shrink-0 ml-2 ${
              isOrdersExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>

        {/* Collapsible Body */}
        {isOrdersExpanded && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 space-y-3 border-t border-[#e5f1f3]">

        {orders.length === 0 ? (
          /* Empty State for New Users - No Sample History Fabricated! */
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7]">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </div>
            <h4 className="font-bold text-xs text-[#1f2937]">
              {isZh ? '暂无订单记录' : 'No orders yet'}
            </h4>
            <p className="text-[11px] text-[#6b7280] max-w-xs leading-relaxed">
              {isZh 
                ? '您尚未创建模拟配送订单或保存门店自购方案。在购物车完成模拟结算后，订单明细与状态将保存在此处。' 
                : 'You have not placed any demo orders yet. After checking out in Cart, your order records will appear here.'}
            </p>
            <button
              onClick={() => onNavigate('shop')}
              className="mt-2 px-4 py-2 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              {isZh ? '去商城逛逛' : 'Browse Shop'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {orders.map((order) => {
              const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
              const isOnline = order.purchaseMethod === 'online_delivery';
              return (
                <article
                  key={order.id}
                  className="bg-[#f0f9fa] rounded-2xl p-3.5 border border-[#d0eff3] space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#0099A7] text-[11px]">
                      {order.orderNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOnline 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isZh ? order.statusZh : order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-[#1f2937]">
                      {isOnline ? (isZh ? '在线快递配送' : 'Online Delivery') : (isZh ? '线下门店自购' : 'In-Store Plan')}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-1.5 pt-1 border-t border-white">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white border border-[#e5f1f3] shrink-0 p-0.5 flex items-center justify-center">
                            <SafeProductImage src={item.image} alt={item.name} />
                          </div>
                          <span className="truncate text-[#1f2937] font-medium text-[11px]">
                            {isZh ? item.nameZh : item.name}
                          </span>
                        </div>
                        <span className="text-[#6b7280] text-[11px] shrink-0 ml-2">
                          ¥{item.price} x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[10px] text-[#0099A7] font-semibold text-right">
                        {isZh ? `等共 ${totalItemsCount} 件商品` : `and ${totalItemsCount - 2} more items`}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#e5f1f3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6b7280] mr-1">{isZh ? '实付金额:' : 'Total:'}</span>
                      <span className="font-extrabold text-[#1f2937] text-xs">¥{order.totalAmount.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => setSelectedOrderForDetail(order)}
                      className="px-3 py-1 rounded-full bg-white border border-[#d0eff3] text-[#0099A7] hover:bg-[#e0f5f7] text-[11px] font-bold shadow-2xs cursor-pointer"
                      type="button"
                    >
                      {isZh ? '查看详情' : 'Details'}
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Prototype Limitation Disclaimer */}
            <p className="text-[10px] text-[#6b7280] leading-relaxed pt-1 bg-[#f0f9fa] p-2 rounded-xl border border-[#e5f1f3]">
              <span className="font-bold text-[#0099A7]">
                {isZh ? '【原型存储说明】' : '【Prototype Storage Notice】'}
              </span>
              <span>
                {isZh
                  ? '订单数据已安全保存在当前设备本地浏览器（localStorage）。本原型仅供功能演示，不产生真实扣款与实际快递发货。'
                  : 'Orders are stored locally on this device in prototype mode. No real transactions occur.'}
              </span>
            </p>
          </div>
        )}
          </div>
        )}
      </div>

      {/* =========================================================================
          ORDER DETAILS MODAL
         ========================================================================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#d0eff3] shadow-2xl flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1f2937]">
                <span className="material-symbols-outlined text-[#0099A7]">receipt</span>
                <span>{isZh ? '订单详情' : 'Order Details'}</span>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-6 h-6 rounded-full bg-[#f0f9fa] flex items-center justify-center text-gray-500 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[#6b7280]">{isZh ? '订单编号:' : 'Order No:'}</span>
                <span className="font-mono font-bold text-[#0099A7]">{selectedOrderForDetail.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6b7280]">{isZh ? '下单时间:' : 'Date:'}</span>
                <span className="text-[#1f2937]">{new Date(selectedOrderForDetail.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6b7280]">{isZh ? '购买方式:' : 'Method:'}</span>
                <span className="font-bold text-[#1f2937]">
                  {selectedOrderForDetail.purchaseMethod === 'online_delivery' 
                    ? (isZh ? '在线快递配送' : 'Online Delivery') 
                    : (isZh ? '线下门店自购' : 'In-Store Plan')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6b7280]">{isZh ? '当前状态:' : 'Status:'}</span>
                <span className="font-bold text-[#0099A7]">{isZh ? selectedOrderForDetail.statusZh : selectedOrderForDetail.status}</span>
              </div>
            </div>

            {/* Delivery address or Store details */}
            <div className="p-3 bg-white rounded-2xl border border-[#e5f1f3] text-xs space-y-1">
              {selectedOrderForDetail.purchaseMethod === 'online_delivery' && selectedOrderForDetail.deliveryAddress ? (
                <div>
                  <span className="font-bold text-[#0099A7] block mb-1">{isZh ? '配送地址与收件人' : 'Delivery Address'}</span>
                  <p className="font-bold text-[#1f2937]">{selectedOrderForDetail.deliveryAddress.recipient} ({selectedOrderForDetail.deliveryAddress.phone})</p>
                  <p className="text-[#4b5563] text-[11px] mt-0.5">{selectedOrderForDetail.deliveryAddress.region} {selectedOrderForDetail.deliveryAddress.detail}</p>
                </div>
              ) : selectedOrderForDetail.storeInfo ? (
                <div>
                  <span className="font-bold text-[#0099A7] block mb-1">{isZh ? '目标自选门店' : 'Target Store'}</span>
                  <p className="font-bold text-[#1f2937]">{isZh ? selectedOrderForDetail.storeInfo.storeNameZh : selectedOrderForDetail.storeInfo.storeName}</p>
                  <p className="text-[#4b5563] text-[11px] mt-0.5">{isZh ? selectedOrderForDetail.storeInfo.addressZh : selectedOrderForDetail.storeInfo.address}</p>
                  <p className="text-[10px] text-[#6b7280] mt-1">{isZh ? '注：自购清单不锁定实物库存，进店后可直接出示协助选品。' : 'Notice: Items are not reserved in inventory.'}</p>
                </div>
              ) : null}
            </div>

            {/* Full items list */}
            <div className="space-y-2 border border-[#e5f1f3] rounded-2xl p-3 bg-[#f0f9fa] max-h-48 overflow-y-auto">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                {isZh ? '购买商品清单' : 'Purchased Items'}
              </span>
              {selectedOrderForDetail.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-200/60 last:border-b-0 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#e5f1f3] shrink-0 p-0.5 flex items-center justify-center">
                      <SafeProductImage src={item.image} alt={item.name} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#1f2937] text-xs truncate">{isZh ? item.nameZh : item.name}</p>
                      <p className="text-[10px] text-[#6b7280]">{item.size} • ¥{item.price}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#1f2937]">x{item.quantity}</span>
                    <p className="text-xs font-bold text-[#0099A7]">¥{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee summary */}
            <div className="space-y-1 text-xs pt-1 border-t border-[#e5f1f3]">
              <div className="flex justify-between text-[#6b7280]">
                <span>{isZh ? '商品小计' : 'Subtotal'}</span>
                <span>¥{selectedOrderForDetail.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrderForDetail.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{isZh ? '会员满减' : 'Member Discount'}</span>
                  <span>-¥{selectedOrderForDetail.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6b7280]">
                <span>{isZh ? '运费' : 'Shipping'}</span>
                <span>{selectedOrderForDetail.shippingFee === 0 ? (isZh ? '包邮 / 免运费' : 'Free') : `¥${selectedOrderForDetail.shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#1f2937] pt-1 border-t border-[#e5f1f3]">
                <span>{isZh ? '实付总额' : 'Total'}</span>
                <span className="text-[#0099A7]">¥{selectedOrderForDetail.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-full py-2.5 rounded-full bg-[#0099A7] text-white font-bold text-xs hover:bg-[#007d89] cursor-pointer"
                type="button"
              >
                {isZh ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Account Management & Logout */}
      {onLogout && (
        <div className="pt-2 pb-4">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-full border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer shadow-3xs"
            type="button"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>{isZh ? '退出当前账号' : 'Log Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
