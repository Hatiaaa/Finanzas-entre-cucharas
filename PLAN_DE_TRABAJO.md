# PLAN DE TRABAJO — Finanzas Entre Cucharas v2
> Reconstrucción completa con arquitectura limpia · Mayo 2026

---

## 1. RESUMEN EJECUTIVO

### Qué se construye y para quién
App de finanzas para el restaurante "Entre Cucharas". Permite registrar transacciones diarias, hacer el cuadre de caja con IA, gestionar créditos de clientes, inventario, recetas y reportes de volumen de ventas.

Esta es la **v2**: reconstrucción desde cero del frontend manteniendo la base de datos existente en Supabase y el módulo de cuadre de caja que ya funciona bien.

### Resultado esperado por fase
| Fase | Entregable | Estado |
|------|-----------|--------|
| 0 | Plan aprobado + rama v2 | ✅ |
| 1 | Setup + capa de datos + autenticación | ⬜ |
| 2 | Dashboard + Cuentas + Historial | ⬜ |
| 3 | Cuadre de Caja (migración del módulo existente) | ⬜ |
| 4 | Créditos + Transacciones manuales | ⬜ |
| 5 | Proveedores + Inventario + Recetas | ⬜ |
| 6 | Reportes + Volumen de ventas | ⬜ |
| 7 | QA final + deploy a producción | ⬜ |

### Restricciones importantes
- La base de datos Supabase **no se modifica** — el schema existente se conserva íntegro
- El módulo `api/parsear.ts` y `useCuadreCaja.ts` se migran sin cambios funcionales
- La v1 sigue en `main` (Vercel producción) hasta que la v2 esté completa y aprobada
- Zona horaria: Ecuador (UTC-5), sin horario de verano — toda lógica de fechas debe usar hora local del browser

---

## 2. PRINCIPIOS RECTORES

### Reglas que NO se rompen
- **NUNCA npm** — siempre `pnpm` para todo
- **Siempre versiones estables más recientes** — verificar antes de instalar
- **Sin prop drilling profundo** — si un dato pasa por más de 2 niveles, va al store
- **Sin `refreshData()` manual** — TanStack Query maneja la invalidación automáticamente
- **Sin lógica de negocio en componentes** — los componentes solo renderizan, los hooks hacen el trabajo
- **Sin `any` en TypeScript** — tipado estricto siempre
- **Sin `window.confirm()`** — usar el modal de confirmación propio de la app
- **Cada operación de escritura invalida exactamente las queries que necesita** — no refetch global

### Decisiones arquitectónicas fijas
- **Server state**: TanStack Query v5 — cacheo, loading states, refetch automático
- **Client/UI state**: Zustand v5 — modales, formularios abiertos, selecciones
- **Estructura**: Feature-based (no layer-based)
- **Estilos**: Tailwind CSS v4 instalado localmente (no CDN)
- **Formularios**: React Hook Form + Zod para validación

### Lo que NO se debe hacer
- No poner llamadas a Supabase directamente en componentes
- No duplicar lógica de cálculo de balances — un único lugar
- No usar `useEffect` para fetch de datos (usar TanStack Query)
- No crear componentes de más de 150 líneas sin buena justificación
- No hardcodear IDs de cuentas — siempre resolverlos por `type`

---

## 3. STACK Y DECISIONES TÉCNICAS

### Stack completo
| Pieza | Versión | Justificación |
|-------|---------|---------------|
| React | 19.x | Framework UI, ya en uso |
| TypeScript | 5.8.x | Tipado estricto, reduce bugs |
| Vite | 6.x | Build tool rápido, ya en uso |
| TanStack Query | 5.x | Elimina `refreshData()` manual, manejo automático de cache y stale state |
| Zustand | 5.x | Estado global sin boilerplate (modales, UI state) |
| React Hook Form | 7.x | Formularios con validación sin re-renders excesivos |
| Zod | 3.x | Validación de schemas tipada |
| Tailwind CSS | 4.x | Estilos utilitarios, instalado localmente |
| Supabase JS | 2.x | Cliente de base de datos/auth |
| Lucide React | latest | Iconos consistentes, ya en uso |
| @anthropic-ai/sdk | latest | API de Claude para cuadre de caja |
| Recharts | 2.x | Gráficos, ya en uso |
| Vercel | — | Deploy automático desde GitHub |

