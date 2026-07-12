import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)

CORS(app, origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")])

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)


@app.route('/', methods=['GET'])
def home():
    return jsonify({"mensaje": "¡El backend de FocusLedger está funcionando!"})


if __name__ == '__main__':
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, port=5000)
