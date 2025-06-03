from backend.app import db

class Reserva(db.Model):
    __tablename__ = 'Reservas'
    id_reserva = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuarios.id_usuario'), nullable=False)
    id_alojamiento = db.Column(db.Integer, db.ForeignKey('Alojamientos.id_alojamiento'), nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    fecha_reserva_creada = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    estado_reserva = db.Column(db.String(20), default='Pendiente')

