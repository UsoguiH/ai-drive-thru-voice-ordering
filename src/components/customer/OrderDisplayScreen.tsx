"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Edit, X, ShoppingBag } from "lucide-react";
import type { OrderState } from "@/app/customer/page";

type OrderDisplayScreenProps = {
  order: OrderState;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

// Saudi Riyal Symbol Component
const SARSymbol = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1124.14 1256.39"
    width="14"
    height="14"
    style={{ verticalAlign: "middle" }}
    className="inline-block"
  >
    <path
      d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"
      fill="currentColor"
    />
    <path
      d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"
      fill="currentColor"
    />
  </svg>
);

export default function OrderDisplayScreen({
  order,
  onConfirm,
  onEdit,
  onCancel,
}: OrderDisplayScreenProps) {
  const [countdown, setCountdown] = useState(13);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCancel(); // Return to welcome screen
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCancel]);

  const text = {
    en: {
      title: "Your Order",
      subtitle: "Please review your order",
      item: "Item",
      quantity: "Qty",
      price: "Price",
      subtotal: "Subtotal",
      tax: "Tax",
      total: "Total",
      confirm: "Confirm Order",
      edit: "Edit Order",
      cancel: "Cancel",
      autoReturn: "Returning to start",
    },
    ar: {
      title: "طلبك",
      subtitle: "يرجى مراجعة طلبك",
      item: "الصنف",
      quantity: "الكمية",
      price: "السعر",
      subtotal: "المجموع الفرعي",
      tax: "الضريبة (10%)",
      total: "الإجمالي",
      confirm: "تأكيد الطلب",
      edit: "تعديل الطلب",
      cancel: "إلغاء",
      autoReturn: "العودة للبداية",
    },
  };

  const t = text[order.language];
  const isRTL = order.language === "ar";
  const tax = order.total * 0.1;
  const finalTotal = order.total + tax;
  const progress = (countdown / 13) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header - WITHOUT Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-green-500 to-blue-600 p-6 rounded-3xl shadow-lg">
              <ShoppingBag className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">{t.title}</h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-light">{t.subtitle}</p>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
        >
          <div className="space-y-6">
            {order.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between py-4 border-b border-white/10 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-2xl font-semibold text-white mb-1">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
                  </div>
                  <div className="text-lg text-gray-400">
                    {t.quantity}: {item.quantity}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white price">
                  {(item.price * item.quantity).toFixed(2)}
                  <SARSymbol />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Totals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-8 border-t border-white/20 space-y-4"
          >
            <div className="flex justify-between text-2xl text-gray-300">
              <span>{t.subtotal}</span>
              <span className="price">
                {order.total.toFixed(2)}
                <SARSymbol />
              </span>
            </div>
            <div className="flex justify-between text-2xl text-gray-300">
              <span>{t.tax}</span>
              <span className="price">
                {tax.toFixed(2)}
                <SARSymbol />
              </span>
            </div>
            <div className="flex justify-between text-4xl font-bold text-white pt-4">
              <span>{t.total}</span>
              <span className="price">
                {finalTotal.toFixed(2)}
                <SARSymbol />
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Timer - MOVED HERE under order summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex flex-col items-center">
            {/* Circular Progress */}
            <div className="relative">
              {/* Background circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={339.292}
                  strokeDashoffset={339.292 * (1 - progress / 100)}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 339.292 * (1 - progress / 100) }}
                  transition={{ duration: 1, ease: "linear" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Timer number in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="text-6xl font-bold bg-gradient-to-br from-green-400 to-blue-400 bg-clip-text text-transparent"
                >
                  {countdown}
                </motion.div>
              </div>
            </div>
            
            {/* Timer label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-lg text-gray-400 mt-4 font-medium"
            >
              {t.autoReturn}
            </motion.p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <button
            onClick={onConfirm}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl font-semibold px-12 py-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            <Check className="w-8 h-8" />
            {t.confirm}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white text-2xl font-semibold px-12 py-6 rounded-2xl transition-all transform hover:scale-105"
          >
            <Edit className="w-8 h-8" />
            {t.edit}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl border border-red-500/50 text-red-400 text-2xl font-semibold px-12 py-6 rounded-2xl transition-all transform hover:scale-105"
          >
            <X className="w-8 h-8" />
            {t.cancel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}