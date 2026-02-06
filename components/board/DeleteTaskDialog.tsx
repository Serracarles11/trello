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
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

