// detail.js

let currentProperty = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Estrai l’ID dall’URL e carica i dettagli
  const params = new URLSearchParams(window.location.search);
  const idAloj = params.get('id');
  await loadPropertyDetail(idAloj);

  // 2) Controllo se l’utente è loggato (per abilitare i commenti)
  let isLogged = false;
  try {
    const respMe = await fetch('/api/auth/me', { credentials: 'include' });
    if (respMe.ok) {
      isLogged = true;
    }
  } catch (_) {
    isLogged = false;
  }
  setupCommentSection(isLogged);

  // 3) Imposta form prenotazione e caricamento commenti
  setupBookingForm();
  document.getElementById('bookingForm').addEventListener('submit', submitReservation);
  loadComments(idAloj);
});


/**
 * Carica i dettagli dell’alloggio e popola il DOM
 */
async function loadPropertyDetail(id) {
  const detailContainer = document.getElementById('propertyDetail');
  if (!detailContainer) return;

  showSpinner('propertyDetail', true);

  try {
    const response = await fetch(`/api/alojamientos/${id}`);
    if (!response.ok) {
      showAlert('Error al cargar detalles del alojamiento', 'error');
      return;
    }
    const property = await response.json();
    currentProperty = property; // salvo globalmente prezzo e altri dati

    // Render del markup della pagina
    detailContainer.innerHTML = `
      <div class="property-header">
        <h1 class="property-title">${property.nombre}</h1>
        <div class="property-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${property.direccion}, ${property.ciudad}, ${property.estado_o_pais}
        </div>
      </div>
      <div class="property-image">
        <img src="${property.imagen_principal_ruta || 'https://via.placeholder.com/800x400'}" alt="${property.nombre}">
      </div>
      <div class="property-content">
        <p class="property-price">€ ${parseFloat(property.precio_noche).toFixed(2)} / noche</p>
        <p class="property-description">${property.descripcion}</p>
        ${ property.link_map
            ? `<div class="property-map">
                 <iframe src="${property.link_map}" allowfullscreen></iframe>
               </div>`
            : ''
        }
      </div>
    `;
  } catch (err) {
    console.error('Error loadPropertyDetail:', err);
    showAlert('Error al cargar detalles del alojamiento', 'error');
  } finally {
    hideSpinner('propertyDetail');
  }
}


/**
 * Abilita o disabilita il pulsante di invio del commento
 */
function setupCommentSection(isLogged) {
  const submitBtn = document.getElementById('submitCommentBtn');
  const loginHint = document.getElementById('commentLoginHint');

  if (isLogged) {
    // Utente autenticato: abilito il bottone e nascondo il hint
    if (submitBtn) {
      submitBtn.removeAttribute('disabled');
      submitBtn.classList.remove('btn-disabled');
      submitBtn.addEventListener('click', postComment);
    }
    if (loginHint) {
      loginHint.style.display = 'none';
    }
  } else {
    // Utente anonimo: bottone spento, hint visibile, alert al click
    if (submitBtn) {
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.classList.add('btn-disabled');
      submitBtn.addEventListener('click', () => {
        alert('Debes iniciar sesión para publicar un comentario.');
      });
    }
    if (loginHint) {
      loginHint.style.display = 'block';
    }
  }
}


/**
 * Carica e mostra i commenti dell’alloggio
 */
async function loadComments(idAloj) {
  const container = document.getElementById('commentsContainer');
  if (!container) return;
  container.innerHTML = '<p class="text-center">Cargando comentarios...</p>';

  try {
    const resp = await fetch(`/api/alojamientos/${idAloj}/comments`, {
      credentials: 'include'
    });
    if (!resp.ok) {
      container.innerHTML = '<p class="text-center">No se pudieron cargar los comentarios.</p>';
      return;
    }
    const data = await resp.json();
    if (!data.length) {
      container.innerHTML = '<p class="text-center">Este alojamiento aún no tiene comentarios.</p>';
      return;
    }
    const html = data.map(c => `
      <div class="comment-card" style="border-bottom:1px solid #ddd; padding:0.75rem 0;">
        <p style="font-weight:600; margin:0;">
          ${sanitizeHTML(c.nombre_usuario)} ${sanitizeHTML(c.apellidos_usuario)}
          <span style="font-size:0.85rem; color:#888;">
            (${new Date(c.fecha_comentario).toLocaleDateString()})
          </span>
        </p>
        <p style="margin:0.25rem 0 0;">
          ${sanitizeHTML(c.texto)}
        </p>
      </div>
    `).join('');
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loadComments:', err);
    container.innerHTML = '<p class="text-center">Error de red al cargar comentarios.</p>';
  }
}

