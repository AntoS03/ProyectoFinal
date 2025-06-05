#auth_routes
from flask import Blueprint, request, jsonify, session
from passlib.hash import bcrypt
from extensions import db
from models import Usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Endpoint: POST /auth/register
    Corpo JSON atteso: { "email": "...", "password": "..." }
    Risposta 201: { "message": "Usuario registrado" }
    """
    data = request.get_json()

    # Check required fields
    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify(error="Email and password required"), 400
    
    email = data['email'].strip().lower()
    password = data['password']
    
    # Check if email exists
    if Usuario.query.filter_by(email=email).first():
        return jsonify(error="Email already registered"), 409
    
    # Hash sicuro della password con bcrypt
    pw_hash = bcrypt.hash(password)
    nuevo_usuario = Usuario(email=email, contrasena=pw_hash,
                            nombre='', apellidos='')  # nome/apellidos si possono estendere dopo
    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify(message="User registered successfully"), 201

@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Endpoint: POST /auth/login
    Corpo JSON: { "email": "...", "password": "..." }
    Se credenziali valide, imposta session['user_id'] e restituisce 200 OK.
    """
    data = request.get_json()

    if not data or not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400
    
    email = data['email'].strip().lower()
    password = data['password']

    user = Usuario.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Verifico la password con bcrypt
    if not bcrypt.verify(password, user.contrasena):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Imposta l'ID utente nella sessione (tramite cookie firmato)
    session['user_id'] = user.id_usuario
    # (Opzionale) Rendi la sessione "permanente" 
    # in questo caso durerebbe fino a session.permanent_lifetime
    #session.permanent = True

    return jsonify({'message': 'Login eseguito'}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout_user():
    """
    POST /auth/logout
    Rimuove 'user_id' dalla sessione e restituisce 200 OK.
    """
    session.pop('user_id', None)
    return jsonify({'message': 'Logout eseguito'}), 200