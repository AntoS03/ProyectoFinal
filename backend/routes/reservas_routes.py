#reservas_routes
from flask import Blueprint, request, jsonify, session
from extensions import db
from models import Reserva, Alojamiento
from utils import login_required
from datetime import datetime
from sqlalchemy.orm import joinedload

reservas_bp = Blueprint('reservas', __name__)

# Create reservation
@reservas_bp.route('/', methods=['POST'])
@login_required
def create_reserva():
    """
    Endpoint: POST /reservas
    Richiede utente loggato.
    Body JSON:
      {
        "id_alojamiento": 10,
        "fecha_inicio": "2025-06-01",
        "fecha_fin": "2025-06-05"
      }
    """
    data = request.get_json()
    user_id = session['user_id']

    obbligatori = ['id_alojamiento', 'fecha_inicio', 'fecha_fin']
    if not data or not all(k in data for k in obbligatori):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    try:
        fecha_inicio = datetime.strptime(data['fecha_inicio'], '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(data['fecha_fin'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido (YYYY-MM-DD)'}), 400

    if fecha_fin <= fecha_inicio:
        return jsonify({'error': 'La fecha de fin debe ser posterior a la de inicio'}), 400

    alojamiento = Alojamiento.query.get(data['id_alojamiento'])
    if not alojamiento:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404

    # Controllo sovrapposizione prenotazioni “Pendiente” o “Confirmada”
    overlap = Reserva.query.filter(
        Reserva.id_alojamiento == data['id_alojamiento'],
        Reserva.estado_reserva.in_(['Pendiente', 'Confirmada']),
        db.or_(
            db.and_(Reserva.fecha_inicio <= fecha_inicio, Reserva.fecha_fin > fecha_inicio),
            db.and_(Reserva.fecha_inicio < fecha_fin, Reserva.fecha_fin >= fecha_fin),
            db.and_(Reserva.fecha_inicio >= fecha_inicio, Reserva.fecha_fin <= fecha_fin)
        )
    ).first()

    if overlap:
        return jsonify({'error': 'Fechas no disponibles'}), 409

    nueva = Reserva(
        id_usuario=user_id,
        id_alojamiento=data['id_alojamiento'],
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        estado_reserva='Pendiente'
    )
    db.session.add(nueva)
    db.session.commit()

    return jsonify({'message': 'Reserva creada', 'id': nueva.id_reserva}), 201

# Get user reservations
@reservas_bp.route('', methods=['GET'])
@login_required
def get_user_reservas():
    """
    Endpoint: GET /reservas
    Ritorna prenotazioni dell’utente loggato.
    """
    user_id = session['user_id']
    reservas = Reserva.query.filter_by(id_usuario=user_id).all()

    result = []
    for r in reservas:
        result.append({
            'id_reserva': r.id_reserva,
            'id_alojamiento': r.id_alojamiento,
            'fecha_inicio': r.fecha_inicio.isoformat(),
            'fecha_fin': r.fecha_fin.isoformat(),
            'estado_reserva': r.estado_reserva
        })
    return jsonify(result), 200

# Cancel reservation
@reservas_bp.route('/<int:id>', methods=['DELETE'])
@login_required
def cancel_reserva(id):
    """
    Endpoint: DELETE /reservas/<id>
    Cambia stato a 'Cancelada' se il cancellante è il creatore.
    """
    user_id = session['user_id']
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    if reserva.id_usuario != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    reserva.estado_reserva = 'Cancelada'
    db.session.commit()
    return jsonify({'message': 'Reserva cancelada'}), 200

# Confirm reservation (per proprietario dell’alloggio)
@reservas_bp.route('/<int:id>/confirm', methods=['PUT'])
@login_required
def confirmar_reserva(id):
    """
    Endpoint: PUT /reservas/<id>/confirm
    Solo proprietario dell’alloggio associato può confermare.
    """
    user_id = session['user_id']
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    if reserva.estado_reserva != 'Pendiente':
        return jsonify({'error': 'Solo reservas pendientes pueden confirmarse'}), 400

    alojamiento = Alojamiento.query.get(reserva.id_alojamiento)
    if not alojamiento:
        return jsonify({'error': 'Alojamiento asociado no encontrado'}), 404

    if alojamiento.id_propietario != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    reserva.estado_reserva = 'Confirmada'
    db.session.commit()
    return jsonify({'message': 'Reserva confirmada'}), 200

# Get owner’s pending requests
@reservas_bp.route('/owner', methods=['GET'])
@login_required
def get_owner_reservas():
    """
    Endpoint: GET /reservas/owner
    Ritorna prenotazioni 'Pendiente' relative a inoltri alloggi del proprietario.
    """
    user_id = session['user_id']

    query = Reserva.query.options(joinedload(Reserva.alojamiento))\
        .filter(Reserva.estado_reserva == 'Pendiente')\
        .join(Alojamiento, Reserva.id_alojamiento == Alojamiento.id_alojamiento)\
        .filter(Alojamiento.id_propietario == user_id)

    reservas = query.all()
    result = []
    for r in reservas:
        result.append({
            'id_reserva': r.id_reserva,
            'id_alojamiento': r.id_alojamiento,
            'nombre_alojamiento': r.alojamiento.nombre,
            'id_solicitante': r.id_usuario,
            'fecha_inicio': r.fecha_inicio.isoformat(),
            'fecha_fin': r.fecha_fin.isoformat(),
            'estado_reserva': r.estado_reserva
        })
    return jsonify(result), 200

# Reject reservation (per proprietario dell’alloggio)
@reservas_bp.route('/<int:id>/reject', methods=['PUT'])
@login_required
def reject_reserva(id):
    """
    Endpoint: PUT /reservas/<id>/reject
    L’owner dell’alojamiento rifiuta la prenotazione (imposta a 'Cancelada').
    """
    user_id = session['user_id']
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    alojamiento = Alojamiento.query.get(reserva.id_alojamiento)
    if not alojamiento or alojamiento.id_propietario != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    if reserva.estado_reserva != 'Pendiente':
        return jsonify({'error': 'Solo reservas pendientes pueden rechazarse'}), 400

    reserva.estado_reserva = 'Cancelada'
    db.session.commit()
    return jsonify({'message': 'Reserva rifiutata'}), 200
