import { RetryValue, SurrealSession, SurrealRequestScope, BoundQuery, RecordIdValue, RecordId, LiveSubscription as LiveSubscription$1, Uuid, LiveAction, SurrealTransaction, Duration, GeometryPoint, Decimal, Geometry, Range } from 'surrealdb';

declare class OrmError extends Error {
}
/** One failed check found while validating data against a schema. */
type ValidationIssue = {
    /** Where the value sits, e.g. `age`, `address.city` or `tags[1]`; `(root)` for the data itself. */
    readonly path: string;
    /** What the schema expects there, e.g. `number`, `Date` or `string or number`. */
    readonly expected: string;
    /** The value that was found (`undefined` when the field is missing). */
    readonly received: unknown;
    /** A readable one-line description of the issue. */
    readonly message: string;
};
/**
 * Thrown when data does not match a table's schema. Unlike
 * {@link TypeParseError}, which stops at the first mismatch, it carries every
 * failing field in {@link ValidationError.issues}.
 */
declare class ValidationError extends OrmError {
    readonly issues: readonly ValidationIssue[];
    readonly table?: string | undefined;
    constructor(issues: readonly ValidationIssue[], table?: string | undefined, subject?: string);
}
/**
 * Thrown when a query fails in the way a duplicated `surrealdb` install makes
 * it fail. Surqlize binds query subjects as the SDK's `Table`, and the SDK
 * encodes by `instanceof`: with two copies of the package the connection does
 * not recognise Surqlize's `Table`, encodes it as an empty object, and the
 * server answers `Cannot execute ... statement using value: {  }`. The original
 * rejection is kept as `cause`.
 */
declare class DuplicateSurrealError extends OrmError {
    constructor(options?: {
        cause?: unknown;
    });
}
declare class TypeParseError extends Error {
    readonly name: string;
    readonly expected: string | [string, string, ...string[]];
    readonly found: unknown;
    constructor(name: string, expected: string | [string, string, ...string[]], found: unknown);
}

/**
 * Create a display context for rendering queries as SurrealQL strings. If an
 * upstream context is provided, its variable store is reused to share variables
 * across composed queries.
 */
declare function displayContext(upstream?: Partial<DisplayContext>): {
    var: (value: unknown) => string;
    variables: Record<string, unknown>;
    contextId: symbol;
    bareRowsOf: symbol | undefined;
};
/** Context used to render queries into parameterized SurrealQL strings. */
type DisplayContext = {
    var: (value: unknown) => string;
    variables: Record<string, unknown>;
    contextId: symbol;
    /**
     * The context id of a grouped or split SELECT whose own row is referenced
     * without a `$this` prefix. SurrealDB rejects `$this` in a grouped selection,
     * so its fields are rendered as bare identifiers instead.
     */
    bareRowsOf?: symbol;
};

type Functions$8 = {
    eq<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    ne<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    ex<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    gt<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    gte<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    lt<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    lte<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    inside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    notInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, T>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    or<C extends WorkableContext>(this: Workable<C>, ...params: Workable<C>[]): Actionable<C, BoolType>;
    and<C extends WorkableContext>(this: Workable<C>, ...params: Workable<C>[]): Actionable<C, BoolType>;
    not<C extends WorkableContext>(this: Workable<C>): Actionable<C, BoolType>;
    falseish<C extends WorkableContext>(this: Workable<C>): Actionable<C, BoolType>;
    trueish<C extends WorkableContext>(this: Workable<C>): Actionable<C, BoolType>;
};

/** Supported HTTP methods for API endpoints. */
type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "trace";
/**
 * Defines the request and response types for a single HTTP method
 * on an API endpoint.
 */
interface ApiMethodDef {
    /** The type of the request body (omit for methods with no body, e.g. GET). */
    request?: AbstractType;
    /** The type of the response body. */
    response?: AbstractType;
}
/**
 * Maps HTTP methods to their request/response type definitions for
 * an API endpoint.
 */
type ApiMethods = Partial<Record<HttpMethod, ApiMethodDef>>;
/**
 * Schema definition for a custom SurrealDB API endpoint (`DEFINE API`).
 * Stores the endpoint path and HTTP method definitions with typed
 * request/response bodies.
 *
 * Use the {@link api} factory function to create instances rather than
 * constructing this class directly.
 *
 * @typeParam Path - The endpoint path literal type.
 * @typeParam Methods - The HTTP method definitions.
 */
declare class ApiEndpointSchema<Path extends string = string, Methods extends ApiMethods = ApiMethods> {
    readonly path: Path;
    readonly methods: Methods;
    constructor(path: Path, methods: Methods);
}
/**
 * Define a custom SurrealDB API endpoint schema.
 *
 * @param path - The endpoint path (e.g. `"/users"`).
 * @param methods - An object mapping HTTP methods to their request/response type definitions.
 * @returns An {@link ApiEndpointSchema} instance.
 *
 * @example
 * ```ts
 * const usersEndpoint = api("/users", {
 *   get: { response: t.array(user.schema) },
 *   post: {
 *     request: t.object({ name: t.string(), email: t.string() }),
 *     response: user.schema,
 *   },
 * });
 * ```
 */
declare function api<Path extends string, Methods extends ApiMethods>(path: Path, methods: Methods): ApiEndpointSchema<Path, Methods>;

/** Any class that can be linked to a table with `table(tb, fields, Class)`. */
type ModelClass = abstract new (...args: any[]) => object;

/**
 * What a piece of data is validated as.
 *
 * - `create`: the input of a create / insert / relate. Every field must be
 *   present unless it is `option<…>` or has a `.default()`.
 * - `update`: a partial write (update / upsert / merge / set). Only the fields
 *   present are checked.
 * - `row`: a whole record as stored, including `id` and computed fields.
 */
type ValidationMode = "create" | "update" | "row";
/** The result of `safeParse()`: the data, or why it was rejected. */
type SafeParseResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: ValidationError;
};

/** When an event fires. */
type EventTrigger = "CREATE" | "UPDATE" | "DELETE";
/** What an event responds to and what it does. */
interface EventOptions {
    /**
     * The operations that fire it. Omitting this fires on every change.
     *
     * This becomes a `$event` guard in the generated `WHEN` clause. Without one
     * the clause would be empty, and SurrealDB accepts `WHEN NULL` silently —
     * the event is created and simply never runs.
     */
    on?: EventTrigger | EventTrigger[];
    /** An extra condition, ANDed onto the trigger guard. */
    when?: string;
    /**
     * The SurrealQL to run.
     *
     * Named `body` rather than `then` — matching `storedFunction` — because an
     * object carrying a `then` property is treated as a thenable by `await`.
     */
    body: string;
    comment?: string;
    /** Previous names, so a rename redefines rather than dropping and recreating. */
    previousNames?: string[];
}
/** An event attached to a table. */
interface EventDefinition extends EventOptions {
    name: string;
}
/**
 * Render a `DEFINE EVENT` statement.
 *
 * @param tableName - The table the event belongs to
 * @param event - What fires it and what it does
 * @param options - Whether to replace an existing definition
 * @returns A complete `DEFINE EVENT` statement
 */
declare function defineEvent(tableName: string, event: EventDefinition, options?: {
    overwrite?: boolean;
}): string;

/** How SurrealDB measures distance between vectors. */
type DistanceMetric = "COSINE" | "EUCLIDEAN" | "MANHATTAN" | "MINKOWSKI" | "CHEBYSHEV" | "HAMMING";
/** The numeric width an HNSW index stores vectors at. */
type VectorType = "F64" | "F32" | "I64" | "I32" | "I16";
/** Full-text search options. */
interface FulltextOptions {
    /**
     * The analyzer that tokenises the column. Required: SurrealDB has no analyzer
     * of its own to fall back to, so an index that names none is refused.
     */
    analyzer?: string;
    /** BM25 relevance scoring, optionally tuned. */
    bm25?: boolean | {
        k1: number;
        b: number;
    };
    /** Record term positions so matches can be highlighted. */
    highlights?: boolean;
}
/**
 * HNSW vector index options.
 *
 * SurrealDB fills in every tuning parameter it was not given, so they are
 * emitted explicitly — otherwise the stored definition would never match the
 * declared one and the index would look permanently modified.
 */
interface HnswOptions {
    dimension: number;
    dist?: DistanceMetric;
    type?: VectorType;
    /** Size of the candidate list used while building. At least 1. */
    efc?: number;
    /** Connections per node. At least 2. */
    m?: number;
    /** Connections per node in the base layer. Defaults to twice `m`. */
    m0?: number;
}
/** What an index covers and how. */
interface IndexOptions {
    /** The columns to index. Omitted only for a `COUNT` index. */
    fields?: string[];
    /** Reject duplicate values. */
    unique?: boolean;
    /** Make this a full-text index. Exactly one column is allowed. */
    fulltext?: boolean | FulltextOptions;
    /** Make this an HNSW vector index. */
    hnsw?: HnswOptions;
    /** Index the table's row count rather than a column. */
    count?: boolean;
    /**
     * Build without blocking writes.
     *
     * Accepted but not stored — SurrealDB treats it as a directive about how to
     * apply the statement, not part of what the index is, so it never appears in
     * a diff.
     */
    concurrently?: boolean;
    comment?: string;
    /** Previous names, so a rename redefines rather than dropping and recreating. */
    previousNames?: string[];
}
/** An index attached to a table. */
interface IndexDefinition extends IndexOptions {
    name: string;
}
/**
 * Render a `DEFINE INDEX` statement.
 *
 * @param tableName - The table the index belongs to
 * @param index - What to index and how
 * @param options - Whether to replace an existing definition
 * @returns A complete `DEFINE INDEX` statement
 */
declare function defineIndex(tableName: string, index: IndexDefinition, options?: {
    overwrite?: boolean;
}): string;

/**
 * DDL metadata carried alongside a table or edge schema.
 *
 * As with field-level metadata, none of this affects the inferred row type —
 * it exists so a migration can generate `DEFINE TABLE`.
 */
/** A `CHANGEFEED` clause. */
interface TableChangefeed {
    duration: string;
    includeOriginal?: boolean;
}
/**
 * Everything a table can carry beyond its fields.
 *
 * Every property is optional. A table that has never been given a modifier
 * generates a bare `DEFINE TABLE <name> SCHEMAFULL`.
 *
 * Note the absence of rename tracking. Unlike fields, tables cannot be renamed
 * safely: record IDs embed the table name, so every inbound `record<old>` link
 * would be left dangling, and links held in `record<any>` fields, graph edges or
 * SCHEMALESS tables are invisible to a migration. Renaming a table is a manual
 * operation.
 */
interface TableDdl {
    /** `SCHEMAFULL` when true, `SCHEMALESS` when false. Defaults to schemafull. */
    schemafull?: boolean;
    /** `DROP` — the table discards every record written to it. */
    drop?: boolean;
    permissions?: TablePermissions;
    changefeed?: TableChangefeed;
    /** An `AS SELECT …` clause, making this a computed view. */
    view?: string;
    comment?: string;
    /** `ENFORCED` — SurrealDB rejects edges whose `in`/`out` records do not exist. */
    enforced?: boolean;
    /** Indexes on this table, keyed by name. */
    indexes?: Record<string, IndexOptions>;
    /** Events on this table, keyed by name. */
    events?: Record<string, EventOptions>;
}
/** Anything carrying table-level DDL metadata. */
interface HasTableDdl {
    readonly ddl: Readonly<TableDdl>;
}

/**
 * The object type of a table linked to a class: rows parse into instances of
 * the class, and the inferred type is the row fields plus the class instance.
 */
declare class ModelType<Fd extends Record<string, AbstractType> = Record<string, AbstractType>, I = unknown> extends ObjectType<Fd> {
    readonly model: ModelClass;
    infer: ObjectType<Fd>["infer"] & I;
    accept: ObjectType<Fd>["accept"] & I;
    constructor(fields: Fd, model: ModelClass);
    /** Parse a row, then hydrate it into an instance of the linked class. */
    parse(value: unknown): this["infer"];
}

/**
 * The SDK handle an {@link Orm} sends its queries through: a session (`Surreal`
 * is one), or the view of a session bound to an `AbortSignal` that
 * `withSignal()` returns.
 */
type SurrealConnection = SurrealSession | SurrealRequestScope;
/**
 * Client-side options that the SDK applies when it sends a query. They concern
 * how long and how hard the client waits for the answer, not what the server
 * executes — unlike the `TIMEOUT` clause that `.timeout()` renders.
 */
type RequestOptions = {
    readonly signals?: readonly AbortSignal[];
    readonly requestTimeout?: number;
    readonly retry?: RetryValue;
};

type QueryResult<E extends AbstractType, Only extends boolean> = Only extends true ? E : ArrayType<E>;
/**
 * Abstract base class for all query types. Implements `Workable` so queries can
 * be composed as subqueries, and is Promise-like so queries can be directly
 * awaited to execute against SurrealDB.
 *
 * @typeParam C - The workable context (carries the ORM reference).
 * @typeParam T - The result type of the query.
 */
declare abstract class Query<C extends WorkableContext = WorkableContext, T extends AbstractType = AbstractType> implements Workable<C, T> {
    abstract [__ctx]: C;
    abstract [__display](ctx: DisplayContext): string;
    abstract [__type]: T;
    type: T["infer"];
    /** When true, result parsing is skipped (used by RETURN DIFF). */
    protected _skipParse: boolean;
    /**
     * When true, the result of a partial write is parsed leniently: a field the
     * write did not set is not an error, since the record need not have it. See
     * `parseWritten`.
     */
    protected _lenient: boolean;
    /** Client-side options applied when the query is sent. */
    protected _request: RequestOptions;
    /** Per-query override of the ORM's input validation; `undefined` defers to the ORM. */
    protected _validate?: boolean;
    /**
     * Check the data this query writes against the table schema before it is
     * sent, throwing a {@link ValidationError} that lists every failing field.
     * `.validated()` turns it on for this query and `.validated(false)` off; by
     * default it follows the ORM (see `Orm.validated()`), which is off.
     */
    validated(enabled?: boolean): this;
    /**
     * Validate the data this query writes, if input validation is on for it.
     * Called before the query is sent (and before a batch sends it).
     *
     * @throws {ValidationError} If the data does not match the table schema.
     */
    assertInput(): void;
    /** Overridden by the write queries to check the data they carry. */
    protected validateInput(): void;
    /** Type-guard that checks whether a value matches this query's result type. */
    validate(value: unknown): value is T["infer"];
    /** Parse and validate a raw query result against this query's result type. */
    parse(value: unknown): T["infer"];
    /**
     * Normalize a raw query result into the public return value for this query.
     * Most queries parse through the runtime schema, while a few modes such as
     * `RETURN DIFF` intentionally bypass parse.
     */
    parseResult(value: unknown): T["infer"];
    /** Create a shallow clone of this query. */
    clone(): this;
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
    protected derive(mutate: (draft: this) => void): this;
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
    signal(signal: AbortSignal | undefined): this;
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
    requestTimeout(milliseconds: number): this;
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
    retry(options?: RetryValue): this;
    /** Render the query as a SurrealQL string. */
    toString(): string;
    [Symbol.toStringTag]: string;
    catch<TResult = never>(onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined): Promise<this["type"] | TResult>;
    finally(onFinally?: (() => void) | null | undefined): Promise<this["type"]>;
    get then(): Then<this> & ThenAccessors<this>;
    wrap(): Actionable<C, T>;
    /** Execute the query against SurrealDB and return the parsed result. */
    execute(): Promise<T["infer"]>;
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
    prepare(): BoundQuery<[this["type"]]>;
}
type Then<Q extends {
    type: unknown;
}> = <TResult1 = Q["type"], TResult2 = never>(onFulfilled?: ((value: Q["type"]) => TResult1 | PromiseLike<TResult1>) | undefined | null, onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null) => Promise<TResult1 | TResult2>;
/** The element type of an array result, or the result itself if not an array. */
type ResultElement<T> = T extends readonly (infer E)[] ? E : T;
/**
 * Convenience accessors hung off {@link Query.then} for reaching into a query's
 * result array without first awaiting it into a variable.
 */
type ThenAccessors<Q extends {
    type: unknown;
}> = {
    /** Execute the query and resolve to the first result, or `undefined`. */
    val(): Promise<ResultElement<Q["type"]> | undefined>;
    /**
     * Execute the query and resolve to the result at `index`, or `undefined`.
     * Negative indexes count from the end (e.g. `-1` is the last result).
     */
    at(index: number): Promise<ResultElement<Q["type"]> | undefined>;
};

/**
 * Builds a type-level map from endpoint path to its method definitions.
 * Given `[ApiEndpointSchema<"/users", M1>, ApiEndpointSchema<"/posts", M2>]`,
 * produces `{ "/users": M1; "/posts": M2 }`.
 */
type EndpointsMap<E extends ApiEndpointSchema[]> = {
    [K in E[number] as K["path"]]: K["methods"];
};
/**
 * Extracts the set of endpoint paths that support a given HTTP method.
 */
type PathsForMethod<Map, M extends HttpMethod> = {
    [P in keyof Map]: M extends keyof Map[P] ? P : never;
}[keyof Map] & string;
/**
 * Extracts the inferred response type for a given path and method.
 */
type ResponseType<Map, P extends string, M extends HttpMethod> = P extends keyof Map ? M extends keyof Map[P] ? Map[P][M] extends {
    response: AbstractType;
} ? Map[P][M]["response"]["infer"] : unknown : unknown : unknown;
/**
 * Extracts the inferred request body type for a given path and method.
 */
type RequestType<Map, P extends string, M extends HttpMethod> = P extends keyof Map ? M extends keyof Map[P] ? Map[P][M] extends {
    request: AbstractType;
} ? Map[P][M]["request"]["infer"] : undefined : undefined : undefined;
/**
 * The response shape returned by API endpoints.
 */
interface ApiResponse<T> {
    body?: T;
    headers?: Record<string, string>;
    status?: number;
}
/**
 * A type-safe wrapper around the SurrealDB SDK's `SurrealApi` that validates
 * responses against Surqlize endpoint schemas, and request bodies too when the
 * ORM is {@link Orm.validated | validated}.
 *
 * Created via `db.api()` on an {@link Orm} instance.
 *
 * A call whose status is outside 2xx rejects with the SDK's
 * `UnsuccessfulApiError`: its `response` holds the status, headers and the raw
 * body, which is not parsed against the declared response type.
 *
 * @typeParam E - Tuple of {@link ApiEndpointSchema} types.
 */
declare class ApiClient<E extends ApiEndpointSchema[] = ApiEndpointSchema[]> {
    private readonly surreal;
    private readonly validate;
    private schemas;
    constructor(surreal: SurrealConnection, endpoints: E, validate?: boolean);
    private getMethodDef;
    private parseBody;
    private invoke;
    /**
     * Invoke a user-defined GET API endpoint.
     *
     * @param path - The endpoint path.
     * @returns The typed API response.
     */
    get<P extends PathsForMethod<EndpointsMap<E>, "get">>(path: P): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "get">>>;
    /**
     * Invoke a user-defined POST API endpoint.
     *
     * @param path - The endpoint path.
     * @param body - The request body.
     * @returns The typed API response.
     */
    post<P extends PathsForMethod<EndpointsMap<E>, "post">>(path: P, body?: RequestType<EndpointsMap<E>, P, "post">): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "post">>>;
    /**
     * Invoke a user-defined PUT API endpoint.
     *
     * @param path - The endpoint path.
     * @param body - The request body.
     * @returns The typed API response.
     */
    put<P extends PathsForMethod<EndpointsMap<E>, "put">>(path: P, body?: RequestType<EndpointsMap<E>, P, "put">): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "put">>>;
    /**
     * Invoke a user-defined DELETE API endpoint.
     *
     * @param path - The endpoint path.
     * @param body - Optional request body.
     * @returns The typed API response.
     */
    delete<P extends PathsForMethod<EndpointsMap<E>, "delete">>(path: P, body?: RequestType<EndpointsMap<E>, P, "delete">): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "delete">>>;
    /**
     * Invoke a user-defined PATCH API endpoint.
     *
     * @param path - The endpoint path.
     * @param body - The request body.
     * @returns The typed API response.
     */
    patch<P extends PathsForMethod<EndpointsMap<E>, "patch">>(path: P, body?: RequestType<EndpointsMap<E>, P, "patch">): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "patch">>>;
    /**
     * Invoke a user-defined TRACE API endpoint.
     *
     * @param path - The endpoint path.
     * @param body - Optional request body.
     * @returns The typed API response.
     */
    trace<P extends PathsForMethod<EndpointsMap<E>, "trace">>(path: P, body?: RequestType<EndpointsMap<E>, P, "trace">): Promise<ApiResponse<ResponseType<EndpointsMap<E>, P, "trace">>>;
}

/**
 * Maps a tuple of Query types to a tuple of their inferred result types.
 */
