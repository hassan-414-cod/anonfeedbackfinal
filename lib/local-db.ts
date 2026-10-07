/**
 * Local document store.
 *
 * A small, dependency-free, browser-only replacement for a hosted database.
 * It keeps the same call shapes the app already uses (collection / doc /
 * getDocs / query / where / orderBy / limit / onSnapshot / writeBatch /
 * increment / serverTimestamp), so all page logic stays unchanged.
 *
 * Data lives in `localStorage` under STORAGE_KEY (in-memory on the server).
 * To connect a real backend later, replace this file only.
 */

const STORAGE_KEY = "anonfeedback:db:v1";

type Row = Record<string, any>;
type Tables = Record<string, Record<string, Row>>;

export interface Db {
  readonly kind: "local";
}
export const db: Db = { kind: "local" };

/* ---------------------------------- storage --------------------------------- */

let memory: Tables = {};
const listeners = new Set<() => void>();

function read(): Tables {
  if (typeof window === "undefined") return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tables) : {};
  } catch {
    return memory;
  }
}

function write(tables: Tables) {
  memory = tables;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch (e) {
      console.error("Local storage is full or unavailable.", e);
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // Keep multiple tabs in sync.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((l) => l());
  });
}

/* ----------------------------- field transforms ----------------------------- */

const SERVER_TS = "__serverTimestamp__";

export function serverTimestamp() {
  return { __op: SERVER_TS };
}
export function increment(n: number) {
  return { __op: "increment", n };
}

function resolve(existing: any, value: any): any {
  if (value && typeof value === "object" && typeof value.__op === "string") {
    if (value.__op === SERVER_TS) {
      const ms = Date.now();
      return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 };
    }
    if (value.__op === "increment") return (Number(existing) || 0) + value.n;
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}

function applyFields(base: Row, patch: Row): Row {
  const out: Row = { ...base };
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) continue;
    out[key] = resolve(base[key], patch[key]);
  }
  return out;
}

/* ------------------------------ refs and queries ----------------------------- */

export interface CollectionReference {
  type: "collection";
  path: string;
  id: string;
}
export interface DocumentReference {
  type: "document";
  path: string; // collection path
  id: string;
}

function newId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function collection(_db: Db, ...segments: string[]): CollectionReference {
  const path = segments.join("/");
  return { type: "collection", path, id: segments[segments.length - 1] };
}

export function doc(
  parent: Db | CollectionReference,
  ...segments: string[]
): DocumentReference {
  if ((parent as CollectionReference).type === "collection") {
    const col = parent as CollectionReference;
    return { type: "document", path: col.path, id: segments[0] || newId() };
  }
  const id = segments[segments.length - 1];
  const path = segments.slice(0, -1).join("/");
  return { type: "document", path, id };
}

type Op = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";
type Constraint =
  | { kind: "where"; field: string; op: Op; value: any }
  | { kind: "orderBy"; field: string; dir: "asc" | "desc" }
  | { kind: "limit"; n: number };

export interface Query {
  type: "query";
  path: string;
  constraints: Constraint[];
}

export function where(field: string, op: Op, value: any): Constraint {
  return { kind: "where", field, op, value };
}
export function orderBy(field: string, dir: "asc" | "desc" = "asc"): Constraint {
  return { kind: "orderBy", field, dir };
}
export function limit(n: number): Constraint {
  return { kind: "limit", n };
}
export function query(col: CollectionReference | Query, ...constraints: Constraint[]): Query {
  const base = col.type === "query" ? col.constraints : [];
  return { type: "query", path: col.path, constraints: [...base, ...constraints] };
}

/* -------------------------------- snapshots --------------------------------- */

export interface DocumentSnapshot {
  id: string;
  ref: DocumentReference;
  exists: () => boolean;
  data: () => any;
}
export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  size: number;
  empty: boolean;
  forEach: (cb: (d: DocumentSnapshot) => void) => void;
}

function makeDocSnap(path: string, id: string, row: Row | undefined): DocumentSnapshot {
  return {
    id,
    ref: { type: "document", path, id },
    exists: () => row !== undefined,
    data: () => (row ? JSON.parse(JSON.stringify(row)) : undefined),
  };
}

function comparable(v: any): number | string {
  if (v && typeof v === "object" && typeof v.seconds === "number") {
    return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
  }
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t) && /^\d{4}-\d{2}-\d{2}T/.test(v)) return t;
    return v;
  }
  return v ?? 0;
}

