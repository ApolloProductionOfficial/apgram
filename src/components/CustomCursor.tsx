import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type CursorVariant = 'default' | 'pointer' | 'drag';

type TrailDot = {
  id: string;
  x: number;
  y: number;
  variant: CursorVariant;
};

const CustomCursor = () => {
  const [isText, setIsText] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [trails, setTrails] = useState<TrailDot[]>([]);

  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const scale = useMemo(() => {
    switch (variant) {
      case 'pointer':
        return 1.5;
      case 'drag':
        return 1.35;
      default:
        return 1;
    }
  }, [variant]);

  const colorClasses = useMemo(() => {
    switch (variant) {
      case 'pointer':
        return {
          core: 'bg-accent/80',
          inner: 'bg-accent/50',
          outer: 'bg-accent/25',
        };
      case 'drag':
        return {
          core: 'bg-primary/80 ring-1 ring-primary/40',
          inner: 'bg-primary/45',
          outer: 'bg-primary/20',
        };
      default:
        return {
          core: 'bg-primary/80',
          inner: 'bg-primary/50',
          outer: 'bg-primary/30',
        };
    }
  }, [variant]);

  const updateCursorPosition = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${positionRef.current.x}px`;
      cursorRef.current.style.top = `${positionRef.current.y}px`;
    }
    rafRef.current = null;
  }, []);

  useEffect(() => {
    const getVariant = (target: HTMLElement): { variant: CursorVariant; isText: boolean } => {
      const isTextInput = !!target.closest('input, textarea, [contenteditable="true"]');
      if (isTextInput) return { variant: 'default', isText: true };

      // Sliders / draggable controls (Radix slider uses role="slider" and data-radix-slider-*)
      const isDrag = !!target.closest('[role="slider"], [data-radix-slider-thumb], [data-radix-slider-track]');
      if (isDrag) return { variant: 'drag', isText: false };

      const isClickable = !!target.closest('button, a, [role="button"]');
      if (isClickable) return { variant: 'pointer', isText: false };

      return { variant: 'default', isText: false };
    };

    const addTrailIfFast = (x: number, y: number, nextVariant: CursorVariant) => {
      const now = performance.now();
      const last = lastMoveRef.current;
      lastMoveRef.current = { x, y, t: now };

      if (!last) return;
      const dt = now - last.t;
      if (dt <= 0) return;

      const dx = x - last.x;
      const dy = y - last.y;
      const speed = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms

      // Only spawn trail on fast moves
      if (speed < 1.0) return;

      const id = `${now}-${Math.random().toString(16).slice(2)}`;
      const dot: TrailDot = { id, x, y, variant: nextVariant };

      setTrails((prev) => {
        const next = [dot, ...prev];
        return next.slice(0, 12);
      });

      window.setTimeout(() => {
        setTrails((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      const x = (e as PointerEvent).clientX;
      const y = (e as PointerEvent).clientY;
      positionRef.current = { x, y };

      // Make position updates stick to the pointer even while dragging (pointer capture)
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateCursorPosition);
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const next = getVariant(target);
        setIsText(next.isText);
        setVariant(next.variant);
        addTrailIfFast(x, y, next.variant);
      }
    };

    window.addEventListener('pointermove', handlePointerMove as EventListener, { capture: true, passive: true });
    // Fallback for older environments
    window.addEventListener('mousemove', handlePointerMove as EventListener, { capture: true, passive: true } as AddEventListenerOptions);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove as EventListener, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', handlePointerMove as EventListener, { capture: true } as EventListenerOptions);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateCursorPosition]);

  // Don't show custom cursor over text inputs - let browser handle it
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
      {/* Trail */}
      {trails.map((t) => (
        <div
          key={t.id}
          className={cn(
            'fixed pointer-events-none z-[9998] w-2 h-2 rounded-full blur-[1px] animate-fade-out',
            t.variant === 'pointer' ? 'bg-accent/25' : t.variant === 'drag' ? 'bg-primary/20' : 'bg-primary/15'
          )}
          style={{ left: `${t.x}px`, top: `${t.y}px`, transform: 'translate(-50%, -50%)' }}
        />
      ))}

      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] will-change-[left,top]"
        style={{
          left: `${positionRef.current.x}px`,
          top: `${positionRef.current.y}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="relative w-2 h-2">
          <div className={cn('absolute inset-0 rounded-full', colorClasses.core)} />
          <div className={cn('absolute -inset-1 rounded-full blur-[4px]', colorClasses.inner)} />
          <div className={cn('absolute -inset-3 rounded-full blur-[8px]', colorClasses.outer)} />
        </div>
      </div>
    </div>
  );
};

export default CustomCursor;
