# config.py

import os

basedir = os.path.abspath(os.path.dirname(__file__))
DEFAULT_PROFILE_IMAGE = os.path.join('..', 'frontend', 'static', 'uploads', 'user_profiles', 'default-profile.png')

class Config:
    # Chiave segreta per proteggere session e JWT
    SECRET_KEY = os.environ.get('SECRET_KEY', 'li_mortacci_tua')
    # Connessione al database MySQL: nome_utente, password, host, database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'mysql://Luca:Luca123!@localhost/ProyectoFinal'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configurazione sicura del cookie di sessione
    SESSION_COOKIE_HTTPONLY = True     # 🔒 impedisce accesso da JavaScript
    SESSION_COOKIE_SECURE = False       # 🔐 solo su HTTPS
#    SESSION_COOKIE_SAMESITE = 'Lax'    # 🛡️ limita invio in contesti cross-site
    PERMANENT_SESSION_LIFETIME = 3600  # (esempio) scade dopo 1 ora

    # Dove salvare le immagini di profilo (cartella "frontend/static/uploads/user_profiles")
    UPLOAD_FOLDER = os.path.join(basedir, '..', 'frontend', 'static', 'uploads', 'user_profiles')
    UPLOAD_ALOJ_FOLDER = os.path.join(basedir, '..', 'frontend', 'static', 'uploads', 'alojamientos_img')
    # Estensioni consentite
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    # Dimensione massima upload (opzionale)
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2 MB

    