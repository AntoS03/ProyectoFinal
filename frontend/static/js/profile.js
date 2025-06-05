/**
 * Profile page script
 * Gestisce il caricamento dati utente, prenotazioni e upload immagine
 */

// Cache per i dettagli di proprietà (già esistente)
const propertyCache = {};

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Controlla se l'utente è loggato
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  // 2) Aggiorna la navbar
  await updateNavigation();

  // 3) Carica i dati di profilo (nome, cognome, email, immagine)
  await loadUserProfile();

  // 4) Carica le prenotazioni
  loadUserReservations();

  // 5) Imposta il listener sul bottone di logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // 6) Imposta il listener per il form di upload immagine
  const uploadForm = document.getElementById('uploadImageForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => handleImageUpload(e, uploadForm));
  }

  // 7) Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // 8) Inizializza i tab e segna come attivo “Mi Perfil”
  setActiveNavItem();
  setupTabs();
});


/**
 * Carica i dati di profilo (GET /api/auth/me) e popola la pagina.
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
    }
    // Altrimenti rimane l’immagine di default già impostata in HTML
  } catch (err) {
    console.error('Errore loadUserProfile:', err);
  }
}


/**
 * Gestisce l'upload dell'immagine di profilo
 * @param {Event} event - submit event del form
 * @param {HTMLFormElement} uploadForm - riferimento al form upload
 */
async function handleImageUpload(event, uploadForm) {
  event.preventDefault();

  const fileInput = document.getElementById('imageInput');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showAlert('Seleziona un file!', 'warning');
    return;
  }

  const file = fileInput.files[0];
  // Verifica lato client tipo e dimensione (opzionale)
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    showAlert('Formato non valido. Usa PNG, JPG o GIF.', 'error');
    return;
  }

  // Prepara FormData
  const formData = new FormData();
  formData.append('image', file);

  // Disabilita il pulsante di submit
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
      // Aggiorna in pagina l’immagine del profilo
      document.getElementById('userImage').src = data.imagen_perfil_ruta;
      showAlert('Immagine aggiornata con successo!', 'success');
      // Reset input file
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


/**
 * Carica le prenotazioni dell’utente loggato (GET /api/reservas)
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
 * Render della tabella delle prenotazioni
 */
async function renderReservations(reservations) {
  const container = document.getElementById('userReservations');
  if (!container) return;

  // Recupera i dettagli di ciascun alloggio
  const reservationsWithDetails = await Promise.all(
    reservations.map(async (reserva) => {
      let property = propertyCache[reserva.id_alojamiento];

      if (!property) {
        try {
          const resp = await apiGet(`/alojamientos/${reserva.id_alojamiento}`);
          if (resp.ok) {
            property = await resp.json();
            propertyCache[reserva.id_alojamiento] = property;
          } else {
            property = { nombre: 'Alojamiento no disponible' };
          }
        } catch (err) {
          console.error('Error fetching property:', err);
          property = { nombre: 'Alojamiento no disponibile' };
        }
      }

      return { ...reserva, property };
    })
  );

  // Ordina: Pendiente (0), Confirmada (1), Cancelada (2)
  reservationsWithDetails.sort((a, b) => {
    const order = { Pendiente: 0, Confirmada: 1, Cancelada: 2 };
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
        ${reservationsWithDetails
          .map((reserva) => {
            const badgeClass =
              reserva.estado_reserva === 'Pendiente'
                ? 'badge-pending'
                : reserva.estado_reserva === 'Confirmada'
                ? 'badge-confirmed'
                : 'badge-canceled';

            const actions =
              reserva.estado_reserva === 'Pendiente'
                ? `<button class="btn btn-sm btn-outline cancel-reservation" data-id="${reserva.id_reserva}">Cancelar</button>`
                : '';

            return `
              <tr>
                <td>
                  <a href="detail.html?id=${reserva.id_alojamiento}">
                    ${reserva.property.nombre}
                  </a>
                </td>
                <td>${formatDate(reserva.fecha_inicio)}</td>
                <td>${formatDate(reserva.fecha_fin)}</td>
                <td><span class="badge ${badgeClass}">${reserva.estado_reserva}</span></td>
                <td>${actions}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}


/**
 * Aggiunge i listener ai pulsanti “Cancelar”
 */
function setupReservationActions() {
  const cancelButtons = document.querySelectorAll('.cancel-reservation');
  cancelButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const reservationId = button.dataset.id;
      if (!reservationId) return;

      if (confirm('¿Seguro que deseas cancelar esta reserva?')) {
        try {
          const response = await apiDelete(`/reservas/${reservationId}`);
          if (response.ok) {
            showAlert('Reserva cancelada correctamente.', 'success');
            loadUserReservations();
          } else {
            const err = await response.json();
            showAlert(err.error || 'Error al cancelar la reserva.', 'error');
          }
        } catch (err) {
          console.error('Error:', err);
          showAlert('Error al cancelar la reserva.', 'error');
        }
      }
    });
  });
}


/**
 * Effettua logout (POST /api/auth/logout)
 */
async function logout() {
  try {
    const response = await apiPost('/auth/logout');
    if (response.ok) {
      window.location.href = 'index.html';
    } else {
      showAlert('Error al cerrar sesión.', 'error');
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Error al cerrar sesión.', 'error');
  }
}


/**
 * Attiva il tab corrente (Mis Reservas / Mi Cuenta) nella navbar del profilo
 */
function setActiveNavItem() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach((link) => {
    if (link.getAttribute('href') === 'profile.html') {
      link.classList.add('active');
    }
  });
}


/**
 * Imposta il comportamento dei tab “Mis Reservas” e “Mi Cuenta”
 */
function setupTabs() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabLinks.length === 0 || tabContents.length === 0) return;

  tabLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      tabLinks.forEach((l) => l.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      link.classList.add('active');
      const tabId = link.getAttribute('href').substring(1);
      document.getElementById(tabId).classList.add('active');
    });
  });
}
