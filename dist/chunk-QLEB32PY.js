import {
  AnyType,
  ArrayType,
  BoolType,
  BytesType,
  DateType,
  DecimalType,
  DurationType,
  EdgeSchema,
  FloatType,
  GeometryType,
  IntType,
  LiteralType,
  NoneType,
  NullType,
  NumberType,
  ObjectType,
  OptionType,
  OrmError,
  PointType,
  RangeType,
  RecordType,
  SetType,
  StringType,
  UnionType,
  UuidType,
  __ctx,
  __display,
  __type,
  actionable,
  displayContext,
  inlineValue,
  t_exports
} from "./chunk-EQBUA4DZ.js";

// src/schema/ddl/syntax.ts
import { escapeIdent } from "surrealdb";
var PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function ident(name) {
  return PLAIN.test(name) ? name : escapeIdent(name);
}
function fieldPath(path) {
  return path.split(".").map((segment) => {
    let name = segment;
    let wildcards = "";
    while (name.endsWith("[*]")) {
      name = name.slice(0, -3);
      wildcards += "[*]";
    }
    return ident(name) + wildcards;
  }).join(".");
}
function quote(value, mark = "'") {
  const text = value.replaceAll("\\", "\\\\");
  if (mark === "'" && value.includes("'") && !value.includes('"')) {
    return `"${text}"`;
  }
  return `${mark}${text.split(mark).join(`\\${mark}`)}${mark}`;
}

// src/schema/ddl/event-ddl.ts
function defineEvent(tableName, event, options = {}) {
  const parts = ["DEFINE EVENT"];
  if (options.overwrite) parts.push("OVERWRITE");
  parts.push(ident(event.name), "ON TABLE", ident(tableName));
  parts.push("WHEN", buildWhen(event));
  parts.push("THEN", wrapThen(event.body));
  if (event.comment) {
    parts.push("COMMENT", quote(event.comment));
  }
  return `${parts.join(" ")};`;
}
function buildWhen(event) {
  const triggers = event.on ? Array.isArray(event.on) ? event.on : [event.on] : [];
  const guard2 = triggers.length ? triggers.map((op) => `$event = "${op}"`).join(" OR ") : null;
  if (guard2 && event.when) {
    const left = triggers.length > 1 ? `(${guard2})` : guard2;
    const right = hasTopLevelOr(event.when) ? `(${event.when})` : event.when;
    return `${left} AND ${right}`;
  }
  return guard2 ?? event.when ?? "true";
}
function hasTopLevelOr(condition) {
  let masked = condition;
  let previous;
  do {
    previous = masked;
    masked = masked.replace(
      /\([^()]*\)|'[^']*'|"[^"]*"/g,
      (m) => " ".repeat(m.length)
    );
  } while (masked !== previous);
  return masked.search(/\bOR\b/i) !== -1;
}
function wrapThen(body) {
  const trimmed = body.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  if (trimmed.includes(";") || /\b(FOR|IF|LET)\b/.test(trimmed)) {
    return `{ ${trimmed} }`;
  }
  return trimmed;
}

// src/schema/ddl/flatten.ts
function flattenFields(fields) {
  const flat = [];
  for (const [name, type] of Object.entries(fields)) {
    collect(name, type, flat);
  }
  return flat;
}
function collect(path, type, into) {
  into.push({ name: path, type, ddl: type.ddl });
  const nested = nestedObject(type);
  if (!nested) return;
  const prefix = path + "[*]".repeat(collectionDepth(type));
  for (const [key, child] of Object.entries(
    nested.schema
  )) {
    collect(`${prefix}.${key}`, child, into);
  }
}
function nestedObject(type) {
  const inner = unwrap(type);
  return inner instanceof ObjectType ? inner : null;
}
function unwrap(type) {
  if (type instanceof OptionType) return unwrap(type.schema);
  if (type instanceof SetType) return unwrap(type.schema);
  if (type instanceof ArrayType) {
    const schema = type.schema;
    if (Array.isArray(schema)) return type;
    return unwrap(schema);
  }
  return type;
}
function collectionDepth(type) {
  if (type instanceof OptionType) return collectionDepth(type.schema);
  if (type instanceof SetType)
    return 1 + collectionDepth(type.schema);
  if (type instanceof ArrayType && !Array.isArray(type.schema)) {
    return 1 + collectionDepth(type.schema);
  }
  return 0;
}

