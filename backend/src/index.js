const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');


const app = express();
const PORT = 5000;

// Configure Elasticsearch Transport
const esTransportOpts = {
  level: 'info', // Log level
  clientOpts: { node: 'http://localhost:9200' }, // Elasticsearch URL
};
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(), // Log to console for debugging
    new ElasticsearchTransport(esTransportOpts), // Log to Elasticsearch
  ],
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow React
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directories
const uploadFolder = path.join(__dirname, '..', 'uploads');
const panoramaFolder = path.join(__dirname, '..', 'uploads', 'panoramas');

if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(panoramaFolder)) fs.mkdirSync(panoramaFolder);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route: Upload images
app.post('/upload-images', upload.array('images', 10), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      logger.warn('No images uploaded');
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    logger.info('Images uploaded successfully', { fileDetails: files });
    res.status(200).json({
      message: 'Images uploaded successfully!',
      fileDetails: files.map((file) => ({
        filename: file.filename,
        path: file.path,
      })),
    });
  } catch (err) {
    logger.error('Error uploading images', { error: err.message });
    res.status(500).json({ message: 'Error uploading images.', error: err.message });
  }
});

// Route: Create panorama
app.post('/create-panorama', (req, res) => {
  const scriptPath = path.join(__dirname, '..', '..', 'model', 'src', 'panorama_model.py');

  logger.info('Starting panorama creation', { scriptPath });

  const python = spawn('python3', [scriptPath, uploadFolder, panoramaFolder]);

  let result = '';
  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    logger.error('Error in Python script', { error: data.toString() });
  });

  python.on('close', (code) => {
    if (code !== 0) {
      logger.error('Python script exited with non-zero code', { code });
      return res.status(500).json({ message: 'Error in Python script.' });
    }

    const panoramaPath = result.trim();
    logger.info('Panorama created successfully', { panoramaPath });
    res.status(200).json({ panoramaUrl: `http://localhost:5000/uploads/panoramas/${path.basename(panoramaPath)}` });
  });
});

// Serve static files
app.use('/uploads', express.static(uploadFolder));

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
