import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import "@/components/ui/return-button.css";
import PasswordConfirmInput from "./assisted-password-confirmation";

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onQuickFill?: () => void;
  isSignUpMode?: boolean;
  setIsSignUpMode?: (mode: boolean) => void;
  isLoading?: boolean;
  error?: string;
  email?: string;
  password?: string;
  setEmail?: (email: string) => void;
  setPassword?: (password: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (confirmPassword: string) => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  onQuickFill,
  isSignUpMode = false,
  setIsSignUpMode = () => {},
  isLoading = false,
  error = "",
  email = "",
  password = "",
  setEmail = () => {},
  setPassword = () => {},
  confirmPassword = "",
  setConfirmPassword = () => {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]" dir="rtl">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Header with Return Button */}
            <div className="flex items-center justify-between mb-10 animate-element animate-delay-100">
              {/* Return to Home Button */}
              <button
                className="Btn"
                onClick={() => router.push('/')}
                title="الصفحة الرئيسية"
              >
                <div className="sign">
                  <svg viewBox="0 0 512 512">
                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                  </svg>
                </div>
                <div className="text">الصفحة الرئيسيه</div>
              </button>

              <div className="text-center flex-1">
                <h1 className="text-4xl font-black tracking-tight mb-3">
                  {isSignUpMode ? "إنشاء حساب جديد!" : "مرحباً بعودتك!"}
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                  {isSignUpMode ? "يرجى إدخال بياناتك لإنشاء حساب" : "يرجى إدخال بياناتك"}
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-lg font-bold text-right text-muted-foreground">البريد الإلكتروني</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-lg p-4 rounded-2xl focus:outline-none h-14 font-medium"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-lg font-bold text-right text-muted-foreground">كلمة المرور</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-lg p-4 pr-12 rounded-2xl focus:outline-none h-14 font-medium"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 left-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {/* Password Confirmation - Show only in sign up mode */}
              {isSignUpMode && (
                <div className="animate-element animate-delay-400">
                  <label className="text-lg font-bold text-right text-muted-foreground">تأكيد كلمة المرور</label>
                  <PasswordConfirmInput
                    passwordToMatch={password}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    inputPlaceholder="تأكيد كلمة المرور"
                    className="w-full"
                  />
                </div>
              )}

              {error && (
                <div className="p-4 text-base text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors h-14 text-lg font-black"
                disabled={isLoading}
              >
                {isLoading
                  ? (isSignUpMode ? "جاري إنشاء الحساب..." : "جاري تسجيل الدخول...")
                  : (isSignUpMode ? "إنشاء حساب" : "تسجيل الدخول")
                }
              </button>
            </form>

            {/* Social Login - Mode Toggle */}
            <div className="animate-element animate-delay-700">
              <button
                onClick={() => setIsSignUpMode(!isSignUpMode)}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors h-14 text-lg font-bold"
                type="button"
              >
                <Mail className="w-5 h-5" />
                {isSignUpMode ? "تسجيل الدخول" : "إنشاء الحساب"}
              </button>
            </div>

            {/* Quick Fill Button - Show only in login mode */}
            {!isSignUpMode && onQuickFill && (
              <div className="animate-element animate-delay-800" dir="rtl">
                <button
                  onClick={onQuickFill}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold text-base py-4 px-4 rounded-2xl transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  استخدام بيانات التجريب
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image only */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
        </section>
      )}
    </div>
  );
};