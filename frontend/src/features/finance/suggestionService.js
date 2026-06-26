const CACHE_KEY = 'focusledger_suggestions_cache';

/**
 * Obtiene sugerencias financieras desde la API local de OpenClaw.
 *
 * OpenClaw expone un endpoint compatible con OpenAI en localhost.
 * El servicio envía las transacciones como contexto y pide
 * sugerencias financieras al modelo configurado.
 *
 * Si la llamada falla (ej. OpenClaw no está corriendo), retorna
 * las sugerencias almacenadas en caché.
 *
 * @param {object[]} transactions
 * @returns {Promise<string[]>}
 */
export async function fetchSuggestions(transactions) {
  try {
    const apiUrl = import.meta.env.VITE_LLM_API_URL || 'http://localhost:11434/v1/chat/completions';
    const apiKey = import.meta.env.VITE_LLM_API_KEY || 'ollama';

    // Preparar el resumen de transacciones para el prompt
    const summary = buildTransactionSummary(transactions);

    if (!summary) {
      return getCachedSuggestions();
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_LLM_MODEL || 'gemma4:e4b',
        messages: [
          {
            role: 'system',
            content: `Eres un asesor financiero personal inteligente. Analiza las transacciones del usuario y genera exactamente 3 sugerencias prácticas y específicas para mejorar sus finanzas. Responde SOLO con un JSON array de strings, sin texto adicional. Ejemplo: ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]`,
          },
          {
            role: 'user',
            content: summary,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de API LLM: ${response.status}`);
    }

    const result = await response.json();

    // Extraer el contenido de la respuesta (formato OpenAI-compatible)
    let suggestionsText = result?.choices?.[0]?.message?.content || '';

    // Intentar parsear como JSON array
    let suggestions = [];
    try {
      // Limpiar posible markdown ```json ... ```
      suggestionsText = suggestionsText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      suggestions = JSON.parse(suggestionsText);
      if (!Array.isArray(suggestions)) {
        suggestions = [suggestionsText];
      }
    } catch {
      // Si no es JSON válido, tratar como texto plano dividido por líneas
      suggestions = suggestionsText
        .split('\n')
        .map(s => s.replace(/^\d+\.\s*/, '').trim())
        .filter(s => s.length > 0);
    }

    // Guardar en caché
    if (suggestions.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(suggestions));
    }

    return suggestions;
  } catch (err) {
    console.warn('fetchSuggestions falló, usando caché:', err.message);
    return getCachedSuggestions();
  }
}

/**
 * Construye un resumen textual de las transacciones para enviar al LLM.
 * @param {object[]} transactions
 * @returns {string|null}
 */
function buildTransactionSummary(transactions) {
  if (!transactions || transactions.length === 0) return null;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Agrupar egresos por categoría
  const expensesByCategory = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
    });

  const categoryBreakdown = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, total]) => `  - ${cat}: $${total.toFixed(2)}`)
    .join('\n');

  return `Resumen financiero del usuario:
- Total ingresos: $${totalIncome.toFixed(2)}
- Total egresos: $${totalExpense.toFixed(2)}
- Balance: $${balance.toFixed(2)}
- Tasa de ahorro: ${totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%

Desglose de egresos por categoría:
${categoryBreakdown || '  (sin egresos)'}

Total de transacciones: ${transactions.length}

Con base en estos datos, genera 3 sugerencias financieras prácticas y específicas.`;
}

/**
 * Retorna las sugerencias almacenadas en caché (localStorage).
 * Si no hay caché o hay error de parse, retorna array vacío.
 * @returns {string[]}
 */
export function getCachedSuggestions() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return [];
    return JSON.parse(cached);
  } catch {
    return [];
  }
}
