import { RecordIdValue, RecordId } from 'surrealdb';
import { L as LiveMessage, O as Orm, C as CreateInput, S as SelectQuery, W as WorkableContext } from './standard-schema-BtCNboat.js';

/** One write waiting to be sent. */
type OutboxOp = {
    table: string;
    /** The id part of the record id, such as `"a1"` in `task:a1`. */
    id: unknown;
    kind: "create" | "update" | "delete";
    /** The fields to write; none for a delete. */
    data?: Record<string, unknown>;
};
/** Where pending writes are kept, so that they survive a reload. */
interface OutboxStorage {
    /** Every stored write, in any order. */
    load(): Promise<ReadonlyArray<{
        seq: number;
        payload: string;
    }>>;
    /** Store a write, or replace the one with this `seq`. */
    put(seq: number, payload: string): Promise<void>;
    remove(seq: number): Promise<void>;
}
/** Pending writes kept in memory only: lost with the page, but works everywhere. */
declare function memoryStorage(): OutboxStorage;
/**
 * Pending writes kept in IndexedDB, so they are still there after a reload and
 * are sent when the store next starts. Needs a browser (or a runtime with an
 * `indexedDB` global).
 */
declare function indexedDbStorage(name?: string): OutboxStorage;
/** What {@link Outbox} needs from the store that owns it. */
type OutboxDeps = {
    storage: OutboxStorage;
    /** Send a write to the database. Resolves to the stored record, if there is one. */
    send(op: OutboxOp): Promise<unknown>;
    /** Called with the result of a write the database accepted, before it leaves the outbox. */
    acknowledge(op: OutboxOp, row: unknown): void;
    /** Whether an error means the write was refused, so that retrying cannot help. */
    isPermanent(error: unknown): boolean;
    /** Whether the connection is up. Without a signal, assumed to be. */
    isOnline(): boolean;
    /** Called once a write has been queued and stored, before it is sent. */
    onWrite?(): void;
    /** The first and the longest wait before sending again after a failed attempt. */
    retry: {
        minMs: number;
        maxMs: number;
    };
};
/**
 * Writes that have been made locally and not yet accepted by the database, in
 * order. A write stays here until the database accepts or refuses it:
 * a connection problem keeps it queued to be sent again, a refusal removes it
 * and rejects it.
 *
 * Writes to the same record that have not been sent yet are merged into one,
 * so editing a field a hundred times offline sends one write.
 */
declare class Outbox {
    #private;
    private readonly deps;
    /** Resolves once the writes of an earlier session have been loaded. */
    readonly ready: Promise<void>;
    constructor(deps: OutboxDeps);
    /** The writes waiting to be sent, oldest first. The same array until it changes. */
    getSnapshot: () => readonly OutboxOp[];
    /** Subscribe to changes of the waiting writes. */
    subscribe: (listener: () => void) => (() => void);
    /** The pending writes to one table, in the order they were made. */
    forTable(table: string): OutboxOp[];
    /**
     * Queue a write. Resolves with the stored record once the database accepted
     * it, and rejects if it refused it, or if the write cannot be stored.
     */
    enqueue(op: OutboxOp): Promise<unknown>;
    /**
     * Send the waiting writes, oldest first, until one cannot be sent for want of
     * a connection. Safe to call at any time; only one run happens at once. Does
     * nothing once the outbox is disposed.
     */
    flush(): Promise<void>;
    /**
     * Stop sending, for good. A write that is on its way still ends as the
     * database answers, but nothing is sent after it, and a failed one is not
     * tried again. Writes stay in storage and are sent when a store starts again.
     */
    dispose(): void;
}

