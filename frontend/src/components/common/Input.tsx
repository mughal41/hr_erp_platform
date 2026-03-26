import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/10 transition-all ${
          error 
            ? 'border-rose-300 focus:border-rose-500 text-rose-900 placeholder:text-rose-300' 
            : 'border-slate-200 focus:border-primary-500 text-slate-900 placeholder:text-slate-400'
        }`}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-500 ml-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500 ml-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
