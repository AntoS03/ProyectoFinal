/**
 * Index page functionality
 */

// DOM Elements
const featuredContainer = document.getElementById('featuredAlojamientos');

/**
 * Initialize index page
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Fetch featured alojamientos for the homepage
  await loadFeaturedAlojamientos();
});

/**
 * Load featured alojamientos
 */
async function loadFeaturedAlojamientos() {
  if (!featuredContainer) return;
  
  try {
    // Fetch a few alojamientos to feature
    const response = await apiGet('/alojamientos?precioMax=1000');
    
    if (response.ok) {
      const alojamientos = await response.json();
      
      // Clear skeletons
      featuredContainer.innerHTML = '';
      
      // If no alojamientos were found
      if (alojamientos.length === 0) {
        featuredContainer.innerHTML = `
          <div class="no-results">
            <i class="fas fa-home"></i>
            <p>No hay alojamientos disponibles en este momento.</p>
          </div>
        `;
        return;
      }
      
      // Display up to 3 featured alojamientos
      const featuredItems = alojamientos.slice(0, 3);
      
      featuredItems.forEach(alojamiento => {
        const card = createAlojamientoCard(alojamiento);
        featuredContainer.appendChild(card);
      });
    } else {
      // Handle error
      console.error('Error fetching alojamientos:', response.status);
      featuredContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error al cargar alojamientos. Inténtalo de nuevo más tarde.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error in loadFeaturedAlojamientos:', error);
    featuredContainer.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-circle"></i>
        <p>Error al cargar alojamientos. Inténtalo de nuevo más tarde.</p>
      </div>
    `;
  }
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