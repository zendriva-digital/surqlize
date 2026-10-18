import { ReactNode, ReactElement } from 'react';
import { O as Orm } from '../standard-schema-BtCNboat.cjs';
import { S as Store, O as OutboxOp, Q as QueryStore, a as StoreSnapshot } from '../store-ChxnTd70.cjs';
import 'surrealdb';

/**
 * What {@link useQuery} returns for a query that was skipped by passing
 * `null` or `undefined`.
 */
type SkippedSnapshot = {
    readonly status: "skipped";
};
/**
 * Subscribe a component to a query of a {@link Store}. It re-renders when the
 * result changes, and the live subscription starts with the first component
 * that uses the query and stops shortly after the last one unmounts.
 *
 * ```tsx
 * const open = useQuery(store.query("task", (q) => q.where({ done: false })));
 *
 * if (open.status === "loading") return <Spinner />;
 * if (open.status === "error") return <Retry onClick={...} />;
 * return <List items={open.data} />;
 * ```
 *
 * `store.query()` returns the same object for the same query, so it can be
 * called in the render. Pass `null` or `undefined` to skip the query until its
 * inputs are known; the result is then `{ status: "skipped" }`.
 *
 * On the server, and during hydration, the result is `{ status: "loading" }`.
 */
declare function useQuery<T>(query: QueryStore<T>): StoreSnapshot<T>;
declare function useQuery<T>(query: QueryStore<T> | null | undefined): StoreSnapshot<T> | SkippedSnapshot;
/**
 * The writes of a store that the database has not accepted yet, oldest first.
 * Use it to show that changes are unsaved, for example while offline.
 *
 * ```tsx
 * const pending = usePending(store);
 * return pending.length > 0 ? <span>Saving {pending.length} changes…</span> : null;
 * ```
 */
declare function usePending(store: Pick<Store<Orm>, "pending"> | null | undefined): readonly OutboxOp[];
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
    children?: ReactNode;
}): ReactElement;
/**
 * The store given to the nearest {@link StoreProvider}. Name the ORM to get its
 * tables typed: `useStore<typeof db>()`.
 *
 * @throws If there is no provider above the component.
 */
declare function useStore<O extends Orm = Orm>(): Store<O>;

export { type SkippedSnapshot, StoreProvider, usePending, useQuery, useStore };
