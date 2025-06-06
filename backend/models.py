from extensions import db
from datetime import datetime, timezone

class Usuario(db.Model):
    __tablename__ = 'Usuarios'

    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    contrasena = db.Column(db.String(255), nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    imagen_perfil_ruta = db.Column(db.String(512), nullable=True)

    # Relazioni
    reservas = db.relationship('Reserva', backref='usuario', lazy=True)
    comentarios = db.relationship('Comentario', backref='usuario', lazy=True)

class Alojamiento(db.Model):
    __tablename__ = 'Alojamientos'

    id_alojamiento = db.Column(db.Integer, primary_key=True)
    id_propietario = db.Column(db.Integer, db.ForeignKey('Usuarios.id_usuario'), nullable=True)
    nombre = db.Column(db.String(255), nullable=False)
    direccion = db.Column(db.String(255), nullable=False)
    ciudad = db.Column(db.String(100), nullable=False)
    estado_o_pais = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    precio_noche = db.Column(db.Numeric(10,2), nullable=False)
    imagen_principal_ruta = db.Column(db.String(512), nullable=True)
    link_map = db.Column(db.String(400), nullable=True)

    # Relazioni
    reservas = db.relationship('Reserva', backref='alojamiento', lazy=True, cascade="all, delete-orphan")
    comentarios = db.relationship('Comentario', backref='alojamiento', lazy=True, cascade="all, delete-orphan")
    imagenes = db.relationship('ImagenAlojamiento', backref='alojamiento', lazy=True, cascade="all, delete-orphan")

class Reserva(db.Model):
    __tablename__ = 'Reservas'

    id_reserva = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuarios.id_usuario'), nullable=False)
    id_alojamiento = db.Column(db.Integer, db.ForeignKey('Alojamientos.id_alojamiento'), nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    fecha_reserva_creada = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    estado_reserva = db.Column(
        db.Enum('Pendiente', 'Confirmada', 'Cancelada', 'Pagado'),
        nullable=False,
        default='Pendiente'
    )

class Comentario(db.Model):
    __tablename__ = 'Comentarios'

    id_comentario = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('Usuarios.id_usuario'), nullable=False)
    id_alojamiento = db.Column(db.Integer, db.ForeignKey('Alojamientos.id_alojamiento'), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    puntuacion = db.Column(db.SmallInteger, nullable=True)  # potenzialmente 1–5 stelle
    fecha_comentario = db.Column(db.DateTime, default=datetime.now(timezone.utc))

class ImagenAlojamiento(db.Model):
    __tablename__ = 'ImagenesAlojamiento'

    id_imagen_alojamiento = db.Column(db.Integer, primary_key=True)
    id_alojamiento = db.Column(db.Integer, db.ForeignKey('Alojamientos.id_alojamiento'), nullable=False)
    ruta_imagen = db.Column(db.String(512), nullable=False)
    descripcion_imagen = db.Column(db.String(255), nullable=True)
    orden = db.Column(db.Integer, nullable=True, default=0)
    fecha_subida = db.Column(db.DateTime, default=datetime.now(timezone.utc))
