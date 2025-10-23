"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { useRealtimeVoice, type ConversationMessage } from "@/hooks/useRealtimeVoice";
import type { OrderState, OrderItem } from "@/app/customer/page";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageAvatar,
} from '@/components/ai-elements/message';
import { SaudiRiyal } from '@/components/ui/SaudiRiyal';
import { nanoid } from 'nanoid';

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

type VoiceChatInterfaceProps = {
  language: "en" | "ar";
  onOrderComplete: (order: OrderState) => void;
  onCancel: () => void;
};

export default function VoiceChatInterface({
  language,
  onOrderComplete,
  onCancel,
}: VoiceChatInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  // Debug: Log conversation updates
  useEffect(() => {
    if (conversation.length > 0) {
      console.log('🗨️ Chat Interface - Conversation updated:', conversation);
    }
  }, [conversation]);

  // Request microphone permission immediately on mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'granted') {
          setMicPermissionGranted(true);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
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
      // Handle transcript updates if needed
    },
    onItemsUpdate: (items) => {
      console.log("📥 VoiceChatInterface received items update:", items.map(i => ({
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
      title: "I'm Listening...",
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
      agent: "AI Assistant",
      remove: "Remove",
      listeningStatus: "Listening...",
      orderSummary: "Order Summary",
      total: "Total:",
    },
    ar: {
      title: "أنا أستمع...",
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
      agent: "المساعد الذكي",
      remove: "حذف",
      listeningStatus: "جارٍ الاستماع...",
      orderSummary: "ملخص الطلب",
      total: "الإجمالي:",
    },
  };

  const isRTL = language === "ar";
  const totalAmount = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen p-8 flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
            <div className="text-red-400 text-xl font-semibold">{text[language].error}</div>
            <div className="text-red-300 text-lg">{error}</div>
          </motion.div>
        )}

        {/* Voice Chat Interface Container */}
        <div className="flex items-center justify-center">
          {/* CENTER: Voice Assistant Interface */}
          <div className="relative">
            {/* Animated Voice Assistant Button */}
            <div className="container-vao">
              <input
                type="checkbox"
                className="input-orb"
                id="voice-toggle"
                checked={isExpanded}
                onChange={(e) => setIsExpanded(e.target.checked)}
              />
              <label htmlFor="voice-toggle" className="orb">
                <div className="icons">
                  <svg
                    className="svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <g className="close">
                      <path
                        fill="currentColor"
                        d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4"
                      ></path>
                    </g>
                    <g fill="none" className="mic">
                      <rect
                        width="8"
                        height="13"
                        x="8"
                        y="2"
                        fill="currentColor"
                        rx="4"
                      ></rect>
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 11a7 7 0 1 0 14 0m-7 10v-2"
                      ></path>
                    </g>
                  </svg>
                </div>
                <div className="ball">
                  <div className="container-lines"></div>
                  <div className="container-rings"></div>
                </div>
                <svg style={{ pointerEvents: "none" }}>
                  <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6"></feGaussianBlur>
                    <feColorMatrix
                      values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 20 -10"
                    ></feColorMatrix>
                  </filter>
                </svg>
              </label>

              {/* Chat Interface */}
              <div className="container-chat-ia">
                <div className="container-chat">
                  <div className="container-chat-limit">
                    <Conversation className="relative size-full" style={{ height: '600px' }}>
                      <ConversationContent>
                        {conversation.length === 0 && currentItems.length === 0 ? null : (
                          <>

                          {/* Customer messages */}
                            {conversation.map((message, index) =>
                              message.speaker === 'customer' && (
                                <Message from="user" key={`customer-${index}`}>
                                  <MessageContent from="user">{message.text}</MessageContent>
                                  <MessageAvatar name="العميل" />
                                </Message>
                              )
                            )}

                            {/* AI messages */}
                            {conversation.map((message, index) =>
                              message.speaker === 'agent' && (
                                <Message from="assistant" key={`ai-${index}`}>
                                  <MessageContent from="assistant">{message.text}</MessageContent>
                                  <MessageAvatar name="المساعد" />
                                </Message>
                              )
                            )}

                            {/* Show current order items as customer message - Voice Interface Display */}
                            {currentItems.length > 0 && (
                              <Message from="user" key="order-summary">
                                <MessageContent from="user">
                                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-[600px]" dir="rtl">
                                    {/* Simple Items Count Header */}
                                    <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <p className="text-sm text-gray-500">{currentItems.length} أصناف</p>
                                      </div>
                                    </div>

                                    {/* Horizontal Order Items Layout - Display Only */}
                                    <div className="space-y-4">
                                      {currentItems.map((item, itemIndex) => (
                                        <motion.div
                                          key={itemIndex}
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            duration: 0.3,
                                            delay: itemIndex * 0.1,
                                            ease: "easeOut"
                                          }}
                                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                        >
                                          {/* Item Image Placeholder */}
                                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                                          </div>

                                          {/* Item Details */}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-base mb-1">
                                              {isRTL && item.nameAr ? item.nameAr : item.name}
                                            </h4>

                                            {/* Customizations in Green */}
                                            {item.customizations && item.customizations.length > 0 && (
                                              <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.customizations.map((customization, customIndex) => (
                                                  <span
                                                    key={customIndex}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700"
                                                  >
                                                    <svg className="w-3 h-3 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    {customization}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* Quantity Display Only */}
                                          <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-500 font-medium">الكمية</span>
                                            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border-2 border-green-500 mt-1">
                                              <span className="text-lg font-bold text-green-600">{item.quantity}</span>
                                            </div>
                                          </div>

                                          {/* Price */}
                                          <div className="text-left">
                                            <p className="text-lg font-semibold text-gray-900 flex items-center gap-1 flex-row-reverse">
                                              {(item.price * item.quantity).toFixed(2)}
                                              <SARSymbol />
                                            </p>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>

                                    {/* Simple Total Summary */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-gray-900">الإجمالي</span>
                                        <span className="text-2xl font-bold text-green-600 flex items-center gap-2 flex-row-reverse">
                                          {totalAmount.toFixed(2)}
                                          <SARSymbol />
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </MessageContent>
                                <MessageAvatar name="عميل" />
                              </Message>
                            )}
                          </>
                        )}
                      </ConversationContent>
                    </Conversation>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .container-vao {
          position: relative;
          width: 800px;
          height: 800px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-orb:checked ~ .container-chat-ia {
          width: 90vw;
          height: 700px;
          filter: blur(0px);
          opacity: 1;
          max-width: 1600px;
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 999999;
        }

        .input-orb:checked ~ .orb {
          filter: drop-shadow(0 0 24px rgba(145, 71, 255, 0.3))
            drop-shadow(0 0 10px rgba(255, 0, 0, 0.3));
          transform-origin: center center;
          transform: translate(-50%, 220px);
          pointer-events: auto;
          z-index: 1000000;

          & .icons .svg {
            opacity: 1;
            filter: drop-shadow(0 0 8px #ffffff);
          }

          &:hover {
            transform: translate(-50%, 220px) scale(1.1);

            & .icons .svg .mic {
              opacity: 0;
              transform: scale(1.1);
              filter: drop-shadow(0 0 8px #ffffff);
            }

            & .icons .svg .close {
              transform: scale(1.1);
              filter: drop-shadow(0 0 8px #ffffff);
              opacity: 1;
            }
          }

          &:active {
            transform: translate(-50%, 220px) scale(0.9);
          }
        }

        .input-orb:not(:checked) ~ .container-chat-ia * {
          animation: none;
        }

        .input-orb:not(:checked) ~ .orb {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255))
            drop-shadow(0 0 24px rgba(255, 255, 255))
            drop-shadow(0 0 24px rgba(145, 71, 255, 0.3))
            drop-shadow(0 0 10px rgba(255, 0, 0, 0.3));
          transform: scale(1.2) translate(-50%, -50%);

          & .ball {
            animation: circle2 4.2s ease-in-out infinite;
          }

          &:hover {
            transform: scale(1.4) translate(-50%, -50%);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255))
              drop-shadow(0 0 16px rgba(255, 255, 255))
              drop-shadow(0 0 24px rgba(255, 255, 255))
              drop-shadow(0 0 20px rgba(145, 71, 255, 0.3))
              drop-shadow(0 12px 52px rgba(255, 0, 0, 0.3));

            & .icons .svg {
              transform: scale(1.1);
              filter: drop-shadow(0 0 8px #ffffff);
              opacity: 1;
            }
          }

          &:active {
            transform: scale(1.2) translate(-50%, -50%);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255))
              drop-shadow(0 0 16px rgba(255, 255, 255))
              drop-shadow(0 0 24px rgba(255, 255, 255))
              drop-shadow(0 0 20px rgba(145, 71, 255, 0.3))
              drop-shadow(0 12px 52px rgba(255, 0, 0, 0.3));
          }

          & * {
            animation: none;
          }
        }

        @keyframes circle2 {
          0% {
            transform: scale(1.5);
          }

          15% {
            transform: scale(1.53);
          }

          30% {
            transform: scale(1.48);
          }

          45% {
            transform: scale(1.44);
          }

          60% {
            transform: scale(1.47);
          }

          85% {
            transform: scale(1.53);
          }

          100% {
            transform: scale(1.5);
          }
        }

        .container-chat-ia {
          opacity: 0;
          filter: blur(50px);
          display: flex;
          flex-direction: column;
          width: 64px;
          height: 64px;
          padding: 0.5rem;
          border-radius: 2rem;
          background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%);
          box-shadow:
            6px 6px 12px rgba(255, 0, 2, 0.1),
            -6px 6px 12px rgba(59, 130, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          gap: 6px;
          transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }

        .container-title {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 20px;
          background: rgba(0, 0, 0, 0.02);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);

          & svg {
            color: #007AFF;
            filter: drop-shadow(0 2px 4px rgba(0, 122, 255, 0.3));
          }

          & .text-title {
            font-size: 36px;
            font-weight: 600;
            background: linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #FF3B30 100%);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            background-size: 200% 200%;
            animation: appleGradient 4s ease infinite;
            text-shadow: 0 2px 10px rgba(0, 122, 255, 0.2);
          }
        }

        @keyframes appleGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes animation-color-svg {
          0%,
          30% {
            color: #ff0002;
          }

          15% {
            color: #3b82f6;
          }
        }

        @keyframes animation-color-text {
          0% {
            background-position: -800px;
          }

          50% {
            background-position: 0px;
          }
        }

        .container-chat {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          font-size: 32px;
          background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%);
          border-radius: 3rem;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .container-chat-limit {
          display: flex;
          -webkit-mask: linear-gradient(0deg, white 85%, transparent 95% 100%);
          mask: linear-gradient(0deg, white 85%, transparent 95% 100%);
          z-index: 999;
          background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%);
        }

        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%);
        }

        @keyframes animation-chats {
          0%,
          55% {
            transform: translateY(0px);
          }

          70% {
            transform: translateY(-70px);
          }

          80%,
          100% {
            transform: translateY(-110px);
          }
        }

        .orb {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: left top;
          transform: translate(-50%, -50%);
          width: 128px;
          height: 128px;
          display: flex;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          z-index: 999999;

          & .icons .svg .close {
            opacity: 0;
          }
        }

        .icons {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease-in-out;
          z-index: 999;

          & .svg {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            opacity: 0.5;
            transition: all 0.3s ease-in-out;
          }
        }

        .ball {
          display: flex;
          width: 128px;
          height: 128px;
          flex-shrink: 0;
          border-radius: 50px;
          background-color: #ff0002;
          filter: url(#gooey);
        }

        .container-lines {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background-image: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.75) 15%,
            #3b82f6 50%
          );
          clip-path: polygon(
            50% 25%,
            65% 30%,
            75% 42%,
            75% 58%,
            65% 70%,
            50% 75%,
            35% 70%,
            26% 58%,
            25% 42%,
            35% 30%
          );
          animation: animation-ball 15s both ease;
          pointer-events: none;
        }

        @keyframes animation-ball {
          2% {
            clip-path: polygon(
              50% 25%,
              50% 0,
              75% 42%,
              75% 58%,
              65% 70%,
              50% 75%,
              35% 70%,
              26% 58%,
              25% 42%,
              50% 0
            );
          }

          4% {
            clip-path: polygon(
              50% 25%,
              70% 0,
              75% 42%,
              85% 66%,
              65% 100%,
              50% 75%,
              35% 100%,
              15% 65%,
              25% 42%,
              30% 0
            );
          }

          6% {
            clip-path: polygon(
              50% 25%,
              50% 15%,
              75% 42%,
              75% 58%,
              65% 70%,
              50% 75%,
              35% 70%,
              26% 58%,
              25% 42%,
              50% 15%
            );
          }

          7%,
          59% {
            clip-path: polygon(
              50% 25%,
              100% 12%,
              75% 42%,
              85% 66%,
              65% 70%,
              50% 75%,
              35% 70%,
              15% 65%,
              25% 42%,
              0 12%
            );
          }

          9%,
          57% {
            clip-path: polygon(
              50% 25%,
              50% 0,
              75% 42%,
              75% 58%,
              65% 70%,
              50% 75%,
              35% 70%,
              26% 58%,
              25% 42%,
              50% 0
            );
          }

          12%,
          55%,
          61% {
            clip-path: polygon(
              50% 25%,
              65% 30%,
              75% 42%,
              75% 58%,
              65% 70%,
              50% 75%,
              35% 70%,
              26% 58%,
              25% 42%,
              35% 30%
            );
          }
        }

        .container-rings {
          aspect-ratio: 1;
          border-radius: 50%;
          position: absolute;
          inset: 0;
          perspective: 22rem;

          &:before,
          &:after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(white, blue, magenta, violet, lightyellow);
            border-radius: 50%;
            border: 12px solid transparent;
            mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
          }
        }

        .container-rings::before {
          animation: ring180 10s linear infinite;
        }

        .container-rings::after {
          animation: ring90 10s linear infinite;
        }

        @keyframes ring180 {
          0% {
            transform: rotateY(180deg) rotateX(180deg) rotateZ(180deg);
          }

          50% {
            transform: rotateY(360deg) rotateX(360deg) rotateZ(360deg) scale(1.1);
          }

          100% {
            transform: rotateY(540deg) rotateX(540deg) rotateZ(540deg);
          }
        }

        @keyframes ring90 {
          0% {
            transform: rotateY(90deg) rotateX(90deg) rotateZ(90deg);
          }

          50% {
            transform: rotateY(270deg) rotateX(270deg) rotateZ(270deg) scale(1.1);
          }

          100% {
            transform: rotateY(450deg) rotateX(450deg) rotateZ(450deg);
          }
        }

        /* Dark mode adaptations */
        .dark .chat-user p {
          background-color: rgba(59, 130, 246, 0.2);
          color: #e5e7eb;
        }

        .dark .chat-ia p {
          color: #e5e7eb;
        }

        .dark .container-title .text-title {
          background-image: linear-gradient(
            to left,
            #3b82f6 0% 20%,
            #8b5cf6 50%,
            #3b82f6 80% 100%
          );
        }

        .dark .container-title svg {
          color: #3b82f6;
        }

        @keyframes animation-color-svg-dark {
          0%,
          30% {
            color: #3b82f6;
          }

          15% {
            color: #8b5cf6;
          }
        }

        .dark .container-title svg {
          animation: animation-color-svg-dark 8s 1s infinite both;
        }
      `}</style>
    </div>
  );
}