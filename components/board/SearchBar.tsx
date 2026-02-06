"use client";

import React from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex w-full max-w-xl items-center gap-3">
      <div className="w-full">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar por texto, tag:fx, p:high, due:week, est:<60"
          aria-label="Buscar tareas"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Ayuda de búsqueda">
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Sintaxis rápida</p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>`tag:react` filtra por tag exacto</li>
              <li>`p:high` prioridad alta</li>
              <li>`due:overdue` vencidas</li>
              <li>`due:week` vencen en 7 días</li>
              <li>`est:&lt;60` menos de 60 minutos</li>
              <li>`est:&gt;=120` 120 o más minutos</li>
            </ul>
            <p className="text-xs text-slate-500">Puedes combinar texto libre + operadores.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