// src/schema/ddl/index-ddl.ts
var HNSW_DEFAULTS = {
  dist: "EUCLIDEAN",
  type: "F32",
  efc: 150,
  m: 12
};
var HNSW_FLOORS = { m: 2, efc: 1 };
function defineIndex(tableName, index, options = {}) {
  requireSingleColumn(index);
  requireHnswFloors(index);
  const parts = ["DEFINE INDEX"];
  if (options.overwrite) parts.push("OVERWRITE");
  parts.push(ident(index.name), "ON TABLE", ident(tableName));
  if (!index.count && index.fields?.length) {
    parts.push("FIELDS", index.fields.join(", "));
  }
  if (index.count) parts.push("COUNT");
  else if (index.hnsw) parts.push(...hnswClause(index.hnsw));
  else if (index.fulltext) {
    parts.push(...fulltextClause(index.name, index.fulltext));
  } else if (index.unique) parts.push("UNIQUE");
  if (index.concurrently) parts.push("CONCURRENTLY");
  if (index.comment) parts.push("COMMENT", quote(index.comment));
  return `${parts.join(" ")};`;
}
function requireSingleColumn(index) {
  const kind = index.fulltext ? "full-text" : index.hnsw ? "HNSW" : null;
  if (!kind) return;
  const count = index.fields?.length ?? 0;
  if (count <= 1) return;
  throw new Error(
    `Index '${index.name}' is ${kind} over ${count} columns. SurrealDB accepts exactly one column for these; define one index per column.`
  );
}
function requireHnswFloors(index) {
  const { hnsw } = index;
  if (!hnsw) return;
  const problems = [];
  const reasons = [];
  if (hnsw.m !== void 0 && !(hnsw.m >= HNSW_FLOORS.m)) {
    problems.push(`M must be at least ${HNSW_FLOORS.m}, got ${hnsw.m}`);
    reasons.push(
      "SurrealDB accepts M 1 and then grows its memory without limit."
    );
  }
  if (hnsw.efc !== void 0 && !(hnsw.efc >= HNSW_FLOORS.efc)) {
    problems.push(`EFC must be at least ${HNSW_FLOORS.efc}, got ${hnsw.efc}`);
    reasons.push(
      "EFC 0 was not seen to do that with a normal M, but it is refused as a precaution."
    );
  }
  if (problems.length === 0) return;
  throw new Error(
    `Index '${index.name}' is HNSW, but ${problems.join(" and ")}. ${reasons.join(" ")}`
  );
}
function fulltextClause(name, fulltext) {
  const options = fulltext === true ? {} : fulltext;
  if (!options.analyzer) {
    throw new Error(
      `Index '${name}' is full-text but names no analyzer. SurrealDB would fall back to one called 'like', which does not exist, so every write to the table would fail. Name one with \`fulltext: { analyzer: "\u2026" }\` and define it with analyzer().`
    );
  }
  const parts = ["FULLTEXT", "ANALYZER", options.analyzer];
  const bm25 = typeof options.bm25 === "object" ? options.bm25 : { k1: 1.2, b: 0.75 };
  parts.push(`BM25(${bm25.k1},${bm25.b})`);
  if (options.highlights) parts.push("HIGHLIGHTS");
  return parts;
}
function hnswClause(hnsw) {
  const m = hnsw.m ?? HNSW_DEFAULTS.m;
  return [
    "HNSW",
    "DIMENSION",
    String(hnsw.dimension),
    "DIST",
    hnsw.dist ?? HNSW_DEFAULTS.dist,
    "TYPE",
    hnsw.type ?? HNSW_DEFAULTS.type,
    "EFC",
    String(hnsw.efc ?? HNSW_DEFAULTS.efc),
    "M",
    String(m),
    "M0",
    String(hnsw.m0 ?? m * 2)
  ];
}

