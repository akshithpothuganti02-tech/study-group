import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App.jsx';
import awsConfig from './aws-exports.js';
import './index.css';

// Configure Amplify with Cognito and S3 settings
Amplify.configure(awsConfig);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
