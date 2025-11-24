import { motion } from 'framer-motion';

interface AnimatedSVGPathProps {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export const AnimatedSVGPath = ({ 
  d, 
  fill = 'none', 
  stroke = '#3b82f6', 
  strokeWidth = 3,
  delay = 0,
  duration = 2,
  className = ''
}: AnimatedSVGPathProps) => {
  return (
    <motion.path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration, delay: delay / 1000, ease: "easeInOut" },
        opacity: { duration: 0.3, delay: delay / 1000 }
      }}
    />
  );
};

interface AnimatedCircleProps {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  className?: string;
  strokeDasharray?: string;
  strokeDashoffset?: string;
}

export const AnimatedCircle = ({ 
  cx, 
  cy, 
  r, 
  fill = '#3b82f6', 
  stroke = 'white', 
  strokeWidth = 3,
  delay = 0,
  className = '',
  strokeDasharray,
  strokeDashoffset
}: AnimatedCircleProps) => {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
      className={className}
      initial={{ 
        scale: 0, 
        pathLength: strokeDasharray ? 0 : undefined 
      }}
      animate={{ 
        scale: 1, 
        pathLength: strokeDasharray ? 1 : undefined 
      }}
      transition={{
        scale: { duration: 0.6, delay: delay / 1000, ease: "easeOut" },
        pathLength: strokeDasharray ? { duration: 1.5, delay: delay / 1000, ease: "easeInOut" } : undefined
      }}
    />
  );
};