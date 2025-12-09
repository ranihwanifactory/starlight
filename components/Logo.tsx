
import React, { useState } from 'react';
import { Telescope } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-10" }) => {
  // Directly render the text version for "UJU"
  return (
      <div className="flex items-center gap-2 select-none cursor-pointer">
         <div className="bg-gradient-to-tr from-space-accent to-blue-500 p-1.5 rounded-lg shadow-sm">
           <Telescope size={20} className="text-white" />
         </div>
         <div className="flex flex-col justify-center">
            <span className="font-display font-bold text-lg tracking-widest text-gray-900 leading-none" style={{ fontFamily: '"Orbitron", "Noto Sans KR", sans-serif' }}>
             UJU
            </span>
         </div>
      </div>
  );
};

export default Logo;
