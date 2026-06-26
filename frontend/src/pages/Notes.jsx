import { useState, useEffect } from 'react';
import { createNote, listNotes, deleteNote } from '../features/notes/noteService.js';

/**
 * Notes.jsx
 *
 * Página de notas rápidas del usuario.
 * - Lista de notas existentes
 * - Formulario para crear nota (textarea)
 * - Botón eliminar por fila
 *
 * Requisitos: 9.1
 */

function Notes() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const data = await listNotes();
    setNotes(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    const { error } = await createNote({ content });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setContent('');
    await loadNotes();
  }

  async function handleDelete(noteId) {
    if (!window.confirm('¿Eliminar esta nota? Esta acción no se puede deshacer.')) return;

    const { error } = await deleteNote(noteId);
    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      return;
    }
    await loadNotes();
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Notas</h1>

      {/* Formulario para crear nota */}
      <section
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          border: '1px solid var(--border-color)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
          Nueva nota
        </h2>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              role="alert"
              style={{
                color: 'var(--color-accent)',
                background: 'var(--color-shadow)',
                border: '1px solid var(--color-accent)',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              {formError}
            </div>
          )}

          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            required
            rows={4}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              fontSize: 14,
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              marginBottom: 12,
              background: 'var(--bg-primary)',
              color: 'var(--text-main)',
            }}
          />

          <button
            id="add-note-btn"
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Guardando...' : 'Agregar nota'}
          </button>
        </form>
      </section>

      {/* Lista de notas */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Mis notas ({notes.length})
        </h2>

        {notes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            No tienes notas todavía. ¡Crea la primera!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notes.map((note) => (
              <div
                key={note.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  position: 'relative',
                }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)' }}>
                  {note.content}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatDate(note.created_at)}
                  </span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    style={{
                      background: 'var(--color-shadow)',
                      color: 'var(--color-accent)',
                      border: '1px solid var(--color-accent)',
                      borderRadius: 6,
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notes;
