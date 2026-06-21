// content.js — Extrae info del problema de LeetCode (DOM actualizado 2024-2025)

function extractProblemInfo() {
  const info = {
    number: null,
    title: null,
    difficulty: null,
    tags: [],
    solution: null,
    url: window.location.href,
  };

  // ── Número y título ──────────────────────────────────────────────────────
  // 1) Desde el título de la pestaña: "1. Two Sum - LeetCode"
  const pageTitle = document.title || "";
  const titleMatch = pageTitle.match(/^(\d+)\.\s+(.+?)\s*[-|–]/);
  if (titleMatch) {
    info.number = parseInt(titleMatch[1]);
    info.title  = titleMatch[2].trim();
  }

  // 2) Fallback DOM — LeetCode React monta el número como texto "123." en un div
  if (!info.number || !info.title) {
    // Selectores observados en la UI 2024 de LeetCode
    const selectors = [
      'a[href*="/problems/"] .text-title-large',   // sidebar link title
      '[class*="title__"] a',
      'div[data-cy="question-title"]',
      '.question-title',
      // Nuevo layout: el título está en un <div> dentro del panel izquierdo
      'div.flex.items-start.justify-between a[href*="/problems/"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const raw = el.textContent.trim();
        // Puede venir como "42. Trapping Rain Water"
        const m = raw.match(/^(\d+)\.\s+(.+)$/);
        if (m) {
          info.number = info.number || parseInt(m[1]);
          info.title  = info.title  || m[2].trim();
        } else {
          info.title = info.title || raw;
        }
        break;
      }
    }
  }

  // 3) Número desde la URL como último recurso
  if (!info.number) {
    // LeetCode tiene URLs como /problems/two-sum/ — no contiene número directamente
    // pero podemos leer el elemento del contador frontend
    const frontendId = document.querySelector(
      '[class*="questionFrontendId"], [data-key="question-detail"] span'
    );
    if (frontendId) {
      const n = parseInt(frontendId.textContent.trim());
      if (!isNaN(n)) info.number = n;
    }
  }

  // ── Dificultad ──────────────────────────────────────────────────────────
  // Buscar el badge exacto de dificultad (sin hijos, texto es Easy/Medium/Hard)
  const allEls = document.querySelectorAll('div, span');
  for (const el of allEls) {
    const text = el.textContent.trim();
    if (["Easy", "Medium", "Hard"].includes(text) && el.children.length === 0) {
      info.difficulty = text;
      break;
    }
  }

  // ── Tags / Categorías ───────────────────────────────────────────────────
  // LeetCode muestra los topic tags en la sección de descripción (a veces ocultos)
  // Selector 2024: los tags están en botones o spans con "topic-tag" en la clase
  const tagEls = document.querySelectorAll(
    '[class*="topic-tag"], [class*="topicTag"], ' +
    'a[href*="/tag/"], ' +
    'div[class*="tags"] span, ' +
    '.tag__2vM3'
  );
  const tagSet = new Set();
  tagEls.forEach(el => {
    const t = el.textContent.trim();
    if (t && t.length > 1 && t.length < 40) tagSet.add(t);
  });
  info.tags = [...tagSet].slice(0, 8); // máximo 8 tags

  // ── Código del editor Monaco ────────────────────────────────────────────
  // Método 1: API de Monaco si está expuesto en window
  try {
    if (window.monaco) {
      const editors = window.monaco.editor.getEditors();
      if (editors.length > 0) {
        info.solution = editors[0].getValue();
      }
    }
  } catch (_) {}

  // Método 2: Leer las líneas renderizadas del editor (fallback visual)
  if (!info.solution) {
    try {
      const lines = document.querySelectorAll('.view-lines .view-line');
      if (lines.length > 0) {
        info.solution = Array.from(lines).map(l => l.textContent).join('\n');
      }
    } catch (_) {}
  }

  return info;
}

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getProblemInfo") {
    const info = extractProblemInfo();
    sendResponse(info);
  }
  return true;
});
