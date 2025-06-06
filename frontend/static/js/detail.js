/**
 * detail.js
 * Gestisce il caricamento del dettaglio di un Alojamiento, del form di prenotazione,
 * del caricamento dei commenti e della sezione per pubblicarne di nuovi.
 *
 * Assicura anche che il “navbar” mostri Iniciar Sesión/Registrarse oppure Mi Perfil/Cerrar sesión,
 * richiamando `updateNavigation()` definita in fetch-api.js.
 */

let propertyData = null;     // Conterrà i dati dell’alloggio
let commentsData = [];       // Conterrà i commenti caricati
let currentUser = null;      // Se loggato, conterrà { id_usuario, nombre, apellidos, email, imagen_perfil_ruta }

/**
 * Viene eseguito quando la pagina è pronta.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1) POPOLA NAVBAR (funzione definita in fetch-api.js)
  await updateNavigation();

  // 2) Recupera l'ID dall'URL
  const params = new URLSearchParams(window.location.search);
  const alojId = params.get('id');
  if (!alojId) {
    showAlert('Alojamiento no encontrado (ID faltante).', 'error');
    return;
  }

  // 3) Carica i dati dell'alloggio
  await loadAlojamientoDetail(alojId);

  // 4) Carica i commenti esistenti
  await loadComments(alojId);

  // 5) Imposta i listener del form di commento
  setupCommentForm(alojId);

  // 6) Imposta il form di prenotazione
  setupBookingForm(alojId);
});


/**
 * Carica le informazioni dell’alloggio e le inserisce nell’HTML.
 * Usa GET /api/alojamientos/<id>
 */
async function loadAlojamientoDetail(id) {
  const mainContainer = document.getElementById('detailMain');
  mainContainer.innerHTML = '<p>Cargando detalles...</p>';

  try {
    const resp = await apiGet(`/alojamientos/${id}`);
    if (!resp.ok) {
      mainContainer.innerHTML = `<p class="text-center">No se pudo cargar el alojamiento.</p>`;
      return;
    }
    const data = await resp.json();
    propertyData = data;

    // Costruisco il markup: titolo, galleria (se serve), descrizione, ecc.
    let html = `
      <h1>${data.nombre}</h1>
      <p style="color: var(--color-text-light); margin-bottom: 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             style="vertical-align:middle; margin-right:4px;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${data.ciudad}, ${data.estado_o_pais}
      </p>
      <div class="property-image" style="margin-bottom:1rem; border-radius: var(--border-radius); overflow:hidden;">
        <img src="${data.imagen_principal_ruta || 'https://via.placeholder.com/800x400'}" alt="Imagen principal de ${data.nombre}">
      </div>
      <div class="property-description" style="margin-bottom:2rem;">
        <h3>Descripción</h3>
        <p>${data.descripcion}</p>
      </div>
      <div class="property-info" style="margin-bottom:2rem;">
        <h3>Información</h3>
        <p><strong>Dirección:</strong> ${data.direccion}</p>
        <p><strong>Precio por noche:</strong> € ${parseFloat(data.precio_noche).toFixed(2)}</p>
      </div>

      <!-- 1) IFRAME Google Maps (se esiste link_map_embed) -->
      ${data.link_map_embed ? `
      <div id="mapContainer">
        <iframe
          width="100%"
          height="400"
          frameborder="0"
          style="border:0"
          src="${data.link_map_embed}"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <div style="text-align:center;">
          <a id="mapShareBtn"
             href="${data.link_map_url}"
             target="_blank"
             rel="noopener noreferrer"
             class="btn btn-outline"
             style="display:inline-block; margin-top:0.5rem;">
            Ver en Google Maps
          </a>
        </div>
      </div>
      ` : ''}
    `;
    mainContainer.innerHTML = html;

    // Aggiorniamo i breadcrumbs
    const bc = document.getElementById('breadcrumbs');
    if (bc) {
      bc.innerHTML = `
        <a href="search.html">Buscar</a>
        <span>&gt;</span>
        <span class="current">${data.nombre}</span>
      `;
    }

  } catch (error) {
    console.error('Error loadAlojamientoDetail:', error);
    mainContainer.innerHTML = `<p class="text-center">Error de red al cargar detalles.</p>`;
  }
}


/**
 * Carica i commenti associati all’alloggio (GET /api/alojamientos/<id>/comments)
 * Li inserisce in #commentsList, mostrando al massimo 5 commenti e aggiungendo
 * un pulsante “Ver más” se ce ne sono altri.
 */
