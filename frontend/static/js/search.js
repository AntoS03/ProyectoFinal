/**
 * Search page script
 * Handles property search and filtering
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication and update navigation
  await updateNavigation();

  // Load all properties on page load
  loadAlojamientos();

  // Setup search form submission
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadAlojamientos();
    });
  }

  // Setup mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Set active navigation item
  setActiveNavItem();

  // Restore previous search if available
  restorePreviousSearch();
});

/**
 * Load properties with optional filters
 */
async function loadAlojamientos() {
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;

  const ciudad = document.getElementById('ciudadInput')?.value.trim() || '';
  const precioMax = document.getElementById('precioInput')?.value.trim() || '';

  // Save search to localStorage
  localStorage.setItem('lastSearch', JSON.stringify({ ciudad, precioMax }));

  showSpinner('searchResults', true);
  resultsContainer.innerHTML = '';

  let query = `/alojamientos/`;
  const params = [];

  if (ciudad) {
    params.push(`ciudad=${encodeURIComponent(ciudad)}`);
  }
  
  if (precioMax) {
    params.push(`precioMax=${precioMax}`);
  }

  if (params.length > 0) {
    query += `?${params.join('&')}`;
  }

  try {
    const response = await apiGet(query);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.length === 0) {
        resultsContainer.innerHTML = `
          <div class="alert alert-warning">
            No se encontraron alojamientos para estos criterios.
          </div>
        `;
        return;
      }
      
      renderResults(data);
    } else {
      showAlert('Error al cargar alojamientos, inténtalo de nuevo.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error al cargar alojamientos, inténtalo de nuevo.', 'error');
  } finally {
    hideSpinner('searchResults');
  }
}

/**
 * Render search results
 * @param {Array} alojamientos - Array of property objects
 */
function renderResults(alojamientos) {
  const container = document.getElementById('searchResults');
  if (!container) return;

  const resultsHTML = alojamientos.map(alojamiento => {
    // Truncate description to 100 characters if exists
    const description = alojamiento.descripcion 
      ? `<p class="card-text">${alojamiento.descripcion.substring(0, 100)}${alojamiento.descripcion.length > 100 ? '...' : ''}</p>` 
      : '';

    return `
      <div class="col col-sm-6 col-md-4">
        <div class="card">
          <div class="card-img">
            <img src="${alojamiento.imagen_principal_ruta || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}" 
                 alt="Imagen de ${alojamiento.nombre}" />
          </div>
          <div class="card-body">
            <h3 class="card-title">${alojamiento.nombre}</h3>
            <div class="card-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${alojamiento.ciudad}
            </div>
            <div class="card-price">${formatPrice(alojamiento.precio_noche)} / noche</div>
            ${description}
            <div class="card-footer">
              <a href="detail.html?id=${alojamiento.id}" class="btn btn-block">Ver detalles</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="row">
      ${resultsHTML}
    </div>
  `;
}

/**
 * Restore previous search from localStorage
 */
function restorePreviousSearch() {
  const savedSearch = localStorage.getItem('lastSearch');
  if (!savedSearch) return;

  try {
    const { ciudad, precioMax } = JSON.parse(savedSearch);
    
    const ciudadInput = document.getElementById('ciudadInput');
    const precioInput = document.getElementById('precioInput');
    
    if (ciudadInput && ciudad) {
      ciudadInput.value = ciudad;
    }
    
    if (precioInput && precioMax) {
      precioInput.value = precioMax;
    }
  } catch (e) {
    console.error('Error restoring previous search:', e);
  }
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'search.html') {
      link.classList.add('active');
    }
  });
}