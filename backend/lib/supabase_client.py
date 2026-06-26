# Las variables de entorno se configuran en .env (ver .env.example)
# Usa la clave service_role — solo para scripts locales, NUNCA exponer en el frontend
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url:
    raise ValueError(
        "La variable de entorno SUPABASE_URL no está definida. "
        "Configúrala en el archivo .env antes de ejecutar este script."
    )

if not key:
    raise ValueError(
        "La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está definida. "
        "Configúrala en el archivo .env antes de ejecutar este script."
    )

supabase = create_client(url, key)
