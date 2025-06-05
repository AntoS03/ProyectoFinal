/**
 * Profile page script
 * Handles user profile and reservations
 */

// Cache for property details to avoid repeated API calls
const propertyCache = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const isLoggedIn = await checkAuth();
  
  if (!isLoggedIn) {
    // Redirect to login page with return URL
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  // Update navigation
  await updateNavigation();

  // Load user reservations
  loadUserReservations();
  loadUserProfile(); // NUOVA CHIAMATA QUI


  // Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
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

  // Setup tabs if they exist
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
 * Load user profile data
 */
async function loadUserProfile() {
  try {
    const response = await apiGet('/user/profile'); // Chiama il nuovo endpoint
    
    if (response.ok) {
      const userData = await response.json();
      document.getElementById('userNombre').textContent = userData.nombre || 'No especificado';
      document.getElementById('userApellido').textContent = userData.apellido || 'No especificado';
      document.getElementById('userEmail').textContent = userData.email;
      
      const profileImage = document.getElementById('userProfileImage');
      if (userData.profile_image_url) {
        // Costruisci l'URL completo se profile_image_url è relativo
        // Se è già un URL completo, puoi usarlo direttamente.
        // Se profile_image_url è tipo "user_uploads/immagine.jpg" e il backend serve
        // questi file da un percorso base, dovrai aggiustare l'URL.
        // Per ora, assumiamo che sia un URL accessibile o un percorso relativo 
        // dalla root del sito se il backend serve staticamente le immagini profilo.
        // Se API_BASE è https://dominio.com/api e le immagini sono https://dominio.com/static/uploads/...
        // allora devi costruire l'URL correttamente.
        // Semplificazione: se l'URL inizia con http o /, usalo. Altrimenti, anteponi /
        let imageUrl = userData.profile_image_url;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            // Esempio: se le immagini sono in /static/uploads/
            // Questo dipende da come servi le immagini profilo dal backend
            // imageUrl = `/static/uploads/${imageUrl}`; // O qualsiasi sia il tuo percorso base
        }
        profileImage.src = imageUrl || 'static/img/default-avatar.png'; 
      } else {
        profileImage.src = 'static/img/default-avatar.png'; // Immagine di default
      }

    } else {
      console.error('Error al cargar datos del perfil:', response.status);
      showAlert('No se pudieron cargar los datos del perfil.', 'error');
      // Potresti voler reindirizzare al login se è un 401 qui anche
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    showAlert('Error de red al cargar datos del perfil.', 'error');
  }
}
