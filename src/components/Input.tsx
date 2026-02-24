import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-cream-400 mb-1">
          {label}
          {props.required && <span className="text-terracotta ml-1">*</span>}
        </label>
      )}
      
      <input
        className={`
          w-full px-3 py-2 border rounded-xl bg-forest-800 text-cream-100
          focus:ring-2 focus:ring-gold focus:border-gold
          disabled:bg-forest-900 disabled:cursor-not-allowed
          placeholder:text-cream-500
          ${error ? 'border-terracotta' : 'border-forest-500'}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-terracotta">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-cream-500">{helperText}</p>
      )}
    </div>
  );
}
