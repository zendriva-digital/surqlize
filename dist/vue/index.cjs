"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vue/index.ts
var vue_exports = {};
__export(vue_exports, {
  provideStore: () => provideStore,
  storeKey: () => STORE_KEY,
  usePending: () => usePending,
  useQuery: () => useQuery,
  useStore: () => useStore
});
module.exports = __toCommonJS(vue_exports);
var import_vue = require("vue");
var LOADING = Object.freeze({ status: "loading" });
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
function follow(source, initial, skipped, attach) {
  const state = (0, import_vue.shallowRef)(initial);
  const active = (0, import_vue.shallowRef)((0, import_vue.getCurrentInstance)() === null);
  if ((0, import_vue.getCurrentInstance)()) (0, import_vue.onMounted)(() => active.value = true);
  (0, import_vue.watch)(
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
    () => (0, import_vue.toValue)(query),
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
    () => (0, import_vue.toValue)(store),
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
  (0, import_vue.provide)(STORE_KEY, store);
}
function useStore() {
  const store = (0, import_vue.inject)(STORE_KEY, void 0);
  if (!store) {
    throw new Error("useStore() needs provideStore() in a component above it");
  }
  return store;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  provideStore,
  storeKey,
  usePending,
  useQuery,
  useStore
});
