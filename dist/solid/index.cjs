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

// src/solid/index.ts
var solid_exports = {};
__export(solid_exports, {
  StoreProvider: () => StoreProvider,
  createPending: () => createPending,
  createQuery: () => createQuery,
  useStore: () => useStore
});
module.exports = __toCommonJS(solid_exports);
var import_solid_js = require("solid-js");
var LOADING = Object.freeze({ status: "loading" });
var SKIPPED = Object.freeze({ status: "skipped" });
var NO_OPS = Object.freeze([]);
var read = (source) => typeof source === "function" ? source() : source;
function follow(source, initial, skipped, attach) {
  const [value, setValue] = (0, import_solid_js.createSignal)(initial);
  (0, import_solid_js.createEffect)(() => {
    const current = read(source);
    if (current === null || current === void 0) {
      setValue(() => skipped);
      return;
    }
    (0, import_solid_js.onCleanup)(attach(current, (next) => setValue(() => next)));
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
var StoreContext = (0, import_solid_js.createContext)();
function StoreProvider(props) {
  return StoreContext.Provider({
    value: props.store,
    get children() {
      return props.children;
    }
  });
}
function useStore() {
  const store = (0, import_solid_js.useContext)(StoreContext);
  if (!store) {
    throw new Error("useStore() needs a <StoreProvider> above this component");
  }
  return store;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StoreProvider,
  createPending,
  createQuery,
  useStore
});