async function loadComments(id) {
  const container = document.getElementById('commentsList');
  container.innerHTML = '<p>Cargando comentarios...</p>';
  try {
    const resp = await fetch(`/api/alojamientos/${id}/comments`);
    if (!resp.ok) {
      container.innerHTML = '<p class="text-center">No se pudo cargar los comentarios.</p>';
      return;
    }
    const data = await resp.json();
    commentsData = data; // memorizzo localmente tutti i commenti
    renderComments(5);   // mostro inizialmente 5 commenti
  } catch (error) {
    console.error('Error loadComments:', error);
    container.innerHTML = '<p class="text-center">Error de red al cargar comentarios.</p>';
  }
}

/**
 * Mostra i primi `count` commenti (o tutti se ce ne sono di meno), incluse stelle e testo.
 * Se ci sono più commenti, aggiunge un pulsante “Ver más” per caricare altri 5 alla volta.
 */
function renderComments(count) {
  const container = document.getElementById('commentsList');
  container.innerHTML = '';

  if (commentsData.length === 0) {
    container.innerHTML = '<p class="text-center">Este alojamiento aún no tiene comentarios.</p>';
    return;
  }

  // Determino quanti commenti mostrare
  const toShow = commentsData.slice(0, count);
  toShow.forEach(c => {
    const fecha = new Date(c.fecha_comentario).toLocaleDateString('es-ES');
    const estrellas = c.puntuacion
      ? '★'.repeat(c.puntuacion) + '☆'.repeat(5 - c.puntuacion)
      : '';
    const htmlItem = `
      <div class="comment-item">
        <p style="margin-bottom: 0.25rem;">
          <strong>${c.nombre_usuario} ${c.apellidos_usuario}</strong>
          ${estrellas ? `<span class="rating-stars">${estrellas}</span>` : ''}
        </p>
        <p style="font-size: 0.875rem; color: var(--color-text-light); margin-bottom: 0.5rem;">
          ${fecha}
        </p>
        <p>${c.texto}</p>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', htmlItem);
  });

  // Se ci sono altri commenti non ancora mostrati, aggiungo “Ver más”
  if (commentsData.length > count) {
    container.insertAdjacentHTML('beforeend', `
      <div style="text-align: center; margin-top: 1rem;">
        <button id="loadMoreCommentsBtn" class="btn btn-outline">Ver más</button>
      </div>
    `);
    document.getElementById('loadMoreCommentsBtn').addEventListener('click', () => {
      renderComments(count + 5);
    });
  }
}


/**
 * Imposta il form per aggiungere un nuovo commento.
 * Il pulsante verrà abilitato solo se l’utente è loggato.
 */
async function setupCommentForm(alojId) {
  const commentBtn = document.getElementById('postCommentBtn');
  const textArea  = document.getElementById('newCommentText');
  const ratingSel = document.getElementById('newCommentRating');

  // Verifico se l’utente è loggato (usando /auth/me)
  try {
    const respUser = await apiGet('/auth/me');
    if (respUser.ok) {
      currentUser = await respUser.json();
      commentBtn.disabled = true;
      // Abilito il pulsante solo quando c’è testo
      textArea.addEventListener('input', () => {
        commentBtn.disabled = textArea.value.trim().length === 0;
      });
    } else {
      // Utente non loggato: disabilito il bottone e mostro alert al click
      currentUser = null;
      commentBtn.disabled = true;
      commentBtn.addEventListener('click', () => {
        showAlert('Debes iniciar sesión para publicar un comentario.', 'warning');
      });
    }
  } catch (err) {
    console.error('Error checking login state:', err);
    currentUser = null;
    commentBtn.disabled = true;
    commentBtn.addEventListener('click', () => {
      showAlert('Debes iniciar sesión para publicar un comentario.', 'warning');
    });
  }

  // Se l’utente è loggato, invio POST /api/alojamientos/<id>/comments
  commentBtn.addEventListener('click', async () => {
    const texto = textArea.value.trim();
    const puntuacion = ratingSel.value ? parseInt(ratingSel.value) : null;

    if (!currentUser) {
      showAlert('Debes iniciar sesión para publicar comentarios.', 'warning');
      return;
    }
    if (!texto) {
      showAlert('El comentario no puede estar vacío.', 'error');
      return;
    }

    try {
      const resp = await fetch(`/api/alojamientos/${alojId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, puntuacion })
      });
      if (!resp.ok) {
        const errJson = await resp.json();
        showAlert(errJson.error || 'Error al publicar comentario', 'error');
        return;
      }
      showAlert('Comentario publicado correctamente', 'success');
      textArea.value = '';
      ratingSel.value = '';
      commentBtn.disabled = true;
      // Ricarico i commenti
      await loadComments(alojId);
    } catch (error) {
      console.error('Error posting comment:', error);
      showAlert('Error de red al publicar comentario', 'error');
    }
  });
}


