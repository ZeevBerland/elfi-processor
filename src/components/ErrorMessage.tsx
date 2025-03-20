import React from 'react';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onReset: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onReset
}) => {
  return (
    <div className="rounded-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm bg-white/5 border-2 border-white/50">
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className="rounded-full p-3 sm:p-4 border-2 border-red-400 bg-red-400/10">
          <AlertCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Upload Failed
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">{message}</p>
          <button 
            onClick={onReset} 
            className="flex items-center justify-center gap-2 py-2 sm:py-3 px-4 sm:px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
          >
            <RefreshCwIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;