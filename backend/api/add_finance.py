#!/usr/bin/env python3
"""
add_finance.py — Registra una transacción financiera vía CLI.

Uso:
    python add_finance.py --amount 150.50 --category Alimentación --type expense --date 2025-01-15
    python add_finance.py --amount 5000 --category Salario --type income --date 2025-01-01 --description "Pago quincenal"

Requisitos: 2.1, 2.2, 2.3, 2.4
"""

import argparse
import sys
import os
from datetime import datetime

# Agregar el directorio padre para importar lib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from lib.supabase_client import supabase

VALID_TYPES = ("income", "expense")


def validate_args(args):
    """Valida los argumentos CLI con las mismas reglas que el frontend."""
    errors = []

    # amount > 0
    if args.amount is None or args.amount <= 0:
        errors.append("El monto debe ser mayor a 0.")

    # type válido
    if args.type not in VALID_TYPES:
        errors.append(f"El tipo debe ser 'income' o 'expense'. Recibido: '{args.type}'")

    # category no vacía
    if not args.category or args.category.strip() == "":
        errors.append("La categoría no puede estar vacía.")

    # date válida
    if not args.date or args.date.strip() == "":
        errors.append("La fecha no puede estar vacía.")
    else:
        try:
            datetime.strptime(args.date, "%Y-%m-%d")
        except ValueError:
            errors.append(f"Formato de fecha inválido: '{args.date}'. Usar YYYY-MM-DD.")

    return errors


def main():
    parser = argparse.ArgumentParser(
        description="Registra una transacción financiera en FocusLedger."
    )
    parser.add_argument("--amount", type=float, required=True, help="Monto de la transacción (> 0)")
    parser.add_argument("--category", type=str, required=True, help="Categoría de la transacción")
    parser.add_argument("--type", type=str, required=True, choices=VALID_TYPES, help="Tipo: income o expense")
    parser.add_argument("--date", type=str, required=True, help="Fecha en formato YYYY-MM-DD")
    parser.add_argument("--description", type=str, default=None, help="Descripción opcional")
    parser.add_argument("--user-id", type=str, required=True, help="UUID del usuario")

    args = parser.parse_args()

    # Validar
    errors = validate_args(args)
    if errors:
        for err in errors:
            print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)

    # Construir payload
    payload = {
        "user_id": args.user_id,
        "amount": round(args.amount, 2),
        "category": args.category.strip(),
        "type": args.type,
        "date": args.date,
    }
    if args.description and args.description.strip():
        payload["description"] = args.description.strip()

    # Insertar en Supabase
    try:
        result = supabase.table("transactions").insert(payload).execute()

        if result.data:
            row = result.data[0]
            print(f"✓ Transacción registrada: {row['id']}")
            print(f"  Tipo: {row['type']}  |  Monto: ${row['amount']}  |  Categoría: {row['category']}  |  Fecha: {row['date']}")
        else:
            print("Error: No se recibió respuesta de la base de datos.", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error al insertar transacción: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
