// feedback-slider.tsx
import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";

const getAnimationStates = (language: "en" | "ar") => {
  if (language === "ar") {
    // Arabic: Same structure as English but with Arabic labels
    // Index 0 = Left (سيء), Index 1 = Middle (أقل من المتوقع), Index 2 = Right (ممتاز)
    return [
      {
        bgColor: "#fc7359",
        indicatorColor: "#790b02",
        pathColor: "#fc7359",
        smileColor: "#790b02",
        titleColor: "#790b02",
        trackColor: "#fc5b3e",
        eyeWidth: 56,
        eyeHeight: 56,
        eyeBorderRadius: "100%",
        eyeBg: "#790b02",
        smileRotate: 180,
        indicatorRotate: 180,
        noteText: "سيء",
        noteColor: "#e33719",
        noteX: "0%",
        indicatorLeft: "0%",
      },
      {
        bgColor: "#dfa342",
        indicatorColor: "#482103",
        pathColor: "#dfa342",
        smileColor: "#482103",
        titleColor: "#482103",
        trackColor: "#b07615",
        eyeWidth: 100,
        eyeHeight: 20,
        eyeBorderRadius: "36px",
        eyeBg: "#482103",
        smileRotate: 180,
        indicatorRotate: 180,
        noteText: "أقل من المتوقع",
        noteColor: "#b37716",
        noteX: "-100%",
        indicatorLeft: "50%",
      },
      {
        bgColor: "#9fbe59",
        indicatorColor: "#0b2b03",
        pathColor: "#9fbe59",
        smileColor: "#0b2b03",
        titleColor: "#0b2b03",
        trackColor: "#698b1b",
        eyeWidth: 120,
        eyeHeight: 120,
        eyeBorderRadius: "100%",
        eyeBg: "#0b2b03",
        smileRotate: 0,
        indicatorRotate: 0,
        noteText: "ممتاز",
        noteColor: "#6e901d",
        noteX: "-200%",
        indicatorLeft: "100%",
      },
    ];
  } else {
    // English order: Bad → Not Bad → Good
    return [
      {
        bgColor: "#fc7359",
        indicatorColor: "#790b02",
        pathColor: "#fc7359",
        smileColor: "#790b02",
        titleColor: "#790b02",
        trackColor: "#fc5b3e",
        eyeWidth: 56,
        eyeHeight: 56,
        eyeBorderRadius: "100%",
        eyeBg: "#790b02",
        smileRotate: 180,
        indicatorRotate: 180,
        noteText: "BAD",
        noteColor: "#e33719",
        noteX: "0%",
        indicatorLeft: "0%",
      },
      {
        bgColor: "#dfa342",
        indicatorColor: "#482103",
        pathColor: "#dfa342",
        smileColor: "#482103",
        titleColor: "#482103",
        trackColor: "#b07615",
        eyeWidth: 100,
        eyeHeight: 20,
        eyeBorderRadius: "36px",
        eyeBg: "#482103",
        smileRotate: 180,
        indicatorRotate: 180,
        noteText: "NOT BAD",
        noteColor: "#b37716",
        noteX: "-100%",
        indicatorLeft: "50%",
      },
      {
        bgColor: "#9fbe59",
        indicatorColor: "#0b2b03",
        pathColor: "#9fbe59",
        smileColor: "#0b2b03",
        titleColor: "#0b2b03",
        trackColor: "#698b1b",
        eyeWidth: 120,
        eyeHeight: 120,
        eyeBorderRadius: "100%",
        eyeBg: "#0b2b03",
        smileRotate: 0,
        indicatorRotate: 0,
        noteText: "GOOD",
        noteColor: "#6e901d",
        noteX: "-200%",
        indicatorLeft: "100%",
      },
    ];
  }
};

const HandDrawnSmileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <motion.svg
    width="100%"
    height="100%"
    viewBox="0 0 100 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <motion.path
      d="M10 30 Q50 70 90 30"
      strokeWidth="12"
      strokeLinecap="round"
    />
  </motion.svg>
);

export interface FeedbackSliderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onFeedbackChange?: (index: number) => void;
  onFeedbackSubmit?: (index: number) => void;
  language?: "en" | "ar";
}

