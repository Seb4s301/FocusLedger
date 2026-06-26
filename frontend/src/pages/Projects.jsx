import { useState, useEffect } from 'react';
import {
  createProject,
  listProjects,
  createTask,
  listTasks,
  createSubtask,
  markTaskComplete,
  deleteTask,
} from '../features/tasks/taskService.js';
import {
  calcProjectProgress,
  calcTotalTimeWorked,
  checkAndPropagateCompletion,
} from '../features/tasks/progressService.js';

// ─── Badge de estado ────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = {
    pending:     { background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' },
    in_progress: { background: 'rgba(0, 100, 0, 0.15)', color: 'var(--color-primary)' },
    completed:   { background: 'var(--bg-primary)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
  };
  const labels = {
    pending:     'Pendiente',
    in_progress: 'En progreso',
    completed:   'Completada',
  };
  const style = styles[status] || styles.pending;
  return (
    <span style={{ ...style, padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {labels[status] || status}
    </span>
  );
}

// ─── Fila de tarea (raíz o subtarea) ────────────────────────────────────────

function TaskRow({ task, indent, onComplete, onDelete, onAddSubtask, subtasks }) {
  const [subtaskName, setSubtaskName] = useState('');
  const [subtaskError, setSubtaskError] = useState('');
  const [timeWorked, setTimeWorked] = useState(null);

  useEffect(() => {
    calcTotalTimeWorked(task.id).then(setTimeWorked);
  }, [task.id]);

  async function handleAddSubtask(e) {
    e.preventDefault();
    setSubtaskError('');
    if (!subtaskName.trim()) {
      setSubtaskError('El nombre de la subtarea es requerido.');
      return;
    }
    const { error } = await onAddSubtask({ name: subtaskName, parentTaskId: task.id });
    if (error) {
      setSubtaskError(error.message);
    } else {
      setSubtaskName('');
    }
  }

  return (
    <>
      {/* Fila principal de la tarea */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          marginLeft: indent,
          background: indent > 0 ? 'var(--bg-secondary)' : 'var(--bg-surface)',
          borderRadius: '8px',
          marginBottom: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        <span style={{ flex: 1, fontWeight: indent === 0 ? 600 : 400, color: task.status === 'completed' ? 'var(--text-disabled)' : 'var(--text-main)', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.name}</span>
        <StatusBadge status={task.status} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '60px' }}>
          {timeWorked !== null ? `${timeWorked} min` : '…'}
        </span>
        {task.status !== 'completed' && (
          <button
            onClick={() => onComplete(task.id)}
            style={{ padding: '4px 10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Completar
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          style={{ padding: '4px 10px', background: 'var(--color-shadow)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Eliminar
        </button>
      </div>

      {/* Subtareas anidadas */}
      {subtasks && subtasks.length > 0 &&
        subtasks.map((sub) => (
          <TaskRow
            key={sub.id}
            task={sub}
            indent={indent + 24}
            onComplete={onComplete}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
            subtasks={[]}
          />
        ))}

      {/* Formulario inline para agregar subtarea (solo en tareas raíz) */}
      {indent === 0 && (
        <form
          onSubmit={handleAddSubtask}
          style={{ display: 'flex', gap: '8px', marginLeft: 24, marginBottom: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            placeholder="Nueva subtarea…"
            value={subtaskName}
            onChange={(e) => setSubtaskName(e.target.value)}
            style={{ flex: 1, padding: '5px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
          />
          <button
            type="submit"
            style={{ padding: '5px 12px', background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Agregar subtarea
          </button>
          {subtaskError && (
            <span style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }}>{subtaskError}</span>
          )}
        </form>
      )}
    </>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

function Projects() {
  const [projects, setProjects] = useState([]);
  const [projectProgress, setProjectProgress] = useState({});
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [projectError, setProjectError] = useState('');

  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newTaskName, setNewTaskName] = useState('');
  const [taskError, setTaskError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const data = await listProjects();
    setProjects(data);
    const progressMap = {};
    await Promise.all(
      data.map(async (p) => {
        progressMap[p.id] = await calcProjectProgress(p.id);
      })
    );
    setProjectProgress(progressMap);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    setProjectError('');
    const { error } = await createProject({ name: newProjectName, description: newProjectDesc });
    if (error) { setProjectError(error.message); return; }
    setNewProjectName('');
    setNewProjectDesc('');
    await loadProjects();
  }

  async function handleSelectProject(project) {
    setSelectedProject(project);
    await loadTasks(project.id);
  }

  async function loadTasks(projectId) {
    const data = await listTasks(projectId);
    setTasks(data);
    const p = await calcProjectProgress(projectId);
    setProgress(p);
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskError('');
    const { error } = await createTask({ name: newTaskName, projectId: selectedProject.id });
    if (error) { setTaskError(error.message); return; }
    setNewTaskName('');
    await loadTasks(selectedProject.id);
  }

  async function handleAddSubtask({ name, parentTaskId }) {
    const { error } = await createSubtask({ name, parentTaskId });
    if (!error) await loadTasks(selectedProject.id);
    return { error };
  }

  async function handleCompleteTask(taskId) {
    await markTaskComplete(taskId);
    await checkAndPropagateCompletion(taskId);
    await loadTasks(selectedProject.id);
    const updatedProgress = await calcProjectProgress(selectedProject.id);
    setProjectProgress((prev) => ({ ...prev, [selectedProject.id]: updatedProgress }));
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;
    await deleteTask(taskId);
    await loadTasks(selectedProject.id);
  }

  const rootTasks = tasks.filter((t) => t.parent_task_id === null);
  const getSubtasks = (parentId) => tasks.filter((t) => t.parent_task_id === parentId);

  // ── Vista de detalle de proyecto ──
  if (selectedProject) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
        <button
          onClick={() => setSelectedProject(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '1rem', marginBottom: '16px', padding: 0 }}
        >
          ← Volver
        </button>

        <h1 style={{ marginBottom: '8px' }}>{selectedProject.name}</h1>

        {/* Barra de progreso */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '9999px', height: '10px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: 'var(--color-primary)', width: `${progress}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{progress}% completado</span>
        </div>

        {/* Formulario nueva tarea */}
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Nombre de la tarea"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            required
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
          />
          <button
            type="submit"
            style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Agregar tarea
          </button>
        </form>
        {taskError && (
          <p style={{ color: 'var(--color-accent)', marginBottom: '16px', fontSize: '0.9rem' }}>{taskError}</p>
        )}

        {/* Lista de tareas */}
        <div style={{ marginTop: '16px' }}>
          {rootTasks.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No hay tareas en este proyecto todavía.</p>
          ) : (
            rootTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                indent={0}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                subtasks={getSubtasks(task.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Vista de lista de proyectos ──
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '24px' }}>Proyectos</h1>

      {/* Formulario nuevo proyecto */}
      <form
        onSubmit={handleCreateProject}
        style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        <input
          type="text"
          placeholder="Nombre del proyecto"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          required
          style={{ flex: '1 1 200px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={newProjectDesc}
          onChange={(e) => setNewProjectDesc(e.target.value)}
          style={{ flex: '2 1 300px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
        />
        <button
          type="submit"
          style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Crear proyecto
        </button>
        {projectError && (
          <p style={{ color: 'var(--color-accent)', width: '100%', margin: 0, fontSize: '0.9rem' }}>{projectError}</p>
        )}
      </form>

      {/* Lista de proyectos */}
      {projects.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No tienes proyectos todavía. ¡Crea el primero!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map((project) => {
            const pct = projectProgress[project.id] ?? 0;
            return (
              <div key={project.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>{project.name}</span>
                  <button
                    onClick={() => handleSelectProject(project)}
                    style={{ padding: '6px 14px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Ver tareas
                  </button>
                </div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: '9999px', height: '8px', width: '100%', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ background: 'var(--color-primary)', width: `${pct}%`, height: '100%', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Projects;
