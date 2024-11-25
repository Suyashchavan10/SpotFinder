const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());  // Middleware to parse JSON bodies

// Connect to MongoDB (If needed for storing input data)
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
//   .catch(err => console.log(err));

// Sample Route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Handle POST request to send text
app.post('/send-text', (req, res) => {
  const { text } = req.body;

  // Process the received text (e.g., store it in the database)
  console.log('Received text:', text);

  // Respond back with a message
  res.json({ message: `Received text: ${text}` });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
