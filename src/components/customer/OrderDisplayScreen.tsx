"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Edit, X, ShoppingBag } from "lucide-react";
import type { OrderState } from "@/app/customer/page";
import { submitOrderToKitchen, orderToJSON, createOrderSummary } from "@/utils/orderProcessor";

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
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);

  // DEBUG: Log order items received with customizations
  useEffect(() => {
    console.log("🖼️ OrderDisplayScreen received order with", order.items.length, "items:");
    order.items.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name} x${item.quantity}`,
        item.customizations && item.customizations.length > 0
          ? `✨ customizations: [${item.customizations.join(', ')}]`
          : '(no customizations)');
    });
  }, [order]);

  // Countdown timer and auto-submission
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !orderSubmitted && order.items.length > 0) {
      // Auto-submit order when timer reaches zero
      handleAutoSubmitOrder();
    }
  }, [timeLeft, orderSubmitted, order.items.length]);

  // Auto-submit order when timer finishes
  const handleAutoSubmitOrder = async () => {
    console.log('⏰ Timer finished - Auto-submitting order to kitchen...');
    console.log('📋 Order summary:', createOrderSummary(order));
    console.log('📄 Order JSON:\n', orderToJSON(order));

    try {
      const result = await submitOrderToKitchen({
        items: order.items,
        total: order.total,
        language: order.language,
        customerNote: 'Voice order from AI assistant (Auto-submitted)',
      });

      if (result.success) {
        console.log('✅ Order auto-submitted successfully! Order ID:', result.orderId);
        setOrderSubmitted(true);
        setOrderId(result.orderId || null);

        // After successful submission, wait 2 seconds then return to welcome screen
        setTimeout(() => {
          console.log('🔄 Returning to welcome screen for next customer...');
          onCancel(); // This will reset and go back to welcome screen
        }, 2000);
      } else {
        console.error('❌ Order auto-submission failed:', result.error);
        // Still return to welcome screen even if submission failed
        setTimeout(() => {
          onCancel();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error auto-submitting order:', error);
      // Return to welcome screen even on error
      setTimeout(() => {
        onCancel();
      }, 2000);
    }
  };

  const handleConfirmOrder = async () => {
    if (order.items.length > 0 && !orderSubmitted) {
      console.log('🚀 User confirmed order - submitting to kitchen...');
      console.log('📋 Order summary:', createOrderSummary(order));
      console.log('📄 Order JSON:\n', orderToJSON(order));

      try {
        const result = await submitOrderToKitchen({
          items: order.items,
          total: order.total,
          language: order.language,
          customerNote: 'Voice order from AI assistant',
        });

        if (result.success) {
          console.log('✅ Order submitted successfully! Order ID:', result.orderId);
          setOrderSubmitted(true);
          setOrderId(result.orderId || null);
          // After successful submission, proceed to confirmation screen
          setTimeout(() => {
            onConfirm();
          }, 2000); // Brief pause to show success message
        } else {
          console.error('❌ Order submission failed:', result.error);
          setOrderSubmitted(false);
        }
      } catch (error) {
        console.error('❌ Error submitting order:', error);
      }
    }
  };

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
      autoSubmit: "Order will be submitted automatically",
      nextCustomer: "Next Customer",
      returningIn: "Returning in",
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
      autoSubmit: "سيتم إرسال الطلب تلقائياً",
      nextCustomer: "العميل التالي",
      returningIn: "العودة بعد",
    },
  };

  const t = text[order.language];
  const isRTL = order.language === "ar";
  const tax = order.total * 0.1;
  const finalTotal = order.total + tax;

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
                  {/* Show customizations if any */}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-sm text-blue-300 mt-1 italic">
                      {item.customizations.join(", ")}
                    </div>
                  )}
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

        {/* Order Submission Status */}
        {orderSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl px-6 py-3 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-400" />
              <div className="text-green-400 text-lg font-semibold">
                {order.language === "ar" ? `تم إرسال الطلب #${orderId}` : `Order #${orderId} Sent to Kitchen`}
              </div>
            </div>
          </motion.div>
        )}

        {/* Countdown Timer and Auto-Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          {!orderSubmitted ? (
            <div className="space-y-6">
              {/* Countdown Circle */}
              <div className="relative w-32 h-32 mx-auto">
                <motion.div
                  className="w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - timeLeft / 10)}`}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 10, ease: "linear" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {timeLeft}
                  </span>
                </div>
              </div>

              {/* Timer Text */}
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-white">
                  {t.autoSubmit}
                </h3>
                <p className="text-lg text-gray-300">
                  {t.returningIn} {timeLeft} {order.language === "ar" ? "ثواني" : "seconds"}
                </p>
              </div>

              {/* Auto-submit info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 max-w-md mx-auto">
                <p className="text-blue-300 text-sm">
                  {order.language === "ar"
                    ? "سيتم إرسال طلبك تلقائياً إلى المطبخ والعودة إلى شاشة البداية للعميل التالي"
                    : "Your order will be automatically sent to the kitchen and return to the start screen for the next customer"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 max-w-md mx-auto"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                  <div className="text-green-400 text-xl font-bold">
                    {order.language === "ar"
                      ? `تم إرسال الطلب #${orderId}`
                      : `Order #${orderId} Sent to Kitchen`
                    }
                  </div>
                </div>
                <p className="text-green-300 text-center">
                  {order.language === "ar"
                    ? "شكراً لك! جاري العودة إلى شاشة البداية..."
                    : "Thank you! Returning to start screen..."
                  }
                </p>
              </motion.div>

              {/* Next Customer Message */}
              <h2 className="text-3xl font-bold text-white">
                {t.nextCustomer}
              </h2>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}