import React, { useState } from 'react';
import { RoutineStep, SkinAssessmentResult, Language, ProductItem } from '../../types';
import { WATSONS_PRODUCT_CATALOGUE, toProductItem } from '../../data/productCatalogue';
import { SafeProductImage } from '../common/SafeProductImage';

interface IngredientSuggestionCardProps {
  step: RoutineStep;
  savedAssessment: SkinAssessmentResult | null;
  language: Language;
  onAddToCart?: (product: ProductItem) => void;
  onShowToast: (msg: string) => void;
}

export const IngredientSuggestionCard: React.FC<IngredientSuggestionCardProps> = ({
  step,
  savedAssessment,
  language,
  onAddToCart,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const [isOpen, setIsOpen] = useState(false);

  // If no saved assessment, do not display anything!
  if (!savedAssessment) return null;

  // Extract relevant active ingredient from real assessment
  const raw = savedAssessment as any;
  const assessmentIngredients: string[] = [];
  if (Array.isArray(savedAssessment.suggestedCosmeticRegimen?.keyActiveCategories)) {
    assessmentIngredients.push(...savedAssessment.suggestedCosmeticRegimen.keyActiveCategories);
  }
  if (Array.isArray(raw?.analysis?.keyIngredients)) {
    assessmentIngredients.push(...raw.analysis.keyIngredients);
  }
  if (Array.isArray(raw?.recommendedIngredients)) {
    assessmentIngredients.push(...raw.recommendedIngredients);
  }
  if (Array.isArray(raw?.keyIngredients)) {
    assessmentIngredients.push(...raw.keyIngredients);
  }
  if (Array.isArray(raw?.formulaPriorities)) {
    assessmentIngredients.push(...raw.formulaPriorities);
  }

  // Fallback to grounded core actives if assessment has custom structure
  const activePool = assessmentIngredients.length > 0 
    ? assessmentIngredients 
    : ['神经酰胺', '积雪草苷', '维生素原B5', '角鲨烷'];

  // Match ingredient by category
  const categoryLower = (step.categoryZh || step.category || '').toLowerCase();
  let targetIngredient = '神经酰胺';
  if (categoryLower.includes('洁面') || categoryLower.includes('clean')) {
    targetIngredient = activePool.find(i => i.includes('氨基酸') || i.includes('神经酰胺')) || '氨基酸与神经酰胺';
  } else if (categoryLower.includes('水') || categoryLower.includes('toner')) {
    targetIngredient = activePool.find(i => i.includes('积雪草') || i.includes('泛醇') || i.includes('玻尿酸')) || '积雪草';
  } else if (categoryLower.includes('精华') || categoryLower.includes('serum')) {
    targetIngredient = activePool.find(i => i.includes('麦角硫因') || i.includes('虾青素') || i.includes('二裂酵母') || i.includes('油橄榄')) || '积雪草苷';
  } else if (categoryLower.includes('乳') || categoryLower.includes('霜') || categoryLower.includes('cream')) {
    targetIngredient = activePool.find(i => i.includes('神经酰胺') || i.includes('角鲨烷') || i.includes('马齿苋')) || '神经酰胺';
  } else if (categoryLower.includes('防晒') || categoryLower.includes('sun')) {
    targetIngredient = '温和物理防晒剂与舒缓成分';
  } else {
    targetIngredient = activePool[0] || '神经酰胺';
  }

  // Find store products matching this ingredient for "看看推荐"
  const matchingCatalogueProducts = WATSONS_PRODUCT_CATALOGUE.filter((p) => {
    const hay = [
      p.name_zh,
      p.brand_zh,
      ...p.ingredients,
      ...p.supported_benefits_zh
    ].join(' ');
    return hay.includes(targetIngredient) || targetIngredient.split('').some(c => hay.includes(c));
  }).slice(0, 2);

  const matchedItems: ProductItem[] = matchingCatalogueProducts.map((p) => toProductItem(p, isZh ? 'zh' : 'en'));

  return (
    <div className="mt-2 rounded-xl bg-gradient-to-r from-[#f0f9fa] to-white border border-[#d0eff3] p-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[#00939F] text-base shrink-0">
            science
          </span>
          <p className="text-[11px] text-[#1f2937] leading-snug">
            {isZh ? (
              <>
                根据测肤结果，这一步可以考虑含 <span className="font-bold text-[#00939F]">{targetIngredient}</span> 成分的产品
              </>
            ) : (
              <>
                Based on skin test, consider products with <span className="font-bold text-[#00939F]">{targetIngredient}</span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#d0eff3] text-[11px] font-bold text-[#00939F] hover:bg-[#e0f5f7] flex items-center gap-0.5 transition-all cursor-pointer shadow-3xs"
          type="button"
        >
          <span>{isZh ? (isOpen ? '收起' : '看看推荐') : (isOpen ? 'Less' : 'View Picks')}</span>
          <span className="material-symbols-outlined text-xs">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {isOpen && matchedItems.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#d0eff3]/60 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-[10px] text-[#6b7280]">
            <span>{isZh ? '严选适配专柜正品' : 'Watsons Recommendations'}</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              {isZh ? '屈臣氏推荐 · 推广' : 'Sponsored'}
            </span>
          </div>

          <div className="space-y-2">
            {matchedItems.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-[#e5f1f3]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-[#f0f9fa] shrink-0 p-0.5 flex items-center justify-center border border-[#e5f1f3] overflow-hidden">
                    <SafeProductImage src={prod.image} alt={prod.nameZh} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-[#00939F] bg-[#f0f9fa] px-1 rounded">
                        {prod.brand}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#1f2937] truncate">
                        {isZh ? prod.nameZh : prod.name}
                      </h5>
                    </div>
                    <p className="text-[10px] text-[#00939F] font-semibold mt-0.5">
                      ¥{prod.price} <span className="text-[9px] text-[#9ca3af] font-normal">{prod.size}</span>
                    </p>
                  </div>
                </div>

                {onAddToCart && (
                  <button
                    onClick={() => {
                      onAddToCart(prod);
                      onShowToast(isZh ? `已将【${prod.nameZh}】加入购物车` : `Added to cart`);
                    }}
                    className="shrink-0 px-2 py-1 rounded-full bg-[#00939F] text-white text-[10px] font-bold hover:bg-[#007d89] transition-colors"
                    type="button"
                  >
                    {isZh ? '+ 加购' : '+ Cart'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