type BatchResult<Q extends Query<any, any>[]> = {
    [K in keyof Q]: Q[K] extends Query<infer _C, infer T> ? T["infer"] : never;
};
/**
 * A batch of queries that is sent to the server in a single request and applied
 * atomically: either every statement takes effect or none does. It is executed
 * with the SDK's stateless `transaction()`, so it also works over HTTP.
 *
 * Because it is a single request, a batch is safe to replay. Use
 * {@link BatchQuery.retry} to re-send it when it fails because of a conflict with
 * a concurrent transaction.
 */
declare class BatchQuery<Q extends Query<any, any>[]> {
    private readonly surreal;
    private readonly queries;
    private readonly options;
    constructor(surreal: SurrealConnection, queries: Q, options?: RequestOptions);
    /** Render each query as a single statement sharing one variable store. */
    private statements;
    [__display](inp: DisplayContext): string;
    toString(): string;
    [Symbol.toStringTag]: string;
    /** A copy of this batch with different request options. */
    private withOptions;
    /**
     * Abandon the batch when `signal` aborts. Calling this more than once
     * combines the signals.
     *
     * Aborting means "stop waiting", and nothing more: the batch is a single
     * request that the server may carry on to run, so **it may or may not have
     * been committed**.
     */
    signal(signal: AbortSignal | undefined): BatchQuery<Q>;
    /**
     * Give up on the batch with a `TimeoutError` if the server has not answered
     * within `milliseconds` (per attempt, when retrying), overriding the
     * connection's `requestTimeout`. Pass `0` to wait without limit. As for
     * {@link BatchQuery.signal}, the batch may or may not have been committed.
     */
    requestTimeout(milliseconds: number): BatchQuery<Q>;
    /**
     * Re-send the whole batch when it fails because of a conflict with a
     * concurrent transaction. Defaults to the connection's retry behaviour; pass
     * options to override it, or `false` to turn it off.
     *
     * Conflicts are recognised from the structured `TransactionConflict` error
     * that SurrealDB 3.1.0 and later report. For earlier servers, pass a
     * `retryable` predicate.
     */
    retry(options?: RetryValue): BatchQuery<Q>;
    execute(): Promise<BatchResult<Q>>;
    get then(): <TResult1 = BatchResult<Q>, TResult2 = never>(onFulfilled?: ((value: BatchResult<Q>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null) => Promise<TResult1 | TResult2>;
    catch<TResult = never>(onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined): Promise<BatchResult<Q> | TResult>;
    finally(onFinally?: (() => void) | null | undefined): Promise<BatchResult<Q>>;
}

/**
 * What a write is known to leave in its result.
 *
 * - `keys`: the fields the write set, unioned across chained calls.
 * - `gone`: the fields `.unset()` removed.
 * - `mode`: how the data was written. `full` is the whole record (CREATE and
 *   RELATE `.content()`), so the result is the table's row. `set` keeps the
 *   written fields. `replace` replaces the record. `patch` says nothing about
 *   the fields.
 */
type WriteShape = {
    /** Fields the write certainly sets. */
    keys: string;
    /** Fields the write may set: they are optional, or may be `undefined`. */
    maybe: string;
    gone: string;
    mode: "full" | "set" | "replace" | "patch";
};
/** Before any data is written: the write is a SET with nothing in it. */
type NoWrite = {
    keys: never;
    maybe: never;
    gone: never;
    mode: "set";
};
/** A write of the whole record, whose result is the table's row. */
type FullWrite = {
    keys: never;
    maybe: never;
    gone: never;
    mode: "full";
};
/**
 * The keys of `D` that are certainly written: required, and not typed to accept
 * `undefined`. A key that is optional, or may be `undefined`, may be absent from
 * the record.
 */
type Definite<D> = Exclude<{
    [K in keyof D]-?: {} extends Pick<D, K> ? never : undefined extends D[K] ? never : K;
}[keyof D] & string, `${string}.${string}`>;
/**
 * The top-level field a dotted key (`"name.first"`) writes into. Setting only
 * part of a nested object leaves the rest as it was, so the field itself is
 * only a maybe.
 */
type RootOf<K extends string> = K extends `${infer Root}.${string}` ? Root : K;
/** The keys of `D` that may be absent from the record: see {@link Definite}. */
type Maybe<D> = RootOf<Exclude<keyof D & string, Definite<D>>>;
/**
 * The shape after `D` is written with `mode`, keeping what was written before.
 * A key written both ways is certainly written.
 */
type Written<W extends WriteShape, Mode extends WriteShape["mode"], D> = {
    keys: W["keys"] | Definite<D>;
    maybe: Exclude<W["maybe"] | Maybe<D>, W["keys"] | Definite<D>>;
    gone: W["gone"];
    mode: Mode;
};
/** Which write query produced the result. */
type WriteKind = "create" | "update" | "relate";
/** Fields with a `.default()`, which CREATE fills in. */
type DefaultKeys<S, W extends WriteShape> = Exclude<{
    [K in keyof S]-?: S[K] extends HasDefault ? K : never;
}[keyof S], W["maybe"]>;
/** Fields that may be absent: `option<…>` fields. */
type OptionKeys<S extends Record<string, AbstractType>> = {
    [K in keyof S]-?: undefined extends S[K]["infer"] ? K : never;
}[keyof S];
type Implicit<K extends WriteKind> = K extends "relate" ? "id" | "in" | "out" : "id";
/**
 * The fields a write is known to leave present. Computed fields are always
 * present, since the database evaluates them on every write.
 */
type Guaranteed<S extends Record<string, AbstractType>, W extends WriteShape, K extends WriteKind> = Exclude<Implicit<K> | ComputedKeys<S> | (W["mode"] extends "patch" ? never : W["keys"]) | (W["mode"] extends "set" ? K extends "update" ? never : OptionKeys<S> | (K extends "create" | "relate" ? DefaultKeys<S, W> : never) : never) | (W["mode"] extends "replace" ? K extends "update" ? never : OptionKeys<S> : never), W["gone"] | W["maybe"]> & keyof S;
/**
 * Whether the fields the write does not guarantee may still be present. A
 * partial UPDATE or UPSERT leaves the stored values in place, and a PATCH can
 * set anything, so those fields are optional. A CREATE or RELATE only has the
 * fields it wrote, so the rest are absent.
 */
type MayRemain<W extends WriteShape, K extends WriteKind> = W["mode"] extends "patch" ? true : K extends "update" ? W["mode"] extends "set" ? true : false : false;
/**
 * The fields that may be absent: every field the write does not guarantee where
 * the stored record may keep the rest, otherwise the fields that may be unset.
 */
type OptionalFields<S extends Record<string, AbstractType>, W extends WriteShape, K extends WriteKind> = MayRemain<W, K> extends true ? Exclude<keyof S, Guaranteed<S, W, K> | W["gone"]> : Exclude<Extract<W["maybe"], keyof S>, W["gone"]>;
type RowFields<S extends Record<string, AbstractType>, W extends WriteShape, K extends WriteKind> = {
    [P in Guaranteed<S, W, K>]: S[P];
} & {
    [P in OptionalFields<S, W, K>]: OptionType<S[P]>;
};
/**
 * The type of the rows a write returns. Only the fields the write guarantees are
 * required. The rest are optional where the stored record may still have them,
 * and absent otherwise. A `full` write returns the table's row unchanged. A
 * table linked to a class keeps the class's members.
 */
type WriteRow<E extends AbstractType, W extends WriteShape, K extends WriteKind> = W["mode"] extends "full" ? E : E extends {
    readonly model: unknown;
    readonly schema: infer S extends Record<string, AbstractType>;
    readonly infer: infer I;
} ? ModelType<RowFields<S, W, K>, Omit<I, keyof S>> : E extends {
    readonly schema: infer S extends Record<string, AbstractType>;
} ? ObjectType<RowFields<S, W, K>> : E;

/**
 * A fluent CREATE query builder. Supports SET, CONTENT, MERGE, PATCH, REPLACE,
 * RETURN, and TIMEOUT clauses.
 *
 * `W` describes what has been written so far. It sets the type of the rows the
 * query returns: see {@link WriteRow}.
 */
declare class CreateQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], Only extends boolean = false, W extends WriteShape = NoWrite> extends Query<C, QueryResult<WriteRow<E, W, "create">, Only>> implements ModificationState {
    readonly tb: T;
    readonly [__ctx]: C;
    private _only;
    _set?: Record<string, unknown>;
    _content?: unknown;
    _merge?: unknown;
    _patch?: JsonPatchOp[];
    _replace?: unknown;
    _modificationMode?: ModificationMode;
    private _return?;
    private _timeout?;
    private _id?;
    constructor(orm: O, tb: T, id?: RecordIdValue);
    get schema(): E;
    get [__type](): QueryResult<WriteRow<E, W, "create">, Only>;
    only(): CreateQuery<O, C, T, E, true, W>;
    /**
     * Set fields. Fields that are not set are absent from the result, so the
     * result only types the fields that are known to be there.
     */
    set<const D extends E extends ObjectType ? Partial<SetData<E>> : never>(data: D & OrphanDottedKeys<D>): CreateQuery<O, C, T, E, Only, Written<W, "set", D>>;
    content(data: E extends ObjectType ? CreateInput<E> : E["infer"]): CreateQuery<O, C, T, E, Only, FullWrite>;
    /** Merge fields into the record. Fields that are not merged are absent from the result. */
    merge<const D extends Partial<WriteData<E>>>(data: D): CreateQuery<O, C, T, E, Only, Written<W, "set", D>>;
    patch(operations: JsonPatchOp[]): CreateQuery<O, C, T, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    /** Replace the record. REPLACE does not apply defaults, so only the given fields are known. */
    replace<const D extends Partial<WriteData<E>>>(data: D): CreateQuery<O, C, T, E, Only, Written<NoWrite, "replace", D>>;
    return(mode: "none" | "before" | "after" | "diff"): this;
    return<P extends Inheritable<C>>(cb: (record: Actionable<C, WriteRow<E, W, "create">>) => P): CreateQuery<O, C, T, InheritableIntoType<C, ReturnType<typeof cb>>, Only, FullWrite>;
    timeout(duration: string): this;
    protected validateInput(): void;
    [__display](inp: DisplayContext): string;
}

/**
 * Object-based filters and sorting (issue #45).
 *
 * `where({ name: "x", age: { gt: 18 } })` and `orderBy({ age: "desc" })` are
 * compiled down to the very same condition / ORDER BY machinery the fluent
 * callbacks use (`row.name.eq("x").and(row.age.gt(18))`), so both forms render
 * identical SurrealQL and can be mixed freely.
 */
type PropKeys<C extends WorkableContext, F extends AbstractType> = Extract<keyof ActionableProps<C, F>, string>;
/** The schema type behind an `Actionable` field accessor. */
type PropType<C extends WorkableContext, A> = A extends Workable<C, infer X> ? X : never;
/** Type-specific operators, layered on top of the universal ones. */
type TypeOperators<C extends WorkableContext, F extends AbstractType> = F extends StringType ? {
    startsWith?: IntoWorkable<C, StringType>;
    endsWith?: IntoWorkable<C, StringType>;
    contains?: IntoWorkable<C, StringType>;
    search?: IntoWorkable<C, StringType>;
} : F extends ArrayType<infer E extends AbstractType> ? {
    contains?: IntoWorkable<C, E>;
    containsNot?: IntoWorkable<C, E>;
    containsAll?: IntoWorkable<C, ArrayType<E>>;
    containsAny?: IntoWorkable<C, ArrayType<E>>;
    containsNone?: IntoWorkable<C, ArrayType<E>>;
    allInside?: IntoWorkable<C, ArrayType<E>>;
    anyInside?: IntoWorkable<C, ArrayType<E>>;
    noneInside?: IntoWorkable<C, ArrayType<E>>;
} : unknown;
/**
 * The operator object accepted for a field: `{ gt: 18 }`, `{ inside: [...] }`.
 * Each key maps to the fluent method of the same name; several keys on one
 * field are AND-ed together.
 */
type OperatorFilter<C extends WorkableContext, F extends AbstractType> = {
    eq?: IntoWorkable<C, F>;
    ne?: IntoWorkable<C, F>;
    ex?: IntoWorkable<C, F>;
    gt?: IntoWorkable<C, F>;
    gte?: IntoWorkable<C, F>;
    lt?: IntoWorkable<C, F>;
    lte?: IntoWorkable<C, F>;
    inside?: IntoWorkable<C, ArrayType<F>>;
    notInside?: IntoWorkable<C, ArrayType<F>>;
} & TypeOperators<C, F>;
/** What a single field may be compared against in a {@link WhereObject}. */
type FieldCondition<C extends WorkableContext, F extends AbstractType> = IntoWorkable<C, F> | OperatorFilter<C, F> | WhereObject<C, F>;
/** The `and` / `or` / `not` combinators accepted at every level. */
type Combinators<C extends WorkableContext, F extends AbstractType> = {
    and?: WhereObject<C, F>[];
    or?: WhereObject<C, F>[];
    not?: WhereObject<C, F>;
};
/**
 * An object-form `where` filter over `F` (a row, an object, or a record link):
 * every key is a field of `F`, mapped to a {@link FieldCondition}. Keys are
 * AND-ed together; `and` / `or` / `not` combine nested filters. A field whose
 * value is `undefined` is ignored, so optional query parameters can be passed
 * straight through. Resolves to `never` for types that have no fields.
 */
type WhereObject<C extends WorkableContext, F extends AbstractType> = [
    PropKeys<C, F>
] extends [never] ? never : {
    [K in PropKeys<C, F>]?: FieldCondition<C, PropType<C, ActionableProps<C, F>[K]>>;
} & Combinators<C, F>;
/** A sort direction, in either case. */
type OrderDirection = "asc" | "desc" | "ASC" | "DESC";
/**
 * An object-form `orderBy` over `F`: each key is a field mapped to a direction,
 * or (for object / record-link fields) to a nested object sorting by their
 * fields. Keys are applied in insertion order; `undefined` values are ignored.
 */
type OrderByObject<C extends WorkableContext, F extends AbstractType> = [
    PropKeys<C, F>
] extends [never] ? never : {
    [K in PropKeys<C, F>]?: OrderDirection | OrderByObject<C, PropType<C, ActionableProps<C, F>[K]>>;
};

/**
 * The rows a DELETE returns from the stored record. A record can be partial (a
 * write may leave out required fields, see `WriteRow`), and the delete has
 * already committed by the time the row is read. So only the id is guaranteed.
 */
type StoredRow<E extends AbstractType> = WriteRow<E, NoWrite, "update">;
/**
 * What a DELETE returns. Without a `RETURN` (or with `RETURN NONE`) it returns
 * none: an empty array, or NONE with `.only()`. `RETURN AFTER` returns one NONE
 * per deleted record, since the record is gone when it is read. Any other
 * `RETURN` gives rows.
 */
type DeleteReturns = "none" | "rows" | "after";
/** The result of a DELETE, see {@link DeleteReturns}. */
type DeleteResult<E extends AbstractType, Only extends boolean, Returns extends DeleteReturns> = Returns extends "none" ? Only extends true ? OptionType<NeverType> : ArrayType<NeverType> : Returns extends "after" ? QueryResult<OptionType<NeverType>, Only> : QueryResult<E, Only>;
/** The `Returns` a `.return()` argument selects. */
type DeleteReturnsOf<M extends string> = M extends "none" ? "none" : M extends "after" ? "after" : "rows";
/**
 * A fluent DELETE query builder. Supports WHERE, RETURN, and TIMEOUT clauses.
 */
declare class DeleteQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], Only extends boolean = false, Returns extends DeleteReturns = "none"> extends Query<C, DeleteResult<E, Only, Returns>> {
    readonly [__ctx]: C;
    private _only;
    private _filter?;
    private _return?;
    private _timeout?;
    private tb;
    private subject;
    constructor(orm: O, subject: T | RecordId<T> | Workable<C, RecordType<T>>);
    get schema(): E;
    get [__type](): DeleteResult<E, Only, Returns>;
    only(): DeleteQuery<O, C, T, E, true, Returns>;
    where(cb: (tb: Actionable<C, O["tables"][T]["schema"]>) => Workable<C>): this;
    where(filter: WhereObject<C, O["tables"][T]["schema"]>): this;
    /** Remove every `.where()` condition set so far. */
    clearWhere(): this;
    /** Return the deleted rows, typed as the stored records (see `StoredRow`). */
    return(mode: "before"): DeleteQuery<O, C, T, StoredRow<E>, Only, "rows">;
    /** The record is gone when RETURN AFTER reads it, so each entry is NONE. */
    return(mode: "after"): DeleteQuery<O, C, T, E, Only, "after">;
    return(mode: "none"): DeleteQuery<O, C, T, E, Only, "none">;
    return(mode: "diff"): DeleteQuery<O, C, T, E, Only, "rows">;
    /**
     * A mode chosen at run time: the result is typed as the union of the modes'
     * results, so an `after` in the union gives NONE entries, not rows.
     */
    return<M extends "none" | "before" | "after" | "diff">(mode: M): DeleteQuery<O, C, T, StoredRow<E>, Only, DeleteReturnsOf<M>>;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, StoredRow<E>>) => P): DeleteQuery<O, C, T, R, Only, "rows">;
    timeout(duration: string): this;
    [__display](inp: DisplayContext): string;
}

/**
 * A fluent INSERT query builder. Supports inline data, `.fields().values()`,
 * IGNORE, ON DUPLICATE KEY UPDATE, RETURN, and TIMEOUT clauses.
 */
declare class InsertQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], W extends WriteShape = FullWrite> extends Query<C, ArrayType<WriteRow<E, W, "create">>> {
    readonly tb: T;
    readonly [__ctx]: C;
    private _data?;
    private _fields?;
    private _values?;
    private _ignore?;
    private _onDuplicate?;
    private _return?;
    private _timeout?;
    constructor(orm: O, tb: T, data?: unknown | unknown[]);
    get schema(): E;
    get [__type](): ArrayType<WriteRow<E, W, "create">>;
    /**
     * Specify the fields for a `VALUES`-style insert.
     *
     * @param fields - Column names to insert into.
     * @throws {OrmError} If the query was constructed with inline data.
     */
    fields(fields: E extends ObjectType ? Exclude<keyof E["schema"], ComputedKeys<E["schema"]>>[] : string[]): this;
    /**
     * Provide value rows for a `VALUES`-style insert.
     *
     * @param rows - One or more arrays of values matching the field order.
     * @throws {OrmError} If the query was constructed with inline data.
     * @throws {OrmError} If {@link fields} has not been called first.
     * @throws {OrmError} If any row length does not match the field count.
     */
    values(...rows: unknown[][]): this;
    /**
     * Add an `IGNORE` clause so duplicate records are silently skipped.
     *
     * @throws {OrmError} If {@link onDuplicate} has already been called.
     */
    ignore(): this;
    /**
     * Add an `ON DUPLICATE KEY UPDATE` clause.
     *
     * A row that conflicts is updated, not inserted, so the rows returned may be
     * records the update did not fully write. Only the id is typed as present.
     *
     * @param updates - Fields and values to update on conflict.
     * @throws {OrmError} If {@link ignore} has already been called.
     */
    onDuplicate(updates: E extends ObjectType ? Partial<SetData<E>> : Record<string, unknown>): InsertQuery<O, C, T, E, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    return(mode: "none" | "before" | "after" | "diff"): this;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, E>) => P): InsertQuery<O, C, T, R>;
    timeout(duration: string): this;
    protected validateInput(): void;
    [__display](inp: DisplayContext): string;
}

declare const GRAPH_SEGMENT: unique symbol;
/** A type-safe marker for SurrealQL's graph wildcard segment `?`. */
declare const ANY: unique symbol;
type ANY = typeof ANY;
type GraphDirection = "out" | "in" | "both";
type GraphSegmentPrimitive = string | ANY;
type TableFieldsOf<C extends WorkableContext, Tb extends string> = Tb extends keyof C["orm"]["tables"] ? C["orm"]["tables"][Tb] extends AnyTable ? C["orm"]["tables"][Tb]["schema"] : never : never;
type GraphFilter<C extends WorkableContext, Target extends string> = (row: Actionable<C, TableFieldsOf<C, Target>>) => Workable<C>;
type GraphSegmentSpec<Target extends string = string, C extends WorkableContext = any> = {
    readonly [GRAPH_SEGMENT]: true;
    readonly target: Target;
    readonly filter?: GraphFilter<C, Target>;
    /** Filter the edge. Chained calls AND together, as they do on queries. */
    where<NextC extends WorkableContext = C>(cb: GraphFilter<NextC, Target>): GraphSegmentSpec<Target, NextC>;
    /** Remove every condition set so far on this segment. */
    clearWhere(): GraphSegmentSpec<Target, C>;
};
/**
 * The context-bound segment factory injected into a traversal-step filter
 * callback (`.out((g) => g("edge").where(...))`). Its target is constrained
 * directly to the step's reachable edges — the same direct-constraint pattern
 * `GraphArgs` relies on, so `g("…")` autocompletes — and the spec it returns is
 * bound to the live traversal context `C`, so the segment's `.where((e) => …)`
 * is schema-typed against the edge.
 */
