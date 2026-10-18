import "../chunk-MLKGABMK.js";

// src/react/index.ts
import {
  createContext,
  createElement,
  useContext,
  useSyncExternalStore
} from "react";
var LOADING = Object.freeze({ status: "loading" });
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
var noUnsubscribe = () => {
};
var subscribeNothing = () => noUnsubscribe;
var getSkipped = () => SKIPPED;
var getLoading = () => LOADING;
var getNoOps = () => NO_OPS;
function useQuery(query) {
  return useSyncExternalStore(
    query ? query.subscribe : subscribeNothing,
    query ? query.getSnapshot : getSkipped,
    query ? getLoading : getSkipped
  );
}
function usePending(store) {
  return useSyncExternalStore(
    store ? store.pending.subscribe : subscribeNothing,
    store ? store.pending.getSnapshot : getNoOps,
    getNoOps
  );
}
var StoreContext = createContext(void 0);
function StoreProvider(props) {
  return createElement(
    StoreContext.Provider,
    { value: props.store },
    props.children
  );
}
function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore() needs a <StoreProvider> above this component");
  }
  return store;
}
export {
  StoreProvider,
  usePending,
  useQuery,
  useStore
};
