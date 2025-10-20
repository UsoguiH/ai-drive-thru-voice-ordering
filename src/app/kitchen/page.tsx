'use client';

import { KitchenDisplaySystem } from '@/components/kitchen/KitchenDisplaySystem';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LogOut, ChefHat, User, Languages } from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function KitchenContent() {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState<'ar' | 'en'>('en');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Apple-style Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left side - Kitchen Dashboard with language and theme toggles */}
            <div className="flex items-center gap-6">
              <div className="text-left">
                <h1 className="text-3xl font-semibold text-gray-900 mb-1 tracking-tight dark:text-white">
                  Kitchen Dashboard
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 text-sm dark:text-gray-300">Welcome back, </span>
                  <span className="text-gray-900 text-sm font-medium dark:text-white">{user}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Language Toggle */}
                <Button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  <Languages className="w-4 h-4" />
                  <span>{language === 'ar' ? 'EN' : 'AR'}</span>
                </Button>

                {/* Theme Toggle */}
                <AnimatedThemeToggler className="border border-gray-200 dark:border-gray-600" />
              </div>
            </div>

            {/* Right side - Elegant logout button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="group relative px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 ease-out hover:scale-105 active:scale-95">
                  <span className="relative z-10 flex items-center gap-2">
                    <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="font-medium">Sign Out</span>
                  </span>
                  <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></div>
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-2xl p-6 max-w-md mx-auto">
                <AlertDialogHeader className="space-y-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <AlertDialogTitle className="text-gray-900 dark:text-white text-xl font-semibold text-center">
                    Sign Out
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    <div className="space-y-3">
                      <p className="text-base">Are you sure you want to sign out?</p>
                      <p className="text-base text-gray-500 dark:text-gray-400">هل أنت متأكد من تسجيل الخروج؟</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-3 mt-6">
                  <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/25"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <KitchenDisplaySystem language={language} />
    </div>
  );
}

export default function KitchenPage() {
  return (
    <ProtectedRoute>
      <KitchenContent />
    </ProtectedRoute>
  );
}