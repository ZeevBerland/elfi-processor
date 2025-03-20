import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  uploadState: 'idle' | 'dragging' | 'processing' | 'success' | 'error';
  setUploadState: (state: 'idle' | 'dragging' | 'processing' | 'success' | 'error') => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, uploadState, setUploadState }) => {
  const [fileError, setFileError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState('dragging');
  }, [setUploadState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState('idle');
  }, [setUploadState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    if (!file.name.endsWith('.bin')) {
      setFileError('Please upload a .bin file');
      return false;
    }
    
    if (file.size === 0) {
      setFileError('File is empty');
      return false;
    }
    
    // Clear previous errors
    setFileError(null);
    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState('idle');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      console.log('File dropped:', file.name);
      
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  }, [onFileUpload, setUploadState, validateFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name);
      
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  }, [onFileUpload, validateFile]);

  return (
    <div 
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 
        ${uploadState === 'dragging' 
          ? 'border-blue-300 bg-blue-50/10' 
          : 'border-blue-200/50 hover:border-blue-300/70'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center">
          <Upload size={30} className="text-blue-100" />
        </div>
        
        <div className="text-center">
          <h3 className="text-xl text-white font-medium">Upload .bin file</h3>
          <p className="mt-1 text-blue-100/80 text-sm">
            Drag and drop your file here, or click to browse
          </p>
        </div>
        
        {fileError && (
          <div className="flex items-center text-red-300 bg-red-500/10 px-3 py-2 rounded text-sm">
            <AlertCircle size={16} className="mr-2" />
            {fileError}
          </div>
        )}
        
        <label className="mt-2 cursor-pointer bg-blue-600 hover:bg-blue-700 transition-colors text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium">
          Browse Files
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileInputChange} 
            accept=".bin"
          />
        </label>
      </div>
    </div>
  );
};

export default FileUploader;