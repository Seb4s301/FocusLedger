#!/usr/bin/env python3
"""
manage_tasks.py — Administra las tareas vía CLI usando el email del usuario.
Uso:
  python manage_tasks.py list --email user@example.com
  python manage_tasks.py add --email user@example.com --name "Nueva tarea"
  python manage_tasks.py update --email user@example.com --task-id UUID --status in_progress
  python manage_tasks.py delete --email user@example.com --task-id UUID
"""

import argparse
import re
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.supabase_client import supabase_admin

VALID_STATUSES = ("pending", "in_progress", "completed")
UUID_REGEX = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_uuid(value):
    return bool(UUID_REGEX.match(value))


def validate_email(email):
    return bool(EMAIL_REGEX.match(email))


def get_user_id_by_email(email):
    try:
        users_response = supabase_admin.auth.admin.list_users()
        users = users_response.users
        for u in users:
            if u.email == email:
                return u.id
        print(
            f"Error: No se encontró un usuario con el email {email}",
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as e:
        print(f"Error obteniendo usuario: {e}", file=sys.stderr)
        sys.exit(1)


def verify_task_ownership(task_id, user_id):
    res = (
        supabase_admin.table("tasks")
        .select("user_id")
        .eq("id", task_id)
        .single()
        .execute()
    )
    if not res.data or res.data["user_id"] != user_id:
        return False
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Gestión de tareas de FocusLedger"
    )
    subparsers = parser.add_subparsers(dest="action", required=True)

    parser_list = subparsers.add_parser("list", help="Listar tareas")
    parser_list.add_argument(
        "--email", type=str, required=True, help="Email del usuario"
    )

    parser_add = subparsers.add_parser("add", help="Agregar tarea")
    parser_add.add_argument(
        "--email", type=str, required=True, help="Email del usuario"
    )
    parser_add.add_argument(
        "--name", type=str, required=True, help="Nombre de la tarea"
    )

    parser_update = subparsers.add_parser(
        "update", help="Actualizar estado de tarea"
    )
    parser_update.add_argument("--email", type=str, required=True)
    parser_update.add_argument("--task-id", type=str, required=True)
    parser_update.add_argument(
        "--status",
        type=str,
        choices=VALID_STATUSES,
        required=True,
    )

    parser_delete = subparsers.add_parser("delete", help="Eliminar tarea")
    parser_delete.add_argument("--email", type=str, required=True)
    parser_delete.add_argument("--task-id", type=str, required=True)

    args = parser.parse_args()

    if args.action in ("list", "add"):
        if not validate_email(args.email):
            print("Error: email no es válido.", file=sys.stderr)
            sys.exit(1)

    if args.action in ("update", "delete"):
        if not validate_email(args.email):
            print("Error: email no es válido.", file=sys.stderr)
            sys.exit(1)
        if not validate_uuid(args.task_id):
            print("Error: task-id no es un UUID válido.", file=sys.stderr)
            sys.exit(1)

    if args.action == "update":
        if args.status not in VALID_STATUSES:
            print(
                f"Error: status debe ser uno de {VALID_STATUSES}.",
                file=sys.stderr,
            )
            sys.exit(1)

    if args.action == "list":
        uid = get_user_id_by_email(args.email)
        res = (
            supabase_admin.table("tasks")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .execute()
        )
        tasks = res.data
        if not tasks:
            print("No hay tareas para este usuario.")
            return
        print(f"Tienes {len(tasks)} tareas:")
        for t in tasks:
            print(
                f"- [{t['id']}] {t['name']} (Estado: {t['status']})"
            )

    elif args.action == "add":
        if not args.name or not args.name.strip():
            print("Error: El nombre de la tarea no puede estar vacío.", file=sys.stderr)
            sys.exit(1)
        if len(args.name.strip()) > 200:
            print("Error: El nombre no puede exceder 200 caracteres.", file=sys.stderr)
            sys.exit(1)
        uid = get_user_id_by_email(args.email)
        res = supabase_admin.table("tasks").insert({
            "user_id": uid,
            "name": args.name.strip(),
        }).execute()
        if res.data:
            print(f"Tarea agregada exitosamente. ID: {res.data[0]['id']}")
        else:
            print("Error al agregar tarea.")

    elif args.action == "update":
        uid = get_user_id_by_email(args.email)
        if not verify_task_ownership(args.task_id, uid):
            print(
                "Error: No tienes permiso para modificar esta tarea.",
                file=sys.stderr,
            )
            sys.exit(1)
        res = supabase_admin.table("tasks").update({
            "status": args.status
        }).eq("id", args.task_id).execute()
        if res.data:
            print(f"Estado de la tarea actualizado a {args.status}")
        else:
            print("Error al actualizar tarea.")

    elif args.action == "delete":
        uid = get_user_id_by_email(args.email)
        if not verify_task_ownership(args.task_id, uid):
            print(
                "Error: No tienes permiso para eliminar esta tarea.",
                file=sys.stderr,
            )
            sys.exit(1)
        res = supabase_admin.table("tasks").delete().eq("id", args.task_id).execute()
        print(f"Comando de eliminación enviado para el ID {args.task_id}.")


if __name__ == "__main__":
    main()
