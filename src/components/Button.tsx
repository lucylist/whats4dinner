import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'font-sans font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-black/20';
  
  const variantClasses = {
    primary: 'bg-gold text-forest-900 hover:bg-gold-light active:bg-gold-dark',
    secondary: 'bg-forest-600 text-cream-100 hover:bg-forest-500 active:bg-forest-400 border border-forest-400/50',
    danger: 'bg-terracotta text-forest-900 hover:bg-terracotta-dark active:opacity-80',
    outline: 'border-2 border-gold text-gold hover:bg-forest-600 shadow-none'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
