import {
  ArrayType,
  DuplicateSurrealError,
  EdgeSchema,
  ObjectType,
  OptionType,
  OrmError,
  RecordType,
  SurqlExpression,
  TypeParseError,
  UnionType,
  __ctx,
  __display,
  __fields,
  __type,
  actionable,
  andWhere,
  checkArgs,
  checkRecord,
  checkRequired,
  checkSet,
  checkValue,
  displayContext,
  escapeIdiomPath,
  generateSetAssignments,
  inheritableIntoWorkable,
  inlineValue,
  intoWorkable,
  isFieldPath,
  isWorkable,
  joiningFilter,
  patchTableDdl,
  prefixedFilter,
  processSetOperators,
  registerModelClass,
  renderValue,
  resolveAccessType,
  resolveSubjectSchema,
  safeParseWith,
  sanitizeWorkable,
  t_exports,
  throwIfInvalid
} from "./chunk-EQBUA4DZ.js";

// src/schema/orm.ts
import {
  Duration,
  GeometryPoint,
  RecordId as RecordId2,
  Uuid
} from "surrealdb";

// src/query/api.ts
import { UnsuccessfulApiError } from "surrealdb";
function isSuccess(status) {
  return status >= 200 && status < 300;
}
var ApiClient = class {
  constructor(surreal, endpoints, validate = false) {
    this.surreal = surreal;
    this.validate = validate;
    this.schemas = /* @__PURE__ */ new Map();
    for (const ep of endpoints) {
      this.schemas.set(ep.path, ep.methods);
    }
  }
  schemas;
  // -------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------
  getMethodDef(path, method) {
    return this.schemas.get(path)?.[method];
  }
  parseBody(body, path, method) {
    const def = this.getMethodDef(path, method);
    if (def?.response && body !== void 0) {
      return def.response.parse(body);
    }
    return body;
  }
  async invoke(path, method, body) {
    const request = this.getMethodDef(path, method)?.request;
    if (this.validate && request) {
      throwIfInvalid(
        checkValue(request, body),
        void 0,
        `request body for ${method.toUpperCase()} ${path}`
      );
    }
    const sdkApi = this.surreal.api();
    const response = await sdkApi.invoke(path, {
      method,
      body
    });
    if (response.status !== void 0 && !isSuccess(response.status)) {
      throw new UnsuccessfulApiError(path, method, response);
    }
    response.body = this.parseBody(response.body, path, method);
    return response;
  }
  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------
  /**
   * Invoke a user-defined GET API endpoint.
   *
   * @param path - The endpoint path.
   * @returns The typed API response.
   */
  get(path) {
    return this.invoke(path, "get");
  }
  /**
   * Invoke a user-defined POST API endpoint.
   *
   * @param path - The endpoint path.
   * @param body - The request body.
   * @returns The typed API response.
   */
  post(path, body) {
    return this.invoke(path, "post", body);
  }
  /**
   * Invoke a user-defined PUT API endpoint.
   *
   * @param path - The endpoint path.
   * @param body - The request body.
   * @returns The typed API response.
   */
  put(path, body) {
    return this.invoke(path, "put", body);
  }
  /**
   * Invoke a user-defined DELETE API endpoint.
   *
   * @param path - The endpoint path.
   * @param body - Optional request body.
   * @returns The typed API response.
   */
  delete(path, body) {
    return this.invoke(path, "delete", body);
  }
  /**
   * Invoke a user-defined PATCH API endpoint.
   *
   * @param path - The endpoint path.
   * @param body - The request body.
   * @returns The typed API response.
   */
  patch(path, body) {
    return this.invoke(path, "patch", body);
  }
  /**
   * Invoke a user-defined TRACE API endpoint.
   *
   * @param path - The endpoint path.
   * @param body - Optional request body.
   * @returns The typed API response.
   */
  trace(path, body) {
    return this.invoke(path, "trace", body);
  }
};

// src/query/batch.ts
import { BoundQuery } from "surrealdb";

// src/query/request.ts
import {
  SurrealRequestScope,
  SurrealSession
} from "surrealdb";
function addSignal(options, signal) {
  if (!signal) return options;
  return { ...options, signals: [...options.signals ?? [], signal] };
}
function applyRequestOptions(query, options) {
  let configured = query;
  for (const signal of options.signals ?? []) {
    configured = configured.signal(signal);
  }
  if (options.requestTimeout !== void 0) {
    configured = configured.requestTimeout(options.requestTimeout);
  }
  if (options.retry !== void 0) {
    configured = configured.retry(options.retry);
  }
  return configured;
}
function bindSignals(connection, options) {
  let bound = connection;
  for (const signal of options.signals ?? []) {
    bound = bound.withSignal(signal);
  }
  return bound;
}
var EMPTY_SUBJECT = /Cannot execute \w+ statement using value:\s*\{\s*\}/;
function isForeignConnection(connection) {
  return !(connection instanceof SurrealSession || connection instanceof SurrealRequestScope);
}
function diagnoseSdkError(connection, error) {
  if (error instanceof Error && EMPTY_SUBJECT.test(error.message) && isForeignConnection(connection)) {
    return new DuplicateSurrealError({ cause: error });
  }
  return error;
}
async function withSdkDiagnosis(connection, run) {
  try {
    return await run();
  } catch (error) {
    throw diagnoseSdkError(connection, error);
  }
}

