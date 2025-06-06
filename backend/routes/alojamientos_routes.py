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
            'imagen_principal_ruta': a.imagen_principal_ruta,
            # **Riportiamo anche link_map_embed e link_map_url**
            'link_map_embed': a.link_map_embed,
            'link_map_url': a.link_map_url
        })
    return jsonify(result), 200

# Property details
@alojamientos_bp.route('/<int:id>', methods=['GET'])
def detail_alojamiento(id):
    a = Alojamiento.query.get(id)
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    resp = {
        'id': a.id_alojamiento,
        'nombre': a.nombre,
        'direccion': a.direccion,
        'ciudad': a.ciudad,
        'estado_o_pais': a.estado_o_pais,
        'descripcion': a.descripcion,
        'precio_noche': float(a.precio_noche),
        'imagen_principal_ruta': a.imagen_principal_ruta,
        'link_map_embed': a.link_map_embed,
        'link_map_url': a.link_map_url
    }
    return jsonify(resp), 200

# Create property
@alojamientos_bp.route('/', methods=['POST'])
@login_required
def create_alojamiento():
    data = request.get_json()
    user_id = session['user_id']

    # Controllo campi obbligatori
    obbligatori = ['nombre', 'direccion', 'ciudad', 'estado_o_pais', 'descripcion', 'precio_noche', 'imagen_principal_ruta', 'link_map_embed', 'link_map_url']
    if not data or not all(key in data for key in obbligatori):
        return jsonify({'msg': 'Faltan campos obligatorios'}), 400

    a = Alojamiento(
        id_propietario=user_id,
        nombre=data['nombre'],
        direccion=data['direccion'],
        ciudad=data['ciudad'],
        estado_o_pais=data['estado_o_pais'],
        descripcion=data['descripcion'],
        precio_noche=data['precio_noche'],
        imagen_principal_ruta=data['imagen_principal_ruta'],
        link_map_embed=data['link_map_embed'],
        link_map_url=data['link_map_url']
    )
    db.session.add(a)
    db.session.commit()

    return jsonify({'message': 'Alojamiento creado', 'id': a.id_alojamiento}), 201

# Edit property (only from owner)
@alojamientos_bp.route('/<int:id>', methods=['PUT'])
@login_required
def edit_alojamiento(id):
    user_id = session['user_id']
    a = Alojamiento.query.get(id)
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    if a.id_propietario != user_id:
        return jsonify({'msg': 'No autorizado'}), 403

    data = request.get_json()
    # Aggiorno i campi ammessi (inclusi i nuovi link)
    for field in [
        'nombre', 'direccion', 'ciudad', 'estado_o_pais',
        'descripcion', 'precio_noche', 'imagen_principal_ruta',
        'link_map_embed', 'link_map_url'
    ]:
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
        ImagenAlojamiento.query.filter_by(id_alojamiento=id).delete()
        Comentario.query.filter_by(id_alojamiento=id).delete()
        Reserva.query.filter_by(id_alojamiento=id).delete()
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
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Autenticazione richiesta'}), 401

    if 'image' not in request.files:
        return jsonify({'error': 'Nessun file inviato'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nome file non valido'}), 400

    if not allowed_aloj_file(file.filename):
        return jsonify({'error': 'Formato immagine non consentito'}), 400

    filename = secure_filename(file.filename)
    prefix = f"user_{user_id}_"
    filename = prefix + filename

    upload_folder = current_app.config.get('UPLOAD_ALOJ_FOLDER')
    if not upload_folder:
        return jsonify({'error': 'Configurazione cartella upload mancante'}), 500

    try:
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

    rel_path = f"/static/uploads/alojamientos_img/{filename}"
    return jsonify({'imagen_principal_ruta': rel_path}), 200

@alojamientos_bp.route('/owner', methods=['GET'])
@login_required
def get_owner_alojamientos():
    user_id = session['user_id']
    alojamientos = Alojamiento.query.filter_by(id_propietario=user_id).all()

    result = []
    for a in alojamientos:
        result.append({
            'id': a.id_alojamiento,
            'nombre': a.nombre,
            'ciudad': a.ciudad,
            'precio_noche': float(a.precio_noche),
            'imagen_principal_ruta': a.imagen_principal_ruta,
            'link_map_embed': a.link_map_embed,
            'link_map_url': a.link_map_url
        })
    return jsonify(result), 200


# ===========================================
# === ENDPOINTS PER I COMMENTI ==============
# ===========================================

@alojamientos_bp.route('/<int:id>/comments', methods=['GET'])
def get_comments(id):
    """
    GET /alojamientos/<id>/comments
    Restituisce i commenti associati a un alloggio (anche utenti non loggati).
    Ogni commento include nome e cognome dell’utente che l’ha lasciato.
    """
    # Verifica esistenza alloggio
    alojamiento = Alojamiento.query.get(id)
    if not alojamiento:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    comments = Comentario.query.filter_by(id_alojamiento=id).order_by(Comentario.fecha_comentario.desc()).all()
    result = []
    for c in comments:
        user = Usuario.query.get(c.id_usuario)
        result.append({
            'id_comentario': c.id_comentario,
            'id_usuario': c.id_usuario,
            'nombre_usuario': user.nombre if user else '',
            'apellidos_usuario': user.apellidos if user else '',
            'texto': c.texto,
            'puntuacion': c.puntuacion,
            'fecha_comentario': c.fecha_comentario.isoformat()
        })
    return jsonify(result), 200

@alojamientos_bp.route('/<int:id>/comments', methods=['POST'])
@login_required
def post_comment(id):
    """
    POST /alojamientos/<id>/comments
    Richiede utente loggato. Aggiunge un commento all’alloggio.
    Body JSON: { "texto": "Testo del commento", "puntuacion": 4 (opzionale) }
    """
    user_id = session['user_id']
    alojamiento = Alojamiento.query.get(id)
    if not alojamiento:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    data = request.get_json()
    if not data or 'texto' not in data or not data['texto'].strip():
        return jsonify({'error': 'El campo texto es obligatorio'}), 400

    texto = data['texto'].strip()
    puntuacion = data.get('puntuacion')
    try:
        puntuacion_val = int(puntuacion) if puntuacion is not None else None
    except:
        puntuacion_val = None

    nuevo = Comentario(
        id_usuario=user_id,
        id_alojamiento=id,
        texto=texto,
        puntuacion=puntuacion_val
    )
    db.session.add(nuevo)
    db.session.commit()

    return jsonify({'message': 'Comentario agregado'}), 201