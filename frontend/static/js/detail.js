/**
 * Detail page functionality
 */

// DOM Elements
const alojamientoDetail = document.getElementById('alojamientoDetail');
const alojamientoNotFound = document.getElementById('alojamientoNotFound');
const loadingIndicator = document.getElementById('loadingIndicator');
const breadcrumbName = document.getElementById('breadcrumbName');
const nombreAlojamiento = document.getElementById('nombreAlojamiento');
const imagenAlojamiento = document.getElementById('imagenAlojamiento');
const direccionAlojamiento = document.getElementById('direccionAlojamiento');
const ciudadAlojamiento = document.getElementById('ciudadAlojamiento');
const estadoAlojamiento = document.getElementById('estadoAlojamiento');
const descripcionAlojamiento = document.getElementById('descripcionAlojamiento');
const precioAlojamiento = document.getElementById('precioAlojamiento');
const mapContainer = document.getElementById('mapContainer');
const mapFrame = document.getElementById('mapFrame');
const authRequired = document.getElementById('authRequired');
const reservationForm = document.getElementById('reservationForm');
const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');
const dateError = document.getElementById('dateError');
const reserveButton = document.getElementById('reserveButton');
const resetDates = document.getElementById('resetDates');

// Store alojamiento id globally
let alojamientoId = null;

/**
 * Initialize detail page
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Get alojamiento ID from URL
  const params = getQueryParams();
  alojamientoId = params.id;
  
  if (!alojamientoId) {
    // No ID provided
    showNotFound();
    return;
  }
  
  // Load alojamiento details
  await loadAlojamientoDetails();
  
  // Setup date inputs
  setupDateInputs();
  
  // Setup reservation form
  setupReservationForm();
  
  // Check if user is authenticated
  await checkAuthenticationStatus();
});

/**
 * Show "not found" state
 */
function showNotFound() {
  if (loadingIndicator) loadingIndicator.classList.add('hidden');
  if (alojamientoDetail) alojamientoDetail.classList.add('hidden');
  if (alojamientoNotFound) alojamientoNotFound.classList.remove('hidden');
}

/**
 * Load alojamiento details
 */
async function loadAlojamientoDetails() {
  if (!alojamientoDetail || !loadingIndicator || !alojamientoId) return;
  
  try {
    // Show loading indicator
    showSpinner(loadingIndicator);
    alojamientoDetail.classList.add('hidden');
    alojamientoNotFound.classList.add('hidden');
    
    // Fetch alojamiento details
    const response = await apiGet(`/alojamientos/${alojamientoId}`);
    
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    
    if (response.ok) {
      const alojamiento = await response.json();
      
      // Update UI with alojamiento details
      renderAlojamientoDetails(alojamiento);
      alojamientoDetail.classList.remove('hidden');
    } else {
      // Alojamiento not found or error
      showNotFound();
    }
  } catch (error) {
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    
    // Show error
    showNotFound();
    console.error('Error in loadAlojamientoDetails:', error);
  }
}

/**
 * Render alojamiento details
 * @param {object} alojamiento - Alojamiento data
 */
