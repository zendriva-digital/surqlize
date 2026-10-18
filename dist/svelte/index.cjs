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

// src/svelte/index.ts
var svelte_exports = {};
__export(svelte_exports, {
  pendingStore: () => pendingStore,
  queryStore: () => queryStore
});
module.exports = __toCommonJS(svelte_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pendingStore,
  queryStore
});
