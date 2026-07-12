import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")

if not url:
    raise ValueError(
        "La variable de entorno SUPABASE_URL no está definida. "
        "Configúrala en el archivo .env antes de ejecutar este script."
    )

_service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not _service_key:
    raise ValueError(
        "La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está definida. "
        "Configúrala en el archivo .env antes de ejecutar este script."
    )

supabase_admin = create_client(url, _service_key)

_anon_key = os.environ.get("SUPABASE_ANON_KEY")
if _anon_key:
    supabase = create_client(url, _anon_key)
else:
    supabase = supabase_admin
