import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, saveUserProfileToFirestore } from '../firebase';
import { Language, UserProfile } from '../types';
import { USER_AVATAR } from '../data/mockData';

interface AuthScreenProps {
  language: Language;
  onAuthSuccess: (userProfile: UserProfile) => void;
  onShowToast: (msg: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onAuthSuccess,
  onShowToast
}) => {
  const isZh = language === 'zh';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form fields
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nickname?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Validate fields
  const validateForm = () => {
    const newErrors: { nickname?: string; email?: string; password?: string } = {};

    if (mode === 'register') {
      if (!nickname.trim()) {
        newErrors.nickname = isZh ? '请输入您的昵称' : 'Nickname is required';
      } else if (nickname.trim().length > 20) {
        newErrors.nickname = isZh ? '昵称不能超过20个字符' : 'Max 20 characters';
      }
    }

    if (!email.trim()) {
      newErrors.email = isZh ? '请输入电子邮箱' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = isZh ? '邮箱格式不正确' : 'Invalid email format';
    }

    if (!password) {
      newErrors.password = isZh ? '请输入密码' : 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = isZh ? '密码长度至少需6位字符' : 'Minimum 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return isZh ? '该邮箱已被注册，请直接登录' : 'Email is already registered. Please log in.';
      case 'auth/invalid-email':
        return isZh ? '无效的邮箱地址' : 'Invalid email address.';
      case 'auth/weak-password':
        return isZh ? '密码强度不足，请至少输入6位字符' : 'Password is too weak. Minimum 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return isZh ? '邮箱或密码不正确，请重新输入' : 'Incorrect email or password.';
      case 'auth/network-request-failed':
        return isZh ? '网络连接超时，请检查网络设置' : 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return isZh ? '尝试次数过多，请稍后再试' : 'Too many attempts. Please try again later.';
      default:
        return isZh ? '认证服务异常，请重试' : 'Authentication failed. Please try again.';
    }
  };

  // 1. First-Time Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Update Firebase display name
      const cleanNickname = nickname.trim();
      await updateProfile(user, { displayName: cleanNickname });

      // Create new clean profile in Firestore (separated by userId, starting empty)
      const newProfile: UserProfile = {
        nickname: cleanNickname,
        avatar: USER_AVATAR,
        skinType: 'not_sure',
        concerns: [],
        budget: '150_300',
        preferences: '',
        ingredientsToAvoid: ''
      };

      await saveUserProfileToFirestore(user.uid, newProfile);

      onShowToast(isZh ? `注册成功！欢迎加入屈臣氏，${cleanNickname}` : `Welcome to Watsons, ${cleanNickname}!`);
      onAuthSuccess(newProfile);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || '');
      setErrors({ general: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Returning-User Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const profile: UserProfile = {
        nickname: user.displayName || email.split('@')[0],
        avatar: USER_AVATAR,
        skinType: 'not_sure',
        concerns: [],
        budget: '150_300',
        preferences: '',
        ingredientsToAvoid: ''
      };

      onShowToast(isZh ? `登录成功，欢迎回来 ${profile.nickname}` : `Welcome back, ${profile.nickname}!`);
      onAuthSuccess(profile);
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || '');
      setErrors({ general: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetMessage(isZh ? '请输入有效的邮箱地址' : 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setResetMessage(null);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetMessage(
        isZh 
          ? '密码重置邮件已发送！请查看您的收件箱并按说明重设密码。' 
          : 'Password reset link sent! Please check your inbox.'
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetMessage(getFirebaseErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fafb] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-[#e5f1f3] p-6 sm:p-8 space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img 
              src="/assets/aistudio/222_00d72993.png" 
              alt="Watsons" 
              className="h-10 sm:h-12 w-auto object-contain" 
            />
          </div>
          <h2 className="font-headline text-lg sm:text-xl font-bold text-[#1f2937]">
            {mode === 'register' 
              ? (isZh ? '新用户注册 · 开启健康护肤' : 'Create an Account')
              : (isZh ? '用户登录 · 个性化护肤管理' : 'Welcome Back')}
          </h2>
          <p className="text-xs text-[#6b7280]">
            {isZh ? '屈臣氏美肤会员与个性化档案' : 'Watsons Member Skincare Profile'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f0f9fa] rounded-full border border-[#d0eff3]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'login'
                ? 'bg-white text-[#0099A7] shadow-xs'
                : 'text-[#6b7280] hover:text-[#1f2937]'
            }`}
          >
            {isZh ? '账号登录' : 'Log In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrors({});
            }}
            className={`py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'register'
                ? 'bg-white text-[#0099A7] shadow-xs'
                : 'text-[#6b7280] hover:text-[#1f2937]'
            }`}
          >
            {isZh ? '创建账号' : 'Register'}
          </button>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
          {/* Field 1: Nickname (Only in Registration - strictly THREE fields in register) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1f2937] block">
                {isZh ? '昵称' : 'Nickname'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-base">
                  badge
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={isZh ? '请输入您的昵称（如：小林）' : 'Enter your nickname'}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border rounded-2xl text-xs text-[#1f2937] placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-1 transition-all ${
                    errors.nickname ? 'border-red-400 focus:ring-red-500' : 'border-[#e5f1f3] focus:ring-[#0099A7]'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.nickname && (
                <p className="text-[11px] text-red-600 font-medium pl-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  {errors.nickname}
                </p>
              )}
            </div>
          )}

          {/* Field 2: Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1f2937] block">
              {isZh ? '电子邮箱' : 'Email'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-base">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isZh ? 'name@example.com' : 'name@example.com'}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border rounded-2xl text-xs text-[#1f2937] placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-1 transition-all ${
                  errors.email ? 'border-red-400 focus:ring-red-500' : 'border-[#e5f1f3] focus:ring-[#0099A7]'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-600 font-medium pl-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Field 3: Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1f2937] block">
                {isZh ? '登录密码' : 'Password'} <span className="text-red-500">*</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetMessage(null);
                    setIsResetModalOpen(true);
                  }}
                  className="text-[11px] text-[#0099A7] font-semibold hover:underline"
                >
                  {isZh ? '忘记密码？' : 'Forgot Password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-base">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? (isZh ? '至少6位字符' : 'At least 6 characters') : (isZh ? '请输入密码' : 'Enter password')}
                className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-2xl text-xs text-[#1f2937] placeholder-gray-400 focus:outline-hidden focus:bg-white focus:ring-1 transition-all ${
                  errors.password ? 'border-red-400 focus:ring-red-500' : 'border-[#e5f1f3] focus:ring-[#0099A7]'
                }`}
                disabled={isLoading}
              />
              {/* Show/Hide password control */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-600 font-medium pl-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-full bg-[#0099A7] text-white font-bold text-sm shadow-md hover:bg-[#007d89] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span>{isZh ? '正在处理中...' : 'Processing...'}</span>
              </>
            ) : mode === 'register' ? (
              <span>{isZh ? '创建账号' : 'Create Account'}</span>
            ) : (
              <span>{isZh ? '登录' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="pt-2 text-center text-xs text-[#6b7280]">
          {mode === 'register' ? (
            <p>
              {isZh ? '已有账号？' : 'Already have an account? '}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrors({});
                }}
                className="text-[#0099A7] font-bold hover:underline"
              >
                {isZh ? '立即登录' : 'Log in'}
              </button>
            </p>
          ) : (
            <p>
              {isZh ? '还没有账号？' : 'Don\'t have an account? '}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrors({});
                }}
                className="text-[#0099A7] font-bold hover:underline"
              >
                {isZh ? '创建账号' : 'Create Account'}
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#e5f1f3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f9fa]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0099A7] text-xl">lock_reset</span>
                <h3 className="font-headline font-bold text-sm text-[#1f2937]">
                  {isZh ? '重置密码' : 'Reset Password'}
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-xs text-[#6b7280]">
              {isZh
                ? '请输入注册时使用的电子邮箱，我们将向您发送重置密码的邮件链接。'
                : 'Enter your registered email address and we will send you a password reset link.'}
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={isZh ? 'name@example.com' : 'name@example.com'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e5f1f3] rounded-2xl text-xs text-[#1f2937] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0099A7]"
                  disabled={isLoading}
                />
              </div>

              {resetMessage && (
                <div className={`p-2.5 rounded-xl text-xs ${
                  resetMessage.includes('已发送') || resetMessage.includes('sent')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {resetMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="py-2.5 rounded-full border border-gray-200 text-[#4b5563] text-xs font-semibold hover:bg-gray-50"
                >
                  {isZh ? '关闭' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 rounded-full bg-[#0099A7] text-white text-xs font-bold hover:bg-[#007d89] disabled:opacity-50"
                >
                  {isLoading ? (isZh ? '发送中...' : 'Sending...') : (isZh ? '发送重置邮件' : 'Send Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