/**
 * What a {@link QueryStore} holds. A new object is produced whenever it
 * changes and the same object is returned until then, as
 * `useSyncExternalStore` and similar bindings require.
 *
 * - `loading`: the first result has not arrived.
 * - `success`: `data` is the current result. `stale` is `true` while the
 *   connection is down, so `data` may be missing changes made in the meantime;
 *   it is refreshed when the connection returns.
 * - `error`: loading failed, or the live subscription was killed. Call
 *   {@link QueryStore.refetch} to try again.
 */
type StoreSnapshot<T> = {
    readonly status: "loading";
} | {
    readonly status: "success";
    readonly data: readonly T[];
    readonly stale: boolean;
} | {
    readonly status: "error";
    readonly error: unknown;
};
/** How a store learns what changed: apply each notification, or ask again. */
type StoreMode = "direct" | "refetch";
/** The connection events a store reacts to. */
type ConnectionSignal = "connected" | "disconnected";
type QueryStoreDeps<T> = {
    /** The table the query reads, to know which writes concern it. */
    table?: string;
    /**
     * `direct`: every notification carries the full record, so it is applied to
     * the result as it is. Only valid when the result is every record of the
     * table. `refetch`: the result may depend on a filter, an order or a
     * projection, so any change to the table runs the query again.
     *
     * A live query with a `WHERE` sends nothing when an update makes a record
     * stop matching, so a filtered result cannot be kept up to date from its
     * notifications; the store subscribes to the whole table instead.
     */
    mode: StoreMode;
    /** Run the query and return its rows. */
    fetch(): Promise<T[]>;
    /** Subscribe to every change of the table. Resolves to a function that stops. */
    live(handler: (message: LiveMessage<T>) => void): Promise<() => void>;
    /** The identity of a record, to apply a notification to the right row. */
    keyOf(row: T): string;
    /** The identity of the record a notification is about. */
    keyOfId(id: unknown): string;
    /** Order the rows of a `direct` result. Rows are otherwise in arrival order. */
    sort?: (a: T, b: T) => number;
    /** Tell the store when the connection drops and returns. */
    onConnection?(listener: (signal: ConnectionSignal) => void): () => void;
    /**
     * Writes that have been made locally and not yet accepted. They are shown on
     * top of what the database says, so a change appears at once.
     */
    overlay?: {
        /**
         * `rows` with the pending writes applied. `insert` is whether a pending
         * create may add a row: not when the result is filtered, as the store
         * cannot tell whether the new record would match.
         */
        apply(rows: T[], insert: boolean): T[];
        /** Call `listener` when the pending writes change. */
        subscribe(listener: () => void): () => void;
    };
    /**
     * Whether a whole record, as the database returned it, belongs to the result:
     * `true`, `false`, or `undefined` when that cannot be told. Only for `refetch`
     * queries that are a plain filter.
     */
    membership?: (row: T) => boolean | undefined;
    /** Whether a record that comes back from a write may be added to a `refetch` result. */
    insertable?: boolean;
    /** Called once the store has no subscribers and has shut down. */
    onDispose?(): void;
    /**
     * Called once, as the store is made, with a function that stops it at once,
     * whether or not anything is still subscribed. For `Store.dispose()` only: a
     * store otherwise stops itself when the last subscriber leaves.
     */
    registerStop?(stop: () => void): void;
    /** How long to keep running after the last subscriber leaves. */
    idleMs: number;
    /** How long to wait for further changes before running a `refetch` query again. */
    debounceMs: number;
};
/**
 * A live view of a query, shaped for `useSyncExternalStore`: `subscribe` and
 * `getSnapshot`. Created through {@link Store.query}, which shares one store
 * between everything that asks for the same query.
 *
 * It starts with its first subscriber and stops shortly after the last one
 * leaves, so a component that unmounts and mounts again straight away (React
 * StrictMode does this) does not tear down and set up the live query.
 */
