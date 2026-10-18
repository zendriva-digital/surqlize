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

// src/react/index.ts
var react_exports = {};
__export(react_exports, {
  StoreProvider: () => StoreProvider,
  usePending: () => usePending,
  useQuery: () => useQuery,
  useStore: () => useStore
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");
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
  return (0, import_react.useSyncExternalStore)(
    query ? query.subscribe : subscribeNothing,
    query ? query.getSnapshot : getSkipped,
    query ? getLoading : getSkipped
  );
}
function usePending(store) {
  return (0, import_react.useSyncExternalStore)(
    store ? store.pending.subscribe : subscribeNothing,
    store ? store.pending.getSnapshot : getNoOps,
    getNoOps
  );
}
var StoreContext = (0, import_react.createContext)(void 0);
function StoreProvider(props) {
  return (0, import_react.createElement)(
    StoreContext.Provider,
    { value: props.store },
    props.children
  );
}
function useStore() {
  const store = (0, import_react.useContext)(StoreContext);
  if (!store) {
    throw new Error("useStore() needs a <StoreProvider> above this component");
  }
  return store;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StoreProvider,
  usePending,
  useQuery,
  useStore
});
