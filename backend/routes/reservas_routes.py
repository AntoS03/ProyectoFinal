#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Reserva, Alojamiento, Usuario
from datetime import datetime
#from backend.utils import reserva_owner_required

reservas_bp = Blueprint('reservas', __name__)

# Create reservation
@reservas_bp.route('/', methods=['POST'])
@jwt_required()
def create_reserva():
    """
    Endpoint: POST /reservas
    Richiede token utente.
    Body JSON es.:
      {
        "id_alojamiento": 10,
        "fecha_inicio": "2025-06-01",
        "fecha_fin": "2025-06-05",
        "personas": 2   # (poiché nello schema non c’è un campo “personas”, lo ignoriamo, oppure lo memorizziamo in un campo extra se serve)
      }
    Risposta 201: { "message": "Reserva creada", "id": 123 }
    """
    data = request.get_json()
    user_id = get_jwt_identity()

    # Controllo campi obbligatori
    obbligatori = ['id_alojamiento', 'fecha_inicio', 'fecha_fin']
    if not data or not all(key in data for key in obbligatori):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400
    
    try:
        # Converto le date da string a oggetto date
        fecha_inicio = datetime.strptime(data['fecha_inicio'], '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(data['fecha_fin'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido (usar YYYY-MM-DD)'}), 400
    
    if fecha_fin <= fecha_inicio:
        return jsonify({'error': 'La fecha de fin debe ser posterior a la de inicio'}), 400
    
    # Verifico che l’alloggio esista
    alojamiento = Alojamiento.query.get(data['id_alojamiento'])
    if not alojamiento:
        return jsonify({'error': 'Alojamiento no encontrado'}), 404
    
    # Controllo disponibilità: nessuna prenotazione “confirmada” o “pendiente” si sovrappone
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
    
    # Creo la prenotazione
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
@jwt_required()
def get_user_reservas():
    """
    Endpoint: GET /reservas
    Restituisce le prenotazioni del solo utente loggato.
    """
    user_id = get_jwt_identity()
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
@jwt_required()
#@reserva_owner_required (Deprecated)
def cancel_reserva(id):
    """
    Endpoint: DELETE /reservas/<id>
    Permette al proprietario della prenotazione di cancellarla.
    """
    user_id = get_jwt_identity()
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    # Verifico che sia l’utente che l’ha creata
    if reserva.id_usuario != user_id:
        return jsonify({'error': 'No autorizado'}), 403
    
    # Aggiorno lo stato a "Cancelada"
    reserva.estado_reserva = 'Cancelada'
    db.session.commit()
    return jsonify({'message': 'Reserva cancelada'}), 200

@reservas_bp.route('/<int:id>/confirm', methods=['PUT'])
@jwt_required()
def confirmar_reserva(id):
    """
    Endpoint: PUT /reservas/<id>/confirm
    Solo il proprietario dell'alloggio associato alla prenotazione può confermare.
    Cambia lo stato da 'Pendiente' a 'Confirmada'.
    """
    user_id = get_jwt_identity()
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'error': 'Reserva no encontrada'}), 404

    # Controllo che la prenotazione sia ancora pendente
    if reserva.estado_reserva != 'Pendiente':
        return jsonify({'error': 'Solo reservas pendientes pueden confirmarse'}), 400

    alojamiento = Alojamiento.query.get(reserva.id_alojamiento)
    if not alojamiento:
        return jsonify({'error': 'Alojamiento asociado no encontrado'}), 404

    # Verifica che l'utente loggato sia il proprietario dell'alloggio
    if alojamiento.id_propietario != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    reserva.estado_reserva = 'Confirmada'
    db.session.commit()
    return jsonify({'message': 'Reserva confirmada'}), 200