### Variables de entorno requeridas
```env
# .env.local (nunca commitear)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=        # solo backend (api/parsear.ts)
```

### Comandos pnpm de referencia
```bash
pnpm dev                  # servidor de desarrollo
pnpm build                # build de producción
pnpm preview              # preview del build
pnpm type-check           # verificar TypeScript sin build
node dev-api.mjs          # servidor local de IA (port 3001)
```

### Instalación inicial
```bash
pnpm install
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add -D tailwindcss@next @tailwindcss/vite
```

---

## 4. ESTRUCTURA DEL REPOSITORIO

```
src/
├── api/                          # Serverless functions (Vercel)
│   └── parsear.ts                # ← MIGRAR sin cambios
│
├── components/
│   ├── ui/                       # Componentes genéricos reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx             # Reemplaza window.confirm()
│   │   ├── Table.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   │
│   └── features/                 # Módulos por funcionalidad
│       ├── layout/
│       │   ├── Layout.tsx
│       │   └── Sidebar.tsx
│       ├── dashboard/
│       │   ├── Dashboard.tsx
│       │   ├── BalanceCard.tsx
│       │   ├── RecentTransactions.tsx
│       │   └── MonthlyChart.tsx
│       ├── transactions/
│       │   ├── TransactionForm.tsx
│       │   └── TransactionRow.tsx
│       ├── history/
│       │   ├── HistoryView.tsx
│       │   └── HistoryFilters.tsx
│       ├── cuadre/               # ← MIGRAR componentes existentes
│       │   ├── DailyClosingView.tsx
│       │   ├── FormularioTexto.tsx
│       │   ├── TablaCuadre.tsx
│       │   ├── TablaGastos.tsx
│       │   ├── ResumenArqueo.tsx
│       │   ├── EstadoCierre.tsx
│       │   └── ModalDetalleCierre.tsx
│       ├── credits/
│       │   ├── CreditsView.tsx
│       │   └── CreditCard.tsx
│       ├── accounts/
│       │   └── AccountsSettings.tsx
│       ├── suppliers/
│       │   └── SuppliersView.tsx
│       ├── inventory/
│       │   └── InventoryView.tsx
│       └── recipes/
│           └── RecipesView.tsx
│
├── hooks/                        # Custom hooks (data + lógica)
│   ├── queries/                  # TanStack Query hooks
│   │   ├── useAccounts.ts        # useAccounts(), useCreateAccount(), etc.
│   │   ├── useTransactions.ts    # useTransactions(), useCreateTransaction(), etc.
│   │   ├── useClosings.ts        # useClosings(), useCreateClosing(), etc.
│   │   ├── useCategories.ts
│   │   ├── useSuppliers.ts
│   │   ├── useIngredients.ts
│   │   └── useRecipes.ts
│   ├── useCuadreCaja.ts          # ← MIGRAR sin cambios funcionales
│   └── useBalances.ts            # Cálculo de saldos (derived de useTransactions + useAccounts)
│
├── lib/
│   ├── supabase.ts               # Cliente Supabase (igual)
│   ├── calculos.ts               # ← MIGRAR sin cambios
│   └── queryClient.ts            # Configuración de TanStack Query
│
├── store/                        # Zustand — solo estado de UI
│   ├── useModalStore.ts          # Modales abiertos, contenido
│   └── useUIStore.ts             # Vista activa, filtros, etc.
│
├── types/
│   ├── index.ts                  # Tipos del dominio (Account, Transaction, etc.)
│   └── cuadre.ts                 # ← MIGRAR sin cambios
│
├── utils/
│   ├── formatters.ts             # formatearMoneda, formatearFecha
│   └── dates.ts                  # Helpers de fechas con timezone Ecuador
│
├── main.tsx
└── App.tsx                       # Solo routing/layout, sin handlers de negocio
```

---

## 5. CONVENCIONES DE CÓDIGO

