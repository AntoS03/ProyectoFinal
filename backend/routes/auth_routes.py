#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify
from passlib.hash import bcrypt
from flask_jwt_extended import create_access_token
from extensions import db
from models import Usuario
from datetime import timedelta

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
    Risposta 200: { "token": "..." }
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
    
     # Creo il token JWT con durata di 1 ora
    access_token = create_access_token(identity=user.id_usuario,
                                       expires_delta=timedelta(hours=1))
    return jsonify({'token': access_token}), 200