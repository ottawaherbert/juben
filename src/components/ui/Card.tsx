import React from 'react';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glass';
  hoverable?: boolean;
}

export const Card = ({ className = '', variant = 'default', hoverable = false, children, ...props }: CardProps) => {
  const baseStyles = 'rounded-xl overflow-hidden transition-all';
  
  const variants = {
    default: 'bg-white shadow-sm border border-slate-200',
    outline: 'border border-slate-200 bg-transparent',
    ghost: 'bg-slate-50 border border-transparent',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
  };

  const hoverStyles = hoverable ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : '';

  return (
    <motion.div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      whileHover={hoverable ? { y: -2 } : undefined}
      {...props as any}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-t border-slate-100 bg-slate-50/50 ${className}`} {...props}>
    {children}
  </div>
);
