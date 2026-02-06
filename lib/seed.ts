import type { AppState, Task } from "@/types";
import { createId } from "@/lib/ids";

const now = new Date();
const iso = (d: Date) => d.toISOString();

const seedTasks: Task[] = [
  {
    id: createId(),
    titulo: "Rebalancear cartera FX",
    descripcion: "Alinear exposición USD/EUR después del cierre de Londres.",
    prioridad: "high",
    tags: ["fx", "rebalance", "riesgo"],
    estimacionMin: 90,
    fechaCreacion: iso(now),
    fechaLimite: iso(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
    estado: "todo"
  },
  {
    id: createId(),
    titulo: "Validar límites de crédito",
    descripcion: "Verificar cambios de rating para 3 contrapartes.",
    prioridad: "medium",
    tags: ["risk", "compliance"],
    estimacionMin: 60,
    fechaCreacion: iso(now),
    fechaLimite: iso(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
    estado: "doing"
  },
  {
    id: createId(),
    titulo: "Ejecutar orden ETF Energía",
    descripcion: "Ticket #E-2231, ventana de liquidez 14:00-15:00.",
    prioridad: "high",
    tags: ["trading", "ejecucion"],
    estimacionMin: 30,
    fechaCreacion: iso(now),
    fechaLimite: iso(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)),
    estado: "doing"
  },
  {
    id: createId(),
    titulo: "Revisar confirmaciones OTC",
    descripcion: "Cruzar 5 confirmaciones con back office.",
    prioridad: "low",
    tags: ["ops", "otc"],
    estimacionMin: 45,
    fechaCreacion: iso(now),
    estado: "done"
  }
];

export const seedState: AppState = {
  version: 1,
  tasks: seedTasks,
  audit: [],
  godMode: false
};

