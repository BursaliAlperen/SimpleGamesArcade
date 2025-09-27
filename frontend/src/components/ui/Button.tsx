import React from 'react';
import { playSfx } from '../../audio';
import { SpinnerIcon } from '../icons/UIIcons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large' | 'small';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'normal', fullWidth = false, className, onClick, isLoading = false, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-gray-900 focus:ring-cyan-500 shadow-lg shadow-cyan-500/30',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500',
  };

  const sizeClasses = {
    normal: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
    small: 'p-2',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading) {
      playSfx('click');
      if (onClick) {
        onClick(e);
      }
    }
  };

  return (
    <button className={combinedClasses} onClick={handleClick} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <SpinnerIcon className="animate-spin h-6 w-6" /> : children}
    </button>
  );
};

export default Button;