### Nombres de archivos
- Componentes: `PascalCase.tsx` (ej. `TransactionForm.tsx`)
- Hooks: `camelCase.ts` con prefijo `use` (ej. `useTransactions.ts`)
- Stores: `camelCase.ts` con prefijo `use` (ej. `useModalStore.ts`)
- Utilidades: `camelCase.ts` (ej. `formatters.ts`)
- Tipos: `camelCase.ts` o `index.ts`

### Patrones obligatorios

**Queries (TanStack Query):**
```typescript
// hooks/queries/useTransactions.ts
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => supabase.from('transactions').select('*')...
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => supabase.from('transactions').insert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] })
  })
}
```

**Stores (Zustand):**
```typescript
// store/useModalStore.ts
interface ModalStore {
  confirmModal: { open: boolean; message: string; onConfirm: () => void } | null
  openConfirm: (message: string, onConfirm: () => void) => void
  closeConfirm: () => void
}
```

**Componentes:**
```typescript
// Solo reciben props tipadas, sin lógica de negocio inline
interface Props { transactionId: string }
export function TransactionRow({ transactionId }: Props) { ... }
```

### Imports
- Imports absolutos desde `src/` (configurar en `tsconfig.json`)
- Orden: React → librerías → features → ui → hooks → types → utils

---

## 6. MODELO DE DATOS

Schema existente en Supabase — **no modificar**.

### Tablas

```sql
accounts
  id            uuid PK
  name          text
  type          text  -- 'CASH' | 'BANK' | 'CREDIT'
  initial_balance numeric

transactions
  id            uuid PK
  date          timestamptz
  type          text  -- 'Ingreso' | 'Egreso' | 'Transferencia'
  category      text
  subcategory   text
  amount        numeric
  account_id    uuid FK → accounts
  to_account_id uuid FK → accounts (nullable, solo Transferencia)
  quantity      integer (nullable)
  description   text
  has_attachment boolean
  client        text (nullable)

daily_closings
  id             uuid PK
  date           timestamptz
  account_id     uuid FK → accounts
  system_balance numeric
  physical_amount numeric
  difference     numeric
  notes          text

categories
  id            uuid PK
  name          text
  type          text
  subcategories text[]

suppliers
  id    uuid PK
  name  text
  ...

ingredients
  id            uuid PK
  name          text
  unit          text
  cost          numeric
  supplier_id   uuid FK → suppliers
  min_stock     numeric
  current_stock numeric

recipes
  id            uuid PK
  name          text
  category      text
  selling_price numeric

recipe_ingredients
  recipe_id     uuid FK → recipes
  ingredient_id uuid FK → ingredients
  amount        numeric
```

### Query Keys (TanStack Query)
```typescript
export const queryKeys = {
  transactions: ['transactions'] as const,
  accounts:     ['accounts']     as const,
  closings:     ['closings']     as const,
  categories:   ['categories']  as const,
  suppliers:    ['suppliers']   as const,
  ingredients:  ['ingredients'] as const,
  recipes:      ['recipes']     as const,
}
```

---

## 7. SISTEMA DE DISEÑO

### Paleta de colores (igual que v1)
```css
/* Fondos */
--bg-base:    #0B131F   /* fondo principal */
--bg-card:    #151E2B   /* tarjetas */
--bg-border:  #1E293B   /* bordes */

/* Colores de acento */
--cyan:       #19A8C7   /* primario, banco/transferencias */
--orange:     #FF8A00   /* secundario, créditos */
--green:      #10b981   /* positivo, efectivo */
--red:        #ef4444   /* negativo, errores */
--yellow:     #FFC72C   /* amarillo cuchara */

/* Texto */
--text-white: #ffffff
--text-gray:  #9ca3af
--text-muted: #4b5563
```

