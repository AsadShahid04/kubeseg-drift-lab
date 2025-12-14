import axios from 'axios';

/**
 * API Client Configuration
 * 
 * In development: Uses Vite proxy (empty baseURL)
 * In production: Uses environment variable or falls back to default backend URL
 */

// Get backend URL from environment variable or use default
const getBackendUrl = (): string => {
  // In development, Vite proxy handles routing
  if (import.meta.env.DEV) {
    return ''; // Empty string = use relative URLs (Vite proxy)
  }
  
  // In production, use environment variable or default
  // Set VITE_API_BASE_URL in your deployment environment
  return import.meta.env.VITE_API_BASE_URL || 'https://kubeseg-drift-lab.onrender.com';
};

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Export the backend URL for reference
export const API_BASE_URL = getBackendUrl();

export default apiClient;
