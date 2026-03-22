import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({ className = '', variant = 'primary', size = 'md', children, ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const variants = {
    primary: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'border border-slate-300 bg-transparent text-slate-600',
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    info: 'bg-sky-100 text-sky-700 border border-sky-200',
    ghost: 'bg-slate-50 text-slate-500 border border-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </div>
  );
};