/**
 * Imposta il form di prenotazione: selettori di data e calcolo del prezzo totale.
 * - “Fecha Inicio” è un <input type="date"> (con min → oggi)
 * - “N° de noches” è un contatore (+/−) e imposta dinamicamente la “Fecha Fin”
 * - Calcola il prezzo totale e lo mostra in tempo reale
 */
function setupBookingForm(alojId) {
  const bookingContainer = document.getElementById('bookingSection');
  if (!propertyData) {
    bookingContainer.innerHTML = '';
    return;
  }

  // Data minima = oggi (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  bookingContainer.innerHTML = `
    <div class="booking-form">
      <h3>Reserva este alojamiento</h3>
      <div class="form-group booking-date">
        <label for="startDate">Fecha de inicio</label>
        <input type="date" id="startDate" class="form-control" min="${today}" />
      </div>
      <div class="form-group" style="margin-top:0.75rem;">
        <label for="nightsCount">Número de noches</label>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="decrementNights" class="btn btn-outline">−</button>
          <span id="nightsDisplay">1</span>
          <button id="incrementNights" class="btn btn-outline">+</button>
        </div>
      </div>
      <div class="form-group booking-date" style="margin-top:0.75rem;">
        <label for="endDate">Fecha de fin</label>
        <input type="date" id="endDate" class="form-control" disabled />
      </div>
      <div style="margin-top:1rem; font-weight:600;">
        Precio total: <span id="totalPrice">€ 0.00</span>
      </div>
      <button id="reserveBtn" class="btn btn-primary btn-block" style="margin-top:1.5rem;">Reservar</button>
    </div>
  `;

  const precioPorNoche = parseFloat(propertyData.precio_noche || 0);
  const startDateInput = document.getElementById('startDate');
  const endDateInput   = document.getElementById('endDate');
  const nightsDisplay  = document.getElementById('nightsDisplay');
  const incrBtn        = document.getElementById('incrementNights');
  const decrBtn        = document.getElementById('decrementNights');
  const totalPriceSpan = document.getElementById('totalPrice');
  const reserveBtn     = document.getElementById('reserveBtn');

  // Inizializzo con oggi + 1 notte
  let nightsCount = 1;
  nightsDisplay.textContent = nightsCount;
  startDateInput.value = today;
  updateEndDateAndPrice();

  // Se si cambia data di inizio, aggiorno la data di fine in base a nightsCount
  startDateInput.addEventListener('change', () => {
    const sd = new Date(startDateInput.value);
    const minDate = new Date(today);
    if (sd < minDate || isNaN(sd.getTime())) {
      startDateInput.value = today;
    }
    updateEndDateAndPrice();
  });

  // Incremeto/decremento notti
  incrBtn.addEventListener('click', () => {
    nightsCount++;
    nightsDisplay.textContent = nightsCount;
    updateEndDateAndPrice();
  });
  decrBtn.addEventListener('click', () => {
    if (nightsCount > 1) {
      nightsCount--;
      nightsDisplay.textContent = nightsCount;
      updateEndDateAndPrice();
    }
  });

  // Funzione per aggiornare “Fecha Fin” e “Precio total”
  function updateEndDateAndPrice() {
    const sd = new Date(startDateInput.value);
    if (isNaN(sd.getTime())) {
      endDateInput.value = '';
      totalPriceSpan.textContent = '€ 0.00';
      return;
    }
    const ed = new Date(sd);
    ed.setDate(ed.getDate() + nightsCount);
    const isoFin = ed.toISOString().split('T')[0];
    endDateInput.value = isoFin;

    const total = precioPorNoche * nightsCount;
    totalPriceSpan.textContent = `€ ${total.toFixed(2)}`;
  }

  // Gestione click “Reservar” (POST /api/reservas)
  reserveBtn.addEventListener('click', async () => {
    const fecha_inicio = startDateInput.value;
    const fecha_fin = endDateInput.value;
    if (!fecha_inicio || !fecha_fin) {
      showAlert('Selecciona una fecha de inicio válida.', 'error');
      return;
    }

    // Controllo se è loggato (simile a before)
    let isLoggedIn = false;
    try {
      const resp = await apiGet('/auth/me');
      isLoggedIn = resp.ok;
    } catch {
      isLoggedIn = false;
    }
    if (!isLoggedIn) {
      showAlert('Debes iniciar sesión para reservar.', 'warning');
      return;
    }

    // Invio richiesta
    try {
      const resp = await fetch(`/api/reservas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_alojamiento: parseInt(alojId),
          fecha_inicio,
          fecha_fin
        })
      });
      if (resp.ok) {
        showAlert('Reserva creada correctamente', 'success');
      } else {
        const err = await resp.json();
        showAlert(err.error || 'Error al crear reserva', 'error');
      }
    } catch (error) {
      console.error('Error creating reserva:', error);
      showAlert('Error de red al crear reserva', 'error');
    }
  });
}
