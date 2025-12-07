import React, { useState } from 'react';
import { Telescope } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-10" }) => {
  const [error, setError] = useState(false);

  // Fallback UI if image fails to load
  if (error) {
    return (
      <div className="flex items-center gap-2 select-none cursor-pointer">
         <div className="bg-gradient-to-tr from-space-accent to-blue-500 p-1.5 rounded-lg shadow-sm">
           <Telescope size={20} className="text-white" />
         </div>
         <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-lg tracking-widest text-gray-900 leading-none">
             STARLIGHT
            </span>
            <span className="font-serif text-[9px] tracking-[0.2em] text-space-accent font-bold uppercase leading-none mt-0.5">
             Journal
            </span>
         </div>
      </div>
    );
  }

  // Try to load the image
  return (
    <img 
      src="/logo.png" 
      alt="Starlight Logo" 
      className={`object-contain transition-opacity duration-300 ${className}`}
      onError={() => setError(true)}
    />
  );
};

export default Logo;