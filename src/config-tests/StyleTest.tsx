import React from 'react';

interface StyleTestProps {
  showResponsive?: boolean;
  showHover?: boolean;
}

/**
 * Test component for verifying Tailwind CSS styling
 * Used to validate that the Tailwind CSS and PostCSS configuration is working properly
 */
const StyleTest: React.FC<StyleTestProps> = ({ 
  showResponsive = false, 
  showHover = false 
}) => {
  return (
    <div className="space-y-4">
      {/* Basic styles */}
      <div 
        data-testid="style-test-basic" 
        className="bg-blue-500 text-white p-4 rounded"
      >
        <p 
          data-testid="style-test-text" 
          className="text-lg font-bold"
        >
          Basic Tailwind Styles
        </p>
      </div>

      {/* Responsive styles */}
      {showResponsive && (
        <div 
          data-testid="style-test-responsive" 
          className="bg-gray-200 p-2 sm:p-4 md:p-6 lg:p-8 rounded text-center"
        >
          <p className="text-sm sm:text-base md:text-lg lg:text-xl">
            Responsive Text Size
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            <div className="bg-red-200 p-2">Box 1</div>
            <div className="bg-green-200 p-2">Box 2</div>
            <div className="bg-blue-200 p-2">Box 3</div>
          </div>
        </div>
      )}

      {/* Hover states */}
      {showHover && (
        <button 
          data-testid="style-test-hover" 
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Hover Me
        </button>
      )}
    </div>
  );
};

export default StyleTest;
