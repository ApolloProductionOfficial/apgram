import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type TrailDot = {
  id: number;
  x: number;
  y: number;
  opacity: number;
};

const TRAIL_LENGTH = 20;
const TRAIL_FADE_SPEED = 0.06;

const CustomCursor = () => {
  const [isText, setIsText] = useState(false);
  const [trails, setTrails] = useState<TrailDot[]>([]);

  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const trailIdRef = useRef(0);
  const lastTrailPosRef = useRef({ x: 0, y: 0 });

  const updateCursorPosition = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${positionRef.current.x}px`;
      cursorRef.current.style.top = `${positionRef.current.y}px`;
    }
    rafRef.current = null;
  }, []);

  // Fade out trails smoothly
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      setTrails((prev) => 
        prev
          .map((t) => ({ ...t, opacity: t.opacity - TRAIL_FADE_SPEED }))
          .filter((t) => t.opacity > 0)
      );
    }, 16);

    return () => clearInterval(fadeInterval);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      positionRef.current = { x, y };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateCursorPosition);
      }

      // Check for text input
      const target = e.target as HTMLElement | null;
      if (target) {
        const isTextInput = !!target.closest('input, textarea, [contenteditable="true"]');
        setIsText(isTextInput);
      }

      // Add trail dot if moved enough distance
      const lastPos = lastTrailPosRef.current;
      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 8) {
        lastTrailPosRef.current = { x, y };
        trailIdRef.current += 1;

        setTrails((prev) => {
          const newTrail: TrailDot = {
            id: trailIdRef.current,
            x,
            y,
            opacity: 0.6,
          };
          return [newTrail, ...prev].slice(0, TRAIL_LENGTH);
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { capture: true, passive: true });
    window.addEventListener('mousemove', handlePointerMove as EventListener, { capture: true, passive: true } as AddEventListenerOptions);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove as EventListener, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', handlePointerMove as EventListener, { capture: true } as EventListenerOptions);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateCursorPosition]);

  if (isText) {
    return (
      <style>{`
        body { cursor: auto !important; }
        * { cursor: inherit; }
        input, textarea { cursor: text !important; }
      `}</style>
    );
  }

  return (
    <div className="hidden md:block">
      {/* Comet trail */}
      {trails.map((t, index) => {
        const size = Math.max(2, 6 - index * 0.25);
        return (
          <div
            key={t.id}
            className="fixed pointer-events-none z-[9998] rounded-full bg-primary"
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: t.opacity,
              transform: 'translate(-50%, -50%)',
              filter: `blur(${Math.min(index * 0.3, 2)}px)`,
            }}
          />
        );
      })}

      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] will-change-[left,top]"
        style={{
          left: `${positionRef.current.x}px`,
          top: `${positionRef.current.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative w-2 h-2">
          <div className="absolute inset-0 rounded-full bg-primary/80" />
          <div className="absolute -inset-1 rounded-full bg-primary/50 blur-[4px]" />
          <div className="absolute -inset-3 rounded-full bg-primary/30 blur-[8px]" />
        </div>
      </div>
    </div>
  );
};

export default CustomCursor;
