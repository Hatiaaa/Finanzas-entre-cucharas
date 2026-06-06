# CLAUDE.md

Guía para agentes de Claude Code trabajando en este proyecto.

## Memoria (Engram)

Tienes acceso a memoria persistente vía Engram (MCP): `mem_save`, `mem_search`,
`mem_context`, `mem_session_summary`, entre otras.

- **Guarda proactivamente** con `mem_save` tras cualquier decisión, fix de bug,
  descubrimiento, cambio de configuración o convención nueva — no esperes a que
  te lo pidan.
- **Busca antes de empezar**: si la tarea se parece a algo ya hecho, usa
  `mem_search` para recuperar el contexto previo.
- **Tras cualquier compactación o reset de contexto**, llama a `mem_context`
  para recuperar el estado de la sesión antes de continuar.
- **Antes de decir "listo"**, guarda un resumen con `mem_session_summary`.

El proyecto se detecta automáticamente como `finanzas-entre-cucharas`
(vía git remote).
