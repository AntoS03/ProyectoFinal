from backend.app import db

class Alojamiento(db.Model):
    __tablename__ = 'Alojamientos'
    id_alojamiento = db.Column(db.Integer, primary_key=True)
    id_propietario = db.Column(db.Integer, db.ForeignKey('Usuarios.id_usuario'), nullable=False)
    nombre = db.Column(db.String(255), nullable=False)
    direccion = db.Column(db.String(255), nullable=False)
    ciudad = db.Column(db.String(100), nullable=False)
    estado_o_pais = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    precio_noche = db.Column(db.Numeric(10,2), nullable=False)
    imagen_principal_ruta = db.Column(db.String(512))
    link_map = db.Column(db.String(300))