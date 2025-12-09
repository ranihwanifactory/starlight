
import React from 'react';
import { ExternalLink, Telescope } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 bg-gray-50 border-t border-gray-100 mt-auto animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-gray-800 font-display font-bold">
             <Telescope size={16} className="text-space-accent" />
             <span>우주스타그램</span>
          </div>
          <div className="text-xs text-gray-500 font-sans space-y-1">
             <p>hwanace@naver.com</p>
             <p className="text-gray-400">Made by <span className="font-bold text-gray-600">도형파파팩토리</span></p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 text-sm text-gray-500">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Family Sites</span>
           <div className="flex gap-4">
              <a 
                href="https://ranihwanibaby.tistory.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-space-accent hover:underline transition-all flex items-center gap-1.5 font-medium text-xs md:text-sm"
              >
                 티스토리
                 <ExternalLink size={10} />
              </a>
              <a 
                href="https://dreamlabapp.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-space-accent hover:underline transition-all flex items-center gap-1.5 font-medium text-xs md:text-sm"
              >
                 드림랩 (DreamLab)
                 <ExternalLink size={10} />
              </a>
           </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
