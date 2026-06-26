import React, { useState, useRef, useEffect } from 'react';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function CustomDatePicker({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  // viewDate controla el mes y año que estamos viendo en el calendario
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(`${value}T12:00:00`) : new Date();
  });
  const containerRef = useRef(null);

  // Cerrar el popup si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Actualizar viewDate si cambia el valor externamente (ej. botón "Este mes")
  useEffect(() => {
    if (value && !isOpen) {
      setViewDate(new Date(`${value}T12:00:00`));
    }
  }, [value, isOpen]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Obtener la cantidad de días del mes actual y el primer día de la semana
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Generar la cuadrícula del calendario
  const grid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    grid.push(null); // Espacios vacíos para los días antes del día 1
  }
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }

  // Desglosar la fecha seleccionada para marcarla en el calendario
  let selY, selM, selD;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      selY = parseInt(parts[0], 10);
      selM = parseInt(parts[1], 10) - 1;
      selD = parseInt(parts[2], 10);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', minWidth: 160 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '7px 12px',
          borderRadius: 6,
          border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--border-color)'}`,
          background: 'var(--bg-primary)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(0,100,0,0.2)' : 'none'
        }}
      >
        <span>{value || 'Seleccionar...'}</span>
        <span style={{ fontSize: 16, color: 'var(--color-primary)' }}>📅</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 20,
          zIndex: 100,
          width: 300,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.8)'
        }}>
          {/* Header con Año en grande */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '1px' }}>
              {currentYear}
            </div>
          </div>

          {/* Navegación de mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button 
              onClick={handlePrevMonth} 
              type="button" 
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--text-main)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: 'none' }}
            >
              ←
            </button>
            <span style={{ fontWeight: 600, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {MONTHS[currentMonth]}
            </span>
            <button 
              onClick={handleNextMonth} 
              type="button" 
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--text-main)', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: 'none' }}
            >
              →
            </button>
          </div>

          {/* Días de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, textAlign: 'center' }}>
            {DAYS.map(d => (
              <span key={d} style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 700 }}>{d}</span>
            ))}
          </div>

          {/* Grid de días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {grid.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const isSelected = selY === currentYear && selM === currentMonth && selD === day;
              
              // Para destacar el día de hoy
              const isToday = new Date().getFullYear() === currentYear && 
                              new Date().getMonth() === currentMonth && 
                              new Date().getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleSelectDate(day)}
                  style={{
                    textAlign: 'center',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : (isToday ? 600 : 400),
                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? '#fff' : (isToday ? 'var(--color-primary)' : 'var(--text-main)'),
                    border: isToday && !isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
