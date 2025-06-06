/**
 * Profile page script
 * Gestisce il caricamento dati utente, prenotazioni, alojamientos e relative operazioni
 */

const propertyCache = {};
const GOOGLE_MAPS_API_KEY = 'AIzaSyCqe9NZZwT_luG4ub5ZrtCQ3a2E52VXdbo'; // ← Inserisci qui la tua API Key

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  await updateNavigation();
  await loadUserProfile();
  loadUserReservations();

  // Gestione dei tab (Mis Reservas, Mi Cuenta, Mis Alojamientos)
  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      tabLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

      link.classList.add('active');
      const tabId = link.getAttribute('href').substring(1);
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'misAlojamientosTab') {
        loadOwnerAlojamientos();
        loadOwnerReservaRequests();

        // Attacca listener solo se non già fatto
        const btnAddAloj = document.getElementById('btnAddAloj');
        if (btnAddAloj && !btnAddAloj.dataset.listenerAttached) {
          btnAddAloj.addEventListener('click', () => {
            resetAlojForm();
            document.getElementById('formAddAlojModal').style.display = 'block';
          });
          btnAddAloj.dataset.listenerAttached = "true";
        }

        const cancelAddAloj = document.getElementById('cancelAddAloj');
        if (cancelAddAloj && !cancelAddAloj.dataset.listenerAttached) {
          cancelAddAloj.addEventListener('click', () => {
            resetAlojForm();
            document.getElementById('formAddAlojModal').style.display = 'none';
          });
          cancelAddAloj.dataset.listenerAttached = "true";
        }
      }
    });
  });

  // Pulsante “Añadir Alojamiento”
  const btnAddAloj = document.getElementById('btnAddAloj');
  if (btnAddAloj) {
    btnAddAloj.addEventListener('click', () => {
      resetAlojForm();
      document.getElementById('formAddAlojModal').style.display = 'block';
    });
  }

  // Pulsante “Cancelar” nel form Crear/Editar
  const cancelAddAloj = document.getElementById('cancelAddAloj');
  if (cancelAddAloj) {
    cancelAddAloj.addEventListener('click', () => {
      resetAlojForm();
      document.getElementById('formAddAlojModal').style.display = 'none';
    });
  }

  // Submit form “createAlojForm”
  const createAlojForm = document.getElementById('createAlojForm');
  if (createAlojForm) {
    createAlojForm.addEventListener('submit', handleCreateAlojamiento);
  }

  // Bottone logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Form upload immagine profilo
  const uploadForm = document.getElementById('uploadImageForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => handleImageUpload(e, uploadForm));
  }

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  setActiveNavItem();
  setupTabs();
});


/**
 * Ripristina i campi del form Create/Edit Alojamiento
 */
