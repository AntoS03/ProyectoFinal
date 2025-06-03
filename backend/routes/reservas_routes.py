#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Reserva, db
from backend.utils import reserva_owner_required

reservas_bp = Blueprint('reservas', __name__)

# Create reservation
@reservas_bp.route('/', methods=['POST'])
@jwt_required()
def create_reserva():
    data = request.get_json()
    user_id = get_jwt_identity()
    
    new_reserva = Reserva(
        id_usuario=user_id,
        id_alojamiento=data['id_alojamiento'],
        fecha_inicio=data['fecha_inicio'],
        fecha_fin=data['fecha_fin']
    )
    
    db.session.add(new_reserva)
    db.session.commit()
    return jsonify(message="Reservation created", id=new_reserva.id_reserva), 201

# Get user reservations
@reservas_bp.route('/mis-reservas', methods=['GET'])
@jwt_required()
def get_user_reservas():
    user_id = get_jwt_identity()
    reservas = Reserva.query.filter_by(id_usuario=user_id).all()
    
    return jsonify([{
        'id': r.id_reserva,
        'id_alojamiento': r.id_alojamiento,
        'fecha_inicio': r.fecha_inicio.isoformat(),
        'fecha_fin': r.fecha_fin.isoformat(),
        'estado': r.estado_reserva
    } for r in reservas]), 200

# Cancel reservation
@reservas_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@reserva_owner_required
def cancel_reserva(id):
    reserva = Reserva.query.get_or_404(id)
    reserva.estado_reserva = 'Cancelada'
    db.session.commit()
    return jsonify(message="Reservation canceled"), 200