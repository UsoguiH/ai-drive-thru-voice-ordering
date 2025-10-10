"use client";

import { motion } from "framer-motion";

type VoiceVisualizerProps = {
  isActive: boolean;
};

export default function VoiceVisualizer({ isActive }: VoiceVisualizerProps) {
  const bars = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-2 h-32">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full"
          animate={
            isActive
              ? {
                  height: [
                    Math.random() * 80 + 20,
                    Math.random() * 100 + 30,
                    Math.random() * 80 + 20,
                  ],
                  opacity: [0.5, 1, 0.5],
                }
              : {
                  height: 20,
                  opacity: 0.3,
                }
          }
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.03,
          }}
        />
      ))}
    </div>
  );
}