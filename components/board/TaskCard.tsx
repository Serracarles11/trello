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
  onMove,
  dragging = false,
  godMode = false
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStart: (task: Task) => void;
  onMove: (id: string, to: Task["estado"]) => void;
  dragging?: boolean;
  godMode?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: dragging
  });

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!task.fechaInicio || task.estado === "done") return;
    const interval = setInterval(() => setTick((value) => value + 1), 15000);
    return () => clearInterval(interval);
  }, [task.fechaInicio, task.estado]);

  const style = dragging || isDragging ? undefined : { transform: CSS.Translate.toString(transform) };
  const dragAttributes = dragging ? {} : attributes;
  const dragListeners = dragging ? {} : listeners;
  const dragRef = dragging ? undefined : setNodeRef;

  const now = Date.now();
  const isDone = task.estado === "done";
  const isRunning = !!task.fechaInicio && !isDone;
  const estimateMs = Math.max(0, task.estimacionMin) * 60 * 1000;
  const elapsedMs = task.fechaInicio ? Math.max(0, now - new Date(task.fechaInicio).getTime()) : 0;
  const progress = estimateMs > 0 ? Math.min(100, Math.round((elapsedMs / estimateMs) * 100)) : 0;
  const showProgress = !!task.fechaInicio && estimateMs > 0 && !isDone;
  const statusOrder: Task["estado"][] = ["todo", "doing", "done"];

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const currentIndex = statusOrder.indexOf(task.estado);
    if (currentIndex < 0) return;

    if (event.key === "ArrowRight") {
      const next = statusOrder[Math.min(statusOrder.length - 1, currentIndex + 1)];
      if (next !== task.estado) {
        event.preventDefault();
        onMove(task.id, next);
      }
    }

    if (event.key === "ArrowLeft") {
      const prev = statusOrder[Math.max(0, currentIndex - 1)];
      if (prev !== task.estado) {
        event.preventDefault();
        onMove(task.id, prev);
      }
    }

    if (event.key === "Home") {
      event.preventDefault();
      onMove(task.id, "todo");
    }

    if (event.key === "End") {
      event.preventDefault();
      onMove(task.id, "done");
    }
  }

  return (
    <article
      ref={dragRef}
      style={style}
      tabIndex={dragging ? -1 : 0}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        if (dragging) return;
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.focus();
        }
      }}
      className={cn(
        "kb-card space-y-3 p-4",
        isRunning && "border-amber-500/70 bg-amber-50 shadow-[0_10px_30px_-18px_rgba(245,158,11,0.65)] dark:bg-amber-950/30 dark:border-amber-600/60",
        isDragging && !dragging && "opacity-0",
        dragging && "shadow-lg"
      )}
      aria-label={`Tarea ${task.titulo}`}
      {...dragAttributes}
      {...dragListeners}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className={cn("text-sm font-semibold text-slate-800 dark:text-slate-100", isRunning && "text-amber-900 dark:text-amber-200")}>
            {task.titulo}
          </h4>
          {task.descripcion && (
            <p className={cn("mt-1 text-xs text-slate-500 dark:text-slate-400", isRunning && "text-amber-700/80 dark:text-amber-200/80")}>
              {task.descripcion}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <span className={cn("text-xs text-slate-500 dark:text-slate-400", isRunning && "text-amber-700 dark:text-amber-200")}>
          {task.estimacionMin} min
        </span>
        {task.fechaLimite && (
          <span className={cn("text-xs text-slate-500 dark:text-slate-400", isRunning && "text-amber-700 dark:text-amber-200")}>
            Vence: {new Date(task.fechaLimite).toLocaleDateString()}
          </span>
        )}
      </div>
      {showProgress && (
        <div className="space-y-1">
          <div className={cn("flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400", isRunning && "text-amber-700 dark:text-amber-200")}>
            <span>Progreso estimado</span>
            <span>{progress}%</span>
          </div>
          <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", isRunning && "bg-amber-100 dark:bg-amber-900/40")}>
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                isRunning ? "bg-amber-500" : progress >= 100 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span key={tag} className={cn("kb-tag", isRunning && "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/60 dark:bg-amber-900/30 dark:text-amber-200")}>
            {tag}
          </span>
        ))}
      </div>
      {godMode && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Observaciones</p>
          <p className="mt-1">{task.observacionesJavi || "Sin observaciones"}</p>
          <div className="mt-2 flex items-center justify-between">
            <span>Rúbrica: {task.rubricaScore ?? "Sin evaluar"}</span>
            {task.rubricaComentario && (
              <span className="text-slate-500 dark:text-slate-400">{task.rubricaComentario}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

