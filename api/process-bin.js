import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use temp directory for Vercel environment
const getTempDir = () => {
  return os.tmpdir();
};

export default async function handler(req, res) {
  // Enable CORS
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
    // Get binary data from request body
    const fileData = req.body;
    
    if (!fileData || !fileData.length) {
      return res.status(400).json({ success: false, error: 'No binary data received' });
    }

    // Get filename from headers or generate one
    const filename = req.headers['x-filename'] || `file_${Date.now()}`;
    const baseFilename = path.basename(filename, '.bin');
    
    // API Gateway endpoint URL
    const apiUrl = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process";

    // Send binary data to the API
    const response = await axios.post(
      apiUrl,
      fileData,
      {
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: 60000, // 60 seconds timeout
        responseType: 'json'
      }
    );

    if (response.status !== 200) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const results = response.data.Results;
    
    // In Vercel's serverless environment, we cannot permanently save files locally
    // Instead, we'll return the CSV data directly to the client
    const csvData = Object.entries(results).map(([metric, value]) => ({
      metric,
      value
    }));

    // Create CSV string
    const csvString = 'Metric,Value\n' + 
      csvData.map(row => `${row.metric},${row.value}`).join('\n');

    // Return success response with JSON data and CSV content
    res.status(200).json({
      success: true,
      results: response.data,
      csvString: csvString,
      csvFileName: `${baseFilename}.csv`
    });
  } catch (error) {
    console.error('Error processing bin file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the file'
    });
  }
} 