declare class QueryStore<T> {
    #private;
    private readonly deps;
    constructor(deps: QueryStoreDeps<T>);
    /** The table this query reads. */
    get table(): string | undefined;
    /** Subscribe to changes of the snapshot. Returns a function that unsubscribes. */
    subscribe: (listener: () => void) => (() => void);
    /** The current snapshot. The same object is returned until something changes. */
    getSnapshot: () => StoreSnapshot<T>;
    /**
     * Run the query again now and replace the result with what it returns. A
     * query that failed to start has no live subscription yet, so it is started
     * again instead.
     */
    refetch(): Promise<void>;
    /**
     * The database accepted a write: record its result in the base, so that the
     * view does not change when the write leaves the pending ones. The caller
     * removes the write next, which publishes.
     *
     * The result is a whole table row. A `refetch` query that is not a plain
     * filter may select or compute other columns, so a row it holds keeps its
     * keys: the result updates the keys the row has and adds none.
     */
    acknowledge(change: {
        key: string;
        row?: unknown;
    }): void;
}

type StoreOptions = {
    /**
     * Where connection events come from. Defaults to the connection of the ORM
     * when it is a `Surreal` instance. Without one, the store cannot tell when
     * the connection dropped and so does not refresh after a reconnect.
     */
    connection?: ConnectionEvents;
    /** How long a query keeps running after its last subscriber leaves. Default 100. */
    idleMs?: number;
    /** How long to wait for further changes before reading a filtered query again. Default 20. */
    debounceMs?: number;
    /**
     * Where writes that have not reached the database are kept. The default is
     * memory: they are sent again after a reconnect, but lost with the page. Use
     * {@link indexedDbStorage} to keep them across reloads.
     */
    storage?: OutboxStorage;
    /** The first and the longest wait before sending a write again. Default 500 and 30000. */
    retry?: {
        minMs?: number;
        maxMs?: number;
    };
    /**
     * Holds the store off the database until it resolves, for a connection that
     * has to be signed in first. Until then the store registers no live query,
     * reads nothing and sends no write; a write made meanwhile is queued and shown
     * at once, and one kept in `storage` from an earlier session waits too.
     *
     * It is called the first time something needs the connection: the first
     * subscriber of a query, a write, or `refetch()`. Never when the store is made,
     * never again once it has resolved, and never twice at once. A write kept in
     * `storage` does not call it by itself; it waits for one of those. If it
     * rejects, queries report the error, writes stay queued and are not rejected,
     * and the next write, `refetch()`, or subscriber of a query that is not running
     * calls it again; a query that failed to start is started over by `refetch()`
     * or a new subscriber. It is not called again after a reconnect.
     */
    gate?: () => Promise<void>;
};
/** What a write call returns: the record it is about, and when the database has settled it. */
type Write<Tb extends string, Row> = {
    /** The id of the record, known straight away, including for a create that was given none. */
    id: RecordId<Tb>;
    /**
     * Resolves with the stored record once the database accepts the write, or
     * `undefined` for a delete. Rejects if the database refuses it, in which case
     * the change is taken back. While offline it stays pending, and the write is
     * sent when the connection returns.
     */
    committed: Promise<Row | undefined>;
};
/** The part of a `Surreal` instance the store listens to. */
type ConnectionEvents = {
    subscribe(event: "connected" | "reconnecting" | "disconnected", listener: () => void): () => void;
};
type QueryOptions<T> = {
    /** Order the rows of an unfiltered query. Filtered queries order themselves with `.orderBy()`. */
    sort?: (a: T, b: T) => number;
};
type Row<Q> = Awaited<Q> extends readonly (infer R)[] ? R : Awaited<Q>;
/**
 * Live views of queries. Ask for a query with {@link Store.query} and
 * subscribe to the {@link QueryStore} it returns; asking for the same query
 * again returns the same store, so every component that shows it shares one
 * live subscription.
 *
 * ```ts
 * const store = createStore(db);
 * const open = store.query("task", (q) => q.where({ done: false }));
 *
 * const stop = open.subscribe(() => render(open.getSnapshot()));
 * ```
 */
