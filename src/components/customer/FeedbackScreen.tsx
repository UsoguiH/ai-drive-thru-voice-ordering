"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FeedbackSlider from "@/components/ui/feedback-slider";

type FeedbackScreenProps = {
  language: "en" | "ar";
  onComplete: () => void;
  onSkip: () => void;
};

export default function FeedbackScreen({ language, onComplete, onSkip }: FeedbackScreenProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [autoProceedTimer, setAutoProceedTimer] = useState(60);

  // Auto-proceed after 1 minute or when feedback is submitted
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoProceedTimer((prev) => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  // If feedback is selected, don't auto-proceed - wait for submit button
  // useEffect(() => {
  //   if (selectedFeedback !== null) {
  //     const timer = setTimeout(() => {
  //       onComplete();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [selectedFeedback, onComplete]);

  const handleFeedbackSelect = (index: number) => {
    setSelectedFeedback(index);
    console.log(`📝 Customer feedback: ${["Bad", "Not Bad", "Good"][index]} (${index + 1}/3)`);
  };

  const handleFeedbackSubmit = (index: number) => {
    console.log(`✅ Feedback submitted: ${["Bad", "Not Bad", "Good"][index]} (${index + 1}/3)`);
    onComplete();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Auto-proceed overlay */}
      {selectedFeedback === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 right-8 z-50 bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20"
        >
          <div className="text-white text-sm">
            {language === "ar"
              ? `سيتم المتابعة تلقائياً بعد ${autoProceedTimer} ثواني`
              : `Auto-proceeding in ${autoProceedTimer} seconds`
            }
          </div>
        </motion.div>
      )}

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0, x: language === "ar" ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onSkip}
        className={`absolute top-8 ${language === "ar" ? "left-8" : "right-8"} z-50 bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20 text-white hover:bg-black/70 transition-colors`}
      >
        {language === "ar" ? "تخطي" : "Skip"}
      </motion.button>

      {/* Feedback Slider */}
      <FeedbackSlider
        className="h-full w-full"
        language={language}
        onFeedbackChange={handleFeedbackSelect}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}