type SegmentBuilder<C extends WorkableContext, Tb extends string, Dir extends GraphDirection> = <Target extends Extract<StepSegments<C, Tb, Dir>, string>>(target: Target) => GraphSegmentSpec<Target, C>;
/**
 * A traversal-step filter alternative: it receives the context-bound segment
 * factory `g` and returns one (optionally `.where()`-filtered) segment. It is a
 * variadic argument alongside plain edge names, so one step can mix filtered and
 * unfiltered alternatives: `out("a", (g) => g("b").where(...))` → `->(a, b WHERE …)`.
 */
type SegmentCallback<C extends WorkableContext, Tb extends string, Dir extends GraphDirection> = (g: SegmentBuilder<C, Tb, Dir>) => GraphSegmentSpec<Extract<StepSegments<C, Tb, Dir>, string>, C>;
type AnyGraphSegmentSpec = GraphSegmentSpec<string, any>;
type GraphSegmentArg = GraphSegmentPrimitive | AnyGraphSegmentSpec;
/**
 * The target table of an edge, where `->edge->` lands.
 */
type ToOf<C extends WorkableContext, Edge extends string> = Edge extends keyof C["orm"]["tables"] ? C["orm"]["tables"][Edge] extends EdgeSchema<infer _From, infer _Via, infer To, any> ? To : never : never;
/** The source table of an edge, where `<-edge<-` lands. */
type FromOf<C extends WorkableContext, Edge extends string> = Edge extends keyof C["orm"]["tables"] ? C["orm"]["tables"][Edge] extends EdgeSchema<infer From, infer _Via, infer _To, any> ? From : never : never;
type IsEdgeTable<C extends WorkableContext, Tb extends string> = Tb extends keyof C["orm"]["tables"] ? C["orm"]["tables"][Tb] extends EdgeSchema ? true : false : false;
type OutStepSegments<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? ToOf<C, Tb> | ANY : OutgoingEdges<C, Tb> | ANY;
type InStepSegments<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? FromOf<C, Tb> | ANY : IncomingEdges<C, Tb> | ANY;
type BothStepSegments<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? FromOf<C, Tb> | ToOf<C, Tb> | ANY : OutgoingEdges<C, Tb> | IncomingEdges<C, Tb> | ANY;
type StepSegments<C extends WorkableContext, Tb extends string, Dir extends GraphDirection> = Dir extends "out" ? OutStepSegments<C, Tb> : Dir extends "in" ? InStepSegments<C, Tb> : BothStepSegments<C, Tb>;
type AnyOutStep<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? ToOf<C, Tb> : OutgoingEdges<C, Tb>;
type AnyInStep<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? FromOf<C, Tb> : IncomingEdges<C, Tb>;
type AnyBothStep<C extends WorkableContext, Tb extends string> = IsEdgeTable<C, Tb> extends true ? FromOf<C, Tb> | ToOf<C, Tb> : OutgoingEdges<C, Tb> | IncomingEdges<C, Tb>;
type StepResultForTarget<C extends WorkableContext, Tb extends string, Dir extends GraphDirection, Target> = Target extends ANY ? Dir extends "out" ? AnyOutStep<C, Tb> : Dir extends "in" ? AnyInStep<C, Tb> : AnyBothStep<C, Tb> : Extract<Target, StepSegments<C, Tb, Dir> & string>;
/**
 * The landing target contributed by one traversal argument: a plain edge name or
 * `ANY` contributes itself; a segment callback contributes the target of the
 * segment it builds.
 */
type SegmentArgTarget<Arg> = Arg extends GraphSegmentPrimitive ? Arg : Arg extends (g: any) => GraphSegmentSpec<infer Target, any> ? Target : never;
type ValidGraphArg<C extends WorkableContext, Tb extends string, Dir extends GraphDirection> = StepSegments<C, Tb, Dir> | SegmentCallback<C, Tb, Dir>;
type GraphSegmentResult<C extends WorkableContext, Tb extends string, Dir extends GraphDirection, Args extends GraphArgs<C, Tb, Dir>> = Args extends readonly [] ? StepResultForTarget<C, Tb, Dir, ANY> : StepResultForTarget<C, Tb, Dir, SegmentArgTarget<Args[number]>>;
/**
 * The valid arguments for a traversal step from `Tb` in direction `Dir`: each is
 * a reachable edge/table name, the `?` wildcard `ANY`, or a segment callback
 * (`(g) => g("edge").where(...)`) for a filtered alternative. The forms mix
 * freely within one step: `out("a", (g) => g("b").where(...))` → `->(a, b WHERE …)`.
 * Used as the constraint on a traversal method's `const Args` type parameter —
 * constraining the parameter directly (rather than validating via an
 * intersection on the parameter type) is what lets the editor suggest the
 * reachable names, while `Args` still captures the literal tuple that
 * `GraphSegmentResult` needs to type the landing node.
 */
type GraphArgs<C extends WorkableContext, Tb extends string, Dir extends GraphDirection> = readonly ValidGraphArg<C, Tb, Dir>[];
/**
 * How many hops a recursive traversal makes: a fixed count (`3` → `{3}`) or a
 * range. `{ min: 2, max: 4 }` → `{2..4}`, `{ min: 2 }` → `{2..}`,
 * `{ max: 4 }` → `{..4}` and `{}` → `{..}` (any depth). Both bounds are
 * inclusive integers in `1..256`.
 */
type RecursionDepth = number | {
    min?: number;
    max?: number;
};
/** Options shared by the `collect` and `shortest` recursion modes. */
type RecursionOptions = {
    /** Also include the starting record in the result (`+inclusive`). */
    inclusive?: boolean;
};
/**
 * The repeated step of a recursive traversal. It receives a placeholder for the
 * node being expanded, and must return a traversal that lands back on the same
 * table (`(n) => n.out("knows").out("person")`), so every iteration is typed
 * against the same record type.
 */
type RecursionBody<C extends WorkableContext, Tb extends string> = (node: Actionable<C, RecordType<Tb>>) => Workable<C, GraphType<Tb>>;
/**
 * Recursive traversal (SurrealQL `.{depth}(step)`, `+collect`, `+shortest`).
 * Recursion is available on records and, as sugar, on select rows (rooted at
 * the row's `id`).
 */
type RecursiveTraversal<C extends WorkableContext, Tb extends string> = {
    /**
     * Repeat `body` over the given depth: `.{depth}(body)`. A fixed depth yields
     * the nodes exactly that many hops away; a range yields the nodes at the
     * deepest level reached (and nothing if the minimum depth is never reached).
     * An unbounded range on a graph containing cycles does not terminate in a
     * useful time, so bound it or use `collect`.
     */
    recurse(depth: RecursionDepth, body: RecursionBody<C, Tb>): Actionable<C, GraphType<Tb>>;
    /**
     * Flattened, de-duplicated nodes reached within the depth (`+collect`),
     * nearest first. Cycle-safe, so the depth may be omitted (`{..+collect}`).
     */
    collect(depth: RecursionDepth, body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, GraphType<Tb>>;
    collect(body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, GraphType<Tb>>;
    /**
     * The shortest path to `target` (`+shortest=target`) as the nodes walked, not
     * including the start. `NONE` (`undefined`) when the target is unreachable —
     * or is the start itself — hence the optional result.
     */
    shortest(target: IntoWorkable<C, RecordType<Tb>>, body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, OptionType<GraphType<Tb>>>;
};
/** Row-level traversal sugar, rooted at the row's `id`. */
type RowTraversal<C extends WorkableContext, T extends string> = {
    out<const Args extends GraphArgs<C, T, "out">>(...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, T, "out", Args>>>;
    in<const Args extends GraphArgs<C, T, "in">>(...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, T, "in", Args>>>;
    both<const Args extends GraphArgs<C, T, "both">>(...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, T, "both", Args>>>;
} & RecursiveTraversal<C, T>;
/**
 * The edge names reachable in the outgoing (`->`) direction from a node.
 */
type OutgoingEdges<C extends WorkableContext, Tb extends string> = {
    [K in keyof C["orm"]["tables"] & string]: C["orm"]["tables"][K] extends EdgeSchema<infer From, any, any, any> ? Tb extends From ? K : never : never;
}[keyof C["orm"]["tables"] & string];
/**
 * The edge names reachable in the incoming (`<-`) direction into a node.
 */
type IncomingEdges<C extends WorkableContext, Tb extends string> = {
    [K in keyof C["orm"]["tables"] & string]: C["orm"]["tables"][K] extends EdgeSchema<any, any, infer To, any> ? Tb extends To ? K : never : never;
}[keyof C["orm"]["tables"] & string];

/** Every key across a union of field maps (union, not the `keyof` intersection). */
type AllKeys<F> = F extends unknown ? keyof F : never;
/** Whether `K` is present in *every* member of the field-map union `F`. */
type PresentInAll<F, K extends PropertyKey> = F extends unknown ? K extends keyof F ? true : false : never;
/** The union of `F[K]` across every member of `F` that defines `K`. */
type Collect<F, K extends PropertyKey> = F extends unknown ? K extends keyof F ? F[K] : never : never;
/**
 * Merge a union of field maps into one: fields present in every member keep
 * their (possibly unioned) type, fields missing from some member become
 * `option<…>`. Mirrors the runtime {@link mergeSchemas}.
 */
type MergeFields<F extends ObjectTypeInner> = {
    [K in AllKeys<F>]: false extends PresentInAll<F, K> ? OptionType<Collect<F, K> & AbstractType> : Collect<F, K> & AbstractType;
};
/**
 * The row shape a select rooted at `S` exposes. For a single-table schema this
 * is effectively the schema itself (a one-member merge collapses to identity);
 * for a union of member schemas (multi-table / polymorphic-link select) the
 * members are merged into one `ObjectType` via {@link MergeFields}, mirroring
 * the runtime {@link resolveSubjectSchema}.
 *
 * The merge is written as a single, non-distributive `[S] extends
 * [ObjectType<infer F>]` so it stays lazy: an `IsUnion`-style probe would force
 * TypeScript to materialise `this["tables"]` at the `orm.select` call sites,
 * which trips the invariant-`Orm` constraint on the polymorphic `this` type.
 */
type ResolveEntry<S extends AbstractType> = [S] extends [
    ObjectType<infer F>
] ? ObjectType<MergeFields<F>> : S;

type FieldKeys<O extends Orm, T extends keyof O["tables"] & string> = O["tables"][T]["schema"] extends ObjectType<infer F> ? keyof F & string : string;
/**
 * The `.extend({ … })` method exposed on the `.return()` row: it projects every
 * field of the row, merged with (and overridden by) the given computed fields,
 * returning a single object projection — see issue #39. `RE` is the row's
 * resolved entry `ObjectType`, so its fields carry through with their declared
 * types and the caller's keys take precedence.
 */
type RowExtend<C extends WorkableContext, RE extends AbstractType> = RE extends ObjectType<infer F> ? {
    extend<Ex extends InheritableObject<C>>(extra: Ex): Workable<C, ObjectType<Omit<F, keyof Ex> & {
        [K in keyof Ex]: InheritableIntoType<C, Ex[K]>;
    }>>;
} : {
    extend(extra: InheritableObject<C>): Workable<C, ObjectType>;
};
/**
 * Every valid FETCH path for a table: a top-level field, or a dotted path
 * rooted at a top-level field (e.g. `"out"` or `"out.author"`). Only the head
 * segment is constrained to a known field; deeper segments are unconstrained,
 * mirroring SurrealDB which validates the rest of the path at query time.
 */
type FetchPaths<O extends Orm, T extends keyof O["tables"] & string> = FieldKeys<O, T> | `${FieldKeys<O, T>}.${string}`;
/** The first segment of a dotted path, or the whole path when it has no dot. */
type PathHead<P extends string> = P extends `${infer H}.${string}` ? H : P;
/** The remainder of every path whose head segment is `K`. */
type PathTail<K extends string, P extends string> = P extends `${K}.${infer R}` ? R : never;
/**
 * The shape of a fetched record whose table is not registered with the ORM: its
 * fields are unknown, so only the `id` is typed.
 */
type UnknownRecord<Tb extends string | undefined> = ObjectType<{
    id: RecordType<Tb>;
}>;
/**
 * Resolve a record link to the schema it points at, unwrapping `option<…>` and
 * `array<…>` wrappers. Non-record types are left untouched; a record to an
 * unregistered table resolves to an {@link UnknownRecord}, as FETCH replaces the
 * link with the record regardless of whether the ORM knows its table.
 */
type ResolveLink<O extends Orm, F extends AbstractType> = F extends RecordType<infer Tb> ? Tb extends keyof O["tables"] & string ? O["tables"][Tb]["schema"] : UnknownRecord<Tb> : F extends UnionType<infer Members extends AbstractType[]> ? UnionType<{
    [K in keyof Members]: Members[K] extends AbstractType ? ResolveLink<O, Members[K]> : never;
}> : F extends OptionType<infer Inner extends AbstractType> ? OptionType<ResolveLink<O, Inner>> : F extends ArrayType<infer Inner extends AbstractType> ? ArrayType<ResolveLink<O, Inner>> : F;
/**
 * Resolve a record link and then continue fetching `Tails` within the resolved
 * object. Used when a fetch path descends past this field (e.g. `out.author`
 * descends through `out`).
 */
type ResolveNested<O extends Orm, F extends AbstractType, Tails extends string> = F extends RecordType<infer Tb> ? Tb extends keyof O["tables"] & string ? FetchedSchema<O, O["tables"][Tb]["schema"], Tails> : UnknownRecord<Tb> : F extends UnionType<infer Members extends AbstractType[]> ? UnionType<{
    [K in keyof Members]: Members[K] extends AbstractType ? ResolveNested<O, Members[K], Tails> : never;
}> : F extends OptionType<infer Inner extends AbstractType> ? OptionType<ResolveNested<O, Inner, Tails>> : F extends ArrayType<infer Inner extends AbstractType> ? ArrayType<ResolveNested<O, Inner, Tails>> : F extends ObjectType<ObjectTypeInner> ? FetchedSchema<O, F, Tails> : F;
/** Resolve a single fetched field given the nested paths (if any) beneath it. */
type FetchField<O extends Orm, F extends AbstractType, Tails extends string> = [
    Tails
] extends [never] ? ResolveLink<O, F> : ResolveNested<O, F, Tails>;
/**
 * Transform an ObjectType by resolving every fetched field. A field is resolved
 * when it is the head of any fetch path; nested paths recurse into the resolved
 * schema. Matches SurrealDB, which expands intermediate records along a path.
 */
type FetchedSchema<O extends Orm, E extends AbstractType, Paths extends string> = E extends ModelType<infer S, infer I> ? ModelType<{
    [K in keyof S]: K extends PathHead<Paths> ? FetchField<O, S[K], PathTail<K & string, Paths>> : S[K];
}, I> : E extends ObjectType<infer S> ? ObjectType<{
    [K in keyof S]: K extends PathHead<Paths> ? FetchField<O, S[K], PathTail<K & string, Paths>> : S[K];
}> : E;
/**
 * The shape of a row after `SPLIT` on the given array fields: each split field
 * holds one element of its array rather than the whole array.
 */
type SplitEntry<E extends AbstractType, Fields extends string> = E extends ModelType<infer S, infer I> ? ModelType<SplitFields<S, Fields>, I> : E extends ObjectType<infer S> ? ObjectType<SplitFields<S, Fields>> : E;
type SplitFields<S, Fields extends string> = {
    [K in keyof S]: K extends Fields ? S[K] extends ArrayType<infer Item extends AbstractType> ? Item : S[K] : S[K];
};
/**
 * A fluent SELECT query builder. Supports WHERE, ORDER BY, GROUP BY, SPLIT,
 * FETCH, LIMIT, START, TIMEOUT, and return projections via `.return()`.
 */
declare class SelectQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], Only extends boolean = false> extends Query<C, QueryResult<E, Only>> {
    readonly [__ctx]: C;
    private _only;
    private _start?;
    private _limit?;
    private _filter?;
    private _whereInput?;
    private _entry?;
    /** The fields of an object `.return()` projection, when it is one. */
    private _entryFields?;
    private _orderBy?;
    private _groupBy?;
    private _split?;
    private _fetch?;
    private _fetchResolvedType?;
    private _timeout?;
    private tb;
    private subject;
    constructor(orm: O, subject: T | readonly T[] | RecordId<T> | Workable<C, RecordType<T> | GraphType<T>>);
    get entry(): E;
    get [__type](): QueryResult<E, Only>;
    only(): SelectQuery<O, C, T, E, true>;
    /**
     * Build the row actionable handed to `.return()` / `.where()` / `.orderBy()`
     * callbacks: it renders as `$this` (or `$parent` when nested) and carries the
     * row's id, so traversal verbs called directly on it root at `<row>.id`.
     */
    private rowActionable;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, ResolveEntry<E>> & RowTraversal<C, T> & RowExtend<C, ResolveEntry<E>>) => P): SelectQuery<O, C, T, R, Only>;
    /**
     * Filter rows. Takes either a callback building the condition from the row,
     * or a plain filter object (`{ name: "x", age: { gt: 18 } }`) that compiles to
     * the same condition — see {@link WhereObject}. Chained calls AND together;
     * {@link clearWhere} removes them.
     */
    where(cb: (tb: Actionable<C, ResolveEntry<O["tables"][T]["schema"]>> & RowTraversal<C, T>) => Workable<C>): this;
    where(filter: WhereObject<C, ResolveEntry<O["tables"][T]["schema"]>>): this;
    /** Remove every `.where()` condition set so far. */
    clearWhere(): this;
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
    clientFilter(): {
        where: Record<string, unknown> | undefined;
        ordered: boolean;
    } | undefined;
    start(start: number): this;
    limit(limit: number): this;
    private _addOrderBy;
    /**
     * Sort rows by a field name, a callback returning a field, or an object of
     * `{ field: "asc" | "desc" }` pairs (nested objects sort by nested fields) —
     * see {@link OrderByObject}. Calls accumulate, so object and fluent forms can
     * be chained.
     */
    orderBy(field: FieldKeys<O, T> | ((record: Actionable<C, ResolveEntry<E>> & RowTraversal<C, T>) => Workable<C>), direction?: "ASC" | "DESC"): this;
    orderBy(sort: OrderByObject<C, ResolveEntry<E>>): this;
    orderByNumeric(field: FieldKeys<O, T> | ((record: Actionable<C, ResolveEntry<E>> & RowTraversal<C, T>) => Workable<C>), direction?: "ASC" | "DESC"): this;
    orderByCollate(field: FieldKeys<O, T> | ((record: Actionable<C, ResolveEntry<E>> & RowTraversal<C, T>) => Workable<C>), direction?: "ASC" | "DESC"): this;
    /**
     * Group rows by the given fields. A grouped query must have a `.return()`
     * projection that selects each of them, and its aggregates, as in
     * `db.select("post").groupBy("author").return((p) => ({ author: p.author, posts: count(p) }))`.
     * It cannot be combined with {@link split}.
     */
    groupBy(...fields: FieldKeys<O, T>[]): this;
    /**
     * Group all rows into one, for table-wide aggregates. Needs a `.return()`
     * projection of aggregates, such as `count(u)` or `math.mean(u.age)`.
     */
    groupAll(): this;
    /**
     * Emit one row per element of the given array fields. SurrealDB does not allow
     * SPLIT and GROUP BY in the same query, so this cannot be combined with
     * {@link groupBy} or {@link groupAll}. Call it before {@link return}.
     */
    split<F extends FieldKeys<O, T>>(...fields: F[]): SelectQuery<O, C, T, SplitEntry<E, F>, Only>;
    private assertNotSplit;
    fetch<P extends FetchPaths<O, T>>(...fields: P[]): SelectQuery<O, C, T, FetchedSchema<O, E, P>, Only>;
    timeout(duration: string): this;
    private displaySubject;
    /**
     * The ORDER BY clause. SurrealQL only sorts by field idioms, so an expression
     * term orders by an alias instead, and its SurrealQL is collected into
     * `hoisted` for the projection to compute under that alias.
     */
    private displayOrderBy;
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
    private displayProjection;
    /** An expression sort is hoisted into a `*` projection, so it cannot be combined with a return() or a grouped query. */
    private assertHoistedSortAllowed;
    /** The projection of a query with no return(): `*`, with any hoisted sort keys beside it. */
    private displayUnprojected;
    /** The SPLIT and GROUP clauses, which come after WHERE and before ORDER BY. */
    private displayGrouping;
    [__display](inp: DisplayContext): string;
}
/**
 * Resolve the fetched fields of an object schema at runtime, mirroring
 * {@link FetchedSchema} at the value level. Fetch paths are grouped by their
 * head segment; each head is resolved once and any deeper segments recurse into
 * the resolved schema.
 */
declare function resolveFetchObject(schema: ObjectType, paths: string[], orm: Orm): ObjectType;

/**
 * A single live-query notification.
 *
 * A record change (`CREATE` / `UPDATE` / `DELETE`) carries the affected
 * `recordId` and its `value` (the record, parsed against the query's schema — or
 * a JSON Patch array when the query was created with `.diff()`).
 *
 * `KILLED` signals that the subscription was terminated server-side (for
 * example when its table is removed) and carries neither: there is no record.
 * It is the final message a subscription emits. Modelling this as a union means
 * a handler cannot read `recordId` or `value` on a `KILLED` message without
 * narrowing on `action` first, mirroring the `surrealdb` SDK.
 */
type LiveMessage<T> = {
    action: Exclude<LiveAction, "KILLED">;
    recordId: RecordId;
    value: T;
} | {
    action: "KILLED";
    recordId?: undefined;
    value?: undefined;
};
/**
 * A typed wrapper around a SurrealDB live subscription. Obtain one by awaiting a
 * {@link LiveQuery} (e.g. `const sub = await db.live("user")`).
 *
 * Notification values are mapped through the query's schema so handlers and
 * iteration receive fully-typed records.
 */
declare class LiveSubscription<T> {
    private readonly inner;
    private readonly mapValue;
    constructor(inner: LiveSubscription$1<unknown>, mapValue: (raw: unknown) => T);
    /**
     * The id of the underlying live subscription. A managed subscription is
     * re-registered when the connection is re-established, which changes its id.
     */
    get id(): Uuid;
    /**
     * Whether the subscription is still delivering notifications. It turns
     * `false` once the subscription is killed (by {@link kill}, by the server, or
     * by an aborted request scope) or its session goes away.
     */
    get isAlive(): boolean;
    /**
     * Whether the SDK re-registers this subscription after the connection drops
     * and reconnects. An unmanaged subscription ends silently instead.
     */
    get isManaged(): boolean;
    /**
     * Subscribe to notifications. Returns a function that unsubscribes this
     * handler (it does not kill the subscription — use {@link kill} for that).
     */
    subscribe(handler: (message: LiveMessage<T>) => void): () => void;
    /** Async-iterate notifications: `for await (const msg of sub) { … }`. */
    [Symbol.asyncIterator](): AsyncIterator<LiveMessage<T>>;
    /** Map an SDK notification onto a {@link LiveMessage}, parsing its value. */
    private toMessage;
    /** Kill the live subscription and stop receiving updates. */
    kill(): Promise<void>;
}
/**
 * A fluent `LIVE SELECT` query builder. Supports `WHERE`, `FETCH`, return
 * projections via `.return()`, and `.diff()`.
 *
 * Awaiting the builder runs the `LIVE SELECT` and resolves to a typed
 * {@link LiveSubscription}; alternatively call `.subscribe(handler)` to start
 * it and receive a stop function in one step.
 *
 * @remarks
 * `LIVE SELECT` does not support `ORDER BY` / `LIMIT` / `START` / `GROUP` /
 * `SPLIT`. Filtering or projecting (`.where()`, `.return()`, `.fetch()`) relies
 * on query parameters, which require **SurrealDB ≥ 3.0**; on older servers a
 * parameterized live query is accepted but never delivers notifications.
 *
 * A subscription to a table, with any of `.where()`, `.fetch()` and `.diff()`,
 * is **managed** by the SDK: it is registered again when the connection drops
 * and reconnects (its `id` changes), so notifications keep flowing. A
 * `.return()` projection cannot be expressed that way and is **unmanaged**: it
 * goes silent after a reconnect, and `isAlive` stays `true`. Check
 * {@link LiveSubscription.isManaged}.
 *
 * @typeParam E - The per-record entry type.
 * @typeParam V - The notification value type (defaults to `E["infer"]`; becomes
 *   `JsonPatchOp[]` after `.diff()`).
 */
declare class LiveQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], V = E["infer"]> {
    readonly [__ctx]: C;
    private _filter?;
    private _entry?;
    private _fetch?;
    private _fetchResolvedType?;
    private _diff;
    private tb;
    private subject;
    constructor(orm: O, subject: T | RecordId<T> | Workable<C, RecordType<T>>);
    get entry(): E;
    get [__type](): E;
    /** Create a shallow clone of this live query. */
    private clone;
    /**
     * Return a shallow {@link clone} with `mutate` applied. Mirrors
     * `Query.derive`: chaining methods derive a new builder instead of mutating
     * `this`, so a base live query can be safely reused. Mutations must replace
     * mutable fields wholesale rather than mutating them in place.
     */
    private derive;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, E>) => P): LiveQuery<O, C, T, R, R["infer"]>;
    where(cb: (tb: Actionable<C, O["tables"][T]["schema"]>) => Workable<C>): this;
    where(filter: WhereObject<C, O["tables"][T]["schema"]>): this;
    /** Remove every `.where()` condition set so far. */
    clearWhere(): this;
    fetch<P extends FetchPaths<O, T>>(...fields: P[]): LiveQuery<O, C, T, FetchedSchema<O, E, P>, FetchedSchema<O, E, P>["infer"]>;
    /**
     * Receive updates as JSON Patch arrays (`LIVE SELECT DIFF`) instead of full
     * records. Mutually exclusive with a `.return()` projection.
     */
    diff(): LiveQuery<O, C, T, E, JsonPatchOp[]>;
    /** Whether the subject is a single record rather than a table. */
    private get isRecordSubject();
    /**
     * The table a live query reads. SurrealDB rejects `LIVE SELECT ... FROM
     * user:n1` ("Cannot execute LIVE statement using value"), so a record subject
     * selects its table and is filtered by id instead (see {@link recordFilter}).
     */
    private displaySubject;
    /** The `id = …` condition that selects a record subject, if there is one. */
    private recordFilter;
    [__display](inp: DisplayContext): string;
    /** Render the query as a SurrealQL string. */
    toString(): string;
    /**
     * The table the SDK can subscribe to on our behalf, or `undefined` when this
     * query needs the unmanaged path.
     *
     * The SDK composes a managed `LIVE SELECT` itself, from a table, an optional
     * `WHERE`, `FETCH` and `DIFF`. It cannot carry a `.return()` projection (an
     * arbitrary expression), and its resource is a table: a record id or a
     * subquery as the subject stays on the unmanaged path.
     */
    private get managedResource();
    /** The filter as an SDK expression, which defines its own variables. */
    private get managedFilter();
    /** Register a live query that the SDK keeps alive across reconnects. */
    private registerManaged;
    /** Register the live query by hand and attach to it, without a restart. */
    private registerUnmanaged;
    /** Start the live query and resolve to a typed {@link LiveSubscription}. */
    execute(): Promise<LiveSubscription<V>>;
    /**
     * Start the live query and subscribe `handler` in one step. Returns a stop
     * function that unsubscribes the handler and kills the subscription.
     */
    subscribe(handler: (message: LiveMessage<V>) => void): Promise<() => void>;
    then<R1 = LiveSubscription<V>, R2 = never>(onFulfilled?: ((value: LiveSubscription<V>) => R1 | PromiseLike<R1>) | undefined | null, onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | undefined | null): Promise<R1 | R2>;
    catch<R = never>(onRejected?: ((reason: unknown) => R | PromiseLike<R>) | undefined | null): Promise<LiveSubscription<V> | R>;
    finally(onFinally?: (() => void) | undefined | null): Promise<LiveSubscription<V>>;
}

