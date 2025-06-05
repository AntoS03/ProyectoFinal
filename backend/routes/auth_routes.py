#auth_routes
import os
from flask import Blueprint, request, jsonify, session, current_app
from passlib.hash import bcrypt
from werkzeug.utils import secure_filename
from extensions import db
from models import Usuario
from utils import login_required

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
    Restituisce i dati dell'utente loggato
    """
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Utente non autenticato'}), 401

    user = Usuario.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utente non trovato'}), 404

    # Correzione: Restituisci sempre tutti i campi
    return jsonify({
        'id_usuario': user.id_usuario,
        'nombre': user.nombre or '',
        'apellidos': user.apellidos or '',
        'email': user.email or '',
        'imagen_perfil_ruta': user.imagen_perfil_ruta or ''
    }), 200

def allowed_file(filename):
    """Controlla se l'estensione del file è permessa."""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext in current_app.config['ALLOWED_IMAGE_EXTENSIONS']

@auth_bp.route('/upload-profile-image', methods=['POST'])
def upload_profile_image():
    """
    Endpoint: POST /auth/upload-profile-image
    Riceve un multipart/form-data con campo 'image'.
    Salva l'immagine in frontend/static/uploads/user_profiles e aggiorna
    il campo imagen_perfil_ruta di Usuario.
    """
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Autenticazione richiesta'}), 401

    if 'image' not in request.files:
        return jsonify({'error': 'Nessun file inviato'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nome file non valido'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Formato non consentito'}), 400

    filename = secure_filename(file.filename)
    # Facciamo un prefisso con l’ID utente per evitare collisioni  
    # es. "5_avatar.jpg"
    prefix = f"user_{user_id}_"
    filename = prefix + filename

    upload_folder = current_app.config['UPLOAD_FOLDER']
    # Se la cartella non esiste (magari qualcuno l’ha cancellata), la ricrea
    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, filename)
    try:
        file.save(save_path)
    except Exception as e:
        current_app.logger.error(f"Errore salvataggio file: {e}")
        return jsonify({'error': 'Errore interno durante il salvataggio dell\'immagine'}), 500

    # Costruiamo il percorso relativo per l’URL (frontend/static ...)
    # In HTML basterà fare <img src="/static/uploads/user_profiles/user_5_avatar.jpg">
    rel_path = f"/static/uploads/user_profiles/{filename}"

    # Aggiorniamo il record utente
    user = Usuario.query.get(user_id)
    user.imagen_perfil_ruta = rel_path
    try:
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Errore DB aggiorna immagine: {e}")
        # Se il commit fallisce, rimuoviamo il file fisico
        try:
            os.remove(save_path)
        except:
            pass
        return jsonify({'error': 'Errore interno durante l\'aggiornamento del DB'}), 500

    return jsonify({'imagen_perfil_ruta': rel_path}), 200

@auth_bp.route('/reset-profile-image', methods=['POST'])
@login_required
def reset_profile_image():
    """
    Resetta l'immagine del profilo a quella predefinita
    """
    user_id = session['user_id']
    user = Usuario.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    # Percorso predefinito
    DEFAULT_IMAGE = '/static/images/default-profile.png'
    
    try:
        # Elimina l'immagine vecchia se esiste
        if user.imagen_perfil_ruta and not user.imagen_perfil_ruta.startswith(DEFAULT_IMAGE):
            try:
                old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 
                                        os.path.basename(user.imagen_perfil_ruta))
                if os.path.exists(old_path):
                    os.remove(old_path)
            except Exception as e:
                current_app.logger.error(f"Error deleting old profile image: {str(e)}")
        
        user.imagen_perfil_ruta = DEFAULT_IMAGE
        db.session.commit()
        
        return jsonify({
            'message': 'Imagen restablecida correctamente',
            'default_image': DEFAULT_IMAGE
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resetting profile image: {str(e)}")
        return jsonify({'error': 'Error interno al restablecer imagen'}), 500
    
@auth_bp.route('/update-profile', methods=['PUT'])
@login_required
def update_profile():
    """
    Aggiorna nome e cognome dell'utente
    """
    user_id = session['user_id']
    user = Usuario.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    data = request.get_json()
    
    # Validazione campi
    if 'nombre' not in data or 'apellidos' not in data:
        return jsonify({'error': 'Nombre y apellidos son obligatorios'}), 400
    
    try:
        user.nombre = data['nombre']
        user.apellidos = data['apellidos']
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil actualizado correctamente',
            'nombre': user.nombre,
            'apellidos': user.apellidos
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Error interno al actualizar perfil'}), 500