// src/query/batch.ts
var BatchQuery = class _BatchQuery {
  constructor(surreal, queries, options = {}) {
    this.surreal = surreal;
    this.queries = queries;
    this.options = options;
  }
  /** Render each query as a single statement sharing one variable store. */
  statements(inp) {
    return this.queries.map((q) => {
      const sql = q[__display](inp);
      return sql.startsWith("(") && sql.endsWith(")") ? sql.slice(1, -1) : sql;
    });
  }
  [__display](inp) {
    return `BEGIN TRANSACTION; ${this.statements(inp).join("; ")}; COMMIT TRANSACTION;`;
  }
  toString() {
    const ctx = displayContext();
    return this[__display](ctx);
  }
  [Symbol.toStringTag] = "BatchQuery";
  /** A copy of this batch with different request options. */
  withOptions(options) {
    return new _BatchQuery(this.surreal, this.queries, options);
  }
  /**
   * Abandon the batch when `signal` aborts. Calling this more than once
   * combines the signals.
   *
   * Aborting means "stop waiting", and nothing more: the batch is a single
   * request that the server may carry on to run, so **it may or may not have
   * been committed**.
   */
  signal(signal) {
    return this.withOptions(addSignal(this.options, signal));
  }
  /**
   * Give up on the batch with a `TimeoutError` if the server has not answered
   * within `milliseconds` (per attempt, when retrying), overriding the
   * connection's `requestTimeout`. Pass `0` to wait without limit. As for
   * {@link BatchQuery.signal}, the batch may or may not have been committed.
   */
  requestTimeout(milliseconds) {
    return this.withOptions({ ...this.options, requestTimeout: milliseconds });
  }
  /**
   * Re-send the whole batch when it fails because of a conflict with a
   * concurrent transaction. Defaults to the connection's retry behaviour; pass
   * options to override it, or `false` to turn it off.
   *
   * Conflicts are recognised from the structured `TransactionConflict` error
   * that SurrealDB 3.1.0 and later report. For earlier servers, pass a
   * `retryable` predicate.
   */
  retry(options = true) {
    return this.withOptions({ ...this.options, retry: options });
  }
  async execute() {
    for (const q of this.queries) q.assertInput();
    const ctx = displayContext();
    const statements = this.statements(ctx);
    const connection = bindSignals(this.surreal, this.options);
    const queries = statements.length === 0 ? [] : [new BoundQuery(statements.join("; "), ctx.variables)];
    const results = await withSdkDiagnosis(
      connection,
      () => connection.transaction(queries, {
        retry: this.options.retry,
        requestTimeout: this.options.requestTimeout
      })
    );
    return results.map((result, i) => {
      return this.queries[i].parseResult(result);
    });
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional for Promise-like behavior
  get then() {
    return (onFulfilled, onRejected) => {
      return this.execute().then(onFulfilled, onRejected);
    };
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// src/query/create.ts
import { RecordId, Table } from "surrealdb";

// src/utils/traversal.ts
var TRAVERSAL_VERBS = /* @__PURE__ */ new Set([
  "out",
  "in",
  "both",
  "recurse",
  "collect",
  "shortest"
]);
function traversableRow(row, fields) {
  return new Proxy(row, {
    get(target, prop) {
      if (prop === "extend") {
        return (extra) => {
          const merged = {};
          const row2 = target;
          for (const key of Object.keys(fields)) {
            merged[key] = row2[key];
          }
          Object.assign(merged, extra);
          return inheritableIntoWorkable(merged);
        };
      }
      if (typeof prop === "string" && TRAVERSAL_VERBS.has(prop)) {
        const idRecord = target.id;
        const verb = (...args) => idRecord[prop](
          ...args
        );
        if (prop in fields) {
          const field = target[prop];
          return new Proxy(verb, {
            get: (_verb, key) => key === "valueOf" ? () => field : field[key]
          });
        }
        return verb;
      }
      return target[prop];
    }
  });
}

// src/query/abstract.ts
import { BoundQuery as BoundQuery2 } from "surrealdb";

// src/schema/model-type.ts
var ModelType = class extends ObjectType {
  constructor(fields, model) {
    super(fields);
    this.model = model;
  }
  /** Parse a row, then hydrate it into an instance of the linked class. */
  parse(value) {
    const row = super.parse(value);
    return Object.assign(Object.create(this.model.prototype), row);
  }
};

// src/query/write-result.ts
function parseWritten(type, value) {
  if (type instanceof ArrayType && Array.isArray(type.schema)) {
    return type.parse(value);
  }
  if (type instanceof ArrayType) {
    if (!Array.isArray(value)) return type.parse(value);
    const row = type.schema;
    return value.map((item) => parseRow(row, item));
  }
  if (Array.isArray(value)) {
    throw new TypeParseError(type.name, type.expected, value);
  }
  return parseRow(type, value);
}
function parseRow(type, value) {
  if (value === void 0 || value === null) return value;
  if (type instanceof OptionType) return parseRow(type.schema, value);
  if (!(type instanceof ObjectType) || typeof value !== "object") {
    return type.parse(value);
  }
  const source = value;
  const result = { ...source };
  const schema = type.schema;
  for (const key in schema) {
    if (source[key] !== void 0) {
      result[key] = schema[key].parse(source[key]);
    }
  }
  return type instanceof ModelType ? Object.assign(Object.create(type.model.prototype), result) : result;
}

// src/query/abstract.ts
var Query = class {
  type = void 0;
  /** When true, result parsing is skipped (used by RETURN DIFF). */
  _skipParse = false;
  /**
   * When true, the result of a partial write is parsed leniently: a field the
   * write did not set is not an error, since the record need not have it. See
   * `parseWritten`.
   */
  _lenient = false;
  /** Client-side options applied when the query is sent. */
  _request = {};
  /** Per-query override of the ORM's input validation; `undefined` defers to the ORM. */
  _validate;
  /**
   * Check the data this query writes against the table schema before it is
   * sent, throwing a {@link ValidationError} that lists every failing field.
   * `.validated()` turns it on for this query and `.validated(false)` off; by
   * default it follows the ORM (see `Orm.validated()`), which is off.
   */
  validated(enabled = true) {
    return this.derive((next) => {
      next._validate = enabled;
    });
  }
  /**
   * Validate the data this query writes, if input validation is on for it.
   * Called before the query is sent (and before a batch sends it).
   *
   * @throws {ValidationError} If the data does not match the table schema.
   */
  assertInput() {
    if (this._validate ?? this[__ctx].orm.validation) this.validateInput();
  }
  /** Overridden by the write queries to check the data they carry. */
  validateInput() {
  }
  /** Type-guard that checks whether a value matches this query's result type. */
  validate(value) {
    return this[__type].validate(value);
  }
  /** Parse and validate a raw query result against this query's result type. */
  parse(value) {
    return this[__type].parse(value);
  }
  /**
   * Normalize a raw query result into the public return value for this query.
   * Most queries parse through the runtime schema, while a few modes such as
   * `RETURN DIFF` intentionally bypass parse.
   */
  parseResult(value) {
    if (this._skipParse) return value;
    if (this._lenient) return parseWritten(this[__type], value);
    return this.parse(value);
  }
  /** Create a shallow clone of this query. */
  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
  /**
   * Return a shallow {@link clone} of this query with `mutate` applied to it.
   *
   * This is the basis of the immutable builder API: every chaining method
   * (`.where()`, `.limit()`, …) derives a *new* query rather than mutating
   * `this`, so a partially-built query can be safely reused as the base for
   * several divergent queries without their state leaking into one another.
   *
   * Because the clone is shallow, `mutate` must replace mutable fields
   * wholesale (e.g. `next._orderBy = [...next._orderBy ?? [], entry]`) instead
   * of mutating them in place — an in-place `push`/property write would also
   * affect the original query, which shares the same array/object references.
   */
  derive(mutate) {
    const next = this.clone();
    mutate(next);
    return next;
  }
  /**
   * Abandon the query when `signal` aborts: the returned promise rejects with
   * the signal's reason instead of waiting for the server. Calling this more
   * than once combines the signals.
   *
   * Aborting means "stop waiting", and nothing more. The server may carry on,
   * so **a write that was already sent may or may not have been applied**.
   * To tie every query of a request handler to the request's signal, use
   * `orm.withSignal()` instead.
   *
   * ```ts
   * await db.select("report").signal(AbortSignal.timeout(2000));
   * ```
   */
  signal(signal) {
    return this.derive((next) => {
      next._request = addSignal(next._request, signal);
    });
  }
  /**
   * Give up on the query with a `TimeoutError` if the server has not answered
   * within `milliseconds`, overriding the connection's `requestTimeout`. Pass
   * `0` to wait without limit.
   *
   * This is a limit on the *client*. It is not the `TIMEOUT` clause that
   * `.timeout()` adds to the statement and the server enforces. The server is
   * not told the client has given up, so a write that timed out may or may not
   * have been applied.
   */
  requestTimeout(milliseconds) {
    return this.derive((next) => {
      next._request = { ...next._request, requestTimeout: milliseconds };
    });
  }
  /**
   * Re-send the query, with exponential backoff, when it fails because of a
   * transaction conflict with a concurrent write. Defaults to the connection's
   * retry behaviour; pass options to override it, or `false` to turn it off.
   *
   * The whole query is re-sent, which is safe for a single statement. Do not use
   * it inside an interactive transaction, where a conflict has already failed
   * the transaction. To retry several statements together, use `orm.batch()`,
   * which is atomic and can be retried as a unit.
   *
   * Conflicts are recognised from the structured `TransactionConflict` error
   * that SurrealDB 3.1.0 and later report. For earlier servers, pass a
   * `retryable` predicate.
   */
  retry(options = true) {
    return this.derive((next) => {
      next._request = { ...next._request, retry: options };
    });
  }
  /** Render the query as a SurrealQL string. */
  toString() {
    const ctx = displayContext();
    return this[__display]({
      ...ctx,
      contextId: this[__ctx].id
    });
  }
  [Symbol.toStringTag] = "Query";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  // biome-ignore lint/suspicious/noThenProperty: entire point of the class
  get then() {
    const fn = (onFulfilled, onRejected) => {
      return this.execute().then(onFulfilled, onRejected);
    };
    const val = () => this.execute().then(
      (result) => Array.isArray(result) ? result.at(0) : result
    );
    const at = (index) => this.execute().then(
      (result) => Array.isArray(result) ? result.at(index) : void 0
    );
    return Object.assign(fn, { val, at });
  }
  wrap() {
    const query = this;
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: this[__type],
      [__display](ctx) {
        return `(${query[__display](ctx)})`;
      }
    });
  }
  /** Execute the query against SurrealDB and return the parsed result. */
  async execute() {
    this.assertInput();
    const ctx = displayContext();
    const query = this[__display](ctx);
    const { surreal } = this[__ctx].orm;
    const [result] = await withSdkDiagnosis(
      surreal,
      () => applyRequestOptions(
        surreal.query(query, ctx.variables),
        this._request
      )
    );
    return this.parseResult(result);
  }
  /**
   * Compile this query into a fully-typed SurrealDB {@link BoundQuery} — the
   * query string plus its bindings — that can be handed straight to the SDK's
   * `surreal.query(...)`, including inside a manual transaction
   * (`await db.begin()`):
   *
   * ```ts
   * const prepared = orm
   *   .select("user")
   *   .return((user) => ({ fullName: user.name, email: user.email }))
   *   .prepare();
   *
   * const [users] = await db.query(prepared); // users is fully typed
   * ```
   *
   * The result type is preserved (`BoundQuery<[this["type"]]>`), so the SDK
   * types the response from the ORM's inferred schema. Unlike {@link execute},
   * the SDK's raw result is **not** run through this query's {@link parseResult}
   * — the caller owns decoding.
   *
   * Options set with `.signal()`, `.requestTimeout()` and `.retry()` are not
   * carried over: they configure how this query is sent, and a prepared query
   * is sent by the caller. Configure the SDK query instead, for example
   * `surreal.query(prepared).retry()`.
   */
  prepare() {
    this.assertInput();
    const ctx = displayContext();
    const query = this[__display](ctx);
    return new BoundQuery2(query, ctx.variables);
  }
};

// src/query/defaults.ts
import { escapeIdent } from "surrealdb";
function schemaDefaults(schema) {
  if (!(schema instanceof ObjectType)) return [];
  const defaults = [];
  for (const [key, type] of Object.entries(
    schema.schema
  )) {
    if (key !== "id" && type._default !== void 0)
      defaults.push([key, type._default]);
  }
  return defaults;
}
function resolve(value) {
  return typeof value === "function" ? value() : value;
}
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function fillRecord(record, defaults) {
  const filled = { ...record };
  for (const [field, value] of defaults) {
    if (filled[field] === void 0) filled[field] = resolve(value);
  }
  return filled;
}
function fillData(data, defaults) {
  if (defaults.length === 0) return data;
  if (Array.isArray(data))
    return data.map(
      (row) => isPlainObject(row) ? fillRecord(row, defaults) : row
    );
  return isPlainObject(data) ? fillRecord(data, defaults) : data;
}
var containsExpr = (value) => Array.isArray(value) ? value.some(containsExpr) : isPlainObject(value) && Object.values(value).some((v) => v instanceof SurqlExpression);
function renderData(data, ctx) {
  if (!containsExpr(data)) return ctx.var(data);
  if (Array.isArray(data))
    return `[${data.map((row) => renderData(row, ctx)).join(", ")}]`;
  const entries = Object.entries(data).filter(([, v]) => v !== void 0).map(([k, v]) => `${escapeIdent(k)}: ${renderValue(v, ctx)}`);
  return `{ ${entries.join(", ")} }`;
}
function withDefaults(state, defaults) {
  if (defaults.length === 0) return state;
  const next = { ...state };
  const mode = state._modificationMode;
  if (mode === void 0 || mode === "set") {
    const set = { ...state._set };
    const covers = (key, field) => key === field || key.startsWith(`${field}.`);
    for (const [field, value] of defaults) {
      const present = Object.keys(set).some((k) => covers(k, field)) || (state._unset ?? []).some((u) => covers(u, field));
      if (!present) set[field] = resolve(value);
    }
    if (Object.keys(set).length > 0) next._set = set;
  } else if (mode === "content") {
    next._content = fillData(state._content, defaults);
  } else if (mode === "merge") {
    next._merge = fillData(state._merge, defaults);
  }
  return next;
}
function fillValues(fields, rows, defaults) {
  const missing = defaults.filter(([f]) => !fields.includes(f));
  const listed = defaults.filter(([f]) => fields.includes(f)).map(([f, v]) => [fields.indexOf(f), v]);
  return {
    fields: [...fields, ...missing.map(([f]) => f)],
    rows: rows.map((row) => {
      const filled = [...row];
      for (const [index, value] of listed) {
        if (filled[index] === void 0) filled[index] = resolve(value);
      }
      return [...filled, ...missing.map(([, v]) => resolve(v))];
    })
  };
}

// src/query/modification-methods.ts
function assertDottedRootsSupplied(data) {
  for (const key of Object.keys(data)) {
    const dot = key.indexOf(".");
    if (dot === -1) continue;
    const root = key.slice(0, dot);
    if (data[root] !== void 0) continue;
    throw new OrmError(
      `set() key "${key}" writes into "${root}", but "${root}" is not set in the same call. Set the parent object in full alongside it (for example .set({ ${root}: { \u2026 }, "${key}": \u2026 })): CREATE and RELATE would otherwise store a partial object that cannot be read back.`
    );
  }
}
function checkModificationMode(currentMode, newMode) {
  if (currentMode && currentMode !== newMode) {
    throw new OrmError(
      `Cannot use ${newMode}() when ${currentMode}() has already been used`
    );
  }
}
function applySet(state, data) {
  checkModificationMode(state._modificationMode, "set");
  state._modificationMode = "set";
  const processedData = processSetOperators(data);
  state._set = { ...state._set, ...processedData };
}
function applyUnset(state, fields) {
  checkModificationMode(state._modificationMode, "set");
  state._modificationMode = "set";
  state._unset = [...state._unset || [], ...fields];
}
function applyContent(state, data) {
  checkModificationMode(state._modificationMode, "content");
  state._modificationMode = "content";
  state._content = data;
}
function applyMerge(state, data) {
  checkModificationMode(state._modificationMode, "merge");
  state._modificationMode = "merge";
  state._merge = data;
}
function applyPatch(state, operations) {
  checkModificationMode(state._modificationMode, "patch");
  state._modificationMode = "patch";
  state._patch = operations;
}
function applyReplace(state, data) {
  checkModificationMode(state._modificationMode, "replace");
  state._modificationMode = "replace";
  state._replace = data;
}
function displaySetUnsetClause(state, ctx) {
  const unset = state._unset ?? [];
  const assignments = state._set ? generateSetAssignments(state._set, ctx) : [];
  if (assignments.length > 0) {
    for (const path of unset) {
      assignments.push(`${escapeIdiomPath(path)} = NONE`);
    }
    return ` SET ${assignments.join(", ")}`;
  }
  if (unset.length > 0) {
    return ` UNSET ${unset.map(escapeIdiomPath).join(", ")}`;
  }
  return "";
}
function displayModificationClause(state, ctx) {
  if (state._content) {
    return (
      /* surql */
      ` CONTENT ${renderData(state._content, ctx)}`
    );
  }
  if (state._merge) {
    return (
      /* surql */
      ` MERGE ${renderData(state._merge, ctx)}`
    );
  }
  if (state._patch) {
    return (
      /* surql */
      ` PATCH ${ctx.var(state._patch)}`
    );
  }
  if (state._replace) {
    return (
      /* surql */
      ` REPLACE ${ctx.var(state._replace)}`
    );
  }
  if (state._set || state._unset) {
    return displaySetUnsetClause(state, ctx);
  }
  return "";
}

// src/query/validate-input.ts
function computedFieldsOf(orm2, tb) {
  const schema = orm2.tables[tb];
  return schema?.computedFields ?? [];
}
function implicitFieldsOf(orm2, tb) {
  const schema = orm2.tables[tb];
  return "from" in schema ? ["id", "in", "out"] : ["id"];
}
var isPlainRecord = (value) => {
  if (typeof value !== "object" || value === null) return false;
  if (value instanceof SurqlExpression || isWorkable(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};
function writtenFields(state) {
  const written = /* @__PURE__ */ new Set();
  const mode = state._modificationMode;
  if (mode === "set" || mode === "merge") {
    const data = mode === "set" ? state._set : state._merge;
    if (data === void 0) return written;
    if (!isPlainRecord(data)) return void 0;
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0) written.add(key.split(".")[0]);
    }
  }
  for (const key of state._unset ?? []) {
    written.delete(key.split(".")[0]);
  }
  return written;
}
function validateWrite(orm2, tb, schema, state, kind) {
  if (!(schema instanceof ObjectType)) return;
  const computed = computedFieldsOf(orm2, tb);
  const implicit = implicitFieldsOf(orm2, tb);
  const fills = kind === "create";
  const issues = [];
  if (state._content !== void 0) {
    issues.push(
      ...checkRecord(schema, state._content, {
        mode: "create",
        implicit,
        computed,
        fills
      })
    );
  }
  if (state._replace !== void 0) {
    issues.push(
      ...checkRecord(schema, state._replace, {
        mode: "create",
        implicit,
        computed,
        fills: false
      })
    );
  }
  if (state._merge !== void 0)
    issues.push(
      ...checkRecord(schema, state._merge, { mode: "update", computed })
    );
  if (state._set !== void 0)
    issues.push(...checkSet(schema, state._set, computed));
  const wholeRecord = state._content !== void 0 || state._replace !== void 0;
  const newRecord = kind !== "update";
  if (newRecord && !wholeRecord && state._modificationMode !== "patch") {
    const written = writtenFields(state);
    if (written !== void 0)
      issues.push(
        ...checkRequired(schema, written, { implicit, computed, fills })
      );
  }
  throwIfInvalid(issues, tb);
}

// src/query/create.ts
var CreateQuery = class extends Query {
  constructor(orm2, tb, id) {
    super();
    this.tb = tb;
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._lenient = true;
    this._id = id;
  }
  [__ctx];
  _only = false;
  _set;
  _content;
  _merge;
  _patch;
  _replace;
  _modificationMode;
  _return;
  _timeout;
  _id;
  get schema() {
    return this[__ctx].orm.tables[this.tb].schema;
  }
  get [__type]() {
    const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
    return this._only ? schema : t_exports.array(schema);
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  /**
   * Set fields. Fields that are not set are absent from the result, so the
   * result only types the fields that are known to be there.
   */
  set(data) {
    assertDottedRootsSupplied(data);
    return this.derive((next) => {
      applySet(next, data);
    });
  }
  content(data) {
    return this.derive((next) => {
      applyContent(next, data);
      next._lenient = false;
    });
  }
  /** Merge fields into the record. Fields that are not merged are absent from the result. */
  merge(data) {
    return this.derive((next) => {
      applyMerge(next, data);
    });
  }
  patch(operations) {
    return this.derive((next) => {
      applyPatch(next, operations);
    });
  }
  /** Replace the record. REPLACE does not apply defaults, so only the given fields are known. */
  replace(data) {
    return this.derive((next) => {
      applyReplace(next, data);
    });
  }
  return(value) {
    if (typeof value === "function") {
      const record = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$this" : "$parent";
        }
      });
      const inheritable = value(record);
      const workable = inheritableIntoWorkable(inheritable);
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  validateInput() {
    validateWrite(this[__ctx].orm, this.tb, this.schema, this, "create");
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    let target;
    if (this._id !== void 0) {
      const recordId = new RecordId(this.tb, this._id);
      target = ctx.var(recordId);
    } else {
      target = ctx.var(new Table(this.tb));
    }
    let query = (
      /* surql */
      `CREATE ${this._only ? "ONLY " : ""}${target}`
    );
    query += displayModificationClause(
      withDefaults(this, schemaDefaults(this.schema)),
      ctx
    );
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/query/delete.ts
import { Table as Table2 } from "surrealdb";

// src/query/object-filter.ts
var OPERATORS = /* @__PURE__ */ new Set([
  "eq",
  "ne",
  "ex",
  "gt",
  "gte",
  "lt",
  "lte",
  "inside",
  "notInside",
  "contains",
  "containsNot",
  "containsAll",
  "containsAny",
  "containsNone",
  "allInside",
  "anyInside",
  "noneInside",
  "startsWith",
  "endsWith",
  "search"
]);
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function fieldNames(target) {
  const { target: resolved } = resolveAccessType(
    target[__ctx].orm,
    target[__type]
  );
  return new Set(
    resolved instanceof ObjectType ? Object.keys(resolved.schema) : []
  );
}
function combine(ctx, kind, conditions) {
  if (conditions.length === 0) return void 0;
  if (conditions.length === 1) return conditions[0];
  return joiningFilter(ctx, kind, ...conditions);
}
function asObjectArray(key, value) {
  if (!Array.isArray(value) || !value.every(isPlainObject2)) {
    throw new OrmError(
      `"${key}" in a where object must be an array of filter objects`
    );
  }
  return value;
}
function fieldOf(target, key) {
  const field = target[key];
  return typeof field === "function" ? field.valueOf() : field;
}
function callOperator(field, op, value) {
  const fn = field[op];
  if (typeof fn !== "function") {
    throw new OrmError(
      `Operator "${op}" is not supported on a ${field[__type].name} field`
    );
  }
  return fn(value);
}
function conditionsOf(target, input, isField) {
  const names = fieldNames(target);
  const out = [];
  for (const [key, value] of Object.entries(input)) {
    if (value === void 0) continue;
    let condition;
    if (names.has(key)) {
      condition = fieldConditions(fieldOf(target, key), value);
    } else if (key === "and" || key === "or" || key === "not") {
      condition = combinatorCondition(target, key, value, isField);
    } else if (isField && OPERATORS.has(key)) {
      condition = callOperator(target, key, value);
    } else {
      throw new OrmError(`Unknown field "${key}" in where object`);
    }
    if (Array.isArray(condition)) out.push(...condition);
    else if (condition) out.push(condition);
  }
  return out;
}
function fieldConditions(field, value) {
  if (isWorkable(value) || !isPlainObject2(value)) {
    return [callOperator(field, "eq", value)];
  }
  return conditionsOf(field, value, true);
}
function combinatorCondition(target, key, value, isField) {
  const ctx = target[__ctx];
  const group = (kind, items) => combine(
    ctx,
    kind,
    items.map((o) => combine(ctx, "AND", conditionsOf(target, o, isField))).filter((g) => g !== void 0)
  );
  if (key !== "not") {
    return group(key === "and" ? "AND" : "OR", asObjectArray(key, value));
  }
  if (!isPlainObject2(value)) {
    throw new OrmError(`"not" in a where object must be a filter object`);
  }
  const inner = group("AND", [value]);
  return inner ? prefixedFilter(ctx, "!", joiningFilter(ctx, "AND", inner)) : void 0;
}
function whereFromObject(row, input) {
  if (!isPlainObject2(input)) {
    throw new OrmError("where() expects a callback or a filter object");
  }
  return combine(row[__ctx], "AND", conditionsOf(row, input, false));
}
function orderFromObject(row, input, prefix = []) {
  if (!isPlainObject2(input)) {
    throw new OrmError("orderBy() expects a field, a callback or an object");
  }
  const names = fieldNames(row);
  const out = [];
  for (const [key, value] of Object.entries(input)) {
    if (value === void 0) continue;
    if (!names.has(key)) {
      throw new OrmError(`Unknown field "${key}" in orderBy object`);
    }
    const path = [...prefix, key];
    if (typeof value === "string") {
      const direction = value.toUpperCase();
      if (direction !== "ASC" && direction !== "DESC") {
        throw new OrmError(
          `Invalid sort direction "${value}" for "${path.join(".")}"; expected "asc" or "desc"`
        );
      }
      out.push({ field: path.join("."), direction });
    } else if (isPlainObject2(value)) {
      const field = fieldOf(row, key);
      out.push(...orderFromObject(field, value, path));
    } else {
      throw new OrmError(
        `Invalid sort direction for "${path.join(".")}"; expected "asc", "desc" or a nested object`
      );
    }
  }
  return out;
}

// src/query/delete.ts
var DeleteQuery = class extends Query {
  [__ctx];
  _only = false;
  _filter;
  _return;
  _timeout;
  tb;
  subject;
  constructor(orm2, subject) {
    super();
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._lenient = true;
    this.subject = subject;
    if (typeof subject === "string") {
      this.tb = subject;
    } else if (isWorkable(subject)) {
      this.tb = subject[__type].tb;
    } else {
      this.tb = String(subject.table);
    }
  }
  get schema() {
    return resolveSubjectSchema(this[__ctx].orm, this.tb);
  }
  get [__type]() {
    let type;
    if (this._return === void 0 || this._return === "none") {
      type = this._only ? t_exports.option(t_exports.never()) : t_exports.array(t_exports.never());
    } else if (this._return === "after") {
      const element = t_exports.option(t_exports.never());
      type = this._only ? element : t_exports.array(element);
    } else {
      const schema = typeof this._return !== "string" ? this._return[__type] : this.schema;
      type = this._only ? schema : t_exports.array(schema);
    }
    return type;
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  where(input) {
    const tb = actionable({
      [__ctx]: this[__ctx],
      [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
      [__display]: ({ contextId }) => {
        return contextId === this[__ctx].id ? "$this" : "$parent";
      }
    });
    const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
    if (!condition) return this;
    const filter = sanitizeWorkable(condition);
    return this.derive((next) => {
      next._filter = andWhere(next._filter, filter);
    });
  }
  /** Remove every `.where()` condition set so far. */
  clearWhere() {
    return this.derive((next) => {
      next._filter = void 0;
    });
  }
  return(value) {
    if (typeof value === "function") {
      const tb = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$before" : "$parent";
        }
      });
      const predicable = value(tb);
      const workable = inheritableIntoWorkable(
        predicable
      );
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const thing = typeof this.subject === "string" ? ctx.var(new Table2(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
    let query = (
      /* surql */
      `DELETE ${this._only ? "ONLY " : ""}${thing}`
    );
    if (this._filter)
      query += /* surql */
      ` WHERE ${this._filter[__display](ctx)}`;
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/query/insert.ts
import { escapeIdent as escapeIdent2, Table as Table3 } from "surrealdb";
var InsertQuery = class extends Query {
  constructor(orm2, tb, data) {
    super();
    this.tb = tb;
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._data = data;
  }
  [__ctx];
  _data;
  _fields;
  _values;
  _ignore;
  _onDuplicate;
  _return;
  _timeout;
  get schema() {
    return this[__ctx].orm.tables[this.tb].schema;
  }
  get [__type]() {
    if (this._return && typeof this._return !== "string") {
      return t_exports.array(this._return[__type]);
    }
    return t_exports.array(this.schema);
  }
  /**
   * Specify the fields for a `VALUES`-style insert.
   *
   * @param fields - Column names to insert into.
   * @throws {OrmError} If the query was constructed with inline data.
   */
  fields(fields) {
    if (this._data) {
      throw new OrmError("Cannot use fields() with object-style insert");
    }
    const fields_ = fields;
    return this.derive((next) => {
      next._fields = fields_;
    });
  }
  /**
   * Provide value rows for a `VALUES`-style insert.
   *
   * @param rows - One or more arrays of values matching the field order.
   * @throws {OrmError} If the query was constructed with inline data.
   * @throws {OrmError} If {@link fields} has not been called first.
   * @throws {OrmError} If any row length does not match the field count.
   */
  values(...rows) {
    if (this._data) {
      throw new OrmError("Cannot use values() with object-style insert");
    }
    if (!this._fields) {
      throw new OrmError("Must call fields() before values()");
    }
    for (const row of rows) {
      if (row.length !== this._fields.length) {
        throw new OrmError(
          `Value row length (${row.length}) does not match fields length (${this._fields.length})`
        );
      }
    }
    return this.derive((next) => {
      next._values = [...next._values ?? [], ...rows];
    });
  }
  /**
   * Add an `IGNORE` clause so duplicate records are silently skipped.
   *
   * @throws {OrmError} If {@link onDuplicate} has already been called.
   */
  ignore() {
    if (this._onDuplicate) {
      throw new OrmError("Cannot use both ignore() and onDuplicate()");
    }
    return this.derive((next) => {
      next._ignore = true;
    });
  }
  /**
   * Add an `ON DUPLICATE KEY UPDATE` clause.
   *
   * A row that conflicts is updated, not inserted, so the rows returned may be
   * records the update did not fully write. Only the id is typed as present.
   *
   * @param updates - Fields and values to update on conflict.
   * @throws {OrmError} If {@link ignore} has already been called.
   */
  onDuplicate(updates) {
    if (this._ignore) {
      throw new OrmError("Cannot use both ignore() and onDuplicate()");
    }
    const processedData = processSetOperators(
      updates
    );
    return this.derive((next) => {
      next._onDuplicate = processedData;
      next._lenient = true;
    });
  }
  return(value) {
    if (typeof value === "function") {
      const tb = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$this" : "$parent";
        }
      });
      const predicable = value(tb);
      const workable = inheritableIntoWorkable(
        predicable
      );
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  validateInput() {
    const schema = this.schema;
    if (!(schema instanceof ObjectType)) return;
    const orm2 = this[__ctx].orm;
    const options = {
      mode: "create",
      implicit: implicitFieldsOf(orm2, this.tb),
      computed: computedFieldsOf(orm2, this.tb)
    };
    const issues = [];
    if (this._data !== void 0) {
      if (Array.isArray(this._data)) {
        this._data.forEach((row, i) => {
          issues.push(...checkRecord(schema, row, options, `[${i}]`));
        });
      } else {
        issues.push(...checkRecord(schema, this._data, options));
      }
    } else if (this._fields && this._values) {
      const fields = this._fields;
      this._values.forEach((values, i) => {
        const row = Object.fromEntries(fields.map((f, j) => [f, values[j]]));
        issues.push(...checkRecord(schema, row, options, `[${i}]`));
      });
    }
    if (this._onDuplicate) {
      issues.push(...checkSet(schema, this._onDuplicate, options.computed));
    }
    throwIfInvalid(issues, this.tb);
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const table2 = ctx.var(new Table3(this.tb));
    let query = (
      /* surql */
      "INSERT"
    );
    if (this._ignore) query += /* surql */
    " IGNORE";
    query += /* surql */
    ` INTO ${table2}`;
    const defaults = schemaDefaults(this.schema);
    if (this._data) {
      query += /* surql */
      ` ${renderData(fillData(this._data, defaults), ctx)}`;
    } else if (this._fields && this._values) {
      const filled = fillValues(this._fields, this._values, defaults);
      query += /* surql */
      ` (${filled.fields.map(escapeIdent2).join(", ")})`;
      const valueGroups = filled.rows.map(
        (row) => `(${row.map((v) => renderValue(v, ctx)).join(", ")})`
      );
      query += /* surql */
      ` VALUES ${valueGroups.join(", ")}`;
    }
    if (this._onDuplicate) {
      const assignments = generateSetAssignments(this._onDuplicate, ctx);
      query += /* surql */
      ` ON DUPLICATE KEY UPDATE ${assignments.join(", ")}`;
    }
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/query/live.ts
import {
  LiveSubscriptionError,
  Table as Table5
} from "surrealdb";

// src/query/select.ts
import { escapeIdent as escapeIdent3, Table as Table4 } from "surrealdb";
function chainWhereInput(previous, input) {
  if (previous === void 0) return input;
  if (typeof previous === "function") return previous;
  if (typeof input === "function") return input;
  return { and: [previous, input] };
}
function splitSchema(schema, fields) {
  if (!(schema instanceof ObjectType) || fields.length === 0) return schema;
  const resolved = { ...schema.schema };
  for (const field of fields) {
    const type = resolved[field];
    if (type instanceof ArrayType && !Array.isArray(type.schema)) {
      resolved[field] = type.schema;
    }
  }
  return schema instanceof ModelType ? new ModelType(resolved, schema.model) : new ObjectType(resolved);
}
var SelectQuery = class extends Query {
  [__ctx];
  _only = false;
  _start;
  _limit;
  _filter;
  _whereInput;
  _entry;
  /** The fields of an object `.return()` projection, when it is one. */
  _entryFields;
  _orderBy;
  _groupBy;
  _split;
  _fetch;
  _fetchResolvedType;
  _timeout;
  tb;
  subject;
  constructor(orm2, subject) {
    super();
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this.subject = subject;
    if (typeof subject === "string") {
      this.tb = subject;
    } else if (Array.isArray(subject)) {
      this.tb = subject;
    } else if (isWorkable(subject)) {
      this.tb = subject[__type].tb;
    } else {
      this.tb = String(subject.table);
    }
  }
  get entry() {
    if (this._entry) return this._entry[__type];
    const base = this._fetchResolvedType ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
    return splitSchema(base, this._split ?? []);
  }
  get [__type]() {
    return this._only ? this.entry : t_exports.array(this.entry);
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  /**
   * Build the row actionable handed to `.return()` / `.where()` / `.orderBy()`
   * callbacks: it renders as `$this` (or `$parent` when nested) and carries the
   * row's id, so traversal verbs called directly on it root at `<row>.id`.
   */
  rowActionable(type) {
    const base = actionable({
      [__ctx]: this[__ctx],
      [__type]: type,
      [__display]: (ctx) => {
        if (ctx.contextId !== this[__ctx].id) return "$parent";
        return ctx.bareRowsOf === this[__ctx].id ? "" : "$this";
      }
    });
    return traversableRow(
      base,
      resolveSubjectSchema(this[__ctx].orm, this.tb).schema
    );
  }
  return(cb) {
    const tb = this.rowActionable(this.entry);
    const predicable = cb(tb);
    const workable = inheritableIntoWorkable(
      predicable
    );
    const entry = sanitizeWorkable(workable);
    const fields = workable[__fields];
    const entryFields = fields ? Object.entries(fields) : void 0;
    return this.derive((next) => {
      const select = next;
      select._entry = entry;
      select._entryFields = entryFields;
    });
  }
  where(input) {
    const tb = this.rowActionable(
      resolveSubjectSchema(this[__ctx].orm, this.tb)
    );
    const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
    if (!condition) return this;
    const filter = sanitizeWorkable(condition);
    return this.derive((next) => {
      next._filter = andWhere(next._filter, filter);
      next._whereInput = chainWhereInput(next._whereInput, input);
    });
  }
  /** Remove every `.where()` condition set so far. */
  clearWhere() {
    return this.derive((next) => {
      next._filter = void 0;
      next._whereInput = void 0;
    });
  }
  /**
   * What a client needs to check a row against this query without asking the
   * database, or `undefined` when the query is more than a filter over a
   * table: a callback filter (a SurrealQL expression), a projection, `FETCH`,
   * `LIMIT`, `START`, `GROUP`, `SPLIT`, `.only()`, or several tables.
   *
   * - `where` is the object passed to `.where()`, if there is one.
   * - `ordered` tells that the rows come in an order the client does not
   *   reproduce, so a row it adds would be in the wrong place.
   */
  clientFilter() {
    const plain = typeof this.tb === "string" && typeof this.subject === "string" && !this._only && this._entry === void 0 && this._start === void 0 && this._limit === void 0 && this._groupBy === void 0 && this._split === void 0 && this._fetch === void 0;
    if (!plain) return void 0;
    const input = this._whereInput;
    if (typeof input === "function") return void 0;
    return {
      where: input,
      ordered: this._orderBy !== void 0
    };
  }
  start(start) {
    return this.derive((next) => {
      next._start = start;
    });
  }
  limit(limit) {
    return this.derive((next) => {
      next._limit = limit;
    });
  }
  _addOrderBy(field, direction, opts) {
    let entry;
    if (typeof field === "string") {
      entry = { field, direction, ...opts };
    } else {
      const workable = field(
        this.rowActionable(this.entry)
      );
      entry = {
        field: sanitizeWorkable(workable),
        direction,
        ...opts,
        hoist: !isFieldPath(workable)
      };
    }
    return this.derive((next) => {
      next._orderBy = [...next._orderBy ?? [], entry];
    });
  }
  orderBy(field, direction) {
    if (typeof field === "object" && field !== null) {
      const specs = orderFromObject(
        this.rowActionable(this.entry),
        field
      );
      return this.derive((next) => {
        next._orderBy = [...next._orderBy ?? [], ...specs];
      });
    }
    return this._addOrderBy(field, direction);
  }
  orderByNumeric(field, direction) {
    return this._addOrderBy(field, direction, { numeric: true });
  }
  orderByCollate(field, direction) {
    return this._addOrderBy(field, direction, { collate: true });
  }
  /**
   * Group rows by the given fields. A grouped query must have a `.return()`
   * projection that selects each of them, and its aggregates, as in
   * `db.select("post").groupBy("author").return((p) => ({ author: p.author, posts: count(p) }))`.
   * It cannot be combined with {@link split}.
   */
  groupBy(...fields) {
    if (fields.length === 0) {
      throw new OrmError("groupBy() needs at least one field");
    }
    this.assertNotSplit("groupBy");
    return this.derive((next) => {
      next._groupBy = fields;
    });
  }
  /**
   * Group all rows into one, for table-wide aggregates. Needs a `.return()`
   * projection of aggregates, such as `count(u)` or `math.mean(u.age)`.
   */
  groupAll() {
    this.assertNotSplit("groupAll");
    return this.derive((next) => {
      next._groupBy = "ALL";
    });
  }
  /**
   * Emit one row per element of the given array fields. SurrealDB does not allow
   * SPLIT and GROUP BY in the same query, so this cannot be combined with
   * {@link groupBy} or {@link groupAll}. Call it before {@link return}.
   */
  split(...fields) {
    if (this._groupBy !== void 0) {
      throw new OrmError(
        "split() cannot be combined with groupBy() or groupAll(): SurrealDB does not allow SPLIT and GROUP in one query"
      );
    }
    if (this._entry) {
      throw new OrmError(
        "split() must come before return(): the projection was typed before the split"
      );
    }
    return this.derive((next) => {
      next._split = fields;
    });
  }
  assertNotSplit(method) {
    if (this._split && this._split.length > 0) {
      throw new OrmError(
        `${method}() cannot be combined with split(): SurrealDB does not allow SPLIT and GROUP in one query`
      );
    }
  }
  fetch(...fields) {
    const currentSchema = this._entry?.[__type] ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
    const resolved = currentSchema instanceof ObjectType ? resolveFetchObject(currentSchema, fields, this[__ctx].orm) : void 0;
    return this.derive((next) => {
      next._fetch = fields;
      if (resolved) next._fetchResolvedType = resolved;
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  displaySubject(ctx) {
    if (typeof this.subject === "string")
      return ctx.var(new Table4(this.subject));
    if (Array.isArray(this.subject))
      return this.subject.map((name) => ctx.var(new Table4(name))).join(", ");
    if (isWorkable(this.subject)) return this.subject[__display](ctx);
    return ctx.var(this.subject);
  }
  /**
   * The ORDER BY clause. SurrealQL only sorts by field idioms, so an expression
   * term orders by an alias instead, and its SurrealQL is collected into
   * `hoisted` for the projection to compute under that alias.
   */
  displayOrderBy(ctx, hoisted) {
    if (!this._orderBy || this._orderBy.length === 0) return "";
    const orderParts = this._orderBy.map((spec) => {
      let part;
      if (typeof spec.field === "string") {
        part = escapeIdiomPath(spec.field);
      } else if (spec.hoist) {
        const alias = `__order_${hoisted.length}`;
        hoisted.push({ alias, sql: spec.field[__display](ctx) });
        part = alias;
      } else {
        part = spec.field[__display]({
          ...ctx,
          bareRowsOf: this[__ctx].id
        });
      }
      if (spec.collate) part += " COLLATE";
      if (spec.numeric) part += " NUMERIC";
      if (spec.direction) part += ` ${spec.direction}`;
      return part;
    });
    return (
      /* surql */
      ` ORDER BY ${orderParts.join(", ")}`
    );
  }
  /**
   * The projection after `SELECT`. An expression sort is computed beside `*`
   * under its alias and dropped again with OMIT, so it cannot be combined with a
   * return() projection (a VALUE projection has no OMIT to drop the alias from) or
   * with a grouped query (SurrealDB needs the sort key to be a selected field).
   *
   * A grouped or split query has to name its keys as selected fields, which an
   * object `VALUE { … }` cannot do, so its object projection is a field list
   * (`email AS writer, count(true) AS posts`). SurrealDB rejects a grouped query
   * with no projection, and one that does not select each of its keys, so both
   * are reported here as an {@link OrmError}.
   */
  displayProjection(ctx, bare, hoisted) {
    this.assertHoistedSortAllowed(hoisted);
    if (!this._entry) return this.displayUnprojected(hoisted);
    const fields = this._entryFields;
    if (!bare) return (
      /* surql */
      `VALUE ${this._entry[__display](ctx)}`
    );
    const exprs = fields ? fields.map(([, field]) => field[__display](ctx)) : [this._entry[__display](ctx)];
    const keys = this._groupBy === "ALL" ? [] : this._groupBy ?? this._split ?? [];
    const kind = this._groupBy !== void 0 ? "groupBy" : "split";
    for (const key of keys) {
      if (!exprs.includes(escapeIdiomPath(key))) {
        throw new OrmError(
          `${kind}("${key}") needs the return() projection to select "${key}" as a field`
        );
      }
    }
    if (!fields) return (
      /* surql */
      `VALUE ${exprs[0]}`
    );
    return fields.map(([alias], i) => `${exprs[i]} AS ${escapeIdent3(alias)}`).join(", ");
  }
  /** An expression sort is hoisted into a `*` projection, so it cannot be combined with a return() or a grouped query. */
  assertHoistedSortAllowed(hoisted) {
    if (hoisted.length === 0) return;
    if (this._groupBy !== void 0) {
      throw new OrmError(
        "orderBy() with an expression cannot be combined with groupBy() or groupAll(): the sort key must be a selected field. Sort by a field, or by a name the return() projection selects."
      );
    }
    if (this._entry) {
      throw new OrmError(
        "orderBy() with an expression cannot be combined with return(): the sort key would be returned with each row. Sort by a field, or return the value and sort in your code."
      );
    }
  }
  /** The projection of a query with no return(): `*`, with any hoisted sort keys beside it. */
  displayUnprojected(hoisted) {
    if (this._groupBy !== void 0) {
      throw new OrmError(
        "groupBy() and groupAll() need a return() projection of aggregates: SurrealDB cannot group SELECT *"
      );
    }
    if (hoisted.length === 0) return "*";
    const sorts = hoisted.map((h) => `${h.sql} AS ${h.alias}`).join(", ");
    const aliases = hoisted.map((h) => h.alias).join(", ");
    return `*, ${sorts} OMIT ${aliases}`;
  }
  /** The SPLIT and GROUP clauses, which come after WHERE and before ORDER BY. */
  displayGrouping() {
    let clauses = "";
    if (this._split && this._split.length > 0)
      clauses += /* surql */
      ` SPLIT ${this._split.map(escapeIdiomPath).join(", ")}`;
    if (this._groupBy) {
      clauses += this._groupBy === "ALL" ? " GROUP ALL" : (
        /* surql */
        ` GROUP BY ${this._groupBy.map(escapeIdiomPath).join(", ")}`
      );
    }
    return clauses;
  }
  [__display](inp) {
    const grouped = this._groupBy !== void 0;
    const split = this._split !== void 0 && this._split.length > 0;
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id,
      bareRowsOf: grouped || split ? this[__ctx].id : void 0
    });
    const thing = this.displaySubject(ctx);
    const start = this._start !== void 0 ? ctx.var(this._start) : void 0;
    const limit = this._limit !== void 0 ? ctx.var(this._limit) : void 0;
    const hoisted = [];
    const orderBy = this.displayOrderBy(ctx, hoisted);
    const predicates = this.displayProjection(ctx, grouped || split, hoisted);
    let query = (
      /* surql */
      `SELECT ${predicates} FROM ${this._only ? "ONLY " : ""}${thing}`
    );
    if (this._filter)
      query += /* surql */
      ` WHERE ${this._filter[__display](ctx)}`;
    query += this.displayGrouping();
    query += orderBy;
    if (limit) query += /* surql */
    ` LIMIT ${limit}`;
    if (start) query += /* surql */
    ` START ${start}`;
    if (this._fetch && this._fetch.length > 0)
      query += /* surql */
      ` FETCH ${this._fetch.map(escapeIdiomPath).join(", ")}`;
    if (this._timeout)
      query += /* surql */
      ` TIMEOUT <duration> ${ctx.var(this._timeout)}`;
    return `(${query})`;
  }
};
function resolveFetchObject(schema, paths, orm2) {
  const tailsByHead = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const dot = path.indexOf(".");
    const head = dot === -1 ? path : path.slice(0, dot);
    const tail = dot === -1 ? void 0 : path.slice(dot + 1);
    const tails = tailsByHead.get(head) ?? [];
    if (tail !== void 0) tails.push(tail);
    tailsByHead.set(head, tails);
  }
  const resolved = { ...schema.schema };
  for (const [head, tails] of tailsByHead) {
    const fieldType = resolved[head];
    if (fieldType) resolved[head] = resolveFetchField(fieldType, tails, orm2);
  }
  return schema instanceof ModelType ? new ModelType(resolved, schema.model) : new ObjectType(resolved);
}
function resolveFetchField(fieldType, tails, orm2) {
  if (fieldType instanceof RecordType) {
    return resolveFetchRecord(fieldType, tails, orm2);
  }
  if (fieldType instanceof UnionType) {
    return new UnionType(
      fieldType.schema.map(
        (member) => resolveFetchField(member, tails, orm2)
      )
    );
  }
  if (fieldType instanceof OptionType) {
    return new OptionType(resolveFetchField(fieldType.schema, tails, orm2));
  }
  if (fieldType instanceof ArrayType) {
    return resolveFetchArray(fieldType, tails, orm2);
  }
  if (fieldType instanceof ObjectType && tails.length > 0) {
    return resolveFetchObject(fieldType, tails, orm2);
  }
  return fieldType;
}
function resolveFetchRecord(fieldType, tails, orm2) {
  const tb = fieldType.tb;
  if (typeof tb === "string") {
    return resolveFetchTable(tb, tails, orm2);
  }
  if (!Array.isArray(tb)) return fieldType;
  return new UnionType(tb.map((table2) => resolveFetchTable(table2, tails, orm2)));
}
function resolveFetchTable(tb, tails, orm2) {
  const target = orm2.tables[tb];
  if (!target) return new ObjectType({ id: new RecordType(tb) });
  return tails.length === 0 ? target.schema : resolveFetchObject(target.schema, tails, orm2);
}
function resolveFetchArray(fieldType, tails, orm2) {
  if (Array.isArray(fieldType.schema)) return fieldType;
  return new ArrayType(resolveFetchField(fieldType.schema, tails, orm2));
}

// src/query/live.ts
var SEARCH_OPERATOR = /@\d*(?:,?(?:AND|OR))?@|<\|/;
var QUOTED = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|⟨[^⟩]*⟩/g;
function refuseSearchPredicate(condition, contextId) {
  const sql = condition[__display](displayContext({ contextId }));
  if (!SEARCH_OPERATOR.test(sql.replace(QUOTED, ""))) return;
  throw new OrmError(
    "A live query cannot filter by a full-text match or a KNN predicate, anywhere in the filter. SurrealDB accepts one, but at the top of the filter, alone or inside and(), or() and not(), it never causes a notification. Inside a subquery it did deliver on 3.2.3, but that is untested on other versions, so it is refused there too. Filter by a plain condition, or use select() and refetch when the table changes."
  );
}
var LiveSubscription = class {
  constructor(inner, mapValue) {
    this.inner = inner;
    this.mapValue = mapValue;
  }
  /**
   * The id of the underlying live subscription. A managed subscription is
   * re-registered when the connection is re-established, which changes its id.
   */
  get id() {
    return this.inner.id;
  }
  /**
   * Whether the subscription is still delivering notifications. It turns
   * `false` once the subscription is killed (by {@link kill}, by the server, or
   * by an aborted request scope) or its session goes away.
   */
  get isAlive() {
    return this.inner.isAlive;
  }
  /**
   * Whether the SDK re-registers this subscription after the connection drops
   * and reconnects. An unmanaged subscription ends silently instead.
   */
  get isManaged() {
    return this.inner.isManaged;
  }
  /**
   * Subscribe to notifications. Returns a function that unsubscribes this
   * handler (it does not kill the subscription — use {@link kill} for that).
   */
  subscribe(handler) {
    if (!this.inner.isAlive) return () => {
    };
    const messages = this[Symbol.asyncIterator]();
    let stopped = false;
    (async () => {
      for await (const message of { [Symbol.asyncIterator]: () => messages }) {
        if (stopped) return;
        handler(message);
      }
    })().catch((error) => {
      if (stopped || !this.inner.isAlive) return;
      queueMicrotask(() => {
        throw error;
      });
    });
    return () => {
      stopped = true;
      messages.return?.(void 0)?.catch(() => {
      });
    };
  }
  /** Async-iterate notifications: `for await (const msg of sub) { … }`. */
  async *[Symbol.asyncIterator]() {
    if (!this.inner.isAlive) return;
    for await (const message of this.inner) {
      yield this.toMessage(message);
    }
  }
  /** Map an SDK notification onto a {@link LiveMessage}, parsing its value. */
  toMessage(message) {
    if (message.action === "KILLED") return { action: "KILLED" };
    return {
      action: message.action,
      recordId: message.recordId,
      value: this.mapValue(message.value)
    };
  }
  /** Kill the live subscription and stop receiving updates. */
  kill() {
    return this.inner.kill();
  }
};
var LiveQuery = class {
  [__ctx];
  _filter;
  _entry;
  _fetch;
  _fetchResolvedType;
  _diff = false;
  tb;
  subject;
  constructor(orm2, subject) {
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this.subject = subject;
    if (typeof subject === "string") {
      this.tb = subject;
    } else if (isWorkable(subject)) {
      this.tb = subject[__type].tb;
    } else {
      this.tb = String(subject.table);
    }
  }
  get entry() {
    return this._entry?.[__type] ?? this._fetchResolvedType ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
  }
  get [__type]() {
    return this.entry;
  }
  /** Create a shallow clone of this live query. */
  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
  /**
   * Return a shallow {@link clone} with `mutate` applied. Mirrors
   * `Query.derive`: chaining methods derive a new builder instead of mutating
   * `this`, so a base live query can be safely reused. Mutations must replace
   * mutable fields wholesale rather than mutating them in place.
   */
  derive(mutate) {
    const next = this.clone();
    mutate(next);
    return next;
  }
  return(cb) {
    const tb = actionable({
      [__ctx]: this[__ctx],
      [__type]: this.entry,
      [__display]: ({ contextId }) => {
        return contextId === this[__ctx].id ? "$this" : "$parent";
      }
    });
    const predicable = cb(tb);
    const workable = inheritableIntoWorkable(
      predicable
    );
    const entry = sanitizeWorkable(workable);
    return this.derive((next) => {
      next._entry = entry;
    });
  }
  where(input) {
    const tb = actionable({
      [__ctx]: this[__ctx],
      [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
      [__display]: ({ contextId }) => {
        return contextId === this[__ctx].id ? "$this" : "$parent";
      }
    });
    const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
    if (!condition) return this;
    refuseSearchPredicate(condition, this[__ctx].id);
    const filter = sanitizeWorkable(condition);
    return this.derive((next) => {
      next._filter = andWhere(next._filter, filter);
    });
  }
  /** Remove every `.where()` condition set so far. */
  clearWhere() {
    return this.derive((next) => {
      next._filter = void 0;
    });
  }
  fetch(...fields) {
    const currentSchema = this._entry?.[__type] ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
    const resolved = currentSchema instanceof ObjectType ? resolveFetchObject(currentSchema, fields, this[__ctx].orm) : void 0;
    return this.derive((next) => {
      next._fetch = fields;
      if (resolved) next._fetchResolvedType = resolved;
    });
  }
  /**
   * Receive updates as JSON Patch arrays (`LIVE SELECT DIFF`) instead of full
   * records. Mutually exclusive with a `.return()` projection.
   */
  diff() {
    return this.derive((next) => {
      next._diff = true;
    });
  }
  /** Whether the subject is a single record rather than a table. */
  get isRecordSubject() {
    return typeof this.subject !== "string";
  }
  /**
   * The table a live query reads. SurrealDB rejects `LIVE SELECT ... FROM
   * user:n1` ("Cannot execute LIVE statement using value"), so a record subject
   * selects its table and is filtered by id instead (see {@link recordFilter}).
   */
  displaySubject(ctx) {
    if (typeof this.subject === "string")
      return ctx.var(new Table5(this.subject));
    if (this.isRecordSubject && typeof this.tb === "string")
      return ctx.var(new Table5(this.tb));
    if (isWorkable(this.subject)) return this.subject[__display](ctx);
    return ctx.var(this.subject);
  }
  /** The `id = …` condition that selects a record subject, if there is one. */
  recordFilter(ctx) {
    if (!this.isRecordSubject || typeof this.tb !== "string") return void 0;
    const id = isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
    return `id = ${id}`;
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const thing = this.displaySubject(ctx);
    const recordFilter = this.recordFilter(ctx);
    const projection = this._diff ? "DIFF" : this._entry ? (
      /* surql */
      `VALUE ${this._entry[__display](ctx)}`
    ) : "*";
    let query = (
      /* surql */
      `LIVE SELECT ${projection} FROM ${thing}`
    );
    if (recordFilter && this._filter)
      query += /* surql */
      ` WHERE ${recordFilter} AND (${this._filter[__display](ctx)})`;
    else if (recordFilter) query += /* surql */
    ` WHERE ${recordFilter}`;
    else if (this._filter)
      query += /* surql */
      ` WHERE ${this._filter[__display](ctx)}`;
    if (this._fetch && this._fetch.length > 0)
      query += /* surql */
      ` FETCH ${this._fetch.map(escapeIdiomPath).join(", ")}`;
    return query;
  }
  /** Render the query as a SurrealQL string. */
  toString() {
    const ctx = displayContext();
    return this[__display](ctx);
  }
  /**
   * The table the SDK can subscribe to on our behalf, or `undefined` when this
   * query needs the unmanaged path.
   *
   * The SDK composes a managed `LIVE SELECT` itself, from a table, an optional
   * `WHERE`, `FETCH` and `DIFF`. It cannot carry a `.return()` projection (an
   * arbitrary expression), and its resource is a table: a record id or a
   * subquery as the subject stays on the unmanaged path.
   */
  get managedResource() {
    if (this._entry || typeof this.subject !== "string") return void 0;
    return new Table5(this.subject);
  }
  /** The filter as an SDK expression, which defines its own variables. */
  get managedFilter() {
    const filter = this._filter;
    if (!filter) return void 0;
    const contextId = this[__ctx].id;
    return {
      // Rendering only ever defines variables through `var`.
      toSQL: (ctx) => filter[__display]({ var: ctx.def, variables: {}, contextId })
    };
  }
  /** Register a live query that the SDK keeps alive across reconnects. */
  async registerManaged(resource) {
    let live = this[__ctx].orm.surreal.live(resource);
    const filter = this.managedFilter;
    if (filter) live = live.where(filter);
    if (this._fetch && this._fetch.length > 0) {
      live = live.fetch(...this._fetch.map(escapeIdiomPath));
    }
    if (this._diff) live = live.diff();
    try {
      return await live;
    } catch (error) {
      if (error instanceof LiveSubscriptionError && error.cause !== void 0) {
        throw error.cause;
      }
      throw error;
    }
  }
  /** Register the live query by hand and attach to it, without a restart. */
  async registerUnmanaged() {
    const ctx = displayContext();
    const query = this[__display](ctx);
    const { surreal } = this[__ctx].orm;
    const [uuid] = await surreal.query(query, ctx.variables);
    return surreal.liveOf(uuid);
  }
  /** Start the live query and resolve to a typed {@link LiveSubscription}. */
  async execute() {
    const resource = this.managedResource;
    const { surreal } = this[__ctx].orm;
    const inner = await withSdkDiagnosis(
      surreal,
      () => resource ? this.registerManaged(resource) : this.registerUnmanaged()
    );
    const type = this.entry;
    const diff = this._diff;
    const mapValue = (raw) => {
      if (diff) return raw;
      return type.parse(raw);
    };
    return new LiveSubscription(inner, mapValue);
  }
  /**
   * Start the live query and subscribe `handler` in one step. Returns a stop
   * function that unsubscribes the handler and kills the subscription.
   */
  subscribe(handler) {
    return this.execute().then((sub) => {
      const off = sub.subscribe(handler);
      return () => {
        off();
        sub.kill().catch(() => {
        });
      };
    });
  }
  // biome-ignore lint/suspicious/noThenProperty: makes the builder awaitable
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.execute().catch(onRejected);
  }
  finally(onFinally) {
    return this.execute().finally(onFinally);
  }
};

// src/query/relate.ts
import { Table as Table6 } from "surrealdb";
var RelateQuery = class extends Query {
  constructor(orm2, edge, from, to) {
    super();
    this.edge = edge;
    this.from = from;
    this.to = to;
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._lenient = true;
  }
  [__ctx];
  _only = false;
  _set;
  _content;
  _merge;
  _patch;
  _replace;
  _modificationMode;
  _return;
  _timeout;
  get schema() {
    return this[__ctx].orm.tables[this.edge].schema;
  }
  get [__type]() {
    let type;
    if (this._return === "none") {
      type = this._only ? t_exports.option(t_exports.never()) : t_exports.array(t_exports.never());
    } else {
      const row = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
      const element = this._return === "before" ? t_exports.option(row) : row;
      type = this._only ? element : t_exports.array(element);
    }
    return type;
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  /** Set fields on the edge. Fields that are not set are absent from the result. */
  set(data) {
    assertDottedRootsSupplied(data);
    return this.derive((next) => {
      applySet(next, data);
    });
  }
  content(data) {
    return this.derive((next) => {
      applyContent(next, data);
      next._lenient = false;
    });
  }
  merge(data) {
    return this.derive((next) => {
      applyMerge(next, data);
    });
  }
  patch(operations) {
    return this.derive((next) => {
      applyPatch(next, operations);
    });
  }
  /** Replace the edge's data. REPLACE does not apply defaults, so only the given fields are known. */
  replace(data) {
    return this.derive((next) => {
      applyReplace(next, data);
    });
  }
  return(value) {
    if (typeof value === "function") {
      const record = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$this" : "$parent";
        }
      });
      const inheritable = value(record);
      const workable = inheritableIntoWorkable(inheritable);
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  validateInput() {
    validateWrite(this[__ctx].orm, this.edge, this.schema, this, "relate");
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const edgeTable = ctx.var(new Table6(this.edge));
    let fromStr;
    if (Array.isArray(this.from)) {
      const fromIds = this.from.map((id) => ctx.var(id));
      fromStr = `[${fromIds.join(", ")}]`;
    } else if (isWorkable(this.from)) {
      fromStr = this.from[__display](ctx);
    } else {
      fromStr = ctx.var(this.from);
    }
    let toStr;
    if (Array.isArray(this.to)) {
      const toIds = this.to.map((id) => ctx.var(id));
      toStr = `[${toIds.join(", ")}]`;
    } else if (isWorkable(this.to)) {
      toStr = this.to[__display](ctx);
    } else {
      toStr = ctx.var(this.to);
    }
    let query = (
      /* surql */
      `RELATE ${this._only ? "ONLY " : ""}${fromStr}->${edgeTable}->${toStr}`
    );
    query += displayModificationClause(
      withDefaults(this, schemaDefaults(this.schema)),
      ctx
    );
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/query/update.ts
import { Table as Table7 } from "surrealdb";
var UpdateQuery = class extends Query {
  [__ctx];
  _only = false;
  _set;
  _unset;
  _content;
  _merge;
  _patch;
  _replace;
  _modificationMode;
  _filter;
  _return;
  _timeout;
  tb;
  subject;
  constructor(orm2, subject) {
    super();
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._lenient = true;
    this.subject = subject;
    if (typeof subject === "string") {
      this.tb = subject;
    } else if (isWorkable(subject)) {
      this.tb = subject[__type].tb;
    } else {
      this.tb = String(subject.table);
    }
  }
  get schema() {
    return resolveSubjectSchema(this[__ctx].orm, this.tb);
  }
  get [__type]() {
    const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
    return this._only ? schema : t_exports.array(schema);
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  /**
   * Set fields. A SET on an existing record leaves its other fields in place,
   * so those are typed as optional in the result.
   */
  set(data) {
    return this.derive((next) => {
      applySet(next, data);
    });
  }
  /** Remove fields from the record. Removed fields are absent from the result. */
  unset(fields) {
    return this.derive((next) => {
      applyUnset(next, [...fields]);
    });
  }
  /** Replace the record with the given fields, so the other fields are gone. */
  content(data) {
    return this.derive((next) => {
      applyContent(next, data);
    });
  }
  merge(data) {
    return this.derive((next) => {
      applyMerge(next, data);
    });
  }
  patch(operations) {
    return this.derive((next) => {
      applyPatch(next, operations);
    });
  }
  /** Replace the record. The other fields of the record are gone. */
  replace(data) {
    return this.derive((next) => {
      applyReplace(next, data);
    });
  }
  where(input) {
    const tb = actionable({
      [__ctx]: this[__ctx],
      [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
      [__display]: ({ contextId }) => {
        return contextId === this[__ctx].id ? "$this" : "$parent";
      }
    });
    const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
    if (!condition) return this;
    const filter = sanitizeWorkable(condition);
    return this.derive((next) => {
      next._filter = andWhere(next._filter, filter);
    });
  }
  /** Remove every `.where()` condition set so far. */
  clearWhere() {
    return this.derive((next) => {
      next._filter = void 0;
    });
  }
  return(value) {
    if (typeof value === "function") {
      const tb = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$this" : "$parent";
        }
      });
      const predicable = value(tb);
      const workable = inheritableIntoWorkable(
        predicable
      );
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  validateInput() {
    validateWrite(
      this[__ctx].orm,
      String(this.tb),
      this.schema,
      this,
      "update"
    );
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const thing = typeof this.subject === "string" ? ctx.var(new Table7(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
    let query = (
      /* surql */
      `UPDATE ${this._only ? "ONLY " : ""}${thing}`
    );
    query += displayModificationClause(this, ctx);
    if (this._filter)
      query += /* surql */
      ` WHERE ${this._filter[__display](ctx)}`;
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/query/upsert.ts
import { Table as Table8 } from "surrealdb";
var UpsertQuery = class extends Query {
  [__ctx];
  _only = false;
  _set;
  _content;
  _merge;
  _patch;
  _replace;
  _modificationMode;
  _filter;
  _return;
  _timeout;
  tb;
  subject;
  constructor(orm2, subject) {
    super();
    this[__ctx] = {
      orm: orm2,
      id: /* @__PURE__ */ Symbol()
    };
    this._lenient = true;
    this.subject = subject;
    if (typeof subject === "string") {
      this.tb = subject;
    } else if (isWorkable(subject)) {
      this.tb = subject[__type].tb;
    } else {
      this.tb = String(subject.table);
    }
  }
  get schema() {
    return resolveSubjectSchema(this[__ctx].orm, this.tb);
  }
  get [__type]() {
    const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
    return this._only ? schema : t_exports.array(schema);
  }
  only() {
    return this.derive((next) => {
      next._only = true;
    });
  }
  /**
   * Set fields. A SET leaves the fields it does not set in place, or absent if
   * the record is created, so those are typed as optional in the result.
   */
  set(data) {
    return this.derive((next) => {
      applySet(next, data);
    });
  }
  /** Replace the record with the given fields, so the other fields are gone. */
  content(data) {
    return this.derive((next) => {
      applyContent(next, data);
    });
  }
  merge(data) {
    return this.derive((next) => {
      applyMerge(next, data);
    });
  }
  patch(operations) {
    return this.derive((next) => {
      applyPatch(next, operations);
    });
  }
  /** Replace the record. The other fields of the record are gone. */
  replace(data) {
    return this.derive((next) => {
      applyReplace(next, data);
    });
  }
  where(cb) {
    const tb = actionable({
      [__ctx]: this[__ctx],
      [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
      [__display]: ({ contextId }) => {
        return contextId === this[__ctx].id ? "$this" : "$parent";
      }
    });
    const filter = sanitizeWorkable(cb(tb));
    return this.derive((next) => {
      next._filter = andWhere(next._filter, filter);
    });
  }
  /** Remove every `.where()` condition set so far. */
  clearWhere() {
    return this.derive((next) => {
      next._filter = void 0;
    });
  }
  return(value) {
    if (typeof value === "function") {
      const tb = actionable({
        [__ctx]: this[__ctx],
        [__type]: this.schema,
        [__display]: ({ contextId }) => {
          return contextId === this[__ctx].id ? "$this" : "$parent";
        }
      });
      const predicable = value(tb);
      const workable = inheritableIntoWorkable(
        predicable
      );
      const ret = sanitizeWorkable(workable);
      return this.derive((next) => {
        next._return = ret;
      });
    }
    const mode = value;
    return this.derive((next) => {
      next._return = mode;
      next._skipParse = mode === "diff";
    });
  }
  timeout(duration) {
    return this.derive((next) => {
      next._timeout = duration;
    });
  }
  validateInput() {
    validateWrite(
      this[__ctx].orm,
      String(this.tb),
      this.schema,
      this,
      "update"
    );
  }
  [__display](inp) {
    const ctx = displayContext({
      ...inp,
      contextId: this[__ctx].id
    });
    const thing = typeof this.subject === "string" ? ctx.var(new Table8(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
    let query = (
      /* surql */
      `UPSERT ${this._only ? "ONLY " : ""}${thing}`
    );
    query += displayModificationClause(this, ctx);
    if (this._filter)
      query += /* surql */
      ` WHERE ${this._filter[__display](ctx)}`;
    if (this._return) {
      if (typeof this._return === "string") {
        query += /* surql */
        ` RETURN ${this._return.toUpperCase()}`;
      } else {
        query += /* surql */
        ` RETURN VALUE ${this._return[__display](ctx)}`;
      }
    }
    if (this._timeout) {
      query += /* surql */
      ` TIMEOUT ${ctx.var(this._timeout)}`;
    }
    return `(${query})`;
  }
};

// src/schema/lookup.ts
var asArray = (x) => typeof x === "string" ? [x] : x;
function ensureNode(lookup, node) {
  if (!lookup.to[node]) lookup.to[node] = [];
  if (!lookup.from[node]) lookup.from[node] = [];
}
function addEdgeConnections(lookup, schema) {
  const { tb: via } = schema;
  for (const from of asArray(schema.from)) {
    lookup.to[from].push(via);
    lookup.from[via].push(from);
  }
  for (const to of asArray(schema.to)) {
    lookup.to[via].push(to);
    lookup.from[to].push(via);
  }
}
function createLookupFromSchemas(schemas) {
  const lookup = {
    to: {},
    from: {}
  };
  for (const schema of schemas) {
    if (schema instanceof EdgeSchema) {
      for (const from of asArray(schema.from)) ensureNode(lookup, from);
      ensureNode(lookup, schema.tb);
      for (const to of asArray(schema.to)) ensureNode(lookup, to);
    } else {
      ensureNode(lookup, schema.tb);
    }
  }
  for (const schema of schemas) {
    if (schema instanceof EdgeSchema) {
      addEdgeConnections(lookup, schema);
    }
  }
  return lookup;
}

// src/schema/table.ts
import { escapeIdent as escapeIdent4 } from "surrealdb";
var TableSchema = class _TableSchema {
  constructor(tb, _fields, model, _computed = {}) {
    this.tb = tb;
    this._fields = _fields;
    this.model = model;
    this._computed = _computed;
    if (model) registerModelClass(model);
  }
  /** Schema metadata used to generate `DEFINE TABLE`. */
  ddl = {};
  /**
   * Add a computed field: a read-only field whose value SurrealDB derives from
   * an expression each time the record is read (`DEFINE FIELD … COMPUTED`,
   * SurrealDB 3.0+). It is part of the row type returned by selects, but cannot
   * be written: it is left out of the input types of `create`, `update`,
   * `upsert`, `insert` and `relate`.
   *
   * The field must exist in the database before it can be read. Create it with
   * {@link Orm.defineComputed}, or run {@link TableSchema.computedStatements}
   * in a migration.
   *
   * @param name - The field name.
   * @param type - The type of the computed value.
   * @param expression - Builds the expression from the row and the ORM.
   *
   * @example
   * ```ts
   * const user = table("user", { name: t.string() }).computed(
   *   "postCount",
   *   t.number(),
   *   (user, db) =>
   *     db
   *       .select("post")
   *       .where((p) => p.author.eq(user.id))
   *       .return((p) => p.id)
   *       .wrap()
   *       .len(),
   * );
   * ```
   */
  computed(name, type, expression) {
    if (name === "id" || name in this._fields || name in this._computed) {
      throw new OrmError(
        `Field "${name}" is already defined on table "${this.tb}"`
      );
    }
    const next = new _TableSchema(
      this.tb,
      { ...this._fields, [name]: type },
      this.model,
      {
        ...this._computed,
        [name]: { type, expression }
      }
    );
    next.ddl = this.ddl;
    return next;
  }
  /** The names of this table's computed fields. */
  get computedFields() {
    return Object.keys(this._computed);
  }
  /**
   * Render a `DEFINE FIELD OVERWRITE … COMPUTED …` statement for each computed
   * field. Values are inlined, because a `DEFINE` statement cannot take
   * parameters.
   *
   * @param orm - The ORM the expressions are built against.
   */
  /**
   * The computed fields written as raw SurrealQL, which need no ORM to render
   * and so take part in schema generation and migrations like any other field.
   */
  rawComputedStatements(overwrite = false) {
    return Object.entries(this._computed).filter(([, def]) => def.expression instanceof SurqlExpression).map(([name, def]) => [
      name,
      `DEFINE FIELD ${overwrite ? "OVERWRITE " : ""}${escapeIdent4(name)} ON TABLE ${escapeIdent4(this.tb)} COMPUTED ${def.expression.sql.trim()};`
    ]);
  }
  // biome-ignore lint/suspicious/noExplicitAny: accepts an ORM over any tables
  computedStatements(orm2) {
    return Object.entries(this._computed).map(([name, def]) => {
      if (def.expression instanceof SurqlExpression) {
        return `DEFINE FIELD OVERWRITE ${escapeIdent4(name)} ON TABLE ${escapeIdent4(this.tb)} COMPUTED ${def.expression.sql.trim()}`;
      }
      const id = /* @__PURE__ */ Symbol();
      const row = actionable({
        [__ctx]: { orm: orm2, id },
        [__type]: this.schema,
        [__display]: ({ contextId }) => contextId === id ? "$this" : "$parent"
      });
      const expression = def.expression(row, orm2);
      const sql = expression[__display](
        displayContext({ var: inlineValue, variables: {}, contextId: id })
      );
      return `DEFINE FIELD OVERWRITE ${escapeIdent4(name)} ON TABLE ${escapeIdent4(this.tb)} COMPUTED (${sql})`;
    });
  }
  // A table is immutable (`computed()` returns a new one), so what it derives
  // from its fields is built once. Rebuilding it on every access made each
  // query rebuild a whole object type per property lookup.
  _fieldsCache;
  _schemaCache;
  get fields() {
    if (!this._fieldsCache) {
      this._fieldsCache = {
        ...this._fields,
        ..."id" in this._fields ? {} : { id: t_exports.record(this.tb) }
      };
    }
    return this._fieldsCache;
  }
  type = void 0;
  get schema() {
    if (!this._schemaCache) {
      this._schemaCache = this.model ? new ModelType(this.fields, this.model) : t_exports.object(this.fields);
    }
    return this._schemaCache;
  }
  /** Type-guard that checks whether a value matches this table's schema. */
  validate(value) {
    return this.schema.validate(value);
  }
  safeParse(data, options = {}) {
    const mode = options.mode ?? "create";
    const result = safeParseWith(
      this.schema,
      data,
      mode,
      this.tb,
      ["id"],
      this.computedFields
    );
    if (result.success && mode === "row" && this.model) {
      return {
        success: true,
        data: Object.assign(
          Object.create(this.model.prototype),
          result.data
        )
      };
    }
    return result;
  }
  parse(data, options = {}) {
    const result = this.safeParse(data, options);
    if (!result.success) throw result.error;
    return result.data;
  }
  // -------------------------------------------------------------------------
  // Schema modifiers
  //
  // As with the field modifiers, each returns a clone rather than mutating —
  // a table definition is routinely shared between several `orm()` instances.
  // -------------------------------------------------------------------------
  /** Enforce the declared fields, rejecting anything else. This is the default. */
  schemafull() {
    return patchTableDdl(this, (d) => {
      d.schemafull = true;
    });
  }
  /** Allow fields beyond those declared. */
  schemaless() {
    return patchTableDdl(this, (d) => {
      d.schemafull = false;
    });
  }
  /** Discard every record written to this table (`DROP`). */
  drop() {
    return patchTableDdl(this, (d) => {
      d.drop = true;
    });
  }
  /**
   * Set the table's `PERMISSIONS`: a SurrealQL clause as a string, or a rule per
   * operation. A rule is `"full"`, `"none"`, SurrealQL, or a typed condition
   * built with `where()`, checked against this table's fields.
   *
   * An operation left out takes SurrealDB's default for a table, which is
   * `NONE`.
   *
   * @example
   * ```ts
   * table("post", { owner: t.record("user") }).permissions({
   *   select: "full",
   *   update: where((row, { auth }) => row.owner.eq(auth.id)),
   * });
   * ```
   */
  permissions(rules) {
    return patchTableDdl(this, (d) => {
      d.permissions = rules;
    });
  }
  /** Retain a change feed for `duration` (e.g. `"3d"`). */
  changefeed(duration, includeOriginal = false) {
    return patchTableDdl(this, (d) => {
      d.changefeed = { duration, includeOriginal };
    });
  }
  /** Make this a computed view over another table (`AS SELECT …`). */
  view(selectStatement) {
    return patchTableDdl(this, (d) => {
      d.view = selectStatement;
    });
  }
  /** Attach a `COMMENT` to the table. */
  comment(text) {
    return patchTableDdl(this, (d) => {
      d.comment = text;
    });
  }
  /**
   * Add an index.
   *
   * @param name - The index name
   * @param options - What to index and how
   */
  index(name, options) {
    return patchTableDdl(this, (d) => {
      d.indexes = { ...d.indexes, [name]: options };
    });
  }
  /**
   * Add an event.
   *
   * @param name - The event name
   * @param options - What fires it and what it does
   */
  event(name, options) {
    return patchTableDdl(this, (d) => {
      d.events = { ...d.events, [name]: options };
    });
  }
};
function table(tb, fields, model) {
  return new TableSchema(tb, fields, model);
}

// src/schema/orm.ts
function typeFromValue(value) {
  if (isWorkable(value)) return value[__type];
  if (value instanceof RecordId2) return t_exports.record(String(value.table));
  if (value instanceof Date) return t_exports.date();
  if (value instanceof Duration) return t_exports.duration();
  if (value instanceof Uuid) return t_exports.uuid();
  if (value instanceof GeometryPoint) return t_exports.point();
  if (value === null) return t_exports.null();
  if (value === void 0) return t_exports.none();
  switch (typeof value) {
    case "string":
      return t_exports.string();
    case "number":
      return t_exports.number();
    case "boolean":
      return t_exports.bool();
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return t_exports.array(t_exports.never());
        return t_exports.array(value.map(typeFromValue));
      }
      const fields = Object.fromEntries(
        Object.entries(value).map(([key, field]) => [
          key,
          typeFromValue(field)
        ])
      );
      return t_exports.object(fields);
    }
    default:
      throw new OrmError(`Cannot infer a SurrealDB type for ${typeof value}`);
  }
}
var Orm = class _Orm {
  constructor(surreal, tables, lookup, options = {}) {
    this.surreal = surreal;
    this.tables = tables;
    this.lookup = lookup;
    this.validation = options.validate ?? false;
  }
  /**
   * Whether queries check the data they write against the table schema before
   * sending it. Off by default; see {@link Orm.validated}.
   */
  validation;
  /**
   * A view of this ORM in which every query that writes data (create, insert,
   * update, upsert, relate) first checks it against the table schema, and
   * throws a {@link ValidationError} listing every failing field instead of
   * sending it. Like {@link Orm.withSignal}, it shares the connection and
   * changes nothing else. A single query can still opt out with
   * `.validated(false)`.
   *
   * @example
   * ```ts
   * const db = orm(surreal, user).validated();
   * await db.create("user").content({ name: 42 }); // throws ValidationError
   * ```
   */
  validated(enabled = true) {
    return new _Orm(this.surreal, this.tables, this.lookup, {
      validate: enabled
    });
  }
  /**
   * Wrap a raw JavaScript value as an actionable SurrealQL expression. Record
   * ids keep their table type, so graph traversal can start directly from a
   * value: `db.value(new RecordId("person", "tobie")).out("authored")`.
   */
  value(value) {
    const ctx = {
      orm: this,
      id: /* @__PURE__ */ Symbol()
    };
    return actionable(
      intoWorkable(
        ctx,
        typeFromValue(value),
        value
      )
    );
  }
  /**
   * Create (or overwrite) the computed fields of the registered tables in the
   * database, with `DEFINE FIELD OVERWRITE … COMPUTED …` (SurrealDB 3.0+). Pass
   * table names to restrict it to those tables. Safe to run repeatedly.
   *
   * @example
   * ```ts
   * await db.defineComputed();
   * ```
   */
  async defineComputed(...tables) {
    const names = tables.length > 0 ? tables : Object.keys(this.tables);
    const statements = names.flatMap((name) => {
      const schema = this.tables[name];
      return schema instanceof TableSchema ? schema.computedStatements(this) : [];
    });
    if (statements.length === 0) return;
    await this.surreal.query(`${statements.join(";\n")};`);
  }
  // Method
  select(tb, id) {
    if (tb instanceof RecordId2) return new SelectQuery(this, tb);
    if (Array.isArray(tb)) return new SelectQuery(this, tb);
    if (isWorkable(tb))
      return new SelectQuery(this, tb);
    if (id === void 0) return new SelectQuery(this, tb);
    return new SelectQuery(this, new RecordId2(tb, id));
  }
  // Method
  live(tb, id) {
    if (tb instanceof RecordId2) return new LiveQuery(this, tb);
    if (isWorkable(tb))
      return new LiveQuery(this, tb);
    if (id === void 0) return new LiveQuery(this, tb);
    return new LiveQuery(this, new RecordId2(tb, id));
  }
  // Method
  create(tb, id) {
    return new CreateQuery(this, tb, id);
  }
  // Method
  insert(tb, data) {
    return new InsertQuery(this, tb, data);
  }
  // Method
  update(tb, id) {
    if (tb instanceof RecordId2) return new UpdateQuery(this, tb);
    if (isWorkable(tb))
      return new UpdateQuery(this, tb);
    if (id === void 0) return new UpdateQuery(this, tb);
    return new UpdateQuery(this, new RecordId2(tb, id));
  }
  // Method
  delete(tb, id) {
    if (tb instanceof RecordId2) return new DeleteQuery(this, tb);
    if (isWorkable(tb))
      return new DeleteQuery(this, tb);
    if (id === void 0) return new DeleteQuery(this, tb);
    return new DeleteQuery(this, new RecordId2(tb, id));
  }
  // Method
  upsert(tb, id) {
    if (tb instanceof RecordId2) return new UpsertQuery(this, tb);
    if (isWorkable(tb))
      return new UpsertQuery(this, tb);
    if (id === void 0) return new UpsertQuery(this, tb);
    return new UpsertQuery(this, new RecordId2(tb, id));
  }
  // Method
  relate(edge, from, to) {
    const edgeSchema = this.tables[edge];
    if (!(edgeSchema instanceof EdgeSchema)) {
      throw new OrmError(`"${edge}" is not an edge table`);
    }
    return new RelateQuery(this, edge, from, to);
  }
  /**
   * Run a user-defined SurrealDB function and return the typed result.
   *
   * @param fn - A function callable created with {@link fn}.
   * @param args - Positional arguments matching the function's parameter types.
   *   Omit for functions that take no parameters.
   * @returns The typed result of the function execution.
   *
   * @example
   * ```ts
   * const greet = fn("greet", [t.string()], t.string());
   * const result = await db.run(greet, ["world"]); // typed as string
   * ```
   */
  async run(fn, args) {
    const schema = fn.schema;
    if (this.validation) {
      throwIfInvalid(
        checkArgs(schema.params, args ?? []),
        void 0,
        `arguments for fn::${schema.name}`
      );
    }
    const result = await this.surreal.run(
      `fn::${schema.name}`,
      args
    );
    return schema.returns.parse(result);
  }
  /**
   * Create a type-safe API client for user-defined API endpoints.
   *
   * @param endpoints - One or more {@link ApiEndpointSchema} definitions
   *   created with {@link api}.
   * @returns An {@link ApiClient} with typed HTTP methods.
   *
   * @example
   * ```ts
   * const usersEndpoint = api("/users", {
   *   get: { response: t.array(user.schema) },
   *   post: { request: t.object({ name: t.string() }), response: user.schema },
   * });
   *
   * const client = db.api(usersEndpoint);
   * const response = await client.get("/users");
   * ```
   */
  api(...endpoints) {
    return new ApiClient(this.surreal, endpoints, this.validation);
  }
  /**
   * Create a view of this ORM in which every query is abandoned when `signal`
   * aborts, which is how the work of a request handler is tied to the signal of
   * the request without passing it to every query:
   *
   * ```ts
   * const scoped = db.withSignal(request.signal);
   * const users = await scoped.select("user");
   * ```
   *
   * The view shares the connection and session of this ORM and changes neither,
   * so it is cheap to make one per request. Batches, transactions and live
   * subscriptions made through it are bound to the signal as well; a live
   * subscription is killed when the signal aborts.
   *
   * Aborting means "stop waiting", and nothing more: a write that was already
   * sent may or may not have been applied.
   */
  withSignal(signal) {
    return new _Orm(
      this.surreal.withSignal(signal),
      this.tables,
      this.lookup,
      { validate: this.validation }
    );
  }
  /**
   * Combine multiple queries into a single request that is applied atomically:
   * either every query takes effect or none does. Resolves to a tuple with the
   * result of each query.
   *
   * The batch runs as a stateless transaction, so it works over HTTP as well as
   * WebSockets, and can be configured with `.retry()`, `.signal()` and
   * `.requestTimeout()`.
   *
   * @param queries - The queries to batch together.
   * @returns A {@link BatchQuery} that can be awaited.
   */
  // biome-ignore lint/suspicious/noExplicitAny: required for generic constraint flexibility
  batch(...queries) {
    return new BatchQuery(this.surreal, queries);
  }
  // Method
  async transaction(cb) {
    const { Transaction: Tx } = await import("./transaction-T6IZQNPZ.js");
    const surrealTx = await this.surreal.beginTransaction();
    const tx = new Tx(surrealTx, this.tables, this.lookup, {
      validate: this.validation
    });
    if (!cb) return tx;
    try {
      const result = await cb(tx);
      await tx.commit();
      return result;
    } catch (e) {
      await tx.cancel();
      throw e;
    }
  }
};
function isSchemaMap(value) {
  return typeof value === "object" && value !== null && !(value instanceof TableSchema) && !(value instanceof EdgeSchema);
}
function orm(surreal, ...args) {
  const tables = args.length === 1 && isSchemaMap(args[0]) ? Object.values(args[0]) : args;
  const mapped = tables.reduce((acc, table2) => {
    acc[table2.tb] = table2;
    return acc;
  }, {});
  const lookup = createLookupFromSchemas(tables);
  return new Orm(surreal, mapped, lookup);
}

// src/query/transaction.ts
var Transaction = class _Transaction extends Orm {
  _transaction;
  constructor(transaction, tables, lookup, options = {}) {
    super(transaction, tables, lookup, options);
    this._transaction = transaction;
  }
  /**
   * A handle on this same transaction in which every query is also bound to
   * `signal`. It commits and cancels the transaction just as this one does.
   *
   * Only queries are bound to the signal: `commit()` and `cancel()` are not, so
   * a request that is being abandoned cannot leave the outcome of a commit in
   * doubt.
   */
  withSignal(signal) {
    return new _Transaction(
      this._transaction.withSignal(signal),
      this.tables,
      this.lookup,
      { validate: this.validation }
    );
  }
  /** A handle on this same transaction with input validation switched on or off. */
  validated(enabled = true) {
    return new _Transaction(this._transaction, this.tables, this.lookup, {
      validate: enabled
    });
  }
  /**
   * Not available inside a transaction: a batch is itself an atomic
   * transaction, and transactions cannot be nested. Run the queries on the
   * transaction directly instead.
   */
  // biome-ignore lint/suspicious/noExplicitAny: mirrors the signature of Orm.batch
  batch(..._queries) {
    throw new OrmError(
      "batch() cannot be used inside a transaction: a batch is already atomic, and transactions cannot be nested. Run the queries on the transaction instead."
    );
  }
  /**
   * Commit this transaction to the datastore, applying all changes.
   */
  async commit() {
    await this._transaction.commit();
  }
  /**
   * Cancel this transaction, discarding all changes.
   */
  async cancel() {
    await this._transaction.cancel();
  }
};

export {
  ApiClient,
  BatchQuery,
  CreateQuery,
  DeleteQuery,
  InsertQuery,
  SelectQuery,
  resolveFetchObject,
  LiveSubscription,
  LiveQuery,
  RelateQuery,
  UpdateQuery,
  UpsertQuery,
  TableSchema,
  table,
  Orm,
  orm,
  Transaction
};
