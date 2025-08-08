// API Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://fund-tracker-app.vercel.app'
  }
};

const environment = process.env.NODE_ENV || 'development';
const API_BASE_URL = config[environment].API_BASE_URL;

export default API_BASE_URL;
