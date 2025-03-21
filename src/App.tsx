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

// Maximum file size (5MB in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function App() {
  const [uploadState, setUploadState] = useState<'idle' | 'dragging' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [apiResults, setApiResults] = useState<ApiResults | null>(null);
  const [csvData, setCsvData] = useState<{
    csvString: string;
    csvFileName: string;
  } | null>(null);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [isSizeError, setIsSizeError] = useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.bin')) {
      setErrorMessage('Please upload a .bin file');
      setUploadState('error');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Processing file: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Check if file size exceeds the limit
    if (file.size > MAX_FILE_SIZE) {
      setIsSizeError(true);
      setErrorMessage(`File too large (${fileSizeMB.toFixed(2)}MB). Please use a file smaller than 5MB for serverless processing.`);
      setUploadState('error');
      return;
    }
    
    setFileName(file.name);
    setUploadState('processing');
    setIsTimeout(false);
    setProcessingTime(null);
    setIsSizeError(false);
    
    const processingStartTime = Date.now();
    
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      console.log(`File read complete. Sending to API at ${new Date().toISOString()}`);
      
      // Use the API endpoint
      const serverUrl = '/api/process-bin';
      
      // Create AbortController to handle timeouts on our end
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 second client-side timeout (shorter than serverless function)
      
      try {
        // Send the binary data to our API
        const response = await fetch(serverUrl, {
          method: 'POST',
          body: fileData,
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': file.name
          },
          signal: controller.signal
        });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        const totalTime = Date.now() - processingStartTime;
        console.log(`Response received after ${totalTime}ms with status: ${response.status}`);
        
        if (!response.ok) {
          // Handle error response
          let errorMsg = `Server request failed with status: ${response.status}`;
          setProcessingTime(totalTime);
          
          // Check for specific error codes
          if (response.status === 413) {
            setIsSizeError(true);
          }
          
          // Only try to read the body once using a safe approach
          try {
            // Clone the response before reading it
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            
            try {
              // Try to parse as JSON
              const errorData = JSON.parse(responseText);
              console.error('Server response error:', response.status, errorData);
              
              if (errorData && errorData.processingTime) {
                setProcessingTime(errorData.processingTime);
              }
              
              // Check for timeout error
              if (response.status === 408 || (errorData && errorData.timeoutError)) {
                setIsTimeout(true);
                errorMsg = errorData.error || 'Processing timed out';
              } else {
                errorMsg = errorData.error || `Server request failed with status: ${response.status}`;
              }
            } catch (parseError) {
              // Not valid JSON, use text directly
              console.error('Server response error (text):', responseText);
              errorMsg = responseText || `Server request failed with status: ${response.status}`;
            }
          } catch (bodyError) {
            console.error('Failed to read response body:', bodyError);
          }
          
          throw new Error(errorMsg);
        }
        
        // Handle successful response
        try {
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          
          try {
            const data = JSON.parse(responseText);
            console.log(`API processing completed in ${data.processingTime || 'unknown'}ms`);
            
            if (data.processingTime) {
              setProcessingTime(data.processingTime);
            }
            
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
          } catch (parseError) {
            throw new Error('Invalid response format');
          }
        } catch (bodyError) {
          console.error('Failed to read response body:', bodyError);
          throw new Error('Failed to read response');
        }
      } catch (fetchError: unknown) {
        // This catches abort errors from our controller
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setIsTimeout(true);
          throw new Error('Request timed out after 28 seconds');
        }
        throw fetchError;
      }
    } catch (error) {
      const totalTime = Date.now() - processingStartTime;
      console.error(`Error after ${totalTime}ms:`, error);
      
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for specific error types
      if (errorMsg.includes('FUNCTION_INVOCATION_TIMEOUT')) {
        setIsTimeout(true);
        errorMsg = 'The file processing exceeded the serverless function time limit. Please use a smaller file.';
      } else if (isTimeout || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        setIsTimeout(true);
        errorMsg = 'The file processing timed out. The file may be too large or the service is temporarily busy. Please try again with a smaller file or try later.';
      }
      
      setErrorMessage(`Error processing file: ${errorMsg}`);
      setUploadState('error');
    }
  };

  const resetUpload = () => {
    setUploadState('idle');
    setFileName('');
    setErrorMessage('');
    setApiResults(null);
    setCsvData(null);
    setIsTimeout(false);
    setProcessingTime(null);
    setIsSizeError(false);
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
          <p className="text-xs text-blue-200 mt-1">
            File size limit: 5MB for serverless processing
          </p>
        </header>

        <div className="w-full max-w-lg mx-auto mb-6 sm:mb-8 md:mb-12">
          {uploadState === 'idle' || uploadState === 'dragging' ? 
            <FileUploader 
              onFileUpload={handleFileUpload} 
              uploadState={uploadState} 
              setUploadState={setUploadState} 
              maxFileSize={MAX_FILE_SIZE}
            /> : uploadState === 'processing' ? 
            <ProgressIndicator fileName={fileName} /> : uploadState === 'success' ? 
            <SuccessMessage 
              fileName={fileName} 
              onReset={resetUpload} 
              csvData={csvData}
              processingTime={processingTime} 
            /> : 
            <ErrorMessage 
              message={errorMessage} 
              onReset={resetUpload} 
              isTimeout={isTimeout}
              isSizeError={isSizeError}
              processingTime={processingTime} 
            />
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