### Tipografía
- Font: sistema (Inter si está disponible, fallback sans-serif)
- Tamaños: `text-xs`(12) `text-sm`(14) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-3xl`(30)

### Breakpoints (Tailwind)
- `sm`: 640px | `md`: 768px | `lg`: 1024px | `xl`: 1280px

### Componentes base obligatorios
| Componente | Props clave |
|-----------|-------------|
| `Button` | `variant: primary\|secondary\|danger\|ghost`, `loading`, `size` |
| `Card` | `className` |
| `Modal` | `open`, `onClose`, `title`, `children` |
| `ConfirmModal` | Conectado a `useModalStore` — reemplaza `window.confirm()` |
| `Input` | `label`, `error`, React Hook Form compatible |
| `Select` | `label`, `options`, `error` |
| `Spinner` | `size` |
| `Badge` | `variant: success\|warning\|danger\|info` |

---

## 8. FASES DE DESARROLLO

### Fase 1 — Setup + Capa de datos
**Objetivo:** Proyecto configurado, TanStack Query funcionando, todos los hooks de datos listos.

- [ ] Instalar dependencias nuevas (TanStack Query, Zustand, React Hook Form, Zod, Tailwind v4)
- [ ] Configurar `queryClient.ts` con defaults (staleTime, retry)
- [ ] Configurar imports absolutos en `tsconfig.json`
- [ ] Crear `types/index.ts` con todos los tipos del dominio
- [ ] Crear todos los hooks en `hooks/queries/` (useAccounts, useTransactions, useClosings, useCategories, useSuppliers, useIngredients, useRecipes)
- [ ] Crear `useBalances.ts` con `calculateBalances` (extraído de FinanceService)
- [ ] Crear `store/useModalStore.ts` con `ConfirmModal`
- [ ] Migrar `lib/calculos.ts`, `lib/supabase.ts`, `types/cuadre.ts` sin cambios
- [ ] Migrar `hooks/useCuadreCaja.ts` sin cambios funcionales

**Done cuando:** `pnpm type-check` pasa sin errores y los hooks retornan datos reales de Supabase.

---

### Fase 2 — Layout + Dashboard + Cuentas + Historial
**Objetivo:** Navegación funcionando, dashboard mostrando datos reales, historial con filtros.

- [ ] Crear `Layout.tsx` + `Sidebar.tsx`
- [ ] Crear componentes `ui/` (Button, Card, Modal, Input, Select, Spinner, Badge)
- [ ] Construir `Dashboard.tsx` usando hooks de TanStack Query
  - [ ] BalanceCard por cuenta
  - [ ] KPIs del mes (ingresos, gastos)
  - [ ] Gráfico Análisis Mensual (últimos 6 meses)
  - [ ] Movimientos recientes
- [ ] Construir `HistoryView.tsx`
  - [ ] Tabla con filtros por cuenta, tipo, categoría, fecha
  - [ ] Editar transacción inline
  - [ ] Eliminar con ConfirmModal (sin `window.confirm()`)
- [ ] Construir `AccountsSettings.tsx` (CRUD de cuentas)

**Done cuando:** Dashboard muestra saldos reales, historial filtra correctamente, no hay `window.confirm()` en ningún lado.

---

### Fase 3 — Cuadre de Caja
**Objetivo:** Módulo de cuadre migrado y funcionando igual que en v1.

- [ ] Migrar todos los componentes de `components/cuadre/` sin cambios visuales
- [ ] Conectar `useCuadreCaja` con los hooks de TanStack Query (invalidar `transactions` y `closings` al guardar)
- [ ] Migrar `api/parsear.ts` sin cambios
- [ ] Verificar `dev-api.mjs` actualizado
- [ ] Probar flujo completo: escribir cuadre → procesar IA → editar → guardar → ver en historial

**Done cuando:** El cuadre funciona idéntico a v1, el historial se actualiza automáticamente tras guardar, y reemplazar un cierre borra las transacciones anteriores correctamente.

---

### Fase 4 — Créditos + Transacciones manuales
**Objetivo:** Cobro de créditos sin duplicados, formulario de transacciones limpio.

- [ ] Construir `TransactionForm.tsx` con React Hook Form + Zod
  - [ ] Validación de campos
  - [ ] Selector de cuenta, categoría, subcategoría
  - [ ] Soporte transferencias entre cuentas
- [ ] Construir `CreditsView.tsx`
  - [ ] Lista de clientes con saldo pendiente
  - [ ] Cobrar individual (parcial o total)
  - [ ] Cobrar todo de un cliente
  - [ ] **Verificar que no crea duplicados** (bug conocido de v1)

**Done cuando:** Un crédito cobrado genera exactamente 1 transacción en banco, no 2. Tests manuales con Jaslene/Consuelo verificados.

---

### Fase 5 — Proveedores + Inventario + Recetas
**Objetivo:** Módulos secundarios funcionando.

- [ ] `SuppliersView.tsx` — CRUD de proveedores
- [ ] `InventoryView.tsx` — listado de ingredientes con stock, alertas de mínimo
- [ ] `RecipesView.tsx` — CRUD de recetas con ingredientes y costo calculado

**Done cuando:** CRUD completo en los 3 módulos sin errores de TypeScript.

---

### Fase 6 — Reportes + Volumen de ventas
**Objetivo:** Dashboard completo con reportes históricos.

- [ ] Sección "Volumen de ventas" en Dashboard (unidades por período)
- [ ] Comparativa de ingresos (mes vs mes anterior)
- [ ] Gráfico de flujo de caja (últimos 6 meses)
- [ ] Top 5 productos más vendidos
- [ ] Vista expandida de volumen (`SalesVolumeView.tsx`)

**Done cuando:** Todos los gráficos muestran datos reales, los filtros de período funcionan correctamente.

---

### Fase 7 — QA + Deploy
**Objetivo:** App en producción reemplazando v1.

- [ ] `pnpm build` sin warnings de TypeScript
- [ ] Probar flujo completo en preview de Vercel (rama v2)
- [ ] Verificar timezone Ecuador en todos los módulos
- [ ] Verificar que saldos coinciden con Supabase después de limpiar duplicados
- [ ] Merge de `v2` a `main`
- [ ] Deploy a producción
- [ ] Monitorear 24h en producción

**Done cuando:** App en producción sin errores en consola, saldos correctos, cuadre funciona.

---

## 9. INTEGRACIONES EXTERNAS

### Supabase
```
Cliente Browser → VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
Operaciones: SELECT, INSERT, UPDATE, DELETE
Auth: anon key con RLS (USING true — acceso libre por ahora)
```

### Anthropic Claude (Cuadre de Caja)
```
Browser → POST /api/parsear → Vercel Function → Claude API
                                                      ↓
                                              JSON estructurado
                                                      ↓
                              Browser ← respuesta parseada

