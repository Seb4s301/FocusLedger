#!/usr/bin/env python3
"""
manage_tasks.py — Administra las tareas vía CLI usando el email del usuario.
Uso:
  python manage_tasks.py list --email user@example.com
  python manage_tasks.py add --email user@example.com --name "Nueva tarea"
  python manage_tasks.py update --task-id UUID --status in_progress
  python manage_tasks.py delete --task-id UUID
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.supabase_client import supabase

def get_user_id_by_email(email):
    try:
        users_response = supabase.auth.admin.list_users()
        users = users_response.users
        for u in users:
            if u.email == email:
                return u.id
        print(f"Error: No se encontró un usuario con el email {email}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error obteniendo usuario: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Gestión de tareas de FocusLedger")
    subparsers = parser.add_subparsers(dest="action", required=True)

    # list
    parser_list = subparsers.add_parser("list", help="Listar tareas")
    parser_list.add_argument("--email", type=str, required=True, help="Email del usuario")

    # add
    parser_add = subparsers.add_parser("add", help="Agregar tarea")
    parser_add.add_argument("--email", type=str, required=True, help="Email del usuario")
    parser_add.add_argument("--name", type=str, required=True, help="Nombre de la tarea")

    # update
    parser_update = subparsers.add_parser("update", help="Actualizar estado de tarea")
    parser_update.add_argument("--task-id", type=str, required=True)
    parser_update.add_argument("--status", type=str, choices=["pending", "in_progress", "completed"], required=True)

    # delete
    parser_delete = subparsers.add_parser("delete", help="Eliminar tarea")
    parser_delete.add_argument("--task-id", type=str, required=True)

    args = parser.parse_args()

    if args.action == "list":
        uid = get_user_id_by_email(args.email)
        res = supabase.table("tasks").select("*").eq("user_id", uid).order("created_at", desc=True).execute()
        tasks = res.data
        if not tasks:
            print("No hay tareas para este usuario.")
            return
        print(f"Tienes {len(tasks)} tareas:")
        for t in tasks:
            print(f"- [{t['id']}] {t['name']} (Estado: {t['status']})")

    elif args.action == "add":
        uid = get_user_id_by_email(args.email)
        res = supabase.table("tasks").insert({
            "user_id": uid,
            "name": args.name
        }).execute()
        if res.data:
            print(f"Tarea agregada exitosamente. ID: {res.data[0]['id']}")
        else:
            print("Error al agregar tarea.")

    elif args.action == "update":
        res = supabase.table("tasks").update({
            "status": args.status
        }).eq("id", args.task_id).execute()
        if res.data:
            print(f"Estado de la tarea actualizado a {args.status}")
        else:
            print("Error al actualizar tarea. Asegúrate de que el ID es correcto.")

    elif args.action == "delete":
        res = supabase.table("tasks").delete().eq("id", args.task_id).execute()
        print(f"Comando de eliminación enviado para el ID {args.task_id}.")

if __name__ == "__main__":
    main()
