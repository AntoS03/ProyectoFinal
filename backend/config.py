# config.py
#I still need to understand how SQL alchemy and JWT work

import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Chiave segreta per proteggere session e JWT
    SECRET_KEY = os.environ.get('SECRET_KEY', 'li_mortacci_tua')
    # Connessione al database MySQL: nome_utente, password, host, database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'mysql://tuo_user:tuo_password@localhost/ProyectoFinal'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configurazione JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'chitemmuort')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # Token valido per 1 ora (3600 secondi)
