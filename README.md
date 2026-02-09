# Mesa de Trading / Broker Ops Kanban

## Objetivo
Mini gestor Kanban (Todo / Doing / Done) para operaciones de mesa de trading y back office, con auditor?a completa, b?squeda avanzada, modo nocturno y Modo Dios.

## Funcionalidades
- Crear, editar y borrar tareas.
- Drag & Drop entre columnas (rat?n) y movimiento por teclado.
- B?squeda avanzada con operadores (`tag:`, `p:`, `due:`, `est:`).
- Auditor?a con diff de cambios y log hist?rico.
- Exportaci?n/Importaci?n JSON con validaci?n.
- Modo Dios con observaciones y r?brica.
- Modo noche persistente.

## Instalaci?n
1. `npm install`
2. `npm run dev`
3. Abrir `http://localhost:3000`

## Uso r?pido
- **Nueva tarea**: bot?n principal en el header.
- **Mover tarea**: arrastra o usa flechas (`?` / `?`) con la tarjeta enfocada.
- **Importar/Exportar**: botones de JSON en el header.
- **Modo Dios**: activa observaciones internas y r?brica.
- **Modo noche**: alterna la interfaz oscura.

## Export/Import
- Exporta un `.json` versionado con todo el estado.
- Importa JSON con validaci?n estricta (Zod). Si hay IDs duplicadas se regeneran y se audita.

## Checklist de requisitos
- [x] Next.js App Router + React + TypeScript
- [x] UI con Radix/Shadcn
- [x] Drag & Drop con @dnd-kit
- [x] Movimiento por teclado
- [x] Validaci?n con Zod + react-hook-form
- [x] Persistencia en localStorage
- [x] Export/Import JSON con validaci?n
- [x] Auditor?a con diff before/after
- [x] B?squeda avanzada con operadores
- [x] Modo Dios con r?brica
- [x] Modo noche

## Decisiones t?cnicas
- Estructura por dominio (`components/board`, `components/audit`) para aislar UI y l?gica del tablero.
- Estado central con `useReducer` para aplicar acciones y generar auditor?a consistente.
- Parsing de queries en `lib/query.ts` con operadores simples combinables para filtros r?pidos.
- Diff calculado en `lib/diff.ts` y guardado en `audit` para trazabilidad legible.
- Persistencia con `localStorage` y `AppStateSchema` para validar datos cargados.
- Importaci?n con regeneraci?n de IDs duplicadas y evento de auditor?a expl?cito.
- DnD con `@dnd-kit` y sensores configurados para evitar arrastres accidentales.

## Capturas

```md
imagen/portada.png
imagen/auditoria.png
imagen/motivacion.png
imagen/tablero.png

```

## Despliegue
- Vercel: configura el proyecto y publica.
