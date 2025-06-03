from flask import Flask
from flask_cors import CORS
from backend.routes.auth import auth_bp
from backend.routes.alojamientos import alojamientos_bp
from backend.routes.reservas import reservas_bp
#...

def create_app():
    app = Flask(__name__)
    app.secret_key = 'limortaccitua'
    #...
    return app

app = create_app()

if __name__ == '__main__':
    app.run()