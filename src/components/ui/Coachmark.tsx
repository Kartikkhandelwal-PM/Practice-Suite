import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Sparkles } from 'lucide-react';

interface CoachmarkProps {
  id: string;
  title: string;
  content: string;
  targetId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onClose?: () => void;
}

export function Coachmark({ id, title, content, targetId, position = 'bottom', onClose }: CoachmarkProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const hasSeen = localStorage.getItem(`coachmark-${id}`);
    if (hasSeen) return;

    const updatePosition = () => {
      const target = document.getElementById(targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }
        setCoords({ top, left });
        setIsVisible(true);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [id, targetId, position]);

  const handleDismiss = () => {
    localStorage.setItem(`coachmark-${id}`, 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const translate = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }[position];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ top: coords.top, left: coords.left, transform: translate }}
        className="absolute pointer-events-auto w-[280px] bg-white rounded-2xl shadow-2xl border border-blue-100 p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Quick Tip</span>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <h4 className="text-[15px] font-bold text-gray-900 mb-1.5">{title}</h4>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{content}</p>
        
        <button 
          onClick={handleDismiss}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
        >
          Got it <ChevronRight size={14} />
        </button>

        {/* Arrow */}
        <div 
          className={`absolute w-3 h-3 bg-white border-l border-t border-blue-100 rotate-45 ${
            position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-0 border-t-0 border-r border-b' :
            position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-t-0 border-r border-b rotate-[-45deg]' :
            'left-[-6px] top-1/2 -translate-y-1/2 rotate-[-135deg]'
          }`}
        />
      </motion.div>
    </div>
  );
}