/**
 * What an edge's `in` or `out` can be: a record, a list of records, or a query
 * that yields records. A query is rendered as a subquery, so its rows supply the
 * endpoint records: a record type, or table rows (a `select()`, optionally with
 * `.only()`), which always carry an `id`.
 */
type RelateEndpoint<C extends WorkableContext = WorkableContext> = RecordId | RecordId[] | Workable<C, RecordType> | Workable<C, ArrayType<RecordType>> | Workable<C, ObjectType<{
    id: RecordType<string>;
}>> | Workable<C, ArrayType<ObjectType<{
    id: RecordType<string>;
}>>>;
/**
 * What a RELATE returns, as set by `.return()`:
 *
 * - `row`: the edge rows (`RETURN AFTER`, a projection, or no `RETURN` at all).
 * - `none`: no rows (`RETURN NONE`). With `.only()` the result is NONE, which
 *   is `undefined`.
 * - `before`: the edge's state before the write (`RETURN BEFORE`). A RELATE
 *   creates its edge, so there is no before-state and each entry is NONE.
 */
type RelateReturnMode = "row" | "none" | "before";
/** The result mode a `.return()` argument selects: `after` and `diff` give rows. */
type ReturnModeOf<M extends string> = M extends "none" | "before" ? M : "row";
/** The result of a RELATE that returns `Mode`, see {@link RelateReturnMode}. */
type RelateResult<E extends AbstractType, W extends WriteShape, Only extends boolean, Mode extends RelateReturnMode> = Mode extends "none" ? Only extends true ? OptionType<NeverType> : ArrayType<NeverType> : Mode extends "before" ? QueryResult<OptionType<WriteRow<E, W, "relate">>, Only> : QueryResult<WriteRow<E, W, "relate">, Only>;
/**
 * A fluent RELATE query builder for creating graph edges between records.
 * Supports SET, CONTENT, MERGE, PATCH, REPLACE, RETURN, and TIMEOUT clauses.
 *
 * `W` describes what has been written so far. It sets the type of the rows the
 * query returns: see {@link WriteRow}.
 */
declare class RelateQuery<O extends Orm, C extends WorkableContext<O>, Edge extends keyof O["tables"] & string, E extends AbstractType = O["tables"][Edge]["schema"], Only extends boolean = false, W extends WriteShape = NoWrite, Mode extends RelateReturnMode = "row"> extends Query<C, RelateResult<E, W, Only, Mode>> implements ModificationState {
    readonly edge: Edge;
    readonly from: RelateEndpoint<C>;
    readonly to: RelateEndpoint<C>;
    readonly [__ctx]: C;
    private _only;
    _set?: Record<string, unknown>;
    _content?: unknown;
    _merge?: unknown;
    _patch?: JsonPatchOp[];
    _replace?: unknown;
    _modificationMode?: ModificationMode;
    private _return?;
    private _timeout?;
    constructor(orm: O, edge: Edge, from: RelateEndpoint<C>, to: RelateEndpoint<C>);
    get schema(): E;
    get [__type](): RelateResult<E, W, Only, Mode>;
    only(): RelateQuery<O, C, Edge, E, true, W, Mode>;
    /** Set fields on the edge. Fields that are not set are absent from the result. */
    set<const D extends E extends ObjectType ? Partial<SetData<E>> : never>(data: D & OrphanDottedKeys<D>): RelateQuery<O, C, Edge, E, Only, Written<W, "set", D>, Mode>;
    content(data: E extends ObjectType ? Omit<CreateInput<E>, "in" | "out"> : E["infer"]): RelateQuery<O, C, Edge, E, Only, FullWrite, Mode>;
    merge<const D extends Partial<WriteData<E>>>(data: D): RelateQuery<O, C, Edge, E, Only, Written<W, "set", D>, Mode>;
    patch(operations: JsonPatchOp[]): RelateQuery<O, C, Edge, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }, Mode>;
    /** Replace the edge's data. REPLACE does not apply defaults, so only the given fields are known. */
    replace<const D extends Partial<WriteData<E>>>(data: D): RelateQuery<O, C, Edge, E, Only, Written<NoWrite, "replace", D>, Mode>;
    return(mode: "none"): RelateQuery<O, C, Edge, E, Only, W, "none">;
    return(mode: "before"): RelateQuery<O, C, Edge, E, Only, W, "before">;
    return(mode: "after" | "diff"): RelateQuery<O, C, Edge, E, Only, W, "row">;
    return<M extends "none" | "before" | "after" | "diff">(mode: M): RelateQuery<O, C, Edge, E, Only, W, ReturnModeOf<M>>;
    return<P extends Inheritable<C>>(cb: (record: Actionable<C, WriteRow<E, W, "relate">>) => P): RelateQuery<O, C, Edge, InheritableIntoType<C, P>, Only, FullWrite>;
    timeout(duration: string): this;
    protected validateInput(): void;
    [__display](inp: DisplayContext): string;
}

type HasEdgeSchema<T extends readonly (EdgeSchema | TableSchema)[]> = T extends readonly [
    infer First extends EdgeSchema | TableSchema,
    ...infer Rest extends readonly (EdgeSchema | TableSchema)[]
] ? First extends EdgeSchema ? true : HasEdgeSchema<Rest> : false;
type ExtractSchemaInfo<T> = T extends EdgeSchema<infer F, infer V, infer To, EdgeFields> ? {
    type: "edge";
    from: F;
    via: V;
    to: To;
} : T extends TableSchema<infer Tb> ? {
    type: "table";
    table: Tb;
} : never;
type ExtractTableNames<Schemas extends readonly (EdgeSchema | TableSchema)[]> = ExtractSchemaInfo<Schemas[number]> extends {
    type: "table";
    table: infer Tb;
} ? Tb extends string ? Tb : never : never;
type ExtractNodes<Schemas extends readonly (EdgeSchema | TableSchema)[]> = ExtractSchemaInfo<Schemas[number]> extends {
    type: "edge";
    from: infer F;
    via: infer V;
    to: infer To;
} | {
    type: "table";
    table: infer Tb;
} ? F extends string ? V extends string ? To extends string ? Tb extends string ? F | V | To | Tb : F | V | To : never : never : never : never;
type ToConnections<Node extends string, Schemas extends readonly (EdgeSchema | TableSchema)[]> = ExtractSchemaInfo<Schemas[number]> extends {
    type: "edge";
    from: infer F;
    via: infer V;
    to: infer To;
} | {
    type: "table";
    table: infer _Tb;
} ? F extends string ? V extends string ? To extends string ? Node extends F ? readonly [V] : Node extends V ? readonly [To] : readonly [] : readonly [] : readonly [] : readonly [] : readonly [];
type FromConnections<Node extends string, Schemas extends readonly (EdgeSchema | TableSchema)[]> = ExtractSchemaInfo<Schemas[number]> extends {
    type: "edge";
    from: infer F;
    via: infer V;
    to: infer To;
} | {
    type: "table";
    table: infer _Tb;
} ? F extends string ? V extends string ? To extends string ? Node extends To ? readonly [V] : Node extends V ? readonly [F] : readonly [] : readonly [] : readonly [] : readonly [] : readonly [];
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type CreateSchemaLookup<Schemas extends readonly (EdgeSchema | TableSchema)[]> = Prettify<HasEdgeSchema<Schemas> extends true ? {
    to: {
        [Node in ExtractNodes<Schemas> & string]: ToConnections<Node, Schemas>;
    };
    from: {
        [Node in ExtractNodes<Schemas> & string]: FromConnections<Node, Schemas>;
    };
} : {
    to: {
        [Node in ExtractTableNames<Schemas>]: readonly [];
    };
    from: {
        [Node in ExtractTableNames<Schemas>]: readonly [];
    };
}>;

/**
 * A transaction that wraps a server-side `SurrealTransaction`.
 *
 * Provides the same query-builder methods as `Orm` (select, create, insert,
 * update, upsert, delete, relate) but routes all queries through the
 * transaction. Call `commit()` to apply changes or `cancel()` to discard them.
 */
declare class Transaction<T extends AnyTable[] = AnyTable[]> extends Orm<T> {
    private _transaction;
    constructor(transaction: SurrealTransaction, tables: MappedTables<T>, lookup: CreateSchemaLookup<T>, options?: OrmOptions);
    /**
     * A handle on this same transaction in which every query is also bound to
     * `signal`. It commits and cancels the transaction just as this one does.
     *
     * Only queries are bound to the signal: `commit()` and `cancel()` are not, so
     * a request that is being abandoned cannot leave the outcome of a commit in
     * doubt.
     */
    withSignal(signal: AbortSignal | undefined): Transaction<T>;
    /** A handle on this same transaction with input validation switched on or off. */
    validated(enabled?: boolean): Transaction<T>;
    /**
     * Not available inside a transaction: a batch is itself an atomic
     * transaction, and transactions cannot be nested. Run the queries on the
     * transaction directly instead.
     */
    batch(..._queries: Query<any, any>[]): never;
    /**
     * Commit this transaction to the datastore, applying all changes.
     */
    commit(): Promise<void>;
    /**
     * Cancel this transaction, discarding all changes.
     */
    cancel(): Promise<void>;
}

/**
 * A fluent UPDATE query builder. Supports SET, UNSET, CONTENT, MERGE, PATCH,
 * REPLACE, WHERE, RETURN, and TIMEOUT clauses.
 *
 * `W` describes what has been written so far. It sets the type of the rows the
 * query returns: see {@link WriteRow}.
 */
declare class UpdateQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], Only extends boolean = false, W extends WriteShape = NoWrite> extends Query<C, QueryResult<WriteRow<E, W, "update">, Only>> implements ModificationState {
    readonly [__ctx]: C;
    private _only;
    _set?: Record<string, unknown>;
    _unset?: string[];
    _content?: unknown;
    _merge?: unknown;
    _patch?: JsonPatchOp[];
    _replace?: unknown;
    _modificationMode?: ModificationMode;
    private _filter?;
    private _return?;
    private _timeout?;
    private tb;
    private subject;
    constructor(orm: O, subject: T | RecordId<T> | Workable<C, RecordType<T>>);
    get schema(): E;
    get [__type](): QueryResult<WriteRow<E, W, "update">, Only>;
    only(): UpdateQuery<O, C, T, E, true, W>;
    /**
     * Set fields. A SET on an existing record leaves its other fields in place,
     * so those are typed as optional in the result.
     */
    set<const D extends E extends ObjectType ? Partial<SetData<E>> : never>(data: D): UpdateQuery<O, C, T, E, Only, Written<W, "set", D>>;
    /** Remove fields from the record. Removed fields are absent from the result. */
    unset<const F extends readonly (E extends ObjectType ? keyof E["schema"] & string : string)[]>(fields: F): UpdateQuery<O, C, T, E, Only, {
        keys: W["keys"];
        maybe: W["maybe"];
        gone: W["gone"] | F[number];
        mode: W["mode"];
    }>;
    /** Replace the record with the given fields, so the other fields are gone. */
    content<const D extends Partial<WriteData<E>>>(data: D): UpdateQuery<O, C, T, E, Only, Written<NoWrite, "replace", D>>;
    merge<const D extends Partial<WriteData<E>>>(data: D): UpdateQuery<O, C, T, E, Only, Written<W, "set", D>>;
    patch(operations: JsonPatchOp[]): UpdateQuery<O, C, T, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    /** Replace the record. The other fields of the record are gone. */
    replace<const D extends Partial<WriteData<E>>>(data: D): UpdateQuery<O, C, T, E, Only, Written<NoWrite, "replace", D>>;
    where(cb: (tb: Actionable<C, O["tables"][T]["schema"]>) => Workable<C>): this;
    where(filter: WhereObject<C, O["tables"][T]["schema"]>): this;
    /** Remove every `.where()` condition set so far. */
    clearWhere(): this;
    /** The state before the write may not have the fields it set, so only the id is known. */
    return(mode: "before"): UpdateQuery<O, C, T, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    return(mode: "none" | "before" | "after" | "diff"): this;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, WriteRow<E, W, "update">>) => P): UpdateQuery<O, C, T, R, Only, FullWrite>;
    timeout(duration: string): this;
    protected validateInput(): void;
    [__display](inp: DisplayContext): string;
}

/**
 * A fluent UPSERT query builder. Creates the record if it doesn't exist, or
 * updates it if it does. Supports SET, CONTENT, MERGE, PATCH, REPLACE, WHERE,
 * RETURN, and TIMEOUT clauses.
 */
