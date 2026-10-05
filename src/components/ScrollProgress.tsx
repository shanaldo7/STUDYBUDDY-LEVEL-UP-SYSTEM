import React, { useEffect, useState } from 'react';

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ containerRef }) => {
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    const target = containerRef?.current || window;

    const handleScroll = () => {
      let progress = 0;
      if (containerRef?.current) {
        const el = containerRef.current;
        const total = el.scrollHeight - el.clientHeight;
        if (total > 0) {
          progress = (el.scrollTop / total) * 100;
        }
      } else {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
          progress = (window.scrollY / total) * 100;
        }
      }
      setScrollPercent(Math.min(100, Math.max(0, progress)));
    };

    if (containerRef?.current) {
      const el = containerRef.current;
      el.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-900/60 pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)] relative"
        style={{ width: `${scrollPercent}%` }}
      >
        {/* Leading edge energy spark */}
        {scrollPercent > 1 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#38bdf8]" />
        )}
      </div>
    </div>
  );
};
