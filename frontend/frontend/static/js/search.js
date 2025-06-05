/**
 * Search page functionality
 */

// DOM Elements
const searchForm = document.getElementById('searchForm');
const ciudadInput = document.getElementById('ciudadInput');
const precioInput = document.getElementById('precioInput');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResults = document.getElementById('noResults');

/**
 * Initialize search page
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Set up search form submission
  setupSearchForm();
  
  // Load all alojamientos on page load (no filters)
  await loadAlojamientos();
  
  // Check if there are any stored filters from previous searches
  restoreFilters();
});

/**
 * Set up search form event listener
 */
function setupSearchForm() {
  if (!searchForm) return;
  
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (precioInput.value && parseFloat(precioInput.value) < 0) {
      showAlert('Introduce un número válido para el precio máximo', 'error');
      precioInput.classList.add('error');
      return;
    }
    
    // Remove error state if previously set
    precioInput.classList.remove('error');
    
    // Save filters to localStorage
    saveFilters();
    
    // Load results with filters
    await loadAlojamientos();
  });
}

/**
 * Save current filters to localStorage
 */
function saveFilters() {
  if (ciudadInput && precioInput) {
    const filters = {
      ciudad: ciudadInput.value.trim(),
      precioMax: precioInput.value.trim()
    };
    
    localStorage.setItem('search_filters', JSON.stringify(filters));
  }
}

/**
 * Restore filters from localStorage
 */
function restoreFilters() {
  const savedFilters = localStorage.getItem('search_filters');
  
  if (savedFilters && ciudadInput && precioInput) {
    try {
      const filters = JSON.parse(savedFilters);
      
      if (filters.ciudad) ciudadInput.value = filters.ciudad;
      if (filters.precioMax) precioInput.value = filters.precioMax;
    } catch (error) {
      console.error('Error parsing saved filters:', error);
    }
  }
}

/**
 * Load alojamientos with optional filters
 */
async function loadAlojamientos() {
  if (!resultsContainer || !loadingIndicator || !noResults) return;
  
  try {
    // Show loading indicator
    showSpinner(loadingIndicator);
    resultsContainer.classList.add('hidden');
    noResults.classList.add('hidden');
    
    // Build query parameters
    const ciudad = ciudadInput ? ciudadInput.value.trim() : '';
    const precioMax = precioInput ? precioInput.value.trim() : '';
    
    let query = '/alojamientos';
    const params = [];
    
    if (ciudad) {
      params.push(`ciudad=${encodeURIComponent(ciudad)}`);
    }
    
    if (precioMax) {
      params.push(`precioMax=${encodeURIComponent(precioMax)}`);
    }
    
    if (params.length > 0) {
      query += `?${params.join('&')}`;
    }
    
    // Fetch alojamientos
    const response = await apiGet(query);
    
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    
    if (response.ok) {
      const alojamientos = await response.json();
      
      if (alojamientos.length === 0) {
        // No results found
        resultsContainer.classList.add('hidden');
        noResults.classList.remove('hidden');
      } else {
        // Render results
        renderResults(alojamientos);
        resultsContainer.classList.remove('hidden');
      }
    } else {
      // Handle error
      showAlert('Error al cargar alojamientos. Inténtalo de nuevo.', 'error');
      console.error('Error response:', response.status);
    }
  } catch (error) {
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    
    // Show error
    showAlert('Error al cargar alojamientos. Inténtalo de nuevo.', 'error');
    console.error('Error in loadAlojamientos:', error);
  }
}

/**
 * Render alojamientos results
 * @param {Array} alojamientos - List of alojamientos to render
 */
function renderResults(alojamientos) {
  if (!resultsContainer) return;
  
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Create and append card for each alojamiento
  alojamientos.forEach(alojamiento => {
    const card = createAlojamientoCard(alojamiento);
    resultsContainer.appendChild(card);
  });
}

/**
 * Create an alojamiento card element
 * @param {object} alojamiento - Alojamiento data
 * @returns {HTMLElement} - Card element
 */
function createAlojamientoCard(alojamiento) {
  const card = document.createElement('div');
  card.className = 'card';
  
  // Use placeholder image if no image is available
  const imageSrc = alojamiento.imagen_principal_ruta || 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  
  card.innerHTML = `
    <div class="card-img">
      <img src="${imageSrc}" alt="Imagen de ${alojamiento.nombre}" loading="lazy">
    </div>
    <div class="card-body">
      <h3 class="card-title">${alojamiento.nombre}</h3>
      <p class="card-location">
        <i class="fas fa-map-marker-alt"></i> ${alojamiento.ciudad}
      </p>
      <p class="card-price">${formatPrice(alojamiento.precio_noche)} / noche</p>
      <p class="card-description">${truncateDescription(alojamiento.descripcion, 100)}</p>
    </div>
    <div class="card-footer">
      <a href="detail.html?id=${alojamiento.id}" class="btn btn-primary btn-block">
        Ver detalles
      </a>
    </div>
  `;
  
  return card;
}

/**
 * Truncate description to a specific length
 * @param {string} description - Description text
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated description
 */
function truncateDescription(description, maxLength) {
  if (!description) return '';
  
  if (description.length <= maxLength) {
    return description;
  }
  
  return description.substring(0, maxLength) + '...';
}