"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WelcomeScreen from "@/components/customer/WelcomeScreen";
import VoiceChatInterface from "@/components/customer/VoiceChatInterface";
import OrderDisplayScreen from "@/components/customer/OrderDisplayScreen";
import ConfirmationScreen from "@/components/customer/ConfirmationScreen";
import { submitOrderToKitchen, orderToJSON, createOrderSummary } from "@/utils/orderProcessor";

export type OrderItem = {
  name: string;
  nameAr?: string;
  quantity: number;
  price: number;
  customizations?: string[]; // e.g., ["no cheese", "add tomato"]
};

export type OrderState = {
  items: OrderItem[];
  total: number;
  language: "en" | "ar";
};

type Screen = "welcome" | "listening" | "display" | "confirmation";

export default function CustomerPage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [order, setOrder] = useState<OrderState>({
    items: [],
    total: 0,
    language: "ar",
  });

  const handleStartOrder = (language: "en" | "ar") => {
    setOrder({ ...order, language });
    setCurrentScreen("listening");
  };

  const handleOrderComplete = (newOrder: OrderState) => {
    setOrder(newOrder);
    setCurrentScreen("display");
  };

  const handleConfirmOrder = async () => {
    console.log('🚀 Starting order submission process...');
    console.log('📋 Order summary:', createOrderSummary(order));
    console.log('📄 Order JSON:\n', orderToJSON(order));

    // Use the new utility that ensures orders reach the kitchen
    const result = await submitOrderToKitchen({
      items: order.items,
      total: order.total,
      language: order.language,
      customerNote: 'Voice order from AI assistant',
    });

    if (result.success) {
      console.log('✅ Order submitted successfully! Order ID:', result.orderId);
      setCurrentScreen("confirmation");

      // Complete reset after showing confirmation - refresh for next customer
      setTimeout(() => {
        console.log('🔄 Starting complete reset for next customer...');
        setCurrentScreen("welcome");
        setOrder({ items: [], total: 0, language: "ar" });

        // Trigger complete page refresh to clear all global state and microphone
        window.location.reload();
      }, 13000);
    } else {
      console.error('❌ Order submission failed:', result.error);
      // Still show confirmation to customer, but order will be retried
      setCurrentScreen("confirmation");
      setTimeout(() => {
        console.log('🔄 Starting complete reset for next customer...');
        setCurrentScreen("welcome");
        setOrder({ items: [], total: 0, language: "ar" });

        // Trigger complete page refresh to clear all global state and microphone
        window.location.reload();
      }, 13000);
    }
  };

  const handleEditOrder = () => {
    setCurrentScreen("listening");
  };

  const handleCancelOrder = () => {
    console.log('🔄 Canceling order and resetting for next customer...');
    setCurrentScreen("welcome");
    setOrder({ items: [], total: 0, language: "ar" });

    // Trigger complete page refresh to clear all global state and microphone
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WelcomeScreen onStart={handleStartOrder} />
          </motion.div>
        )}

        {currentScreen === "listening" && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <VoiceChatInterface
              language={order.language}
              onOrderComplete={handleOrderComplete}
              onCancel={handleCancelOrder}
            />
          </motion.div>
        )}

        {currentScreen === "display" && (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <OrderDisplayScreen
              order={order}
              onConfirm={handleConfirmOrder}
              onEdit={handleEditOrder}
              onCancel={handleCancelOrder}
            />
          </motion.div>
        )}

        {currentScreen === "confirmation" && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            <ConfirmationScreen language={order.language} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}