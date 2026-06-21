# ⚡ LeetCode Tracker — Extensión de Chrome

Extensión que detecta automáticamente el problema de LeetCode que estás viendo
y te permite guardarlo en tu app de escritorio local con un clic.

## Instalación

### 1. Cargar la extensión en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el **Modo desarrollador** (esquina superior derecha)
3. Haz clic en **"Cargar descomprimida"**
4. Selecciona la carpeta `leetcode_extension/`

La extensión aparecerá en tu barra de herramientas (puede que tengas que fijarla
haciendo clic en el icono de puzzle 🧩).

### 2. Asegúrate de que la app de escritorio esté corriendo

```bash
cd leetcode_tracker/
python main.py
```

Verás en la consola: `[LC Tracker] Servidor local activo en http://localhost:7842`

## Uso

1. Navega a cualquier problema en `leetcode.com/problems/...`
2. Haz clic en el icono ⚡ de la extensión
3. El popup detecta automáticamente:
   - Número y título del problema
   - Dificultad (Easy / Medium / Hard)
   - Tu código del editor (si ya has escrito algo)
4. Rellena el patrón, notas, y ajusta el estado
5. Pulsa **💾 Guardar** (Solved) o **🔄 En progreso**

## Indicador de conexión

El punto de color en la cabecera indica el estado:
- 🟢 Verde — App de escritorio conectada
- 🔴 Rojo — App no está corriendo

## Flujo recomendado

| Momento | Acción |
|---------|--------|
| Empiezas un problema | Clic en extensión → **🔄 En progreso** |
| Lo resuelves | Clic en extensión → añade notas → **💾 Guardar** |
| Quieres revisarlo después | Desde la app cambia estado a **⭐ To Review** |

## Notas técnicas

- La extensión se comunica con `http://localhost:7842`
- Solo tiene permisos para `leetcode.com` y `localhost:7842`
- No envía datos a ningún servidor externo — todo es local
