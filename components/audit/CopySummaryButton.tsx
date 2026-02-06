"use client";

import React from "react";
import type { AuditEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopySummaryButton({ events }: { events: AuditEvent[] }) {
  function buildSummary() {
    const total = events.length;
    const byAction = events.reduce(
      (acc, event) => {
        acc[event.action] = (acc[event.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const lastFive = events.slice(0, 5);
    const idRegenerated = events.some((event) => event.meta?.idRegenerated);

    const lines = [
      "Resumen de auditoría",
      `Total eventos: ${total}`,
      `Por acción: ${Object.entries(byAction)
        .map(([action, count]) => `${action}:${count}`)
        .join(" | ") || "Sin eventos"}`,
      `Regeneración de IDs en import: ${idRegenerated ? "Sí" : "No"}`,
      "Últimos 5 eventos:"
    ];

    lastFive.forEach((event) => {
      lines.push(
        `- ${event.timestamp} | ${event.action} | ${event.taskId} | cambios: ${Object.keys(event.diff).join(", ") || "-"}`
      );
    });

    return lines.join("\n");
  }

  async function handleCopy() {
    const summary = buildSummary();
    await navigator.clipboard.writeText(summary);
    toast.success("Resumen copiado al portapapeles");
  }

  return (
    <Button variant="outline" onClick={handleCopy} aria-label="Copiar resumen de auditoría">
      Copiar resumen
    </Button>
  );
}

