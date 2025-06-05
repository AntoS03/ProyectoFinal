/**
 * Best Booking API Client
 * Handles all API calls to the backend
 */

const API_BASE = '/api';

/**
 * Generic GET request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<Response>} - Fetch response
 */
async function apiGet(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      credentials: 'include' 
    });
    return response;
  } catch (error) {
    console.error('API GET Error:', error);
    throw error;
  }
}

/**
 * Generic POST request to the API
 * @param {string} path - API endpoint path
 * @param {Object} data - JSON data to send
 * @returns {Promise<Response>} - Fetch response
 */
async function apiPost(path, data) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
}

/**
 * Generic PUT request to the API
 * @param {string} path - API endpoint path
 * @param {Object} data - JSON data to send
 * @returns {Promise<Response>} - Fetch response
 */
async function apiPut(path, data) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('API PUT Error:', error);
    throw error;
  }
}

/**
 * Generic DELETE request to the API
 * @param {string} path - API endpoint path
 * @returns {Promise<Response>} - Fetch response
 */
async function apiDelete(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    });
    return response;
  } catch (error) {
    console.error('API DELETE Error:', error);
    throw error;
  }
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>} - True if logged in
 */
async function checkAuth() {
  try {
    const response = await apiGet('/reservas');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Show alert message
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, error, warning)
 */
function showAlert(message, type = 'success') {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (alert.parentNode === alertContainer) {
      alertContainer.removeChild(alert);
    }
  }, 5000);
}

/**
 * Show loading spinner
 * @param {string} elementId - ID of element to show spinner in
 * @param {boolean} isDark - Use dark spinner
 */
function showSpinner(elementId, isDark = false) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const spinner = document.createElement('div');
  spinner.className = isDark ? 'spinner spinner-dark' : 'spinner';
  spinner.id = `${elementId}-spinner`;

  element.appendChild(spinner);
}

/**
 * Hide loading spinner
 * @param {string} elementId - ID of element with spinner
 */
function hideSpinner(elementId) {
  const spinner = document.getElementById(`${elementId}-spinner`);
  if (spinner && spinner.parentNode) {
    spinner.parentNode.removeChild(spinner);
  }
}

/**
 * Format date from ISO to DD/MM/YYYY
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES');
}

/**
 * Format price with euro symbol
 * @param {number} price - Price value
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  return `€ ${price.toFixed(2)}`;
}

/**
 * Update navigation based on authentication status
 */
async function updateNavigation() {
  const isLoggedIn = await checkAuth();
  const authLinks = document.getElementById('authLinks');
  
  if (!authLinks) return;
  
  if (isLoggedIn) {
    authLinks.innerHTML = `
      <li><a href="profile.html">Mi Perfil</a></li>
    `;
  } else {
    authLinks.innerHTML = `
      <li><a href="login.html">Iniciar Sesión</a></li>
      <li><a href="register.html">Registrarse</a></li>
    `;
  }
}