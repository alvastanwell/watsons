import React, { useState } from 'react';
import { ProductItem, Language } from '../../types';
import { SafeProductImage } from '../common/SafeProductImage';
import { getProductById } from '../../data/productCatalogue';

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: ProductItem, quantity: number) => void;
  onAddToRoutine: (product: ProductItem) => void;
  onReserveSample: (product: ProductItem) => void;
  language: Language;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToRoutine,
  onReserveSample,
  language
}) => {
  if (!isOpen || !product) return null;
  const isZh = language === 'zh';
  const [quantity, setQuantity] = useState(1);
  const record = getProductById(product.id);

  const benefits = record 
    ? (isZh ? record.supported_benefits_zh : record.supported_benefits)
    : [product.whyMatches || 'Barrier support and comfort'];

  const usageInfo = record?.usage_instructions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-sm max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#d0eff3] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image Area */}
        <div className="relative w-full h-52 bg-[#f0f9fa] flex items-center justify-center p-4 border-b border-[#e5f1f3]">
          <SafeProductImage
            src={product.image}
            alt={isZh ? product.nameZh : product.name}
            className="h-full object-contain"
          />

          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-[#4b5563] flex items-center justify-center hover:bg-white hover:text-[#0099A7] transition-all shadow-xs"
            type="button"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-[#0099A7] text-white text-[11px] font-semibold">
            {isZh ? '屈臣氏正品精选' : 'Official Watsons Assortment'}
          </span>
        </div>

        {/* Scrollable Details */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 bg-white">
          <div>
            <span className="text-xs font-bold text-[#0099A7] uppercase tracking-wider block">
              {product.brand}
            </span>
            <h3 className="text-base font-headline font-bold text-[#1f2937] mt-0.5 leading-snug">
              {isZh ? product.nameZh : product.name}
            </h3>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-black text-[#1f2937]">¥{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-[#9ca3af] line-through">¥{product.originalPrice}</span>
              )}
              <span className="text-[11px] text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3] px-2 py-0.5 rounded-full font-semibold">
                {product.size}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 bg-[#f0f9fa] rounded-2xl border border-[#e5f1f3]">
            <span className="text-xs font-semibold text-[#1f2937]">
              {isZh ? '购买数量' : 'Quantity'}
            </span>
            <div className="flex items-center gap-3 bg-white rounded-full border border-[#d0eff3] px-2.5 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-[#0099A7] font-bold text-xs"
                type="button"
              >
                -
              </button>
              <span className="text-xs font-bold text-[#1f2937] min-w-[16px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-[#0099A7] font-bold text-xs"
                type="button"
              >
                +
              </button>
            </div>
          </div>

          {/* Verified Supported Benefits */}
          <div className="bg-[#f0f9fa] rounded-2xl p-3.5 border border-[#e5f1f3] flex flex-col gap-2">
            <h4 className="text-xs font-bold text-[#1f2937] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#0099A7]">verified</span>
              {isZh ? '官方支持护肤功效' : 'Verified Formulation Benefits'}
            </h4>
            <div className="flex flex-col gap-1.5 text-xs text-[#4b5563]">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[#0099A7] font-bold">•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Actives & Formula Features */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#e5f1f3] flex flex-col gap-2">
            <h4 className="text-xs font-bold text-[#1f2937] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#0099A7]">science</span>
              {isZh ? '核心配方与质地' : 'Ingredients & Texture'}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(product.keyActives || []).map((active, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] text-[11px] font-medium"
                >
                  {active}
                </span>
              ))}
              {product.isFragranceFree && (
                <span className="px-2.5 py-1 rounded-full bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] text-[11px] font-medium">
                  {isZh ? '无香精添加' : 'Fragrance-Free'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6b7280] mt-1">
              {isZh ? `质地特性：${product.textureZh}` : `Texture: ${product.texture}`}
            </p>
          </div>

          {/* Concise Usage Instructions */}
          {usageInfo && (
            <div className="p-3.5 bg-white rounded-2xl border border-[#e5f1f3] text-xs space-y-1.5">
              <h4 className="font-bold text-[#1f2937] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#0099A7]">routine</span>
                {isZh ? '建议使用方法' : 'Usage Instructions'}
              </h4>
              <p className="text-[#4b5563] leading-relaxed">
                {isZh ? usageInfo.general_zh : usageInfo.general}
              </p>
            </div>
          )}

          {/* Bundle promotion banner if exists */}
          {product.bundleOffer && (
            <div className="p-3 bg-[#fff5f5] rounded-xl border-l-4 border-[#d22630] border border-[#fecaca] text-xs text-[#1f2937]">
              <span className="font-bold text-[#d22630] block">
                {isZh ? '专柜礼遇与优惠：' : 'Promotion Perk:'}
              </span>
              <p className="text-[#4b5563] mt-0.5">
                {isZh ? product.bundleOfferZh : product.bundleOffer}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Keep Add to Cart and Add to Daily Routine Separate */}
        <div className="p-4 bg-white border-t border-[#e5f1f3] grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={() => {
              if (onAddToCart) {
                onAddToCart(product, quantity);
              }
              onClose();
            }}
            className="w-full py-2.5 rounded-full bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] text-xs font-bold hover:bg-[#e0f5f7] transition-all flex items-center justify-center gap-1 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>{isZh ? `加入购物车 (${quantity})` : `Add to Cart (${quantity})`}</span>
          </button>

          <button
            onClick={() => {
              onAddToRoutine(product);
              onClose();
            }}
            className="w-full py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-base">spa</span>
            <span>{isZh ? '同步至护肤方案' : 'Add to Routine'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
