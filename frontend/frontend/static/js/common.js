/**
 * Common functionality shared across pages
 */

// DOM Elements
const authLinksEl = document.getElementById('authLinks');
const profileLinkEl = document.getElementById('profileLink');
const alertContainerEl = document.getElementById('alertContainer');
const menuToggleEl = document.querySelector('.menu-toggle');
const navLinksEl = document.querySelector('.nav-links');

/**
 * Initialize common functionality across all pages
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication status and update UI
  await updateAuthUI();
  
  // Setup mobile menu toggle
  setupMobileMenu();
});

/**
 * Update UI based on authentication status
 */
async function updateAuthUI() {
  try {
    const isLoggedIn = await isAuthenticated();
    
    if (isLoggedIn) {
      // User is logged in
      if (authLinksEl) authLinksEl.classList.add('hidden');
      if (profileLinkEl) profileLinkEl.classList.remove('hidden');
      
      // Update CTA button in homepage if it exists
      const ctaAuthEl = document.getElementById('cta-auth');
      const ctaProfileEl = document.getElementById('cta-profile');
      
      if (ctaAuthEl && ctaProfileEl) {
        ctaAuthEl.classList.add('hidden');
        ctaProfileEl.classList.remove('hidden');
      }
    } else {
      // User is not logged in
      if (authLinksEl) authLinksEl.classList.remove('hidden');
      if (profileLinkEl) profileLinkEl.classList.add('hidden');
      
      // Check if we're on a protected page
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'profile.html') {
        // Redirect to login
        window.location.href = 'login.html?next=profile.html';
      }
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

/**
 * Setup mobile menu toggle functionality
 */
function setupMobileMenu() {
  if (menuToggleEl && navLinksEl) {
    menuToggleEl.addEventListener('click', () => {
      navLinksEl.classList.toggle('active');
    });
  }
}

/**
 * Show alert message to the user
 * @param {string} message - Alert message
 * @param {string} type - 'success' or 'error'
 * @param {number} duration - Duration in ms (0 for no auto-hide)
 */
function showAlert(message, type = 'success', duration = 5000) {
  if (!alertContainerEl) return;
  
  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  
  // Add to container
  alertContainerEl.appendChild(alertEl);
  
  // Animate entrance
  setTimeout(() => {
    alertEl.style.opacity = '1';
  }, 10);
  
  // Auto remove after duration (if not 0)
  if (duration > 0) {
    setTimeout(() => {
      alertEl.style.opacity = '0';
      setTimeout(() => {
        alertContainerEl.removeChild(alertEl);
      }, 300);
    }, duration);
  }
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.float = 'right';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.marginLeft = '10px';
  closeBtn.addEventListener('click', () => {
    alertEl.style.opacity = '0';
    setTimeout(() => {
      alertContainerEl.removeChild(alertEl);
    }, 300);
  });
  
  alertEl.prepend(closeBtn);
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element
 */
function showSpinner(container) {
  if (!container) return;
  
  container.classList.remove('hidden');
}

/**
 * Hide loading spinner
 * @param {HTMLElement} container - Container element
 */
function hideSpinner(container) {
  if (!container) return;
  
  container.classList.add('hidden');
}

/**
 * Parse URL query parameters
 * @returns {Object} - Object with query parameters
 */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Set min date for date inputs to today
 * @param {HTMLInputElement} dateInput - Date input element
 */
function setMinDateToday(dateInput) {
  if (!dateInput) return;
  
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();
  
  // Format with leading zeros
  month = month < 10 ? `0${month}` : month;
  day = day < 10 ? `0${day}` : day;
  
  const formattedDate = `${year}-${month}-${day}`;
  dateInput.min = formattedDate;
}