import { z } from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const StatusSchema = z.enum(["todo", "doing", "done"]);
export type Status = z.infer<typeof StatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().optional().default(""),
  prioridad: PrioritySchema,
  tags: z.array(z.string().min(1)).default([]),
  estimacionMin: z.number().min(0),
  fechaCreacion: z.string().datetime(),
  fechaInicio: z.string().datetime().optional(),
  fechaLimite: z.string().datetime().optional(),
  estado: StatusSchema,
  observacionesJavi: z.string().optional(),
  rubricaScore: z.number().min(0).max(10).optional(),
  rubricaComentario: z.string().optional()
});

export type Task = z.infer<typeof TaskSchema>;

export const AuditActionSchema = z.enum(["CREATE", "UPDATE", "DELETE", "MOVE"]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const DiffEntrySchema = z.object({
  before: z.unknown(),
  after: z.unknown()
});

export const DiffSchema = z.record(DiffEntrySchema);
export type Diff = z.infer<typeof DiffSchema>;

export const AuditEventSchema = z.object({
  timestamp: z.string().datetime(),
  action: AuditActionSchema,
  taskId: z.string(),
  userLabel: z.literal("Alumno/a"),
  diff: DiffSchema,
  meta: z.object({
    idRegenerated: z.boolean().optional()
  }).optional()
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AppStateSchema = z.object({
  version: z.number(),
  tasks: z.array(TaskSchema),
  audit: z.array(AuditEventSchema),
  godMode: z.boolean()
});

export type AppState = z.infer<typeof AppStateSchema>;

export const ExportSchema = z.object({
  version: z.number(),
  data: AppStateSchema
});

export type ExportPayload = z.infer<typeof ExportSchema>;

export type TaskInput = Omit<Task, "id" | "fechaCreacion">;

