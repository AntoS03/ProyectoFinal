# utils.py

from functools import wraps
from flask import session, jsonify

def login_required(fn):
    """
    Verifica che nella sessione sia presente 'user_id'.
    Se non esiste, restituisce 401 Unauthorized con messaggio JSON.
    Altrimenti, esegue la funzione protetta.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'msg': 'Autenticazione richiesta'}), 401
        return fn(*args, **kwargs)
    return wrapper
