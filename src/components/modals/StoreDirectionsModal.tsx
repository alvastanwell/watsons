import React from 'react';
import { Language, InStoreAppointment } from '../../types';

interface StoreDirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: InStoreAppointment;
  language: Language;
}

export const StoreDirectionsModal: React.FC<StoreDirectionsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#c7e5da]/40 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#e5f1f3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f0f9fa] flex items-center justify-center text-[#0099A7] border border-[#d0eff3]">
              <span className="material-symbols-outlined text-lg">location_on</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-[#1f2937]">
                {language === 'en' ? 'Store & Counter Guide' : '门店专柜导航指引'}
              </h3>
              <p className="text-[11px] text-[#4b5563]">
                {language === 'en' ? '0.8 km • ~10 min walk' : '距离 0.8 km • 步行约 10 分钟'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f9fa] flex items-center justify-center text-[#4b5563] hover:text-[#0099A7]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Map Illustration Frame */}
        <div className="relative w-full h-48 bg-[#e6f6f8] overflow-hidden flex items-center justify-center">
          {/* Simulated stylized map */}
          <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
            <rect width="400" height="200" fill="#f0f9fa" />
            {/* Roads */}
            <path d="M-20 60 L420 80" stroke="#ffffff" strokeWidth="24" />
            <path d="M-20 150 L420 130" stroke="#ffffff" strokeWidth="20" />
            <path d="M120 -20 L150 220" stroke="#ffffff" strokeWidth="22" />
            <path d="M280 -20 L270 220" stroke="#ffffff" strokeWidth="18" />
            {/* Metro Jing'an Station */}
            <rect x="70" y="48" width="55" height="24" rx="4" fill="#0099A7" opacity="0.85" />
            <text x="76" y="64" fill="#ffffff" fontSize="9" fontWeight="bold">Metro L2/L7</text>
            {/* Walking path dots */}
            <path d="M130 65 Q 180 68, 220 110 T 268 135" stroke="#0099A7" strokeWidth="4" strokeDasharray="6 4" />
            {/* Destination Pin */}
            <circle cx="270" cy="135" r="14" fill="#0099A7" opacity="0.25" className="animate-ping" />
            <circle cx="270" cy="135" r="10" fill="#0099A7" />
            <circle cx="270" cy="135" r="4" fill="#ffffff" />
          </svg>

          {/* Store Pin Label overlay */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#d0eff3] shadow-sm flex items-center gap-1.5 text-xs text-[#0099A7] font-semibold">
            <span className="material-symbols-outlined text-sm">storefront</span>
            <span>{language === 'en' ? 'Flagship Counter #108' : '旗舰店 2F 护肤专柜'}</span>
          </div>
        </div>

        {/* Address and details */}
        <div className="p-5 flex flex-col gap-3 bg-[#f0f9fa]">
          <div className="bg-white p-3.5 rounded-2xl border border-[#e5f1f3] flex flex-col gap-2">
            <div>
              <p className="text-xs font-bold text-[#1f2937]">
                {language === 'en' ? appointment.storeName : appointment.storeNameZh}
              </p>
              <p className="text-[11px] text-[#6b7280] mt-0.5">
                {language === 'en' ? appointment.address : appointment.addressZh}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f0f9fa]">
              <span className="text-[#6b7280]">{language === 'en' ? 'Hours' : '营业时间'}</span>
              <span className="font-semibold text-[#1f2937]">10:00 – 22:00</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b7280]">{language === 'en' ? 'Direct Hotline' : '专柜直线'}</span>
              <span className="font-semibold text-[#0099A7]">+86 21 6288 3890</span>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#d0eff3] rounded-xl flex items-start gap-2 text-xs text-[#0099A7]">
            <span className="material-symbols-outlined text-base shrink-0">stairs</span>
            <p className="text-[#1f2937]">
              {language === 'en'
                ? 'Enter through main entrance on West Nanjing Road, take escalator to 2F Skin Sanctuary. Advisor Sherry will greet you.'
                : '由南京西路主入口进入，乘直梯上至 2层 美肤专区（Skin Sanctuary），出示核销码即可领取小样并体验一对一配方咨询。'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#0099A7] text-white text-xs font-semibold shadow-sm hover:bg-[#007d89] active:scale-95 transition-all"
          >
            {language === 'en' ? 'Got It' : '已知晓'}
          </button>
        </div>
      </div>
    </div>
  );
};
