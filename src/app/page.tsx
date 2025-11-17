"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Monitor, ChefHat } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@900&display=swap');

        .font-arabic-bold {
          font-family: 'Cairo', sans-serif;
          font-weight: 900;
        }

        /* Blob Morphing Container */
        .blob-card-container {
          display: flex;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Blob Card Style */
        .blob-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 150px 120px 140px 110px;
          border: 1px solid #000;
          padding: 80px 65px;
          width: 480px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.12);
          text-align: center;
          cursor: pointer;
          transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: blob-morph 8s infinite ease-in-out;
        }

        /* Blob Morphing Animation */
        @keyframes blob-morph {
          0%, 100% {
            border-radius: 150px 120px 140px 110px;
          }
          25% {
            border-radius: 120px 150px 110px 140px;
          }
          50% {
            border-radius: 140px 110px 150px 120px;
          }
          75% {
            border-radius: 110px 140px 120px 150px;
          }
        }

        /* Blob Card Hover State */
        .blob-card:hover {
          transform: translateY(-35px) scale(1.1);
          box-shadow: 0 70px 160px rgba(0,0,0,0.2);
          border-width: 2px;
          animation-play-state: paused;
        }

        /* Icon Container */
        .icon-container {
          margin-bottom: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .kitchen-icon {
          background: linear-gradient(135deg, #ff4444, #cc0000);
        }

        .customer-icon {
          background: linear-gradient(135deg, #3385ff, #1a66ff);
        }

        /* Title Gradient Animation */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .blob-card-container {
            flex-direction: column;
            align-items: center;
            gap: 30px;
          }

          .blob-card {
            width: 350px;
            padding: 60px 40px;
          }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center" style={{backgroundColor: '#d2ff00'}} dir="rtl">

        {/* Title Section - Larger Container */}
        <motion.div
          className="text-center mb-20 px-20 w-full"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            minHeight: "200px",
            maxWidth: "1600px",
            margin: "0 auto"
          }}
        >
          <motion.h1
            className="font-arabic-bold text-black select-none inline-block"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              delay: 0.3
            }}
            whileHover={{
              scale: 1.05,
              textShadow: "0 15px 40px rgba(0,0,0,0.3)"
            }}
            style={{
              fontSize: "clamp(56px, 8vw, 120px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              marginBottom: "70px",
              padding: "0 40px",
              wordWrap: "break-word",
              maxWidth: "100%",
              background: "linear-gradient(45deg, #000000 0%, #333333 50%, #000000 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 3s ease-in-out infinite",
              lineHeight: "1.1"
            }}
          >
            الذكاء الاصطناعي للطلبات
          </motion.h1>
        </motion.div>

        {/* Blob Card Container */}
        <div className="blob-card-container">
          {/* Kitchen Interface Card - Left */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div
              className="blob-card"
              onClick={() => router.push("/kitchen")}
            >
              <div className="icon-container kitchen-icon">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4 font-arabic-bold">شاشة المطبخ</h3>
              <p className="text-lg text-gray-700 font-arabic-bold">إدارة الطلبات</p>
            </div>
          </motion.div>

          {/* Customer Interface Card - Right */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div
              className="blob-card"
              onClick={() => router.push("/customer")}
            >
              <div className="icon-container customer-icon">
                <Monitor className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4 font-arabic-bold">شاشة العميل</h3>
              <p className="text-lg text-gray-700 font-arabic-bold">ابدأ طلبك</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}