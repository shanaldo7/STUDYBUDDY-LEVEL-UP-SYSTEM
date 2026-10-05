import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  staggerIndex?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  staggerIndex = 0,
  threshold = 0.12,
  triggerOnce = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If reduced motion is preferred, reveal immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(el);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce]);

  const delayMs = staggerIndex * 80;

  return (
    <div
      ref={elementRef}
      className={`
        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-7 scale-[0.96] pointer-events-none'}
        ${className}
      `}
      style={{
        transitionDelay: isVisible ? `${delayMs}ms` : '0ms'
      }}
    >
      {children}
    </div>
  );
};
