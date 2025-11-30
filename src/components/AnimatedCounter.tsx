import { motion } from 'framer-motion';
import { useCountAnimation } from '@/hooks/useCountAnimation';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: (num: number) => string;
}

export const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  delay = 0, 
  className = '',
  prefix = '',
  suffix = '',
  formatNumber
}: AnimatedCounterProps) => {
  const { count, hasStarted } = useCountAnimation({ end, duration, delay });

  const formatValue = (value: number) => {
    if (formatNumber) {
      return formatNumber(value);
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    
    return value.toString();
  };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: hasStarted ? 1 : 0, 
        scale: hasStarted ? 1 : 0.5 
      }}
      transition={{ 
        duration: 0.5, 
        delay: delay / 1000,
        ease: "easeOut"
      }}
    >
      {prefix}{formatValue(count)}{suffix}
    </motion.span>
  );
};