// src/schema/ddl/permissions.ts
import { RecordId } from "surrealdb";

// src/schema/ddl/condition.ts
var JOIN = /^ (AND|OR) /;
function simplifyCondition(condition) {
  return simplify(condition.trim()).text;
}
function simplify(text) {
  const { operands, joins } = split(text);
  if (operands.length === 1) {
    const only = operands[0];
    return isWrapped(only) ? simplify(only.slice(1, -1).trim()) : { text: collapse(only) };
  }
  const parts = operands.map((operand) => {
    if (!isWrapped(operand)) return collapse(operand);
    const inner = simplify(operand.slice(1, -1).trim());
    if (!inner.join) return inner.text;
    const redundant = inner.join === "AND" || joins.every((j) => j === "OR");
    return redundant ? inner.text : `(${inner.text})`;
  });
  const mixed = joins.includes("AND") && joins.includes("OR");
  const joined = parts.map(
    (part, i) => i ? ` ${joins[i - 1]} ${part}` : part
  );
  return { text: joined.join(""), join: mixed ? "OR" : joins[0] };
}
function split(text) {
  const operands = [];
  const joins = [];
  let start = 0;
  for (const { i, char, depth } of unquoted(text)) {
    if (i < start || depth !== 0 || char !== " ") continue;
    const join = JOIN.exec(text.slice(i, i + 5));
    if (!join) continue;
    operands.push(text.slice(start, i).trim());
    joins.push(join[1]);
    start = i + join[0].length;
  }
  operands.push(text.slice(start).trim());
  return { operands, joins };
}
function isWrapped(text) {
  return text.startsWith("(") && closing(text, 0) === text.length - 1;
}
function closing(text, open) {
  for (const { i, char, depth } of unquoted(text.slice(open))) {
    if (char === ")" && depth === 0) return open + i;
  }
  return -1;
}
function* unquoted(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (QUOTES.includes(char)) {
      i = endOfQuote(text, i);
      continue;
    }
    if (char === ")") depth--;
    yield { i, char, depth };
    if (char === "(") depth++;
  }
}
var QUOTES = ["'", '"', "`"];
function endOfQuote(text, open) {
  for (let i = open + 1; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === text[open]) return i;
  }
  return text.length;
}
function collapse(text) {
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] !== "(" || text[i + 1] !== "(") continue;
    const outer = closing(text, i);
    if (outer !== -1 && closing(text, i + 1) === outer - 1) {
      return collapse(
        text.slice(0, i) + text.slice(i + 1, outer) + text.slice(outer + 1)
      );
    }
  }
  return text;
}

