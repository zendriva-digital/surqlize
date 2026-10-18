import { O as Orm } from '../standard-schema-BtCNboat.cjs';
import { S as Store, O as OutboxOp, Q as QueryStore, a as StoreSnapshot } from '../store-ChxnTd70.cjs';
import 'surrealdb';

/**
 * What {@link queryStore} holds for a query that was skipped by passing `null`
 * or `undefined`.
 */
type SkippedSnapshot = {
    readonly status: "skipped";
};
/**
 * A Svelte store: anything with `subscribe`, which calls its callback at once
 * with the current value and again on each change. Use it with `$`, or with
 * `get()` and `derived()` from `svelte/store`.
 */
type Readable<T> = {
    subscribe(run: (value: T) => void, invalidate?: () => void): () => void;
};
/**
 * A Svelte store that follows a query of a {@link Store}. The live subscription
 * starts with the first subscriber and stops shortly after the last one leaves,
 * so a component that is destroyed and created again straight away does not
 * restart it.
 *
 * ```svelte
 * <script>
 *   import { queryStore } from "surqlize/svelte";
 *   const open = queryStore(store.query("task", (q) => q.where({ done: false })));
 * </script>
 *
 * {#if $open.status === "loading"}
 *   <p>Loading…</p>
 * {:else if $open.status === "success"}
 *   {#each $open.data as task (String(task.id))}<li>{task.title}</li>{/each}
 * {/if}
 * ```
 *
 * `store.query()` returns the same object for the same query, so it can be
 * called where the store is made. Pass `null` or `undefined` to skip the query;
 * the value is then `{ status: "skipped" }`.
 */
declare function queryStore<T>(query: QueryStore<T> | null | undefined): Readable<StoreSnapshot<T> | SkippedSnapshot>;
/**
 * A Svelte store of the writes the database has not accepted yet, oldest first.
 * Use it to show that changes are unsaved, for example while offline.
 */
declare function pendingStore(store: Pick<Store<Orm>, "pending"> | null | undefined): Readable<readonly OutboxOp[]>;

export { type Readable, type SkippedSnapshot, pendingStore, queryStore };
