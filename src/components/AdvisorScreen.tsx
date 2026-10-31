import React, { useState, useRef, useEffect } from 'react';
import { Language, ScreenId, ProductItem, RoutineStep, CartItem, UserProfile, SkinAssessmentState } from '../types';
import { ADVISOR_PROFILE_PHOTO } from '../data/mockData';
import { getProductById, toProductItem } from '../data/productCatalogue';
import { SafeProductImage } from './common/SafeProductImage';

interface AdvisorScreenProps {
  language: Language;
  onNavigate: (screen: ScreenId) => void;
  userProfile: UserProfile;
  assessmentState: SkinAssessmentState;
  morningSteps: RoutineStep[];
  eveningSteps: RoutineStep[];
  cartItems: CartItem[];
  onOpenProductDetail: (product: ProductItem) => void;
  onAddToCart: (product: ProductItem) => void;
  onAddToRoutine: (product: ProductItem) => void;
  onShowToast: (msg: string) => void;
}

interface Message {
  id: string;
  sender: 'advisor' | 'user';
  text: string;
  time: string;
  suggestedActions?: Array<{
    type: 'view_product' | 'add_to_cart' | 'add_to_routine' | 'compare_products';
    productId: string;
    label: string;
  }>;
  suggestedFollowUps?: string[];
  isError?: boolean;
}

