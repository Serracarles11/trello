"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type ColumnProps = {
  id: string;
  title: string;
  count: number;
  totalCount: number;
  children: React.ReactNode;
};

export function Column({ id, title, count, totalCount, children }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "kb-column min-h-[420px] space-y-4",
        isOver && "ring-2 ring-brand-400"
      )}
      aria-label={`Columna ${title}`}
    >
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">
            {count} visibles · {totalCount} total
          </p>
        </div>
      </header>
      {children}
    </section>
  );
}

