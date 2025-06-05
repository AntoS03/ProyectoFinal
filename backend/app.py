# app.py

from config import Config
from extensions import db
from flask import Flask
from flask_cors import CORS
from routes.alojamientos_routes import alojamientos_bp
# Import dei blueprint
from routes.auth_routes import auth_bp
from routes.reservas_routes import reservas_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inizializzo le estensioni
    db.init_app(app)

    '''Qui abilitiamo CORS
    per tutte le route, per tutti i metodi, 
    da tutte le origini:
    CORS(app)'''

    #    In produzione è preferibile restringere le origini consentite,
    #    es. CORS(app, resources={r"/api/*": {"origins": "https://tuo-frontend.com"}})

    # Abilita CORS con restrizione di origine e supporto alle credenziali
    #CORS(
    #    app,
    #    resources={r"/*": {"origins": "https://frontend.mio-dominio.com"}},
    #    supports_credentials=True
    #)
    
    # Creo le tabelle se non esistono (solo in sviluppo)
    with app.app_context():
        db.create_all()

    # Registro i blueprint
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(alojamientos_bp, url_prefix='/alojamientos')
    app.register_blueprint(reservas_bp, url_prefix='/reservas')

    return app

if __name__ == '__main__':
    app = create_app()
    # In ambiente di sviluppo useremo debug=True; in produzione metteremo False
    app.run(host='0.0.0.0', port=5000, debug=True)
