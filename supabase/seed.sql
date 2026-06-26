-- =============================================================================
-- FocusLedger — Seed SQL (datos de ejemplo para desarrollo)
--
-- IMPORTANTE: Reemplaza los UUIDs de usuario con IDs reales de Supabase Auth.
-- Puedes obtenerlos desde el panel de Supabase → Authentication → Users,
-- o ejecutando: SELECT id FROM auth.users LIMIT 5;
--
-- Ejemplo de uso:
--   1. Crea un usuario en Supabase Auth (registro normal o desde el panel).
--   2. Copia su UUID.
--   3. Reemplaza TODAS las ocurrencias de
--      '00000000-0000-0000-0000-000000000001' con ese UUID.
--   4. Ejecuta este script en el SQL Editor de Supabase.
-- =============================================================================

-- UUID de usuario de ejemplo — REEMPLAZAR con un ID real de auth.users
-- Usuario A: '00000000-0000-0000-0000-000000000001'

-- ---------------------------------------------------------------------------
-- Transacciones (2 registros: 1 ingreso, 1 egreso)
-- ---------------------------------------------------------------------------
INSERT INTO transactions (id, user_id, amount, type, category, date, description)
VALUES
    (
        'aaaaaaaa-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        3500.00,
        'income',
        'Salario',
        CURRENT_DATE - INTERVAL '5 days',
        'Pago mensual de nómina'
    ),
    (
        'aaaaaaaa-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        120.50,
        'expense',
        'Alimentación',
        CURRENT_DATE - INTERVAL '2 days',
        'Supermercado semanal'
    );

-- ---------------------------------------------------------------------------
-- Proyecto (1 registro)
-- ---------------------------------------------------------------------------
INSERT INTO projects (id, user_id, name, description, status)
VALUES
    (
        'bbbbbbbb-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'FocusLedger MVP',
        'Desarrollo del producto mínimo viable de FocusLedger',
        'active'
    );

-- ---------------------------------------------------------------------------
-- Tareas (2 registros: 1 tarea principal + 1 subtarea)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, user_id, project_id, parent_task_id, name, status)
VALUES
    (
        'cccccccc-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001',
        NULL,                                       -- tarea raíz (sin padre)
        'Implementar autenticación',
        'in_progress'
    ),
    (
        'cccccccc-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001',     -- subtarea de la tarea anterior
        'Crear formulario de login',
        'pending'
    );

-- ---------------------------------------------------------------------------
-- Nota (1 registro)
-- ---------------------------------------------------------------------------
INSERT INTO notes (id, user_id, content)
VALUES
    (
        'dddddddd-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Revisar documentación de Supabase RLS antes de implementar las políticas de seguridad en producción.'
    );
