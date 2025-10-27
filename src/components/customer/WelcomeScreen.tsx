"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";

type WelcomeScreenProps = {
  onStart: (language: "en" | "ar") => void;
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <>
      <style jsx global>{`
        .welcome-btn {
          padding: 2.2em 4em;
          background: none;
          border: 4px solid #fff;
          font-size: 30px;
          color: #131313;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          border-radius: 24px;
          background-color: #ffbe0b;
          font-weight: bolder;
          box-shadow: 0 4px 0 4px #000;
        }

        .welcome-btn:before {
          content: "";
          position: absolute;
          width: 800px;
          height: 150%;
          background-color: #ff0000;
          top: 50%;
          transform: skewX(30deg) translate(-150%, -50%);
          transition: all 0.7s ease-in-out;
        }

        .welcome-btn:hover {
          background-color: #4cc9f0;
          color: #fff;
          box-shadow: 0 4px 0 4px #0d3b66;
        }

        .welcome-btn:hover::before {
          transform: skewX(30deg) translate(150%, -50%);
          transition-delay: 0.1s;
        }

        .welcome-btn:active {
          transform: scale(0.9);
        }
      `}</style>
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStart("ar")}
            className="welcome-btn w-full sm:w-[600px]"
          >
            <div className="text-center">
              <div className="text-3xl font-bold">العربية</div>
              <div className="text-lg font-medium">ابدأ الطلب</div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStart("en")}
            className="welcome-btn w-full sm:w-[600px]"
          >
            <div className="text-center">
              <div className="text-3xl font-bold">English</div>
              <div className="text-lg font-medium">Start ordering</div>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
    </>
  );
}