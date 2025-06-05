/**
 * Index page script
 * Handles landing page functionality
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication and update navigation
  await updateNavigation();

  // Load featured properties
  loadFeaturedProperties();

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
});

/**
 * Load featured properties
 */
async function loadFeaturedProperties() {
  const featuredContainer = document.getElementById('featuredProperties');
  if (!featuredContainer) return;

  showSpinner('featuredProperties', true);

  try {
    // Get first 3 properties, regardless of price
    const response = await apiGet('/alojamientos');
    
    if (response.ok) {
      const data = await response.json();
      const featured = data.slice(0, 3); // Get first 3 properties
      
      if (featured.length === 0) {
        featuredContainer.innerHTML = '<p class="text-center">No hay alojamientos destacados disponibles.</p>';
        return;
      }
      
      renderFeaturedProperties(featured);
    } else {
      console.error('Error loading featured properties:', await response.text());
      featuredContainer.innerHTML = '<p class="text-center">Error al cargar alojamientos destacados.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    featuredContainer.innerHTML = '<p class="text-center">Error al cargar alojamientos destacados.</p>';
  } finally {
    hideSpinner('featuredProperties');
  }
}

/**
 * Render featured properties
 * @param {Array} properties - Array of property objects
 */
function renderFeaturedProperties(properties) {
  const container = document.getElementById('featuredProperties');
  if (!container) return;

  const propertiesHTML = properties.map(property => `
    <div class="col col-md-4">
      <div class="card">
        <div class="card-img">
          <img src="${property.imagen_principal_ruta || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}" 
               alt="Imagen de ${property.nombre}" />
        </div>
        <div class="card-body">
          <h3 class="card-title">${property.nombre}</h3>
          <div class="card-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${property.ciudad}
          </div>
          <div class="card-price">${formatPrice(property.precio_noche)} / noche</div>
          <div class="card-footer">
            <a href="detail.html?id=${property.id}" class="btn btn-block">Ver detalles</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="row">
      ${propertiesHTML}
    </div>
  `;
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}