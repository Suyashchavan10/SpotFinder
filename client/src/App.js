// src/components/App.js
import React, { useState, useEffect } from 'react';
import { fetchSampleData, uploadImages, createPanorama } from './services/api';
import './App.css';

const App = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [panorama, setPanorama] = useState(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages(files); // Show selected image names
  };

  const handleUploadImages = () => {
    const formData = new FormData();
    selectedImages.forEach((file) => formData.append('images', file));

    uploadImages(formData)
      .then((res) => {
        console.log('Images uploaded:', res.data);
        setImages(res.data.fileDetails); // Update the list of uploaded images
        alert('Images uploaded successfully!');
      })
      .catch((err) => {
        console.error('Error uploading images:', err);
        alert('Error uploading images.');
      });
  };

  const handleCreatePanorama = () => {
    createPanorama()
      .then((res) => {
        console.log('Panorama created:', res.data);
        setPanorama(res.data.panoramaUrl); // Get the panorama URL
      })
      .catch((err) => {
        console.error('Error creating panorama:', err);
        alert('Error creating panorama.');
      });
  };

  // Fetch sample data on component mount
  useEffect(() => {
    fetchSampleData()
      .then((res) => console.log('Sample data:', res.data))
      .catch((err) => console.error('Error fetching sample data:', err));
  }, []);

  return (
    <div className="App">
      <h1>Panorama Creation</h1>

      <div className="upload-section">
        <input
          type="file"
          multiple
          onChange={handleImageUpload}
          accept="image/*"
        />
        <button onClick={handleUploadImages}>Upload Images</button>
      </div>

      <div className="image-list">
        <h3>Selected Images:</h3>
        <ul>
          {selectedImages.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>
      </div>

      <button onClick={handleCreatePanorama} disabled={images.length < 2}>
        Create Panorama
      </button>

      {panorama && (
        <div className="panorama-section">
          <h3>Generated Panorama:</h3>
          <img
            src={panorama}
            alt="Panorama"
            className="panorama-image"
          />
        </div>
      )}
    </div>
  );
};

export default App;