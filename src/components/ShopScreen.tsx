import React, { useState, useMemo } from 'react';
import { Language, ProductItem, ScreenId } from '../types';
import { WATSONS_PRODUCT_CATALOGUE, ProductRecord, toProductItem } from '../data/productCatalogue';
import { SafeProductImage } from './common/SafeProductImage';

interface ShopScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  onSelectProduct: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem, quantity?: number) => void;
  onAddToRoutine: (product: ProductItem) => void;
  onShowToast: (msg: string) => void;
  customCatalogue?: ProductRecord[];
  onImportCatalogue?: (imported: ProductRecord[]) => void;
}

type CategoryFilter = 'all' | 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen' | 'mask';

export const ShopScreen: React.FC<ShopScreenProps> = ({
  language,
  onNavigate,
  onSelectProduct,
  onAddToCart,
  onAddToRoutine,
  onShowToast,
  customCatalogue,
  onImportCatalogue
}) => {
  const isZh = language === 'zh';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const fullCatalogue = customCatalogue || WATSONS_PRODUCT_CATALOGUE;

  const categories: Array<{ id: CategoryFilter; labelEn: string; labelZh: string }> = [
    { id: 'all', labelEn: 'All', labelZh: '全部' },
    { id: 'cleanser', labelEn: 'Cleansers', labelZh: '洁面' },
    { id: 'toner', labelEn: 'Toners', labelZh: '爽肤水' },
    { id: 'serum', labelEn: 'Serums', labelZh: '精华' },
    { id: 'cream', labelEn: 'Creams', labelZh: '乳霜' },
    { id: 'sunscreen', labelEn: 'Sunscreens', labelZh: '防晒' },
    { id: 'mask', labelEn: 'Masks', labelZh: '面膜' }
  ];

  const filteredProducts = useMemo(() => {
    return fullCatalogue.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.name_zh.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.brand_zh.toLowerCase().includes(query) ||
        item.ingredients.some((ing) => ing.toLowerCase().includes(query)) ||
        item.supported_benefits.some((b) => b.toLowerCase().includes(query)) ||
        item.supported_benefits_zh.some((b) => b.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [fullCatalogue, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col w-full px-4 sm:px-5 py-4 space-y-4 pb-12">
      {/* Header and Search */}
      <div className="flex flex-col gap-2.5">
        <div>
          <h2 className="font-headline text-xl font-bold text-[#1f2937]">
            {isZh ? '屈臣氏美肤商城' : 'Watsons Skincare Shop'}
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            {isZh ? '官方正品保障 • 专柜同价 • AI 配方推荐' : 'Official Authenticity Guaranteed • In-Store Match'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isZh ? '搜索产品、品牌或成分（如：神经酰胺、防晒）...' : 'Search product, brand, or ingredient (e.g. Ceramide)...'}
            className="w-full pl-10 pr-9 py-2.5 bg-[#f0f9fa] border border-[#d0eff3] rounded-2xl text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#0099A7] text-white shadow-xs'
                  : 'bg-[#f0f9fa] text-[#4b5563] border border-[#e5f1f3] hover:text-[#0099A7]'
              }`}
              type="button"
            >
              {isZh ? cat.labelZh : cat.labelEn}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#cbd5e1]">search_off</span>
          <p className="text-sm font-semibold text-[#1f2937]">
            {isZh ? '未找到符合条件的护肤产品' : 'No matching skincare products found'}
          </p>
          <p className="text-xs text-[#6b7280] max-w-xs">
            {isZh ? '尝试更改关键词，或在上方切换至“全部”分类查看全部在架商品。' : 'Try searching another ingredient or clear category filters.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-2 px-4 py-1.5 rounded-full bg-[#0099A7] text-white text-xs font-semibold"
            type="button"
          >
            {isZh ? '重置筛选条件' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredProducts.map((record) => {
            const product = toProductItem(record, language);
            return (
              <div
                key={record.product_id}
                className="bg-white rounded-2xl p-3 border border-[#e5f1f3] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Product Image Area */}
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden bg-white cursor-pointer relative p-1 mb-2"
                  onClick={() => onSelectProduct(product)}
                >
                  <SafeProductImage
                    src={record.image_url}
                    alt={isZh ? record.name_zh : record.name}
                  />

                  {record.bundle_offer && (
                    <span className="absolute bottom-1 left-1 max-w-[90%] truncate text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#fff5f5] text-[#d22630] border border-[#fecaca]">
                      {isZh ? '特惠' : 'Offer'}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-[#0099A7] block truncate">
                      {isZh ? record.brand_zh : record.brand}
                    </span>
                    <h3
                      className="font-headline font-bold text-xs text-[#1f2937] line-clamp-2 cursor-pointer hover:text-[#0099A7] transition-colors leading-snug"
                      onClick={() => onSelectProduct(product)}
                    >
                      {isZh ? record.name_zh : record.name}
                    </h3>
                    <p className="text-[10px] text-[#6b7280] mt-0.5">
                      {record.size}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-3 pt-2 border-t border-[#f0f9fa] flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-[#1f2937]">¥</span>
                        <span className="text-base font-extrabold text-[#1f2937] leading-none">
                          {record.price}
                        </span>
                      </div>
                      {record.original_price && (
                        <span className="text-[10px] text-[#9ca3af] line-through block">
                          ¥{record.original_price}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(product, 1);
                        onShowToast(isZh ? `已将【${product.nameZh}】加入购物车` : `Added ${product.name} to Cart`);
                      }}
                      className="w-8 h-8 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white flex items-center justify-center shadow-2xs active:scale-95 transition-all"
                      type="button"
                      aria-label="Add to cart"
                      title={isZh ? '加入购物车' : 'Add to cart'}
                    >
                      <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
