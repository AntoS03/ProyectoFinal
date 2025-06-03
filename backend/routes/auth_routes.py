#THIS IS FROM CHATGPT SO IT'S NOT FINAL
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from backend.models import Usuario, db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    # Check required fields
    if not data or 'email' not in data or 'password' not in data:
        return jsonify(error="Email and password required"), 400
    
    # Check if email exists
    if Usuario.query.filter_by(email=data['email']).first():
        return jsonify(error="Email already registered"), 409
    
    hashed_password = generate_password_hash(data['password'])
    
    new_user = Usuario(
        email=data['email'],
        contrasena=hashed_password,
        nombre=data.get('nombre', ''),
        apellidos=data.get('apellidos', '')
    )
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User registered successfully"), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = Usuario.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.contrasena, data['password']):
        return jsonify(error="Invalid credentials"), 401
    
    access_token = create_access_token(identity=user.id_usuario)
    return jsonify(token=access_token), 200