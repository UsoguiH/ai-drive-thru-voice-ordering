"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Monitor } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-8" dir="rtl">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            الذكاء الاصطناعي للطلبات
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light">
            نظام الطلبات الصوتية
          </p>
        </motion.div>

        {/* Customer Interface Card - Centered */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -8 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/customer")}
          className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-16 text-center transition-all duration-300 hover:bg-white/10 hover:border-white/20 w-full max-w-2xl mx-auto"
        >
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all duration-300">
              <Monitor className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">شاشة العميل</h2>
            <p className="text-xl text-gray-400 mb-8">
              واجهة الطلبات الصوتية للعملاء
            </p>
            <div className="flex items-center justify-center text-blue-400 font-medium text-lg">
              <svg
                className="ml-2 w-6 h-6 transition-transform duration-300 group-hover:-translate-x-2 rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>ابدأ الطلب</span>
            </div>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all duration-300" />
        </motion.button>
      </div>
    </div>
  );
}