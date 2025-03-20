import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import ProgressIndicator from './components/ProgressIndicator';
import SuccessMessage from './components/SuccessMessage';
import ErrorMessage from './components/ErrorMessage';
import ValuesDisplay from './components/ValuesDisplay';

// Define TypeScript types
interface ApiResults {
  [key: string]: number;
}

interface ApiResponse {
  Results: ApiResults;
  Ranges: {
    [key: string]: {
      MinVal: number;
      MaxVal: number;
    };
  };
}

export function App() {
  const [uploadState, setUploadState] = useState<'idle' | 'dragging' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [apiResults, setApiResults] = useState<ApiResults | null>(null);
  const [csvData, setCsvData] = useState<{
    csvString: string;
    csvFileName: string;
  } | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.bin')) {
      setErrorMessage('Please upload a .bin file');
      setUploadState('error');
      return;
    }

    setFileName(file.name);
    setUploadState('processing');
    
    try {
      // Use the API endpoint
      const serverUrl = '/api/process-bin';
      
      // Send the file to our API
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': file.name
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }
      
      // Set the results and CSV data
      setApiResults(data.results.Results);
      setCsvData({
        csvString: data.csvString,
        csvFileName: data.csvFileName
      });
      
      setUploadState('success');
    } catch (error) {
      console.error('Error processing file:', error);
      setErrorMessage(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadState('error');
    }
  };

  const resetUpload = () => {
    setUploadState('idle');
    setFileName('');
    setErrorMessage('');
    setApiResults(null);
    setCsvData(null);
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-900 to-blue-600 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 relative overflow-x-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-blue-400/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-7xl px-2 sm:px-4 md:px-6 relative">
        <header className="text-center mb-4 sm:mb-6 md:mb-8">
          <img src="/ElfiTech_logo.png" alt="ÆLFITECH" className="h-8 sm:h-10 md:h-12 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">File Processor</h1>
          <p className="text-sm sm:text-base md:text-lg text-blue-100 mt-2">
            Upload a .bin file to convert it to CSV format
          </p>
        </header>

        <div className="w-full max-w-lg mx-auto mb-6 sm:mb-8 md:mb-12">
          {uploadState === 'idle' || uploadState === 'dragging' ? 
            <FileUploader 
              onFileUpload={handleFileUpload} 
              uploadState={uploadState} 
              setUploadState={setUploadState} 
            /> : uploadState === 'processing' ? 
            <ProgressIndicator fileName={fileName} /> : uploadState === 'success' ? 
            <SuccessMessage fileName={fileName} onReset={resetUpload} csvData={csvData} /> : 
            <ErrorMessage message={errorMessage} onReset={resetUpload} />
          }
        </div>
        
        {apiResults && (
          <div className="w-full overflow-x-auto pb-6">
            <ValuesDisplay metrics={apiResults} />
          </div>
        )}
      </div>
    </main>
  );
}