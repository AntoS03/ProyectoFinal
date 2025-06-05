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

  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // rimuovo “active” da tutte le tab
      tabLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      // aggiungo “active” al link e al contenuto corrispondente
      link.classList.add('active');
      const tabId = link.getAttribute('href').substring(1);
      document.getElementById(tabId).classList.add('active');

      // Se apro “Mis Alojamientos”, carico la lista…
      if (tabId === 'misAlojamientosTab') {
        loadOwnerAlojamientos();
        loadOwnerReservaRequests();
      }
    });
  });
  const btnAddAloj = document.getElementById('btnAddAloj');
  if (btnAddAloj) {
    btnAddAloj.addEventListener('click', () => {
      document.getElementById('formAddAlojModal').style.display = 'block';
    });
  }
  // Listener per il pulsante “Cancelar” nel form
  const cancelAddAloj = document.getElementById('cancelAddAloj');
  if (cancelAddAloj) {
    cancelAddAloj.addEventListener('click', () => {
      resetAlojForm();
      document.getElementById('formAddAlojModal').style.display = 'none';
    });
  }

  // 3) Setup submit form “createAlojForm”
  const createAlojForm = document.getElementById('createAlojForm');
  if (createAlojForm) {
    createAlojForm.addEventListener('submit', handleCreateAlojamiento);
  }

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

