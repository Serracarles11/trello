# Micro-Trello con auditoría y modo Dios

## Objetivo
Mini gestor Kanban (Todo / Doing / Done) para Micro-Trello con auditoría y modo Dios
.
## Funcionalidades
- Crear, editar y borrar tareas.
- Drag & Drop entre columnas (raton) y movimiento por teclado.
- Busqueda avanzada con operadores (`tag:`, `p:`, `due:`, `est:`).
- Auditoria con diff de cambios y log historico.
- Exportacion/Importacion JSON con validacion.
- Modo Dios con observaciones y rubrica.
- Modo noche persistente.

## Instalacion
1. `npm install`
2. `npm run dev`
3. Abrir `http://localhost:3000`

## Uso rapido
- **Nueva tarea**: boton principal en el header.
- **Mover tarea**: arrastra o usa flechas (`<-` / `->`) con la tarjeta enfocada.
- **Importar/Exportar**: botones de JSON en el header.
- **Modo Dios**: activa observaciones internas y rubrica.
- **Modo noche**: alterna la interfaz oscura.

## Export/Import
- Exporta un `.json` versionado con todo el estado.
- Importa JSON con validacion estricta (Zod). Si hay IDs duplicadas se regeneran y se audita.

## Checklist de requisitos
- [x] Next.js App Router + React + TypeScript
- [x] UI con Radix/Shadcn
- [x] Drag & Drop con @dnd-kit
- [x] Movimiento por teclado
- [x] Validacion con Zod + react-hook-form
- [x] Persistencia en localStorage
- [x] Export/Import JSON con validacion
- [x] Auditori con diff before/after
- [x] Busqueda avanzada con operadores
- [x] Modo Dios con rubrica
- [x] Modo noche

## Decisiones tecnicas
- Estructura por dominio (`components/board`, `components/audit`) para aislar UI y logica del tablero.
- Estado central con `useReducer` para aplicar acciones y generar auditoria consistente.
- Parsing de queries en `lib/query.ts` con operadores simples combinables para filtros rapidos.
- Diff calculado en `lib/diff.ts` y guardado en `audit` para trazabilidad legible.
- Persistencia con `localStorage` y `AppStateSchema` para validar datos cargados.
- Importacion con regeneracion de IDs duplicadas y evento de auditoria explicito.
- DnD con `@dnd-kit` y sensores configurados para evitar arrastres accidentales.

## Capturas

```md
imagen/portada.png
imagen/auditoria.png
imagen/motivacion.png
imagen/tablero.png

```

## Despliegue
- Vercel: https://trello-lake-eight.vercel.app/