declare class UpsertQuery<O extends Orm, C extends WorkableContext<O>, T extends keyof O["tables"] & string, E extends AbstractType = O["tables"][T]["schema"], Only extends boolean = false, W extends WriteShape = NoWrite> extends Query<C, QueryResult<WriteRow<E, W, "update">, Only>> implements ModificationState {
    readonly [__ctx]: C;
    private _only;
    _set?: Record<string, unknown>;
    _content?: unknown;
    _merge?: unknown;
    _patch?: JsonPatchOp[];
    _replace?: unknown;
    _modificationMode?: ModificationMode;
    private _filter?;
    private _return?;
    private _timeout?;
    private tb;
    private subject;
    constructor(orm: O, subject: T | RecordId<T> | Workable<C, RecordType<T>>);
    get schema(): E;
    get [__type](): QueryResult<WriteRow<E, W, "update">, Only>;
    only(): UpsertQuery<O, C, T, E, true, W>;
    /**
     * Set fields. A SET leaves the fields it does not set in place, or absent if
     * the record is created, so those are typed as optional in the result.
     */
    set<const D extends E extends ObjectType ? Partial<SetData<E>> : never>(data: D): UpsertQuery<O, C, T, E, Only, Written<W, "set", D>>;
    /** Replace the record with the given fields, so the other fields are gone. */
    content<const D extends Partial<WriteData<E>>>(data: D): UpsertQuery<O, C, T, E, Only, Written<NoWrite, "replace", D>>;
    merge<const D extends Partial<WriteData<E>>>(data: D): UpsertQuery<O, C, T, E, Only, Written<W, "set", D>>;
    patch(operations: JsonPatchOp[]): UpsertQuery<O, C, T, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    /** Replace the record. The other fields of the record are gone. */
    replace<const D extends Partial<WriteData<E>>>(data: D): UpsertQuery<O, C, T, E, Only, Written<NoWrite, "replace", D>>;
    where(cb: (tb: Actionable<C, O["tables"][T]["schema"]>) => Workable<C>): this;
    /** Remove every `.where()` condition set so far. */
    clearWhere(): this;
    /** The state before the write may not have the fields it set, so only the id is known. */
    return(mode: "before"): UpsertQuery<O, C, T, E, Only, {
        keys: never;
        maybe: never;
        gone: never;
        mode: "patch";
    }>;
    return(mode: "none" | "before" | "after" | "diff"): this;
    return<P extends Inheritable<C>, R extends InheritableIntoType<C, P> = InheritableIntoType<C, P>>(cb: (tb: Actionable<C, WriteRow<E, W, "update">>) => P): UpsertQuery<O, C, T, R, Only, FullWrite>;
    timeout(duration: string): this;
    protected validateInput(): void;
    [__display](inp: DisplayContext): string;
}

/**
 * Context source for standalone functions.
 * Accepts either a WorkableContext directly or a Workable to extract context from.
 *
 * This type is part of the public surface because it appears in the signatures
 * of the standalone function families.
 */
type ContextSource<C extends WorkableContext = WorkableContext> = C | Workable<C>;

/**
 * Infers the TypeScript types from a tuple of `AbstractType` parameters.
 *
 * @example
 * ```ts
 * type P = InferParams<[StringType, NumberType]>;
 * // => [string, number]
 * ```
 */
type InferParams<P extends AbstractType[]> = {
    [K in keyof P]: P[K]["infer"];
};
/**
 * Maps a tuple of `AbstractType` parameters to a tuple of `Workable` values,
 * used when calling a function within a query context.
 */
type WorkableParams<C extends WorkableContext, P extends AbstractType[]> = {
    [K in keyof P]: Workable<C, P[K]>;
};
/**
 * The shape of a callable user-defined function returned by {@link fn}.
 * Can be called in two ways:
 *
 * 1. **In queries** – pass a `ContextSource` and `Workable` arguments to produce
 *    an `Actionable` that renders as `fn::name(arg1, arg2)` in SurrealQL.
 * 2. **Standalone via `db.run()`** – pass the callable to `db.run()` with raw
 *    values to execute the function on the server.
 *
 * The `.schema` property provides access to the underlying {@link FunctionSchema}.
 */
type FunctionCallable<P extends AbstractType[] = AbstractType[], R extends AbstractType = AbstractType> = (<C extends WorkableContext>(source: ContextSource<C>, ...args: WorkableParams<C, P>) => Actionable<C, R>) & {
    schema: FunctionSchema<P, R>;
};
/**
 * Schema definition for a user-defined SurrealDB function (`DEFINE FUNCTION`).
 * Stores the function name, parameter types, and return type.
 *
 * Use the {@link fn} factory function to create callable instances rather than
 * constructing this class directly.
 *
 * @typeParam P - Tuple of parameter types.
 * @typeParam R - The return type.
 */
declare class FunctionSchema<P extends AbstractType[] = AbstractType[], R extends AbstractType = AbstractType> {
    readonly name: string;
    readonly params: P;
    readonly returns: R;
    constructor(name: string, params: P, returns: R);
}
/**
 * Define a user-defined SurrealDB function schema. Returns a callable that can
 * be used both inside queries (producing `fn::name(...)` in SurrealQL) and
 * passed to `db.run()` for standalone execution.
 *
 * @param name - The function name (without the `fn::` prefix).
 * @param params - A tuple of parameter types.
 * @param returns - The return type.
 * @returns A {@link FunctionCallable} with an attached `.schema` property.
 *
 * @example
 * ```ts
 * const greet = fn("greet", [t.string()], t.string());
 *
 * // In a query
 * db.select("user").return(u => ({ greeting: greet(u, u.name) }));
 *
 * // Standalone
 * const result = await db.run(greet, ["world"]);
 * ```
 */
declare function fn<P extends AbstractType[], R extends AbstractType>(name: string, params: P, returns: R): FunctionCallable<P, R>;

/** Union type representing any table or edge schema. */
type AnyTable<Tb extends string = string> = TableSchema<Tb> | EdgeSchema<string, Tb>;
/** Maps an array of table/edge schemas to a record keyed by table name. */
type MappedTables<T extends AnyTable[]> = {
    [K in T[number]["tb"]]: Extract<T[number], AnyTable<K>>;
} & {};
/**
 * A plain object grouping table/edge schemas under arbitrary keys, e.g. the
 * result of `import * as schema from "./schema"`. The object keys are only a
 * container — tables are still addressed by their `tb` name in queries.
 */
type SchemaMap = Record<string, AnyTable>;
/** Options an {@link Orm} is created with. */
type OrmOptions = {
    /** Validate written data against the table schema before sending it. */
    validate?: boolean;
};
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type LastOf<U> = UnionToIntersection<U extends unknown ? () => U : never> extends () => infer R ? R : never;
type UnionToTuple<U> = [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, LastOf<U>>>, LastOf<U>];
/** The schemas held by a {@link SchemaMap}, as a tuple used as the `Orm` type argument. */
type SchemaMapTables<S extends SchemaMap> = UnionToTuple<S[keyof S]> extends infer R extends AnyTable[] ? R : never;
type ValueTupleTypes<V extends readonly unknown[]> = {
    -readonly [K in keyof V]: ValueType<V[K]>;
};
type ValueArrayType<V extends readonly unknown[]> = V extends readonly [] ? ArrayType<NeverType> : number extends V["length"] ? ArrayType<ValueType<V[number]>> : ValueTupleTypes<V> extends infer T extends AbstractType[] ? ArrayType<T> : never;
type ValueObjectFields<V extends Record<string, unknown>> = {
    [K in keyof V & string]: ValueType<V[K]>;
};
type ValueType<V> = V extends Workable<WorkableContext, infer T> ? T : V extends RecordId<infer Tb> ? RecordType<Tb> : V extends string ? StringType : V extends number ? NumberType : V extends boolean ? BoolType : V extends Date ? DateType : V extends Duration ? DurationType : V extends Uuid ? UuidType : V extends GeometryPoint ? PointType : V extends null ? NullType : V extends undefined ? NoneType : V extends readonly unknown[] ? ValueArrayType<V> : V extends Record<string, unknown> ? ObjectType<ValueObjectFields<V>> : AbstractType;
/**
 * The main ORM entry point. Provides type-safe query builders for all
 * registered tables and edges.
 *
 * Use the {@link orm} factory function to create instances rather than
 * calling the constructor directly.
 */
declare class Orm<T extends AnyTable[] = AnyTable[]> {
    readonly surreal: SurrealConnection;
    readonly tables: MappedTables<T>;
    readonly lookup: CreateSchemaLookup<T>;
    /**
     * Whether queries check the data they write against the table schema before
     * sending it. Off by default; see {@link Orm.validated}.
     */
    readonly validation: boolean;
    constructor(surreal: SurrealConnection, tables: MappedTables<T>, lookup: CreateSchemaLookup<T>, options?: OrmOptions);
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
    validated(enabled?: boolean): Orm<T>;
    /**
     * Wrap a raw JavaScript value as an actionable SurrealQL expression. Record
     * ids keep their table type, so graph traversal can start directly from a
     * value: `db.value(new RecordId("person", "tobie")).out("authored")`.
     */
    value<const V>(value: V): Actionable<WorkableContext<this>, ValueType<V>>;
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
    defineComputed(...tables: (keyof this["tables"] & string)[]): Promise<void>;
    /**
     * Build a SELECT query for a table, record ID, or workable record reference.
     *
     * @param tb - A table name, `RecordId`, workable record, or table name with a second `id` argument.
     * @returns A {@link SelectQuery} that can be further chained or awaited.
     */
    select<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): SelectQuery<this, C, Tb>;
    select<C extends WorkableContext<this>, const Tb extends keyof this["tables"] & string>(tbs: readonly Tb[]): SelectQuery<this, C, Tb>;
    select<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: RecordId<Tb>): SelectQuery<this, C, Tb>;
    select<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: Workable<C, RecordType<Tb>>): SelectQuery<this, C, Tb>;
    select<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(step: Workable<C, GraphType<Tb>>): SelectQuery<this, C, Tb>;
    select<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): SelectQuery<this, C, Tb>;
    /**
     * Open a `LIVE SELECT` subscription for a table, record ID, or workable
     * record reference. Awaiting the returned builder runs the live query and
     * resolves to a {@link LiveSubscription}.
     *
     * @param tb - A table name, `RecordId`, workable record, or table name with a second `id` argument.
     * @returns A {@link LiveQuery} that can be chained (`.where()`, `.return()`, `.fetch()`, `.diff()`) and awaited.
     *
     * @remarks Filtering or projecting a live query relies on query parameters,
     *   which require **SurrealDB ≥ 3.0**.
     */
    live<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): LiveQuery<this, C, Tb>;
    live<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: RecordId<Tb>): LiveQuery<this, C, Tb>;
    live<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: Workable<C, RecordType<Tb>>): LiveQuery<this, C, Tb>;
    live<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): LiveQuery<this, C, Tb>;
    /**
     * Build a CREATE query. Optionally pass a specific record ID.
     *
     * @param tb - The table name.
     * @param id - Optional record ID.
     * @returns A {@link CreateQuery} that can be further chained or awaited.
     */
    create<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): CreateQuery<this, C, Tb>;
    create<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): CreateQuery<this, C, Tb>;
    /**
     * Build an INSERT query. Pass data inline or use the `.fields().values()` API.
     *
     * @param tb - The table name.
     * @param data - Optional record or array of records to insert.
     * @returns An {@link InsertQuery} that can be further chained or awaited.
     */
    insert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, data: unknown | unknown[]): InsertQuery<this, C, Tb>;
    insert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): InsertQuery<this, C, Tb>;
    /**
     * Build an UPDATE query for a table, record ID, or workable record reference.
     *
     * @param tb - A table name, `RecordId`, workable record, or table name with a second `id` argument.
     * @returns An {@link UpdateQuery} that can be further chained or awaited.
     */
    update<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): UpdateQuery<this, C, Tb>;
    update<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: RecordId<Tb>): UpdateQuery<this, C, Tb>;
    update<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: Workable<C, RecordType<Tb>>): UpdateQuery<this, C, Tb>;
    update<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): UpdateQuery<this, C, Tb>;
    /**
     * Build a DELETE query for a table, record ID, or workable record reference.
     *
     * @param tb - A table name, `RecordId`, workable record, or table name with a second `id` argument.
     * @returns A {@link DeleteQuery} that can be further chained or awaited.
     */
    delete<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): DeleteQuery<this, C, Tb>;
    delete<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: RecordId<Tb>): DeleteQuery<this, C, Tb>;
    delete<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: Workable<C, RecordType<Tb>>): DeleteQuery<this, C, Tb>;
    delete<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): DeleteQuery<this, C, Tb>;
    /**
     * Build an UPSERT query for a table, record ID, or workable record reference.
     *
     * @param tb - A table name, `RecordId`, workable record, or table name with a second `id` argument.
     * @returns An {@link UpsertQuery} that can be further chained or awaited.
     */
    upsert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb): UpsertQuery<this, C, Tb>;
    upsert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: RecordId<Tb>): UpsertQuery<this, C, Tb>;
    upsert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(rid: Workable<C, RecordType<Tb>>): UpsertQuery<this, C, Tb>;
    upsert<C extends WorkableContext<this>, Tb extends keyof this["tables"] & string>(tb: Tb, id: RecordIdValue): UpsertQuery<this, C, Tb>;
    /**
     * Build a RELATE query to create a graph edge between records.
     *
     * @param edge - The edge table name (must be an {@link EdgeSchema}).
     * @param from - The source record(s), or a query that yields records, such as
     *   `db.select("user")`.
     * @param to - The target record(s), or a query that yields records.
     * @returns A {@link RelateQuery} that can be further chained or awaited.
     * @throws {OrmError} If `edge` does not refer to an {@link EdgeSchema}.
     */
    relate<C extends WorkableContext<this>, Edge extends keyof this["tables"] & string>(edge: Edge, from: RelateEndpoint<C>, to: RelateEndpoint<C>): RelateQuery<this, C, Edge>;
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
    run<P extends AbstractType[], R extends AbstractType>(fn: FunctionCallable<P, R>, args?: InferParams<P>): Promise<R["infer"]>;
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
    api<E extends ApiEndpointSchema[]>(...endpoints: E): ApiClient<E>;
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
    withSignal(signal: AbortSignal | undefined): Orm<T>;
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
    batch<Q extends Query<any, any>[]>(...queries: Q): BatchQuery<Q>;
    /**
     * Start a transaction. Supports two forms:
     *
     * **Callback form** -- automatically commits on success and cancels on error:
     * ```ts
     * const result = await db.transaction(async (tx) => {
     *   await tx.create("user").set({ ... });
     *   return "done";
     * });
     * ```
     *
     * **Manual form** -- returns a {@link Transaction} for explicit commit/cancel:
     * ```ts
     * const tx = await db.transaction();
     * await tx.create("user").set({ ... });
     * await tx.commit();
     * ```
     */
    transaction<R>(cb: (tx: Transaction<T>) => Promise<R>): Promise<R>;
    transaction(): Promise<Transaction<T>>;
}
/**
 * Create an ORM instance bound to a SurrealDB session and a set of table/edge
 * schemas. This is the main entry point for building type-safe queries.
 *
 * Schemas may be passed either as individual arguments or grouped in a single
 * object — both produce an identical, fully typed ORM. Tables are always
 * addressed by their `tb` name in queries, regardless of how they are passed.
 *
 * @param surreal - An active SurrealDB session, or a request scope made with
 *   `withSignal()`.
 * @param tables - One or more {@link TableSchema} or {@link EdgeSchema} definitions.
 * @returns An {@link Orm} instance with query builders scoped to the provided schemas.
 *
 * @example Individual arguments
 * ```ts
 * const db = orm(new Surreal(), user, post, authored);
 * const users = await db.select("user");
 * ```
 *
 * @example A schema object (handy with `import * as schema`)
 * ```ts
 * // database/schema.ts
 * export const user = table("user", { name: t.string() });
 * export const post = table("post", { title: t.string() });
 *
 * // src/db.ts
 * import * as schema from "../database/schema";
 * const db = orm(new Surreal(), schema);
 * const users = await db.select("user");
 * ```
 */
declare function orm<T extends AnyTable[]>(surreal: SurrealConnection, ...tables: T): Orm<T>;
declare function orm<S extends SchemaMap>(surreal: SurrealConnection, schema: S): Orm<SchemaMapTables<S>>;

/**
 * Marks a field type as a computed (read-only) field. The brand exists only at
 * the type level: a computed field is part of the table's row type (and so of
 * select results), but is left out of every create / update / insert input type.
 */
type Computed<T extends AbstractType> = T & {
    readonly "~computed": true;
};
/** The names of the computed fields in a field map. */
type ComputedKeys<F> = {
    [K in keyof F]: F[K] extends {
        readonly "~computed": true;
    } ? K : never;
}[keyof F];
/**
 * The expression of a computed field. It receives the row being computed
 * (rendered as `$this`) and the ORM, to build subqueries, and returns an
 * expression whose type matches the field's declared type.
 */
type ComputedExpression<Tb extends string, Fd extends TableFields, T extends AbstractType> = (row: string extends keyof Fd ? unknown : Actionable<WorkableContext, ObjectType<WithId<Tb, Fd>>>, db: Orm<any>) => Workable<WorkableContext, T>;
type ComputedDefinition = {
    readonly type: AbstractType;
    readonly expression: ((row: never, db: never) => Workable) | SurqlExpression;
};
/** A record mapping field names to their type definitions. */
type TableFields = Record<string, AbstractType>;
/**
 * The table's fields with `id` filled in.
 *
 * SurrealDB gives every record an `id`, so one is injected when the schema does
 * not declare it. A schema that *does* declare `id` keeps its own — useful when
 * the table generates ids itself, e.g.
 * `id: t.uuid().default(expr("rand::uuid::v7()")).readonly()`.
 */
type WithId<Tb extends string, Fd extends TableFields> = "id" extends keyof Fd ? Fd : Fd & {
    id: RecordType<Tb>;
};
type GetSchemaType<Tb extends string, Fd extends TableFields, I = unknown> = unknown extends I ? ObjectType<WithId<Tb, Fd>> : ModelType<WithId<Tb, Fd>, I>;
type GetInferType<Tb extends string, Fd extends TableFields, I = unknown> = GetSchemaType<Tb, Fd, I>["infer"];
/**
 * Schema definition for a SurrealDB table. Automatically includes a typed `id`
 * field based on the table name. Use the {@link table} factory function to
 * create instances.
 *
 * @typeParam Tb - The table name literal type.
 * @typeParam Fd - The user-defined fields for the table.
 * @typeParam I - The instance type of the class linked to the table, if any.
 */
declare class TableSchema<Tb extends string = string, Fd extends TableFields = any, I = any> {
    readonly tb: Tb;
    readonly _fields: Fd;
    readonly model?: ModelClass | undefined;
    private readonly _computed;
    constructor(tb: Tb, _fields: Fd, model?: ModelClass | undefined, _computed?: Readonly<Record<string, ComputedDefinition>>);
    /** Schema metadata used to generate `DEFINE TABLE`. */
    readonly ddl: Readonly<TableDdl>;
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
    computed<const N extends string, T extends AbstractType>(name: N extends "id" | keyof Fd ? never : N, type: T, expression: ComputedExpression<Tb, Fd, T> | SurqlExpression): TableSchema<Tb, Fd & {
        [K in N]: Computed<T>;
    }, I>;
    /** The names of this table's computed fields. */
    get computedFields(): string[];
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
    rawComputedStatements(overwrite?: boolean): [name: string, sql: string][];
    computedStatements(orm: Orm<any>): string[];
    private _fieldsCache?;
    private _schemaCache?;
    get fields(): WithId<Tb, Fd> & {};
    type: GetInferType<Tb, Fd, I>;
    get schema(): GetSchemaType<Tb, Fd, I>;
    /** Type-guard that checks whether a value matches this table's schema. */
    validate(value: unknown): value is GetInferType<Tb, Fd, I>;
    /**
     * Check `data` against this table's schema without throwing, listing
     * every field that fails rather than only the first. The `mode` says what
     * the data is: `"create"` (default) is the input of a create or insert,
     * where fields with a `.default()` or of type `option<...>` may be left out
     * and computed fields are rejected; `"update"` is a partial write; `"row"` is a whole stored
     * record. On success, `data` is typed accordingly.
     *
     * The data is returned as given: validation does not convert it. The one
     * exception is `"row"` mode on a table linked to a class, where the data is
     * hydrated into an instance of the class, as selects do.
     */
    safeParse(data: unknown, options?: {
        mode?: "create";
    }): SafeParseResult<CreateInput<GetSchemaType<Tb, Fd, I>>>;
    safeParse(data: unknown, options: {
        mode: "update";
    }): SafeParseResult<Partial<WriteData<GetSchemaType<Tb, Fd, I>>>>;
    safeParse(data: unknown, options: {
        mode: "row";
    }): SafeParseResult<GetInferType<Tb, Fd, I>>;
    /**
     * Like {@link TableSchema.safeParse}, but returns the typed data or throws.
     *
     * @throws {ValidationError} Listing every field that fails.
     */
    parse(data: unknown, options?: {
        mode?: "create";
    }): CreateInput<GetSchemaType<Tb, Fd, I>>;
    parse(data: unknown, options: {
        mode: "update";
    }): Partial<WriteData<GetSchemaType<Tb, Fd, I>>>;
    parse(data: unknown, options: {
        mode: "row";
    }): GetInferType<Tb, Fd, I>;
    /** Enforce the declared fields, rejecting anything else. This is the default. */
    schemafull(): this;
    /** Allow fields beyond those declared. */
    schemaless(): this;
    /** Discard every record written to this table (`DROP`). */
    drop(): this;
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
    permissions(rules: TablePermissions<ObjectType<WithId<Tb, Fd>>>): this;
    /** Retain a change feed for `duration` (e.g. `"3d"`). */
    changefeed(duration: string, includeOriginal?: boolean): this;
    /** Make this a computed view over another table (`AS SELECT …`). */
    view(selectStatement: string): this;
    /** Attach a `COMMENT` to the table. */
    comment(text: string): this;
    /**
     * Add an index.
     *
     * @param name - The index name
     * @param options - What to index and how
     */
    index(name: string, options: IndexOptions): this;
    /**
     * Add an event.
     *
     * @param name - The event name
     * @param options - What fires it and what it does
     */
    event(name: string, options: EventOptions): this;
}
/**
 * Define a SurrealDB table schema. An `id` field of type `RecordType<Tb>` is
 * automatically added.
 *
 * @param tb - The table name.
 * @param fields - A record of field names to type definitions.
 * @param model - Optionally, a class to link to the table. Rows read from the
 *   table are then instances of the class (so its methods and getters are
 *   available), and instances of it are accepted as record content. The class
 *   constructor is not run when hydrating a row.
 * @returns A {@link TableSchema} instance.
 *
 * @example
 * ```ts
 * const user = table("user", {
 *   name: t.string(),
 *   age: t.number(),
 *   email: t.string(),
 * });
 * ```
 */
