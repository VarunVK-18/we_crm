interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'brand';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className = '',
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-3 h-3'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'white':
        return 'bg-white';
      case 'brand':
        return 'bg-amber-600';
      default:
        return 'bg-gray-900';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex space-x-1">
        <div 
          className={`${dotSizes[size]} ${getVariantClasses()} rounded-full animate-bounce`}
        ></div>
        <div 
          className={`${dotSizes[size]} ${getVariantClasses()} rounded-full animate-bounce`}
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className={`${dotSizes[size]} ${getVariantClasses()} rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      {text && (
        <p className={`mt-3 text-sm ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );
}