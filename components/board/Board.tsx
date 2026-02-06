"use client";

import React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Task } from "@/types";
import { Column } from "@/components/board/Column";
import { TaskCard } from "@/components/board/TaskCard";

const STATUSES: Task["estado"][] = ["todo", "doing", "done"];

const STATUS_LABELS: Record<Task["estado"], string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done"
};

type BoardProps = {
  tasks: Task[];
  allTasks: Task[];
  onMove: (id: string, to: Task["estado"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStart: (task: Task) => void;
  godMode: boolean;
};

export function Board({ tasks, allTasks, onMove, onEdit, onDelete, onStart, godMode }: BoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const activeTask = activeId ? allTasks.find((task) => task.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const overId = String(over.id);
    if (!STATUSES.includes(overId as Task["estado"])) return;
    onMove(String(active.id), overId as Task["estado"]);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-6">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.estado === status);
          const totalCount = allTasks.filter((task) => task.estado === status).length;
          return (
            <Column
              key={status}
              id={status}
              title={STATUS_LABELS[status]}
              count={columnTasks.length}
              totalCount={totalCount}
            >
              {columnTasks.length === 0 ? (
                <div className="kb-empty">Sin tareas visibles en esta columna.</div>
              ) : (
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStart={onStart}
                      godMode={godMode}
                    />
                  ))}
                </div>
              )}
            </Column>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={(_task) => undefined}
            onDelete={(_task) => undefined}
            onStart={(_task) => undefined}
            dragging
            godMode={godMode}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

