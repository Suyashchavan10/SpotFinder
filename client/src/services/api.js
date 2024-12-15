// api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://192.168.49.2:30001' });

export const fetchSampleData = () => API.get('/');
export const uploadImages = (formData) => API.post('/upload-images', formData);
export const createPanorama = () => API.post('/create-panorama');