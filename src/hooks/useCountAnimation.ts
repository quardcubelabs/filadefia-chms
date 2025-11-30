import { useEffect, useState } from 'react';

interface UseCountAnimationProps {
  end: number;
  duration?: number;
  delay?: number;
  start?: number;
}

export const useCountAnimation = ({ 
  end, 
  duration = 2000, 
  delay = 0, 
  start = 0 
}: UseCountAnimationProps) => {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let animationFrame: number;

    const startAnimation = () => {
      setHasStarted(true);
      const startTime = Date.now();
      const startValue = start;
      const difference = end - start;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (difference * easeOut);
        
        setCount(Math.floor(currentValue));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animate();
    };

    if (delay > 0) {
      timeout = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, delay, start]);

  return { count, hasStarted };
};