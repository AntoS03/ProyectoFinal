/**
 * detail.js
 * Gestisce caricamento dettagli alloggio, commenti e booking interattivo.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Aggiorna navbar (mostra Mi Perfil / logout se autenticato)
  await updateNavigation();

  // 2) Prendo l’ID dell’alloggio dalla query string
  const params = new URLSearchParams(window.location.search);
  const alojId = params.get('id');
  if (!alojId) {
    showAlert('Alojamiento no encontrado (ID mancante)', 'error');
    return;
  }

  // 3) Carico e mostro i dettagli dell’alloggio
  await loadPropertyDetail(alojId);

  // 4) Carico i commenti esistenti
  await loadComments(alojId);

  // 5) Metto in piedi il carousel commenti (← e →)
  setupCommentsCarousel();

  // 6) Controllo se l’utente è loggato e, in caso affermativo, mostro il form per lasciare commento
  await setupAddComment(alojId);

  // 7) Inizializzo la logica di booking interattivo
  initializeBookingWidget(alojId);

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => navMenu.classList.toggle('active'));
  }
});


/**
 * Carica dettagli dell’alloggio e costruisce l’HTML corrispondente.
 */
async function loadPropertyDetail(id) {
  const container = document.getElementById('propertyDetail');
  container.innerHTML = '<p>Cargando detalles...</p>';

  try {
    const resp = await apiGet(`/alojamientos/${id}`);
    if (!resp.ok) {
      showAlert('Error al cargar detalles del alojamiento', 'error');
      container.innerHTML = `<p class="text-center">Alojamiento no encontrado.</p>`;
      return;
    }
    const a = await resp.json();

    // Immagine principale (o placeholder se manca)
    const mainImg = a.imagen_principal_ruta || 'https://via.placeholder.com/600x400?text=Sin+Imagen';

    // Costruisco l’HTML
    container.innerHTML = `
      <div class="detail-images">
        <img src="${mainImg}" alt="Imagen de ${a.nombre}" id="mainAlojImage" />
      </div>
      <div class="detail-info">
        <div>
          <h1 class="detail-title">${a.nombre}</h1>
          <div class="detail-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${a.direccion}, ${a.ciudad} ${a.estado_o_pais || ''}
          </div>
          <div class="detail-price">${formatPrice(a.precio_noche)} / noche</div>
        </div>

        <div class="detail-description">
          <h3>Descripción</h3>
          <p>${a.descripcion}</p>
        </div>

        <div class="booking-widget" id="bookingWidget">
          <h3>Reservar este alojamiento</h3>
          <div class="booking-row">
            <div class="booking-field">
              <label for="fechaInicio">Fecha de llegada *</label>
              <input type="date" id="fechaInicio" required />
            </div>
            <div class="booking-field">
              <label for="fechaFin">Fecha de salida *</label>
              <input type="date" id="fechaFin" required />
            </div>
            <div class="booking-field">
              <label>N° Noches</label>
              <div class="nights-counter">
                <button type="button" id="decNights">−</button>
                <span id="numNights">1</span>
                <button type="button" id="incNights">+</button>
              </div>
            </div>
          </div>
          <button class="btn btn-primary book-submit" id="bookBtn">Reservar ahora</button>
        </div>
      </div>
    `;

    // Imposto datepicker: oggi e domani come default, con min=oggi
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];

    const startInput = document.getElementById('fechaInicio');
    const endInput   = document.getElementById('fechaFin');

    startInput.value = today;
    startInput.min   = today;

    endInput.value = tomorrow;
    endInput.min   = tomorrow;

  } catch (err) {
    console.error('Error loadPropertyDetail:', err);
    container.innerHTML = `<p class="text-center">Error de red al cargar detalles.</p>`;
  }
}


/**
 * Carica i commenti esistenti (GET /alojamientos/:id/comentarios)
 */
