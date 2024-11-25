import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchSampleData } from './services/api';

const App = () => {
  // State to store the input text
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Handle input change
  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // Handle button click - send input text to backend
  const handleButtonClick = () => {
    axios
      .post('http://localhost:5000/send-text', { text: inputText })  // Send input text to backend
      .then((res) => {
        if (res.data) {
          setResponse(res.data);  // Update response state with the backend response
          console.log('Response from backend:', res.data);
        } else {
          setError('Received an empty response from the backend.');
        }
      })
      .catch((err) => {
        setError('Error sending text to backend: ' + err.message);
        console.error('Error sending text to backend:', err);
      });
  };

  // Handle fetching sample data (optional)
  useEffect(() => {
    fetchSampleData()
      .then((response) => {
        console.log('Sample data fetched:', response.data);
      })
      .catch((err) => {
        setError('Error fetching sample data: ' + err.message);
        console.error('Error fetching sample data:', err);
      });
  }, []);

  return (
    <div>
      <h1>React Frontend</h1>
      {/* Text Input */}
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter some text"
      />
      {/* Button to send text to backend */}
      <button onClick={handleButtonClick}>Send Text</button>

      {/* Display the response from the backend */}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {response && (
        <div>
          <h3>Response from Backend:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
