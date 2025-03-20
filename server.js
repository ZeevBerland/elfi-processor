import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createObjectCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the React app
app.use(cors());

// For parsing application/json
app.use(express.json());

// For parsing binary files - increase limit as binary files might be large
app.use(express.raw({
  type: 'application/octet-stream',
  limit: '10mb'
}));

// Serve the static React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Endpoint to process bin files
app.post('/api/process-bin', async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ error: 'No binary data received' });
    }

    // Directory to save CSV files
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get file name from request headers or generate one
    const filename = req.headers['x-filename'] || `file_${Date.now()}`;
    const baseFilename = path.basename(filename, '.bin');
    const outputCsvPath = path.join(outputDir, `${baseFilename}.csv`);

    // API Gateway endpoint URL (from the test file)
    const apiUrl = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process";

    // Send binary data to the API
    const response = await axios.post(
      apiUrl,
      req.body,
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

    // Save Results to CSV file
    const csvWriter = createObjectCsvWriter({
      path: outputCsvPath,
      header: [
        { id: 'metric', title: 'Metric' },
        { id: 'value', title: 'Value' }
      ]
    });

    const csvData = Object.entries(results).map(([metric, value]) => ({
      metric,
      value
    }));

    await csvWriter.writeRecords(csvData);

    // Return success response with JSON data and CSV file path
    res.json({
      success: true,
      results: response.data,
      csvPath: `/output/${baseFilename}.csv`
    });
  } catch (error) {
    console.error('Error processing bin file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the file'
    });
  }
});

// Get the CSV file
app.get('/output/:filename', (req, res) => {
  const filepath = path.join(__dirname, 'output', req.params.filename);
  if (fs.existsSync(filepath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.filename}`);
    fs.createReadStream(filepath).pipe(res);
  } else {
    res.status(404).send('File not found');
  }
});

// Catch-all to serve the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 