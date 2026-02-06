import type { Task } from "@/types";

export type EstFilter = {
  op: "<" | "<=" | ">" | ">=" | "=";
  value: number;
};

export type Query = {
  text: string[];
  tags: string[];
  priority?: "low" | "medium" | "high";
  due?: "overdue" | "week";
  est?: EstFilter;
};

export function parseQuery(raw: string): Query {
  const tokens = raw
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);

  const query: Query = { text: [], tags: [] };

  tokens.forEach((token) => {
    if (token.startsWith("tag:")) {
      const tag = token.replace("tag:", "").toLowerCase();
      if (tag) query.tags.push(tag);
      return;
    }
    if (token.startsWith("p:")) {
      const p = token.replace("p:", "");
      if (p === "low" || p === "medium" || p === "high") {
        query.priority = p;
      }
      return;
    }
    if (token.startsWith("due:")) {
      const due = token.replace("due:", "");
      if (due === "overdue" || due === "week") {
        query.due = due;
      }
      return;
    }
    if (token.startsWith("est:")) {
      const estRaw = token.replace("est:", "");
      const match = estRaw.match(/^(<=|>=|<|>|=)?(\d+)$/);
      if (match) {
        const op = (match[1] || "=") as EstFilter["op"];
        const value = Number(match[2]);
        if (!Number.isNaN(value)) {
          query.est = { op, value };
        }
      }
      return;
    }
    query.text.push(token.toLowerCase());
  });

  return query;
}

function matchesEst(task: Task, filter?: EstFilter) {
  if (!filter) return true;
  const value = task.estimacionMin;
  switch (filter.op) {
    case "<":
      return value < filter.value;
    case "<=":
      return value <= filter.value;
    case ">":
      return value > filter.value;
    case ">=":
      return value >= filter.value;
    case "=":
      return value === filter.value;
    default:
      return true;
  }
}

function matchesDue(task: Task, due?: Query["due"]) {
  if (!due) return true;
  if (!task.fechaLimite) return false;
  const now = new Date();
  const limit = new Date(task.fechaLimite);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due === "overdue") {
    return limit < startOfToday;
  }
  if (due === "week") {
    const weekAhead = new Date(startOfToday);
    weekAhead.setDate(weekAhead.getDate() + 7);
    return limit >= startOfToday && limit <= weekAhead;
  }
  return true;
}

export function filterTasks(tasks: Task[], query: Query) {
  return tasks.filter((task) => {
    const haystack = `${task.titulo} ${task.descripcion ?? ""}`.toLowerCase();
    const textMatch = query.text.every((token) => haystack.includes(token));
    const tagMatch = query.tags.every((tag) =>
      task.tags.map((t) => t.toLowerCase()).includes(tag)
    );
    const priorityMatch = query.priority ? task.prioridad === query.priority : true;
    const dueMatch = matchesDue(task, query.due);
    const estMatch = matchesEst(task, query.est);
    return textMatch && tagMatch && priorityMatch && dueMatch && estMatch;
  });
}

