/**
 * Profile page functionality
 */

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const profileContent = document.getElementById('profileContent');
const reservasTab = document.getElementById('reservasTab');
const accountTab = document.getElementById('accountTab');
const reservasContent = document.getElementById('reservasContent');
const accountContent = document.getElementById('accountContent');
const noReservas = document.getElementById('noReservas');
const reservasTable = document.getElementById('reservasTable');
const reservasTableBody = document.getElementById('reservasTableBody');
const userEmail = document.getElementById('userEmail');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// Current user info
let currentUserEmail = '';

// Reservation action state
let pendingAction = null;
let pendingReservationId = null;

/**
 * Initialize profile page
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const isLoggedIn = await isAuthenticated();
  
  if (!isLoggedIn) {
    // Redirect to login page if not authenticated
    window.location.href = 'login.html?next=profile.html';
    return;
  }
  
  // Set up tabs
  setupTabs();
  
  // Set up logout button
  setupLogout();
  
  // Set up modal
  setupModal();
  
  // Load user reservations
  await loadReservations();
  
  // Try to load user data
  await loadUserData();
});

/**
 * Set up tab switching functionality
 */
function setupTabs() {
  if (!reservasTab || !accountTab || !reservasContent || !accountContent) return;
  
  reservasTab.addEventListener('click', () => {
    reservasTab.classList.add('active');
    accountTab.classList.remove('active');
    reservasContent.classList.remove('hidden');
    accountContent.classList.add('hidden');
  });
  
  accountTab.addEventListener('click', () => {
    accountTab.classList.add('active');
    reservasTab.classList.remove('active');
    accountContent.classList.remove('hidden');
    reservasContent.classList.add('hidden');
  });
}

/**
 * Set up logout button
 */
function setupLogout() {
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async () => {
    showModal(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar la sesión?',
      async () => {
        try {
          const response = await apiPost('/auth/logout');
          
          if (response.ok) {
            // Redirect to home page
            window.location.href = 'index.html';
          } else {
            showAlert('Error al cerrar sesión. Inténtalo de nuevo.', 'error');
          }
        } catch (error) {
          console.error('Logout error:', error);
          showAlert('Error al cerrar sesión. Inténtalo de nuevo.', 'error');
        }
      }
    );
  });
}

/**
 * Set up modal functionality
 */
function setupModal() {
  if (!confirmModal || !modalCancel) return;
  
  // Close modal when clicking the cancel button
  modalCancel.addEventListener('click', hideModal);
  
  // Close modal when clicking the X button
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', hideModal);
  }
  
  // Close modal when clicking outside the modal content
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      hideModal();
    }
  });
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} confirmCallback - Function to call on confirm
 */
function showModal(title, message, confirmCallback) {
  if (!confirmModal || !modalTitle || !modalMessage || !modalConfirm) return;
  
  // Set modal content
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Set confirm callback
  modalConfirm.onclick = () => {
    hideModal();
    if (confirmCallback) confirmCallback();
  };
  
  // Show modal
  confirmModal.classList.remove('hidden');
}

/**
 * Hide confirmation modal
 */
function hideModal() {
  if (!confirmModal) return;
  confirmModal.classList.add('hidden');
}

/**
 * Load user reservations
 */
async function loadReservations() {
  if (!loadingIndicator || !profileContent || !reservasTableBody || !noReservas || !reservasTable) return;
  
  try {
    // Show loading indicator
    showSpinner(loadingIndicator);
    profileContent.classList.add('hidden');
    
    // Fetch reservations
    const response = await apiGet('/reservas');
    
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    profileContent.classList.remove('hidden');
    
    if (response.ok) {
      const reservas = await response.json();
      
      if (reservas.length === 0) {
        // No reservations
        noReservas.classList.remove('hidden');
        reservasTable.classList.add('hidden');
      } else {
        // Render reservations
        await renderReservations(reservas);
        noReservas.classList.add('hidden');
        reservasTable.classList.remove('hidden');
      }
    } else {
      // Error fetching reservations
      showAlert('Error al cargar tus reservas. Inténtalo de nuevo.', 'error');
    }
  } catch (error) {
    // Hide loading indicator
    hideSpinner(loadingIndicator);
    profileContent.classList.remove('hidden');
    
    // Show error
    showAlert('Error al cargar tus reservas. Inténtalo de nuevo.', 'error');
    console.error('Error in loadReservations:', error);
  }
}

/**
 * Render reservations in the table
 * @param {Array} reservas - List of reservations
 */
