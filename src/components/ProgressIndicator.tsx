import React from 'react';

interface ProgressIndicatorProps {
  fileName: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  fileName
}) => {
  // Create a shortened filename for mobile display
  const shortFileName = fileName.length > 20 
    ? fileName.substring(0, 10) + '...' + fileName.substring(fileName.length - 10) 
    : fileName;

  return (
    <div className="rounded-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm bg-white/5 border-2 border-white/50 text-center">
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Processing File
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-1 max-w-full break-words">
            Converting <span className="font-medium hidden sm:inline">{fileName}</span>
            <span className="font-medium sm:hidden">{shortFileName}</span>
          </p>
          <p className="text-xs sm:text-sm text-blue-200">This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;