#!/usr/bin/env python3
"""
add_note.py — Registra una nota vía CLI.

Uso:
    python add_note.py --content "Recordar revisar el presupuesto mensual" --user-id UUID

Requisitos: 9.1
"""

import argparse
import sys
import os

# Agregar el directorio padre para importar lib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from lib.supabase_client import supabase


def main():
    parser = argparse.ArgumentParser(
        description="Registra una nueva nota en FocusLedger."
    )
    parser.add_argument("--content", type=str, required=True, help="Contenido de la nota")
    parser.add_argument("--user-id", type=str, required=True, help="UUID del usuario")

    args = parser.parse_args()

    # Validar contenido no vacío
    if not args.content or args.content.strip() == "":
        print("Error: El contenido de la nota no puede estar vacío.", file=sys.stderr)
        sys.exit(1)

    # Construir payload
    payload = {
        "user_id": args.user_id,
        "content": args.content.strip(),
    }

    # Insertar en Supabase
    try:
        result = supabase.table("notes").insert(payload).execute()

        if result.data:
            row = result.data[0]
            print(f"✓ Nota registrada: {row['id']}")
            preview = row["content"][:80]
            if len(row["content"]) > 80:
                preview += "…"
            print(f"  Contenido: {preview}")
        else:
            print("Error: No se recibió respuesta de la base de datos.", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error al registrar nota: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
