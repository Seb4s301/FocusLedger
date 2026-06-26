-- =============================================================================
-- FocusLedger — Schema SQL
-- Aplicar en Supabase SQL Editor o con la CLI de Supabase.
-- Requisitos: 9.1, 9.2, 1.6
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Función auxiliar: actualiza updated_at automáticamente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
    category    TEXT        NOT NULL,
    date        DATE        NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
    ON transactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL CHECK (char_length(name) > 0),
    description TEXT,
    status      TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed', 'archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
    ON projects
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. tasks  (auto-referencia para subtareas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
    parent_task_id  UUID        REFERENCES tasks(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL CHECK (char_length(name) > 0),
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'in_progress', 'completed')),
    completed_at    TIMESTAMPTZ,
    total_time_min  INTEGER     NOT NULL DEFAULT 0,  -- tiempo acumulado en minutos
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
    ON tasks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. focus_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS focus_sessions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id          UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    status           TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'completed', 'cancelled')),
    planned_duration INTEGER     NOT NULL,   -- minutos planificados
    actual_duration  INTEGER,                -- minutos efectivamente trabajados (nullable)
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at         TIMESTAMPTZ             -- nullable: se rellena al finalizar/cancelar
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own focus sessions"
    ON focus_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. time_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id   UUID        NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    task_id      UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    duration_min INTEGER     NOT NULL CHECK (duration_min > 0),
    logged_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own time logs"
    ON time_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. youtube_videos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS youtube_videos (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url        TEXT        NOT NULL,
    video_id   TEXT        NOT NULL,
    title      TEXT,                   -- nullable: se rellena con YouTube Data API
    duration   TEXT,                   -- nullable: formato ISO 8601 (ej: PT4M13S)
    thumbnail  TEXT,                   -- nullable: URL de miniatura
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own youtube videos"
    ON youtube_videos
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
    ON notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
