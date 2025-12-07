import React from 'react';

const StarBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-gray-50">
      {/* Subtle Texture/Gradient for Light Mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100"></div>
      
      {/* Very faint decorative shapes for depth */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[120px]"></div>
    </div>
  );
};

export default StarBackground;