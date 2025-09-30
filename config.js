// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000'
  },
  production: {
    baseURL: 'https://ps2s.onrender.com'
  }
};

// Get current environment
const environment = window.location.hostname === 'localhost' ? 'development' : 'production';

// Export API base URL
window.API_BASE_URL = API_CONFIG[environment].baseURL;