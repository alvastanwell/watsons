import React, { useState } from 'react';
import { Language, ScreenId, CartItem, DeliveryAddress, OrderRecord } from '../types';
import { SafeProductImage } from './common/SafeProductImage';

interface CartScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearCart: () => void;
  onShowToast: (msg: string) => void;
  savedAddresses: DeliveryAddress[];
  onSaveAddress: (address: DeliveryAddress) => void;
  onCreateOrder: (order: OrderRecord) => void;
}

const AVAILABLE_STORES = [
  {
    id: 'store_sh_nanjing',
    name: '屈臣氏上海静安南京西路旗舰店',
    nameEn: "Watsons Shanghai Jing'an West Nanjing Rd Flagship",
    address: '上海市静安区南京西路1038号梅龙镇广场B1层',
    addressEn: 'B1, Westgate Mall, 1038 West Nanjing Rd, Jing\'an, Shanghai',
    hours: '10:00 - 22:00',
    distance: '0.8 km'
  },
  {
    id: 'store_sh_global',
    name: '屈臣氏上海普陀环球港店',
    nameEn: 'Watsons Shanghai Global Harbor Store',
    address: '上海市普陀区中山北路3300号环球港B2层',
    addressEn: 'B2, Global Harbor, 3300 North Zhongshan Rd, Putuo, Shanghai',
    hours: '10:00 - 22:00',
    distance: '3.2 km'
  },
  {
    id: 'store_sh_kerry',
    name: '屈臣氏上海浦东嘉里城店',
    nameEn: 'Watsons Shanghai Pudong Kerry Parkside Store',
    address: '上海市浦东新区花木路1378号浦东嘉里城B1层',
    addressEn: 'B1, Kerry Parkside, 1378 Huamu Rd, Pudong, Shanghai',
    hours: '10:00 - 22:00',
    distance: '7.5 km'
  },
  {
    id: 'store_bj_oriental',
    name: '屈臣氏北京王府井东方广场店',
    nameEn: 'Watsons Beijing Wangfujing Oriental Plaza Store',
    address: '北京市东城区东长安街1号东方新天地B1层',
    addressEn: 'B1, Oriental Plaza, 1 East Chang\'an Ave, Dongcheng, Beijing',
    hours: '10:00 - 22:00',
    distance: '跨城门店'
  }
];

