import { InjectionKey, MaybeRefOrGetter, ShallowRef } from 'vue';
import { O as Orm } from '../standard-schema-BtCNboat.js';
import { S as Store, O as OutboxOp, Q as QueryStore, a as StoreSnapshot } from '../store-DMdKf4Ys.js';
import 'surrealdb';

/**
 * What {@link useQuery} holds for a query that was skipped by passing `null` or
 * `undefined`.
 */
type SkippedSnapshot = {
    readonly status: "skipped";
};
/**
 * Follow a query of a {@link Store} in a component. The returned ref holds the
 * snapshot and updates whenever the result changes; the live subscription starts
 * with the first component that uses the query and stops shortly after the last
 * one is unmounted.
 *
 * ```vue
 * <script setup>
 * import { useQuery } from "surqlize/vue";
 * const open = useQuery(store.query("task", (q) => q.where({ done: false })));
 * </script>
 *
 * <template>
 *   <p v-if="open.status === 'loading'">Loading…</p>
 *   <ul v-else-if="open.status === 'success'">
 *     <li v-for="task in open.data" :key="String(task.id)">{{ task.title }}</li>
 *   </ul>
 * </template>
 * ```
 *
 * `store.query()` returns the same object for the same query, so it can be
 * called while setting up. Pass a ref or a getter to change the query over
 * time, and `null` or `undefined` to skip it: the value is then
 * `{ status: "skipped" }`.
 *
 * On the server the value stays `{ status: "loading" }`; the query runs in the
 * browser.
 */
declare function useQuery<T>(query: MaybeRefOrGetter<QueryStore<T> | null | undefined>): Readonly<ShallowRef<StoreSnapshot<T> | SkippedSnapshot>>;
/**
 * The writes of a store that the database has not accepted yet, oldest first.
 * Use it to show that changes are unsaved, for example while offline.
 */
declare function usePending(store: MaybeRefOrGetter<Pick<Store<Orm>, "pending"> | null | undefined>): Readonly<ShallowRef<readonly OutboxOp[]>>;
declare const STORE_KEY: InjectionKey<Store<any>>;
/**
 * Make a store available to the components below the one that calls this, for
 * {@link useStore}. Call it in `setup`, or on an app with `app.provide`.
 */
declare function provideStore(store: Store<any>): void;
/**
 * The store given by {@link provideStore}. Name the ORM to get its tables
 * typed: `useStore<typeof db>()`.
 *
 * @throws If no component above this one provided a store.
 */
declare function useStore<O extends Orm = Orm>(): Store<O>;

export { type SkippedSnapshot, provideStore, STORE_KEY as storeKey, usePending, useQuery, useStore };