export const AdvisorScreen: React.FC<AdvisorScreenProps> = ({
  language,
  onNavigate,
  userProfile,
  assessmentState,
  morningSteps,
  eveningSteps,
  cartItems,
  onOpenProductDetail,
  onAddToCart,
  onAddToRoutine,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting = isZh
    ? `您好 ${userProfile.nickname || ''}！我是屈臣氏 AI 美肤顾问。今天想了解护肤搭配、产品成分对比还是精简日常护理？`
    : `Hello ${userProfile.nickname || ''}! I'm your Watsons AI Skincare Advisor. How can I assist with your routine, ingredient comparison, or product recommendations today?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      sender: 'advisor',
      text: initialGreeting,
      time: 'Just now',
      suggestedFollowUps: isZh
        ? [
            '推荐 ¥150 以内的精简护肤品',
            '对比舒缓修护乳霜（理肤泉 vs 珂润 vs 雅漾）',
            '帮我审查晨间护理是否有功效重叠',
            '防晒霜应该在面霜后多久涂抹？'
          ]
        : [
            'Recommend products within ¥150',
            'Compare barrier creams (LRP vs Curél vs Avène)',
            'Review my morning routine for overlaps',
            'How long after moisturizer should I apply sunscreen?'
          ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: 'Just now'
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
    setLastFailedText(null);

    try {
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
          userProfile,
          assessmentResult: assessmentState.resultsData,
          currentRoutine: { morningSteps, eveningSteps },
          cart: cartItems,
          language
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData?.error || 'Failed to get AI advisor response');
      }

      const advisorReply: Message = {
        id: String(Date.now() + 1),
        sender: 'advisor',
        text: resData.data.reply,
        time: 'Just now',
        suggestedActions: resData.data.suggestedActions || [],
        suggestedFollowUps: resData.data.suggestedFollowUps || []
      };

      setMessages((prev) => [...prev, advisorReply]);
    } catch (err: any) {
      console.error('Advisor chat error:', err);
      setLastFailedText(text);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'advisor',
          text: isZh 
            ? '连接 AI 顾问服务失败，请检查网络或点击下方重试。' 
            : 'Failed to connect to AI Advisor. Please check connection and retry.',
          time: 'Just now',
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { type: string; productId: string; label: string }) => {
    const record = getProductById(action.productId);
    if (!record) {
      onShowToast(isZh ? '产品已售罄或下架' : 'Product unavailable');
      return;
    }
    const item = toProductItem(record, language);

    if (action.type === 'view_product') {
      onOpenProductDetail(item);
    } else if (action.type === 'add_to_cart') {
      onAddToCart(item);
      onShowToast(isZh ? `已将【${item.nameZh}】加入购物车` : `Added ${item.name} to Cart`);
    } else if (action.type === 'add_to_routine') {
      onAddToRoutine(item);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-[#f4fafb] text-[#1f2937]">
      {/* Top Header Bar with Back Button to return Home */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#e5f1f3] flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs font-semibold text-[#0099A7] hover:underline"
          type="button"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>{isZh ? '返回首页' : 'Home'}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={ADVISOR_PROFILE_PHOTO}
              alt="Sherry Chen"
              className="w-8 h-8 rounded-full object-cover border border-[#d0eff3]"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1f2937] leading-none">
              {isZh ? '屈臣氏 AI 美肤顾问' : 'Watsons AI Advisor'}
            </h3>
            <span className="text-[10px] text-[#0099A7] font-semibold">
              {isZh ? '在线解答 • 真实目录支持' : 'Live Context • Grounded in Catalogue'}
            </span>
          </div>
        </div>

        <div className="w-12"></div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-32">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-[#0099A7] text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-[#fff5f5] text-[#d22630] border border-[#fecaca] rounded-bl-xs'
                    : 'bg-white text-[#1f2937] border border-[#e5f1f3] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {/* Action Buttons emitted by AI (Grounded in real catalogue) */}
              {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 max-w-[88%]">
                  {msg.suggestedActions.map((action, idx) => {
                    const record = getProductById(action.productId);
                    if (!record) return null;
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-2.5 border border-[#d0eff3] shadow-2xs flex items-center gap-2.5 w-full"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#e5f1f3] shrink-0 p-0.5">
                          <SafeProductImage
                            src={record.image_url}
                            alt={isZh ? record.name_zh : record.name}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-[11px] text-[#1f2937] truncate">
                            {isZh ? record.name_zh : record.name}
                          </h4>
                          <span className="text-[10px] text-[#0099A7] font-semibold">
                            ¥{record.price} • {record.size}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleActionClick({ ...action, type: 'view_product' })}
                            className="px-2 py-1 rounded-full text-[10px] font-semibold text-[#0099A7] bg-[#f0f9fa] border border-[#d0eff3]"
                            type="button"
                          >
                            {isZh ? '详情' : 'View'}
                          </button>
                          <button
                            onClick={() => handleActionClick({ ...action, type: 'add_to_cart' })}
                            className="px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-[#0099A7] hover:bg-[#007d89]"
                            type="button"
                          >
                            {isZh ? '加购' : 'Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Retry button if failed */}
              {msg.isError && lastFailedText && (
                <button
                  onClick={() => handleSendMessage(lastFailedText)}
                  className="px-3 py-1 rounded-full bg-[#f0f9fa] text-[#0099A7] border border-[#d0eff3] text-xs font-semibold flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  <span>{isZh ? '重新发送' : 'Retry'}</span>
                </button>
              )}

              {/* Follow-up question chips */}
              {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                  {msg.suggestedFollowUps.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-[#f0f9fa] border border-[#d0eff3] text-[#0099A7] font-medium hover:bg-[#e0f5f7] transition-all text-left"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#0099A7] bg-white p-3 rounded-2xl border border-[#e5f1f3] w-fit shadow-2xs">
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            <span>{isZh ? '顾问正在查阅配方并思考中...' : 'Advisor is reviewing formulation data...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Sticky Input Field */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto p-3 bg-white border-t border-[#e5f1f3] shadow-lg z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isZh
                ? '询问护肤搭配、预算选品或成分对比...'
                : 'Ask about routines, budget products, or ingredients...'
            }
            className="flex-1 px-4 py-2.5 bg-[#f0f9fa] border border-[#d0eff3] rounded-full text-xs text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0099A7]/40 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md shrink-0 ${
              inputText.trim() && !isLoading
                ? 'bg-[#0099A7] hover:bg-[#007d89] active:scale-95'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