Modelo: claude-sonnet-4-5
Max tokens: 2048
Timeout implícito: límite de Vercel (10s en free tier)
Error handling: mostrar detail del error en UI
```

### Vercel
```
Push a main → Deploy automático
Preview: cada rama genera preview URL
Variables de entorno: configuradas en Vercel Dashboard
```

---

## 10. SEGURIDAD

### Reglas absolutas
- `ANTHROPIC_API_KEY` nunca en el frontend — solo en funciones serverless
- `.env.local` en `.gitignore` siempre
- No hardcodear credenciales en ningún archivo

### Autenticación
- Actualmente: sin auth de usuario (app personal del restaurante)
- RLS en Supabase: políticas `USING (true)` — acceso libre (aceptado por el cliente)
- Si en el futuro se necesita auth: Supabase Auth con email/password

### Protección de datos
- No exponer `ANTHROPIC_API_KEY` al browser
- No loggear datos de transacciones en consola en producción

---

## 11. TESTING Y QA

### Niveles de testing
- **Manual por fase**: checklist al finalizar cada fase
- **Type-check**: `pnpm type-check` debe pasar antes de cada commit
- **Build check**: `pnpm build` sin errores antes de merge a main

### Checklist por feature antes de marcar done
- [ ] Sin errores de TypeScript (`any` explícito justificado)
- [ ] Sin `console.log` olvidados
- [ ] Loading state visible durante fetch
- [ ] Error state visible si falla la operación
- [ ] Datos se actualizan sin reload manual
- [ ] Funciona en mobile (320px mínimo)
- [ ] Números con formato correcto (`$999,59` con coma decimal en Ecuador)

### Bugs conocidos de v1 que deben NO existir en v2
- [ ] Duplicados al cobrar créditos con "Cobrar todo"
- [ ] `window.confirm()` — usar ConfirmModal propio
- [ ] Saldo desactualizado tras operaciones (TanStack Query lo resuelve)
- [ ] Timezone: fechas mostrando día incorrecto por UTC offset

---

## 12. DEPLOYMENT Y OPERACIÓN

### Estrategia de branches
```
main    → producción (v1 activa mientras v2 se desarrolla)
v2      → desarrollo de la reconstrucción
```

### Pipeline de deploy
```bash
# Desarrollo
pnpm dev                    # frontend en :5173
node dev-api.mjs            # backend IA en :3001