function resetAlojForm() {
  const fields = [
    'nombreAloj', 'direccionAloj', 'ciudadAloj', 'estadoAloj',
    'descripcionAloj', 'precioAloj', 'linkMapAloj', 'imageAlojInput'
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Campo nascosto per l’ID di editing
  document.getElementById('editAlojId').value = '';
  document.getElementById('alojModalTitle').textContent = 'Crear nuevo Alojamiento';

  // Ripristino `required` su file input
  const imgInput = document.getElementById('imageAlojInput');
  if (imgInput) imgInput.setAttribute('required', 'true');
}


/**
 * Carica e popola i dati dell’utente (GET /api/auth/me)
 */
async function loadUserProfile() {
  try {
    const response = await apiGet('/auth/me');
    if (!response.ok) throw new Error('Failed to load profile');

    const user = await response.json();

    // Popola i campi del form
    const nameInput = document.getElementById('editUserName');
    const surnameInput = document.getElementById('editUserSurname');
    const emailDisplay = document.getElementById('userEmailDisplay');

    if (nameInput) nameInput.value = user.nombre || '';
    if (surnameInput) surnameInput.value = user.apellidos || '';
    if (emailDisplay) emailDisplay.textContent = user.email || '—';

    const imgEl = document.getElementById('userImage');
    if (imgEl && user.imagen_perfil_ruta) {
      imgEl.src = user.imagen_perfil_ruta;
    }
  } catch (err) {
    console.error('Error loading user profile:', err);
    showAlert('Error al cargar datos del perfil', 'error');
  }
}


// ----------------------- RESET IMMAGINE PROFILO -----------------------

const resetImageBtn = document.getElementById('resetImageBtn');
if (resetImageBtn) {
  resetImageBtn.addEventListener('click', async () => {
    if (!confirm('¿Restablecer imagen de perfil a la predeterminada?')) return;

    try {
      const response = await apiPost('/auth/reset-profile-image');
      if (response.ok) {
        const data = await response.json();
        const imgEl = document.getElementById('userImage');
        if (imgEl) imgEl.src = data.default_image;
        showAlert('Imagen restablecida correctamente', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'Error al restablecer imagen', 'error');
      }
    } catch (error) {
      console.error('Reset image error:', error);
      showAlert('Error de red al restablecer imagen', 'error');
    }
  });
}


// --------------------- AGGIORNAMENTO PROFILO --------------------------

const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector('#profileForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    const nombre = document.getElementById('editUserName')?.value.trim() || '';
    const apellidos = document.getElementById('editUserSurname')?.value.trim() || '';

    try {
      const response = await apiPut('/auth/update-profile', {
        nombre,
        apellidos
      });

      if (response.ok) {
        showAlert('Perfil actualizado correctamente', 'success');
        await loadUserProfile();
      } else {
        const error = await response.json();
        showAlert(error.error || 'Error al actualizar perfil', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showAlert('Error de red al actualizar perfil', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar cambios';
      }
    }
  });
}

const cancelEditBtn = document.getElementById('cancelEditBtn');
if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', async () => {
    await loadUserProfile();
    showAlert('Cambios cancelados', 'info');
  });
}


// ----------------------- CARICAMENTO ALLOJAMIENTOS PROPRI -----------------------

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

      container.innerHTML = `
                <div class="row">
                    ${data.map(a => `
                        <div class="col col-md-4" style="margin-bottom:1rem;">
                            <div class="card">
                                <div class="card-img" style="height:180px; overflow:hidden;">
                                    <img src="${a.imagen_principal_ruta || 'https://via.placeholder.com/300x180'}"
                                         alt="Imagen de ${a.nombre}" />
                                </div>
                                <div class="card-body">
                                    <h3 class="card-title">${a.nombre}</h3>
                                    <div class="card-location">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        ${a.ciudad}
                                    </div>
                                    <div class="card-price">${formatPrice(a.precio_noche)}/noche</div>
                                    
                                    <div class="card-actions">
                                        <button class="action-btn edit-btn edit-aloj" data-id="${a.id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                            </svg>
                                            Editar
                                        </button>
                                        <button class="action-btn delete-btn delete-aloj" data-id="${a.id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

      // Listener per EDIT
      document.querySelectorAll('.edit-aloj').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          openEditModal(id);
        });
      });
      // Listener per DELETE
      document.querySelectorAll('.delete-aloj').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          handleDeleteAlojamiento(id);
        });
      });

    } else {
      container.innerHTML = '<p class="text-center">Error al cargar alojamientos.</p>';
    }
  } catch (err) {
    console.error('Error loadOwnerAlojamientos:', err);
    container.innerHTML = '<p class="text-center">Error de red al cargar alojamientos.</p>';
  } finally {
    hideSpinner('ownerAlojamientos');
  }
}


/**
 * Apre il modal per editare un Alojamiento, precompilando i campi
 */
async function openEditModal(id) {
  try {
    const response = await apiGet(`/alojamientos/${id}`);
    if (!response.ok) throw new Error('Error al cargar alojamiento');

    const property = await response.json();
    document.getElementById('nombreAloj').value = property.nombre;
    document.getElementById('direccionAloj').value = property.direccion;
    document.getElementById('ciudadAloj').value = property.ciudad;
    document.getElementById('estadoAloj').value = property.estado_o_pais;
    document.getElementById('descripcionAloj').value = property.descripcion;
    document.getElementById('precioAloj').value = property.precio_noche;
    // Rimuoviamo il required su image, perché esiste già un’immagine
    document.getElementById('imageAlojInput').removeAttribute('required');

    // Salviamo l’ID di editing
    document.getElementById('editAlojId').value = property.id;
    document.getElementById('alojModalTitle').textContent = 'Editar Alojamiento';
    document.getElementById('formAddAlojModal').style.display = 'block';

  } catch (error) {
    console.error('Error opening edit modal:', error);
    showAlert('Error al cargar los datos del alojamiento', 'error');
  }
}


