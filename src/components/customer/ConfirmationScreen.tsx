"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

type ConfirmationScreenProps = {
  language: "en" | "ar";
};

export default function ConfirmationScreen({ language }: ConfirmationScreenProps) {
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const text = {
    en: {
      title: "Order Confirmed!",
      subtitle: "Your order has been sent to the kitchen",
      message: "Please proceed to the pick-up window",
      thankyou: "Thank you for your order",
      returning: "Preparing for next customer in",
      seconds: "seconds",
    },
    ar: {
      title: "تم تأكيد الطلب!",
      subtitle: "تم إرسال طلبك إلى المطبخ",
      message: "يرجى التوجه إلى نافذة الاستلام",
      thankyou: "شكراً لطلبك",
      returning: "جاري التحضير للعميل التالي خلال",
      seconds: "ثواني",
    },
  };

  const t = text[language];
  const isRTL = language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 2, opacity: 0.3 }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/40 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
          className="flex justify-center mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl opacity-60" />
              <CheckCircle className="relative w-32 h-32 text-green-400" strokeWidth={1.5} />
            </div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-7xl font-bold text-white mb-4"
        >
          {t.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl text-gray-300 mb-6 font-light"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
        >
          <p className="text-xl md:text-2xl text-white font-medium">{t.message}</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-gray-400 mb-8"
        >
          {t.thankyou}
        </motion.p>

        {/* COUNTDOWN TIMER - HIGHLY VISIBLE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 mb-8"
        >
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl border-2 border-green-400/50 rounded-3xl p-8 shadow-2xl shadow-green-500/20">
            <p className="text-2xl text-green-300 mb-4 font-medium">{t.returning}</p>
            <motion.div
              key={countdown}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="flex items-center justify-center gap-4"
            >
              <span className="text-8xl md:text-9xl font-bold text-green-400 tabular-nums drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]">
                {countdown}
              </span>
              <span className="text-3xl text-gray-300 font-medium">{t.seconds}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-3 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-4 h-4 bg-green-400 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}