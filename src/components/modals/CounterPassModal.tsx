import React from 'react';
import { Language, InStoreAppointment } from '../../types';
import { translations } from '../../data/translations';

interface CounterPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: InStoreAppointment;
  language: Language;
}

export const CounterPassModal: React.FC<CounterPassModalProps> = ({
  isOpen,
  onClose,
  appointment,
  language
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#c7e5da]/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-[#007d89] to-[#0099A7] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/aistudio/222_00d72993.png" 
              alt="Watsons" 
              className="h-8 w-auto max-w-[105px] object-contain rounded bg-white p-0.5" 
            />
            <div>
              <p className="text-[11px] text-[#d2eff2] font-semibold tracking-wider uppercase">
                {language === 'en' ? 'Watsons Offline Pass' : '屈臣氏专柜核销凭证'}
              </p>
              <h3 className="text-base font-bold font-headline leading-tight text-white">
                {language === 'en' ? 'Counter Trial Pass' : '专柜免费试用领样码'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Pass Body */}
        <div className="p-5 flex flex-col items-center bg-[#f0f9fa]">
          {/* QR Code container */}
          <div className="p-3 bg-white rounded-2xl border border-[#e5f1f3] shadow-sm flex flex-col items-center">
            {/* SVG Dynamic QR Code simulation */}
            <svg className="w-48 h-48" viewBox="0 0 120 120" fill="none">
              <rect width="120" height="120" rx="8" fill="white" />
              {/* Corner position markers */}
              <rect x="10" y="10" width="30" height="30" rx="4" fill="#0099A7" />
              <rect x="16" y="16" width="18" height="18" rx="2" fill="white" />
              <rect x="20" y="20" width="10" height="10" rx="1" fill="#0099A7" />

              <rect x="80" y="10" width="30" height="30" rx="4" fill="#0099A7" />
              <rect x="86" y="16" width="18" height="18" rx="2" fill="white" />
              <rect x="90" y="20" width="10" height="10" rx="1" fill="#0099A7" />

              <rect x="10" y="80" width="30" height="30" rx="4" fill="#0099A7" />
              <rect x="16" y="86" width="18" height="18" rx="2" fill="white" />
              <rect x="20" y="90" width="10" height="10" rx="1" fill="#0099A7" />

              {/* Data matrix dots */}
              <circle cx="50" cy="20" r="3" fill="#0099A7" />
              <circle cx="65" cy="20" r="3" fill="#0099A7" />
              <circle cx="50" cy="35" r="3" fill="#0099A7" />
              <circle cx="65" cy="35" r="3" fill="#0099A7" />
              <circle cx="25" cy="55" r="3" fill="#0099A7" />
              <circle cx="40" cy="55" r="3" fill="#0099A7" />
              <circle cx="55" cy="55" r="3" fill="#0099A7" />
              <circle cx="70" cy="55" r="3" fill="#0099A7" />
              <circle cx="85" cy="55" r="3" fill="#0099A7" />
              <circle cx="100" cy="55" r="3" fill="#0099A7" />

              <circle cx="50" cy="70" r="3" fill="#0099A7" />
              <circle cx="65" cy="70" r="3" fill="#0099A7" />
              <circle cx="80" cy="70" r="3" fill="#0099A7" />
              <circle cx="95" cy="70" r="3" fill="#0099A7" />

              <circle cx="50" cy="85" r="3" fill="#0099A7" />
              <circle cx="70" cy="85" r="3" fill="#0099A7" />
              <circle cx="85" cy="85" r="3" fill="#0099A7" />
              <circle cx="100" cy="85" r="3" fill="#0099A7" />

              <circle cx="50" cy="100" r="3" fill="#0099A7" />
              <circle cx="65" cy="100" r="3" fill="#0099A7" />
              <circle cx="80" cy="100" r="3" fill="#0099A7" />
            </svg>
            <p className="font-mono text-xs text-[#0099A7] font-bold tracking-widest mt-1">
              {appointment.qrCodeId}
            </p>
          </div>

          <p className="text-[12px] text-[#4b5563] mt-3 text-center">
            {language === 'en'
              ? 'Present this dynamic QR code to Advisor Sherry Chen at the 2F Skin Sanctuary counter.'
              : '请在到店时出示此动态核销码给 2F 美肤专区顾问陈女士。'}
          </p>

          {/* Ticket Info Bento */}
          <div className="w-full bg-white rounded-2xl p-3.5 mt-3 border border-[#e5f1f3] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{language === 'en' ? 'Store' : '预约门店'}</span>
              <span className="font-semibold text-[#1f2937] text-right truncate max-w-[180px]">
                {language === 'en' ? appointment.storeName : appointment.storeNameZh}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#f0f9fa]">
              <span className="text-[#6b7280]">{language === 'en' ? 'Time' : '预约时间'}</span>
              <span className="font-semibold text-[#0099A7]">
                {language === 'en' ? `${appointment.date}, ${appointment.time}` : `${appointment.dateZh} ${appointment.time}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b7280]">{language === 'en' ? 'Reserved Gift' : '预留礼遇'}</span>
              <span className="font-semibold text-[#1f2937] text-right">
                {language === 'en' ? 'Cicaplast B5+ (15ml)' : '理肤泉 B5+ 15ml 体验装'}
              </span>
            </div>
          </div>

          {/* Offline caching badge */}
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#00838f]">
            <span className="material-symbols-outlined text-sm text-[#0099A7]">offline_pin</span>
            <span>{language === 'en' ? 'Saved to offline cache (valid without WiFi)' : '已离线缓存，无网络也可核销'}</span>
          </div>

          {/* Close / Action button */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-full bg-[#0099A7] text-white font-semibold text-sm shadow-sm active:scale-95 transition-all hover:bg-[#007d89]"
          >
            {language === 'en' ? 'Done' : '完成'}
          </button>
        </div>
      </div>
    </div>
  );
};
