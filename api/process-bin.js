import axios from 'axios';

// Define the handler function that Vercel will call
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Filename');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Request started`);

  try {
    // Get binary data from request body
    const fileData = req.body;
    
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No binary data received' });
    }
    
    // Basic file data logging - don't log full byte array to avoid memory issues
    console.log(`Received file data type: ${typeof fileData}`);
    console.log(`File data is Buffer: ${Buffer.isBuffer(fileData)}`);
    console.log(`File data length: ${fileData.length || 'N/A'} bytes`);
    console.log(`Time to receive data: ${Date.now() - startTime}ms`);

    // Get filename from headers or generate one
    const filename = req.headers['x-filename'] || `file_${Date.now()}`;
    const baseFilename = filename.replace('.bin', '');
    
    // API Gateway endpoint URL
    const apiUrl = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process";

    console.log(`[${new Date().toISOString()}] Sending data to API: ${apiUrl}`);
    console.log(`File name: ${filename}`);
    
    // Ensure the data is a Buffer for binary transmission
    const dataToSend = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
    
    // Check if we actually have data to send
    if (!dataToSend || dataToSend.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty file or invalid data format',
        processingTime: Date.now() - startTime
      });
    }
    
    // For extreme efficiency, set up timeout but don't waste memory on race promises
    const apiStartTime = Date.now();
    
    try {
      const axiosConfig = {
        headers: { 
          'Content-Type': 'application/octet-stream',
          'X-Filename': filename
        },
        timeout: 45000, // 45 seconds timeout to leave buffer for response processing
        responseType: 'json',
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      };
      
      // Split the process - first send data to API
      console.log(`Starting API request at: ${new Date().toISOString()}`);
      const response = await axios.post(apiUrl, dataToSend, axiosConfig);
      
      console.log(`API response received after ${Date.now() - apiStartTime}ms`);
      console.log(`Response status: ${response.status}`);
      
      if (response.status !== 200) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      // Process the API response
      const processStartTime = Date.now();
      
      // Make sure we have a valid response with Results
      if (!response.data || !response.data.Results) {
        console.log('Invalid API response:', response.data);
        return res.status(500).json({
          success: false,
          error: 'Invalid response from API: Results field is missing',
          processingTime: Date.now() - startTime
        });
      }
      
      const results = response.data.Results;
      
      // Create CSV string efficiently
      let csvString = 'Metric,Value\n';
      for (const [metric, value] of Object.entries(results)) {
        csvString += `${metric},${value}\n`;
      }

      console.log(`CSV generation completed in ${Date.now() - processStartTime}ms`);
      console.log(`Total processing time: ${Date.now() - startTime}ms`);

      // Return success response with JSON data and CSV content
      return res.status(200).json({
        success: true,
        results: response.data,
        csvString: csvString,
        csvFileName: `${baseFilename}.csv`,
        processingTime: Date.now() - startTime
      });
    } catch (apiError) {
      // Handle API-specific errors
      console.error(`API error after ${Date.now() - apiStartTime}ms:`, apiError.message);
      return res.status(502).json({
        success: false,
        error: `API request failed: ${apiError.message}`,
        processingTime: Date.now() - startTime
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error after ${totalTime}ms:`, error.message);
    
    // Handle timeout errors specifically
    if (error.message && (error.message.includes('timeout') || error.code === 'ECONNABORTED')) {
      return res.status(408).json({
        success: false,
        error: 'The file processing timed out. The file may be too large or the service is temporarily busy.',
        timeoutError: true,
        processingTime: totalTime
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the file',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name,
      processingTime: totalTime
    });
  }
} 