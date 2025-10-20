"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AnimatedLoginPage from "@/components/ui/animated-characters-login-page";

export default function Login() {
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('kitchen_auth');
    if (isAuthenticated === 'true') {
      router.push('/kitchen');
    }
  }, [router]);

  const handleLoginSuccess = () => {
    router.push('/kitchen');
  };

  return <AnimatedLoginPage onLoginSuccess={handleLoginSuccess} />;
}