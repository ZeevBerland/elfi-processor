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
    
    // Minimize logging to reduce execution time
    console.log(`Received file: ${fileData.length || 'N/A'} bytes at ${new Date().toISOString()}`);

    // Check file size - prevent processing files that are too large for the serverless function
    if (fileData.length > 5 * 1024 * 1024) { // 5MB limit
      return res.status(413).json({
        success: false,
        error: 'File too large for serverless processing. Please use a file smaller than 5MB.',
        processingTime: Date.now() - startTime
      });
    }

    // Get filename from headers or generate one
    const filename = req.headers['x-filename'] || `file_${Date.now()}`;
    const baseFilename = filename.replace('.bin', '');
    
    // API Gateway endpoint URL
    const apiUrl = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process";
    
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
    
    try {
      // Optimized axios config with shorter timeout
      const axiosConfig = {
        headers: { 
          'Content-Type': 'application/octet-stream',
          'X-Filename': filename
        },
        timeout: 25000, // 25 seconds timeout to stay well within Vercel's limits
        responseType: 'json',
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxBodyLength: 10 * 1024 * 1024 // 10MB
      };
      
      console.log(`Sending to API at ${new Date().toISOString()}`);
      const response = await axios.post(apiUrl, dataToSend, axiosConfig);
      console.log(`API response received: status ${response.status}`);
      
      if (response.status !== 200) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      // Process the API response (minimal processing to save time)
      if (!response.data || !response.data.Results) {
        return res.status(500).json({
          success: false,
          error: 'Invalid response from API: Results field is missing',
          processingTime: Date.now() - startTime
        });
      }
      
      const results = response.data.Results;
      
      // Create CSV string efficiently - optimize for speed
      let csvString = 'Metric,Value\n';
      Object.entries(results).forEach(([metric, value]) => {
        csvString += `${metric},${value}\n`;
      });

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
      console.error(`API error: ${apiError.message}`);
      
      // Check if it's a timeout
      if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
        return res.status(408).json({
          success: false,
          error: 'The external API processing timed out. Please try a smaller file or try again later.',
          timeoutError: true,
          processingTime: Date.now() - startTime
        });
      }
      
      return res.status(502).json({
        success: false,
        error: `API request failed: ${apiError.message}`,
        processingTime: Date.now() - startTime
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    
    // Handle timeout errors specifically
    if (error.message && (error.message.includes('timeout') || error.code === 'ECONNABORTED')) {
      return res.status(408).json({
        success: false,
        error: 'The file processing timed out. The file may be too large or the service is temporarily busy.',
        timeoutError: true,
        processingTime: Date.now() - startTime
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the file',
      processingTime: Date.now() - startTime
    });
  }
} 