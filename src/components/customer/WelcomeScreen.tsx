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
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@900&display=swap');

        .font-arabic-bold {
          font-family: 'Cairo', sans-serif;
          font-weight: 900;
        }

        .animated-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 6rem 8rem;
          border: 4px solid;
          border-color: #000;
          background-color: #fff;
          border-radius: 100px;
          font-size: 6rem;
          font-weight: 700;
          color: #000;
          box-shadow: 0 0 0 2px #000;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          min-width: 600px;
          width: auto;
        }

        .animated-button svg {
          position: absolute;
          width: 7.5rem;
          fill: #000;
          z-index: 9;
          transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .animated-button .arr-1 {
          right: 1rem;
        }

        .animated-button .arr-2 {
          left: -40%;
        }

        .animated-button .circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background-color: #fff;
          border-radius: 50%;
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .animated-button .text {
          position: relative;
          z-index: 1;
          transform: translateX(-1rem);
          transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          text-align: center;
        }

        .animated-button:hover {
          box-shadow: 0 0 0 36px transparent;
          color: #000;
          border-radius: 36px;
          background-color: transparent;
        }

        .animated-button:hover .arr-1 {
          right: -30%;
        }

        .animated-button:hover .arr-2 {
          left: 1rem;
        }

        .animated-button:hover .text {
          transform: translateX(1rem);
        }

        .animated-button:hover svg {
          fill: #000;
        }

        .animated-button:active {
          scale: 0.95;
          box-shadow: 0 0 0 12px #000;
        }

        .animated-button:hover .circle {
          width: 75rem;
          height: 75rem;
          opacity: 1;
        }

        @media (max-width: 768px) {
          .animated-button {
            padding: 3rem 4rem;
            font-size: 3rem;
            gap: 1rem;
            min-width: 300px;
          }

          .animated-button svg {
            width: 4.5rem;
          }

          .animated-button .arr-1 {
            right: 0.5rem;
          }

          .animated-button .arr-2 {
            left: -40%;
          }

          .animated-button:hover .arr-1 {
            right: -30%;
          }

          .animated-button:hover .arr-2 {
            left: 0.5rem;
          }

          .animated-button:hover .circle {
            width: 45rem;
            height: 45rem;
          }
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative" style={{backgroundColor: '#d2ff00'}} dir="rtl">

        <div className="relative z-10 max-w-4xl w-full text-center">

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-arabic-bold text-black select-none text-6xl md:text-8xl mb-6 leading-none"
          >
            مرحباً بك
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-arabic-bold text-gray-700 text-2xl md:text-3xl mb-16"
          >
            اضغط لبدء طلبك الصوتي
          </motion.p>

          {/* Language Selection Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-6 justify-center items-center"
          >
            {/* Arabic Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStart("ar")}
              className="animated-button w-full md:w-auto"
            >
              <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <span className="text font-arabic-bold">
                <div className="text-6xl mb-2">العربية</div>
                <div className="text-4xl font-bold">ابدأ الطلب</div>
              </span>
              <span className="circle"></span>
              <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
            </motion.button>

            {/* English Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStart("en")}
              className="animated-button w-full md:w-auto"
            >
              <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <span className="text">
                <div className="text-6xl font-bold mb-2">English</div>
                <div className="text-4xl font-bold">Start ordering</div>
              </span>
              <span className="circle"></span>
              <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}