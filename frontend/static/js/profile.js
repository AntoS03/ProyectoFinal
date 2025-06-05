/**
 * Profile page script
 * Handles user profile and reservations
 */

// Cache for property details to avoid repeated API calls
const propertyCache = {};

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Verifico se utente è loggato
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  // 2) Aggiorno navbar
  await updateNavigation();

  // 3) Carico dati profilo
  await loadUserProfile();

  // 4) Carico prenotazioni
  loadUserReservations();

  // 5) Setup logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // 6) Setup upload immagine
  const uploadForm = document.getElementById('uploadImageForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleImageUpload);
  }

  // 7) Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // 8) Tab e navigazione attiva
  setActiveNavItem();
  setupTabs();
});

/**
 * Load user reservations
 */
async function loadUserReservations() {
  const reservationsContainer = document.getElementById('userReservations');
  if (!reservationsContainer) return;

  showSpinner('userReservations', true);

  try {
    const response = await apiGet('/reservas');
    
    if (response.ok) {
      const reservations = await response.json();
      
      if (reservations.length === 0) {
        reservationsContainer.innerHTML = `
          <div class="alert alert-info">
            No tienes reservas. <a href="search.html">Buscar alojamientos</a>
          </div>
        `;
        return;
      }
      
      await renderReservations(reservations);
      setupReservationActions();
    } else {
      if (response.status === 401) {
        // Session expired, redirect to login
        window.location.href = 'login.html';
      } else {
        showAlert('Error al cargar las reservas.', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error al cargar las reservas.', 'error');
  } finally {
    hideSpinner('userReservations');
  }
}

/**
 * Render user reservations
 * @param {Array} reservations - Array of reservation objects
 */
async function renderReservations(reservations) {
  const container = document.getElementById('userReservations');
  if (!container) return;

  // Fetch property details for each reservation
  const reservationsWithDetails = await Promise.all(reservations.map(async (reserva) => {
    let property = propertyCache[reserva.id_alojamiento];
    
    if (!property) {
      try {
        const response = await apiGet(`/alojamientos/${reserva.id_alojamiento}`);
        if (response.ok) {
          property = await response.json();
          propertyCache[reserva.id_alojamiento] = property;
        } else {
          property = { nombre: 'Alojamiento no disponible' };
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        property = { nombre: 'Alojamiento no disponible' };
      }
    }
    
    return { ...reserva, property };
  }));

  // Sort reservations: Pending first, then Confirmed, then Canceled
  reservationsWithDetails.sort((a, b) => {
    const order = { 'Pendiente': 0, 'Confirmada': 1, 'Cancelada': 2 };
    return order[a.estado_reserva] - order[b.estado_reserva];
  });

  const tableHTML = `
    <table class="reservations-table">
      <thead>
        <tr>
          <th>Alojamiento</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${reservationsWithDetails.map(reserva => {
          const badgeClass = reserva.estado_reserva === 'Pendiente' 
            ? 'badge-pending' 
            : (reserva.estado_reserva === 'Confirmada' ? 'badge-confirmed' : 'badge-canceled');
          
          const actions = reserva.estado_reserva === 'Pendiente'
            ? `<button class="btn btn-sm btn-outline cancel-reservation" data-id="${reserva.id_reserva}">Cancelar</button>`
            : '';

          return `
            <tr>
              <td><a href="detail.html?id=${reserva.id_alojamiento}">${reserva.property.nombre}</a></td>
              <td>${formatDate(reserva.fecha_inicio)}</td>
              <td>${formatDate(reserva.fecha_fin)}</td>
              <td><span class="badge ${badgeClass}">${reserva.estado_reserva}</span></td>
              <td>${actions}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}

/**
 * Setup reservation action buttons
 */
function setupReservationActions() {
  // Cancel reservation buttons
  const cancelButtons = document.querySelectorAll('.cancel-reservation');
  cancelButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const reservationId = button.dataset.id;
      
      if (confirm('¿Seguro que deseas cancelar esta reserva?')) {
        try {
          const response = await apiDelete(`/reservas/${reservationId}`);
          
          if (response.ok) {
            showAlert('Reserva cancelada correctamente.', 'success');
            // Reload reservations
            loadUserReservations();
          } else {
            const error = await response.json();
            showAlert(error.error || 'Error al cancelar la reserva.', 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          showAlert('Error al cancelar la reserva.', 'error');
        }
      }
    });
  });
}

/**
 * Logout user
 */
async function logout() {
  try {
    const response = await apiPost('/auth/logout');
    
    if (response.ok) {
      // Redirect to home page
      window.location.href = 'index.html';
    } else {
      showAlert('Error al cerrar sesión.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error al cerrar sesión.', 'error');
  }
}

/**
 * Setup tabs functionality
 */
function setupTabs() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabLinks.length === 0 || tabContents.length === 0) return;
  
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs
      tabLinks.forEach(l => l.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      link.classList.add('active');
      
      // Show corresponding content
      const tabId = link.getAttribute('href').substring(1);
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'profile.html') {
      link.classList.add('active');
    }
  });
}

/**
 * Carica i dati dell'utente loggato (GET /api/auth/me)
 * e popola l'immagine del profilo, nome, cognome, email.
 */
async function loadUserProfile() {
  try {
    const response = await apiGet('/auth/me');
    if (!response.ok) {
      console.error('Impossibile caricare dati utente:', response.status);
      return;
    }
    const user = await response.json();

    document.getElementById('userName').textContent = user.nombre || '—';
    document.getElementById('userSurname').textContent = user.apellidos || '—';
    document.getElementById('userEmail').textContent = user.email || '—';

    const imgEl = document.getElementById('userImage');
    if (user.imagen_perfil_ruta) {
      imgEl.src = user.imagen_perfil_ruta;
    } else {
      // rimane il default definito in HTML
    }
  } catch (err) {
    console.error('Errore loadUserProfile:', err);
  }
}

/**
 * Handler per l'upload dell'immagine di profilo
 */
async function handleImageUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById('imageInput');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showAlert('Seleziona un file!', 'warning');
    return;
  }

  const file = fileInput.files[0];
  // (opzionale) verifica lato client dimensione o tipo
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    showAlert('Formato non valido. Usa PNG, JPG o GIF.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  // Disabilitiamo il bottone per evitare doppio submit
  const submitBtn = uploadForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Caricamento…';
  }

  try {
    const response = await fetch('/api/auth/upload-profile-image', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      // Aggiorna in pagina l’immagine
      document.getElementById('userImage').src = data.imagen_perfil_ruta;
      showAlert('Immagine aggiornata con successo!', 'success');
      // Pulisci l’input file
      fileInput.value = '';
    } else {
      const errJson = await response.json();
      showAlert(errJson.error || 'Errore caricamento immagine.', 'error');
    }
  } catch (err) {
    console.error('Upload image error:', err);
    showAlert('Errore di rete durante caricamento.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cambiar foto';
    }
  }
}