# Antes de cada commit
pnpm type-check

# Antes de merge a main
pnpm build                  # debe terminar sin errores

# Deploy
git push origin v2          # genera preview en Vercel automáticamente
# Cuando v2 está aprobada:
git checkout main
git merge v2
git push origin main        # deploy a producción
```

### Monitoreo
- Errores de Vercel Functions: Vercel Dashboard → Functions tab
- Errores de Supabase: Supabase Dashboard → Logs
- Errores de Claude API: logs en consola de Vercel Functions

---

## 13. CHECKLIST GLOBAL DE PROGRESO

### Fase 1 — Setup
- [ ] Dependencias instaladas con pnpm
- [ ] Tailwind v4 configurado localmente
- [ ] TanStack Query configurado
- [ ] Todos los hooks de queries creados
- [ ] Tipos del dominio definidos
- [ ] `pnpm type-check` pasa limpio

### Fase 2 — Dashboard + Historial
- [ ] Layout y navegación funcional
- [ ] Componentes UI base creados
- [ ] Dashboard con datos reales
- [ ] Historial con filtros
- [ ] CRUD de cuentas
- [ ] Cero `window.confirm()`

### Fase 3 — Cuadre de Caja
- [ ] Módulo migrado y funcionando
- [ ] Flujo completo probado
- [ ] Historial se actualiza automáticamente

### Fase 4 — Créditos + Transacciones
- [ ] Formulario de transacciones validado con Zod
- [ ] Cobro de créditos sin duplicados verificado

### Fase 5 — Módulos secundarios
- [ ] Proveedores CRUD
- [ ] Inventario CRUD
- [ ] Recetas CRUD

### Fase 6 — Reportes
- [ ] Volumen de ventas
- [ ] Comparativa de ingresos
- [ ] Gráficos funcionando

### Fase 7 — Deploy
- [ ] Build limpio
- [ ] QA en preview Vercel
- [ ] Merge a main
- [ ] Producción estable 24h

---

## 14. RIESGOS Y MITIGACIONES

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Schema de Supabase tiene inconsistencias no documentadas | Media | Alto | Auditar todas las tablas en Fase 1 antes de escribir hooks |
| Bug de duplicados al cobrar créditos difícil de reproducir | Alta | Alto | Escribir el test manual exacto (Jaslene/Consuelo) como checklist de Fase 4 |
| Tailwind v4 tiene breaking changes vs v1 | Media | Medio | Migrar clases de v3 a v4 con la guía oficial; empezar por componentes `ui/` |
| Claude API timeout en cuadres largos | Baja | Medio | Ya mitigado con `max_tokens: 2048`; si persiste subir a 4096 |
| v1 en producción se daña durante desarrollo | Baja | Alto | Trabajar solo en rama `v2`, nunca tocar `main` durante desarrollo |
| Pérdida de contexto entre sesiones de desarrollo | Alta | Medio | Este archivo es el contexto — actualizar checkboxes al terminar cada sesión |

---

## NOTAS DE MIGRACIÓN

### Archivos que se migran SIN cambios
```
api/parsear.ts
hooks/useCuadreCaja.ts
lib/calculos.ts
lib/supabase.ts
types/cuadre.ts
dev-api.mjs
```

### Archivos que se reescriben completamente
```
App.tsx                  → solo layout/routing
services/FinanceService.ts → reemplazado por hooks/queries/*
components/*             → todos reescritos con nueva arquitectura
```

### Configuración de Vite para proxy local (mantener)
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

---

*Finanzas Entre Cucharas v2 · Plan creado: 2026-05-30 · Branch: v2*