function renderAlojamientoDetails(alojamiento) {
  // Update breadcrumb
  if (breadcrumbName) breadcrumbName.textContent = alojamiento.nombre;
  
  // Update page title
  document.title = `${alojamiento.nombre} - ProyectoFinal`;
  
  // Basic details
  if (nombreAlojamiento) nombreAlojamiento.textContent = alojamiento.nombre;
  
  // Image
  if (imagenAlojamiento) {
    // Use placeholder image if no image is available
    const imageSrc = alojamiento.imagen_principal_ruta || 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
    imagenAlojamiento.src = imageSrc;
    imagenAlojamiento.alt = `Imagen de ${alojamiento.nombre}`;
  }
  
  // Location details
  if (direccionAlojamiento) direccionAlojamiento.textContent = alojamiento.direccion || 'Dirección no disponible';
  if (ciudadAlojamiento) ciudadAlojamiento.textContent = alojamiento.ciudad || 'Ciudad no disponible';
  if (estadoAlojamiento) estadoAlojamiento.textContent = alojamiento.estado_o_pais || 'Estado/País no disponible';
  
  // Description
  if (descripcionAlojamiento) descripcionAlojamiento.textContent = alojamiento.descripcion || 'Descripción no disponible';
  
  // Price
  if (precioAlojamiento) precioAlojamiento.textContent = `${formatPrice(alojamiento.precio_noche)} / noche`;
  
  // Map
  if (mapContainer && mapFrame && alojamiento.link_map) {
    mapFrame.innerHTML = `<iframe src="${alojamiento.link_map}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
    mapContainer.classList.remove('hidden');
  } else if (mapContainer) {
    mapContainer.classList.add('hidden');
  }
}

/**
 * Setup date input fields
 */
function setupDateInputs() {
  if (!fechaInicio || !fechaFin) return;
  
  // Set minimum date to today
  setMinDateToday(fechaInicio);
  setMinDateToday(fechaFin);
  
  // Add event listeners
  fechaInicio.addEventListener('change', () => {
    // Set minimum date for checkout to be after checkin
    if (fechaInicio.value) {
      fechaFin.min = fechaInicio.value;
      
      // If current checkout date is before new checkin date, update it
      if (fechaFin.value && fechaFin.value < fechaInicio.value) {
        fechaFin.value = fechaInicio.value;
      }
    }
    
    validateDates();
  });
  
  fechaFin.addEventListener('change', validateDates);
  
  // Reset dates button
  if (resetDates) {
    resetDates.addEventListener('click', () => {
      fechaInicio.value = '';
      fechaFin.value = '';
      validateDates();
    });
  }
}

/**
 * Validate date selections
 * @returns {boolean} - True if dates are valid
 */
function validateDates() {
  if (!fechaInicio || !fechaFin || !dateError) return true;
  
  const startDate = fechaInicio.value;
  const endDate = fechaFin.value;
  
  // Hide error by default
  dateError.classList.add('hidden');
  
  // Both dates must be selected
  if (!startDate || !endDate) return false;
  
  // End date must be after start date
  if (endDate <= startDate) {
    dateError.classList.remove('hidden');
    return false;
  }
  
  return true;
}

/**
 * Setup reservation form submission
 */
function setupReservationForm() {
  if (!reservationForm || !alojamientoId) return;
  
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (!validateDates()) {
      return;
    }
    
    // Disable form while submitting
    reserveButton.disabled = true;
    reserveButton.innerHTML = '<span class="spinner"></span> Reservando...';
    
    try {
      // Create reservation
      const reservation = {
        id_alojamiento: alojamientoId,
        fecha_inicio: fechaInicio.value,
        fecha_fin: fechaFin.value
      };
      
      const response = await apiPost('/reservas', reservation);
      
      if (response.ok) {
        // Success
        const data = await response.json();
        showAlert(`Reserva creada correctamente (ID: ${data.id})`, 'success');
        
        // Reset form
        fechaInicio.value = '';
        fechaFin.value = '';
      } else if (response.status === 409) {
        // Conflict - dates not available
        showAlert('Fechas no disponibles. Por favor, selecciona otras fechas.', 'error');
      } else if (response.status === 401) {
        // Unauthorized
        showAlert('Debes iniciar sesión para reservar.', 'error');
        setTimeout(() => {
          window.location.href = `login.html?next=detail.html?id=${alojamientoId}`;
        }, 2000);
      } else {
        // Other error
        showAlert('Error al crear la reserva. Inténtalo de nuevo.', 'error');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      showAlert('Error al crear la reserva. Inténtalo de nuevo.', 'error');
    } finally {
      // Re-enable form
      reserveButton.disabled = false;
      reserveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Reservar ahora';
    }
  });
}

/**
 * Check if user is authenticated and update UI accordingly
 */
async function checkAuthenticationStatus() {
  if (!authRequired || !reservationForm) return;
  
  try {
    const isLoggedIn = await isAuthenticated();
    
    if (isLoggedIn) {
      // User is logged in, show reservation form
      authRequired.classList.add('hidden');
      reservationForm.classList.remove('hidden');
    } else {
      // User is not logged in, show auth required message
      authRequired.classList.remove('hidden');
      reservationForm.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    
    // Default to requiring authentication on error
    authRequired.classList.remove('hidden');
    reservationForm.classList.add('hidden');
  }
}