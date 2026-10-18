import "../chunk-MLKGABMK.js";

// src/solid/index.ts
import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext
} from "solid-js";
var LOADING = Object.freeze({ status: "loading" });
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
var read = (source) => typeof source === "function" ? source() : source;
function follow(source, initial, skipped, attach) {
  const [value, setValue] = createSignal(initial);
  createEffect(() => {
    const current = read(source);
    if (current === null || current === void 0) {
      setValue(() => skipped);
      return;
    }
    onCleanup(attach(current, (next) => setValue(() => next)));
  });
  return value;
}
function createQuery(query) {
  return follow(
    query,
    LOADING,
    SKIPPED,
    (q, set) => {
      set(q.getSnapshot());
      return q.subscribe(() => set(q.getSnapshot()));
    }
  );
}
function createPending(store) {
  return follow(
    store,
    NO_OPS,
    NO_OPS,
    (s, set) => {
      set(s.pending.getSnapshot());
      return s.pending.subscribe(() => set(s.pending.getSnapshot()));
    }
  );
}
var StoreContext = createContext();
function StoreProvider(props) {
  return StoreContext.Provider({
    value: props.store,
    get children() {
      return props.children;
    }
  });
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
  createPending,
  createQuery,
  useStore
};