async function renderReservations(reservas) {
  if (!reservasTableBody) return;
  
  // Clear previous rows
  reservasTableBody.innerHTML = '';
  
  // Create and append row for each reservation
  for (const reserva of reservas) {
    const row = document.createElement('tr');
    
    // Fetch alojamiento details
    const alojamiento = await getAlojamientoDetails(reserva.id_alojamiento);
    const alojamientoNombre = alojamiento ? alojamiento.nombre : `Alojamiento ${reserva.id_alojamiento}`;
    
    row.innerHTML = `
      <td>
        <a href="detail.html?id=${reserva.id_alojamiento}" class="alojamiento-link">
          ${alojamientoNombre}
        </a>
      </td>
      <td>${formatDate(reserva.fecha_inicio)}</td>
      <td>${formatDate(reserva.fecha_fin)}</td>
      <td><span class="estado-${reserva.estado_reserva.toLowerCase()}">${reserva.estado_reserva}</span></td>
      <td class="actions-cell">
        ${getReservationActions(reserva)}
      </td>
    `;
    
    reservasTableBody.appendChild(row);
    
    // Add event listeners to action buttons
    if (reserva.estado_reserva === 'Pendiente') {
      const cancelBtn = row.querySelector('.cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => handleCancelReservation(reserva.id));
      }
      
      const confirmBtn = row.querySelector('.confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => handleConfirmReservation(reserva.id));
      }
    }
  }
}

/**
 * Get HTML for reservation action buttons
 * @param {object} reserva - Reservation data
 * @returns {string} - HTML for action buttons
 */
function getReservationActions(reserva) {
  if (reserva.estado_reserva !== 'Pendiente') {
    return '<span class="no-actions">No hay acciones disponibles</span>';
  }
  
  let actions = `
    <button class="btn btn-danger cancel-btn">
      <i class="fas fa-times"></i> Cancelar
    </button>
  `;
  
  // Add confirm button if user is the owner
  // Note: This would require additional backend info or endpoint to determine ownership
  // For now, we'll omit the confirm button as we can't reliably determine ownership
  
  return actions;
}

/**
 * Handle cancel reservation action
 * @param {string|number} reservationId - Reservation ID
 */
function handleCancelReservation(reservationId) {
  showModal(
    'Cancelar reserva',
    '¿Estás seguro de que deseas cancelar esta reserva?',
    async () => {
      try {
        const response = await apiDelete(`/reservas/${reservationId}`);
        
        if (response.ok) {
          showAlert('Reserva cancelada correctamente', 'success');
          // Reload reservations
          await loadReservations();
        } else {
          showAlert('Error al cancelar la reserva. Inténtalo de nuevo.', 'error');
        }
      } catch (error) {
        console.error('Error canceling reservation:', error);
        showAlert('Error al cancelar la reserva. Inténtalo de nuevo.', 'error');
      }
    }
  );
}

/**
 * Handle confirm reservation action
 * @param {string|number} reservationId - Reservation ID
 */
function handleConfirmReservation(reservationId) {
  showModal(
    'Confirmar reserva',
    '¿Estás seguro de que deseas confirmar esta reserva?',
    async () => {
      try {
        const response = await apiPut(`/reservas/${reservationId}/confirm`, {});
        
        if (response.ok) {
          showAlert('Reserva confirmada correctamente', 'success');
          // Reload reservations
          await loadReservations();
        } else {
          showAlert('Error al confirmar la reserva. Inténtalo de nuevo.', 'error');
        }
      } catch (error) {
        console.error('Error confirming reservation:', error);
        showAlert('Error al confirmar la reserva. Inténtalo de nuevo.', 'error');
      }
    }
  );
}

/**
 * Load user data
 */
async function loadUserData() {
  if (!userEmail || !userName) return;
  
  try {
    // Try to get user data
    // Note: This assumes there's a user endpoint. If not, we'll just use minimal info.
    const response = await apiGet('/auth/user');
    
    if (response.ok) {
      const user = await response.json();
      
      userEmail.textContent = user.email || 'Correo no disponible';
      currentUserEmail = user.email || '';
      
      const fullName = [user.nombre, user.apellidos].filter(Boolean).join(' ');
      userName.textContent = fullName || 'Nombre no disponible';
    } else {
      // If no specific user endpoint, just show minimal info
      userEmail.textContent = 'Usuario autenticado';
      userName.textContent = 'Datos no disponibles';
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Fallback
    userEmail.textContent = 'Usuario autenticado';
    userName.textContent = 'Datos no disponibles';
  }
}