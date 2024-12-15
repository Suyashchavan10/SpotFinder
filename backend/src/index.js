const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Configure Elasticsearch Transport
const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);


// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add readable timestamps
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/application.log', level: 'info' }), // Log all events
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors
  ],
});

// Middleware for request logging
app.use((req, res, next) => {
  req.requestId = uuidv4(); // Generate unique request ID
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  });
  next();
});

// Use morgan for HTTP request logging
app.use(morgan('combined', { stream: fs.createWriteStream('logs/http-access.log', { flags: 'a' }) }));




// Middleware
app.use(cors({ origin: '*' })); // Allow React
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directories
const uploadFolder = path.join(__dirname, '..', 'uploads');
const panoramaFolder = path.join(__dirname, '..', 'uploads', 'panoramas');
const pythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');


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

// Ping service
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Pong!' });
});

// Route: Upload images
app.post('/upload-images', upload.array('images', 10), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      logger.warn('No images uploaded', {
        requestId: req.requestId,
        route: '/upload-images',
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    logger.info('Images uploaded successfully', {
      requestId: req.requestId,
      route: '/upload-images',
      status: 200,
      fileDetails: files.map((file) => ({ filename: file.filename, path: file.path })),
    });
    res.status(200).json({
      message: 'Images uploaded successfully!',
      fileDetails: files.map((file) => ({
        filename: file.filename,
        path: file.path,
      })),
    });
  } catch (err) {
    logger.error('Error uploading images', {
      requestId: req.requestId,
      route: '/upload-images',
      error: err.message,
      status: 500,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ message: 'Error uploading images.', error: err.message });
  }
});

// Route: Create panorama
app.post('/create-panorama', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'model', 'src', 'panorama_model.py');

  logger.info('Starting panorama creation', {
    requestId: req.requestId,
    route: '/create-panorama',
    timestamp: new Date().toISOString(),
  });

  const python = spawn(pythonPath, [scriptPath, uploadFolder, panoramaFolder]);

  let result = '';
  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    logger.error('Error in Python script', {
      requestId: req.requestId,
      route: '/create-panorama',
      error: data.toString(),
      timestamp: new Date().toISOString(),
    });
  });

  python.on('close', (code) => {
    if (code !== 0) {
      logger.error('Python script exited with non-zero code', {
        requestId: req.requestId,
        route: '/create-panorama',
        exitCode: code,
        timestamp: new Date().toISOString(),
      });
      return res.status(500).json({ message: 'Error in Python script.' });
    }

    const panoramaPath = result.trim();
    logger.info('Panorama created successfully', {
      requestId: req.requestId,
      route: '/create-panorama',
      panoramaPath,
      status: 200,
      timestamp: new Date().toISOString(),
    });
    res.status(200).json({
      panoramaUrl: `http://192.168.49.2:30001/uploads/panoramas/${path.basename(panoramaPath)}`,
    });
  });
});

// Serve static files
app.use('/uploads', express.static(uploadFolder));

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
