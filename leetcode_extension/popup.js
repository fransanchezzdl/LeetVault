const PORT  = 7842;
const API   = `http://localhost:${PORT}`;
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY_STORAGE = "leetvault_groq_key";

let problemInfo = null;

// ── Groq hint ────────────────────────────────────────────────────────────────
async function getHint() {
  const btn      = document.getElementById("btn-hint");
  const hintBox  = document.getElementById("hint-box");
  const hintText = document.getElementById("hint-text");
  const apiRow   = document.getElementById("hint-api-row");
  const keyInput = document.getElementById("groq-key-input");

  const title = document.getElementById("prob-title").value.trim()
    || problemInfo?.title || "";

  if (!title) {
    hintBox.classList.add("visible");
    hintText.textContent = "No se detectó título del problema.";
    return;
  }

  // Check saved key
  let apiKey = (await chrome.storage.local.get(GROQ_KEY_STORAGE))[GROQ_KEY_STORAGE] || "";

  // If no key, show input field
  if (!apiKey) {
    hintBox.classList.add("visible");
    hintText.textContent = "Introduce tu API key de Groq para obtener pistas:";
    apiRow.classList.add("visible");

    // If user already typed a key, use it
    const typed = keyInput.value.trim();
    if (!typed) return;
    apiKey = typed;
  } else {
    apiRow.classList.remove("visible");
  }

  // If there's a typed key pending, save it
  const typed = keyInput.value.trim();
  if (typed && typed.startsWith("gsk_")) {
    apiKey = typed;
    await chrome.storage.local.set({ [GROQ_KEY_STORAGE]: apiKey });
    apiRow.classList.remove("visible");
  }

  if (!apiKey) return;

  // Show loading
  btn.classList.add("loading");
  btn.innerHTML =
    '<svg class="icon spinner"><use href="#i-loader"/></svg><span>Pensando enfoque...</span>';
  hintBox.classList.add("visible");
  hintText.textContent = "Analizando tu código...";

  // Get current code from the solution textarea
  const currentCode = document.getElementById("solution").value.trim();
  const diffEl = document.getElementById("prob-diff");
  const difficulty = problemInfo?.difficulty || (diffEl?.textContent || "").trim();

  try {
    const SYSTEM_PROMPT = `Eres un mentor de algoritmos para entrevistas técnicas. El usuario está intentando resolver un problema de LeetCode y te enviará:
- Título del problema
- Dificultad (Easy / Medium / Hard)
- Su código actual (puede estar incompleto, vacío o con errores)

Tu única misión es darle UNA pista corta de enfoque (estrategia o patrón clave) que le permita avanzar hacia la solución, basada en lo que ya lleva escrito.

Reglas estrictas:
1. Responde en español, en 2-3 frases como máximo (≤ 60 palabras).
2. NO corrijas sintaxis, no señales errores, no comentes el código línea por línea.
3. NO des la solución completa ni pseudocódigo.
4. Sí puedes mencionar el patrón (e.g. "two pointers", "sliding window", "DP en 1D", "BFS por niveles") y la estructura de datos clave.
5. Si el código del usuario apunta a un enfoque correcto, valida la dirección con una frase y sugiere el siguiente paso.
6. Si apunta a un enfoque equivocado, redirige sin juzgar: nombra el patrón correcto y la idea central.
7. Si no hay código, da la pista basándote solo en el título y la dificultad.
8. Sin emojis, sin saludos, sin despedidas. Directo.`;

    const userMessage =
      `Problema: "${title}"\n` +
      `Dificultad: ${difficulty || "?"}\n\n` +
      (currentCode
        ? `Código actual:\n\`\`\`\n${currentCode}\n\`\`\``
        : `(Sin código todavía.)`);

    const res = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 401) {
      hintText.textContent = "API key inválida. Bórrala y vuelve a introducirla.";
      await chrome.storage.local.remove(GROQ_KEY_STORAGE);
      apiRow.classList.add("visible");
      return;
    }

    const data = await res.json();
    const hint = data.choices?.[0]?.message?.content?.trim();
    hintText.textContent = hint || "No se pudo generar la pista.";

  } catch (e) {
    hintText.textContent = "Error de conexión con Groq.";
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML =
      '<svg class="icon"><use href="#i-sparkles"/></svg><span>Pista IA</span>';
  }
}

// ── Utils ────────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function show(panelId) {
  document.getElementById("loading").style.display = "none";
  ["panel-nopage", "panel-noserver", "panel-form"].forEach(id => {
    document.getElementById(id).classList.remove("active");
  });
  document.getElementById(panelId)?.classList.add("active");
}

function setStatus(msg, type) {
  const el = document.getElementById("status-msg");
  el.className = type || ""; // "ok" | "err" | ""
  el.innerHTML = "";
  if (!type) return;
  const iconId = type === "ok" ? "i-check" : "i-x";
  el.innerHTML = `<svg class="icon"><use href="#${iconId}"/></svg><span></span>`;
  el.querySelector("span").textContent = msg;
}

function setServerStatus(ok) {
  const dot   = document.getElementById("server-dot");
  const label = document.getElementById("server-label");
  dot.className   = "dot " + (ok ? "ok" : "err");
  label.textContent = ok ? "Conectado" : "Sin conexión";
}

