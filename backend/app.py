from flask import Flask, jsonify

# Inicializamos la aplicación
app = Flask(__name__)

# Una ruta de prueba para saber que el servidor funciona
@app.route('/', methods=['GET'])
def home():
    return jsonify({"mensaje": "¡El backend de FocusLedger está funcionando!"})

# Aquí luego importarás las funciones de tu carpeta 'api/' o 'scripts/'
# para crear rutas como @app.route('/api/finance', methods=['POST'])

if __name__ == '__main__':
    app.run(debug=True, port=5000)