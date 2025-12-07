"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NewLoginPage from "@/components/ui/new-login-page";

export default function Login() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/kitchen');
  };

  return <NewLoginPage onLoginSuccess={handleLoginSuccess} />;
}