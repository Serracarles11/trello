"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Board } from "@/components/board/Board";
import { TaskDialog } from "@/components/board/TaskDialog";
import { DeleteTaskDialog } from "@/components/board/DeleteTaskDialog";
import { GodModePanel } from "@/components/board/GodModePanel";
import { AuditTable } from "@/components/audit/AuditTable";
import { CopySummaryButton } from "@/components/audit/CopySummaryButton";
import { SearchBar } from "@/components/board/SearchBar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseQuery, filterTasks } from "@/lib/query";
import { loadState, saveState } from "@/lib/storage";
import { diffTask } from "@/lib/diff";
import { createId } from "@/lib/ids";
import { seedState } from "@/lib/seed";
import {
  AppState,
  AuditEvent,
  AppStateSchema,
  ExportSchema,
  Task,
  TaskInput
} from "@/types";
import { toast } from "sonner";
import { Info } from "lucide-react";

const ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  MOVE: "MOVE"
} as const;

type Action =
  | { type: "CREATE_TASK"; payload: TaskInput }
  | { type: "UPDATE_TASK"; payload: { id: string; updates: Partial<TaskInput> } }
  | { type: "DELETE_TASK"; payload: { id: string } }
  | { type: "MOVE_TASK"; payload: { id: string; to: Task["estado"] } }
  | { type: "IMPORT_STATE"; payload: { state: AppState; auditEvents: AuditEvent[] } }
  | { type: "TOGGLE_GODMODE"; payload: boolean };

function createAudit(action: AuditEvent["action"], taskId: string, diff: AuditEvent["diff"], meta?: AuditEvent["meta"]) {
  return {
    timestamp: new Date().toISOString(),
    action,
    taskId,
    userLabel: "Alumno/a",
    diff,
    meta
  } satisfies AuditEvent;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "CREATE_TASK": {
      const task: Task = {
        ...action.payload,
        id: createId(),
        fechaCreacion: new Date().toISOString()
      };
      const audit = createAudit(ACTIONS.CREATE, task.id, diffTask(null, task));
      return { ...state, tasks: [task, ...state.tasks], audit: [audit, ...state.audit] };
    }
    case "UPDATE_TASK": {
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.payload.id) return task;
        const merged = { ...task, ...action.payload.updates };
        if (merged.estado !== "done") {
          merged.estado = merged.fechaInicio ? "doing" : "todo";
        }
        return merged;
      });
      const before = state.tasks.find((task) => task.id === action.payload.id) ?? null;
      const after = tasks.find((task) => task.id === action.payload.id) ?? null;
      const diff = diffTask(before, after);
      const audit = Object.keys(diff).length
        ? [createAudit(ACTIONS.UPDATE, action.payload.id, diff)]
        : [];
      return { ...state, tasks, audit: [...audit, ...state.audit] };
    }
    case "DELETE_TASK": {
      const task = state.tasks.find((t) => t.id === action.payload.id) ?? null;
      const tasks = state.tasks.filter((t) => t.id !== action.payload.id);
      const audit = createAudit(ACTIONS.DELETE, action.payload.id, diffTask(task, null));
      return { ...state, tasks, audit: [audit, ...state.audit] };
    }
    case "MOVE_TASK": {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (!task || task.estado === action.payload.to) return state;
      const updated = { ...task, estado: action.payload.to };
      if (updated.estado === "todo") {
        updated.fechaInicio = undefined;
      }
      if (updated.estado === "doing" && !updated.fechaInicio) {
        updated.fechaInicio = new Date().toISOString();
      }
      const tasks = state.tasks.map((t) => (t.id === task.id ? updated : t));
      const audit = createAudit(ACTIONS.MOVE, task.id, diffTask(task, updated));
      return { ...state, tasks, audit: [audit, ...state.audit] };
    }
    case "IMPORT_STATE": {
      const audit = [...action.payload.auditEvents, ...action.payload.state.audit];
      return {
        ...action.payload.state,
        audit
      };
    }
    case "TOGGLE_GODMODE": {
      const diff = { godMode: { before: state.godMode, after: action.payload } };
      const audit = createAudit(ACTIONS.UPDATE, "GODMODE", diff);
      return { ...state, godMode: action.payload, audit: [audit, ...state.audit] };
    }
    default:
      return state;
  }
}

