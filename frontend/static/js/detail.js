/**
 * Detail page script
 * Handles property detail view and booking
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication and update navigation
  await updateNavigation();

  // Get property ID from URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showAlert('Alojamiento no encontrado. ID no especificado.', 'error');
    return;
  }

  // Load property details
  loadPropertyDetail(id);

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

  // Setup booking form submission
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createReservation(id);
    });
  }
});

/**
 * Load property detail
 * @param {string} id - Property ID
 */
async function loadPropertyDetail(id) {
  const detailContainer = document.getElementById('propertyDetail');
  if (!detailContainer) return;

  showSpinner('propertyDetail', true);

  try {
    const response = await apiGet(`/alojamientos/${id}/`);
    
    if (response.ok) {
      const property = await response.json();
      renderPropertyDetail(property);
      document.title = `${property.nombre} - Best Booking`;
      
      // Check if user is authenticated to show booking form
      const isLoggedIn = await checkAuth();
      toggleBookingForm(isLoggedIn);
    } else {
      if (response.status === 404) {
        showAlert('Alojamiento no encontrado.', 'error');
      } else {
        showAlert('Error al cargar los detalles del alojamiento.', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error al cargar los detalles del alojamiento.', 'error');
  } finally {
    hideSpinner('propertyDetail');
  }
}

/**
 * Render property detail
 * @param {Object} property - Property object
 */
function renderPropertyDetail(property) {
  const container = document.getElementById('propertyDetail');
  if (!container) return;

  // Build breadcrumbs
  const breadcrumbs = `
    <div class="breadcrumbs">
      <a href="index.html">Inicio</a>
      <span>></span>
      <a href="search.html">Buscar</a>
      <span>></span>
      <span class="current">${property.nombre}</span>
    </div>
  `;

  // Build map if link exists
  const mapHTML = property.link_map ? `
    <div class="property-map">
      <iframe src="${property.link_map}" allowfullscreen></iframe>
    </div>
  ` : '';

  container.innerHTML = `
    ${breadcrumbs}
    <div class="property-detail">
      <div class="property-header">
        <h1 class="property-title">${property.nombre}</h1>
        <div class="property-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${property.direccion}, ${property.ciudad}, ${property.estado_o_pais}
        </div>
      </div>
      
      <div class="property-image">
        <img src="${property.imagen_principal_ruta || 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'}" 
             alt="Imagen principal de ${property.nombre}" />
      </div>
      
      <div class="property-content">
        <div class="property-info">
          <div class="property-price">${formatPrice(property.precio_noche)} / noche</div>
          <div class="property-description">${property.descripcion}</div>
        </div>
        
        ${mapHTML}
      </div>
    </div>
  `;

  // Store property ID for booking
  if (document.getElementById('bookingForm')) {
    document.getElementById('bookingForm').dataset.propertyId = property.id;
  }
}

/**
 * Toggle booking form based on authentication status
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
function toggleBookingForm(isLoggedIn) {
  const bookingContainer = document.getElementById('bookingContainer');
  if (!bookingContainer) return;

  if (isLoggedIn) {
    bookingContainer.innerHTML = `
      <div class="booking-form">
        <h2>Reservar este alojamiento</h2>
        <form id="bookingForm">
          <div class="booking-dates">
            <div class="booking-date">
              <div class="form-group">
                <label for="fechaInicio" class="form-label">Fecha de llegada</label>
                <input type="date" id="fechaInicio" class="form-control" required>
                <div id="fechaInicioError" class="invalid-feedback"></div>
              </div>
            </div>
            <div class="booking-date">
              <div class="form-group">
                <label for="fechaFin" class="form-label">Fecha de salida</label>
                <input type="date" id="fechaFin" class="form-control" required>
                <div id="fechaFinError" class="invalid-feedback"></div>
              </div>
            </div>
          </div>
          <button type="submit" id="bookBtn" class="btn btn-primary btn-block">Reservar ahora</button>
        </form>
      </div>
    `;

    // Set min date for date inputs (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaInicio').min = today;
    document.getElementById('fechaFin').min = today;

    // Add event listener to validate dates
    document.getElementById('fechaInicio').addEventListener('change', validateDates);
    document.getElementById('fechaFin').addEventListener('change', validateDates);

    // Setup booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateDates()) {
          createReservation();
        }
      });
    }
  } else {
    bookingContainer.innerHTML = `
      <div class="booking-form">
        <p>Para reservar debes <a href="login.html">iniciar sesión</a>.</p>
      </div>
    `;
  }
}

/**
 * Validate booking dates
 * @returns {boolean} - Whether dates are valid
 */
function validateDates() {
  const fechaInicio = document.getElementById('fechaInicio');
  const fechaFin = document.getElementById('fechaFin');
  const fechaInicioError = document.getElementById('fechaInicioError');
  const fechaFinError = document.getElementById('fechaFinError');
  
  let isValid = true;

  // Reset errors
  fechaInicioError.textContent = '';
  fechaFinError.textContent = '';
  fechaInicio.classList.remove('is-invalid');
  fechaFin.classList.remove('is-invalid');

  // Check if dates are selected
  if (!fechaInicio.value) {
    fechaInicioError.textContent = 'Selecciona una fecha de llegada';
    fechaInicio.classList.add('is-invalid');
    isValid = false;
  }

  if (!fechaFin.value) {
    fechaFinError.textContent = 'Selecciona una fecha de salida';
    fechaFin.classList.add('is-invalid');
    isValid = false;
  }

  // Check if end date is after start date
  if (fechaInicio.value && fechaFin.value) {
    const start = new Date(fechaInicio.value);
    const end = new Date(fechaFin.value);
    
    if (end <= start) {
      fechaFinError.textContent = 'La fecha de salida debe ser posterior a la fecha de llegada';
      fechaFin.classList.add('is-invalid');
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Create a reservation
 */
async function createReservation() {
  if (!validateDates()) return;

  const propertyId = parseInt(new URLSearchParams(window.location.search).get('id'));
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin = document.getElementById('fechaFin').value;
  const bookBtn = document.getElementById('bookBtn');

  // Disable button and show loading
  bookBtn.disabled = true;
  bookBtn.innerHTML = '<span class="spinner"></span> Procesando...';

  try {
    const response = await apiPost('/reservas/', {
      id_alojamiento: propertyId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });

    if (response.ok) {
      const data = await response.json();
      showAlert(`Reserva creada correctamente (ID: ${data.id})`, 'success');
      
      // Reset form
      document.getElementById('fechaInicio').value = '';
      document.getElementById('fechaFin').value = '';
    } else {
      const error = await response.json();
      
      if (response.status === 409) {
        showAlert('Fechas no disponibles. Por favor, elige otras fechas.', 'error');
      } else if (response.status === 401) {
        showAlert('Debes iniciar sesión para reservar.', 'error');
        window.location.href = 'login.html';
      } else {
        showAlert(error.error || 'Error al crear la reserva.', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error al crear la reserva.', 'error');
  } finally {
    // Re-enable button
    bookBtn.disabled = false;
    bookBtn.textContent = 'Reservar ahora';
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