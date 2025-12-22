import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const CustomCursor = () => {
  const glowRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove as EventListener, { capture: true } as EventListenerOptions);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <div className="hidden md:block">
      <style>{`
        *, *::before, *::after { cursor: none !important; }
      `}</style>

      {/* Flashlight cursor - illuminates the dark background */}
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-[9999]"
        style={{
          width: '500px',
          height: '500px',
          marginLeft: '-250px',
          marginTop: '-250px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(6,182,212,0.08) 20%, rgba(6,182,212,0.03) 40%, transparent 60%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default CustomCursor;
