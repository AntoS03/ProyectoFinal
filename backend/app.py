from flask import Flask
from flask_cors import CORS
from backend.routes.auth import auth_bp
from backend.routes.alojamientos import alojamientos_bp
from backend.routes.reservas import reservas_bp
#...
db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.secret_key = 'limortaccitua'
    #...
    db.init_app(app)
    jwt.init_app(app)

    from backend.routes.auth_routes import auth_bp
    from backend.routes.alojamientos_routes import alojamientos_bp
    from backend.routes.reservas_routes import reservas_bp
    #usuarios?

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(alojamientos_bp, url_prefix='/alojamientos')
    app.register_blueprint(reservas_bp, url_prefix='/reservas')

    return app

app = create_app()

if __name__ == '__main__':
    app.run()