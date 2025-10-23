"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";

type WelcomeScreenProps = {
  onStart: (language: "en" | "ar") => void;
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative" dir="rtl">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-7xl md:text-8xl font-bold text-white mb-6 tracking-tight"
        >
          مرحباً بك
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-3xl md:text-4xl text-gray-300 mb-16 font-light"
        >
          اضغط لبدء طلبك الصوتي
        </motion.p>

        {/* Language Selection Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStart("ar")}
            className="group relative overflow-hidden w-full sm:w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transition-all duration-300 hover:bg-white/15 hover:border-white/30"
          >
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Globe className="w-8 h-8 text-purple-400" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">العربية</div>
                <div className="text-lg text-gray-400">ابدأ الطلب</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStart("en")}
            className="group relative overflow-hidden w-full sm:w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 transition-all duration-300 hover:bg-white/15 hover:border-white/30"
          >
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Globe className="w-8 h-8 text-blue-400" />
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">English</div>
                <div className="text-lg text-gray-400">Start ordering</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}