function sanitizeHTML(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


/**
 * Invia un nuovo commento al backend
 */
async function postComment() {
  const textarea = document.getElementById('commentTextarea');
  const content  = textarea.value.trim();
  const params   = new URLSearchParams(window.location.search);
  const idAloj   = params.get('id');

  if (!content) {
    alert('El comentario no puede estar vacío.');
    return;
  }

  const btn = document.getElementById('submitCommentBtn');
  btn.disabled = true;
  btn.textContent = 'Publicando…';

  try {
    const resp = await fetch(`/api/alojamientos/${idAloj}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: content })
    });
    if (resp.ok) {
      textarea.value = '';
      showAlert('Comentario publicado con éxito', 'success');
      loadComments(idAloj);
    } else {
      const errData = await resp.json().catch(() => ({}));
      showAlert(errData.error || 'Error al publicar comentario', 'error');
    }
  } catch (err) {
    console.error('Error postComment:', err);
    showAlert('Error de red al publicar comentario', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar comentario';
  }
}


/**
 * Imposta il form di prenotazione:
 *  - date minime (oggi)
 *  - calcolo dinamico del prezzo totale
 */
function setupBookingForm() {
  const fechaInicioEl = document.getElementById('fechaInicio');
  const fechaFinEl    = document.getElementById('fechaFin');
  const totalDisplay  = document.getElementById('totalPriceDisplay');
  if (!fechaInicioEl || !fechaFinEl || !totalDisplay) return;

  const pricePerNight = parseFloat(currentProperty.precio_noche);

  // Impedisci date nel passato
  const today = new Date().toISOString().split('T')[0];
  fechaInicioEl.setAttribute('min', today);
  fechaFinEl.setAttribute('min', today);

  [fechaInicioEl, fechaFinEl].forEach(elem => {
    elem.addEventListener('change', () => {
      const start = new Date(fechaInicioEl.value);
      const end   = new Date(fechaFinEl.value);

      if (!fechaInicioEl.value || !fechaFinEl.value) {
        totalDisplay.textContent = 'Precio total: € 0.00';
        return;
      }
      if (end <= start) {
        document.getElementById('fechaFinError').textContent =
          'La fecha de salida debe ser posterior a la de llegada';
        totalDisplay.textContent = 'Precio total: € 0.00';
        return;
      } else {
        document.getElementById('fechaFinError').textContent = '';
      }

      const oneDay = 24 * 60 * 60 * 1000;
      const diff   = Math.round((end - start) / oneDay);
      const total  = (pricePerNight * diff).toFixed(2);
      totalDisplay.textContent = `Precio total: € ${total}`;
    });
  });
}


/**
 * Invia la prenotazione al backend
 */
async function submitReservation(e) {
  e.preventDefault();
  const startVal = document.getElementById('fechaInicio').value;
  const endVal   = document.getElementById('fechaFin').value;
  if (!startVal || !endVal) {
    showAlert('Selecciona fechas válidas', 'error');
    return;
  }
  const s = new Date(startVal);
  const f = new Date(endVal);
  if (f <= s) {
    showAlert('La fecha de salida debe ser posterior a la de llegada', 'error');
    return;
  }
  const oneDay   = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((f - s) / oneDay);
  const total    = (parseFloat(currentProperty.precio_noche) * diffDays).toFixed(2);

  if (!confirm(`Vas a reservar ${diffDays} noches. Total a pagar: € ${total}. ¿Continuar?`)) {
    return;
  }

  try {
    const resp = await fetch('/api/reservas', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        id_alojamiento: currentProperty.id,
        fecha_inicio: startVal,
        fecha_fin: endVal
      })
    });
    if (resp.ok) {
      showAlert('Reserva creada con éxito!', 'success');
      document.getElementById('bookingForm').reset();
      document.getElementById('totalPriceDisplay').textContent = 'Precio total: € 0.00';
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(err.error || 'Error al crear la reserva', 'error');
    }
  } catch (err) {
    console.error('Error create reserva:', err);
    showAlert('Error de red al crear la reserva', 'error');
  }
}


/**
 * Funzione di utilità per mostrare alert (utilizza #alertContainer nel DOM)
 */
function showAlert(message, type='success') {
  const container = document.getElementById('alertContainer');
  if (!container) return;
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  container.innerHTML = '';
  container.appendChild(alertDiv);
  setTimeout(() => {
    if (alertDiv.parentNode === container) {
      container.removeChild(alertDiv);
    }
  }, 5000);
}

/**
 * Spinner (predefinito)
 */
function showSpinner(id, dark=false) {
  const el = document.getElementById(id);
  if (!el) return;
  const spinner = document.createElement('div');
  spinner.className = dark ? 'spinner spinner-dark' : 'spinner';
  spinner.id = `${id}-spinner`;
  el.appendChild(spinner);
}

function hideSpinner(id) {
  const spinner = document.getElementById(`${id}-spinner`);
  if (spinner && spinner.parentNode) {
    spinner.parentNode.removeChild(spinner);
  }
}