export const CartScreen: React.FC<CartScreenProps> = ({
  language,
  onNavigate,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelect,
  onToggleSelectAll,
  onClearCart,
  onShowToast,
  savedAddresses,
  onSaveAddress,
  onCreateOrder
}) => {
  const isZh = language === 'zh';

  // Fulfillment method: 'online_delivery' | 'in_store_plan'
  const [purchaseMethod, setPurchaseMethod] = useState<'online_delivery' | 'in_store_plan'>('online_delivery');

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    return defaultAddr ? defaultAddr.id : '';
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<DeliveryAddress>({
    id: '',
    recipient: '',
    phone: '',
    region: '',
    detail: '',
    isDefault: false
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Store selection state for In-Store purchase plan
  const [selectedStoreId, setSelectedStoreId] = useState<string>(AVAILABLE_STORES[0].id);

  // Checkout confirmation modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [createdOrderSummary, setCreatedOrderSummary] = useState<OrderRecord | null>(null);

  // Selected items calculations
  const selectedItems = cartItems.filter((item) => item.selected);
  const isAllSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;

  const subtotal = selectedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Member discount
  const memberDiscount = subtotal >= 200 ? 20 : 0;

  // Active address
  const activeAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const hasValidAddress = Boolean(activeAddress && activeAddress.recipient && activeAddress.phone && activeAddress.detail);

  // Shipping calculation: Only calculate after an address is provided!
  let shippingFee = 0;
  let shippingStatusText = '';
  if (purchaseMethod === 'in_store_plan') {
    shippingFee = 0;
    shippingStatusText = isZh ? '到店自购免运费' : 'In-Store Self-Buy (Free)';
  } else if (!hasValidAddress) {
    shippingFee = 0;
    shippingStatusText = isZh ? '请先填写配送地址以计算运费' : 'Provide address to calculate shipping';
  } else if (subtotal >= 99 || subtotal === 0) {
    shippingFee = 0;
    shippingStatusText = isZh ? '包邮（满¥99免运费）' : 'Free Shipping (Over ¥99)';
  } else {
    shippingFee = 10;
    shippingStatusText = isZh ? '¥10.00（满¥99包邮）' : '¥10.00 Standard Courier';
  }

  const total = Math.max(0, subtotal - memberDiscount + shippingFee);

  // Address validation
  const validateAddressForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!addressForm.recipient.trim()) {
      errors.recipient = isZh ? '请填写收件人姓名' : 'Recipient name required';
    } else if (addressForm.recipient.trim().length < 2) {
      errors.recipient = isZh ? '姓名至少2个字符' : 'Name must be at least 2 characters';
    }

    if (!addressForm.phone.trim()) {
      errors.phone = isZh ? '请填写手机号码' : 'Phone number required';
    } else if (!/^1[3-9]\d{9}$/.test(addressForm.phone.trim()) && !/^\d{8,12}$/.test(addressForm.phone.trim())) {
      errors.phone = isZh ? '请输入正确的11位手机号码' : 'Invalid phone number format';
    }

    if (!addressForm.region.trim()) {
      errors.region = isZh ? '请填写所在地区（省/市/区）' : 'Region is required';
    }

    if (!addressForm.detail.trim()) {
      errors.detail = isZh ? '请填写详细街道门牌号' : 'Detailed address required';
    } else if (addressForm.detail.trim().length < 4) {
      errors.detail = isZh ? '详细地址过短，请补充完整门牌号' : 'Address too short';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddAddress = () => {
    setAddressForm({
      id: `addr_${Date.now()}`,
      recipient: '',
      phone: '',
      region: '上海市 静安区',
      detail: '',
      isDefault: savedAddresses.length === 0
    });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: DeliveryAddress) => {
    setAddressForm({ ...addr });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressForm = () => {
    if (!validateAddressForm()) {
      return;
    }
    onSaveAddress(addressForm);
    setSelectedAddressId(addressForm.id);
    setIsAddressModalOpen(false);
    onShowToast(isZh ? '收货地址已保存' : 'Address saved successfully');
  };

  const handleStartCheckout = () => {
    if (selectedItems.length === 0) {
      onShowToast(isZh ? '请先勾选需要结算的商品' : 'Please select at least one item');
      return;
    }

    if (purchaseMethod === 'online_delivery' && !hasValidAddress) {
      onShowToast(isZh ? '请先填写或选择收货地址' : 'Please provide a delivery address');
      handleOpenAddAddress();
      return;
    }

    setIsCheckoutModalOpen(true);
  };

  const handleConfirmOrder = () => {
    const orderNumber = `WAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedStore = AVAILABLE_STORES.find((s) => s.id === selectedStoreId) || AVAILABLE_STORES[0];

    const newOrder: OrderRecord = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      items: selectedItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        nameZh: item.product.nameZh,
        brand: item.product.brand,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        size: item.product.size
      })),
      subtotal,
      discount: memberDiscount,
      shippingFee,
      totalAmount: total,
      purchaseMethod,
      deliveryAddress: purchaseMethod === 'online_delivery' ? activeAddress : undefined,
      storeInfo: purchaseMethod === 'in_store_plan' ? {
        storeName: selectedStore.nameEn,
        storeNameZh: selectedStore.name,
        address: selectedStore.addressEn,
        addressZh: selectedStore.address
      } : undefined,
      status: purchaseMethod === 'online_delivery' ? 'pending_dispatch' : 'plan_saved',
      statusZh: purchaseMethod === 'online_delivery' ? '模拟备货配送中' : '自购清单已保存',
      isDemo: true
    };

    onCreateOrder(newOrder);
    setCreatedOrderSummary(newOrder);

    // Remove only checked out items from cart
    selectedItems.forEach((item) => onRemoveItem(item.id));
    setIsCheckoutModalOpen(false);

    onShowToast(
      isZh 
        ? (purchaseMethod === 'online_delivery' ? '模拟订单创建成功！可在“个人中心”查看' : '已保存到店自购清单！可在“个人中心”查看')
        : 'Order record created! View in Profile tab.'
    );
  };

  const currentSelectedStore = AVAILABLE_STORES.find((s) => s.id === selectedStoreId) || AVAILABLE_STORES[0];

  return (
    <div className="flex flex-col w-full px-4 sm:px-5 py-4 space-y-4 pb-28">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
        <div>
          <h2 className="font-headline text-xl font-bold text-[#1f2937]">
            {isZh ? '我的购物车' : 'Shopping Cart'}
          </h2>
          <p className="text-xs text-[#6b7280]">
            {isZh 
              ? `共 ${cartItems.length} 款商品 • 屈臣氏正品保障` 
              : `${cartItems.length} items • Official Watsons Assortment`}
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={onToggleSelectAll}
            className="text-xs font-semibold text-[#0099A7] hover:underline cursor-pointer"
            type="button"
          >
            {isAllSelected ? (isZh ? '取消全选' : 'Deselect All') : (isZh ? '全选' : 'Select All')}
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {cartItems.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#f0f9fa] border border-[#d0eff3] flex items-center justify-center text-[#0099A7]">
            <span className="material-symbols-outlined text-3xl">shopping_cart</span>
          </div>
          <h3 className="font-headline font-bold text-base text-[#1f2937]">
            {isZh ? '购物车还是空的' : 'Your cart is empty'}
          </h3>
          <p className="text-xs text-[#6b7280] max-w-xs leading-relaxed">
            {isZh 
              ? '前往商城探索精选护肤好物，或在首页完成 AI 测肤获取专属配方推荐。' 
              : 'Browse our skincare shop or start an AI assessment on the Home tab for recommendations.'}
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="mt-2 px-6 py-2.5 rounded-full bg-[#0099A7] hover:bg-[#007d89] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            {isZh ? '去商城逛逛' : 'Browse Shop'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cartItems.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl p-3.5 border border-[#e5f1f3] shadow-2xs flex items-center gap-3 transition-all"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => onToggleSelect(item.id)}
                className="w-4 h-4 rounded text-[#0099A7] accent-[#0099A7] cursor-pointer shrink-0"
              />

              {/* Product Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#e5f1f3] shrink-0 p-1 flex items-center justify-center">
                <SafeProductImage
                  src={item.product.image}
                  alt={isZh ? item.product.nameZh : item.product.name}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-[#0099A7] block truncate">
                      {item.product.brand}
                    </span>
                    <h4 className="font-headline font-bold text-xs text-[#1f2937] truncate">
                      {isZh ? item.product.nameZh : item.product.name}
                    </h4>
                    <p className="text-[10px] text-[#6b7280]">
                      {item.product.size}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-6 h-6 rounded-full hover:bg-[#f0f9fa] flex items-center justify-center text-gray-400 hover:text-[#d22630] transition-colors shrink-0 cursor-pointer"
                    type="button"
                    title={isZh ? '删除商品' : 'Remove item'}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#f0f9fa]">
                  <span className="text-xs font-extrabold text-[#1f2937]">
                    ¥{item.product.price}
                  </span>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-[#f0f9fa] rounded-full border border-[#d0eff3] px-2 py-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#4b5563] hover:text-[#0099A7] font-bold text-xs active:scale-90 cursor-pointer"
                      type="button"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#1f2937] min-w-[14px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[#4b5563] hover:text-[#0099A7] font-bold text-xs active:scale-90 cursor-pointer"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* =========================================================================
          PURCHASE METHOD SELECTION: ONLINE DELIVERY VS IN-STORE PURCHASE
         ========================================================================= */}
      {cartItems.length > 0 && (
        <section className="bg-white rounded-3xl p-4 border border-[#e5f1f3] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#e5f1f3]">
            <h4 className="font-headline font-bold text-xs text-[#1f2937]">
              {isZh ? '取货方式选择' : 'Fulfillment Method'}
            </h4>
            <span className="text-[10px] text-[#0099A7] font-semibold bg-[#f0f9fa] px-2 py-0.5 rounded-full border border-[#d0eff3]">
              {purchaseMethod === 'online_delivery' ? (isZh ? '快递到家' : 'Home Delivery') : (isZh ? '到店自购' : 'In-Store Plan')}
            </span>
          </div>

          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#f0f9fa] rounded-2xl border border-[#d0eff3] gap-1">
            <button
              onClick={() => setPurchaseMethod('online_delivery')}
              type="button"
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                purchaseMethod === 'online_delivery'
                  ? 'bg-white text-[#0099A7] shadow-xs'
                  : 'text-[#4b5563] hover:text-[#0099A7]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              <span>{isZh ? '在线快递配送' : 'Online Delivery'}</span>
            </button>

            <button
              onClick={() => setPurchaseMethod('in_store_plan')}
              type="button"
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                purchaseMethod === 'in_store_plan'
                  ? 'bg-white text-[#0099A7] shadow-xs'
                  : 'text-[#4b5563] hover:text-[#0099A7]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span>{isZh ? '线下门店自购' : 'Buy in Store'}</span>
            </button>
          </div>

          {/* OPTION A: ONLINE DELIVERY ADDRESS SECTION */}
          {purchaseMethod === 'online_delivery' && (
            <div className="p-3.5 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0099A7] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>{isZh ? '收货地址' : 'Delivery Address'}</span>
                </span>

                <button
                  onClick={handleOpenAddAddress}
                  className="text-[11px] font-bold text-[#0099A7] hover:underline flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">add_circle</span>
                  <span>{savedAddresses.length > 0 ? (isZh ? '新增/更换地址' : 'Change Address') : (isZh ? '添加地址' : 'Add Address')}</span>
                </button>
              </div>

              {activeAddress ? (
                <div className="bg-white rounded-xl p-3 border border-[#e5f1f3] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1f2937]">{activeAddress.recipient}</span>
                      <span className="text-xs font-mono text-[#6b7280]">{activeAddress.phone}</span>
                    </div>
                    <button
                      onClick={() => handleOpenEditAddress(activeAddress)}
                      className="text-[10px] text-[#0099A7] hover:underline font-semibold"
                      type="button"
                    >
                      {isZh ? '编辑' : 'Edit'}
                    </button>
                  </div>
                  <p className="text-xs text-[#4b5563] leading-relaxed">
                    {activeAddress.region} {activeAddress.detail}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#0099A7]">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>{isZh ? '预计明日 18:00 前送达（顺丰速运 • 原型模拟时效）' : 'Est. Delivery: Tomorrow by 18:00 (Demo Courier)'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-dashed border-[#d0eff3] text-center space-y-1.5">
                  <p className="text-xs text-[#6b7280]">
                    {isZh ? '暂未填写收货地址，无法计算运费与预计送达时间' : 'No address provided. Shipping fee cannot be calculated.'}
                  </p>
                  <button
                    onClick={handleOpenAddAddress}
                    className="px-4 py-1.5 rounded-full bg-[#0099A7] text-white text-xs font-bold shadow-xs hover:bg-[#007d89]"
                    type="button"
                  >
                    {isZh ? '立即添加配送地址' : 'Add Delivery Address'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OPTION B: BUY IN STORE PLAN SECTION */}
          {purchaseMethod === 'in_store_plan' && (
            <div className="p-3.5 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0099A7] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">store</span>
                  <span>{isZh ? '选择目标门店与营业时间' : 'Select Store & Plan'}</span>
                </span>
                <span className="text-[10px] text-[#6b7280]">
                  {currentSelectedStore.hours}
                </span>
              </div>

              {/* Store Dropdown */}
              <div className="relative">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-white border border-[#d0eff3] rounded-xl px-3 py-2 text-xs font-bold text-[#1f2937] focus:outline-hidden focus:ring-1 focus:ring-[#0099A7] cursor-pointer"
                >
                  {AVAILABLE_STORES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isZh ? s.name : s.nameEn} ({s.distance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Store details card */}
              <div className="bg-white rounded-xl p-3 border border-[#e5f1f3] space-y-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-[#1f2937]">
                    {isZh ? currentSelectedStore.name : currentSelectedStore.nameEn}
                  </h5>
                  <span className="text-[10px] text-[#0099A7] font-semibold">
                    {currentSelectedStore.distance}
                  </span>
                </div>
                <p className="text-[11px] text-[#4b5563]">
                  {isZh ? currentSelectedStore.address : currentSelectedStore.addressEn}
                </p>
                <div className="p-2 bg-[#f0f9fa] rounded-lg border border-[#e5f1f3] mt-1 text-[10px] text-[#4b5563] leading-relaxed">
                  <span className="font-bold text-[#0099A7]">
                    {isZh ? '【自购清单提示】' : '【Shopping Plan Notice】'}
                  </span>
                  <span>
                    {isZh
                      ? '本功能将商品保存为到店自购计划，方便专柜出示选品。此操作不锁定门店实物库存；如需专柜小样体验，请使用领样码。'
                      : 'This saves your shopping list for in-store purchase. Does not reserve stock.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Financial Breakdown */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex items-center justify-between text-[#4b5563]">
              <span>{isZh ? '已选商品小计' : 'Selected Subtotal'}</span>
              <span className="font-semibold text-[#1f2937]">¥{subtotal.toFixed(2)}</span>
            </div>

            {memberDiscount > 0 && (
              <div className="flex items-center justify-between text-[#d22630]">
                <span>{isZh ? '会员满减优惠（满¥200减¥20）' : 'Member Discount (¥20 off ¥200)'}</span>
                <span className="font-semibold">-¥{memberDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[#4b5563]">
              <div>
                <span>{isZh ? '配送运费' : 'Shipping Fee'}</span>
                <span className="text-[10px] text-[#9ca3af] block">
                  {shippingStatusText}
                </span>
              </div>
              <span className="font-semibold text-[#1f2937]">
                {shippingFee === 0 ? (isZh ? '免运费' : 'Free') : `¥${shippingFee.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-2 border-t border-[#e5f1f3] flex items-baseline justify-between">
              <span className="text-xs font-bold text-[#1f2937]">
                {isZh ? '应付总额' : 'Total Payable'}
              </span>
              <div className="text-right">
                <span className="text-xs font-extrabold text-[#0099A7]">¥</span>
                <span className="text-xl font-black text-[#0099A7] ml-0.5">
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={handleStartCheckout}
            disabled={selectedItems.length === 0}
            className={`w-full py-3.5 rounded-full text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedItems.length > 0
                ? 'bg-[#0099A7] hover:bg-[#007d89]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">
              {purchaseMethod === 'online_delivery' ? 'lock' : 'playlist_add_check'}
            </span>
            <span>
              {purchaseMethod === 'online_delivery'
                ? (isZh ? `模拟在线结算 (${selectedItems.length}件) • 原型演示` : `Simulated Checkout (${selectedItems.length} items) • Demo`)
                : (isZh ? `保存为门店自购清单 (${selectedItems.length}件) • 原型演示` : `Save In-Store Plan (${selectedItems.length} items) • Demo`)}
            </span>
          </button>

          <p className="text-[10px] text-center text-[#9ca3af]">
            {isZh 
              ? '【原型演示说明】订单将存入当前设备“个人中心-我的订单”，未产生真实支付或扣款。' 
              : '【Prototype Demo】Order is saved locally to Profile. No real financial charge occurs.'}
          </p>
        </section>
      )}

      {/* =========================================================================
          EDIT / ADD ADDRESS MODAL
         ========================================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#d0eff3] shadow-2xl flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1f2937]">
                <span className="material-symbols-outlined text-[#0099A7]">edit_location</span>
                <span>{isZh ? '编辑收货地址' : 'Edit Delivery Address'}</span>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="w-6 h-6 rounded-full bg-[#f0f9fa] flex items-center justify-center text-gray-500 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            {/* Address Selection List if saved addresses exist */}
            {savedAddresses.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">
                  {isZh ? '快速选择已有地址' : 'Saved Addresses'}
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1.5 border border-[#e5f1f3] rounded-xl p-2 bg-[#f0f9fa]">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setAddressForm({ ...addr });
                        setAddressErrors({});
                      }}
                      className={`p-2 rounded-lg cursor-pointer text-xs border transition-all ${
                        selectedAddressId === addr.id
                          ? 'bg-white border-[#0099A7] shadow-2xs font-bold text-[#0099A7]'
                          : 'bg-white/60 border-transparent text-[#4b5563] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{addr.recipient} ({addr.phone})</span>
                        {selectedAddressId === addr.id && (
                          <span className="material-symbols-outlined text-xs text-[#0099A7]">check_circle</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{addr.region} {addr.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form with Inline Validation */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-[#1f2937] block mb-1">
                  {isZh ? '收件人姓名 *' : 'Recipient Name *'}
                </label>
                <input
                  type="text"
                  value={addressForm.recipient}
                  onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                  placeholder={isZh ? '例如：Lin' : 'e.g. Lin'}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-xs ${
                    addressErrors.recipient ? 'border-red-500 bg-red-50/30' : 'border-[#d0eff3]'
                  }`}
                />
                {addressErrors.recipient && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.recipient}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#1f2937] block mb-1">
                  {isZh ? '手机号码 *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder={isZh ? '11位手机号码，例如：13812345678' : '11-digit phone number'}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-xs ${
                    addressErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-[#d0eff3]'
                  }`}
                />
                {addressErrors.phone && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#1f2937] block mb-1">
                  {isZh ? '所在地区（省/市/区）*' : 'Region *'}
                </label>
                <input
                  type="text"
                  value={addressForm.region}
                  onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                  placeholder={isZh ? '例如：上海市 静安区' : 'e.g. Shanghai, Jing\'an'}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-xs ${
                    addressErrors.region ? 'border-red-500 bg-red-50/30' : 'border-[#d0eff3]'
                  }`}
                />
                {addressErrors.region && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.region}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#1f2937] block mb-1">
                  {isZh ? '详细街道门牌号 *' : 'Detailed Address *'}
                </label>
                <textarea
                  rows={2}
                  value={addressForm.detail}
                  onChange={(e) => setAddressForm({ ...addressForm, detail: e.target.value })}
                  placeholder={isZh ? '例如：南京西路1601号 越洋广场 22层' : 'e.g. 1601 West Nanjing Rd, Floor 22'}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-xs ${
                    addressErrors.detail ? 'border-red-500 bg-red-50/30' : 'border-[#d0eff3]'
                  }`}
                />
                {addressErrors.detail && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.detail}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5f1f3]">
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#4b5563] bg-[#f0f9fa] border border-[#d0eff3]"
                type="button"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveAddressForm}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#0099A7] hover:bg-[#007d89]"
                type="button"
              >
                {isZh ? '保存并使用该地址' : 'Save & Select Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SIMULATED CHECKOUT CONFIRMATION MODAL
         ========================================================================= */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#d0eff3] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5f1f3]">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#1f2937]">
                <span className="material-symbols-outlined text-[#0099A7]">
                  {purchaseMethod === 'online_delivery' ? 'local_shipping' : 'storefront'}
                </span>
                <span>
                  {purchaseMethod === 'online_delivery' 
                    ? (isZh ? '确认模拟快递配送订单' : 'Confirm Delivery Order') 
                    : (isZh ? '确认保存到店自购计划' : 'Confirm In-Store Plan')}
                </span>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-6 h-6 rounded-full bg-[#f0f9fa] flex items-center justify-center text-gray-500 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#f0f9fa] border border-[#d0eff3] text-xs space-y-1.5 text-[#1f2937]">
              <p className="font-semibold text-[#0099A7]">
                {isZh ? '【原型演示重要说明】' : '【Prototype Demo Notice】'}
              </p>
              <p className="text-[#4b5563] leading-relaxed">
                {purchaseMethod === 'online_delivery'
                  ? (isZh
                      ? `此操作将在本地生成一条模拟订单记录（存入“个人中心-我的订单”），不扣除真实银行卡或微信资金，也不会发起真实物流。`
                      : 'This creates a demo order in Profile locally. No payment charged.')
                  : (isZh
                      ? `此操作将所选商品存入您的“到店自购清单”，不代表已在专柜扣减库存或完成真实扣款。到店可向屈臣氏顾问出示清单协助选品。`
                      : 'This saves items to your in-store shopping plan. No inventory is held.')}
              </p>
            </div>

            {/* Target info preview */}
            <div className="p-2.5 rounded-xl bg-white border border-[#e5f1f3] text-xs space-y-1">
              {purchaseMethod === 'online_delivery' && activeAddress ? (
                <div>
                  <span className="text-[10px] text-[#6b7280] block">{isZh ? '配送至：' : 'Deliver to:'}</span>
                  <p className="font-bold text-[#1f2937]">{activeAddress.recipient} ({activeAddress.phone})</p>
                  <p className="text-[11px] text-[#4b5563]">{activeAddress.region} {activeAddress.detail}</p>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] text-[#6b7280] block">{isZh ? '自购目标门店：' : 'Target Store:'}</span>
                  <p className="font-bold text-[#1f2937]">{isZh ? currentSelectedStore.name : currentSelectedStore.nameEn}</p>
                  <p className="text-[11px] text-[#4b5563]">{isZh ? currentSelectedStore.address : currentSelectedStore.addressEn}</p>
                </div>
              )}
            </div>

            {/* Items summary */}
            <div className="space-y-1 max-h-32 overflow-y-auto border border-[#e5f1f3] rounded-xl p-2 bg-white text-xs">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                  <span className="truncate pr-2 text-[#4b5563]">{isZh ? item.product.nameZh : item.product.name} x{item.quantity}</span>
                  <span className="font-bold text-[#1f2937] shrink-0">¥{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span>{isZh ? '订单金额总计：' : 'Total Amount:'}</span>
              <span className="text-base text-[#0099A7]">¥{total.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5f1f3]">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#4b5563] bg-[#f0f9fa] border border-[#d0eff3]"
                type="button"
              >
                {isZh ? '返回调整' : 'Back'}
              </button>
              <button
                onClick={handleConfirmOrder}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#0099A7] hover:bg-[#007d89]"
                type="button"
              >
                {purchaseMethod === 'online_delivery' 
                  ? (isZh ? '确认模拟下单' : 'Confirm Demo Order')
                  : (isZh ? '确认保存清单' : 'Save Plan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-order success guidance banner */}
      {createdOrderSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#d0eff3] shadow-2xl flex flex-col gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f0f9fa] border-2 border-[#0099A7] text-[#0099A7] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>

            <h3 className="font-headline font-bold text-base text-[#1f2937]">
              {createdOrderSummary.purchaseMethod === 'online_delivery'
                ? (isZh ? '模拟配送订单已生成' : 'Demo Delivery Order Created')
                : (isZh ? '门店自购清单已保存' : 'In-Store Plan Saved')}
            </h3>

            <p className="text-xs font-mono text-[#0099A7] bg-[#f0f9fa] py-1 px-3 rounded-full mx-auto font-semibold">
              {createdOrderSummary.orderNumber}
            </p>

            <p className="text-xs text-[#4b5563] leading-relaxed">
              {isZh 
                ? '已成功写入您的本地订单记录中。您可以前往“个人中心-我的订单”查看详细物流状态或门店自购指引。' 
                : 'Saved to your profile order history. View details anytime in Profile tab.'}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCreatedOrderSummary(null);
                  onNavigate('profile');
                }}
                className="flex-1 py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] shadow-xs cursor-pointer"
                type="button"
              >
                {isZh ? '前往个人中心查看' : 'View in Profile'}
              </button>
              <button
                onClick={() => setCreatedOrderSummary(null)}
                className="px-4 py-2.5 rounded-full bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] text-xs font-bold cursor-pointer"
                type="button"
              >
                {isZh ? '完成' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