declare function table<Tb extends string, Fd extends Record<Exclude<string, "id">, AbstractType>, M extends ModelClass = never>(tb: Tb extends string ? Tb : never, fields: Fd, model?: M): TableSchema<Tb, Fd, [M] extends [never] ? unknown : InstanceType<M>>;

type SetValue<T extends AbstractType> = T["infer"] | {
    "+=": T["infer"];
} | {
    "-=": T["infer"];
};

/**
 * Every field path of a schema as a dotted string: each top-level field, and
 * each field of a nested object (`name`, `name.first`).
 */
type FieldPath<S, Prefix extends string = ""> = {
    [K in keyof S & string]: `${Prefix}${K}` | (ObjectOf<S[K]> extends infer Inner ? [Inner] extends [never] ? never : FieldPath<Inner, `${Prefix}${K}.`> : never);
}[keyof S & string];
/**
 * The fields of an object type, looking through one `option<…>` so that a
 * nested `t.option(t.object(…))` can be set by its dotted paths too. `never` for
 * anything that is not an object.
 */
type ObjectOf<T> = T extends ObjectType<infer Inner> ? Inner : T extends OptionType<infer Inner extends AbstractType> ? Inner extends ObjectType<infer Fields> ? Fields : never : never;
/** The type of the field at a dotted `Path` in a schema, or `never` if there is none. */
type PathType<S, Path extends string> = Path extends keyof S ? S[Path] : Path extends `${infer Head}.${infer Rest}` ? Head extends keyof S ? ObjectOf<S[Head]> extends infer Inner ? [Inner] extends [never] ? never : PathType<Inner, Rest> : never : never : never;
/**
 * The dotted paths into nested object fields (`"name.first"`), each taking the
 * value its field takes. Top-level fields are in {@link SetData} itself.
 */
type DottedSetData<S> = {
    [P in Extract<FieldPath<S>, `${string}.${string}`>]?: PathType<S, P> extends infer F extends AbstractType ? SetValue<F> : never;
};
/**
 * The dotted keys of `D` whose parent object is not also a key of `D`. Each maps
 * to `never`, so `D & OrphanDottedKeys<D>` rejects them: a CREATE or RELATE
 * would otherwise store a partial object that cannot be read back in full.
 */
type OrphanDottedKeys<D> = {
    [K in keyof D as K extends `${infer Root}.${string}` ? Root extends keyof D ? never : K : never]: never;
};
/**
 * The fields a write may set: every field except the computed (read-only) ones,
 * and the dotted paths into nested object fields.
 */
type SetData<T extends ObjectType> = {
    [K in Exclude<keyof T["schema"], ComputedKeys<T["schema"]>>]?: SetValue<T["schema"][K]>;
} & DottedSetData<T["schema"]>;
/** A field that may be left out on create: it has a default or accepts `NONE`. */
type OptionalOnCreate<F extends AbstractType> = F extends HasDefault ? true : undefined extends F["infer"] ? true : false;
/**
 * Input for creating a record: every field except `id`. Fields that carry a
 * `.default()` (or are `option<…>`) are optional.
 */
type CreateInput<T extends ObjectType> = {
    [K in Exclude<keyof T["schema"], "id" | ComputedKeys<T["schema"]>> as OptionalOnCreate<T["schema"][K]> extends true ? never : K]: T["schema"][K]["infer"];
} & {
    [K in Exclude<keyof T["schema"], "id" | ComputedKeys<T["schema"]>> as OptionalOnCreate<T["schema"][K]> extends true ? K : never]?: T["schema"][K]["infer"];
} & {};
/** The record a write may supply: `E["infer"]` without its computed fields. */
type WriteData<E extends AbstractType> = E extends ObjectType ? Omit<E["infer"], ComputedKeys<E["schema"]>> : E["infer"];
type JsonPatchOp = {
    op: "add";
    path: string;
    value: unknown;
} | {
    op: "remove";
    path: string;
} | {
    op: "replace";
    path: string;
    value: unknown;
} | {
    op: "move";
    from: string;
    path: string;
} | {
    op: "copy";
    from: string;
    path: string;
} | {
    op: "test";
    path: string;
    value: unknown;
};
type ModificationMode = "set" | "content" | "merge" | "patch" | "replace";
interface ModificationState {
    _set?: Record<string, unknown>;
    _unset?: string[];
    _content?: unknown;
    _merge?: unknown;
    _patch?: JsonPatchOp[];
    _replace?: unknown;
    _modificationMode?: ModificationMode;
}

/** A record mapping field names (excluding `id`, `in`, `out`) to their type definitions. */
type EdgeFields = Record<Exclude<string, "id" | "in" | "out">, AbstractType>;
type GetEdgeSchemaType<From extends string, Tb extends string, To extends string, Fd extends EdgeFields> = ObjectType<Fd & {
    id: RecordType<Tb>;
    in: RecordType<From>;
    out: RecordType<To>;
}>;
type GetEdgeInferType<From extends string, Tb extends string, To extends string, Fd extends EdgeFields> = GetEdgeSchemaType<From, Tb, To, Fd>["infer"];
/**
 * Schema definition for a SurrealDB edge (graph relationship) table.
 * Automatically includes typed `id`, `in`, and `out` fields. Use the
 * {@link edge} factory function to create instances.
 *
 * @typeParam From - The source table name, or a union of names.
 * @typeParam Tb - The edge table name.
 * @typeParam To - The target table name, or a union of names.
 * @typeParam Fd - The user-defined fields for the edge.
 */
declare class EdgeSchema<From extends string = string, Tb extends string = string, To extends string = string, Fd extends EdgeFields = EdgeFields> {
    readonly from: From | readonly From[];
    readonly tb: Tb;
    readonly to: To | readonly To[];
    readonly _fields: Fd;
    constructor(from: From | readonly From[], tb: Tb, to: To | readonly To[], _fields: Fd);
    /** Schema metadata used to generate `DEFINE TABLE … TYPE RELATION`. */
    readonly ddl: Readonly<TableDdl>;
    private _fieldsCache?;
    private _schemaCache?;
    get fields(): Fd & {
        id: RecordType<Tb>;
        in: RecordType<From>;
        out: RecordType<To>;
    } & {};
    type: GetEdgeInferType<From, Tb, To, Fd>;
    get schema(): GetEdgeSchemaType<From, Tb, To, Fd>;
    /** Type-guard that checks whether a value matches this edge's schema. */
    validate(value: unknown): value is GetEdgeInferType<From, Tb, To, Fd>;
    /** Enforce the declared fields, rejecting anything else. This is the default. */
    schemafull(): this;
    /** Allow fields beyond those declared. */
    schemaless(): this;
    /**
     * Reject edges whose `in` or `out` record does not exist (`ENFORCED`).
     *
     * Without this SurrealDB will happily create an edge pointing at nothing.
     */
    enforced(): this;
    /**
     * Set the edge table's `PERMISSIONS`: a SurrealQL clause as a string, or a
     * rule per operation, each `"full"`, `"none"`, SurrealQL, or a typed
     * condition built with `where()` over the edge's fields (`in` and `out`
     * included).
     */
    permissions(rules: TablePermissions<GetEdgeSchemaType<From, Tb, To, Fd>>): this;
    /** Retain a change feed for `duration` (e.g. `"3d"`). */
    changefeed(duration: string, includeOriginal?: boolean): this;
    /** Attach a `COMMENT` to the edge table. */
    comment(text: string): this;
    /**
     * Add an index.
     *
     * @param name - The index name
     * @param options - What to index and how
     */
    index(name: string, options: IndexOptions): this;
    /**
     * Add an event.
     *
     * @param name - The event name
     * @param options - What fires it and what it does
     */
    event(name: string, options: EventOptions): this;
    /**
     * Check `data` against this edge's schema without throwing, listing
     * every field that fails rather than only the first. The `mode` says what
     * the data is: `"create"` (default) is the input of a create or insert,
     * where fields with a `.default()` or of type `option<...>` may be left out
     * and `id`, `in` and `out` are not required; `"update"` is a partial write; `"row"` is a whole stored
     * record. On success, `data` is typed accordingly.
     *
     * The data is returned as given: validation does not convert it.
     */
    safeParse(data: unknown, options?: {
        mode?: "create";
    }): SafeParseResult<Omit<CreateInput<GetEdgeSchemaType<From, Tb, To, Fd>>, "in" | "out">>;
    safeParse(data: unknown, options: {
        mode: "update";
    }): SafeParseResult<Partial<WriteData<GetEdgeSchemaType<From, Tb, To, Fd>>>>;
    safeParse(data: unknown, options: {
        mode: "row";
    }): SafeParseResult<GetEdgeInferType<From, Tb, To, Fd>>;
    /**
     * Like {@link EdgeSchema.safeParse}, but returns the typed data or throws.
     *
     * @throws {ValidationError} Listing every field that fails.
     */
    parse(data: unknown, options?: {
        mode?: "create";
    }): Omit<CreateInput<GetEdgeSchemaType<From, Tb, To, Fd>>, "in" | "out">;
    parse(data: unknown, options: {
        mode: "update";
    }): Partial<WriteData<GetEdgeSchemaType<From, Tb, To, Fd>>>;
    parse(data: unknown, options: {
        mode: "row";
    }): GetEdgeInferType<From, Tb, To, Fd>;
}
/**
 * Define a SurrealDB edge (graph relationship) table schema. Fields `id`, `in`,
 * and `out` are automatically added with the appropriate record types.
 *
 * @param from - The source table name, or an array of names for an edge that
 *   may originate from any of several tables (`in` becomes `record<a | b>`).
 * @param tb - The edge table name.
 * @param to - The target table name, or an array of names for an edge that may
 *   point at any of several tables (`out` becomes `record<a | b>`).
 * @param fields - A record of additional field names to type definitions.
 * @returns An {@link EdgeSchema} instance.
 *
 * @example
 * ```ts
 * const authored = edge("user", "authored", "post", {
 *   created: t.date(),
 * });
 *
 * // An edge whose source may be a post or a user:
 * const tagged = edge(["post", "user"], "tagged", "tag", {});
 * ```
 */
declare function edge<const From extends string, Tb extends string, const To extends string, Fd extends Record<Exclude<string, "id" | "in" | "out">, AbstractType>>(from: From | readonly From[], tb: Tb extends string ? Tb : never, to: To | readonly To[], fields: Fd): EdgeSchema<From, Tb, To, Fd>;

/**
 * DDL metadata carried alongside a field's type.
 *
 * Surqlize's type objects describe what a value *is*, which is everything the
 * query builder needs. Generating `DEFINE FIELD` needs more: constraints,
 * defaults, permissions and so on. That extra information lives here, attached
 * to the type but deliberately separate from it — nothing in this file affects
 * the inferred TypeScript type of a field.
 */
/**
 * What SurrealDB should do to a record when the row it references is deleted.
 *
 * These are the only forms SurrealDB 3.2 parses. `SET NULL`, `SET DEFAULT` and
 * `RESTRICT` — the SQL spellings, and the ones smig offered — are all parse
 * errors; `UNSET` is what removes the link, and `REJECT` is what blocks the
 * delete.
 *
 * `THEN <expression>` runs arbitrary SurrealQL against the referencing record,
 * e.g. `` `THEN $this.status = 'orphaned'` ``.
 */
type OnDeleteAction = "CASCADE" | "IGNORE" | "REJECT" | "UNSET" | `THEN ${string}`;
/** A `DEFAULT` clause, and whether it re-applies on update (`DEFAULT ALWAYS`). */
interface FieldDefault {
    value: unknown;
    always: boolean;
    /**
     * `value` is SurrealQL (from `expr()`), rendered as written rather than as
     * data. Without it a string is always a string: `"time::now()"` stores those
     * characters, and `expr("time::now()")` calls the function.
     */
    expression?: boolean;
}
/** A `REFERENCE` clause and its deletion behaviour. */
interface FieldReference {
    /** The referenced table. Omitted for a bare `REFERENCE`. */
    table?: string;
    onDelete?: OnDeleteAction;
}
/**
 * Everything a field can carry beyond its type.
 *
 * Every property is optional; a field that has never been given a schema
 * modifier has an empty object here, and generates a bare `DEFINE FIELD`.
 */
interface FieldDdl {
    /** `ASSERT` conditions, joined with `AND` when more than one is given. */
    assert?: string[];
    default?: FieldDefault;
    /** A `VALUE` expression, evaluated on write. */
    value?: string;
    /** A `VALUE { … }` expression, deferred until read. */
    computed?: string;
    readonly?: boolean;
    flexible?: boolean;
    /** A SurrealQL `PERMISSIONS` clause, or a rule per operation (typed or SurrealQL). */
    permissions?: FieldPermissions;
    comment?: string;
    reference?: FieldReference;
    /** Previous names, used to migrate a rename instead of dropping the field. */
    previousNames?: string[];
}

declare const __display: unique symbol;
declare const __type: unique symbol;
declare const __ctx: unique symbol;
type Workable<C extends WorkableContext = WorkableContext, T extends AbstractType = AbstractType> = {
    [__display]: (ctx: DisplayContext) => string;
    [__type]: T;
    [__ctx]: C;
};
type WorkableContext<O extends Orm<any> = Orm<any>> = {
    orm: O;
    id: symbol;
};
type IntoWorkable<C extends WorkableContext, T extends AbstractType = AbstractType> = T["infer"] | Workable<C, T>;

/** A single inheritable value: a workable field reference or a plain object. */
type InheritableElement<C extends WorkableContext> = Workable<C> | InheritableObject<C>;
type InheritableObject<C extends WorkableContext> = {
    [key: string]: Inheritable<C>;
};
/**
 * A composable return value for query projections. Can be a single field
 * reference, a plain object of inheritable values, or an array of elements.
 *
 * Arrays contain {@link InheritableElement} (not full `Inheritable`) to avoid
 * an infinite type cycle — nested arrays are handled at runtime but not at the
 * type level. Objects inside arrays, and arrays inside objects, are both
 * supported.
 */
type Inheritable<C extends WorkableContext> = InheritableElement<C> | readonly InheritableElement<C>[];
type InheritableIntoType<C extends WorkableContext, T extends Inheritable<C>> = T extends Workable<C, infer U> ? U : T extends readonly (infer E extends Inheritable<C>)[] ? ArrayType<InheritableIntoType<C, E>> : T extends InheritableObject<C> ? ObjectType<{
    [K in keyof T]: InheritableIntoType<C, T[K]>;
}> : never;

type At<T extends unknown[], N extends number> = T extends [
    ...infer Rest,
    infer Last
] ? N extends -1 ? Last : Rest extends [...unknown[], infer SecondLast] ? N extends -2 ? SecondLast : T[N & keyof T] : T[N & keyof T] : never;

/**
 * The distance metrics `knn()` accepts. SurrealQL takes them bare inside
 * `<|k,METRIC|>`, so they are whitelisted rather than interpolated as given.
 */
declare const KNN_METRICS: readonly ["EUCLIDEAN", "COSINE", "MANHATTAN", "CHEBYSHEV"];
type KnnMetric = (typeof KNN_METRICS)[number];
/**
 * How `knn()` searches: brute force over a metric (`{ metric }`), or through an
 * index with a search width (`{ ef }`, HNSW `ef` or DiskANN `L`). SurrealQL has
 * no form without one of the two.
 */
type KnnOptions = {
    metric: KnnMetric;
    ef?: never;
} | {
    ef: number;
    metric?: never;
};
type VectorFunctions = {
    knn<C extends WorkableContext>(this: Workable<C, ArrayType<NumberType>>, query: IntoWorkable<C, ArrayType<NumberType>>, k: number, options: KnnOptions): Actionable<C, BoolType>;
};
type Functions$7 = {
    contains<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, UnionType<T>>): Actionable<C, BoolType>;
    contains<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    containsNot<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, UnionType<T>>): Actionable<C, BoolType>;
    containsNot<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    containsAll<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    containsAll<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    containsAny<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    containsAny<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    containsNone<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    containsNone<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    allInside<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    allInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    anyInside<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    anyInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    noneInside<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    noneInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, ArrayType<T>>): Actionable<C, BoolType>;
    add<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<T>>;
    append<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<T>>;
    prepend<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<T>>;
    push<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<T>>;
    insert<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>, pos: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    remove<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, pos: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    pop<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, OptionType<T>>;
    reverse<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    shuffle<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sort<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sortAsc<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sortDesc<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sortLexical<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sortNatural<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    sortNaturalLexical<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    distinct<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    flatten<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    group<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    fill<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<T>>;
    swap<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, a: IntoWorkable<C, NumberType>, b: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    combine<C extends WorkableContext, T extends AbstractType, U extends AbstractType>(this: Workable<C, ArrayType<T>>, other: Workable<C, ArrayType<U>>): Actionable<C, ArrayType<ArrayType<[T, U]>>>;
    complement<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    concat<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    difference<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    intersect<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    union<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    transpose<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<T>>;
    booleanAnd<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C, ArrayType<T>>): Actionable<C, ArrayType<BoolType>>;
    booleanOr<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C, ArrayType<T>>): Actionable<C, ArrayType<BoolType>>;
    booleanXor<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C, ArrayType<T>>): Actionable<C, ArrayType<BoolType>>;
    booleanNot<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, ArrayType<BoolType>>;
    logicalAnd<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    logicalOr<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    logicalXor<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, other: IntoWorkable<C>): Actionable<C, ArrayType<T>>;
    first<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, T>;
    last<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, T>;
    max<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, T>;
    min<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, T>;
    findIndex<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, NumberType>;
    filterIndex<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, v: IntoWorkable<C, T>): Actionable<C, ArrayType<NumberType>>;
    clump<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, size: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    arrayJoin<C extends WorkableContext>(this: Workable<C, ArrayType>, delimiter: IntoWorkable<C, StringType>): Actionable<C, StringType>;
    /** Elements from `start` up to `end` (exclusive); without `end`, the rest. */
    slice<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, start: IntoWorkable<C, NumberType>, end?: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    isEmpty<C extends WorkableContext>(this: Workable<C, ArrayType>): Actionable<C, BoolType>;
    windows<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, size: IntoWorkable<C, NumberType>): Actionable<C, ArrayType<T>>;
    map<C extends WorkableContext, T extends AbstractType[], R extends Inheritable<C>>(this: Workable<C, ArrayType<T>>, cb: (item: Actionable<C, UnionType<T>>, index: Actionable<C, NumberType>) => R): Actionable<C, ArrayType<InheritableIntoType<C, R>>>;
    map<C extends WorkableContext, T extends AbstractType, R extends Inheritable<C>>(this: Workable<C, ArrayType<T>>, cb: (item: Actionable<C, T>, index: Actionable<C, NumberType>) => R): Actionable<C, ArrayType<InheritableIntoType<C, R>>>;
    at<C extends WorkableContext, T extends AbstractType[], N extends number>(this: Workable<C, ArrayType<T>>, n: IntoWorkable<C, LiteralType<N>>): Actionable<C, At<T, N>>;
    at<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>, n: IntoWorkable<C, NumberType>): Actionable<C, OptionType<UnionType<T>>>;
    at<C extends WorkableContext, T extends AbstractType, N extends number>(this: Workable<C, ArrayType<T>>, n: IntoWorkable<C, LiteralType<N>>): Actionable<C, OptionType<T>>;
    at<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>, n: IntoWorkable<C, NumberType>): Actionable<C, OptionType<T>>;
    val<C extends WorkableContext, T extends AbstractType[]>(this: Workable<C, ArrayType<T>>): Actionable<C, OptionType<UnionType<T>>>;
    val<C extends WorkableContext, T extends AbstractType>(this: Workable<C, ArrayType<T>>): Actionable<C, OptionType<T>>;
    len<C extends WorkableContext>(this: Workable<C, ArrayType>): Actionable<C, NumberType>;
};