// src/schema/ddl/permissions.ts
var TABLE_OPERATIONS = [
  "select",
  "create",
  "update",
  "delete"
];
var FIELD_OPERATIONS = ["select", "create", "update"];
var SESSION = t_exports.object({
  ac: t_exports.option(t_exports.string()),
  db: t_exports.option(t_exports.string()),
  ns: t_exports.option(t_exports.string()),
  id: t_exports.uuid(),
  ip: t_exports.option(t_exports.string()),
  or: t_exports.option(t_exports.string()),
  rd: t_exports.option(t_exports.record()),
  tk: t_exports.option(t_exports.object({})),
  exp: t_exports.option(t_exports.int())
});
var WhereRule = class {
  constructor(build, auth, related = []) {
    this.build = build;
    this.auth = auth;
    this.related = related;
  }
};
function isWhereRule(value) {
  return value instanceof WhereRule;
}
function where(build) {
  return new WhereRule(build);
}
function authenticatedAs(authTable, ...related) {
  return {
    where(build) {
      return new WhereRule(
        build,
        authTable,
        related
      );
    }
  };
}
function variable(ctx, name, type) {
  return actionable({
    [__ctx]: ctx,
    [__type]: type,
    [__display]: () => `$${name}`
  });
}
function unavailable(scope, name) {
  throw new OrmError(
    `$${name} is not available in the permissions of a ${scope}: use it in a field's permissions`
  );
}
function literal(value) {
  if (value instanceof RecordId) return `(${value.toString()})`;
  return typeof value === "string" ? stringLiteral(value) : inlineValue(value);
}
function stringLiteral(value) {
  const quoted = JSON.stringify(value);
  if (value.includes("'")) return quoted;
  const body = quoted.slice(1, -1).replace(/\\\\|\\"/g, (pair) => pair === '\\"' ? '"' : pair);
  return `'${body}'`;
}
function renderWhere(rule, scope, env) {
  const tables = { ...env.tables };
  for (const table of [rule.auth, ...rule.related]) {
    if (table) tables[table.tb] = table;
  }
  const id = /* @__PURE__ */ Symbol();
  const ctx = { orm: { tables }, id };
  const row = actionable({
    [__ctx]: ctx,
    [__type]: tables[env.tb]?.schema ?? t_exports.object({}),
    [__display]: () => "$this"
  });
  const field = (name) => {
    const value = variable(ctx, name, t_exports.any());
    return scope === "field" ? value : unavailable(scope, name);
  };
  const variables = {
    auth: variable(
      ctx,
      "auth",
      rule.auth ? new RecordType(rule.auth.tb) : t_exports.object({})
    ),
    session: variable(ctx, "session", SESSION),
    token: variable(ctx, "token", t_exports.object({})),
    access: variable(ctx, "access", t_exports.option(t_exports.string())),
    // Lazily, so a table's rule is only refused when it reads one.
    get value() {
      return field("value");
    },
    get before() {
      return field("before");
    },
    get after() {
      return field("after");
    }
  };
  const condition = rule.build(
    row,
    variables
  );
  return simplifyCondition(
    condition[__display](
      displayContext({ var: literal, variables: {}, contextId: id })
    )
  );
}
function guard(rule) {
  const trimmed = rule.trim();
  if (/^(FULL|NONE)$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^WHERE\b/i.test(trimmed)) return trimmed;
  return `WHERE ${trimmed}`;
}
function renderPermissions(rules, scope, env) {
  if (typeof rules === "string") return `PERMISSIONS ${rules}`;
  const allowed = scope === "field" ? FIELD_OPERATIONS : TABLE_OPERATIONS;
  const clauses = [];
  for (const [operation, rule] of Object.entries(rules)) {
    if (rule === void 0) continue;
    if (!allowed.includes(operation)) {
      throw new OrmError(
        `A ${scope} has no ${operation} permission: use ${allowed.join(", ")}`
      );
    }
    const sql = isWhereRule(rule) ? `WHERE ${renderWhere(rule, scope, env)}` : guard(rule);
    clauses.push(`FOR ${operation} ${sql}`);
  }
  return clauses.length ? `PERMISSIONS ${clauses.join(", ")}` : "";
}

// src/schema/ddl/print-type.ts
function printSurqlType(type, inline = false) {
  return printComposite(type, inline) ?? (type instanceof ObjectType && inline ? printObject(type) : null) ?? LEAF_TYPES.find(([cls]) => type instanceof cls)?.[1] ?? // GraphType and anything else added later: `any` is the only safe
  // fallback, and it is never wrong — just less precise than it could be.
  "any";
}
function printComposite(type, inline) {
  if (type instanceof OptionType) {
    return `option<${printSurqlType(type.schema, inline)}>`;
  }
  if (type instanceof SetType) {
    return `set<${printSurqlType(type.schema)}${bound(type.max)}>`;
  }
  if (type instanceof ArrayType) return printArray(type);
  if (type instanceof RecordType) {
    const tb = type.tb;
    if (tb === void 0) return "record";
    return `record<${(Array.isArray(tb) ? tb : [tb]).map(ident).join(" | ")}>`;
  }
  if (type instanceof GeometryType) {
    return type.kind ? `geometry<${type.kind}>` : "geometry";
  }
  if (type instanceof UnionType) return printMembers(type.schema, " | ");
  if (type instanceof LiteralType) {
    const value = type.value;
    return typeof value === "string" ? quote(value) : String(value);
  }
  return null;
}
function printArray(type) {
  const schema = type.schema;
  if (Array.isArray(schema)) return `[${printMembers(schema, ", ")}]`;
  return `array<${printSurqlType(schema)}${bound(type.max)}>`;
}
function printMembers(members, separator) {
  const printed = members.map((member) => printSurqlType(member, true));
  return (separator === " | " ? [...new Set(printed)] : printed).join(
    separator
  );
}
function printObject(type) {
  const fields = Object.entries(
    type.schema
  ).map(([key, field]) => `${ident(key)}: ${printSurqlType(field, true)}`);
  return `{ ${fields.join(", ")} }`;
}
function bound(max) {
  return max === void 0 ? "" : `, ${max}`;
}
var LEAF_TYPES = [
  [IntType, "int"],
  [FloatType, "float"],
  [DecimalType, "decimal"],
  [NumberType, "number"],
  [StringType, "string"],
  [BoolType, "bool"],
  [DateType, "datetime"],
  [UuidType, "uuid"],
  [DurationType, "duration"],
  [BytesType, "bytes"],
  [PointType, "geometry<point>"],
  [ObjectType, "object"],
  // SurrealDB has no `range<T>` — only a bare `range`.
  [RangeType, "range"],
  [NullType, "null"],
  [NoneType, "none"],
  [AnyType, "any"]
];

// src/schema/ddl/define.ts
function environment(tb, options, schema) {
  return {
    tb,
    tables: { ...options.tables, ...schema ? { [tb]: schema } : {} }
  };
}
function permissionsClause(rules, scope, tb, options, schema) {
  const clause = renderPermissions(
    rules,
    scope,
    environment(tb, options, schema)
  );
  return clause ? [clause] : [];
}
function defineField(tableName, field, options = {}) {
  const parts = ["DEFINE FIELD"];
  if (options.overwrite) parts.push("OVERWRITE");
  parts.push(fieldPath(field.name), "ON TABLE", ident(tableName));
  const ddl = field.ddl;
  parts.push("TYPE", printSurqlType(field.type));
  if (ddl.flexible) parts.push("FLEXIBLE");
  if (ddl.default !== void 0) {
    parts.push(
      ddl.default.always ? "DEFAULT ALWAYS" : "DEFAULT",
      literal2(ddl.default.value, ddl.default.expression)
    );
  }
  if (ddl.value !== void 0) parts.push("VALUE", ddl.value);
  if (ddl.computed !== void 0) parts.push("VALUE", `{ ${ddl.computed} }`);
  if (ddl.readonly) parts.push("READONLY");
  if (ddl.reference) {
    parts.push("REFERENCE");
    if (ddl.reference.onDelete) {
      parts.push("ON DELETE", ddl.reference.onDelete);
    }
  }
  if (ddl.assert?.length) {
    parts.push("ASSERT", joinAsserts(ddl.assert));
  }
  if (ddl.permissions) {
    parts.push(
      ...permissionsClause(ddl.permissions, "field", tableName, options)
    );
  }
  if (ddl.comment) parts.push("COMMENT", quote(ddl.comment, "'"));
  return `${parts.join(" ")};`;
}
function defineTable(schema, options = {}) {
  const ddl = schema.ddl;
  const parts = ["DEFINE TABLE"];
  if (options.overwrite) parts.push("OVERWRITE");
  parts.push(ident(schema.tb));
  if (schema instanceof EdgeSchema) {
    parts.push(
      "TYPE RELATION IN",
      tableList(schema.from),
      "OUT",
      tableList(schema.to)
    );
    if (ddl.enforced) parts.push("ENFORCED");
  } else {
    parts.push("TYPE NORMAL");
  }
  if (ddl.drop) parts.push("DROP");
  parts.push(ddl.schemafull === false ? "SCHEMALESS" : "SCHEMAFULL");
  if (ddl.view) parts.push("AS", ddl.view);
  if (ddl.changefeed) {
    parts.push("CHANGEFEED", ddl.changefeed.duration);
    if (ddl.changefeed.includeOriginal) parts.push("INCLUDE ORIGINAL");
  }
  if (ddl.permissions) {
    parts.push(
      ...permissionsClause(
        ddl.permissions,
        "table",
        schema.tb,
        options,
        schema
      )
    );
  }
  if (ddl.comment) parts.push("COMMENT", quote(ddl.comment, "'"));
  return `${parts.join(" ")};`;
}
function defineSchema(schema, options = {}) {
  return schemaStatements(schema, options).map((statement) => statement.sql);
}
function schemaStatements(schema, options = {}) {
  const statements = [
    { kind: "table", name: schema.tb, sql: defineTable(schema, options) }
  ];
  const declared = schema._fields;
  const computed = new Set(
    "computedFields" in schema ? schema.computedFields : []
  );
  for (const field of flattenFields(schema.fields)) {
    if (isManagedBySurrealDB(schema, field.name, declared)) continue;
    if (computed.has(field.name.split(/[.[]/)[0])) continue;
    statements.push({
      kind: "field",
      name: `${schema.tb}.${field.name}`,
      sql: defineField(schema.tb, field, {
        ...options,
        tables: environment(schema.tb, options, schema).tables
      })
    });
  }
  if ("rawComputedStatements" in schema) {
    for (const [name, sql] of schema.rawComputedStatements(options.overwrite)) {
      statements.push({ kind: "field", name: `${schema.tb}.${name}`, sql });
    }
  }
  for (const [name, index] of Object.entries(schema.ddl.indexes ?? {})) {
    statements.push({
      kind: "index",
      name: `${schema.tb}.${name}`,
      sql: defineIndex(schema.tb, { name, ...index }, options)
    });
  }
  for (const [name, event] of Object.entries(schema.ddl.events ?? {})) {
    statements.push({
      kind: "event",
      name: `${schema.tb}.${name}`,
      sql: defineEvent(schema.tb, { name, ...event }, options)
    });
  }
  return statements;
}
function isManagedBySurrealDB(schema, fieldName, declared) {
  if (schema instanceof EdgeSchema && (fieldName === "in" || fieldName === "out")) {
    return true;
  }
  return fieldName === "id" && !("id" in declared);
}
function joinAsserts(conditions) {
  if (conditions.length === 1) return conditions[0];
  return conditions.map((c) => hasTopLevelOr2(c) ? `(${c})` : c).join(" AND ");
}
function hasTopLevelOr2(condition) {
  return maskNested(condition).search(/\bOR\b/i) !== -1;
}
function maskNested(input) {
  const unquoted2 = input.replace(
    /'[^']*'|"[^"]*"/g,
    (match) => " ".repeat(match.length)
  );
  const out = [];
  let depth = 0;
  for (const char of unquoted2) {
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else {
      out.push(depth > 0 ? " " : char);
      continue;
    }
    out.push(" ");
  }
  return out.join("");
}
function tableList(tables) {
  return (Array.isArray(tables) ? tables : [String(tables)]).map(ident).join(" | ");
}
function literal2(value, expression = false) {
  if (typeof value === "string") {
    return expression ? value : quote(value, "'");
  }
  if (value === null) return "NULL";
  if (value === void 0) return "NONE";
  if (value instanceof Date) return `d'${value.toISOString()}'`;
  if (value instanceof Set) {
    return `<set>[${[...value].map((member) => literal2(member)).join(", ")}]`;
  }
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export {
  quote,
  defineEvent,
  flattenFields,
  defineIndex,
  WhereRule,
  where,
  authenticatedAs,
  printSurqlType,
  defineField,
  defineTable,
  defineSchema,
  schemaStatements
};
