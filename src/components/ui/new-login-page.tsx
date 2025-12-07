"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignInPage } from "./sign-in";
import { useAuth } from "@/contexts/AuthContext";
import PasswordConfirmInput from "./assisted-password-confirmation";

interface NewLoginPageProps {
  onLoginSuccess?: () => void;
}

export default function NewLoginPage({ onLoginSuccess }: NewLoginPageProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('kitchen_auth');
    if (isAuthenticated === 'true') {
      router.push('/kitchen');
    }
  }, [router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simulate API delay (quick)
      await new Promise(resolve => setTimeout(resolve, 300));

      if (isSignUpMode) {
        // Sign up logic
        if (password !== confirmPassword) {
          setError("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
          setIsLoading(false);
          return;
        }

        // Simulate successful sign up
        console.log("✅ Sign up successful!");
        alert("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
        setIsSignUpMode(false);
        setConfirmPassword("");
      } else {
        // Login logic
        const success = await login(email, password);

        if (success) {
          console.log("✅ Login successful!");
          alert("Login successful! Welcome to Kitchen Dashboard!");
          // Call the success callback
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            // Fallback: redirect to kitchen
            window.location.href = '/kitchen';
          }
        } else {
          setError("Invalid email or password. Please try again.");
          console.log("❌ Login failed");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login/Sign up error:", err);
    }

    setIsLoading(false);
  };

  const handleQuickFill = async () => {
    const demoEmail = "admin@restaurant.com";
    const demoPassword = "admin123";

    // Create typing animation effect
    setEmail("");
    setPassword("");

    // Animate email typing
    for (let i = 0; i <= demoEmail.length; i++) {
      setEmail(demoEmail.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Small pause before password
    await new Promise(resolve => setTimeout(resolve, 200));

    // Animate password typing
    for (let i = 0; i <= demoPassword.length; i++) {
      setPassword(demoPassword.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Continue with Google clicked");
  };

  const handleResetPassword = () => {
    alert("Reset Password clicked");
  }

  const handleCreateAccount = () => {
    setIsSignUpMode(!isSignUpMode);
  }

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        onQuickFill={handleQuickFill}
        isSignUpMode={isSignUpMode}
        setIsSignUpMode={setIsSignUpMode}
        isLoading={isLoading}
        error={error}
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
      />
    </div>
  );
}