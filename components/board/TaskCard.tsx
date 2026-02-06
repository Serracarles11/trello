"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Play, Trash2 } from "lucide-react";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityLabel: Record<Task["prioridad"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta"
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStart,
  dragging = false,
  godMode = false
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStart: (task: Task) => void;
  dragging?: boolean;
  godMode?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id
  });

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!task.fechaInicio || task.estado === "done") return;
    const interval = setInterval(() => setTick((value) => value + 1), 15000);
    return () => clearInterval(interval);
  }, [task.fechaInicio, task.estado]);

  const style = {
    transform: CSS.Translate.toString(transform)
  };

  const now = Date.now();
  const isDone = task.estado === "done";
  const isRunning = !!task.fechaInicio && !isDone;
  const estimateMs = Math.max(0, task.estimacionMin) * 60 * 1000;
  const elapsedMs = task.fechaInicio ? Math.max(0, now - new Date(task.fechaInicio).getTime()) : 0;
  const progress = estimateMs > 0 ? Math.min(100, Math.round((elapsedMs / estimateMs) * 100)) : 0;
  const showProgress = !!task.fechaInicio && estimateMs > 0 && !isDone;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "kb-card space-y-3 p-4",
        (isDragging || dragging) && "opacity-70",
        dragging && "shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{task.titulo}</h4>
          {task.descripcion && (
            <p className="mt-1 text-xs text-slate-500">{task.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.estado !== "done" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onStart(task);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDownCapture={(event) => event.stopPropagation()}
              aria-label={isRunning ? "Pausar tarea" : "Empezar tarea"}
            >
              <Play className="h-3 w-3" />
              {isRunning ? "Pausar" : "Empezar"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(task);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDownCapture={(event) => event.stopPropagation()}
            aria-label="Editar tarea"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDownCapture={(event) => event.stopPropagation()}
            aria-label="Eliminar tarea"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={task.prioridad}>{priorityLabel[task.prioridad]}</Badge>
        <span className="text-xs text-slate-500">{task.estimacionMin} min</span>
        {task.fechaLimite && (
          <span className="text-xs text-slate-500">Vence: {new Date(task.fechaLimite).toLocaleDateString()}</span>
        )}
      </div>
      {showProgress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Progreso estimado</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                progress >= 100 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span key={tag} className="kb-tag">
            {tag}
          </span>
        ))}
      </div>
      {godMode && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Observaciones de Javi</p>
          <p className="mt-1">{task.observacionesJavi || "Sin observaciones"}</p>
          <div className="mt-2 flex items-center justify-between">
            <span>Rúbrica: {task.rubricaScore ?? "Sin evaluar"}</span>
            {task.rubricaComentario && (
              <span className="text-slate-500">{task.rubricaComentario}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