const FeedbackSlider = React.forwardRef<HTMLDivElement, FeedbackSliderProps>(
  ({ className, onFeedbackChange, onFeedbackSubmit, language = "en", ...props }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const animationStates = getAnimationStates(language);
    const currentAnim = animationStates[selectedIndex];
    const transition = { type: "spring", stiffness: 300, damping: 30 };

    // Translations
    const texts = {
      en: {
        question: "How was your shopping experience?",
        bad: "Bad",
        notBad: "Not Bad",
        good: "Good",
        submitText: "Submit Feedback",
        badMessage: "We apologize for your experience, and we promise to improve it next time.",
        notBadMessage: "It seems you weren't satisfied, but we promise you'll like it more next time.",
        goodMessage: "Awesome! We're glad you enjoyed the experience, see you again soon!"
      },
      ar: {
        question: "كيف كانت تجربة التسوق؟",
        bad: "سيء",
        notBad: "أقل من المتوقع",
        good: "ممتاز",
        submitText: "إرسال التقييم",
        badMessage: "نعتذر عن التجربة، وباذن الله نحسنها المره الجايه",
        notBadMessage: "شكلك ما كنت راضي بس نوعدك المرات الجاية بتعجبك أكثر",
        goodMessage: "يا سلام! مبسوطين إن التجربة عجبتك، نشوفك قريب"
      }
    };

    const t = texts[language];
    const isRTL = language === "ar";

    return (
      <motion.div
        ref={ref}
        className={`relative flex h-screen w-full items-center justify-center overflow-hidden ${className}`}
        animate={{ backgroundColor: currentAnim.bgColor }}
        transition={transition}
        dir={isRTL ? "rtl" : "ltr"}
        {...props}
      >
        <div className="flex h-full w-[400px] flex-col items-center justify-center p-4">
          <motion.h3
            className="mb-10 w-72 text-center text-5xl font-black"
            animate={{ color: currentAnim.titleColor }}
            transition={transition}
          >
            {t.question}
          </motion.h3>
          <div className="flex h-[176px] flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-8">
              <motion.div
                animate={{
                  width: currentAnim.eyeWidth,
                  height: currentAnim.eyeHeight,
                  borderRadius: currentAnim.eyeBorderRadius,
                  backgroundColor: currentAnim.eyeBg,
                }}
                transition={transition}
              />
              <motion.div
                animate={{
                  width: currentAnim.eyeWidth,
                  height: currentAnim.eyeHeight,
                  borderRadius: currentAnim.eyeBorderRadius,
                  backgroundColor: currentAnim.eyeBg,
                }}
                transition={transition}
              />
            </div>
            <motion.div
              className="flex h-14 w-14 items-center justify-center"
              animate={{ rotate: currentAnim.smileRotate }}
              transition={transition}
            >
              <HandDrawnSmileIcon
                animate={{ stroke: currentAnim.smileColor }}
                transition={transition}
              />
            </motion.div>
          </div>

          {/* Arabic Text Under Face */}
          {language === "ar" && (
            <motion.div
              className="mt-6 text-center"
              animate={{ color: currentAnim.titleColor }}
              transition={transition}
            >
              <h2 className="text-4xl font-bold">
                {selectedIndex === 0 && "سيء"}
                {selectedIndex === 1 && "أقل من المتوقع"}
                {selectedIndex === 2 && "ممتاز"}
              </h2>
            </motion.div>
          )}

          <div className="flex w-full items-center justify-start overflow-hidden pb-14 pt-7">
            <motion.div
              className="flex w-full shrink-0"
              animate={{ x: currentAnim.noteX }}
              transition={transition}
            >
              {animationStates.map((state, i) => (
                <div
                  key={i}
                  className="flex w-full shrink-0 items-center justify-center"
                >
                  <h1
                    className="text-7xl font-black"
                    data-map-index={i}
                    style={{ color: state.noteColor }}
                  >
                    {state.noteText}
                  </h1>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="w-full">
            <div className="relative flex w-full items-center justify-between">
              {animationStates.map((_, i) => {
                // For RTL (Arabic), we need to reverse the index to match visual position
                const actualIndex = language === "ar" ? 2 - i : i;
                return (
                  <button
                    key={i}
                    className="z-[2] h-6 w-6 rounded-full"
                    onClick={() => {
                      setSelectedIndex(actualIndex);
                      onFeedbackChange?.(actualIndex);
                    }}
                    style={{ backgroundColor: currentAnim.trackColor }}
                  />
                );
              })}
              <motion.div
                className="absolute top-1/2 h-1 w-full -translate-y-1/2"
                animate={{ backgroundColor: currentAnim.trackColor }}
                transition={transition}
              />
              <motion.div
                className="absolute z-[3] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full p-2"
                animate={{
                  left: currentAnim.indicatorLeft,
                  rotate: currentAnim.indicatorRotate,
                  backgroundColor: currentAnim.indicatorColor,
                }}
                transition={transition}
              >
                <HandDrawnSmileIcon
                  animate={{ stroke: currentAnim.pathColor }}
                  transition={transition}
                />
              </motion.div>
            </div>
            <div className="flex w-full items-center justify-between pt-6">
              {(language === "ar"
                ? [t.good, t.notBad, t.bad] // Arabic order: ممتاز (right), أقل من المتوقع (middle), سيء (left)
                : [t.bad, t.notBad, t.good] // English order: Bad (left), Not Bad (middle), Good (right)
              ).map((text, i) => {
                // For RTL (Arabic), reverse the index to match visual position
                const actualIndex = language === "ar" ? 2 - i : i;
                return (
                  <motion.span
                    key={text}
                    className="w-full text-center font-medium"
                    animate={{
                      color: currentAnim.titleColor,
                      opacity: selectedIndex === actualIndex ? 1 : 0.6,
                    }}
                    transition={transition}
                  >
                    {text}
                  </motion.span>
                );
              })}
            </div>

            {/* Submit Button */}
            <motion.div
              className="mt-8 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-gray-800 hover:bg-gray-900 border-2`}
                animate={{
                  borderColor: currentAnim.trackColor,
                  backgroundColor: "#1f2937",
                }}
                transition={transition}
                onClick={() => {
                  onFeedbackSubmit?.(selectedIndex);
                }}
              >
                {t.submitText}
              </motion.button>

              {/* Feedback Message */}
              <motion.div
                className="text-center px-4"
                animate={{ color: currentAnim.titleColor }}
                transition={transition}
              >
                {selectedIndex === 0 && (
                  <motion.p
                    className="text-2xl font-bold leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {t.badMessage}
                  </motion.p>
                )}
                {selectedIndex === 1 && (
                  <motion.p
                    className="text-2xl font-bold leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {t.notBadMessage}
                  </motion.p>
                )}
                {selectedIndex === 2 && (
                  <motion.p
                    className="text-2xl font-bold leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {t.goodMessage}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }
);

FeedbackSlider.displayName = "FeedbackSlider";

export default FeedbackSlider;