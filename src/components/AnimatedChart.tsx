import { motion, easeOut, easeInOut } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedChartProps {
  children: ReactNode;
  delay?: number;
  type?: 'donut' | 'bar' | 'line' | 'area';
  className?: string;
}

export const AnimatedChart = ({ 
  children, 
  delay = 0, 
  type = 'bar',
  className = ''
}: AnimatedChartProps) => {
  const getAnimationVariants = () => {
    switch (type) {
      case 'donut':
        return {
          initial: { scale: 0, rotate: -180 },
          animate: { scale: 1, rotate: 0 },
          transition: { 
            duration: 1.5, 
            delay: delay / 1000,
            ease: easeOut,
            rotate: { duration: 1.2 }
          }
        };
      
      case 'bar':
        return {
          initial: { scaleY: 0, originY: 1 },
          animate: { scaleY: 1 },
          transition: { 
            duration: 1.2, 
            delay: delay / 1000,
            ease: easeOut
          }
        };
      
      case 'line':
        return {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { 
            duration: 2, 
            delay: delay / 1000,
            ease: easeInOut
          }
        };
      
      case 'area':
        return {
          initial: { scaleY: 0, opacity: 0, originY: 1 },
          animate: { scaleY: 1, opacity: 1 },
          transition: { 
            duration: 1.8, 
            delay: delay / 1000,
            ease: easeOut
          }
        };
      
      default:
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            duration: 1, 
            delay: delay / 1000,
            ease: easeOut
          }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      className={className}
      initial={variants.initial}
      animate={variants.animate}
      transition={variants.transition}
    >
      {children}
    </motion.div>
  );
};