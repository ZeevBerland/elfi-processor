import React, { useCallback, useState } from 'react';
import { UploadIcon } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  uploadState: string;
  setUploadState: (state: 'idle' | 'dragging') => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  uploadState,
  setUploadState
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    setUploadState('dragging');
  }, [setUploadState]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setUploadState('idle');
  }, [setUploadState]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setUploadState('idle');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload, setUploadState]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);
  
  return (
    <div 
      className={`relative border-2 rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-200 ease-in-out text-center backdrop-blur-sm
        ${isDragActive ? 'border-white bg-white/10' : 'border-white/50 bg-white/5 hover:border-white/80'}`} 
      onDragEnter={handleDragEnter} 
      onDragLeave={handleDragLeave} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept=".bin" 
        onChange={handleFileChange} 
      />
      <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
        <div className={`rounded-full p-4 sm:p-5 md:p-6 border-2 ${isDragActive ? 'border-white bg-white/10' : 'border-white/50'}`}>
          <UploadIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
        </div>
        <div>
          <p className="text-base sm:text-lg md:text-xl font-medium mb-2 text-white">
            {isDragActive ? 'Drop your file here' : 'Drag & drop your .bin file here'}
          </p>
          <p className="text-blue-100 mb-3 sm:mb-4">or</p>
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer py-2 sm:py-3 px-4 sm:px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 inline-block text-sm sm:text-base"
          >
            Browse files
          </label>
        </div>
        <p className="text-xs sm:text-sm text-blue-100">Only .bin files are supported</p>
      </div>
    </div>
  );
};

export default FileUploader;