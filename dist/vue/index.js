import "../chunk-MLKGABMK.js";

// src/vue/index.ts
import {
  getCurrentInstance,
  inject,
  onMounted,
  provide,
  shallowRef,
  toValue,
  watch
} from "vue";
var LOADING = Object.freeze({ status: "loading" });
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
function follow(source, initial, skipped, attach) {
  const state = shallowRef(initial);
  const active = shallowRef(getCurrentInstance() === null);
  if (getCurrentInstance()) onMounted(() => active.value = true);
  watch(
    [source, active],
    ([value, on], _old, onCleanup) => {
      if (!on) return;
      if (value === null || value === void 0) {
        state.value = skipped;
        return;
      }
      onCleanup(attach(value, (next) => state.value = next));
    },
    { immediate: true, flush: "sync" }
  );
  return state;
}
function useQuery(query) {
  return follow(
    () => toValue(query),
    LOADING,
    SKIPPED,
    (q, set) => {
      set(q.getSnapshot());
      return q.subscribe(() => set(q.getSnapshot()));
    }
  );
}
function usePending(store) {
  return follow(
    () => toValue(store),
    NO_OPS,
    NO_OPS,
    (s, set) => {
      set(s.pending.getSnapshot());
      return s.pending.subscribe(() => set(s.pending.getSnapshot()));
    }
  );
}
var STORE_KEY = /* @__PURE__ */ Symbol("surqlize.store");
function provideStore(store) {
  provide(STORE_KEY, store);
}
function useStore() {
  const store = inject(STORE_KEY, void 0);
  if (!store) {
    throw new Error("useStore() needs provideStore() in a component above it");
  }
  return store;
}
export {
  provideStore,
  STORE_KEY as storeKey,
  usePending,
  useQuery,
  useStore
};
