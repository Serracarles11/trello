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

function normalizeTask(task: Task): Task {
  if (task.estado === "doing" && !task.fechaInicio) {
    return { ...task, estado: "todo" };
  }
  return task;
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
  const [darkMode, setDarkMode] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const motivationIntervalRef = React.useRef<number | null>(null);
  const motivationIndexRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const stored = loadState();
    if (stored) {
      const parsed = AppStateSchema.safeParse(stored);
      if (parsed.success) {
        const normalized = {
          ...parsed.data,
          tasks: parsed.data.tasks.map(normalizeTask)
        };
        dispatch({ type: "IMPORT_STATE", payload: { state: normalized, auditEvents: [] } });
      }
    }
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    setReady(true);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  React.useEffect(() => {
    if (!ready) return;
    saveState(state);
  }, [state, ready]);

  const query = parseQuery(search);
  const visibleTasks = filterTasks(state.tasks, query);
  const totalCount = state.tasks.length;
  const todoCount = state.tasks.filter((task) => task.estado === "todo").length;
  const doingCount = state.tasks.filter((task) => task.estado === "doing").length;
  const doneCount = state.tasks.filter((task) => task.estado === "done").length;
  const motivationLines = React.useMemo(
    () => [
      "Un paso más y ya es progreso.",
      "Hoy cuenta. Hazlo por tu yo de mañana.",
      "Sigue: lo estás construyendo ahora.",
      "No hace falta perfecto, hace falta hecho.",
      "Cinco minutos más. Tú puedes.",
      "Si hoy lo haces, mañana te lo agradeces.",
      "Constancia > ganas. Dale.",
      "Cada repetición te hace mejor.",
      "No lo pienses tanto: empieza.",
      "Vas mejor de lo que crees.",
      "Una cosa a la vez. Sin parar.",
      "Cuando te canses, baja el ritmo, no pares.",
      "Te queda menos de lo que parece.",
      "Hazlo aunque no apetezca: ahí está el cambio.",
      "Hoy sumas. Mañana se nota.",
      "Disciplina ahora, orgullo después.",
      "No es suerte: es trabajo.",
      "La racha se mantiene con una acción más.",
      "Tu futuro empieza con este minuto.",
      "No te rindas: estás calentando motores."
    ],
    []
  );

  function getNextMotivationIndex(current: number | null) {
    const max = motivationLines.length;
    if (max <= 1) return 0;
    let index = Math.floor(Math.random() * max);
    if (current !== null && index === current) {
      index = (index + 1) % max;
    }
    return index;
  }

  function setNextMotivationLine() {
    const nextIndex = getNextMotivationIndex(motivationIndexRef.current);
    motivationIndexRef.current = nextIndex;
    setMotivationIndex(nextIndex);
    setMotivationLine(motivationLines[nextIndex] ?? "");
  }

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
    setNextMotivationLine();
    setMotivationOpen(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => undefined);
    }
  }

  function stopMotivationAudio() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  function handleCloseMotivation() {
    setMotivationOpen(false);
    stopMotivationAudio();
  }

  React.useEffect(() => {
    if (!motivationOpen || doingCount === 0) {
      if (motivationIntervalRef.current !== null) {
        window.clearInterval(motivationIntervalRef.current);
        motivationIntervalRef.current = null;
      }
      return;
    }

    motivationIntervalRef.current = window.setInterval(() => {
      setNextMotivationLine();
    }, 3000);

    return () => {
      if (motivationIntervalRef.current !== null) {
        window.clearInterval(motivationIntervalRef.current);
        motivationIntervalRef.current = null;
      }
    };
  }, [motivationOpen, doingCount, motivationLines.length]);

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
        }).map(normalizeTask);
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
      <main className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="absolute top-24 right-[-12%] h-96 w-96 rounded-full bg-accent-100/70 blur-3xl" />
          <div className="absolute bottom-[-15%] left-1/3 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(17,46,72,0.08),transparent_55%)]" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <header className="mb-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] animate-fade-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-700 shadow-sm">
                Micro-Trello Ops
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Tablero operativo Kanban
                </h1>
                <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                  Micro-Trello con auditoría y modo Dios para mantener foco, ritmo y trazabilidad en cada entrega.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleCreate}
                  className="bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  Nueva tarea
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  aria-label="Exportar JSON"
                  className="border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
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
                  className="border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Importar JSON
                </Button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
                <SearchBar value={search} onChange={setSearch} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Estado</p>
                  <h2 className="text-lg font-semibold text-slate-900">Resumen operativo</h2>
                </div>
                <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">En vivo</div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{totalCount}</p>
                  <p className="text-xs text-slate-500">tareas</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">En curso</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{doingCount}</p>
                  <p className="text-xs text-slate-500">activas</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Completadas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{doneCount}</p>
                  <p className="text-xs text-slate-500">cerradas</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
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
                    <p className="text-xs text-slate-500">Supervisión avanzada y criterios de revisión.</p>
                  </div>
                  <Switch
                    checked={state.godMode}
                    onCheckedChange={(checked) => dispatch({ type: "TOGGLE_GODMODE", payload: checked })}
                    aria-label="Activar modo Dios"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span>Modo noche</span>
                    </div>
                    <p className="text-xs text-slate-500">Activa la interfaz en modo oscuro.</p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    aria-label="Activar modo noche"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>Pendientes</span>
                <span className="text-slate-700">{todoCount}</span>
              </div>
            </div>
          </header>

          {importErrors.length > 0 && (
            <Alert className="mb-6 rounded-2xl border border-rose-100 bg-rose-50/80 text-rose-900">
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

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur animate-fade-up [animation-delay:120ms]">
            <Tabs defaultValue="board" className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="flex w-full flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-100/80 p-1 sm:w-auto">
                  <TabsTrigger
                    value="board"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm"
                  >
                    Tablero
                  </TabsTrigger>
                  <TabsTrigger
                    value="audit"
                    className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-sm"
                  >
                    Auditoría
                  </TabsTrigger>
                </TabsList>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Control de operaciones
                </div>
              </div>
              <TabsContent value="board" className="space-y-4">
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
              <TabsContent value="audit" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Historial</p>
                    <h2 className="text-xl font-semibold text-slate-900">Log de auditoría</h2>
                  </div>
                  <CopySummaryButton events={state.audit} />
                </div>
                <AuditTable events={state.audit} />
              </TabsContent>
            </Tabs>
          </section>

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
              className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-brand-700 hover:to-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Mostrar frase motivadora"
            >
              Motivación
            </button>
          )}

          {motivationOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
              <div className="max-w-2xl rounded-3xl border border-white/80 bg-white/90 p-10 text-center shadow-2xl backdrop-blur">
                <p className="text-2xl font-semibold text-slate-900 md:text-3xl">{motivationLine}</p>
                <p className="mt-3 text-sm text-slate-500">Respira, ajusta el ritmo y sigue avanzando.</p>
                <button
                  type="button"
                  onClick={handleCloseMotivation}
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
          <audio ref={audioRef} src="/sonido/motivacion.mp3" preload="auto" />
        </div>
      </main>
    </TooltipProvider>
  );
}
