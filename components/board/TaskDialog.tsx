"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Task, TaskInput } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  prioridad: z.enum(["low", "medium", "high"]),
  tags: z.string().optional(),
  estimacionMin: z.coerce.number().min(0),
  fechaLimite: z.string().optional(),
  estado: z.enum(["todo", "doing", "done"]),
  observacionesJavi: z.string().optional(),
  rubricaScore: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).max(10).optional()
  ),
  rubricaComentario: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

function toLocalInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return date.toISOString();
}

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (values: TaskInput) => void;
  godMode: boolean;
};

export function TaskDialog({ open, onOpenChange, task, onSubmit, godMode }: TaskDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "medium",
      tags: "",
      estimacionMin: 60,
      fechaLimite: "",
      estado: "todo",
      observacionesJavi: "",
      rubricaComentario: ""
    }
  });

  React.useEffect(() => {
    if (task) {
      form.reset({
        titulo: task.titulo,
        descripcion: task.descripcion ?? "",
        prioridad: task.prioridad,
        tags: task.tags.join(", "),
        estimacionMin: task.estimacionMin,
        fechaLimite: toLocalInput(task.fechaLimite),
        estado: task.estado,
        observacionesJavi: task.observacionesJavi ?? "",
        rubricaScore: task.rubricaScore,
        rubricaComentario: task.rubricaComentario ?? ""
      });
    } else {
      form.reset({
        titulo: "",
        descripcion: "",
        prioridad: "medium",
        tags: "",
        estimacionMin: 60,
        fechaLimite: "",
        estado: "todo",
        observacionesJavi: "",
        rubricaComentario: ""
      });
    }
  }, [task, form]);

  function handleSubmit(values: FormValues) {
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    onSubmit({
      titulo: values.titulo,
      descripcion: values.descripcion?.trim() || "",
      prioridad: values.prioridad,
      tags,
      estimacionMin: values.estimacionMin,
      fechaLimite: fromLocalInput(values.fechaLimite),
      estado: values.estado,
      observacionesJavi: godMode ? values.observacionesJavi?.trim() : task?.observacionesJavi,
      rubricaScore: godMode ? values.rubricaScore : task?.rubricaScore,
      rubricaComentario: godMode ? values.rubricaComentario?.trim() : task?.rubricaComentario
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Revisar límites de margen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles relevantes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prioridad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="doing">Doing</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="fx, riesgo, ops" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimacionMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimación (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaLimite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha límite</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {godMode && (
              <>
                <FormField
                  control={form.control}
                  name="observacionesJavi"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observaciones de Javi</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas internas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rubricaScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rúbrica (0-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={10} step={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rubricaComentario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentario de rúbrica</FormLabel>
                      <FormControl>
                        <Input placeholder="Feedback rápido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

