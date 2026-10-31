import React, { useState } from 'react';
import { Language, QuestionnaireHistoryRecord, SkinAssessmentResult } from '../../types';

interface QuestionnaireHistoryModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  records: QuestionnaireHistoryRecord[];
  onViewReport: (report: SkinAssessmentResult, record: QuestionnaireHistoryRecord) => void;
  onClearHistory?: () => void;
}

export const QuestionnaireHistoryModal: React.FC<QuestionnaireHistoryModalProps> = ({
  language,
  isOpen,
  onClose,
  records,
  onViewReport,
  onClearHistory
}) => {
  const isZh = language === 'zh';
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(
    records.length > 0 ? records[0].id : null
  );

  if (!isOpen) return null;

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#d0eff3] overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#f0f9fa] border-b border-[#d0eff3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#0099A7] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-base">history_edu</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#1f2937]">
                {isZh ? '问卷历史记录' : 'Questionnaire History'}
              </h3>
              <p className="text-[10px] text-[#6b7280]">
                {isZh ? `已归档 ${records.length} 次自评问卷记录（按最新时间排序）` : `${records.length} records archived`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white border border-[#e5f1f3] flex items-center justify-center text-[#6b7280] hover:text-[#1f2937]"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {sortedRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-14 h-14 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7]">
                <span className="material-symbols-outlined text-2xl">content_paste_off</span>
              </div>
              <h4 className="font-bold text-sm text-[#1f2937]">
                {isZh ? '暂无已提交的问卷记录' : 'No Submitted Questionnaires'}
              </h4>
              <p className="text-xs text-[#6b7280] max-w-xs">
                {isZh 
                  ? '填写并提交深度肤质自评问卷后，您的所有历史回答与对应生成的护肤方案将安全归档在此处。' 
                  : 'Complete and submit the skin profile questionnaire to archive your responses and reports here.'}
              </p>
            </div>
          ) : (
            sortedRecords.map((rec) => {
              const isExpanded = expandedRecordId === rec.id;
              const dateStr = new Date(rec.createdAt).toLocaleString(isZh ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={rec.id}
                  className="bg-white rounded-2xl border border-[#e5f1f3] shadow-2xs overflow-hidden transition-all"
                >
                  {/* Card Summary Header */}
                  <div className="p-4 bg-[#f8fdfe] border-b border-[#e5f1f3] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#0099A7]/10 text-[#0099A7] font-bold text-[10px]">
                          {rec.id}
                        </span>
                        <span className="text-[11px] text-[#6b7280]">
                          {dateStr}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewReport(rec.associatedReport, rec)}
                        className="px-3 py-1 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">analytics</span>
                        <span>{isZh ? '查看当时报告' : 'View Report'}</span>
                      </button>
                    </div>

                    {/* Summary Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-[#d0eff3] text-[11px] font-semibold text-[#1f2937]">
                        {rec.summary.skinTypeZh}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-[#d0eff3] text-[11px] text-[#0099A7]">
                        {rec.summary.toleranceZh}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-[#d0eff3] text-[11px] text-[#4b5563]">
                        {rec.summary.goalZh}
                      </span>
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                      className="text-xs text-[#0099A7] hover:underline font-semibold flex items-center gap-1 pt-1 self-start"
                    >
                      <span>{isExpanded ? (isZh ? '收起问卷明细' : 'Hide Answers') : (isZh ? '展开查看问卷原始回答' : 'View Full Answers')}</span>
                      <span className="material-symbols-outlined text-xs">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>

                  {/* Expanded Full Questions & Answers View */}
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-3 text-xs text-[#374151] animate-fade-in border-t border-[#f0f9fa]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">1. 洁面后肤感</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.cleansingSensation === 'tight' ? '紧绷、干燥或微涩' :
                             rec.answers.cleansingSensation === 'comfortable' ? '温和柔润、舒适无不适' :
                             rec.answers.cleansingSensation === 'greasy' ? '较快冒油光或黏腻' : '不确定 / 未填写'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">2. 日间出油分布</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.daytimeOiliness === 't_zone_only' ? '仅 T区（额头/鼻翼）偏油' :
                             rec.answers.daytimeOiliness === 'whole_face' ? '全脸均明显出油发亮' :
                             rec.answers.daytimeOiliness === 'rarely_oily' ? '全天基本不出油甚至偏干' : '不确定 / 未填写'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">3. 干燥紧绷频率</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.drynessFrequency === 'frequent' ? '经常出现（几乎每天）' :
                             rec.answers.drynessFrequency === 'seasonal' ? '换季或秋冬时偶尔出现' :
                             rec.answers.drynessFrequency === 'rare' ? '极少感到干燥紧绷' : '不确定 / 未填写'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">4. 护肤品刺激反应</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.productReactions.length > 0 
                              ? rec.answers.productReactions.join('、') 
                              : '未勾选明显刺激'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">5. 环境变化诱发反应</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.environmentalTriggers.length > 0 
                              ? rec.answers.environmentalTriggers.join('、') 
                              : '无明显环境易感'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">6. 核心关注困扰</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.summary.concernsZh.join('、')}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">7. 防晒使用习惯</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.answers.sunscreenFrequency === 'daily' ? '每天出门均涂抹防晒' :
                             rec.answers.sunscreenFrequency === 'sunny_days_only' ? '仅阳光烈或长时间户外' :
                             rec.answers.sunscreenFrequency === 'rarely' ? '偶尔或基本不涂防晒' : '不确定 / 未填写'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#f0f9fa] border border-[#e5f1f3]">
                          <span className="text-[10px] text-[#6b7280] block font-medium">8. 质地偏好与首要目标</span>
                          <span className="font-semibold text-[#1f2937]">
                            {rec.summary.textureZh} • {rec.summary.goalZh}
                          </span>
                        </div>
                      </div>

                      {/* Custom inputs if any */}
                      {(rec.answers.customConcernText || rec.answers.avoidIngredientsInput || rec.answers.specialNotes) && (
                        <div className="p-2.5 rounded-xl bg-[#f8fdfe] border border-[#d0eff3] space-y-1 text-[11px]">
                          {rec.answers.customConcernText && (
                            <p><span className="text-[#6b7280]">局部困扰：</span>{rec.answers.customConcernText}</p>
                          )}
                          {rec.answers.avoidIngredientsInput && (
                            <p><span className="text-[#6b7280]">避开成分：</span>{rec.answers.avoidIngredientsInput}</p>
                          )}
                          {rec.answers.specialNotes && (
                            <p><span className="text-[#6b7280]">补充说明：</span>{rec.answers.specialNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f0f9fa] border-t border-[#d0eff3] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#6b7280]">
            {isZh ? '问卷记录仅保存在本地设备，保护个人隐私。' : 'Records stored locally.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89]"
          >
            {isZh ? '完成' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
