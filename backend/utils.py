#(not sure this file is even necessary, but to integrate it with the ChatGPT version)
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import jsonify
from backend.models import Alojamiento, Reserva

def propietario_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        alojamiento_id = kwargs.get('id')
        
        alojamiento = Alojamiento.query.get_or_404(alojamiento_id)
        if alojamiento.id_propietario != user_id:
            return jsonify(error="Not property owner"), 403
            
        return fn(*args, **kwargs)
    return wrapper

def reserva_owner_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        reserva_id = kwargs.get('id')
        
        reserva = Reserva.query.get_or_404(reserva_id)
        if reserva.id_usuario != user_id:
            return jsonify(error="Not reservation owner"), 403
            
        return fn(*args, **kwargs)
    return wrapper