declare class Store<O extends Orm> {
    #private;
    readonly db: O;
    /**
     * Writes that have not been accepted by the database yet, oldest first. The
     * same array is returned until it changes.
     */
    readonly pending: {
        subscribe(listener: () => void): () => void;
        getSnapshot(): readonly OutboxOp[];
    };
    /** Resolves once the writes of an earlier session have been loaded from storage. */
    readonly ready: Promise<void>;
    constructor(db: O, options?: StoreOptions);
    /**
     * Stop everything the store started: its listeners on the connection, the
     * sending of the writes that are still waiting, and every running query, even
     * one that is subscribed. For a store made for a short-lived scope, such as a
     * request or a test, so that it does not outlive it. A write that is on its
     * way ends as the database answers, but none is sent or retried after it.
     * Writes that are waiting stay in storage, and are sent when a store starts
     * over it again.
     */
    dispose(): void;
    /**
     * Make writes to a table. Each applies to every query of the table at once,
     * and is sent to the database in order.
     *
     * ```ts
     * const tasks = store.table("task");
     * const { id, committed } = tasks.create({ title: "Write docs", done: false });
     * tasks.update(id, { done: true });
     * await committed;
     * ```
     *
     * Updates merge top-level fields, and the last write to a field wins.
     */
    table<Tb extends keyof O["tables"] & string>(tb: Tb): TableWriter<O, Tb>;
    /**
     * Every record of a table, kept current from the table's live notifications.
     */
    query<Tb extends keyof O["tables"] & string>(tb: Tb, build?: undefined, options?: QueryOptions<O["tables"][Tb]["schema"]["infer"]>): QueryStore<O["tables"][Tb]["schema"]["infer"]>;
    /**
     * The result of a query built from `SELECT FROM <table>`: filtered, ordered,
     * limited, projected or with `FETCH`. Any change to the table runs it again,
     * because a live query cannot say when a record stops matching a filter.
     */
    query<Tb extends keyof O["tables"] & string, Q extends PromiseLike<unknown>>(tb: Tb, build: (q: SelectQuery<O, WorkableContext<O>, Tb>) => Q): QueryStore<Row<Q>>;
}
type Schema<O extends Orm, Tb extends keyof O["tables"] & string> = O["tables"][Tb]["schema"];
type RowOf<O extends Orm, Tb extends keyof O["tables"] & string> = Schema<O, Tb>["infer"];
/** Writes to one table, made through {@link Store.table}. */
declare class TableWriter<O extends Orm, Tb extends keyof O["tables"] & string> {
    #private;
    private readonly tb;
    private readonly outbox;
    constructor(tb: Tb, outbox: Outbox);
    /**
     * Create a record. Without an `id`, one is generated here, so the record can
     * be used straight away, before the database has seen it.
     */
    create(data: CreateInput<Schema<O, Tb>>, options?: {
        id?: RecordIdValue;
    }): Write<Tb, RowOf<O, Tb>>;
    /** Change fields of a record. Other fields are left as they are. */
    update(id: RecordIdValue | RecordId<Tb>, data: Partial<RowOf<O, Tb>>): Write<Tb, RowOf<O, Tb>>;
    /** Delete a record. Deleting one that does not exist is not an error. */
    delete(id: RecordIdValue | RecordId<Tb>): Write<Tb, RowOf<O, Tb>>;
}
/** Create a {@link Store} over an ORM. */
declare function createStore<O extends Orm>(db: O, options?: StoreOptions): Store<O>;

export { type ConnectionEvents as C, type OutboxOp as O, QueryStore as Q, Store as S, TableWriter as T, type Write as W, type StoreSnapshot as a, type ConnectionSignal as b, type OutboxStorage as c, type QueryOptions as d, type QueryStoreDeps as e, type StoreMode as f, type StoreOptions as g, createStore as h, indexedDbStorage as i, memoryStorage as m };
