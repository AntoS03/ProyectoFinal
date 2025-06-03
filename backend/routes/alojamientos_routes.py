#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Alojamiento, db, Usuario
from backend.utils import propietario_required

alojamientos_bp = Blueprint('alojamientos', __name__)

# Search properties with filters
@alojamientos_bp.route('/', methods=['GET'])
def search_alojamientos():
    filters = request.args
    query = Alojamiento.query
    
    if 'ciudad' in filters:
        query = query.filter(Alojamiento.ciudad == filters['ciudad'])
    if 'precioMax' in filters:
        query = query.filter(Alojamiento.precio_noche <= float(filters['precioMax']))
    
    results = query.all()
    return jsonify([{
        'id': a.id_alojamiento,
        'nombre': a.nombre,
        'ciudad': a.ciudad,
        'precio_noche': float(a.precio_noche),
        'imagen_principal': a.imagen_principal_ruta
    } for a in results]), 200

# Property details
@alojamientos_bp.route('/<int:id>', methods=['GET'])
def get_alojamiento(id):
    alojamiento = Alojamiento.query.get_or_404(id)
    return jsonify({
        'id': alojamiento.id_alojamiento,
        'nombre': alojamiento.nombre,
        'direccion': alojamiento.direccion,
        'ciudad': alojamiento.ciudad,
        'descripcion': alojamiento.descripcion,
        'precio_noche': float(alojamiento.precio_noche),
        'imagen_principal': alojamiento.imagen_principal_ruta
    }), 200

# Create property
@alojamientos_bp.route('/', methods=['POST'])
@jwt_required()
def create_alojamiento():
    data = request.get_json()
    user_id = get_jwt_identity()
    
    new_property = Alojamiento(
        id_propietario=user_id,
        nombre=data['nombre'],
        direccion=data['direccion'],
        ciudad=data['ciudad'],
        estado_o_pais=data['estado_o_pais'],
        descripcion=data['descripcion'],
        precio_noche=data['precio_noche'],
        imagen_principal_ruta=data.get('imagen_principal', '')
    )
    
    db.session.add(new_property)
    db.session.commit()
    return jsonify(message="Property created", id=new_property.id_alojamiento), 201

# Update property
@alojamientos_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@propietario_required
def update_alojamiento(id):
    alojamiento = Alojamiento.query.get_or_404(id)
    data = request.get_json()
    
    alojamiento.nombre = data.get('nombre', alojamiento.nombre)
    alojamiento.direccion = data.get('direccion', alojamiento.direccion)
    alojamiento.ciudad = data.get('ciudad', alojamiento.ciudad)
    alojamiento.descripcion = data.get('descripcion', alojamiento.descripcion)
    alojamiento.precio_noche = data.get('precio_noche', alojamiento.precio_noche)
    
    db.session.commit()
    return jsonify(message="Property updated"), 200

# Delete property
@alojamientos_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@propietario_required
def delete_alojamiento(id):
    alojamiento = Alojamiento.query.get_or_404(id)
    db.session.delete(alojamiento)
    db.session.commit()
    return jsonify(message="Property deleted"), 200
