import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from "axios";

// Force a global baseline override across the entire memory space of your React build
axios.defaults.baseURL = "https://stock-analyser-backend-iahq.onrender.com/api";
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);