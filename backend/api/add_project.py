#!/usr/bin/env python3
"""
add_project.py — Crea un proyecto vía CLI.

Uso:
    python add_project.py --name "Mi Proyecto" --user-id UUID
    python add_project.py --name "App Web" --description "Proyecto fullstack" --user-id UUID

Requisitos: 5.1
"""

import argparse
import sys
import os

# Agregar el directorio padre para importar lib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from lib.supabase_client import supabase


def main():
    parser = argparse.ArgumentParser(
        description="Crea un nuevo proyecto en FocusLedger."
    )
    parser.add_argument("--name", type=str, required=True, help="Nombre del proyecto")
    parser.add_argument("--description", type=str, default=None, help="Descripción opcional")
    parser.add_argument("--user-id", type=str, required=True, help="UUID del usuario")

    args = parser.parse_args()

    # Validar nombre no vacío
    if not args.name or args.name.strip() == "":
        print("Error: El nombre del proyecto no puede estar vacío.", file=sys.stderr)
        sys.exit(1)

    # Construir payload
    payload = {
        "user_id": args.user_id,
        "name": args.name.strip(),
    }
    if args.description and args.description.strip():
        payload["description"] = args.description.strip()

    # Insertar en Supabase
    try:
        result = supabase.table("projects").insert(payload).execute()

        if result.data:
            row = result.data[0]
            print(f"✓ Proyecto creado: {row['id']}")
            print(f"  Nombre: {row['name']}")
            if row.get("description"):
                print(f"  Descripción: {row['description']}")
        else:
            print("Error: No se recibió respuesta de la base de datos.", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error al crear proyecto: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
