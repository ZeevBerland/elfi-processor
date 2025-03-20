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

  try {
    // Log the request headers for debugging
    console.log('Request headers:', req.headers);
    
    // Get binary data from request body
    const fileData = req.body;
    
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No binary data received' });
    }
    
    console.log('Received file data type:', typeof fileData);
    console.log('File data is Buffer?', Buffer.isBuffer(fileData));
    console.log('File data length:', fileData.length || 'N/A');

    // Log first few bytes for debugging (if it's a buffer)
    if (Buffer.isBuffer(fileData) && fileData.length > 0) {
      console.log('First 20 bytes:', fileData.slice(0, 20).toString('hex'));
    }

    // Get filename from headers or generate one
    const filename = req.headers['x-filename'] || `file_${Date.now()}`;
    const baseFilename = filename.replace('.bin', '');
    
    // API Gateway endpoint URL
    const apiUrl = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process";

    console.log('Sending data to API:', apiUrl);
    console.log('File name:', filename);
    
    // Ensure we're sending the data in the correct format
    const dataToSend = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
    
    // Send binary data to the API
    const response = await axios.post(
      apiUrl,
      dataToSend,
      {
        headers: { 
          'Content-Type': 'application/octet-stream',
          'X-Filename': filename
        },
        timeout: 60000, // 60 seconds timeout
        responseType: 'json'
      }
    );

    console.log('API response status:', response.status);
    console.log('API response headers:', response.headers);
    
    if (response.status !== 200) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const results = response.data.Results;
    
    if (!results) {
      console.log('Full API response:', response.data);
      throw new Error('Invalid response from API: Results field is missing');
    }
    
    // Create CSV data
    const csvData = Object.entries(results).map(([metric, value]) => ({
      metric,
      value
    }));

    // Create CSV string
    const csvString = 'Metric,Value\n' + 
      csvData.map(row => `${row.metric},${row.value}`).join('\n');

    // Return success response with JSON data and CSV content
    return res.status(200).json({
      success: true,
      results: response.data,
      csvString: csvString,
      csvFileName: `${baseFilename}.csv`
    });
  } catch (error) {
    console.error('Error processing bin file:', error);
    // Return more detailed error information
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the file',
      stack: error.stack,
      name: error.name
    });
  }
} 