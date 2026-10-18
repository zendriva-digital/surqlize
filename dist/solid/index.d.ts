import { JSX, Accessor } from 'solid-js';
import { O as Orm } from '../standard-schema-BtCNboat.js';
import { S as Store, O as OutboxOp, Q as QueryStore, a as StoreSnapshot } from '../store-DMdKf4Ys.js';
import 'surrealdb';

/**
 * What {@link createQuery} returns for a query that was skipped by passing
 * `null` or `undefined`.
 */
type SkippedSnapshot = {
    readonly status: "skipped";
};
type Source<S> = S | null | undefined | Accessor<S | null | undefined>;
/**
 * Follow a query of a {@link Store}. The returned accessor holds the snapshot
 * and updates whenever the result changes; the live subscription starts with
 * the first component that uses the query and stops shortly after the last one
 * is disposed.
 *
 * ```tsx
 * const open = createQuery(store.query("task", (q) => q.where({ done: false })));
 *
 * return (
 *   <Switch>
 *     <Match when={open().status === "loading"}>Loading…</Match>
 *     <Match when={open().status === "success"}>
 *       <For each={(open() as { data: Task[] }).data}>{(t) => <li>{t.title}</li>}</For>
 *     </Match>
 *   </Switch>
 * );
 * ```
 *
 * `store.query()` returns the same object for the same query, so it can be
 * called in the component body. Pass an accessor to change the query over time,
 * and `null` or `undefined` to skip it: the value is then `{ status: "skipped" }`.
 *
 * On the server the value stays `{ status: "loading" }`; the query runs in the
 * browser.
 */
declare function createQuery<T>(query: Source<QueryStore<T>>): Accessor<StoreSnapshot<T> | SkippedSnapshot>;
/**
 * The writes of a store that the database has not accepted yet, oldest first.
 * Use it to show that changes are unsaved, for example while offline.
 */
declare function createPending(store: Source<Pick<Store<Orm>, "pending">>): Accessor<readonly OutboxOp[]>;
/**
 * Make a store available to the components below, for {@link useStore}.
 *
 * ```tsx
 * <StoreProvider store={store}>
 *   <App />
 * </StoreProvider>
 * ```
 */
declare function StoreProvider(props: {
    store: Store<any>;
    children?: JSX.Element;
}): JSX.Element;
/**
 * The store given to the nearest {@link StoreProvider}. Name the ORM to get its
 * tables typed: `useStore<typeof db>()`.
 *
 * @throws If there is no provider above the component.
 */
declare function useStore<O extends Orm = Orm>(): Store<O>;

export { type SkippedSnapshot, StoreProvider, createPending, createQuery, useStore };
