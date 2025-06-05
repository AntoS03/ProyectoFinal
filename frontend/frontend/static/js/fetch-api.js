/**
 * API utility functions for making requests to the backend
 */

const API_BASE = 'http://localhost:5000';

/**
 * Make a GET request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<Response>} - Fetch response
 */
async function apiGet(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    return response;
  } catch (error) {
    console.error('Error in apiGet:', error);
    throw error;
  }
}

/**
 * Make a POST request to the API
 * @param {string} path - API endpoint path
 * @param {object} data - Request body data
 * @returns {Promise<Response>} - Fetch response
 */
async function apiPost(path, data) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error in apiPost:', error);
    throw error;
  }
}

/**
 * Make a PUT request to the API
 * @param {string} path - API endpoint path
 * @param {object} data - Request body data
 * @returns {Promise<Response>} - Fetch response
 */
async function apiPut(path, data) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error in apiPut:', error);
    throw error;
  }
}

/**
 * Make a DELETE request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<Response>} - Fetch response
 */
async function apiDelete(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    return response;
  } catch (error) {
    console.error('Error in apiDelete:', error);
    throw error;
  }
}

/**
 * Format a date string to local format (DD/MM/YYYY)
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
}

/**
 * Format price to currency format
 * @param {number} price - Price value
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  return `€ ${parseFloat(price).toFixed(2)}`;
}

/**
 * Cache for alojamientos data to avoid repeated requests
 */
const alojamientosCache = new Map();

/**
 * Get alojamiento details, using cache if available
 * @param {string|number} id - Alojamiento ID
 * @returns {Promise<object>} - Alojamiento data
 */
async function getAlojamientoDetails(id) {
  // Check cache first
  if (alojamientosCache.has(id)) {
    return alojamientosCache.get(id);
  }
  
  // Not in cache, fetch from API
  try {
    const response = await apiGet(`/alojamientos/${id}`);
    if (response.ok) {
      const data = await response.json();
      // Store in cache
      alojamientosCache.set(id, data);
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching alojamiento ${id}:`, error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - True if authenticated
 */
async function isAuthenticated() {
  try {
    // Try to get reservas - requires authentication
    const response = await apiGet('/reservas');
    return response.ok;
  } catch (error) {
    return false;
  }
}