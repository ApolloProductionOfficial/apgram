import { useState, useEffect, useRef } from 'react';
import { Activity, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  fps: number;
  memory: number | null; // MB
  domNodes: number;
  layoutShifts: number;
  longTasks: number;
}

const PerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: null,
    domNodes: 0,
    layoutShifts: 0,
    longTasks: 0,
  });
  
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const longTasksRef = useRef(0);
  const layoutShiftsRef = useRef(0);
  
  // Only show in development or when URL has ?perf=1
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showPerf = urlParams.get('perf') === '1' || import.meta.env.DEV;
    setIsVisible(showPerf);
  }, []);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let animationFrameId: number;
    let metricsInterval: ReturnType<typeof setInterval>;
    
    // FPS counter
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }
      
      animationFrameId = requestAnimationFrame(measureFPS);
    };
    
    animationFrameId = requestAnimationFrame(measureFPS);
    
    // Long Tasks observer
    let longTaskObserver: PerformanceObserver | null = null;
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        longTasksRef.current += list.getEntries().length;
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long tasks not supported
    }
    
    // Layout Shift observer
    let layoutShiftObserver: PerformanceObserver | null = null;
    try {
      layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            layoutShiftsRef.current += (entry as any).value || 0;
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
      // Layout shift not supported
    }
    
    // Update metrics periodically
    metricsInterval = setInterval(() => {
      // Calculate FPS
      const avgFrameTime = frameTimesRef.current.length > 0
        ? frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        : 16.67;
      const fps = Math.round(1000 / avgFrameTime);
      
      // Memory (Chrome only)
      const memory = (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        : null;
      
      // DOM nodes count
      const domNodes = document.querySelectorAll('*').length;
      
      setMetrics({
        fps: Math.min(fps, 120),
        memory,
        domNodes,
        layoutShifts: Math.round(layoutShiftsRef.current * 1000) / 1000,
        longTasks: longTasksRef.current,
      });
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(metricsInterval);
      longTaskObserver?.disconnect();
      layoutShiftObserver?.disconnect();
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'bg-green-500';
    if (fps >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getMemoryColor = (memory: number | null) => {
    if (!memory) return 'bg-gray-500';
    if (memory < 100) return 'bg-green-500';
    if (memory < 300) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getDOMColor = (nodes: number) => {
    if (nodes < 500) return 'bg-green-500';
    if (nodes < 1500) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (isMinimized) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 left-4 z-50 gap-2 bg-background/90 backdrop-blur border-border/50"
      >
        <Activity className="w-4 h-4" />
        <Badge className={cn("text-xs", getFPSColor(metrics.fps))}>
          {metrics.fps} FPS
        </Badge>
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-20 left-4 z-50 w-64 bg-background/95 backdrop-blur border-border/50 shadow-lg">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Performance Monitor
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsMinimized(true)}>
              <ChevronDown className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsVisible(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-1.5 rounded bg-muted/50">
            <span className="text-muted-foreground">FPS</span>
            <Badge className={cn("text-xs", getFPSColor(metrics.fps))}>
              {metrics.fps}
            </Badge>
          </div>
          
          {metrics.memory !== null && (
            <div className="flex items-center justify-between p-1.5 rounded bg-muted/50">
              <span className="text-muted-foreground">Memory</span>
              <Badge className={cn("text-xs", getMemoryColor(metrics.memory))}>
                {metrics.memory}MB
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between p-1.5 rounded bg-muted/50">
            <span className="text-muted-foreground">DOM</span>
            <Badge className={cn("text-xs", getDOMColor(metrics.domNodes))}>
              {metrics.domNodes}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-1.5 rounded bg-muted/50">
            <span className="text-muted-foreground">Long Tasks</span>
            <Badge className={cn("text-xs", metrics.longTasks > 5 ? 'bg-red-500' : 'bg-green-500')}>
              {metrics.longTasks}
            </Badge>
          </div>
        </div>
        
        <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
          💡 Советы: FPS {'<'} 30 = лаги, DOM {'>'} 1500 = тяжело, Long Tasks {'>'} 5 = зависания
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
