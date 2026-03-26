import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  extra,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {(title || extra) && (
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