export default function Page() {
  const [state, dispatch] = React.useReducer(reducer, seedState);
  const [ready, setReady] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = React.useState<Task | null>(null);
  const [importErrors, setImportErrors] = React.useState<string[]>([]);
  const [motivationOpen, setMotivationOpen] = React.useState(false);
  const [motivationLine, setMotivationLine] = React.useState("");
  const [motivationIndex, setMotivationIndex] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const stored = loadState();
    if (stored) {
      const parsed = AppStateSchema.safeParse(stored);
      if (parsed.success) {
        dispatch({ type: "IMPORT_STATE", payload: { state: parsed.data, auditEvents: [] } });
      }
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  const query = parseQuery(search);
  const visibleTasks = filterTasks(state.tasks, query);
  const doingCount = state.tasks.filter((task) => task.estado === "doing").length;
  const motivationLines = React.useMemo(
    () => [
      "Vamos, sigue así: cada minuto cuenta.",
      "Hoy avanzas, mañana celebras.",
      "Lo difícil ya lo empezaste. Termínalo.",
      "Pequeños pasos, gran impacto.",
      "No pares: estás en racha."
    ],
    []
  );

  function handleCreate() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  function handleDelete(task: Task) {
    setDeleteTask(task);
  }

  function handleSubmitTask(values: TaskInput) {
    if (editingTask) {
      dispatch({ type: "UPDATE_TASK", payload: { id: editingTask.id, updates: values } });
    } else {
      dispatch({ type: "CREATE_TASK", payload: values });
    }
    setDialogOpen(false);
    setEditingTask(null);
  }

  function handleConfirmDelete() {
    if (!deleteTask) return;
    dispatch({ type: "DELETE_TASK", payload: { id: deleteTask.id } });
    setDeleteTask(null);
  }

  function handleMove(id: string, to: Task["estado"]) {
    dispatch({ type: "MOVE_TASK", payload: { id, to } });
  }

  function handleStart(task: Task) {
    if (task.estado === "done") return;
    if (task.fechaInicio) {
      dispatch({
        type: "UPDATE_TASK",
        payload: {
          id: task.id,
          updates: {
            estado: "todo",
            fechaInicio: undefined
          }
        }
      });
      return;
    }
    dispatch({
      type: "UPDATE_TASK",
      payload: {
        id: task.id,
        updates: {
          estado: "doing",
          fechaInicio: new Date().toISOString()
        }
      }
    });
  }

  function handleMotivationClick() {
    if (doingCount === 0) {
      setMotivationLine("Empieza una tarea para activar el modo motivación.");
      setMotivationOpen(true);
      return;
    }
    const max = motivationLines.length;
    const nextIndex =
      max <= 1
        ? 0
        : (() => {
            let index = Math.floor(Math.random() * max);
            if (motivationIndex !== null && index === motivationIndex) {
              index = (index + 1) % max;
            }
            return index;
          })();
    setMotivationIndex(nextIndex);
    setMotivationLine(motivationLines[nextIndex] ?? "");
    setMotivationOpen(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => undefined);
    }
  }

  function handleExport() {
    const payload = {
      version: 1,
      data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mesa-trading-kanban-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        const parsed = ExportSchema.safeParse(json);
        if (!parsed.success) {
          setImportErrors(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
          return;
        }
        const incoming = parsed.data.data;
        const ids = new Set<string>();
        const regenEvents: AuditEvent[] = [];
        const tasks = incoming.tasks.map((task) => {
          if (ids.has(task.id)) {
            const oldId = task.id;
            const newId = createId();
            ids.add(newId);
            const updated = { ...task, id: newId };
            regenEvents.push(
              createAudit(
                ACTIONS.UPDATE,
                newId,
                { id: { before: oldId, after: newId } },
                { idRegenerated: true }
              )
            );
            return updated;
          }
          ids.add(task.id);
          return task;
        });
        const importEvent = createAudit(ACTIONS.UPDATE, "IMPORT", {
          import: { before: null, after: { tasks: tasks.length, audit: incoming.audit.length, godMode: incoming.godMode } }
        });
        dispatch({
          type: "IMPORT_STATE",
          payload: {
            state: { ...incoming, tasks },
            auditEvents: [importEvent, ...regenEvents]
          }
        });
        toast.success("Importación completada");
      } catch {
        setImportErrors(["El archivo no contiene un JSON válido."]);
      }
    };
    reader.readAsText(file);
  }

  return (
    <TooltipProvider>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <header className="mb-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Mesa de Trading / Broker Ops
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold sm:text-3xl">Tablero operativo Kanban</h1>
          <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
            <Button onClick={handleCreate} className="w-full sm:w-auto">Nueva tarea</Button>
            <Button variant="outline" onClick={handleExport} aria-label="Exportar JSON" className="w-full sm:w-auto">
              Exportar JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImport(file);
                event.currentTarget.value = "";
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto"
            >
              Importar JSON
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={search} onChange={setSearch} />
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>Modo Dios</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label="Info Modo Dios"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Activa observaciones internas y rúbrica por tarea.
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={state.godMode}
              onCheckedChange={(checked) => dispatch({ type: "TOGGLE_GODMODE", payload: checked })}
              aria-label="Activar modo Dios"
            />
          </div>
        </div>
      </header>

      {importErrors.length > 0 && (
        <Alert className="mb-6">
          <AlertTitle>No se pudo importar</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="board">
        <TabsList className="w-full flex-wrap gap-2 sm:w-auto">
          <TabsTrigger value="board">Tablero</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          {state.godMode && (
            <GodModePanel tasks={state.tasks} />
          )}
          <Board
            tasks={visibleTasks}
            allTasks={state.tasks}
            onMove={handleMove}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStart={handleStart}
            godMode={state.godMode}
          />
        </TabsContent>
        <TabsContent value="audit">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Log de auditoría</h2>
            <CopySummaryButton events={state.audit} />
          </div>
          <AuditTable events={state.audit} />
        </TabsContent>
      </Tabs>

        <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={handleSubmitTask}
        godMode={state.godMode}
      />

      <DeleteTaskDialog
        task={deleteTask}
        onCancel={() => setDeleteTask(null)}
        onConfirm={handleConfirmDelete}
      />

      {doingCount > 0 && (
        <button
          type="button"
          onClick={handleMotivationClick}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Mostrar frase motivadora"
        >
          Motivación
        </button>
      )}

      {motivationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
          <div className="max-w-2xl rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-2xl font-semibold text-slate-900 md:text-3xl">{motivationLine}</p>
            <button
              type="button"
              onClick={() => setMotivationOpen(false)}
              className="mt-6 inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      <audio ref={audioRef} src="/sonido/motivacion.mp3" preload="auto" />
      </main>
    </TooltipProvider>
  );
}