async function loadComments(alojId) {
  const carousel = document.getElementById('commentsCarousel');
  carousel.innerHTML = '<p>Cargando comentarios...</p>';

  try {
    const resp = await apiGet(`/alojamientos/${alojId}/comentarios`);
    if (!resp.ok) {
      carousel.innerHTML = `<p class="text-center">No se han encontrado comentarios.</p>`;
      return;
    }
    const data = await resp.json();
    if (data.length === 0) {
      carousel.innerHTML = `<p class="text-center">Aun no hay comentarios. ¡Sé el primero!</p>`;
      return;
    }

    // Costruisco ogni “card” commento
    carousel.innerHTML = data.map(c => `
      <div class="comment-card">
        <div class="comment-header">
          <span class="comment-author">${c.author_nombre} ${c.author_apellidos}</span>
          <span class="comment-date">${c.date}</span>
        </div>
        <div class="comment-text">${c.texto}</div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loadComments:', err);
    carousel.innerHTML = `<p class="text-center">Error al cargar comentarios.</p>`;
  }
}


/**
 * Imposta i bottoni “←” e “→” per scorrere orizzontalmente i commenti
 */
function setupCommentsCarousel() {
  const carousel = document.getElementById('commentsCarousel');
  const prevBtn  = document.getElementById('prevComment');
  const nextBtn  = document.getElementById('nextComment');
  if (!carousel || !prevBtn || !nextBtn) return;

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -300, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 300, behavior: 'smooth' });
  });
}


/**
 * Se l’utente è loggato, mostra un form per aggiungere un commento.
 * POST /alojamientos/:id/comentarios
 */
async function setupAddComment(alojId) {
  try {
    const resp = await apiGet('/auth/me');
    if (!resp.ok) {
      // Non loggato: non mostro niente
      return;
    }
    // Utente autenticato: mostro il form
    const user = await resp.json();
    const container = document.getElementById('addCommentSection');
    container.innerHTML = `
      <h4>Deja tu comentario</h4>
      <textarea id="newCommentText" rows="4" placeholder="Escribe algo..." ></textarea>
      <button id="submitCommentBtn" class="btn btn-primary">Publicar Comentario</button>
    `;

    document.getElementById('submitCommentBtn').addEventListener('click', async () => {
      const texto = document.getElementById('newCommentText').value.trim();
      if (!texto) {
        showAlert('Escribe un comentario antes de enviar', 'error');
        return;
      }
      try {
        const postResp = await apiPost(`/alojamientos/${alojId}/comentarios`, { texto });
        if (postResp.ok) {
          showAlert('Comentario publicado', 'success');
          document.getElementById('newCommentText').value = '';
          // Ricarico i commenti per mostrare subito il nuovo
          await loadComments(alojId);
        } else {
          const errData = await postResp.json();
          showAlert(errData.error || 'Error al publicar comentario', 'error');
        }
      } catch (err) {
        console.error('Error posting comentario:', err);
        showAlert('Error de red al publicar comentario', 'error');
      }
    });
  } catch (err) {
    console.error('setupAddComment error:', err);
  }
}


/**
 * Logica per il booking interattivo:
 * - Datepicker con min=today per “fechaInicio” e “fechaFin”
 * - Contatore notti che aggiorna la data di fine
 * - POST /reservas
 */
function initializeBookingWidget(alojId) {
  const startInput = document.getElementById('fechaInicio');
  const endInput   = document.getElementById('fechaFin');
  const decBtn     = document.getElementById('decNights');
  const incBtn     = document.getElementById('incNights');
  const nightsEl   = document.getElementById('numNights');
  const bookBtn    = document.getElementById('bookBtn');

  if (!startInput || !endInput || !decBtn || !incBtn || !nightsEl || !bookBtn) return;

  // Calcola la differenza di notti fra le due date
  function calculateNights() {
    const d1 = new Date(startInput.value);
    const d2 = new Date(endInput.value);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  // Quando cambia “fechaInicio”, aggiorno il min di “fechaFin”
  startInput.addEventListener('change', () => {
    const d1 = new Date(startInput.value);
    const newMin = new Date(d1.getTime() + 24*60*60*1000);
    endInput.min = newMin.toISOString().split('T')[0];

    if (new Date(endInput.value) <= d1) {
      endInput.value = newMin.toISOString().split('T')[0];
    }
    nightsEl.textContent = calculateNights();
  });

  // Quando cambia “fechaFin”, ricalcolo le notti
  endInput.addEventListener('change', () => {
    const num = calculateNights();
    if (num < 1) {
      // Se data fine non valida (≤ inizio), resetto a 1 notte
      const d1 = new Date(startInput.value);
      const d2 = new Date(d1.getTime() + 24*60*60*1000);
      endInput.value = d2.toISOString().split('T')[0];
      nightsEl.textContent = 1;
    } else {
      nightsEl.textContent = num;
    }
  });

  // Pulsante “−” notte
  decBtn.addEventListener('click', () => {
    let num = parseInt(nightsEl.textContent);
    if (num <= 1) return;
    num--;
    nightsEl.textContent = num;

    const d1 = new Date(startInput.value);
    const newEnd = new Date(d1.getTime() + num * 24*60*60*1000);
    endInput.value = newEnd.toISOString().split('T')[0];
  });

  // Pulsante “+” notte
  incBtn.addEventListener('click', () => {
    let num = parseInt(nightsEl.textContent) + 1;
    nightsEl.textContent = num;

    const d1 = new Date(startInput.value);
    const newEnd = new Date(d1.getTime() + num * 24*60*60*1000);
    endInput.value = newEnd.toISOString().split('T')[0];
  });

  // Inizializzo notti al caricamento
  nightsEl.textContent = calculateNights();

  // Bottone “Reservar ahora”
  bookBtn.addEventListener('click', async () => {
    const fechaInicio = startInput.value;
    const fechaFin    = endInput.value;
    if (!fechaInicio || !fechaFin) {
      showAlert('Selecciona fechas válidas', 'error');
      return;
    }
    const payload = {
      id_alojamiento: parseInt(alojId),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    };
    try {
      const resp = await apiPost('/reservas', payload);
      if (resp.ok) {
        const data = await resp.json();
        showAlert(`Reserva creada (ID: ${data.id})`, 'success');
      } else {
        const err = await resp.json();
        showAlert(err.error || 'Error al crear reserva', 'error');
      }
    } catch (err) {
      console.error('Error booking:', err);
      showAlert('Error de red al crear reserva', 'error');
    }
  });
}
