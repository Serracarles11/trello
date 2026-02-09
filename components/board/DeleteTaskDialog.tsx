"use client";

import React from "react";
import type { Task } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DeleteTaskDialog({
  task,
  onCancel,
  onConfirm
}: {
  task: Task | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!task} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. ¿Eliminar &quot;{task?.titulo}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
            </TooltipTrigger>
            <TooltipContent>Cierra sin eliminar la tarea.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
            </TooltipTrigger>
            <TooltipContent>Elimina la tarea de forma definitiva.</TooltipContent>
          </Tooltip>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