function resetAlojForm() {
  const fields = [
    'nombreAloj', 'direccionAloj', 'ciudadAloj', 'estadoAloj',
    'descripcionAloj', 'precioAloj', 'linkMapAloj', 'imageAlojInput'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/**
 * Carica e renderizza la lista degli alojamientos creati dall’utente
 */
async function loadOwnerAlojamientos() {
  const container = document.getElementById('ownerAlojamientos');
  if (!container) return;
  showSpinner('ownerAlojamientos', true);
  try {
    const response = await apiGet('/alojamientos/owner');
    if (response.ok) {
      const data = await response.json();
      if (data.length === 0) {
        container.innerHTML = '<p class="text-center">No tienes ningún alojamiento agregado.</p>';
        return;
      }
      // Costruiamo una semplice griglia di carte
      const html = data.map(a => `
        <div class="col col-md-4" style="margin-bottom:1rem;">
          <div class="card">
            <div class="card-img" style="height:180px; overflow:hidden;">
              <img src="${a.imagen_principal_ruta || 'https://via.placeholder.com/300x180'}" alt="Imagen de ${a.nombre}" />
            </div>
            <div class="card-body">
              <h3 class="card-title">${a.nombre}</h3>
              <div class="card-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${a.ciudad}
              </div>
              <div class="card-price">${formatPrice(a.precio_noche)}/noche</div>
            </div>
          </div>
        </div>
      `).join('');
      container.innerHTML = `<div class="row">${html}</div>`;
    } else {
      container.innerHTML = '<p class="text-center">Error al cargar alojamientos.</p>';
    }
  } catch (err) {
    console.error('Errore loadOwnerAlojamientos:', err);
    container.innerHTML = '<p class="text-center">Error de red al cargar alojamientos.</p>';
  } finally {
    hideSpinner('ownerAlojamientos');
  }
}

async function handleCreateAlojamiento(event) {
  event.preventDefault();
  const submitBtn = document.querySelector('#createAlojForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando…';
  }

  // 1) Validazione base
  const nombre      = document.getElementById('nombreAloj').value.trim();
  const direccion   = document.getElementById('direccionAloj').value.trim();
  const ciudad      = document.getElementById('ciudadAloj').value.trim();
  const estado      = document.getElementById('estadoAloj').value.trim();
  const descripcion = document.getElementById('descripcionAloj').value.trim();
  const precio      = document.getElementById('precioAloj').value;
  const linkMap     = document.getElementById('linkMapAloj').value.trim();
  const imageInput  = document.getElementById('imageAlojInput');

  if (!nombre || !direccion || !ciudad || !estado || !descripcion || !precio || imageInput.files.length === 0) {
    showAlert('Compila tutti i campi obbligatori (*)', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Alojamiento';
    }
    return;
  }

  // 2) Carico immagine (FormData)
  const file = imageInput.files[0];
  const formData = new FormData();
  formData.append('image', file);

  let imagenPrincipalRuta = '';
  try {
    const respImg = await fetch('/api/alojamientos/upload-image', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (respImg.ok) {
      const jsonImg = await respImg.json();
      imagenPrincipalRuta = jsonImg.imagen_principal_ruta;
    } else {
      const err = await respImg.json().catch(() => ({}));
      showAlert(err.error || 'Error al cargar imagen', 'error');
      throw 'fail upload image';
    }
  } catch (err) {
    console.error('Error upload image alojamiento:', err);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Alojamiento';
    }
    return;
  }

  // 3) Creo l’alojamiento via JSON
  const payload = {
    nombre,
    direccion,
    ciudad,
    estado_o_pais: estado,
    descripcion,
    precio_noche: parseFloat(precio),
    imagen_principal_ruta: imagenPrincipalRuta,
    link_map: linkMap || null
  };

  try {
    const respAloj = await apiPost('/alojamientos', payload);
    if (respAloj.ok) {
      showAlert('Alojamiento creato con successo!', 'success');
      resetAlojForm();
      // Chiudo il modal di inserimento
      document.getElementById('formAddAlojModal').style.display = 'none';
      // Ricarico la lista “Mis Alojamientos”
      loadOwnerAlojamientos();
    } else {
      const err = await respAloj.json().catch(() => ({}));
      showAlert(err.error || 'Errore durante la creazione dell\'alojamiento', 'error');
    }
  } catch (err) {
    console.error('Error create alojamiento:', err);
    showAlert('Errore di rete durante la creazione.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Alojamiento';
    }
  }
}


async function loadOwnerReservaRequests() {
  const container = document.getElementById('ownerReservaRequests');
  if (!container) return;
  showSpinner('ownerReservaRequests', true);
  try {
    const response = await apiGet('/reservas/owner');
    if (response.ok) {
      const data = await response.json();
      if (data.length === 0) {
        container.innerHTML = '<p class="text-center">No hay solicitudes pendientes.</p>';
        return;
      }
      // Creiamo una tabella
      const rows = data.map(r => {
        return `
          <tr>
            <td>${r.nombre_alojamiento}</td>
            <td>${formatDate(r.fecha_inicio)}</td>
            <td>${formatDate(r.fecha_fin)}</td>
            <td>
              <button class="btn btn-sm btn-primary confirm-request" data-id="${r.id_reserva}">
                Confirmar
              </button>
              <button class="btn btn-sm btn-danger reject-request" data-id="${r.id_reserva}" style="margin-left:4px;">
                Rifiutar
              </button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <table class="reservations-table">
          <thead>
            <tr>
              <th>Alojamiento</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
      setupOwnerRequestActions();
    } else {
      container.innerHTML = '<p class="text-center">Error al cargar solicitudes.</p>';
    }
  } catch (err) {
    console.error('Error loadOwnerReservaRequests:', err);
    container.innerHTML = '<p class="text-center">Error de red al cargar solicitudes.</p>';
  } finally {
    hideSpinner('ownerReservaRequests');
  }
}

function setupOwnerRequestActions() {
  // Confirmar
  document.querySelectorAll('.confirm-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const resp = await fetch(`/api/reservas/${id}/confirm`, {
          method: 'PUT',
          credentials: 'include'
        });
        if (resp.ok) {
          showAlert('Prenotazione confermata!', 'success');
          loadOwnerReservaRequests();
        } else {
          const err = await resp.json();
          showAlert(err.error || 'Errore conferma.', 'error');
        }
      } catch (err) {
        console.error('Error confirm reservation:', err);
        showAlert('Errore di rete.', 'error');
      }
    });
  });

  // Rifiutar
  document.querySelectorAll('.reject-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        const resp = await fetch(`/api/reservas/${id}/reject`, {
          method: 'PUT',
          credentials: 'include'
        });
        if (resp.ok) {
          showAlert('Prenotazione rifiutata!', 'success');
          loadOwnerReservaRequests();
        } else {
          const err = await resp.json();
          showAlert(err.error || 'Errore rifiuto.', 'error');
        }
      } catch (err) {
        console.error('Error reject reservation:', err);
        showAlert('Errore di rete.', 'error');
      }
    });
  });
}

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
