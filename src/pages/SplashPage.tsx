import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export function SplashPage({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0d1117] flex flex-col items-center justify-center z-[200]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-black/50 overflow-hidden mb-6">
          <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
            <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
            <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
          </svg>
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="font-serif text-3xl font-bold text-white tracking-tight mb-2">KDK Practice</h1>
          <p className="text-white/50 tracking-widest uppercase text-sm">Suite</p>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12"
      >
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-blue-500 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