type Functions$6 = {
    day<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    hour<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    minute<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    second<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    month<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    year<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    week<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    wday<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    yday<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    unix<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    millis<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    micros<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, NumberType>;
    nano<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, BigIntType>;
    timeCeil<C extends WorkableContext>(this: Workable<C, DateType>, duration: IntoWorkable<C, DurationType>): Actionable<C, DateType>;
    timeFloor<C extends WorkableContext>(this: Workable<C, DateType>, duration: IntoWorkable<C, DurationType>): Actionable<C, DateType>;
    timeRound<C extends WorkableContext>(this: Workable<C, DateType>, duration: IntoWorkable<C, DurationType>): Actionable<C, DateType>;
    format<C extends WorkableContext>(this: Workable<C, DateType>, fmt: IntoWorkable<C, StringType>): Actionable<C, StringType>;
    timeGroup<C extends WorkableContext>(this: Workable<C, DateType>, interval: IntoWorkable<C, StringType>): Actionable<C, DateType>;
    isLeapYear<C extends WorkableContext>(this: Workable<C, DateType>): Actionable<C, BoolType>;
};

type Functions$5 = {
    select<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, GraphType<Tb>>): SelectQuery<C["orm"], C, Tb>;
    out<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "out">>(this: Workable<C, GraphType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "out", Args>>>;
    in<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "in">>(this: Workable<C, GraphType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "in", Args>>>;
    both<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "both">>(this: Workable<C, GraphType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "both", Args>>>;
    /** Number of records the traversal lands on (`array::len`). */
    len<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, GraphType<Tb>>): Actionable<C, NumberType>;
    /** Whether the traversal lands on no records (`array::is_empty`). */
    isEmpty<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, GraphType<Tb>>): Actionable<C, BoolType>;
    /** Whether the traversal result contains a given record (`CONTAINS`). */
    contains<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, GraphType<Tb>>, v: IntoWorkable<C>): Actionable<C, BoolType>;
};

type Functions$4 = {
    abs<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    ceil<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    floor<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    round<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    fixed<C extends WorkableContext>(this: Workable<C, NumberType>, places: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
    sign<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    sqrt<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    pow<C extends WorkableContext>(this: Workable<C, NumberType>, exp: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
    cos<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    sin<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    tan<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    cot<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    acos<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    asin<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    atan<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    acot<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    ln<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    log<C extends WorkableContext>(this: Workable<C, NumberType>, base: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
    log10<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    log2<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    deg2rad<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    rad2deg<C extends WorkableContext>(this: Workable<C, NumberType>): Actionable<C, NumberType>;
    lerp<C extends WorkableContext>(this: Workable<C, NumberType>, to: IntoWorkable<C, NumberType>, fraction: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
    lerpangle<C extends WorkableContext>(this: Workable<C, NumberType>, to: IntoWorkable<C, NumberType>, fraction: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
    clamp<C extends WorkableContext>(this: Workable<C, NumberType>, min: IntoWorkable<C, NumberType>, max: IntoWorkable<C, NumberType>): Actionable<C, NumberType>;
};

type Functions$3 = {
    map<C extends WorkableContext, T extends AbstractType, R extends AbstractType>(this: Workable<C, OptionType<T>>, cb: (arg: Actionable<C, T>) => Workable<C, R>): Actionable<C, OptionType<R>>;
    unwrap<C extends WorkableContext, T extends AbstractType>(this: Workable<C, OptionType<T>>): Actionable<C, T>;
    unwrapOr<C extends WorkableContext, T extends AbstractType>(this: Workable<C, OptionType<T>>, fallback: IntoWorkable<C, T>): Actionable<C, T>;
    isNone<C extends WorkableContext, T extends AbstractType>(this: Workable<C, OptionType<T>>): Actionable<C, BoolType>;
    isSome<C extends WorkableContext, T extends AbstractType>(this: Workable<C, OptionType<T>>): Actionable<C, BoolType>;
    isSomeAnd<C extends WorkableContext, T extends AbstractType>(this: Workable<C, OptionType<T>>, cb: (value: Actionable<C, T>) => Workable<C, BoolType>): Actionable<C, BoolType>;
};

type Functions$2 = {
    select<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, RecordType<Tb>>): SelectQuery<C["orm"], C, Tb>;
    out<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "out">>(this: Workable<C, RecordType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "out", Args>>>;
    in<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "in">>(this: Workable<C, RecordType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "in", Args>>>;
    both<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string, const Args extends GraphArgs<C, Tb, "both">>(this: Workable<C, RecordType<Tb>>, ...args: Args): Actionable<C, GraphType<GraphSegmentResult<C, Tb, "both", Args>>>;
    /** Repeat a step over a depth: `.{depth}(step)`. See `RecursiveTraversal`. */
    recurse<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, RecordType<Tb>>, depth: RecursionDepth, body: RecursionBody<C, Tb>): Actionable<C, GraphType<Tb>>;
    /** Unique nodes reached within a depth: `.{depth+collect}(step)`. */
    collect<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, RecordType<Tb>>, depth: RecursionDepth, body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, GraphType<Tb>>;
    collect<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, RecordType<Tb>>, body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, GraphType<Tb>>;
    /** Shortest path to a record: `.{..+shortest=target}(step)`, or `NONE`. */
    shortest<C extends WorkableContext, Tb extends keyof C["orm"]["tables"] & string>(this: Workable<C, RecordType<Tb>>, target: IntoWorkable<C, RecordType<Tb>>, body: RecursionBody<C, Tb>, options?: RecursionOptions): Actionable<C, OptionType<GraphType<Tb>>>;
};

type Functions$1 = {
    contains<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    containsNot<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, T>): Actionable<C, BoolType>;
    containsAll<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    containsAny<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    containsNone<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    allInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    anyInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    noneInside<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, SetType<T>>): Actionable<C, BoolType>;
    add<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, T>): Actionable<C, SetType<T>>;
    remove<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, v: IntoWorkable<C, T>): Actionable<C, SetType<T>>;
    complement<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, other: IntoWorkable<C, SetType<T>>): Actionable<C, SetType<T>>;
    difference<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, other: IntoWorkable<C, SetType<T>>): Actionable<C, SetType<T>>;
    intersect<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, other: IntoWorkable<C, SetType<T>>): Actionable<C, SetType<T>>;
    union<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, other: IntoWorkable<C, SetType<T>>): Actionable<C, SetType<T>>;
    flatten<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>): Actionable<C, SetType<T>>;
    filter<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, predicate: IntoWorkable<C>): Actionable<C, SetType<T>>;
    slice<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, start?: IntoWorkable<C, NumberType>, end?: IntoWorkable<C, NumberType>): Actionable<C, SetType<T>>;
    map<C extends WorkableContext, T extends AbstractType, R extends Inheritable<C>>(this: Workable<C, SetType<T>>, cb: (item: Actionable<C, T>, index: Actionable<C, NumberType>) => R): Actionable<C, SetType<InheritableIntoType<C, R>>>;
    at<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, n: IntoWorkable<C, NumberType>): Actionable<C, OptionType<T>>;
    find<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>, predicate: IntoWorkable<C>): Actionable<C, OptionType<T>>;
    first<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>): Actionable<C, OptionType<T>>;
    last<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>): Actionable<C, OptionType<T>>;
    max<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>): Actionable<C, OptionType<T>>;
    min<C extends WorkableContext, T extends AbstractType>(this: Workable<C, SetType<T>>): Actionable<C, OptionType<T>>;
    isEmpty<C extends WorkableContext>(this: Workable<C, SetType>): Actionable<C, BoolType>;
    join<C extends WorkableContext>(this: Workable<C, SetType>, separator: IntoWorkable<C, StringType>): Actionable<C, StringType>;
    len<C extends WorkableContext>(this: Workable<C, SetType>): Actionable<C, NumberType>;
    all<C extends WorkableContext>(this: Workable<C, SetType>, predicate?: IntoWorkable<C>): Actionable<C, BoolType>;
    any<C extends WorkableContext>(this: Workable<C, SetType>, predicate?: IntoWorkable<C>): Actionable<C, BoolType>;
};

type Functions = {
    search<C extends WorkableContext>(this: Workable<C, StringType>, value: IntoWorkable<C, StringType>, ref?: number): Actionable<C, BoolType>;
    startsWith<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, StringType>): Actionable<C, BoolType>;
    endsWith<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, StringType>): Actionable<C, BoolType>;
    len<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, NumberType>;
    join<C extends WorkableContext>(this: Workable<C, StringType>, separator: IntoWorkable<C, StringType>, ...others: [IntoWorkable<C, StringType>, ...IntoWorkable<C, StringType>[]]): Actionable<C, StringType>;
    capitalize<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    concat<C extends WorkableContext>(this: Workable<C, StringType>, ...values: IntoWorkable<C, StringType>[]): Actionable<C, StringType>;
    contains<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, StringType>): Actionable<C, BoolType>;
    lowercase<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    uppercase<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    trim<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    repeat<C extends WorkableContext>(this: Workable<C, StringType>, n: IntoWorkable<C, NumberType>): Actionable<C, StringType>;
    replace<C extends WorkableContext>(this: Workable<C, StringType>, from: IntoWorkable<C, StringType>, to: IntoWorkable<C, StringType>): Actionable<C, StringType>;
    reverse<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    slice<C extends WorkableContext>(this: Workable<C, StringType>, start: IntoWorkable<C, NumberType>, length: IntoWorkable<C, NumberType>): Actionable<C, StringType>;
    slug<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    split<C extends WorkableContext>(this: Workable<C, StringType>, delimiter: IntoWorkable<C, StringType>): Actionable<C, ArrayType<StringType>>;
    words<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, ArrayType<StringType>>;
    matches<C extends WorkableContext>(this: Workable<C, StringType>, pattern: IntoWorkable<C, StringType>): Actionable<C, BoolType>;
    distanceDamerauLevenshtein<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    distanceNormalizedDamerauLevenshtein<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    distanceHamming<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    distanceLevenshtein<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    distanceNormalizedLevenshtein<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    distanceOsa<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    htmlEncode<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    htmlSanitize<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    isAlphanum<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isAlpha<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isAscii<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isDatetime<C extends WorkableContext>(this: Workable<C, StringType>, format: IntoWorkable<C, StringType>): Actionable<C, BoolType>;
    isDomain<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isEmail<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isHexadecimal<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isIp<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isIpv4<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isIpv6<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isLatitude<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isLongitude<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isNumeric<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isRecord<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isSemver<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isUlid<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isUrl<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    isUuid<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, BoolType>;
    semverCompare<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    semverMajor<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, NumberType>;
    semverMinor<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, NumberType>;
    semverPatch<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, NumberType>;
    semverIncMajor<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    semverIncMinor<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    semverIncPatch<C extends WorkableContext>(this: Workable<C, StringType>): Actionable<C, StringType>;
    semverSetMajor<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, NumberType>): Actionable<C, StringType>;
    semverSetMinor<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, NumberType>): Actionable<C, StringType>;
    semverSetPatch<C extends WorkableContext>(this: Workable<C, StringType>, v: IntoWorkable<C, NumberType>): Actionable<C, StringType>;
    similarityFuzzy<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    similarityJaro<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
    similarityJaroWinkler<C extends WorkableContext>(this: Workable<C, StringType>, other: IntoWorkable<C, StringType>): Actionable<C, NumberType>;
};

interface BaseFunctions {
    any: Functions$8;
    array: Functions$7;
    date: Functions$6;
    graph: Functions$5;
    number: Functions$4;
    option: Functions$3;
    point: object;
    record: Functions$2;
    set: Functions$1;
    string: Functions;
}
type GetFunctions<C extends WorkableContext, T extends AbstractType> = BaseFunctions["any"] & (T extends ArrayType<NumberType> ? VectorFunctions : unknown) & (T["name"] extends keyof BaseFunctions ? BaseFunctions[T["name"]] : Record<string, (...args: IntoWorkable<C>[]) => Actionable<C, AbstractType>>);

/**
 * The merged field map a record link `record<Tb>` exposes for property access:
 * a single table's fields, or the {@link MergeFields | merged} fields of a
 * multi-table link (`record<"a" | "b">`). Mirrors the runtime resolution in
 * `workableGet`'s `resolveAccessType`.
 */
type RecordFields<C extends WorkableContext, Tb extends string> = TableFieldsOf<C, Tb> extends ObjectType<infer O> ? MergeFields<O> : never;
type UnionObjectFields<T extends AbstractType> = T extends ObjectType<infer O> ? O : never;
type UnionFields<Members extends AbstractType[]> = MergeFields<UnionObjectFields<Members[number]>>;
/** Field props for an `option<Inner>`: like `Inner`'s, but each kept optional. */
type OptionalProps<C extends WorkableContext, Inner extends AbstractType> = Inner extends ObjectType<infer O> ? {
    [K in keyof O]: Actionable<C, OptionType<O[K] & AbstractType>>;
} : [Inner] extends [RecordType<infer Tb extends string>] ? {
    [K in keyof RecordFields<C, Tb>]: Actionable<C, OptionType<RecordFields<C, Tb>[K] & AbstractType>>;
} : ActionableProps<C, Inner>;
type ActionableProps<C extends WorkableContext, T extends AbstractType> = T extends OptionType<infer Inner> ? OptionalProps<C, Inner> : T extends ObjectType<infer O> ? {
    [K in keyof O]: Actionable<C, O[K]>;
} : [T] extends [RecordType<infer Tb extends string>] ? {
    [K in keyof RecordFields<C, Tb>]: Actionable<C, RecordFields<C, Tb>[K] & AbstractType>;
} : T extends UnionType<infer Members extends AbstractType[]> ? [UnionObjectFields<Members[number]>] extends [never] ? unknown : {
    [K in keyof UnionFields<Members>]: Actionable<C, UnionFields<Members>[K] & AbstractType>;
} : T extends GraphType<infer Tb> ? TableFieldsOf<C, Tb> extends ObjectType<infer O> ? {
    [K in keyof O]: Actionable<C, ArrayType<O[K]>>;
} : unknown : T extends ArrayType<infer A> ? A extends AbstractType ? {
    [K: number]: Actionable<C, OptionType<A>>;
} : A extends AbstractType[] ? {
    [K in keyof A as K extends keyof unknown[] ? never : K]: A[K] extends AbstractType ? Actionable<C, A[K]> : never;
} & {
    [K: number]: Actionable<C, OptionType<UnionType<A>>>;
} : never : unknown;
type Actionable<C extends WorkableContext, T extends AbstractType> = ActionableProps<C, T> & Workable<C, T> & GetFunctions<C, T>;

/**
 * Typed permission rules.
 *
 * A rule is either a string (SurrealQL as written: `"FULL"`, `"NONE"`, or a
 * condition), or a {@link where} rule: an expression built from the row and the
 * variables SurrealDB provides to a permission clause (`$auth`, `$session`,
 * `$token`, `$access`, and for a field `$value`, `$before` and `$after`).
 *
 * A typed rule is rendered to SurrealQL when the schema is generated, not when
 * it is declared, so it can resolve record links against the tables that exist.
 */
/** The operations a table's permissions are given for. */
declare const TABLE_OPERATIONS: readonly ["select", "create", "update", "delete"];
/** The operations a field's permissions are given for: a field has no `delete`. */
declare const FIELD_OPERATIONS: readonly ["select", "create", "update"];
type TableOperation = (typeof TABLE_OPERATIONS)[number];
type FieldOperation = (typeof FIELD_OPERATIONS)[number];
/**
 * A row whose fields are not known: every property is reachable, and none is
 * typed. It is what a field's rule sees, since the table does not exist yet
 * where the field is declared.
 */
type LooseRow = ObjectType<Record<string, AnyType>> & {
    readonly "~loose": true;
};
/** The row a rule receives: typed from its table, or loose. */
type RowActionable<C extends WorkableContext, Row extends AbstractType> = Row extends LooseRow ? Record<string, any> : Actionable<C, Row>;
/** A link to any table, which also takes `undefined` to compare against. */
type LooseRecord = RecordType<any> & {
    readonly infer: any;
};
/**
 * What a session knows about itself (`$session`), as SurrealDB reports it.
 *
 * `id` is always a uuid. The rest are absent where the session has no such thing:
 * `ac` and `rd` for a system user, `exp` where no session duration is set, and
 * `tk` for a session that signed in with no token. It is declared once, as a
 * value, so that the type a rule is written against is the type it is rendered
 * with.
 */
declare const SESSION: ObjectType<{
    ac: OptionType<StringType>;
    db: OptionType<StringType>;
    ns: OptionType<StringType>;
    id: UuidType;
    ip: OptionType<StringType>;
    or: OptionType<StringType>;
    rd: OptionType<RecordType<undefined>>;
    tk: OptionType<ObjectType<{}>>;
    exp: OptionType<IntType>;
}>;
/** What a session knows about itself (`$session`). */
type SessionType = typeof SESSION;
/** The claims of the token the session was opened with (`$token`): any property. */
type TokenType = LooseRow;
/**
 * The authenticated record when nothing says which table it comes from: its
 * `id` is a record link, and any other property is untyped.
 */
type LooseAuthType = ObjectType<{
    id: LooseRecord;
} & Record<string, AnyType>>;
/**
 * The variables a permission rule can read.
 *
 * `value`, `before` and `after` exist in a field's permissions only; in a
 * table's they are `NONE`, so reading one there is refused when the schema is
 * generated.
 */
interface PermissionContext<C extends WorkableContext, Auth, Value extends AbstractType = AnyType> {
    /** The record the session is signed in as (`$auth`). */
    readonly auth: Auth;
    /** The session (`$session`). */
    readonly session: Actionable<C, SessionType>;
    /** The claims of the session's token (`$token`). */
    readonly token: RowActionable<C, TokenType>;
    /** The name of the access method the session signed in with (`$access`). */
    readonly access: Actionable<C, OptionType<StringType>>;
    /** The field's value, as it is being read or written (`$value`). Fields only. */
    readonly value: Actionable<C, Value>;
    /** The field's value before the write (`$before`). Fields only. */
    readonly before: Actionable<C, Value>;
    /** The field's value after the write (`$after`). Fields only. */
    readonly after: Actionable<C, Value>;
}
/** The tables record links resolve against, by name. */
type RenderTables = Readonly<Record<string, {
    readonly tb: string;
    readonly schema: AbstractType;
}>>;
type RuleBuilder = (row: never, ctx: never) => Workable;
/**
 * A condition on the row and the session, built with {@link where}.
 *
 * `Row` is the object type of the row the rule is about, and `Value` the type of
 * the field, when it is a field's. Neither exists at runtime: they let
 * `.permissions()` check the rule against the table it is given to.
 */
declare class WhereRule<Row extends AbstractType = LooseRow, Value extends AbstractType = AnyType> {
    readonly build: RuleBuilder;
    /** The table `auth` is a record of, if it was named. */
    readonly auth?: AnyTable | undefined;
    /** Further tables the rule's record links resolve against. */
    readonly related: readonly AnyTable[];
    readonly "~row": Row;
    readonly "~value": Value;
    constructor(build: RuleBuilder, 
    /** The table `auth` is a record of, if it was named. */
    auth?: AnyTable | undefined, 
    /** Further tables the rule's record links resolve against. */
    related?: readonly AnyTable[]);
}
/** A rule: SurrealQL as written, or a typed condition. */
type PermissionRule<Row extends AbstractType = LooseRow, Value extends AbstractType = AnyType> = string | WhereRule<Row, Value>;
/** Per-operation rules for a table or edge. */
interface TablePermissionRules<Row extends AbstractType = LooseRow> {
    select?: PermissionRule<Row>;
    create?: PermissionRule<Row>;
    update?: PermissionRule<Row>;
    delete?: PermissionRule<Row>;
}
/** A table's `PERMISSIONS`: one SurrealQL clause, or a rule per operation. */
type TablePermissions<Row extends AbstractType = LooseRow> = string | TablePermissionRules<Row>;
/** Per-operation rules for a field, which has no `delete`. */
interface FieldPermissionRules<Value extends AbstractType = AnyType> {
    select?: PermissionRule<LooseRow, Value>;
    create?: PermissionRule<LooseRow, Value>;
    update?: PermissionRule<LooseRow, Value>;
}
/** A field's `PERMISSIONS`: one SurrealQL clause, or a rule per operation. */
type FieldPermissions<Value extends AbstractType = AnyType> = string | FieldPermissionRules<Value>;
/**
 * A condition a record must meet for an operation to be allowed.
 *
 * It receives the row (`$this`) and the session variables, and returns an
 * expression. The row is untyped here unless the rule is handed straight to a
 * table's `.permissions()`, which supplies its row type.
 *
 * @example
 * ```ts
 * table("post", { owner: t.record("user") }).permissions({
 *   select: "full",
 *   update: where((row, { auth }) => row.owner.eq(auth.id)),
 *   delete: "none",
 * });
 * ```
 *
 * To type `auth` as a table's record, use {@link authenticatedAs}.
 */