/**
 * Cancella un Alojamiento (DELETE /api/alojamientos/<id>)
 */
async function handleDeleteAlojamiento(id) {
  if (!confirm('¿Estás seguro de eliminar este alojamiento? Se eliminarán todas las reservas e imágenes asociadas.')) {
    return;
  }

  try {
    const response = await apiDelete(`/alojamientos/${id}`);

    if (response.ok) {
      showAlert('Alojamiento eliminado correctamente', 'success');
      loadOwnerAlojamientos();
    } else {
      try {
        const errorData = await response.json();
        showAlert(errorData.error || 'Error al eliminar el alojamiento', 'error');
      } catch (e) {
        showAlert('Error desconocido al eliminar el alojamiento', 'error');
      }
    }
  } catch (error) {
    console.error('Eliminar alojamiento error:', error);
    showAlert('Error de red al eliminar el alojamiento', 'error');
  }
}


/**
 * Crea o aggiorna un Alojamiento (POST o PUT /api/alojamientos)
 * Genera automaticamente i link Google Maps (embed + share) basati su “dirección, ciudad, estado”
 */
async function handleCreateAlojamiento(event) {
  event.preventDefault();

  const submitBtn = document.querySelector('#createAlojForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }

  // 1) Raccolta dati dal form
  const nombre = document.getElementById('nombreAloj').value.trim();
  const direccion = document.getElementById('direccionAloj').value.trim();
  const ciudad = document.getElementById('ciudadAloj').value.trim();
  const estado = document.getElementById('estadoAloj').value.trim();
  const descripcion = document.getElementById('descripcionAloj').value.trim();
  const precio = document.getElementById('precioAloj').value;
  const imageInput = document.getElementById('imageAlojInput');
  const editId = document.getElementById('editAlojId').value;
  const isEditMode = !!editId;

  if (!nombre || !direccion || !ciudad || !estado || !descripcion || !precio) {
    showAlert('Completa todos los campos obligatorios', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
    return;
  }

  // 2) Creo la “fullAddress” per Google Maps
  const fullAddress = `${direccion}, ${ciudad}, ${estado}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  // 3) Genero gli URL di Google Maps
  const link_map_url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const link_map_embed = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}`;

  // 4) Upload immagine se ho un file nuovo
  let imagenPrincipalRuta = '';
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

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
        showAlert(err.error || 'Error al cargar la imagen', 'error');
        throw 'fail upload image';
      }
    } catch (err) {
      console.error('Error upload image alojamiento:', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar';
      }
      return;
    }
  }

  // 5) Compongo il payload JSON
  const payload = {
    nombre,
    direccion,
    ciudad,
    estado_o_pais: estado,
    descripcion,
    precio_noche: parseFloat(precio),
    link_map_embed,
    link_map_url
  };
  if (imagenPrincipalRuta) {
    payload.imagen_principal_ruta = imagenPrincipalRuta;
  }

  try {
    let response;
    if (isEditMode) {
      response = await apiPut(`/alojamientos/${editId}`, payload);
    } else {
      response = await apiPost('/alojamientos', payload);
    }

    if (response.ok) {
      showAlert(`Alojamiento ${isEditMode ? 'actualizado' : 'creado'} correctamente!`, 'success');
      resetAlojForm();
      document.getElementById('formAddAlojModal').style.display = 'none';
      loadOwnerAlojamientos();
    } else {
      const err = await response.json().catch(() => ({}));
      showAlert(err.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} el alojamiento`, 'error');
    }
  } catch (err) {
    console.error('Error save alojamiento:', err);
    showAlert('Error de red durante la operación', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
  }
}


// --------------------- CARICAMENTO RICHIESTE DI PRENOTAZIONE -----------------------

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
