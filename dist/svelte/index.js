import "../chunk-MLKGABMK.js";

// src/svelte/index.ts
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
function queryStore(query) {
  return {
    subscribe(run) {
      if (!query) {
        run(SKIPPED);
        return () => {
        };
      }
      run(query.getSnapshot());
      return query.subscribe(() => run(query.getSnapshot()));
    }
  };
}
function pendingStore(store) {
  return {
    subscribe(run) {
      if (!store) {
        run(NO_OPS);
        return () => {
        };
      }
      run(store.pending.getSnapshot());
      return store.pending.subscribe(() => run(store.pending.getSnapshot()));
    }
  };
}
export {
  pendingStore,
  queryStore
};
