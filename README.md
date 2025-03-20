# Elfi Processor

A web application for processing binary (.bin) files through an API and converting the results to CSV format.

## Features

- Upload and process .bin files
- Display processing results in a clean UI
- Download CSV files of the processing results
- Server-side processing with automatic CSV generation

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/elfi-processor.git
   cd elfi-processor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. In a separate terminal, start the backend server:
   ```
   npm run server
   ```

5. Access the application at `http://localhost:5173`

## Usage

1. Navigate to the web application
2. Drag and drop a .bin file onto the upload area, or click "Browse files" to select one
3. Wait for the file to be processed
4. Upon successful processing, the application will:
   - Display the metrics from the processed file
   - Provide a download link for the CSV file
5. Click "Download" to get the CSV file
6. To process another file, click "Process Another File"

## Production Deployment

To build and run the application for production:

```
npm run start
```

This will build the frontend application and start the server in production mode.

## API Reference

The application uses an API endpoint at `https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process` to process the binary files.

The server acts as a proxy, handling the following:
- Receiving the binary file from the client
- Sending it to the processing API
- Saving the results to a CSV file
- Serving the CSV file to the client for download

## Technology Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- API Integration: Axios

## License

[MIT License](LICENSE)
