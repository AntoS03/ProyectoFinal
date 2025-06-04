#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify, session
from extensions import db
from models import Alojamiento
from sqlalchemy import and_
from utils import login_required

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
    obbligatori = ['nombre', 'direccion', 'ciudad', 'estado_o_pais', 'descripcion', 'precio_noche']
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
        imagen_principal_ruta=data.get('imagen_principal_ruta'),
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
#@propietario_required
def edit_alojamiento(id):
    """
    Endpoint: PUT /alojamientos/<id>
    Solo il proprietario dell'alloggio può modificarlo.
    """
    user_id = session['user_id']
    a = Alojamiento.query.get(id)
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404
    
    # Controllo permesso: solo il proprietario
    if a.id_propietario != user_id:
        return jsonify({'msg': 'No autorizado'}), 403
    
    data = request.get_json()
    
    # Aggiorno campi ammessi
    for field in ['nombre', 'direccion', 'ciudad', 'estado_o_pais', 'descripcion', 'precio_noche', 'imagen_principal_ruta', 'link_map']:
        if field in data:
            setattr(a, field, data[field])
    
    db.session.commit()
    return jsonify({'message': 'Alojamiento actualizado'}), 200

# Delete property
@alojamientos_bp.route('/<int:id>', methods=['DELETE'])
@login_required
#@propietario_required
def delete_alojamiento(id):
    """
    Endpoint: DELETE /alojamientos/<id>
    Solo il proprietario dell'alloggio può eliminarlo.
    """
    user_id = session['user_id']
    a = Alojamiento.query.get(id)
    if not a:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404
    
    # Controllo permesso: solo il proprietario
    if a.id_propietario != user_id:
        return jsonify({'error': 'No autorizado'}), 403
    
    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Alojamiento eliminado'}), 200