declare function where<Row extends AbstractType = LooseRow, Value extends AbstractType = AnyType>(build: (row: RowActionable<WorkableContext, Row>, ctx: PermissionContext<WorkableContext, Actionable<WorkableContext, LooseAuthType>, Value>) => Workable<WorkableContext>): WhereRule<Row, Value>;
/**
 * Rules for sessions signed in as a record of `authTable` (the table a
 * `DEFINE ACCESS … TYPE RECORD` signs users in from). Returns a `where` whose
 * `auth` is that record, so `auth.role` is checked against the table's fields.
 *
 * The table is taken as a value, not just a type, so a property of `auth` has the
 * right type at runtime as well (a string's methods, for instance). Pass further
 * tables to let a rule follow links into them.
 *
 * @example
 * ```ts
 * const { where } = authenticatedAs(user);
 *
 * table("post", { owner: t.record("user") }).permissions({
 *   update: where((row, { auth }) => row.owner.eq(auth.id).or(auth.role.eq("admin"))),
 * });
 * ```
 */
declare function authenticatedAs<U extends AnyTable, R extends AnyTable[] = []>(authTable: U, ...related: R): {
    where<Row extends AbstractType = LooseRow, Value extends AbstractType = AnyType>(build: (row: RowActionable<WorkableContext<Orm<[U, ...R]>>, Row>, ctx: PermissionContext<WorkableContext<Orm<[U, ...R]>>, Actionable<WorkableContext<Orm<[U, ...R]>>, RecordType<U["tb"]>>, Value>) => Workable<WorkableContext<Orm<[U, ...R]>>>): WhereRule<Row, Value>;
};

/**
 * A raw SurrealQL expression (e.g. `time::now()`), rendered verbatim rather
 * than bound as a parameter. Use {@link expr} to create one. The text is
 * interpolated into the query as-is, so it must come from trusted code (such as
 * a schema definition), never from user input.
 */
declare class SurqlExpression {
    readonly sql: string;
    constructor(sql: string);
}
/** Wrap a trusted SurrealQL expression for use as a field {@link AbstractType.default | default}. */
declare function expr(sql: string): SurqlExpression;
/**
 * A field default: a static value, a function producing one (called each time
 * a query is built), or a {@link SurqlExpression} evaluated by SurrealDB.
 */
type DefaultValue<T = unknown> = T | (() => T) | SurqlExpression;
/** Marks a type that carries a default, making it optional on create. */
type HasDefault = {
    readonly _default: DefaultValue;
};
declare abstract class AbstractType<T = unknown> {
    abstract readonly name: string;
    abstract readonly expected: string | [string, string, ...string[]];
    infer: T;
    accept: T;
    abstract validate(value: unknown): value is T;
    /** The default applied on create when the field is absent. See {@link default}. */
    /**
     * Give this field a default, applied by CREATE, INSERT and RELATE when the
     * field is omitted. `.content()`, `.merge()` and INSERT also apply it when the
     * key is `undefined`; `.set()` does not, because the key was supplied. The
     * field becomes optional in create input while its output type is unchanged.
     * Accepts a static value, a function (e.g. `() => new Date()`, evaluated per
     * query), or an {@link expr} SurrealQL expression evaluated by the database.
     *
     * Returns a copy; the original type is left untouched.
     */
    default<Self extends AbstractType>(this: Self, value: DefaultValue<Self["infer"]>): Self & HasDefault;
    /**
     * Schema metadata used to generate `DEFINE FIELD`. Empty unless one of the
     * modifiers below has been used, and never affects the inferred type.
     */
    readonly ddl: Readonly<FieldDdl>;
    /**
     * Validate and return `value`, or throw if it does not match this type.
     *
     * @throws {TypeParseError} If `value` fails validation.
     */
    parse(value: unknown): T;
    get(prop: string | number): [AbstractType, string];
    /**
     * Add an `ASSERT` condition. Call more than once to require several — they
     * are joined with `AND`.
     */
    assert<S extends AbstractType>(this: S, condition: string): S;
    /**
     * Set a `DEFAULT ALWAYS` value, re-applied on every update. As with
     * {@link default}, a string is data and SurrealQL is written with {@link expr}:
     * `t.date().defaultAlways(expr("time::now()"))`.
     */
    defaultAlways<S extends AbstractType>(this: S, value: unknown): S;
    /**
     * Set a `VALUE` expression, evaluated on write.
     *
     * Named `valueExpr` rather than `value` because {@link LiteralType} already
     * exposes a `value` accessor.
     */
    valueExpr<S extends AbstractType>(this: S, expression: string): S;
    /** Set a `VALUE { … }` expression, deferred until the field is read. */
    computed<S extends AbstractType>(this: S, expression: string): S;
    /** Mark the field `READONLY` — it cannot be changed after creation. */
    readonly<S extends AbstractType>(this: S): S;
    /** Mark the field `FLEXIBLE`, allowing values outside the declared type. */
    flexible<S extends AbstractType>(this: S): S;
    /**
     * Set the field's `PERMISSIONS`: a SurrealQL clause as a string, or a rule per
     * operation (`select`, `create` and `update`; a field has no `delete`). A rule
     * is `"full"`, `"none"`, SurrealQL, or a typed condition built with `where()`.
     *
     * An operation left out takes SurrealDB's default for a field, which is
     * `FULL`.
     *
     * @example
     * ```ts
     * t.string().permissions({
     *   select: where((row, { auth }) => row.owner.eq(auth.id)),
     *   update: "none",
     * });
     * ```
     */
    permissions<S extends AbstractType>(this: S, rules: FieldPermissions<S>): S;
    /** Attach a `COMMENT` to the field. */
    comment<S extends AbstractType>(this: S, text: string): S;
    /** Declare the field a `REFERENCE`, optionally naming the referenced table. */
    references<S extends AbstractType>(this: S, table?: string): S;
    /** Set what happens to this field when the record it references is deleted. */
    onDelete<S extends AbstractType>(this: S, action: OnDeleteAction): S;
    /**
     * Record previous names for this field so a rename is migrated as a rename —
     * the value is carried across — rather than as a drop and a create.
     */
    was<S extends AbstractType>(this: S, ...names: string[]): S;
}
declare class LiteralType<T extends string | number | boolean> extends AbstractType<T> {
    private _value;
    name: "literal";
    get expected(): string;
    constructor(_value: T);
    get value(): T;
    validate(value: unknown): value is this["infer"];
}
declare class StringType extends AbstractType<string> {
    name: "string";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class NumberType extends AbstractType<number> {
    name: "number";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
/**
 * An integer too large for a JS `number` to hold exactly, such as the
 * nanoseconds `time::nano()` returns. The SDK decodes those as `bigint`.
 */
declare class BigIntType extends AbstractType<bigint> {
    name: "bigint";
    expected: string;
    validate(value: unknown): value is this["infer"];
    /**
     * Return `value` as a `bigint`. A safe integer the SDK decoded as a `number`
     * (a small value, such as a date near the epoch) is converted, so the result
     * always has the declared type.
     *
     * @throws {TypeParseError} If `value` is neither a `bigint` nor a safe integer.
     */
    parse(value: unknown): this["infer"];
}
declare class BoolType extends AbstractType<boolean> {
    name: "bool";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class NullType extends AbstractType<null> {
    name: "null";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class NoneType extends AbstractType<undefined> {
    name: "none";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class NeverType extends AbstractType<never> {
    name: "never";
    expected: string;
    validate(_: unknown): _ is never;
}
declare class DateType extends AbstractType<Date> {
    name: "date";
    expected: string;
    validate(value: unknown): value is this["infer"];
    /**
     * Parse a value into a `Date`, converting SurrealDB `DateTime` objects.
     *
     * @throws {TypeParseError} If `value` is not a `Date` or `DateTime`.
     */
    parse(value: unknown): this["infer"];
}
declare class DurationType extends AbstractType<Duration> {
    name: "duration";
    expected: string;
    validate(value: unknown): value is this["infer"];
    /**
     * Return an existing SurrealDB `Duration` instance.
     *
     * @throws {TypeParseError} If `value` is not a `Duration`.
     */
    parse(value: unknown): this["infer"];
}
declare class PointType extends AbstractType<GeometryPoint> {
    name: "point";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class UuidType extends AbstractType<Uuid> {
    name: "uuid";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
declare class OptionType<T extends AbstractType> extends AbstractType<T["infer"] | undefined> {
    private _schema;
    name: "option";
    get expected(): string;
    constructor(_schema: T);
    get schema(): T;
    validate(value: unknown): value is this["infer"];
    /**
     * Parse `value` against the inner schema, returning `undefined` when the
     * value is absent. Delegates to the inner type so conversions (e.g. dates)
     * are applied.
     *
     * @throws {TypeParseError} If `value` is defined but fails the inner schema.
     */
    parse(value: unknown): this["infer"];
}
declare class RecordType<Tb extends string | undefined = undefined> extends AbstractType<RecordId<Tb extends string ? Tb : string>> {
    private _tb;
    name: "record";
    get expected(): string;
    constructor(_tb: Tb | readonly Tb[]);
    get tb(): Tb | readonly Tb[];
    validate(value: unknown): value is this["infer"];
}
/**
 * The result of a graph traversal (e.g. `->authored->post`). A traversal yields
 * an array of record links to the table it lands on, so its inferred type is
 * `RecordId<Tb>[]`. Carrying the target table name on `.tb` lets `.select()` and
 * further `.out()`/`.in()`/`.both()` steps resolve against it, while the array
 * `infer` keeps a bare traversal (dropped straight into a projection) correctly
 * typed.
 */
declare class GraphType<Tb extends string = string> extends AbstractType<RecordId<Tb>[]> {
    private _tb;
    name: "graph";
    get expected(): string;
    constructor(_tb: Tb);
    get tb(): Tb;
    validate(value: unknown): value is this["infer"];
}
type ObjectTypeInner = Record<string, AbstractType>;
declare class ObjectType<T extends ObjectTypeInner = any> extends AbstractType<{
    [K in keyof T]: T[K]["infer"];
} & {}> {
    private _schema;
    name: "object";
    get expected(): string;
    constructor(_schema: T);
    get schema(): T;
    validate(value: unknown): value is this["infer"];
    /**
     * Validate every field of `value` against the object schema, returning a new
     * object whose schema fields hold the parsed (and possibly converted) values.
     *
     * @throws {TypeParseError} If `value` is not an object or a field fails validation.
     */
    parse(value: unknown): this["infer"];
    get(prop: string | number): [AbstractType, string];
}
declare class ArrayType<T extends AbstractType[] | AbstractType = AbstractType[] | AbstractType> extends AbstractType<T extends AbstractType[] ? {
    [K in keyof T]: T[K] extends AbstractType ? T[K]["infer"] : never;
} : T extends AbstractType ? T["infer"][] : never> {
    private _schema;
    private _max?;
    name: "array";
    get expected(): string;
    /**
     * @param _schema - The element type, or a tuple of types
     * @param _max - The most elements the array may hold, as SurrealDB's
     *   `array<T, max>`. SurrealQL takes a maximum only — a lower bound is a
     *   parse error — so a minimum has to be an `ASSERT`.
     */
    constructor(_schema: T, _max?: number | undefined);
    get schema(): T;
    /** The declared maximum length, if any. */
    get max(): number | undefined;
    /** Whether `length` is within the declared maximum, if there is one. */
    protected withinBound(length: number): boolean;
    validate(value: unknown): value is this["infer"];
    /**
     * Validate every element of `value` against the array or tuple schema,
     * returning a new array of the parsed (and possibly converted) elements.
     *
     * @throws {TypeParseError} If `value` is not an array, has the wrong length
     *   (tuple), exceeds the declared maximum, or an element fails validation.
     */
    parse(value: unknown): this["infer"];
    get(prop: number): [AbstractType, string];
}
declare class UnionType<T extends AbstractType[]> extends AbstractType<T extends AbstractType[] ? {
    [K in keyof T]: T[K] extends AbstractType ? T[K]["infer"] : never;
}[number] : never> {
    private _schema;
    name: "union";
    get expected(): [string, string, ...string[]];
    constructor(_schema: T);
    get schema(): T;
    validate(value: unknown): value is this["infer"];
    /**
     * Parse `value` against the first matching member, delegating so that member
     * conversions (e.g. dates) are applied.
     *
     * @throws {TypeParseError} If `value` matches none of the members.
     */
    parse(value: unknown): this["infer"];
}
/** A whole number. Narrower than {@link NumberType}: rejects fractional values. */
declare class IntType extends NumberType {
    validate(value: unknown): value is this["infer"];
}
/** A floating-point number. Identical to {@link NumberType} at runtime. */
declare class FloatType extends NumberType {
}
/**
 * An arbitrary-precision decimal.
 *
 * SurrealDB returns these as `Decimal` instances to preserve precision, so the
 * inferred type admits both that and a plain `number` (which is what you get
 * back from a server that widened the value). Nothing is converted on parse —
 * narrowing a `Decimal` to a JS `number` would defeat the point of the type.
 */
declare class DecimalType extends AbstractType<Decimal | number> {
    name: "number";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
/**
 * Raw binary data.
 *
 * Reads and writes use different shapes: the SDK sends a `Uint8Array` but
 * returns the stored bytes as an `ArrayBuffer`. Only {@link parse} accepts the
 * latter, so `validate` keeps describing what a write may carry.
 */
declare class BytesType extends AbstractType<Uint8Array> {
    name: "bytes";
    expected: string;
    validate(value: unknown): value is this["infer"];
    /** Returns a `Uint8Array` over the bytes, without copying an `ArrayBuffer`. */
    parse(value: unknown): this["infer"];
}
/** The geometry kinds SurrealDB can constrain a `geometry<…>` field to. */
type GeometryKind = "point" | "line" | "polygon" | "multipoint" | "multiline" | "multipolygon" | "collection" | "feature";
/** A geometry value, optionally constrained to one kind. */
declare class GeometryType<K extends GeometryKind | undefined = undefined> extends AbstractType<Geometry> {
    private _kind?;
    name: "geometry";
    get expected(): string;
    constructor(_kind?: K | undefined);
    get kind(): K | undefined;
    validate(value: unknown): value is this["infer"];
}
/**
 * A bounded range of values.
 *
 * SurrealDB has no element type for ranges — `range<int>` is a parse error, and
 * `INFO FOR TABLE` reports a bare `range` — so this carries no inner type.
 */
declare class RangeType extends AbstractType<Range<unknown, unknown>> {
    name: "range";
    expected: string;
    validate(value: unknown): value is this["infer"];
}
/** Any value at all. Accepts everything, including `undefined`. */
declare class AnyType extends AbstractType<unknown> {
    name: "any";
    expected: string;
    validate(_value: unknown): _value is this["infer"];
}
/**
 * A set: an unordered collection of unique values, which SurrealDB accepts
 * and returns as a JavaScript `Set` (never an array).
 *
 * Sets have their own function family (`set::`), distinct from `array::`.
 */
declare class SetType<T extends AbstractType = AbstractType> extends AbstractType<Set<T["infer"]>> {
    private _schema;
    private _max?;
    name: "set";
    get expected(): string;
    /**
     * @param _schema - The element type
     * @param _max - The most members the set may hold, as `set<T, max>`
     */
    constructor(_schema: T, _max?: number | undefined);
    get schema(): T;
    /** The declared maximum size, if any. */
    get max(): number | undefined;
    validate(value: unknown): value is this["infer"];
    /**
     * Parse every member of `value` against the element type, returning a new
     * `Set` of the parsed members.
     *
     * @throws {TypeParseError} If `value` is not a `Set`, exceeds the declared
     *   maximum, or a member fails validation.
     */
    parse(value: unknown): this["infer"];
}

/**
 * The [Standard Schema](https://standardschema.dev) interface, declared as
 * types only so that Surqlize takes no dependency on it. Every `t.*` type
 * implements it, which lets one definition validate in other libraries that
 * accept a Standard Schema, such as the `surrealdb` SDK's `.args()`,
 * `.returns()`, `.request()` and `.response()`.
 */
interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly "~standard": StandardSchemaProps<Input, Output>;
}
interface StandardSchemaProps<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => {
        readonly value: Output;
        readonly issues?: undefined;
    } | {
        readonly issues: readonly StandardIssue[];
    };
    readonly types?: {
        readonly input: Input;
        readonly output: Output;
    };
}
type StandardIssue = {
    readonly message: string;
    readonly path?: readonly PropertyKey[];
};
declare module "./types/classes" {
    interface AbstractType<T> {
        /** See {@link StandardSchemaV1}. */
        readonly "~standard": StandardSchemaProps<unknown, T>;
    }
}

export { type ComputedKeys as $, AbstractType as A, BigIntType as B, type CreateInput as C, DateType as D, EdgeSchema as E, type FieldDdl as F, type GeometryKind as G, ApiClient as H, IntType as I, ApiEndpointSchema as J, type ApiMethodDef as K, type LiveMessage as L, type ApiMethods as M, NullType as N, Orm as O, PointType as P, type ApiResponse as Q, type RenderTables as R, SelectQuery as S, TableSchema as T, UnionType as U, BatchQuery as V, type WorkableContext as W, type BatchResult as X, type BothStepSegments as Y, type Computed as Z, type ComputedExpression as _, AnyType as a, type SafeParseResult as a$, CreateQuery as a0, type DefaultValue as a1, DeleteQuery as a2, type DeleteReturns as a3, type DisplayContext as a4, type DistanceMetric as a5, DuplicateSurrealError as a6, type EdgeFields as a7, type EventDefinition as a8, type EventOptions as a9, type IndexOptions as aA, type InferParams as aB, InsertQuery as aC, LiveQuery as aD, LiveSubscription as aE, type LooseAuthType as aF, type LooseRow as aG, type MappedTables as aH, type ModelClass as aI, type ObjectTypeInner as aJ, type OperatorFilter as aK, type OrderByObject as aL, type OrderDirection as aM, OrmError as aN, type OrmOptions as aO, type OutStepSegments as aP, type OutgoingEdges as aQ, type PermissionContext as aR, type PermissionRule as aS, type RecursionBody as aT, type RecursionDepth as aU, type RecursionOptions as aV, type RecursiveTraversal as aW, type RelateEndpoint as aX, RelateQuery as aY, type RelateReturnMode as aZ, type RowTraversal as a_, type EventTrigger as aa, type FetchPaths as ab, type FetchedSchema as ac, type FieldCondition as ad, type FieldOperation as ae, type FieldPermissionRules as af, type FieldPermissions as ag, type FromOf as ah, type FulltextOptions as ai, type FunctionCallable as aj, FunctionSchema as ak, type GraphArgs as al, type GraphDirection as am, type GraphFilter as an, type GraphSegmentArg as ao, type GraphSegmentPrimitive as ap, type GraphSegmentResult as aq, type GraphSegmentSpec as ar, GraphType as as, type HasDefault as at, type HasTableDdl as au, type HnswOptions as av, type HttpMethod as aw, type InStepSegments as ax, type IncomingEdges as ay, type IndexDefinition as az, ArrayType as b, type SchemaMap as b0, type SchemaMapTables as b1, type SegmentBuilder as b2, type SegmentCallback as b3, type SessionType as b4, type SplitEntry as b5, type StandardIssue as b6, type StandardSchemaProps as b7, type StandardSchemaV1 as b8, type StepSegments as b9, authenticatedAs as bA, defineEvent as bB, defineIndex as bC, displayContext as bD, edge as bE, expr as bF, fn as bG, orm as bH, resolveFetchObject as bI, table as bJ, where as bK, SurqlExpression as ba, type SurrealConnection as bb, type TableChangefeed as bc, type TableDdl as bd, type TableFields as be, type TableFieldsOf as bf, type TableOperation as bg, type TablePermissionRules as bh, type TablePermissions as bi, type ToOf as bj, type TokenType as bk, Transaction as bl, TypeParseError as bm, UpdateQuery as bn, UpsertQuery as bo, ValidationError as bp, type ValidationIssue as bq, type ValidationMode as br, type ValueType as bs, type VectorType as bt, type WhereObject as bu, WhereRule as bv, __ctx as bw, __display as bx, __type as by, api as bz, BoolType as c, BytesType as d, DecimalType as e, DurationType as f, FloatType as g, GeometryType as h, type Workable as i, LiteralType as j, NeverType as k, NoneType as l, NumberType as m, ObjectType as n, OptionType as o, RangeType as p, RecordType as q, SetType as r, StringType as s, UuidType as t, type Actionable as u, type ContextSource as v, type IntoWorkable as w, ANY as x, type AnyGraphSegmentSpec as y, type AnyTable as z };
