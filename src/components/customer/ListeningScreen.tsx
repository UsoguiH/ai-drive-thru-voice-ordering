"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, AlertCircle, MessageSquare, ShoppingCart } from "lucide-react";
import LiveWaveform from "@/components/customer/LiveWaveform";
import { useRealtimeVoice, type ConversationMessage } from "@/hooks/useRealtimeVoice";
import type { OrderState, OrderItem } from "@/app/customer/page";

type ListeningScreenProps = {
  language: "en" | "ar";
  onOrderComplete: (order: OrderState) => void;
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

export default function ListeningScreen({
  language,
  onOrderComplete,
  onCancel,
}: ListeningScreenProps) {
  const [transcript, setTranscript] = useState("");
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  // Request microphone permission immediately on mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        // Check if permission is already granted
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'granted') {
          setMicPermissionGranted(true);
          return;
        }

        // If not granted, try to get permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
        setMicPermissionGranted(true);
      } catch (error) {
        console.error("Microphone permission denied:", error);
        setMicPermissionGranted(false);
      }
    };

    requestMicPermission();
  }, []);

  const { isConnected, isListening, error, disconnect, removeItem } = useRealtimeVoice({
    language,
    onOrderComplete,
    onTranscriptUpdate: (text) => {
      setTranscript((prev) => prev + text);
    },
    onItemsUpdate: (items) => {
      console.log("📥 ListeningScreen received items update:", items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        customizations: i.customizations
      })));
      setCurrentItems(items);
    },
    onConversationUpdate: (messages) => {
      setConversation(messages);
    },
  });

  const handleCancel = async () => {
    await disconnect();
    onCancel();
  };

  const handleRemoveItem = (itemName: string) => {
    removeItem(itemName);
  };

  const text = {
    en: {
      title: "Listening...",
      subtitle: "Speak your order clearly",
      placeholder: "Start speaking to see your order here...",
      cancel: "Cancel Order",
      detecting: "Detected Items",
      connecting: "Connecting to voice system...",
      error: "Connection Error",
      reconnect: "Please try again",
      conversation: "Live Conversation",
      yourOrder: "Your Order",
      customer: "You",
      agent: "AI",
      remove: "Remove",
    },
    ar: {
      title: "جارٍ الاستماع...",
      subtitle: "تحدث بوضوح عن طلبك",
      placeholder: "ابدأ التحدث لرؤية طلبك هنا...",
      cancel: "إلغاء الطلب",
      detecting: "العناصر المكتشفة",
      connecting: "جارٍ الاتصال بنظام الصوت...",
      error: "خطأ في الاتصال",
      reconnect: "يرجى المحاولة مرة أخرى",
      conversation: "المحادثة المباشرة",
      yourOrder: "طلبك",
      customer: "أنت",
      agent: "الذكاء الاصطناعي",
      remove: "حذف",
    },
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Cancel button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleCancel}
          className="absolute top-0 right-0 p-4 text-gray-400 hover:text-white transition-colors z-50"
        >
          <X className="w-8 h-8" />
        </motion.button>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-500/10 border border-red-500/30 rounded-3xl p-6 flex items-center gap-4"
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <div className="text-red-400 text-xl font-semibold">{text[language].error}</div>
              <div className="text-red-300 text-lg">{error}</div>
              <div className="text-red-400 text-sm mt-2">{text[language].reconnect}</div>
            </div>
          </motion.div>
        )}

        {/* Microphone Icon with Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: isListening ? [1, 1.3, 1] : 1,
                opacity: isListening ? [0.5, 0.8, 0.5] : 0.3,
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl"
            />
            <div className={`relative bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-full shadow-2xl ${!isConnected ? "opacity-50" : ""}`}>
              <Mic className="w-16 h-16 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-white text-center mb-2"
        >
          {!isConnected ? text[language].connecting : text[language].title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-gray-300 text-center mb-8 font-light"
        >
          {text[language].subtitle}
        </motion.p>

        {/* Voice Visualizer */}
        <div className="mb-8">
          <LiveWaveform
            active={micPermissionGranted} // Activate immediately after mic permission
            processing={!isConnected && micPermissionGranted} // Show processing while connecting
            mode="static"
            sensitivity={1.3}
            barColor="#1eff00"
            height={200}
            className="w-full"
            onError={(error) => console.error("Waveform error:", error)}
          />
        </div>

        {/* MAIN ORDER DISPLAY BOX - LARGE AND PROMINENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-6 md:p-8 mb-6 shadow-2xl"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT SIDE: Conversation Transcript */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/20">
                <div className="bg-blue-500/20 p-2 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-white">{text[language].conversation}</span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {conversation.length > 0 ? (
                  conversation.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: message.speaker === 'customer' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.speaker === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%]`}>
                        <div className={`text-xs font-bold mb-1 ${message.speaker === 'customer' ? 'text-blue-400' : 'text-purple-400'}`}>
                          {message.speaker === 'customer' ? text[language].customer : text[language].agent}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.speaker === 'customer'
                              ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                              : 'bg-purple-500/30 border border-purple-400/50 text-white'
                          }`}
                        >
                          <p className="text-base leading-relaxed">{message.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-center">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-lg">{text[language].placeholder}</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Detected Order Items with Delete Buttons */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/20">
                <div className="bg-green-500/20 p-2 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold text-white">{text[language].yourOrder}</span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <motion.div
                        key={`${item.name}-${index}`}
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          transition: { type: "spring", stiffness: 300, damping: 25 }
                        }}
                        exit={{
                          opacity: 0,
                          x: language === "ar" ? 100 : -100,
                          scale: 0.8,
                          backgroundColor: "rgb(239, 68, 68)",
                          transition: { duration: 0.4, ease: "easeInOut" }
                        }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all"
                      >
                        <div className="flex-1">
                          <span className="text-white text-xl font-semibold block">
                            {item.quantity}x {language === "ar" && item.nameAr ? item.nameAr : item.name}
                          </span>
                          {/* Show customizations if any */}
                          {item.customizations && item.customizations.length > 0 && (
                            <span className="text-blue-300 text-xs block mt-1 italic">
                              {item.customizations.join(", ")}
                            </span>
                          )}
                          <span className="text-gray-300 text-sm price">
                            {(item.price * item.quantity).toFixed(2)}
                            <SARSymbol />
                          </span>
                        </div>

                        {/* Delete Button */}
                        <motion.button
                          onClick={() => handleRemoveItem(item.name)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-all group/btn"
                        >
                          <X className="w-4 h-4 text-red-400 group-hover/btn:text-white transition-colors" />
                        </motion.button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-center">
                      <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-lg">{text[language].placeholder}</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cancel Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleCancel}
            className="px-8 py-4 text-xl text-gray-400 hover:text-white transition-colors"
          >
            {text[language].cancel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}