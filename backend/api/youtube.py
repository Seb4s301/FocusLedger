#!/usr/bin/env python3
"""
process_youtube.py — Extrae metadatos de un video de YouTube y los persiste.

Uso:
    python process_youtube.py --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --user-id UUID

Requisitos: 7.5
"""

import argparse
import re
import sys
import os

# Agregar el directorio padre para importar lib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from lib.supabase_client import supabase

# Regex para validar y extraer video_id de URLs de YouTube
YT_VIDEO_REGEX = re.compile(
    r"^(?:https?://)?(?:www\.)?youtube\.com/watch\?.*v=([\w-]{11})"
)
YT_SHORT_REGEX = re.compile(
    r"^(?:https?://)?youtu\.be/([\w-]{11})"
)


def validate_youtube_url(url):
    """Valida que la URL sea un formato de YouTube aceptado."""
    if not url:
        return False
    return bool(YT_VIDEO_REGEX.search(url) or YT_SHORT_REGEX.search(url))


def extract_video_id(url):
    """Extrae el video_id de una URL de YouTube."""
    match = YT_VIDEO_REGEX.search(url)
    if match:
        return match.group(1)
    match = YT_SHORT_REGEX.search(url)
    if match:
        return match.group(1)
    return None


def fetch_video_metadata(video_id):
    """Llama a YouTube Data API v3 para obtener metadatos del video."""
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        print(
            "Advertencia: YOUTUBE_API_KEY no está configurada. "
            "Se guardará el video sin metadatos.",
            file=sys.stderr,
        )
        return None

    try:
        from googleapiclient.discovery import build

        youtube = build("youtube", "v3", developerKey=api_key)
        request = youtube.videos().list(part="snippet,contentDetails", id=video_id)
        response = request.execute()

        if not response.get("items"):
            print(f"Advertencia: No se encontró el video {video_id} en YouTube.", file=sys.stderr)
            return None

        item = response["items"][0]
        snippet = item.get("snippet", {})
        content = item.get("contentDetails", {})

        return {
            "title": snippet.get("title"),
            "duration": content.get("duration"),  # ISO 8601 (PT4M13S)
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url")
                or snippet.get("thumbnails", {}).get("default", {}).get("url"),
        }

    except ImportError:
        print(
            "Advertencia: google-api-python-client no está instalado. "
            "Ejecuta: pip install google-api-python-client",
            file=sys.stderr,
        )
        return None
    except Exception as e:
        print(f"Advertencia: Error al consultar YouTube API: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Extrae metadatos de un video de YouTube y los guarda en FocusLedger."
    )
    parser.add_argument("--url", type=str, required=True, help="URL del video de YouTube")
    parser.add_argument("--user-id", type=str, required=True, help="UUID del usuario")

    args = parser.parse_args()

    # Validar URL
    if not validate_youtube_url(args.url):
        print(
            f"Error: URL de YouTube no válida: '{args.url}'\n"
            "Formatos aceptados:\n"
            "  - https://www.youtube.com/watch?v=VIDEO_ID\n"
            "  - https://youtu.be/VIDEO_ID",
            file=sys.stderr,
        )
        sys.exit(1)

    # Extraer video_id
    video_id = extract_video_id(args.url)
    if not video_id:
        print("Error: No se pudo extraer el video_id de la URL.", file=sys.stderr)
        sys.exit(1)

    # Obtener metadatos de YouTube API
    metadata = fetch_video_metadata(video_id)

    # Construir payload
    payload = {
        "user_id": args.user_id,
        "url": args.url,
        "video_id": video_id,
    }

    if metadata:
        if metadata.get("title"):
            payload["title"] = metadata["title"]
        if metadata.get("duration"):
            payload["duration"] = metadata["duration"]
        if metadata.get("thumbnail"):
            payload["thumbnail"] = metadata["thumbnail"]

    # Insertar en Supabase
    try:
        result = supabase.table("youtube_videos").insert(payload).execute()

        if result.data:
            row = result.data[0]
            print(f"✓ Video guardado: {row['id']}")
            print(f"  Video ID: {video_id}")
            if row.get("title"):
                print(f"  Título: {row['title']}")
            if row.get("duration"):
                print(f"  Duración: {row['duration']}")
        else:
            print("Error: No se recibió respuesta de la base de datos.", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error al guardar video: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
