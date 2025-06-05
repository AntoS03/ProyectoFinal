#auth_routes
import os
from flask import Blueprint, request, jsonify, session, current_app
from passlib.hash import bcrypt
from werkzeug.utils import secure_filename
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
    nombre = data.get('nombre', '').strip()
    apellidos = data.get('apellidos', '').strip()
    
    # Check if email exists
    if Usuario.query.filter_by(email=email).first():
        return jsonify(error="Email already registered"), 409
    
    # Hash sicuro della password con bcrypt
    pw_hash = bcrypt.hash(password)
    nuevo_usuario = Usuario(email=email, contrasena=pw_hash,
                            nombre=nombre, apellidos=apellidos)  # nome/apellidos si possono estendere dopo
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

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Endpoint: GET /auth/me
    Restituisce i dati dell’utente loggato: nome, apellidos, email, imagen_perfil_ruta.
    Se non è loggato, restituisce 401.
    """
    if 'user_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401

    user = Usuario.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'Utente non trovato'}), 404

    return jsonify({
        'id_usuario': user.id_usuario,
        'nombre': user.nombre,
        'apellidos': user.apellidos,
        'email': user.email,
        'imagen_perfil_ruta': user.imagen_perfil_ruta  # può essere None
    }), 200

def allowed_file(filename):
    """Controlla se l'estensione del file è permessa."""
    ext = filename.rsplit('.', 1)[-1].lower()
    return '.' in filename and ext in current_app.config['ALLOWED_IMAGE_EXTENSIONS']

@auth_bp.route('/upload-profile-image', methods=['POST'])
def upload_profile_image():
    """
    Endpoint: POST /auth/upload-profile-image
    Riceve un multipart/form-data con campo 'image'.
    Salva l'immagine in frontend/static/uploads/user_profiles e aggiorna
    il campo imagen_perfil_ruta di Usuario.
    """
    # 1) Verifica autenticazione
    if 'user_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401

    # 2) Controlla che il file sia presente
    if 'image' not in request.files:
        return jsonify({'error': 'Nessun file inviato'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nessun file selezionato'}), 400

    # 3) Controlla estensione
    if not allowed_file(file.filename):
        return jsonify({'error': 'Formato non permesso. Usa png/jpg/jpeg/gif'}), 400

    # 4) Costruisci percorso di destinazione
    filename = secure_filename(file.filename)
    # Aggiungi user_id + timestamp per evitare conflitti
    user_id = session['user_id']
    ext = filename.rsplit('.', 1)[-1].lower()
    new_name = f"user_{user_id}_{int(db.func.now().timestamp())}.{ext}"
    upload_folder = current_app.config['USER_PROFILE_UPLOAD_FOLDER']
    if not os.path.isdir(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)
    save_path = os.path.join(upload_folder, new_name)

    # 5) Salva fisicamente il file
    file.save(save_path)

    # 6) Aggiorna DB: ruta relativa da frontend
    #    Poiché la cartella è ".../frontend/static/uploads/user_profiles/",
    #    possiamo salvare il percorso come "/static/uploads/user_profiles/<new_name>"
    relative_path = f"/static/uploads/user_profiles/{new_name}"

    user = Usuario.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utente non trovato'}), 404

    user.imagen_perfil_ruta = relative_path
    db.session.commit()

    return jsonify({'imagen_perfil_ruta': relative_path}), 200