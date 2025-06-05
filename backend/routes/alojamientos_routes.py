#alojamientos_routes
import os
from flask import Blueprint, request, jsonify, session, current_app
from extensions import db
from models import Alojamiento, Reserva, Comentario, ImagenAlojamiento
from sqlalchemy import and_
from utils import login_required
from werkzeug.utils import secure_filename

alojamientos_bp = Blueprint('alojamientos', __name__)

# Search properties with filters
@alojamientos_bp.route('/', methods=['GET'])
def search_alojamientos():
    """
    GET /alojamientos
    Restituisce la lista di alloggi, con filtri opzionali su 'ciudad' e 'precioMax'.
    Disponibile anche a utenti non autenticati.
    """
    ciudad = request.args.get('ciudad', type=str)
    precio_max = request.args.get('precioMax', type=float)

    query = Alojamiento.query

    if ciudad:
        query = query.filter(Alojamiento.ciudad.ilike(f'%{ciudad}%'))
    if precio_max is not None:
        query = query.filter(Alojamiento.precio_noche <= precio_max)

    alojamientos = query.all()

    result = []
    for a in alojamientos:
        result.append({
            'id': a.id_alojamiento,
            'nombre': a.nombre,
            'ciudad': a.ciudad,
            'precio_noche': float(a.precio_noche),
            'imagen_principal_ruta': a.imagen_principal_ruta
        })

    return jsonify(result), 200

# Property details
@alojamientos_bp.route('/<int:id>', methods=['GET'])
def detail_alojamiento(id):
    """
    Endpoint: GET /alojamientos/<id>
    Restituisce i dettagli di un singolo alloggio.
    Disponibile anche a utenti non autenticati.
    """
    a = Alojamiento.query.get(id)
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404
    
    # Costruiamo la risposta con tutti i campi chiave
    resp = {
        'id': a.id_alojamiento,
        'nombre': a.nombre,
        'direccion': a.direccion,
        'ciudad': a.ciudad,
        'estado_o_pais': a.estado_o_pais,
        'descripcion': a.descripcion,
        'precio_noche': float(a.precio_noche),
        'imagen_principal_ruta': a.imagen_principal_ruta,
        'link_map': a.link_map
    }
    return jsonify(resp), 200

# Create property
@alojamientos_bp.route('/', methods=['POST'])
@login_required
def create_alojamiento():
    """
    Endpoint: POST /alojamientos
    Richiede token (utente loggato). Crea un nuovo alloggio.
    Body (JSON) es.:
      {
        "nombre": "Casa Azul",
        "direccion": "Calle Falsa 123",
        "ciudad": "Madrid",
        "estado_o_pais": "España",
        "descripcion": "Bella casa...",
        "precio_noche": 80.50,
        "imagen_principal_ruta": "https://...jpg",
        "link_map": "https://maps.google.com/..."
      }
    Risposta 201: { "message": "Alojamiento creado", "id": <id_nuovo> }
    """
    data = request.get_json()
    user_id = session['user_id']  # ID dell'utente autenticato
    
    # Controllo campi obbligatori
    obbligatori = ['nombre', 'direccion', 'ciudad', 'estado_o_pais', 'descripcion', 'precio_noche', 'imagen_principal_ruta']
    if not data or not all(key in data for key in obbligatori):
        return jsonify({'msg': 'Faltan campos obligatorios'}), 400
    
    # Creo l’oggetto Alojamiento
    a = Alojamiento(
        id_propietario=user_id,
        nombre=data['nombre'],
        direccion=data['direccion'],
        ciudad=data['ciudad'],
        estado_o_pais=data['estado_o_pais'],
        descripcion=data['descripcion'],
        precio_noche=data['precio_noche'],
        imagen_principal_ruta=data['imagen_principal_ruta'],
        link_map=data.get('link_map')
    )
    db.session.add(a)
    db.session.commit()

    return jsonify({'message': 'Alojamiento creado', 'id': a.id_alojamiento}), 201

# NOTA: gli endpoint di modifica/eliminazione di alloggio richiederebbero token admin.
# Poiché ora ignoriamo gli admin, li lasciamo “stub” commentati o li blocchiamo restituendo 403.

