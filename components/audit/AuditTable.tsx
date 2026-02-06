"use client";

import React from "react";
import type { AuditEvent } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const actionLabels: Record<AuditEvent["action"], string> = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  MOVE: "MOVE"
};

export function AuditTable({ events }: { events: AuditEvent[] }) {
  const [actionFilter, setActionFilter] = React.useState<string>("all");
  const [taskFilter, setTaskFilter] = React.useState("");

  const filtered = events.filter((event) => {
    const actionMatch = actionFilter === "all" ? true : event.action === actionFilter;
    const taskMatch = taskFilter
      ? event.taskId.toLowerCase().includes(taskFilter.toLowerCase())
      : true;
    return actionMatch && taskMatch;
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.keys(actionLabels).map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-72">
          <Input
            value={taskFilter}
            onChange={(event) => setTaskFilter(event.target.value)}
            placeholder="Filtrar por taskId"
            aria-label="Filtrar por taskId"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="kb-empty">Sin eventos que coincidan con los filtros.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Task ID</TableHead>
              <TableHead>Diff</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((event) => (
              <TableRow key={`${event.timestamp}-${event.taskId}-${event.action}`}>
                <TableCell className="text-xs text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs font-semibold">{event.action}</TableCell>
                <TableCell className="text-xs text-slate-600">{event.taskId}</TableCell>
                <TableCell className="text-xs text-slate-600">
                  <pre className="max-w-[240px] overflow-x-auto text-xs">
                    {JSON.stringify(event.diff, null, 2)}
                  </pre>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{event.userLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

