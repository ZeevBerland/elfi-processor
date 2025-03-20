import React from 'react';
import { CheckCircleIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';

interface SuccessMessageProps {
  fileName: string;
  onReset: () => void;
  csvData: {
    csvString: string;
    csvFileName: string;
  } | null;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  fileName,
  onReset,
  csvData
}) => {
  const handleDownload = () => {
    if (csvData && csvData.csvString) {
      // Create a blob from the CSV string
      const blob = new Blob([csvData.csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = csvData.csvFileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('CSV data not available. Please try again.');
    }
  };

  // Create a shortened filename for mobile display
  const shortFileName = fileName.length > 20 
    ? fileName.substring(0, 10) + '...' + fileName.substring(fileName.length - 10) 
    : fileName;

  return (
    <div className="rounded-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm bg-white/5 border-2 border-white/50">
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className="rounded-full p-3 sm:p-4 border-2 border-green-400 bg-green-400/10">
          <CheckCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            File Processed Successfully!
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 max-w-full break-words">
            Your file <span className="font-medium hidden sm:inline">{fileName}</span>
            <span className="font-medium sm:hidden">{shortFileName}</span> has been
            converted to CSV format.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button 
              onClick={handleDownload} 
              className="flex items-center justify-center gap-2 py-2 sm:py-3 px-6 w-48 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Download CSV
            </button>
            <button 
              onClick={onReset} 
              className="flex items-center justify-center gap-2 py-2 sm:py-3 px-6 w-48 border-2 border-white/50 hover:bg-white/10 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <RefreshCwIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Process Another File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;