// ── API calls ────────────────────────────────────────────────────────────────
async function checkServer() {
  try {
    const res = await fetch(`${API}/status`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    const ok = data.status === "ok";
    setServerStatus(ok);
    return ok;
  } catch {
    setServerStatus(false);
    return false;
  }
}

async function checkExisting(number) {
  try {
    const res = await fetch(`${API}/problem/${number}`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.found ? data.problem : null;
  } catch {
    return null;
  }
}

async function saveProblem(status) {
  const titleEl = document.getElementById("prob-title");
  const title = titleEl.value.trim() || problemInfo?.title || "";

  if (!title) {
    setStatus("Escribe un título antes de guardar", "err");
    titleEl.focus();
    return;
  }

  const payload = {
    number:     problemInfo?.number || null,
    title:      title,
    difficulty: problemInfo?.difficulty || "Medium",
    pattern:    document.getElementById("pattern").value,
    status:     status,
    notes:      document.getElementById("notes").value.trim(),
    solution:   document.getElementById("solution").value.trim(),
    date_solved: document.getElementById("date-solved").value || todayISO(),
  };

  const btn = document.getElementById("btn-save");
  const savedLabel = btn.innerHTML;
  btn.innerHTML = '<svg class="icon spinner"><use href="#i-loader"/></svg><span>Guardando...</span>';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/save`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(4000),
    });
    const data = await res.json();

    if (data.saved) {
      const verb = data.action === "created" ? "¡Guardado!" : "¡Actualizado!";
      setStatus(verb, "ok");
      document.getElementById("already-saved").classList.add("visible");
      setTimeout(() => window.close(), 1600);
    } else {
      setStatus("El servidor devolvió un error", "err");
    }
  } catch (e) {
    setStatus("No se pudo conectar con la app de escritorio", "err");
  } finally {
    btn.innerHTML = savedLabel;
    btn.disabled = false;
  }
}

// ── Fill form ────────────────────────────────────────────────────────────────
function fillForm(info, existing) {
  // Número
  document.getElementById("prob-num").textContent =
    info.number ? `#${info.number}` : "#?";

  // Título (editable input)
  const titleInput = document.getElementById("prob-title");
  titleInput.value = info.title || "";

  // Dificultad badge
  const diff    = info.difficulty || "";
  const diffEl  = document.getElementById("prob-diff");
  diffEl.textContent = diff || "—";
  diffEl.className   = `diff-badge diff-${diff}`;

  // Tags
  const tagsWrap = document.getElementById("tags-wrap");
  tagsWrap.innerHTML = ""; // limpiar
  if (info.tags && info.tags.length > 0) {
    tagsWrap.classList.remove("is-empty");
    info.tags.forEach(t => {
      const span = document.createElement("span");
      span.className = "tag-chip";
      span.textContent = t;   // textContent — nunca innerHTML con datos externos
      tagsWrap.appendChild(span);
    });
    // Auto-select first tag as pattern if nothing chosen
    if (!existing && info.tags.length > 0) {
      const patternSel = document.getElementById("pattern");
      for (const tag of info.tags) {
        const opt = [...patternSel.options].find(
          o => o.value.toLowerCase() === tag.toLowerCase()
        );
        if (opt) { patternSel.value = opt.value; break; }
      }
    }
  } else {
    tagsWrap.classList.add("is-empty");
  }

  // Fecha
  document.getElementById("date-solved").value = todayISO();

  // If already saved, prefill with saved data
  if (existing) {
    document.getElementById("already-saved").classList.add("visible");
    document.getElementById("status").value  = existing.status  || "Solved";
    document.getElementById("pattern").value = existing.pattern || document.getElementById("pattern").value;
    document.getElementById("notes").value   = existing.notes   || "";
    // Prefer live editor code if available
    document.getElementById("solution").value = info.solution || existing.solution || "";
    document.getElementById("date-solved").value = existing.date_solved || todayISO();
    if (existing.title && !info.title) titleInput.value = existing.title;
  } else {
    document.getElementById("solution").value = info.solution || "";
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isLeetCode = tab?.url?.match(/leetcode\.com\/problems\//);

  if (!isLeetCode) {
    await checkServer(); // still show dot status
    show("panel-nopage");
    return;
  }

  const ok = await checkServer();
  if (!ok) {
    show("panel-noserver");
    return;
  }

  // Extract from content script
  try {
    problemInfo = await chrome.tabs.sendMessage(tab.id, { action: "getProblemInfo" });
  } catch {
    problemInfo = {};
  }

  // Ensure object
  if (!problemInfo) problemInfo = {};

  // Fallback: parse title from tab title
  if (!problemInfo.number || !problemInfo.title) {
    const m = (tab.title || "").match(/^(\d+)\.\s+(.+?)\s*[-|–]/);
    if (m) {
      problemInfo.number = problemInfo.number || parseInt(m[1]);
      problemInfo.title  = problemInfo.title  || m[2].trim();
    }
  }

  // Check if already saved
  let existing = null;
  if (problemInfo.number) {
    existing = await checkExisting(problemInfo.number);
  }

  fillForm(problemInfo, existing);
  show("panel-form");

  // Wire buttons
  document.getElementById("btn-save").addEventListener("click", () => {
    saveProblem(document.getElementById("status").value);
  });
  document.getElementById("btn-hint").addEventListener("click", getHint);
}

document.addEventListener("DOMContentLoaded", init);