# Edit property (only from owner)
@alojamientos_bp.route('/<int:id>', methods=['PUT'])
@login_required
def edit_alojamiento(id):
    """
    Endpoint: PUT /alojamientos/<id>
    Solo il proprietario dell'alloggio può modificarlo.
    """
    user_id = session['user_id']
    a = Alojamiento.query.get(id)
    
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    if a.id_propietario != user_id:
        return jsonify({'msg': 'No autorizado'}), 403

    data = request.get_json()

    # Aggiorno campi ammessi
    for field in ['nombre', 'direccion', 'ciudad', 'estado_o_pais', 
                 'descripcion', 'precio_noche', 'imagen_principal_ruta', 
                 'link_map']:
        if field in data:
            setattr(a, field, data[field])

    db.session.commit()
    return jsonify({'message': 'Alojamiento actualizado'}), 200

# Delete property
@alojamientos_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_alojamiento(id):
    user_id = session['user_id']
    a = Alojamiento.query.get(id)
    
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    if a.id_propietario != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    try:
        # 1. Elimina tutte le immagini associate
        ImagenAlojamiento.query.filter_by(id_alojamiento=id).delete()
        
        # 2. Elimina tutti i commenti associati
        Comentario.query.filter_by(id_alojamiento=id).delete()
        
        # 3. Elimina tutte le prenotazioni associate
        Reserva.query.filter_by(id_alojamiento=id).delete()
        
        # 4. Finalmente elimina l'alojamiento
        db.session.delete(a)
        db.session.commit()
        
        return jsonify({'message': 'Alojamiento eliminado correctamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error deleting property: {str(e)}')
        return jsonify({'error': 'Error al eliminar el alojamiento'}), 500

def allowed_aloj_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', set())

@alojamientos_bp.route('/upload-image', methods=['POST'])
def upload_alojamiento_image():
    """
    POST /alojamientos/upload-image
    Riceve multipart/form-data con campo 'image', lo salva su disco e ritorna
    { 'imagen_principal_ruta': '<percorso_relativo>' } in JSON.
    """

    # 1) Controllo che ci sia la sessione (utente loggato)
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Autenticazione richiesta'}), 401

    # 2) Controllo il file
    if 'image' not in request.files:
        return jsonify({'error': 'Nessun file inviato'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nome file non valido'}), 400

    if not allowed_aloj_file(file.filename):
        return jsonify({'error': 'Formato immagine non consentito'}), 400

    # 3) Costruisco il nome “sicuro”
    filename = secure_filename(file.filename)
    prefix = f"user_{user_id}_"
    filename = prefix + filename

    # 4) Partecipo la cartella di destinazione
    upload_folder = current_app.config.get('UPLOAD_ALOJ_FOLDER')
    if not upload_folder:
        return jsonify({'error': 'Configurazione cartella upload mancante'}), 500

    try:
        # Assicurati che la cartella esista
        os.makedirs(upload_folder, exist_ok=True)
    except Exception as e:
        current_app.logger.error(f"Impossibile creare cartella {upload_folder}: {e}")
        return jsonify({'error': 'Errore interno creazione cartella'}), 500

    save_path = os.path.join(upload_folder, filename)

    try:
        file.save(save_path)
    except Exception as e:
        current_app.logger.error(f"Errore salvataggio immagine alojamiento su {save_path}: {e}")
        return jsonify({'error': 'Errore interno durante il salvataggio del file'}), 500

    # 5) Ritorno il percorso relativo per il frontend
    #    (ricordati che Apache serve “frontend/static” come “/static”)
    rel_path = f"/static/uploads/alojamientos_img/{filename}"
    return jsonify({'imagen_principal_ruta': rel_path}), 200

@alojamientos_bp.route('/owner', methods=['GET'])
@login_required
def get_owner_alojamientos():
    """
    GET /alojamientos/owner
    Ritorna la lista di tutti gli alojamientos creati dall’utente corrente.
    """
    user_id = session['user_id']
    alojamientos = Alojamiento.query.filter_by(id_propietario=user_id).all()

    result = []
    for a in alojamientos:
        result.append({
            'id': a.id_alojamiento,
            'nombre': a.nombre,
            'ciudad': a.ciudad,
            'precio_noche': float(a.precio_noche),
            'imagen_principal_ruta': a.imagen_principal_ruta
        })
    return jsonify(result), 200