function matches(row: Row, c: Extract<Constraint, { kind: "where" }>) {
  const a = comparable(row[c.field]);
  const b = comparable(c.value);
  switch (c.op) {
    case "==": return a === b;
    case "!=": return a !== b;
    case "<": return a < b;
    case "<=": return a <= b;
    case ">": return a > b;
    case ">=": return a >= b;
    case "in": return Array.isArray(c.value) && c.value.includes(row[c.field]);
    case "array-contains":
      return Array.isArray(row[c.field]) && row[c.field].includes(c.value);
  }
}

function run(q: CollectionReference | Query): QuerySnapshot {
  const constraints = q.type === "query" ? q.constraints : [];
  const table = read()[q.path] || {};
  let rows = Object.entries(table).map(([id, row]) => ({ id, row }));

  for (const c of constraints) {
    if (c.kind === "where") rows = rows.filter((r) => matches(r.row, c));
  }
  const orders = constraints.filter(
    (c): c is Extract<Constraint, { kind: "orderBy" }> => c.kind === "orderBy",
  );
  if (orders.length) {
    rows.sort((x, y) => {
      for (const o of orders) {
        const a = comparable(x.row[o.field]);
        const b = comparable(y.row[o.field]);
        if (a < b) return o.dir === "asc" ? -1 : 1;
        if (a > b) return o.dir === "asc" ? 1 : -1;
      }
      return 0;
    });
  }
  const lim = constraints.find((c) => c.kind === "limit") as
    | Extract<Constraint, { kind: "limit" }>
    | undefined;
  if (lim) rows = rows.slice(0, lim.n);

  const docs = rows.map((r) => makeDocSnap(q.path, r.id, r.row));
  return { docs, size: docs.length, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
}

/* ---------------------------------- reads ----------------------------------- */

export async function getDoc(ref: DocumentReference): Promise<DocumentSnapshot> {
  const row = (read()[ref.path] || {})[ref.id];
  return makeDocSnap(ref.path, ref.id, row);
}

export async function getDocs(q: CollectionReference | Query): Promise<QuerySnapshot> {
  return run(q);
}

export async function getCountFromServer(q: CollectionReference | Query) {
  const count = run(q).size;
  return { data: () => ({ count }) };
}

export function onSnapshot(
  target: DocumentReference,
  next: (snap: DocumentSnapshot) => void,
  error?: (e: Error) => void,
): () => void;
export function onSnapshot(
  target: CollectionReference | Query,
  next: (snap: QuerySnapshot) => void,
  error?: (e: Error) => void,
): () => void;
export function onSnapshot(
  target: DocumentReference | CollectionReference | Query,
  next: (snap: any) => void,
  error?: (e: Error) => void,
): () => void {
  const emit = () => {
    try {
      if (target.type === "document") {
        next(makeDocSnap(target.path, target.id, (read()[target.path] || {})[target.id]));
      } else {
        next(run(target));
      }
    } catch (e) {
      error?.(e as Error);
    }
  };
  listeners.add(emit);
  const t = setTimeout(emit, 0);
  return () => {
    clearTimeout(t);
    listeners.delete(emit);
  };
}

/* --------------------------------- writes ----------------------------------- */

function putRow(path: string, id: string, fn: (existing: Row | undefined) => Row | null) {
  const tables = read();
  const table = { ...(tables[path] || {}) };
  const next = fn(table[id]);
  if (next === null) delete table[id];
  else table[id] = next;
  write({ ...tables, [path]: table });
}

export async function setDoc(
  ref: DocumentReference,
  data: Row,
  options?: { merge?: boolean },
): Promise<void> {
  putRow(ref.path, ref.id, (existing) =>
    applyFields(options?.merge && existing ? existing : {}, data),
  );
}

export async function addDoc(col: CollectionReference, data: Row): Promise<DocumentReference> {
  const ref = doc(col);
  await setDoc(ref, data);
  return ref;
}

export async function updateDoc(ref: DocumentReference, data: Row): Promise<void> {
  const exists = (read()[ref.path] || {})[ref.id];
  if (!exists) throw new Error(`No document to update: ${ref.path}/${ref.id}`);
  putRow(ref.path, ref.id, (existing) => applyFields(existing || {}, data));
}

export async function deleteDoc(ref: DocumentReference): Promise<void> {
  putRow(ref.path, ref.id, () => null);
}

export function writeBatch(_db: Db) {
  const ops: Array<() => Promise<void>> = [];
  const batch = {
    set(ref: DocumentReference, data: Row, options?: { merge?: boolean }) {
      ops.push(() => setDoc(ref, data, options));
      return batch;
    },
    update(ref: DocumentReference, data: Row) {
      ops.push(() => updateDoc(ref, data));
      return batch;
    },
    delete(ref: DocumentReference) {
      ops.push(() => deleteDoc(ref));
      return batch;
    },
    async commit() {
      for (const op of ops) await op();
    },
  };
  return batch;
}
