"use client";

import React from "react";
import type { Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GodModePanel({ tasks }: { tasks: Task[] }) {
  const scored = tasks.filter((task) => typeof task.rubricaScore === "number");
  const average = scored.length
    ? Math.round((scored.reduce((sum, task) => sum + (task.rubricaScore ?? 0), 0) / scored.length) * 10) / 10
    : 0;
  const withoutScore = tasks.length - scored.length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Panel resumen · Modo Dios</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Media de rúbrica</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{average}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Tareas sin evaluar</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{withoutScore}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Tareas evaluadas</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{scored.length}</p>
        </div>
      </CardContent>
    </Card>
  );
}

