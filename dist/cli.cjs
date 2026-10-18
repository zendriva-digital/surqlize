#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/cli/index.ts
var import_node_fs2 = require("fs");
var import_promises = require("fs/promises");
var import_node_util = require("util");
var import_surrealdb7 = require("surrealdb");

// src/migrator/canonical.ts
var DURATION_UNITS = [
  ["y", 365n * 24n * 3600n * 1000000000n],
  ["w", 7n * 24n * 3600n * 1000000000n],
  ["d", 24n * 3600n * 1000000000n],
  ["h", 3600n * 1000000000n],
  ["m", 60n * 1000000000n],
  ["s", 1000000000n],
  ["ms", 1000000n],
  ["us", 1000n],
  ["ns", 1n]
];
var DURATION_PART = /(\d+)(ns|µs|us|ms|[ywdhms])/g;
var DURATION = /\b(?:\d+(?:ns|µs|us|ms|[ywdhms]))+\b/g;
function normaliseDuration(text) {
  let total = 0n;
  let matched = false;
  DURATION_PART.lastIndex = 0;
  for (const part of text.matchAll(DURATION_PART)) {
    const unit = part[2] === "\xB5s" ? "us" : part[2];
    const size = DURATION_UNITS.find(([name]) => name === unit)?.[1];
    if (size === void 0) return text;
    total += BigInt(part[1]) * size;
    matched = true;
  }
  if (!matched) return text;
  if (total === 0n) return "0ns";
  let rest = total;
  let out = "";
  for (const [unit, size] of DURATION_UNITS) {
    const count = rest / size;
    if (count > 0n) {
      out += `${count}${unit}`;
      rest -= count * size;
    }
  }
  return out;
}
var AFTER_TYPE = /\s+(FLEXIBLE|DEFAULT|VALUE|READONLY|REFERENCE|ASSERT|PERMISSIONS|COMMENT)\b/i;
var RULES = [
  // `DEFINE FIELD x ON TABLE t` is stored as `DEFINE FIELD x ON t`
  [/\bON\s+TABLE\s+/gi, "ON "],
  // OVERWRITE says how a statement is applied, not what it defines
  [/\bDEFINE\s+(FIELD|TABLE)\s+OVERWRITE\s+/gi, "DEFINE $1 "],
  // A config is reported without its keyword: `DEFINE CONFIG GRAPHQL TABLES
  // AUTO` reads back as `GRAPHQL TABLES AUTO`. Stripped from both sides.
  [/^DEFINE\s+CONFIG\s+(OVERWRITE\s+)?/i, ""],
  // SurrealDB backticks identifiers when it stores them — function namespaces
  // (`rand`::uuid::v7()) and any field whose name is a reserved word (`by`).
  // Applied to both sides, so a genuine backtick inside a string literal would
  // be stripped from both and still compare equal.
  [/`([A-Za-z_][A-Za-z0-9_]*)`/g, "$1"],
  // Array element fields are reported with dots but defined with brackets
  [/\[\*\]/g, ".*"],
  // CONCURRENTLY says how to build an index, not what it is, and is not stored
  [/\s+CONCURRENTLY\b/gi, ""],
  // HNSW derives LM from M, as a long float. Comparing it adds nothing that
  // comparing M does not, and matching the printed precision is fragile.
  [/\s+LM\s+[\d.]+f?/gi, ""],
  // SurrealDB stores string literals single-quoted. Only rewrite literals with
  // no quote of either kind inside, so an apostrophe cannot change the meaning.
  [/"([^"'\\]*)"/g, "'$1'"],
  // A non-integer literal reads back with a float suffix, whatever the field's
  // declared type: `DEFAULT 1.5` on a decimal is stored as `DEFAULT 1.5f`.
  [/(\d+\.\d+)f\b/g, "$1"],
  // A set default reads back with a space after the cast: `DEFAULT <set>[]` is
  // stored as `DEFAULT <set> []`. Applied before whitespace is collapsed.
  [/<set>\s+\[/g, "<set>["],
  // `IN` is stored as `INSIDE`, and `NOT IN` as `NOT INSIDE`
  [/\bNOT\s+INSIDE\b/g, "NOT IN"],
  [/\bINSIDE\b/g, "IN"],
  // A THROW used as a value reads back parenthesised: `?? (THROW 'x')`
  [/\(\s*(THROW\s+'[^']*')\s*\)/g, "$1"],
  // A function body reads back without the semicolon before its closing brace
  [/;\s*\}/g, " }"],
  // Whitespace carries no meaning between tokens
  [/\s+/g, " "],
  // An empty block is stored spaced: `DEFAULT {}` reads back as `DEFAULT {  }`
  [/\{\s*\}/g, "{}"],
  // Nor does spacing around a separator: TOKENIZERS BLANK,CLASS is stored
  // unspaced while FILTERS LOWERCASE, ASCII is spaced.
  [/\s*,\s*/g, ", "]
];
function canonicalise(statement) {
  let result = statement.trim().replace(/;$/, "");
  for (const [pattern, replacement] of RULES) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(DURATION, normaliseDuration);
  const { body, comment, permissions } = extractTrailingClauses(result);
  const parts = [normaliseTypeClause(body).trim()];
  if (comment) parts.push(`COMMENT ${comment}`);
  if (/^DEFINE (FIELD|TABLE)\b/i.test(result)) {
    parts.push(
      normalisePermissions(permissions, /^DEFINE FIELD\b/i.test(result))
    );
  } else if (permissions && !/^(FULL|NONE)$/i.test(permissions)) {
    parts.push(`PERMISSIONS ${permissions}`);
  }
  return unwrapThen(parts.join(" ").trim());
}
function unwrapThen(statement) {
  const start = statement.search(/\bTHEN\s+\(/);
  if (start === -1) return statement;
  const open = statement.indexOf("(", start);
  const close = matchParen(statement, open);
  if (close === -1) return statement;
  return statement.slice(0, open) + statement.slice(open + 1, close) + statement.slice(close + 1);
}
function matchParen(input, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < input.length; i++) {
    if (input[i] === "(") depth += 1;
    else if (input[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function extractTrailingClauses(statement) {
  const comment = statement.match(/\sCOMMENT\s+('[^']*'|"[^"]*")/i);
  const permissions = statement.match(
    /\sPERMISSIONS\s+(.+?)(?=\sCOMMENT\s|$)/i
  );
  let body = statement;
  if (comment) body = body.replace(comment[0], "");
  if (permissions) body = body.replace(permissions[0], "");
  return {
    body: body.trim(),
    comment: comment?.[1] ?? null,
    permissions: permissions?.[1]?.trim() ?? null
  };
}
function normalisePermissions(clause, isField) {
  const fallback = isField ? "FULL" : "NONE";
  const rules = {
    create: fallback,
    delete: fallback,
    select: fallback,
    update: fallback
  };
  if (clause && !/^(FULL|NONE)$/i.test(clause)) {
    for (const group of clause.split(/\bFOR\b/i)) {
      const trimmed = group.trim().replace(/,$/, "").trim();
      if (!trimmed) continue;
      const [operations, rule] = splitOperations(trimmed);
      for (const operation of operations) rules[operation] = rule;
    }
  } else if (clause) {
    for (const operation of OPERATIONS) rules[operation] = clause.toUpperCase();
  }
  return `PERMISSIONS ${OPERATIONS.map((op) => `FOR ${op} ${rules[op]}`).join(", ")}`;
}
function splitOperations(group) {
  const operations = [];
  let rest = group;
  while (true) {
    const match = rest.match(/^(create|delete|select|update)\s*,?\s*/i);
    if (!match) break;
    operations.push(match[1].toLowerCase());
    rest = rest.slice(match[0].length);
  }
  return [operations, rest.trim() || "FULL"];
}
var OPERATIONS = ["create", "delete", "select", "update"];
function normaliseTypeExpression(expression) {
  let out = "";
  let i = 0;
  while (i < expression.length) {
    if (expression.startsWith("option<", i)) {
      const open = i + "option".length;
      const close = matchAngleBracket(expression, open);
      if (close === -1) {
        out += expression.slice(i);
        break;
      }
      out += `none | ${normaliseTypeExpression(expression.slice(open + 1, close))}`;
      i = close + 1;
      continue;
    }
    const collection = collectionAt(expression, i);
    if (collection) {
      const open = i + collection.length;
      const close = matchAngleBracket(expression, open);
      if (close === -1) {
        out += expression.slice(i);
        break;
      }
      out += collapseElement(
        collection,
        normaliseTypeExpression(expression.slice(open + 1, close))
      );
      i = close + 1;
      continue;
    }
    out += expression[i];
    i += 1;
  }
  return out;
}
function collectionAt(expression, index) {
  if (expression.startsWith("array<", index)) return "array";
  if (expression.startsWith("set<", index)) return "set";
  return null;
}
function collapseElement(collection, inner) {
  return inner.trim() === "any" ? collection : `${collection}<${inner}>`;
}
function matchAngleBracket(input, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < input.length; i++) {
    if (input[i] === "<") depth += 1;
    else if (input[i] === ">") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function normaliseTypeClause(statement) {
  const start = statement.search(/\bTYPE\s+/i);
  if (start === -1) return statement;
  const typeStart = start + statement.slice(start).match(/\bTYPE\s+/i)[0].length;
  const rest = statement.slice(typeStart);
  const end = rest.search(AFTER_TYPE);
  const expression = end === -1 ? rest : rest.slice(0, end);
  const trailing = end === -1 ? "" : rest.slice(end);
  return statement.slice(0, typeStart) + normaliseTypeExpression(expression) + trailing;
}

// src/types/classes.ts
var import_surrealdb = require("surrealdb");

// src/error.ts
var OrmError = class extends Error {
};
var ValidationError = class extends OrmError {
  constructor(issues, table, subject) {
    const where = subject ?? (table === void 0 ? "data" : `data for table "${table}"`);
    const count = `${issues.length} validation error${issues.length === 1 ? "" : "s"}`;
    super(
      `Invalid ${where}: ${count}
${issues.map((i) => `  - ${i.message}`).join("\n")}`
    );
    this.issues = issues;
    this.table = table;
    this.name = "ValidationError";
  }
};
var TypeParseError = class extends Error {
  name;
  expected;
  found;
  constructor(name, expected, found) {
    if (Array.isArray(expected)) {
      const expected_str = expected.length <= 1 ? expected.join("") : expected.length === 2 ? expected.join(" or ") : `${expected.slice(0, -1).join(", ")} or ${expected.slice(-1)}`;
      super(`Expected ${expected_str} but found ${found}`);
    } else {
      super(`Expected ${expected} but found ${found}`);
    }
    this.name = name;
    this.expected = expected;
    this.found = found;
  }
};

// src/types/classes.ts
var IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
function pathSegment(prop) {
  if (typeof prop === "string" && IDENTIFIER.test(prop)) return `.${prop}`;
  return `[${JSON.stringify(prop)}]`;
}
var SurqlExpression = class {
  constructor(sql) {
    this.sql = sql;
  }
};
var AbstractType = class {
  infer = void 0;
  accept = void 0;
  /** The default applied on create when the field is absent. See {@link default}. */
  /**
   * Give this field a default, applied by CREATE, INSERT and RELATE when the
   * field is omitted. `.content()`, `.merge()` and INSERT also apply it when the
   * key is `undefined`; `.set()` does not, because the key was supplied. The
   * field becomes optional in create input while its output type is unchanged.
   * Accepts a static value, a function (e.g. `() => new Date()`, evaluated per
   * query), or an {@link expr} SurrealQL expression evaluated by the database.
   *
   * Returns a copy; the original type is left untouched.
   */
  default(value) {
    const copy = patchDdl(this, (d) => {
      d.default = fieldDefault(value, false);
      if (d.default === void 0) delete d.default;
    });
    copy._default = value;
    return copy;
  }
  /**
   * Schema metadata used to generate `DEFINE FIELD`. Empty unless one of the
   * modifiers below has been used, and never affects the inferred type.
   */
  ddl = {};
  /**
   * Validate and return `value`, or throw if it does not match this type.
   *
   * @throws {TypeParseError} If `value` fails validation.
   */
  parse(value) {
    if (!this.validate(value))
      throw new TypeParseError(this.name, this.expected, value);
    return value;
  }
  get(prop) {
    return [new NoneType(), pathSegment(prop)];
  }
  // -------------------------------------------------------------------------
  // Schema modifiers
  //
  // Each returns a shallow clone carrying the updated metadata, mirroring the
  // immutability of the query builders (see `Query.derive`). Types are shared
  // freely — the same `t.string()` can be assigned to two fields — so mutating
  // in place would let one field's constraints leak into another.
  //
  // These are typed with a `this` *parameter* rather than a polymorphic `this`
  // return type. Both preserve the concrete subclass through a chain, but a
  // polymorphic `this` in the signature makes `AbstractType` non-assignable to
  // a subtype-constrained generic, which breaks `Workable<C, R>` inference
  // throughout the query builder.
  // -------------------------------------------------------------------------
  /**
   * Add an `ASSERT` condition. Call more than once to require several — they
   * are joined with `AND`.
   */
  assert(condition) {
    return patchDdl(this, (d) => {
      d.assert = [...d.assert ?? [], condition];
    });
  }
  /**
   * Set a `DEFAULT ALWAYS` value, re-applied on every update. As with
   * {@link default}, a string is data and SurrealQL is written with {@link expr}:
   * `t.date().defaultAlways(expr("time::now()"))`.
   */
  defaultAlways(value) {
    return patchDdl(this, (d) => {
      d.default = fieldDefault(value, true);
      if (d.default === void 0) delete d.default;
    });
  }
  /**
   * Set a `VALUE` expression, evaluated on write.
   *
   * Named `valueExpr` rather than `value` because {@link LiteralType} already
   * exposes a `value` accessor.
   */
  valueExpr(expression) {
    return patchDdl(this, (d) => {
      d.value = expression;
    });
  }
  /** Set a `VALUE { … }` expression, deferred until the field is read. */
  computed(expression) {
    return patchDdl(this, (d) => {
      d.computed = expression;
    });
  }
  /** Mark the field `READONLY` — it cannot be changed after creation. */
  readonly() {
    return patchDdl(this, (d) => {
      d.readonly = true;
    });
  }
  /** Mark the field `FLEXIBLE`, allowing values outside the declared type. */
  flexible() {
    return patchDdl(this, (d) => {
      d.flexible = true;
    });
  }
  /**
   * Set the field's `PERMISSIONS`: a SurrealQL clause as a string, or a rule per
   * operation (`select`, `create` and `update`; a field has no `delete`). A rule
   * is `"full"`, `"none"`, SurrealQL, or a typed condition built with `where()`.
   *
   * An operation left out takes SurrealDB's default for a field, which is
   * `FULL`.
   *
   * @example
   * ```ts
   * t.string().permissions({
   *   select: where((row, { auth }) => row.owner.eq(auth.id)),
   *   update: "none",
   * });
   * ```
   */
  permissions(rules) {
    return patchDdl(this, (d) => {
      d.permissions = rules;
    });
  }
  /** Attach a `COMMENT` to the field. */
  comment(text) {
    return patchDdl(this, (d) => {
      d.comment = text;
    });
  }
  /** Declare the field a `REFERENCE`, optionally naming the referenced table. */
  references(table) {
    return patchDdl(this, (d) => {
      d.reference = { ...d.reference, table };
    });
  }
  /** Set what happens to this field when the record it references is deleted. */
  onDelete(action) {
    return patchDdl(this, (d) => {
      d.reference = { ...d.reference, onDelete: action };
    });
  }
  /**
   * Record previous names for this field so a rename is migrated as a rename —
   * the value is carried across — rather than as a drop and a create.
   */
  was(...names2) {
    return patchDdl(this, (d) => {
      d.previousNames = [...d.previousNames ?? [], ...names2];
    });
  }
};
function fieldDefault(value, always) {
  if (typeof value === "function") return void 0;
  if (value instanceof SurqlExpression) {
    return { value: value.sql, always, expression: true };
  }
  return { value, always };
}
function patchDdl(type, patch) {
  const next = Object.assign(
    Object.create(Object.getPrototypeOf(type)),
    type
  );
  const draft = { ...type.ddl };
  patch(draft);
  next.ddl = draft;
  return next;
}
var LiteralType = class extends AbstractType {
  constructor(_value) {
    super();
    this._value = _value;
  }
  name = "literal";
  get expected() {
    return `\`${this.value}\``;
  }
  get value() {
    return this._value;
  }
  validate(value) {
    return value === this.value;
  }
};
var StringType = class extends AbstractType {
  name = "string";
  expected = "string";
  validate(value) {
    return typeof value === "string";
  }
};
var NumberType = class extends AbstractType {
  name = "number";
  expected = "number";
  validate(value) {
    return typeof value === "number";
  }
};
var BigIntType = class extends AbstractType {
  name = "bigint";
  expected = "bigint";
  validate(value) {
    return typeof value === "bigint";
  }
  /**
   * Return `value` as a `bigint`. A safe integer the SDK decoded as a `number`
   * (a small value, such as a date near the epoch) is converted, so the result
   * always has the declared type.
   *
   * @throws {TypeParseError} If `value` is neither a `bigint` nor a safe integer.
   */
  parse(value) {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
      return BigInt(value);
    }
    return super.parse(value);
  }
};
var BoolType = class extends AbstractType {
  name = "bool";
  expected = "boolean";
  validate(value) {
    return typeof value === "boolean";
  }
};
var NullType = class extends AbstractType {
  name = "null";
  expected = "null";
  validate(value) {
    return value === null;
  }
};
var NoneType = class extends AbstractType {
  name = "none";
  expected = "undefined";
  validate(value) {
    return value === void 0;
  }
};
var NeverType = class extends AbstractType {
  name = "never";
  expected = "never";
  validate(_) {
    return arguments.length === 0;
  }
};
var DateType = class extends AbstractType {
  name = "date";
  expected = "Date";
  validate(value) {
    if (value instanceof Date) return true;
    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
      return true;
    }
    return false;
  }
  /**
   * Parse a value into a `Date`, converting SurrealDB `DateTime` objects.
   *
   * @throws {TypeParseError} If `value` is not a `Date` or `DateTime`.
   */
  parse(value) {
    if (value instanceof Date) return value;
    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    throw new TypeParseError(this.name, this.expected, value);
  }
};
var DurationType = class extends AbstractType {
  name = "duration";
  expected = "Duration";
  validate(value) {
    return value instanceof import_surrealdb.Duration;
  }
  /**
   * Return an existing SurrealDB `Duration` instance.
   *
   * @throws {TypeParseError} If `value` is not a `Duration`.
   */
  parse(value) {
    if (value instanceof import_surrealdb.Duration) return value;
    throw new TypeParseError(this.name, this.expected, value);
  }
};
var PointType = class extends AbstractType {
  name = "point";
  expected = "GeometryPoint";
  validate(value) {
    return value instanceof import_surrealdb.GeometryPoint;
  }
};
var UuidType = class extends AbstractType {
  name = "uuid";
  expected = "Uuid";
  validate(value) {
    return value instanceof import_surrealdb.Uuid;
  }
};
var OptionType = class extends AbstractType {
  constructor(_schema) {
    super();
    this._schema = _schema;
  }
  name = "option";
  get expected() {
    return `Option<${this.schema.expected}>`;
  }
  get schema() {
    return this._schema;
  }
  validate(value) {
    return value === void 0 || this.schema.validate(value);
  }
  /**
   * Parse `value` against the inner schema, returning `undefined` when the
   * value is absent. Delegates to the inner type so conversions (e.g. dates)
   * are applied.
   *
   * @throws {TypeParseError} If `value` is defined but fails the inner schema.
   */
  parse(value) {
    if (value === void 0) return void 0;
    return this.schema.parse(value);
  }
};
var RecordType = class extends AbstractType {
  constructor(_tb) {
    super();
    this._tb = _tb;
  }
  name = "record";
  get expected() {
    if (this._tb === void 0) return "RecordId";
    const tables2 = Array.isArray(this._tb) ? this._tb : [this._tb];
    return `RecordId<${tables2.join(" | ")}>`;
  }
  get tb() {
    return this._tb;
  }
  validate(value) {
    if (!(value instanceof import_surrealdb.RecordId)) return false;
    if (this._tb === void 0) return true;
    const table = String(value.table);
    return Array.isArray(this._tb) ? this._tb.some((t) => t === table) : this._tb === table;
  }
};
var GraphType = class extends AbstractType {
  constructor(_tb) {
    super();
    this._tb = _tb;
  }
  name = "graph";
  get expected() {
    return `array<record<${String(this._tb)}>>`;
  }
  get tb() {
    return this._tb;
  }
  validate(value) {
    if (!Array.isArray(value)) return false;
    if (this._tb === "*") return value.every((v) => v instanceof import_surrealdb.RecordId);
    return value.every(
      (v) => v instanceof import_surrealdb.RecordId && String(v.table) === this._tb
    );
  }
};
var ObjectType = class extends AbstractType {
  constructor(_schema) {
    super();
    this._schema = _schema;
  }
  name = "object";
  get expected() {
    let str = "{";
    for (const [key, val2] of Object.entries(this.schema)) {
      str += ` ${key}: ${val2.expected},`;
    }
    return `${str} }`;
  }
  get schema() {
    return this._schema;
  }
  validate(value) {
    if (typeof value !== "object" || value === null) return false;
    for (const key in this.schema) {
      if (!this.schema[key].validate(value[key]))
        return false;
    }
    return true;
  }
  /**
   * Validate every field of `value` against the object schema, returning a new
   * object whose schema fields hold the parsed (and possibly converted) values.
   *
   * @throws {TypeParseError} If `value` is not an object or a field fails validation.
   */
  parse(value) {
    if (typeof value !== "object" || value === null)
      throw new TypeParseError(this.name, this.expected, value);
    const source = value;
    const result = { ...source };
    for (const key in this.schema) {
      result[key] = this.schema[key].parse(source[key]);
    }
    return result;
  }
  get(prop) {
    if (prop in this.schema) {
      return [this.schema[prop], pathSegment(prop)];
    }
    return [new NoneType(), pathSegment(prop)];
  }
};
var ArrayType = class extends AbstractType {
  /**
   * @param _schema - The element type, or a tuple of types
   * @param _max - The most elements the array may hold, as SurrealDB's
   *   `array<T, max>`. SurrealQL takes a maximum only — a lower bound is a
   *   parse error — so a minimum has to be an `ASSERT`.
   */
  constructor(_schema, _max) {
    super();
    this._schema = _schema;
    this._max = _max;
  }
  name = "array";
  get expected() {
    let str = "[";
    if (Array.isArray(this.schema)) {
      for (const val2 of this.schema) {
        str += ` ${val2.expected},`;
      }
    } else {
      str += ` ${this.schema.expected},`;
    }
    return `${str} ]`;
  }
  get schema() {
    return this._schema;
  }
  /** The declared maximum length, if any. */
  get max() {
    return this._max;
  }
  /** Whether `length` is within the declared maximum, if there is one. */
  withinBound(length) {
    return this._max === void 0 || length <= this._max;
  }
  validate(value) {
    if (!Array.isArray(value)) return false;
    if (!this.withinBound(value.length)) return false;
    const schema = this.schema;
    if (Array.isArray(schema)) {
      return schema.length === value.length && schema.every((item, i) => item.validate(value[i]));
    }
    return value.every((item) => schema.validate(item));
  }
  /**
   * Validate every element of `value` against the array or tuple schema,
   * returning a new array of the parsed (and possibly converted) elements.
   *
   * @throws {TypeParseError} If `value` is not an array, has the wrong length
   *   (tuple), exceeds the declared maximum, or an element fails validation.
   */
  parse(value) {
    if (!Array.isArray(value))
      throw new TypeParseError(this.name, this.expected, value);
    if (!this.withinBound(value.length))
      throw new TypeParseError(this.name, this.expected, value);
    const schema = this.schema;
    if (Array.isArray(schema)) {
      if (schema.length !== value.length)
        throw new TypeParseError(this.name, this.expected, value);
      return schema.map((item, i) => item.parse(value[i]));
    }
    return value.map((item) => schema.parse(item));
  }
  get(prop) {
    const i = Number.parseInt(prop, 10);
    if (Array.isArray(this.schema)) {
      if (i in this.schema) {
        return [
          this.schema[i],
          `[${JSON.stringify(i)}]`
        ];
      }
    } else {
      return [
        new UnionType([this.schema, new NoneType()]),
        `[${JSON.stringify(i)}]`
      ];
    }
    return [new NoneType(), `[${JSON.stringify(i)}]`];
  }
};
var UnionType = class extends AbstractType {
  constructor(_schema) {
    super();
    this._schema = _schema;
  }
  name = "union";
  get expected() {
    return this.schema.map((val2) => val2.expected);
  }
  get schema() {
    return this._schema;
  }
  validate(value) {
    for (const schema of this.schema) {
      if (schema.validate(value)) return true;
    }
    return false;
  }
  /**
   * Parse `value` against the first matching member, delegating so that member
   * conversions (e.g. dates) are applied.
   *
   * @throws {TypeParseError} If `value` matches none of the members.
   */
  parse(value) {
    for (const schema of this.schema) {
      if (schema.validate(value)) return schema.parse(value);
    }
    throw new TypeParseError(this.name, this.expected, value);
  }
};
var IntType = class extends NumberType {
  validate(value) {
    return typeof value === "number" && Number.isInteger(value);
  }
};
var FloatType = class extends NumberType {
};
var DecimalType = class extends AbstractType {
  // Keep the number function family; see the note above.
  name = "number";
  expected = "Decimal | number";
  validate(value) {
    return value instanceof import_surrealdb.Decimal || typeof value === "number";
  }
};
var BytesType = class extends AbstractType {
  name = "bytes";
  expected = "Uint8Array";
  validate(value) {
    return value instanceof Uint8Array;
  }
  /** Returns a `Uint8Array` over the bytes, without copying an `ArrayBuffer`. */
  parse(value) {
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    return super.parse(value);
  }
};
var GeometryType = class extends AbstractType {
  constructor(_kind) {
    super();
    this._kind = _kind;
  }
  name = "geometry";
  get expected() {
    return this._kind ? `Geometry<${this._kind}>` : "Geometry";
  }
  get kind() {
    return this._kind;
  }
  validate(value) {
    return value instanceof import_surrealdb.Geometry;
  }
};
var RangeType = class extends AbstractType {
  name = "range";
  expected = "Range";
  validate(value) {
    return value instanceof import_surrealdb.Range;
  }
};
var AnyType = class extends AbstractType {
  name = "any";
  expected = "any";
  validate(_value) {
    return true;
  }
};
var SetType = class extends AbstractType {
  /**
   * @param _schema - The element type
   * @param _max - The most members the set may hold, as `set<T, max>`
   */
  constructor(_schema, _max) {
    super();
    this._schema = _schema;
    this._max = _max;
  }
  name = "set";
  get expected() {
    return `Set<${this._schema.expected}>`;
  }
  get schema() {
    return this._schema;
  }
  /** The declared maximum size, if any. */
  get max() {
    return this._max;
  }
  validate(value) {
    if (!(value instanceof Set)) return false;
    if (this._max !== void 0 && value.size > this._max) return false;
    for (const member of value)
      if (!this._schema.validate(member)) return false;
    return true;
  }
  /**
   * Parse every member of `value` against the element type, returning a new
   * `Set` of the parsed members.
   *
   * @throws {TypeParseError} If `value` is not a `Set`, exceeds the declared
   *   maximum, or a member fails validation.
   */
  parse(value) {
    if (!(value instanceof Set))
      throw new TypeParseError(this.name, this.expected, value);
    if (this._max !== void 0 && value.size > this._max)
      throw new TypeParseError(this.name, this.expected, value);
    const parsed = /* @__PURE__ */ new Set();
    for (const member of value) parsed.add(this._schema.parse(member));
    return parsed;
  }
};

// src/types/t.ts
var t_exports = {};
__export(t_exports, {
  _null: () => _null,
  any: () => any,
  array: () => array,
  bigint: () => bigint,
  bool: () => bool,
  bytes: () => bytes,
  date: () => date,
  decimal: () => decimal,
  duration: () => duration,
  float: () => float,
  geometry: () => geometry,
  int: () => int,
  literal: () => literal,
  never: () => never,
  none: () => none,
  null: () => _null,
  number: () => number,
  object: () => object,
  option: () => option,
  point: () => point,
  range: () => range,
  record: () => record,
  set: () => set,
  string: () => string,
  union: () => union,
  uuid: () => uuid
});

// src/utils/workable.ts
var import_surrealdb2 = require("surrealdb");

// src/query/subject.ts
function mergeSchemas(members) {
  const occurrences = /* @__PURE__ */ new Map();
  for (const member of members) {
    for (const [key, type] of Object.entries(member.schema)) {
      const list = occurrences.get(key);
      if (list) list.push(type);
      else occurrences.set(key, [type]);
    }
  }
  const fields = {};
  for (const [key, types] of occurrences) {
    const distinct = dedupeByExpected(types);
    let type = distinct.length === 1 ? distinct[0] : new UnionType(distinct);
    if (types.length < members.length) type = new OptionType(type);
    fields[key] = type;
  }
  return new ObjectType(fields);
}
function dedupeByExpected(types) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const type of types) {
    const key = JSON.stringify(type.expected);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(type);
  }
  return result;
}

// src/utils/workable.ts
var __display = /* @__PURE__ */ Symbol("display");
var __type = /* @__PURE__ */ Symbol("type");
var __ctx = /* @__PURE__ */ Symbol("ctx");
var __fields = /* @__PURE__ */ Symbol("fields");
var __path = /* @__PURE__ */ Symbol("path");
function intoWorkable(ctx, type, value) {
  if (isWorkable(value)) {
    return value;
  }
  return {
    [__ctx]: ctx,
    [__display](ctx2) {
      return ctx2.var(value);
    },
    [__type]: type
  };
}
function optional(type) {
  return type instanceof OptionType ? type : new OptionType(type);
}
function linkedSchema(orm, tb) {
  const names2 = typeof tb === "string" ? [tb] : Array.isArray(tb) ? tb : [];
  const schemas = [];
  for (const name of names2) {
    const schema = orm.tables[name]?.schema;
    if (schema) schemas.push(schema);
  }
  if (schemas.length === 0) return void 0;
  return schemas.length === 1 ? schemas[0] : mergeSchemas(schemas);
}
function resolveAccessType(orm, type) {
  if (type instanceof OptionType) {
    const inner = resolveAccessType(orm, type.schema);
    return { target: inner.target, rewrap: (f) => optional(inner.rewrap(f)) };
  }
  if (type instanceof GraphType && type.tb !== "*") {
    const schema = orm.tables[type.tb]?.schema;
    if (schema) return { target: schema, rewrap: (f) => new ArrayType(f) };
  }
  if (type instanceof RecordType) {
    const schema = linkedSchema(orm, type.tb);
    if (schema) return { target: schema, rewrap: (f) => f };
  }
  if (type instanceof UnionType) {
    const schemas = type.schema.filter(
      (member) => member instanceof ObjectType
    );
    if (schemas.length === type.schema.length && schemas.length > 0) {
      return { target: mergeSchemas(schemas), rewrap: (f) => f };
    }
  }
  return { target: type, rewrap: (f) => f };
}
function workableGet(workable, key) {
  const { target, rewrap } = resolveAccessType(
    workable[__ctx].orm,
    workable[__type]
  );
  const [fieldType, path] = target.get(key);
  const type = rewrap(fieldType);
  return {
    [__ctx]: workable[__ctx],
    [__display](ctx) {
      const parent = workable[__display](ctx);
      if (parent === "" && typeof key === "string") {
        return (0, import_surrealdb2.escapeIdent)(key);
      }
      return `${parent}${path}`;
    },
    [__type]: type,
    [__path]: true
  };
}
function isWorkable(value) {
  return (typeof value === "object" || typeof value === "function") && value !== null && value[__ctx] !== void 0;
}

// src/validation.ts
var IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
function join(path, key) {
  if (typeof key === "number") return `${path}[${key}]`;
  if (!IDENT.test(key)) return `${path}[${JSON.stringify(key)}]`;
  return path === "" ? key : `${path}.${key}`;
}
function describe(value) {
  if (value === void 0) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string")
    return JSON.stringify(value.length > 40 ? `${value.slice(0, 40)}\u2026` : value);
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `array of ${value.length}`;
  if (value instanceof Set) return `set of ${value.size}`;
  const name = value.constructor?.name;
  return name && name !== "Object" ? name : "object";
}
function expectedOf(type) {
  if (type instanceof ObjectType) return "object";
  if (type instanceof ArrayType) {
    const schema = type.schema;
    return Array.isArray(schema) ? `tuple of ${schema.length}` : `array of ${expectedOf(schema)}`;
  }
  if (type instanceof SetType)
    return `set of ${expectedOf(type.schema)}`;
  if (type instanceof OptionType)
    return `${expectedOf(type.schema)} or undefined`;
  if (type instanceof UnionType)
    return type.schema.map(expectedOf).join(" or ");
  const { expected } = type;
  return Array.isArray(expected) ? expected.join(" or ") : expected;
}
function report(issues, path, expected, received) {
  const where = path === "" ? "(root)" : path;
  issues.push({
    path: where,
    expected,
    received,
    message: `${where}: expected ${expected}, received ${describe(received)}`
  });
}
var READ_ONLY = "undefined (computed fields are read-only)";
var isDeferred = (value) => value instanceof SurqlExpression || isWorkable(value);
var hasDefault = (type) => type._default !== void 0;
function mayBeMissing(field, key, options) {
  if (options?.mode === "update") return true;
  if (options?.mode === "create" && options.implicit?.includes(key))
    return true;
  return hasDefault(field) && (options?.fills ?? true);
}
function collectObject(type, value, path, issues, options) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    report(issues, path, "object", value);
    return;
  }
  const record3 = value;
  const schema = type.schema;
  for (const key in schema) {
    const field = schema[key];
    const given = record3[key];
    if (options?.computed?.includes(key)) {
      if (given !== void 0)
        report(issues, join(path, key), READ_ONLY, given);
    } else if (given !== void 0 || !mayBeMissing(field, key, options)) {
      collect(field, given, join(path, key), issues);
    }
  }
}
function collectArray(type, value, path, issues) {
  const schema = type.schema;
  if (!Array.isArray(value)) {
    report(issues, path, expectedOf(type), value);
  } else if (!Array.isArray(schema)) {
    value.forEach((item, i) => {
      collect(schema, item, join(path, i), issues);
    });
  } else if (schema.length !== value.length) {
    report(issues, path, expectedOf(type), value);
  } else {
    schema.forEach((member, i) => {
      collect(member, value[i], join(path, i), issues);
    });
  }
}
function collectSet(type, value, path, issues) {
  if (!(value instanceof Set)) {
    report(issues, path, expectedOf(type), value);
    return;
  }
  let i = 0;
  for (const member of value) {
    collect(type.schema, member, join(path, i++), issues);
  }
  if (type.max !== void 0 && value.size > type.max) {
    report(issues, path, `at most ${type.max} members`, value);
  }
}
function collect(type, value, path, issues, options) {
  if (isDeferred(value)) return;
  if (type instanceof OptionType) {
    if (value !== void 0) collect(type.schema, value, path, issues);
  } else if (type instanceof ObjectType) {
    collectObject(type, value, path, issues, options);
  } else if (type instanceof ArrayType) {
    collectArray(type, value, path, issues);
  } else if (type instanceof SetType) {
    collectSet(type, value, path, issues);
  } else if (!type.validate(value)) {
    report(issues, path, expectedOf(type), value);
  }
}
function checkRecord(schema, data, options, prefix = "") {
  const issues = [];
  collect(schema, data, prefix, issues, options);
  return issues;
}
function checkValue(type, value) {
  const issues = [];
  collect(type, value, "", issues);
  return issues;
}
function throwIfInvalid(issues, table, subject) {
  if (issues.length > 0) throw new ValidationError(issues, table, subject);
}
function safeParseWith(schema, data, mode, table, implicit, computed) {
  const issues = checkRecord(schema, data, {
    mode,
    implicit,
    computed: mode === "row" ? [] : computed
  });
  return issues.length === 0 ? { success: true, data } : { success: false, error: new ValidationError(issues, table) };
}

// src/standard-schema.ts
var SEGMENT = /([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/g;
function pathOf(path) {
  if (path === "(root)" || path === "") return [];
  const segments = [];
  for (const [, key, index, quoted] of path.matchAll(SEGMENT)) {
    if (key !== void 0) segments.push(key);
    else if (index !== void 0) segments.push(Number(index));
    else if (quoted !== void 0) segments.push(JSON.parse(quoted));
  }
  return segments;
}
var toStandard = (issue) => ({
  // The message of an issue starts with its path, which a Standard Schema
  // issue carries separately.
  message: issue.message.slice(issue.path.length + 2),
  path: pathOf(issue.path)
});
function installStandardSchema() {
  if (Object.hasOwn(AbstractType.prototype, "~standard")) return;
  Object.defineProperty(AbstractType.prototype, "~standard", {
    configurable: true,
    get() {
      return {
        version: 1,
        vendor: "surqlize",
        validate: (value) => {
          const issues = checkValue(this, value);
          return issues.length === 0 ? { value } : { issues: issues.map(toStandard) };
        }
      };
    }
  });
}

// src/types/t.ts
installStandardSchema();
function string() {
  return new StringType();
}
function number() {
  return new NumberType();
}
function int() {
  return new IntType();
}
function float() {
  return new FloatType();
}
function decimal() {
  return new DecimalType();
}
function duration() {
  return new DurationType();
}
function bytes() {
  return new BytesType();
}
function any() {
  return new AnyType();
}
function geometry(kind) {
  return new GeometryType(kind);
}
function range() {
  return new RangeType();
}
function set(schema, max) {
  return new SetType(schema, max);
}
function bool() {
  return new BoolType();
}
function _null() {
  return new NullType();
}
function none() {
  return new NoneType();
}
function never() {
  return new NeverType();
}
function date() {
  return new DateType();
}
function bigint() {
  return new BigIntType();
}
function point() {
  return new PointType();
}
function uuid() {
  return new UuidType();
}
function option(schema) {
  return new OptionType(schema);
}
function object(schema) {
  return new ObjectType(schema);
}
function array(schema, max) {
  return new ArrayType(schema, max);
}
function union(schema) {
  return new UnionType(schema);
}
function literal(value) {
  return new LiteralType(value);
}
function record(table) {
  return new RecordType(table);
}

// src/schema/ddl/table-ddl.ts
function patchTableDdl(schema, patch) {
  const next = Object.assign(
    Object.create(Object.getPrototypeOf(schema)),
    schema
  );
  const draft = { ...schema.ddl };
  patch(draft);
  next.ddl = draft;
  return next;
}

// src/schema/edge.ts
var EdgeSchema = class {
  constructor(from, tb, to, _fields) {
    this.from = from;
    this.tb = tb;
    this.to = to;
    this._fields = _fields;
  }
  /** Schema metadata used to generate `DEFINE TABLE … TYPE RELATION`. */
  ddl = {};
  // An edge is immutable, so what it derives from its fields is built once.
  _fieldsCache;
  _schemaCache;
  get fields() {
    if (!this._fieldsCache) {
      this._fieldsCache = {
        ...this._fields,
        // A schema that declares its own `id` keeps it. `in` and `out` define
        // the edge, so they follow the declared fields and cannot be changed.
        ..."id" in this._fields ? {} : { id: t_exports.record(this.tb) },
        in: t_exports.record(this.from),
        out: t_exports.record(this.to)
      };
    }
    return this._fieldsCache;
  }
  type = void 0;
  get schema() {
    if (!this._schemaCache) this._schemaCache = t_exports.object(this.fields);
    return this._schemaCache;
  }
  /** Type-guard that checks whether a value matches this edge's schema. */
  validate(value) {
    return this.schema.validate(value);
  }
  // -------------------------------------------------------------------------
  // Schema modifiers — see the note on TableSchema; each returns a clone.
  // -------------------------------------------------------------------------
  /** Enforce the declared fields, rejecting anything else. This is the default. */
  schemafull() {
    return patchTableDdl(this, (d) => {
      d.schemafull = true;
    });
  }
  /** Allow fields beyond those declared. */
  schemaless() {
    return patchTableDdl(this, (d) => {
      d.schemafull = false;
    });
  }
  /**
   * Reject edges whose `in` or `out` record does not exist (`ENFORCED`).
   *
   * Without this SurrealDB will happily create an edge pointing at nothing.
   */
  enforced() {
    return patchTableDdl(this, (d) => {
      d.enforced = true;
    });
  }
  /**
   * Set the edge table's `PERMISSIONS`: a SurrealQL clause as a string, or a
   * rule per operation, each `"full"`, `"none"`, SurrealQL, or a typed
   * condition built with `where()` over the edge's fields (`in` and `out`
   * included).
   */
  permissions(rules) {
    return patchTableDdl(this, (d) => {
      d.permissions = rules;
    });
  }
  /** Retain a change feed for `duration` (e.g. `"3d"`). */
  changefeed(duration2, includeOriginal = false) {
    return patchTableDdl(this, (d) => {
      d.changefeed = { duration: duration2, includeOriginal };
    });
  }
  /** Attach a `COMMENT` to the edge table. */
  comment(text) {
    return patchTableDdl(this, (d) => {
      d.comment = text;
    });
  }
  /**
   * Add an index.
   *
   * @param name - The index name
   * @param options - What to index and how
   */
  index(name, options) {
    return patchTableDdl(this, (d) => {
      d.indexes = { ...d.indexes, [name]: options };
    });
  }
  /**
   * Add an event.
   *
   * @param name - The event name
   * @param options - What fires it and what it does
   */
  event(name, options) {
    return patchTableDdl(this, (d) => {
      d.events = { ...d.events, [name]: options };
    });
  }
  safeParse(data, options = {}) {
    return safeParseWith(
      this.schema,
      data,
      options.mode ?? "create",
      this.tb,
      ["id", "in", "out"],
      []
    );
  }
  parse(data, options = {}) {
    const result = this.safeParse(data, options);
    if (!result.success) throwIfInvalid(result.error.issues, this.tb);
    return data;
  }
};

// src/schema/ddl/syntax.ts
var import_surrealdb3 = require("surrealdb");
var PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function ident(name) {
  return PLAIN.test(name) ? name : (0, import_surrealdb3.escapeIdent)(name);
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
    collect2(name, type, flat);
  }
  return flat;
}
function collect2(path, type, into) {
  into.push({ name: path, type, ddl: type.ddl });
  const nested = nestedObject(type);
  if (!nested) return;
  const prefix = path + "[*]".repeat(collectionDepth(type));
  for (const [key, child] of Object.entries(
    nested.schema
  )) {
    collect2(`${prefix}.${key}`, child, into);
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
var import_surrealdb6 = require("surrealdb");

// src/utils/display.ts
var import_surrealdb4 = require("surrealdb");

// src/utils/model.ts
var modelClasses = /* @__PURE__ */ new WeakSet();
function toPlainModel(value) {
  if (Array.isArray(value)) return value.map(toPlainModel);
  if (typeof value === "object" && value !== null && modelClasses.has(value.constructor)) {
    return { ...value };
  }
  return value;
}

// src/utils/display.ts
function createVariableStore() {
  const variables = {};
  let count = 0;
  const v = (value) => {
    let name = `_v${count++}`;
    while (name in variables) name = `_v${count++}`;
    variables[name] = toPlainModel(value);
    return `$${name}`;
  };
  return [variables, v];
}
function displayContext(upstream) {
  const [variables, v] = upstream?.var && upstream.variables ? [upstream.variables, upstream.var] : createVariableStore();
  return {
    var: v,
    variables,
    contextId: upstream?.contextId ?? /* @__PURE__ */ Symbol(),
    bareRowsOf: upstream?.bareRowsOf
  };
}
var inlineValue = (value) => typeof value === "string" ? JSON.stringify(value) : (0, import_surrealdb4.toSurqlString)(value);

// src/utils/inheritable.ts
function inheritableIntoWorkable(value) {
  if (isWorkable(value)) {
    return value;
  }
  if (typeof value !== "object" || value === null) {
    throw new TypeParseError("inheritable", "object", value);
  }
  if (Array.isArray(value)) {
    const converted2 = value.map(
      (item) => inheritableIntoWorkable(item)
    );
    const first = converted2[0];
    if (!first) throw new OrmError("Cannot convert empty array to workable");
    return {
      [__ctx]: first[__ctx],
      [__type]: new ArrayType(converted2.map((v) => v[__type])),
      [__display]: (ctx) => {
        return `[${converted2.map((v) => v[__display](ctx)).join(", ")}]`;
      }
    };
  }
  const converted = Object.fromEntries(
    Object.entries(value).map(([key, val2]) => [
      key,
      inheritableIntoWorkable(val2)
    ])
  );
  const fieldTypes = Object.fromEntries(
    Object.entries(converted).map(([key, val2]) => [key, val2[__type]])
  );
  const firstKey = Object.keys(converted)[0];
  if (!firstKey) throw new OrmError("Cannot convert empty object to workable");
  return {
    [__ctx]: converted[firstKey][__ctx],
    [__type]: new ObjectType(fieldTypes),
    [__fields]: converted,
    [__display]: (ctx) => {
      const innerDisplays = Object.entries(converted).map(
        ([key, val2]) => `${key}: ${val2[__display](ctx)}`
      );
      return `{ ${innerDisplays.join(", ")} }`;
    }
  };
}

// src/functions/types/any.ts
var any_exports = {};
__export(any_exports, {
  functions: () => functions
});

// src/functions/filters.ts
var JoiningKind = t_exports.union([t_exports.literal("OR"), t_exports.literal("AND")]);
var PrefixKind = t_exports.union([t_exports.literal("!"), t_exports.literal("!!")]);
var ComparisonKind = t_exports.union([
  t_exports.literal("??"),
  t_exports.literal("?:"),
  t_exports.literal("="),
  t_exports.literal("!="),
  t_exports.literal("=="),
  t_exports.literal("?="),
  t_exports.literal("*="),
  t_exports.literal("?~"),
  t_exports.literal("*~"),
  t_exports.literal("@@"),
  t_exports.literal("<"),
  t_exports.literal("<="),
  t_exports.literal(">"),
  t_exports.literal(">="),
  t_exports.literal("IN"),
  t_exports.literal("NOT IN"),
  t_exports.literal("CONTAINS"),
  t_exports.literal("CONTAINSNOT"),
  t_exports.literal("CONTAINSALL"),
  t_exports.literal("CONTAINSANY"),
  t_exports.literal("CONTAINSNONE"),
  t_exports.literal("INSIDE"),
  t_exports.literal("NOTINSIDE"),
  t_exports.literal("ALLINSIDE"),
  t_exports.literal("ANYINSIDE"),
  t_exports.literal("NONEINSIDE"),
  t_exports.literal("OUTSIDE"),
  t_exports.literal("INTERSECTS")
]);
function joiningFilter(ctx, kind, ...params) {
  return actionable({
    [__ctx]: ctx,
    [__type]: t_exports.bool(),
    [__display](ctx2) {
      return `(${params.map((p) => p[__display](ctx2)).join(` ${kind} `)})`;
    }
  });
}
function prefixedFilter(ctx, kind, workable) {
  return actionable({
    [__ctx]: ctx,
    [__type]: t_exports.bool(),
    [__display](ctx2) {
      return `${kind}${workable[__display](ctx2)}`;
    }
  });
}
function comparingFilter(ctx, kind, l, _r) {
  const r = intoWorkable(ctx, l[__type], _r);
  return actionable({
    [__ctx]: ctx,
    [__type]: t_exports.bool(),
    [__display](ctx2) {
      const left = l[__display](ctx2);
      const field = kind === "@@" ? left.replace(/^\$this\./, "") : left;
      return `${field} ${kind} ${r[__display](ctx2)}`;
    }
  });
}

// src/functions/types/any.ts
var functions = {
  // Basic Comparison
  eq(v) {
    return comparingFilter(this[__ctx], "=", this, v);
  },
  ne(v) {
    return comparingFilter(this[__ctx], "!=", this, v);
  },
  ex(v) {
    return comparingFilter(this[__ctx], "==", this, v);
  },
  // Greater/Less
  gt(v) {
    return comparingFilter(this[__ctx], ">", this, v);
  },
  gte(v) {
    return comparingFilter(this[__ctx], ">=", this, v);
  },
  lt(v) {
    return comparingFilter(this[__ctx], "<", this, v);
  },
  lte(v) {
    return comparingFilter(this[__ctx], "<=", this, v);
  },
  // Inside
  inside(v) {
    return comparingFilter(this[__ctx], "IN", this, v);
  },
  notInside(v) {
    return comparingFilter(this[__ctx], "NOT IN", this, v);
  },
  // Joining
  or(...params) {
    return joiningFilter(this[__ctx], "OR", this, ...params);
  },
  and(...params) {
    return joiningFilter(this[__ctx], "AND", this, ...params);
  },
  // Prefix
  not() {
    return prefixedFilter(this[__ctx], "!", this);
  },
  falseish() {
    return prefixedFilter(this[__ctx], "!", this);
  },
  trueish() {
    return prefixedFilter(this[__ctx], "!!", this);
  }
};

// src/functions/types/array.ts
var array_exports = {};
__export(array_exports, {
  KNN_METRICS: () => KNN_METRICS,
  functions: () => functions2,
  vectorFunctions: () => vectorFunctions
});

// src/query/utils.ts
var import_surrealdb5 = require("surrealdb");
function andWhere(filter, condition) {
  return filter ? joiningFilter(condition[__ctx], "AND", filter, condition) : condition;
}

// src/schema/traversal.ts
var ANY = /* @__PURE__ */ Symbol("surqlize.graph.ANY");
var GRAPH_SEGMENT = /* @__PURE__ */ Symbol("surqlize.graph.segment");
function createGraphSegment(target, filter) {
  return {
    [GRAPH_SEGMENT]: true,
    target,
    filter,
    where(cb) {
      if (!filter) return createGraphSegment(target, cb);
      const previous = filter;
      return createGraphSegment(
        target,
        (row) => andWhere(previous(row), cb(row))
      );
    },
    clearWhere() {
      return createGraphSegment(target);
    }
  };
}
function isGraphSegmentSpec(value) {
  return typeof value === "object" && value !== null && value[GRAPH_SEGMENT] === true;
}

// src/functions/utils.ts
function databaseFunction(ctx, type, fn, ...params) {
  return actionable({
    [__ctx]: ctx,
    [__type]: type,
    [__display](ctx2) {
      const vars = params.map((p) => p[__display](ctx2)).join(", ");
      return `${fn}(${vars})`;
    }
  });
}
function matchRef(ref) {
  if (!Number.isInteger(ref) || ref < 0 || ref > 255) {
    throw new RangeError(
      `full-text match reference must be an integer from 0 to 255, got ${ref}`
    );
  }
  return ref;
}
function resolveSegmentArgs(args) {
  if (args.length === 0) return [ANY];
  return args.map(
    (arg) => typeof arg === "function" ? arg(
      createGraphSegment
    ) : arg
  );
}
function graphAlternatives(args) {
  return resolveSegmentArgs(args).map((arg) => {
    if (arg === ANY) return { target: ANY };
    if (isGraphSegmentSpec(arg)) {
      return { target: arg.target, filter: arg.filter };
    }
    return { target: arg };
  });
}
function graphResultTarget(alternatives) {
  if (alternatives.length === 1 && typeof alternatives[0]?.target === "string") {
    return alternatives[0].target;
  }
  return "*";
}
function renderGraphTarget(target) {
  return target === ANY ? "?" : target;
}
function renderGraphAlternative(alternative, ctx) {
  const target = renderGraphTarget(alternative.target);
  if (!alternative.where) return target;
  return `${target} WHERE ${alternative.where(ctx)}`;
}
function traverse(parent, kind, alternatives, target) {
  const arrow = kind === "out" ? "->" : kind === "in" ? "<-" : "<->";
  return actionable({
    [__ctx]: parent[__ctx],
    [__type]: new GraphType(target),
    [__display](ctx) {
      const head = parent[__display](ctx);
      const hasFilter = alternatives.some((alternative) => alternative.where);
      const body = alternatives.map((alternative) => renderGraphAlternative(alternative, ctx)).join(", ");
      const segment = alternatives.length > 1 || hasFilter ? `(${body})` : body;
      return `${head}${arrow}${segment}`;
    }
  });
}
function edgeFieldProxy(ctx, schema) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const [type] = schema.get(prop);
        return actionable({
          [__ctx]: ctx,
          [__type]: type,
          [__display]: () => prop
        });
      }
    }
  );
}
function edgeFilter(ctx, schema, cb) {
  if (!cb) return void 0;
  const predicate = cb(edgeFieldProxy(ctx, schema));
  return (dctx) => predicate[__display](dctx);
}
var MAX_RECURSION_DEPTH = 256;
function checkBound(bound2, label) {
  if (!Number.isInteger(bound2) || bound2 < 1 || bound2 > MAX_RECURSION_DEPTH) {
    throw new OrmError(
      `Recursion ${label} must be an integer between 1 and ${MAX_RECURSION_DEPTH}, received ${bound2}`
    );
  }
  return bound2;
}
function renderRecursionDepth(depth) {
  if (typeof depth === "number") return String(checkBound(depth, "depth"));
  const min = depth.min === void 0 ? void 0 : checkBound(depth.min, "min");
  const max = depth.max === void 0 ? void 0 : checkBound(depth.max, "max");
  if (min !== void 0 && max !== void 0 && min > max) {
    throw new OrmError(
      `Recursion min (${min}) must not be greater than max (${max})`
    );
  }
  return `${min ?? ""}..${max ?? ""}`;
}
function recursion(parent, tb, spec, body) {
  const node = actionable({
    [__ctx]: parent[__ctx],
    [__type]: new RecordType(tb),
    [__display]: () => ""
  });
  const step = body(node);
  const graph3 = new GraphType(tb);
  return actionable({
    [__ctx]: parent[__ctx],
    [__type]: spec.optional ? new OptionType(graph3) : graph3,
    [__display](ctx) {
      const modifiers = spec.modifiers?.(ctx) ?? "";
      return `${parent[__display](ctx)}.{${spec.depth}${modifiers}}(${step[__display](ctx)})`;
    }
  });
}

// src/functions/types/array.ts
function elementType(arr) {
  const schema = arr.schema;
  return Array.isArray(schema) ? new UnionType(schema) : schema;
}
var KNN_METRICS = [
  "EUCLIDEAN",
  "COSINE",
  "MANHATTAN",
  "CHEBYSHEV"
];
function positiveInteger(name, value) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new OrmError(
      `knn() ${name} must be a positive integer, got ${String(value)}`
    );
  }
  return value;
}
var ROW_PREFIX = "$this.";
function knnFilter(field, query, operator) {
  return actionable({
    [__ctx]: field[__ctx],
    [__type]: t_exports.bool(),
    [__display](ctx) {
      const column = field[__display](ctx);
      if (!column.startsWith(ROW_PREFIX)) {
        throw new OrmError(
          "knn() must be called on a field of the queried row"
        );
      }
      const idiom = column.slice(ROW_PREFIX.length);
      return `(${idiom} ${operator} ${query[__display](ctx)})`;
    }
  });
}
var vectorFunctions = {
  knn(query, k, options) {
    if (!(this[__type].schema instanceof NumberType)) {
      throw new OrmError(
        "knn() can only be called on an array<number> field (a vector)"
      );
    }
    const limit = positiveInteger("k", k);
    let operator;
    if (options.metric !== void 0) {
      if (!KNN_METRICS.includes(options.metric)) {
        throw new OrmError(
          `knn() metric must be one of ${KNN_METRICS.join(", ")}, got ${String(options.metric)}`
        );
      }
      operator = `<|${limit},${options.metric}|>`;
    } else if (options.ef !== void 0) {
      operator = `<|${limit},${positiveInteger("ef", options.ef)}|>`;
    } else {
      throw new OrmError("knn() needs a metric or an ef");
    }
    const vector = intoWorkable(this[__ctx], t_exports.array(t_exports.number()), query);
    return knnFilter(this, vector, operator);
  }
};
var functions2 = {
  // Contains
  contains(v) {
    return comparingFilter(this[__ctx], "CONTAINS", this, v);
  },
  containsNot(v) {
    return comparingFilter(this[__ctx], "CONTAINSNOT", this, v);
  },
  containsAll(v) {
    return comparingFilter(this[__ctx], "CONTAINSALL", this, v);
  },
  containsAny(v) {
    return comparingFilter(this[__ctx], "CONTAINSANY", this, v);
  },
  containsNone(v) {
    return comparingFilter(this[__ctx], "CONTAINSNONE", this, v);
  },
  // Inside
  allInside(v) {
    return comparingFilter(this[__ctx], "ALLINSIDE", this, v);
  },
  anyInside(v) {
    return comparingFilter(this[__ctx], "ANYINSIDE", this, v);
  },
  noneInside(v) {
    return comparingFilter(this[__ctx], "NONEINSIDE", this, v);
  },
  // Core mutation functions
  add(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::add",
      this,
      element
    );
  },
  append(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::append",
      this,
      element
    );
  },
  prepend(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::prepend",
      this,
      element
    );
  },
  push(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::push",
      this,
      element
    );
  },
  insert(v, pos) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    const p = intoWorkable(this[__ctx], t_exports.number(), pos);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::insert",
      this,
      element,
      p
    );
  },
  remove(pos) {
    const p = intoWorkable(this[__ctx], t_exports.number(), pos);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::remove",
      this,
      p
    );
  },
  pop() {
    return databaseFunction(
      this[__ctx],
      t_exports.option(this[__type].schema),
      "array::pop",
      this
    );
  },
  reverse() {
    return databaseFunction(this[__ctx], this[__type], "array::reverse", this);
  },
  shuffle() {
    return databaseFunction(this[__ctx], this[__type], "array::shuffle", this);
  },
  sort() {
    return databaseFunction(this[__ctx], this[__type], "array::sort", this);
  },
  sortAsc() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::sort::asc",
      this
    );
  },
  sortDesc() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::sort::desc",
      this
    );
  },
  sortLexical() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::sort_lexical",
      this
    );
  },
  sortNatural() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::sort_natural",
      this
    );
  },
  sortNaturalLexical() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::sort_natural_lexical",
      this
    );
  },
  distinct() {
    return databaseFunction(this[__ctx], this[__type], "array::distinct", this);
  },
  flatten() {
    return databaseFunction(this[__ctx], this[__type], "array::flatten", this);
  },
  group() {
    return databaseFunction(this[__ctx], this[__type], "array::group", this);
  },
  fill(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::fill",
      this,
      element
    );
  },
  swap(a, b) {
    const va = intoWorkable(this[__ctx], t_exports.number(), a);
    const vb = intoWorkable(this[__ctx], t_exports.number(), b);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::swap",
      this,
      va,
      vb
    );
  },
  // Set operation functions
  combine(other) {
    const pair = t_exports.array([this[__type].schema, other[__type].schema]);
    return databaseFunction(
      this[__ctx],
      t_exports.array(pair),
      "array::combine",
      this,
      other
    );
  },
  complement(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::complement",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  concat(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::concat",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  difference(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::difference",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  intersect(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::intersect",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  union(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::union",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  transpose() {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::transpose",
      this
    );
  },
  // Boolean array functions. SurrealDB coerces each element to a bool, so the
  // result is always an array of booleans whatever the input's element type.
  booleanAnd(other) {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.bool()),
      "array::boolean_and",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  booleanOr(other) {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.bool()),
      "array::boolean_or",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  booleanXor(other) {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.bool()),
      "array::boolean_xor",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  booleanNot() {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.bool()),
      "array::boolean_not",
      this
    );
  },
  logicalAnd(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::logical_and",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  logicalOr(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::logical_or",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  logicalXor(other) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::logical_xor",
      this,
      intoWorkable(this[__ctx], this[__type], other)
    );
  },
  // Search/query functions
  first() {
    return databaseFunction(
      this[__ctx],
      this[__type].schema,
      "array::first",
      this
    );
  },
  last() {
    return databaseFunction(
      this[__ctx],
      this[__type].schema,
      "array::last",
      this
    );
  },
  max() {
    return databaseFunction(
      this[__ctx],
      this[__type].schema,
      "array::max",
      this
    );
  },
  min() {
    return databaseFunction(
      this[__ctx],
      this[__type].schema,
      "array::min",
      this
    );
  },
  findIndex(v) {
    const element = intoWorkable(this[__ctx], elementType(this[__type]), v);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "array::find_index",
      this,
      element
    );
  },
  filterIndex(v) {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.number()),
      "array::filter_index",
      this,
      intoWorkable(this[__ctx], this[__type].schema, v)
    );
  },
  // Other functions
  clump(size) {
    const s = intoWorkable(this[__ctx], t_exports.number(), size);
    return databaseFunction(this[__ctx], this[__type], "array::clump", this, s);
  },
  arrayJoin(delimiter) {
    const d = intoWorkable(this[__ctx], t_exports.string(), delimiter);
    return databaseFunction(this[__ctx], t_exports.string(), "array::join", this, d);
  },
  slice(start, end) {
    const s = intoWorkable(this[__ctx], t_exports.number(), start);
    if (end === void 0) {
      return databaseFunction(
        this[__ctx],
        this[__type],
        "array::slice",
        this,
        s
      );
    }
    const e = intoWorkable(this[__ctx], t_exports.number(), end);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::slice",
      this,
      s,
      e
    );
  },
  isEmpty() {
    return databaseFunction(this[__ctx], t_exports.bool(), "array::is_empty", this);
  },
  windows(size) {
    const s = intoWorkable(this[__ctx], t_exports.number(), size);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "array::windows",
      this,
      s
    );
  },
  map,
  at,
  val,
  len() {
    return databaseFunction(this[__ctx], t_exports.number(), "array::len", this);
  }
};
function map(cb) {
  const item = actionable({
    [__ctx]: this[__ctx],
    [__type]: elementType(this[__type]),
    [__display]: () => "$item"
  });
  const index = actionable({
    [__ctx]: this[__ctx],
    [__type]: t_exports.number(),
    [__display]: () => "$index"
  });
  const result = inheritableIntoWorkable(cb(item, index));
  return actionable({
    [__ctx]: this[__ctx],
    [__type]: t_exports.array(result[__type]),
    [__display]: (ctx) => `array::map(${this[__display](ctx)}, |$item, $index| ${result[__display](ctx)})`
  });
}
function at(n) {
  const v = intoWorkable(this[__ctx], t_exports.number(), n);
  const element = elementType(this[__type]);
  const type = element instanceof OptionType ? element : new OptionType(element);
  return databaseFunction(this[__ctx], type, "array::at", this, v);
}
function val() {
  return at.call(
    this,
    intoWorkable(this[__ctx], t_exports.literal(0), 0)
  );
}

// src/functions/types/date.ts
var date_exports = {};
__export(date_exports, {
  functions: () => functions3
});
var functions3 = {
  // Extraction
  day() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::day", this);
  },
  hour() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::hour", this);
  },
  minute() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::minute", this);
  },
  second() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::second", this);
  },
  month() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::month", this);
  },
  year() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::year", this);
  },
  week() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::week", this);
  },
  wday() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::wday", this);
  },
  yday() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::yday", this);
  },
  // Conversion
  unix() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::unix", this);
  },
  millis() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::millis", this);
  },
  micros() {
    return databaseFunction(this[__ctx], t_exports.number(), "time::micros", this);
  },
  nano() {
    return databaseFunction(this[__ctx], t_exports.bigint(), "time::nano", this);
  },
  // Rounding. The server takes a duration, not a string.
  timeCeil(duration2) {
    const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration2);
    return databaseFunction(this[__ctx], t_exports.date(), "time::ceil", this, val2);
  },
  timeFloor(duration2) {
    const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration2);
    return databaseFunction(this[__ctx], t_exports.date(), "time::floor", this, val2);
  },
  timeRound(duration2) {
    const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration2);
    return databaseFunction(this[__ctx], t_exports.date(), "time::round", this, val2);
  },
  // Other
  format(fmt) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), fmt);
    return databaseFunction(this[__ctx], t_exports.string(), "time::format", this, val2);
  },
  timeGroup(interval) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), interval);
    return databaseFunction(this[__ctx], t_exports.date(), "time::group", this, val2);
  },
  isLeapYear() {
    return databaseFunction(this[__ctx], t_exports.bool(), "time::is_leap_year", this);
  }
};

// src/functions/types/graph.ts
var graph_exports = {};
__export(graph_exports, {
  functions: () => functions4
});
function tableSchema(workable, target) {
  return workable[__ctx].orm.tables[target]?.schema;
}
function graph(workable, direction, args) {
  const alternatives = graphAlternatives(args);
  const rendered = alternatives.map(
    (alternative) => {
      const schema = typeof alternative.target === "string" ? tableSchema(workable, alternative.target) : void 0;
      return {
        target: alternative.target,
        where: schema ? edgeFilter(workable[__ctx], schema, alternative.filter) : void 0
      };
    }
  );
  const target = graphResultTarget(alternatives);
  return traverse(
    workable,
    direction,
    rendered,
    target
  );
}
var functions4 = {
  select() {
    return this[__ctx].orm.select(this);
  },
  out(...args) {
    return graph(this, "out", args);
  },
  in(...args) {
    return graph(this, "in", args);
  },
  both(...args) {
    return graph(this, "both", args);
  },
  // Array predicates over the traversal result, for use in WHERE / projections.
  len() {
    return databaseFunction(this[__ctx], t_exports.number(), "array::len", this);
  },
  isEmpty() {
    return databaseFunction(this[__ctx], t_exports.bool(), "array::is_empty", this);
  },
  contains(v) {
    return comparingFilter(this[__ctx], "CONTAINS", this, v);
  }
};

// src/functions/types/number.ts
var number_exports = {};
__export(number_exports, {
  functions: () => functions5
});
var functions5 = {
  // Core
  abs() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::abs", this);
  },
  ceil() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::ceil", this);
  },
  floor() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::floor", this);
  },
  round() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::round", this);
  },
  fixed(places) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), places);
    return databaseFunction(this[__ctx], t_exports.number(), "math::fixed", this, val2);
  },
  sign() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::sign", this);
  },
  sqrt() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::sqrt", this);
  },
  pow(exp) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), exp);
    return databaseFunction(this[__ctx], t_exports.number(), "math::pow", this, val2);
  },
  // Trigonometric
  cos() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::cos", this);
  },
  sin() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::sin", this);
  },
  tan() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::tan", this);
  },
  cot() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::cot", this);
  },
  acos() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::acos", this);
  },
  asin() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::asin", this);
  },
  atan() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::atan", this);
  },
  acot() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::acot", this);
  },
  // Logarithmic
  ln() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::ln", this);
  },
  log(base) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), base);
    return databaseFunction(this[__ctx], t_exports.number(), "math::log", this, val2);
  },
  log10() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::log10", this);
  },
  log2() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::log2", this);
  },
  // Conversion
  deg2rad() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::deg2rad", this);
  },
  rad2deg() {
    return databaseFunction(this[__ctx], t_exports.number(), "math::rad2deg", this);
  },
  // Interpolation
  lerp(to, fraction) {
    const toVal = intoWorkable(this[__ctx], t_exports.number(), to);
    const fracVal = intoWorkable(this[__ctx], t_exports.number(), fraction);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "math::lerp",
      this,
      toVal,
      fracVal
    );
  },
  lerpangle(to, fraction) {
    const toVal = intoWorkable(this[__ctx], t_exports.number(), to);
    const fracVal = intoWorkable(this[__ctx], t_exports.number(), fraction);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "math::lerpangle",
      this,
      toVal,
      fracVal
    );
  },
  // Clamping
  clamp(min, max) {
    const minVal = intoWorkable(this[__ctx], t_exports.number(), min);
    const maxVal = intoWorkable(this[__ctx], t_exports.number(), max);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "math::clamp",
      this,
      minVal,
      maxVal
    );
  }
};

// src/functions/types/option.ts
var option_exports = {};
__export(option_exports, {
  functions: () => functions6
});
var functions6 = {
  /**
   * Apply `cb` to the present value, yielding `NONE` when the value is absent.
   * Renders `(IF <value> IS NONE THEN NONE ELSE <cb> END)`, so the value's
   * expression appears twice in the query. Keep it a field or other plain
   * expression rather than something costly or side-effecting.
   */
  map(cb) {
    const inner = actionable({
      [__ctx]: this[__ctx],
      [__type]: this[__type].schema,
      [__display]: this[__display]
    });
    const res = cb(inner);
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: t_exports.option(res[__type]),
      // SurrealQL has no `?` mapping operator. Guard on NONE, so the callback
      // only runs for a present value. Its expression is rendered again
      // inside the branch, because `inner` is the option's own expression.
      [__display]: (ctx) => `(IF ${this[__display](ctx)} IS NONE THEN NONE ELSE ${res[__display](ctx)} END)`
    });
  },
  /**
   * Treat the value as its non-optional inner type, exposing the inner type's
   * fields and methods for chaining. SurrealDB dereferences a `NONE` to `NONE`
   * transparently, so this is an identity on the rendered path — it only sheds
   * the `option<…>` wrapper at the type level (the query stays NONE-safe). Use
   * it to call inner methods that the `option` itself doesn't expose, e.g.
   * `tags.unwrap().at(0)` or `link.unwrap().select()`.
   */
  unwrap() {
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: this[__type].schema,
      [__display]: this[__display]
    });
  },
  /**
   * Supply a fallback for when the value is absent: renders `(<value> ?? <fallback>)`
   * using SurrealDB's null-coalescing operator, yielding the non-optional inner
   * type. The Rust `Option::unwrap_or` equivalent (`unwrap_or_else` collapses to
   * this too — a query fallback is just an expression, with no laziness).
   */
  unwrapOr(fallback) {
    const value = intoWorkable(this[__ctx], this[__type].schema, fallback);
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: this[__type].schema,
      [__display]: (ctx) => `(${this[__display](ctx)} ?? ${value[__display](ctx)})`
    });
  },
  /** `<value> IS NONE` — true when the value is absent. */
  isNone() {
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: t_exports.bool(),
      [__display]: (ctx) => `${this[__display](ctx)} IS NONE`
    });
  },
  /** `<value> IS NOT NONE` — true when the value is present. */
  isSome() {
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: t_exports.bool(),
      [__display]: (ctx) => `${this[__display](ctx)} IS NOT NONE`
    });
  },
  /**
   * Present *and* the inner value satisfies `cb` — renders
   * `(<value> IS NOT NONE AND <cb(inner)>)`. The Rust `Option::is_some_and`
   * equivalent; the callback receives the unwrapped inner value.
   */
  isSomeAnd(cb) {
    const inner = actionable({
      [__ctx]: this[__ctx],
      [__type]: this[__type].schema,
      [__display]: this[__display]
    });
    const pred = cb(inner);
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: t_exports.bool(),
      [__display]: (ctx) => `(${this[__display](ctx)} IS NOT NONE AND ${pred[__display](ctx)})`
    });
  }
};

// src/functions/types/record.ts
var record_exports = {};
__export(record_exports, {
  functions: () => functions7
});
function tableSchema2(workable, target) {
  return workable[__ctx].orm.tables[target]?.schema;
}
function graph2(workable, direction, args) {
  const alternatives = graphAlternatives(args);
  const rendered = alternatives.map(
    (alternative) => {
      const schema = typeof alternative.target === "string" ? tableSchema2(workable, alternative.target) : void 0;
      return {
        target: alternative.target,
        where: schema ? edgeFilter(workable[__ctx], schema, alternative.filter) : void 0
      };
    }
  );
  const target = graphResultTarget(alternatives);
  return traverse(
    workable,
    direction,
    rendered,
    target
  );
}
var functions7 = {
  select() {
    return this[__ctx].orm.select(this);
  },
  out(...args) {
    return graph2(this, "out", args);
  },
  in(...args) {
    return graph2(this, "in", args);
  },
  both(...args) {
    return graph2(this, "both", args);
  },
  recurse(depth, body) {
    return recursion(
      this,
      this[__type].tb,
      { depth: renderRecursionDepth(depth) },
      body
    );
  },
  collect(...args) {
    const [depth, body, options] = typeof args[0] === "function" ? [{}, args[0], args[1]] : args;
    const inclusive = options?.inclusive ? "+inclusive" : "";
    return recursion(
      this,
      this[__type].tb,
      {
        depth: renderRecursionDepth(depth),
        modifiers: () => `+collect${inclusive}`
      },
      body
    );
  },
  shortest(target, body, options) {
    const to = intoWorkable(this[__ctx], this[__type], target);
    const inclusive = options?.inclusive ? "+inclusive" : "";
    return recursion(
      this,
      this[__type].tb,
      {
        depth: "..",
        modifiers: (ctx) => `+shortest=${to[__display](ctx)}${inclusive}`,
        optional: true
      },
      body
    );
  }
};

// src/functions/types/set.ts
var set_exports = {};
__export(set_exports, {
  functions: () => functions8
});
var functions8 = {
  // Membership operators, which SurrealDB evaluates on sets as on arrays.
  contains(v) {
    return comparingFilter(this[__ctx], "CONTAINS", this, v);
  },
  containsNot(v) {
    return comparingFilter(this[__ctx], "CONTAINSNOT", this, v);
  },
  containsAll(v) {
    return comparingFilter(this[__ctx], "CONTAINSALL", this, v);
  },
  containsAny(v) {
    return comparingFilter(this[__ctx], "CONTAINSANY", this, v);
  },
  containsNone(v) {
    return comparingFilter(this[__ctx], "CONTAINSNONE", this, v);
  },
  allInside(v) {
    return comparingFilter(this[__ctx], "ALLINSIDE", this, v);
  },
  anyInside(v) {
    return comparingFilter(this[__ctx], "ANYINSIDE", this, v);
  },
  noneInside(v) {
    return comparingFilter(this[__ctx], "NONEINSIDE", this, v);
  },
  // Producing a set
  add(v) {
    const x = intoWorkable(this[__ctx], this[__type].schema, v);
    return databaseFunction(this[__ctx], this[__type], "set::add", this, x);
  },
  remove(v) {
    const x = intoWorkable(this[__ctx], this[__type].schema, v);
    return databaseFunction(this[__ctx], this[__type], "set::remove", this, x);
  },
  complement(other) {
    const o = intoWorkable(this[__ctx], this[__type], other);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "set::complement",
      this,
      o
    );
  },
  difference(other) {
    const o = intoWorkable(this[__ctx], this[__type], other);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "set::difference",
      this,
      o
    );
  },
  intersect(other) {
    const o = intoWorkable(this[__ctx], this[__type], other);
    return databaseFunction(
      this[__ctx],
      this[__type],
      "set::intersect",
      this,
      o
    );
  },
  union(other) {
    const o = intoWorkable(this[__ctx], this[__type], other);
    return databaseFunction(this[__ctx], this[__type], "set::union", this, o);
  },
  flatten() {
    return databaseFunction(this[__ctx], this[__type], "set::flatten", this);
  },
  filter(predicate) {
    return databaseFunction(
      this[__ctx],
      this[__type],
      "set::filter",
      this,
      predicate
    );
  },
  slice(start, end) {
    const args = [this];
    if (start !== void 0)
      args.push(intoWorkable(this[__ctx], t_exports.number(), start));
    if (end !== void 0)
      args.push(intoWorkable(this[__ctx], t_exports.number(), end));
    return databaseFunction(
      this[__ctx],
      this[__type],
      "set::slice",
      ...args
    );
  },
  map: map2,
  // Reading from a set
  at: at2,
  find(predicate) {
    return databaseFunction(
      this[__ctx],
      optional2(this[__type].schema),
      "set::find",
      this,
      predicate
    );
  },
  first() {
    return databaseFunction(
      this[__ctx],
      optional2(this[__type].schema),
      "set::first",
      this
    );
  },
  last() {
    return databaseFunction(
      this[__ctx],
      optional2(this[__type].schema),
      "set::last",
      this
    );
  },
  max() {
    return databaseFunction(
      this[__ctx],
      optional2(this[__type].schema),
      "set::max",
      this
    );
  },
  min() {
    return databaseFunction(
      this[__ctx],
      optional2(this[__type].schema),
      "set::min",
      this
    );
  },
  // Properties of a set
  isEmpty() {
    return databaseFunction(this[__ctx], t_exports.bool(), "set::is_empty", this);
  },
  join(separator) {
    const s = intoWorkable(this[__ctx], t_exports.string(), separator);
    return databaseFunction(this[__ctx], t_exports.string(), "set::join", this, s);
  },
  len() {
    return databaseFunction(this[__ctx], t_exports.number(), "set::len", this);
  },
  all(p) {
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "set::all",
      ...p ? [this, p] : [this]
    );
  },
  any(p) {
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "set::any",
      ...p ? [this, p] : [this]
    );
  }
};
function optional2(element) {
  return element instanceof OptionType ? element : new OptionType(element);
}
function map2(cb) {
  const item = actionable({
    [__ctx]: this[__ctx],
    [__type]: this[__type].schema,
    [__display]: () => "$item"
  });
  const index = actionable({
    [__ctx]: this[__ctx],
    [__type]: t_exports.number(),
    [__display]: () => "$index"
  });
  const result = inheritableIntoWorkable(cb(item, index));
  return actionable({
    [__ctx]: this[__ctx],
    [__type]: t_exports.set(result[__type]),
    [__display]: (ctx) => `set::map(${this[__display](ctx)}, |$item, $index| ${result[__display](ctx)})`
  });
}
function at2(n) {
  const v = intoWorkable(this[__ctx], t_exports.number(), n);
  return databaseFunction(
    this[__ctx],
    optional2(this[__type].schema),
    "set::at",
    this,
    v
  );
}

// src/functions/types/string.ts
var string_exports = {};
__export(string_exports, {
  functions: () => functions9
});
var functions9 = {
  /**
   * Full-text match: `field @@ value`, or `field @N@ value` when `ref` is given.
   *
   * `search.score()`, `search.highlight()` and `search.offsets()` read a match
   * by its reference, so pass the same N to both. A reference is only valid
   * within one statement, and must be a literal integer from 0 to 255.
   */
  search(value, ref) {
    if (ref === void 0) {
      return comparingFilter(this[__ctx], "@@", this, value);
    }
    const n = matchRef(ref);
    const operand = intoWorkable(this[__ctx], t_exports.string(), value);
    return actionable({
      [__ctx]: this[__ctx],
      [__type]: t_exports.bool(),
      // As for `@@` (see comparingFilter), the field is rendered without its
      // `$this.` prefix, which the match operator does not accept.
      [__display]: (ctx) => `${this[__display](ctx).replace(/^\$this\./, "")} @${n}@ ${operand[__display](ctx)}`
    });
  },
  startsWith(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::starts_with",
      this,
      val2
    );
  },
  endsWith(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::ends_with",
      this,
      val2
    );
  },
  len() {
    return databaseFunction(this[__ctx], t_exports.number(), "string::len", this);
  },
  join(separator, ...others) {
    const sep = intoWorkable(this[__ctx], t_exports.string(), separator);
    const workables = others.map(
      (p) => intoWorkable(this[__ctx], t_exports.string(), p)
    );
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::join",
      sep,
      this,
      ...workables
    );
  },
  // Core string functions
  capitalize() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::capitalize",
      this
    );
  },
  concat(...values) {
    const workables = values.map(
      (v) => intoWorkable(this[__ctx], t_exports.string(), v)
    );
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::concat",
      this,
      ...workables
    );
  },
  contains(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::contains",
      this,
      val2
    );
  },
  lowercase() {
    return databaseFunction(this[__ctx], t_exports.string(), "string::lowercase", this);
  },
  uppercase() {
    return databaseFunction(this[__ctx], t_exports.string(), "string::uppercase", this);
  },
  trim() {
    return databaseFunction(this[__ctx], t_exports.string(), "string::trim", this);
  },
  repeat(n) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), n);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::repeat",
      this,
      val2
    );
  },
  replace(from, to) {
    const f = intoWorkable(this[__ctx], t_exports.string(), from);
    const toVal = intoWorkable(this[__ctx], t_exports.string(), to);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::replace",
      this,
      f,
      toVal
    );
  },
  reverse() {
    return databaseFunction(this[__ctx], t_exports.string(), "string::reverse", this);
  },
  slice(start, length) {
    const s = intoWorkable(this[__ctx], t_exports.number(), start);
    const l = intoWorkable(this[__ctx], t_exports.number(), length);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::slice",
      this,
      s,
      l
    );
  },
  slug() {
    return databaseFunction(this[__ctx], t_exports.string(), "string::slug", this);
  },
  split(delimiter) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), delimiter);
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.string()),
      "string::split",
      this,
      val2
    );
  },
  words() {
    return databaseFunction(
      this[__ctx],
      t_exports.array(t_exports.string()),
      "string::words",
      this
    );
  },
  matches(pattern) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), pattern);
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::matches",
      this,
      val2
    );
  },
  // Distance functions
  distanceDamerauLevenshtein(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::damerau_levenshtein",
      this,
      val2
    );
  },
  distanceNormalizedDamerauLevenshtein(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::normalized_damerau_levenshtein",
      this,
      val2
    );
  },
  distanceHamming(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::hamming",
      this,
      val2
    );
  },
  distanceLevenshtein(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::levenshtein",
      this,
      val2
    );
  },
  distanceNormalizedLevenshtein(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::normalized_levenshtein",
      this,
      val2
    );
  },
  distanceOsa(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::distance::osa",
      this,
      val2
    );
  },
  // HTML functions
  htmlEncode() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::html::encode",
      this
    );
  },
  htmlSanitize() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::html::sanitize",
      this
    );
  },
  // Validation functions (is_*)
  isAlphanum() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_alphanum", this);
  },
  isAlpha() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_alpha", this);
  },
  isAscii() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_ascii", this);
  },
  isDatetime(format) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), format);
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::is_datetime",
      this,
      val2
    );
  },
  isDomain() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_domain", this);
  },
  isEmail() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_email", this);
  },
  isHexadecimal() {
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::is_hexadecimal",
      this
    );
  },
  isIp() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_ip", this);
  },
  isIpv4() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_ipv4", this);
  },
  isIpv6() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_ipv6", this);
  },
  isLatitude() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_latitude", this);
  },
  isLongitude() {
    return databaseFunction(
      this[__ctx],
      t_exports.bool(),
      "string::is_longitude",
      this
    );
  },
  isNumeric() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_numeric", this);
  },
  isRecord() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_record", this);
  },
  isSemver() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_semver", this);
  },
  isUlid() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_ulid", this);
  },
  isUrl() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_url", this);
  },
  isUuid() {
    return databaseFunction(this[__ctx], t_exports.bool(), "string::is_uuid", this);
  },
  // Semver functions
  semverCompare(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::semver::compare",
      this,
      val2
    );
  },
  semverMajor() {
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::semver::major",
      this
    );
  },
  semverMinor() {
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::semver::minor",
      this
    );
  },
  semverPatch() {
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::semver::patch",
      this
    );
  },
  semverIncMajor() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::inc::major",
      this
    );
  },
  semverIncMinor() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::inc::minor",
      this
    );
  },
  semverIncPatch() {
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::inc::patch",
      this
    );
  },
  semverSetMajor(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::set::major",
      this,
      val2
    );
  },
  semverSetMinor(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::set::minor",
      this,
      val2
    );
  },
  semverSetPatch(v) {
    const val2 = intoWorkable(this[__ctx], t_exports.number(), v);
    return databaseFunction(
      this[__ctx],
      t_exports.string(),
      "string::semver::set::patch",
      this,
      val2
    );
  },
  // Similarity functions
  similarityFuzzy(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::similarity::fuzzy",
      this,
      val2
    );
  },
  similarityJaro(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::similarity::jaro",
      this,
      val2
    );
  },
  similarityJaroWinkler(other) {
    const val2 = intoWorkable(this[__ctx], t_exports.string(), other);
    return databaseFunction(
      this[__ctx],
      t_exports.number(),
      "string::similarity::jaro_winkler",
      this,
      val2
    );
  }
};

// src/functions/index.ts
var functions10 = {
  any: any_exports.functions,
  array: {
    ...array_exports.functions,
    ...array_exports.vectorFunctions
  },
  date: date_exports.functions,
  graph: graph_exports.functions,
  number: number_exports.functions,
  option: option_exports.functions,
  point: {},
  record: record_exports.functions,
  set: set_exports.functions,
  string: string_exports.functions
};
var tables = /* @__PURE__ */ new Map();
function functionTable(typeName) {
  let table = tables.get(typeName);
  if (!table) {
    table = { ...functions10.any };
    if (typeName in functions10) {
      Object.assign(table, functions10[typeName]);
    }
    tables.set(typeName, table);
  }
  return table;
}

// src/utils/actionable.ts
function actionable(workable) {
  const table = functionTable(workable[__type].name);
  const bound2 = /* @__PURE__ */ new Map();
  return new Proxy(table, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return workable[prop];
      }
      if (prop in target) {
        let fn = bound2.get(prop);
        if (fn === void 0) {
          const unbound = target[prop];
          if (typeof unbound !== "function") {
            throw new OrmError(`Property ${prop} is not a function`);
          }
          fn = Object.assign(unbound.bind(workable), {
            valueOf: () => actionable(workableGet(workable, prop))
          });
          bound2.set(prop, fn);
        }
        return fn;
      }
      return actionable(workableGet(workable, prop));
    }
  });
}

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
    const join2 = JOIN.exec(text.slice(i, i + 5));
    if (!join2) continue;
    operands.push(text.slice(start, i).trim());
    joins.push(join2[1]);
    start = i + join2[0].length;
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
function literal2(value) {
  if (value instanceof import_surrealdb6.RecordId) return `(${value.toString()})`;
  return typeof value === "string" ? stringLiteral(value) : inlineValue(value);
}
function stringLiteral(value) {
  const quoted = JSON.stringify(value);
  if (value.includes("'")) return quoted;
  const body = quoted.slice(1, -1).replace(/\\\\|\\"/g, (pair) => pair === '\\"' ? '"' : pair);
  return `'${body}'`;
}
function renderWhere(rule, scope, env) {
  const tables2 = { ...env.tables };
  for (const table of [rule.auth, ...rule.related]) {
    if (table) tables2[table.tb] = table;
  }
  const id = /* @__PURE__ */ Symbol();
  const ctx = { orm: { tables: tables2 }, id };
  const row = actionable({
    [__ctx]: ctx,
    [__type]: tables2[env.tb]?.schema ?? t_exports.object({}),
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
      displayContext({ var: literal2, variables: {}, contextId: id })
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
      literal3(ddl.default.value, ddl.default.expression)
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
function tableList(tables2) {
  return (Array.isArray(tables2) ? tables2 : [String(tables2)]).map(ident).join(" | ");
}
function literal3(value, expression = false) {
  if (typeof value === "string") {
    return expression ? value : quote(value, "'");
  }
  if (value === null) return "NULL";
  if (value === void 0) return "NONE";
  if (value instanceof Date) return `d'${value.toISOString()}'`;
  if (value instanceof Set) {
    return `<set>[${[...value].map((member) => literal3(member)).join(", ")}]`;
  }
  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

// src/migrator/secrets.ts
var PLACEHOLDER = "<redacted>";
var REPORTED = "[REDACTED]";
var MARKER = "-- cannot restore access ";
var MARKER_REASON = ": its keys are not readable from the database";
var DEFINE_ACCESS = /^\s*DEFINE\s+ACCESS\s+(?:OVERWRITE\s+|IF\s+NOT\s+EXISTS\s+)?(`(?:[^`\\]|\\.)*`|⟨(?:[^⟩\\]|\\.)*⟩|\S+)/i;
function keyLiterals(statement) {
  const found = [];
  let i = 0;
  while (i < statement.length) {
    const char = statement[i];
    if (char === "'" || char === '"') {
      i = endOfString(statement, i);
      continue;
    }
    if (isKeyword(statement, i)) {
      let next = i + 3;
      while (/\s/.test(statement[next] ?? "")) next += 1;
      const quote2 = statement[next];
      if (quote2 === "'" || quote2 === '"') {
        const end = endOfString(statement, next);
        found.push({
          start: next,
          end,
          value: statement.slice(next + 1, end - 1)
        });
        i = end;
        continue;
      }
    }
    i += 1;
  }
  return found;
}
function endOfString(statement, start) {
  const quote2 = statement[start];
  let i = start + 1;
  while (i < statement.length) {
    if (statement[i] === "\\") i += 2;
    else if (statement[i] === quote2) return i + 1;
    else i += 1;
  }
  return statement.length;
}
function isKeyword(statement, index) {
  if (statement.slice(index, index + 3).toUpperCase() !== "KEY") return false;
  return !/[A-Za-z0-9_]/.test(statement[index - 1] ?? "") && !/[A-Za-z0-9_]/.test(statement[index + 3] ?? "");
}
function redactSecrets(statement) {
  if (!DEFINE_ACCESS.test(statement)) return statement;
  let out = "";
  let from = 0;
  for (const { start, end } of keyLiterals(statement)) {
    out += statement.slice(from, start) + PLACEHOLDER;
    from = end;
  }
  return out + statement.slice(from);
}
function hidesKey(statement) {
  return DEFINE_ACCESS.test(statement) && keyLiterals(statement).some(({ value }) => value === REPORTED);
}
function restoreStatement(reported) {
  if (!hidesKey(reported)) return `${reported};`;
  const name = DEFINE_ACCESS.exec(reported)?.[1] ?? "";
  return `${MARKER}${name}${MARKER_REASON}`;
}
function unrestorableAccess(down) {
  for (const statement of down) {
    if (statement.startsWith(MARKER)) {
      const named = statement.slice(MARKER.length);
      return named.endsWith(MARKER_REASON) ? named.slice(0, -MARKER_REASON.length) : named;
    }
    if (hidesKey(statement)) return DEFINE_ACCESS.exec(statement)?.[1];
  }
  return void 0;
}

// src/migrator/diff.ts
function diff(definitions, current, options = {}) {
  const drafts = [];
  const schemas = definitions.filter(isTableSchema);
  const entities = definitions.filter(isDatabaseEntity);
  const declared = new Set(schemas.map((s) => s.tb));
  const render = {
    tables: Object.fromEntries(schemas.map((s) => [s.tb, s]))
  };
  const entityChanges = diffEntities(entities, current, options);
  drafts.push(...entityChanges.first);
  for (const schema of schemas) {
    const table = current.tables[schema.tb];
    if (table) {
      drafts.push(...diffTable(schema, table, options, render));
    } else {
      drafts.push(createTable(schema, render));
    }
  }
  if (options.removeMissing) {
    for (const name of Object.keys(current.tables)) {
      if (declared.has(name)) continue;
      drafts.push({
        kind: "table.remove",
        target: name,
        up: [`REMOVE TABLE ${name};`],
        // The table's definition is known, but its data is not, so a
        // rollback can only restore the shape.
        down: [`${current.tables[name]?.definition};`]
      });
    }
  }
  drafts.push(...entityChanges.last);
  const changes = drafts.map(
    (draft) => ({ ...draft, display: draft.up.map(redactSecrets) })
  );
  return {
    changes,
    up: changes.flatMap((c) => c.up),
    display: changes.flatMap((c) => c.display),
    down: [...changes].reverse().flatMap((c) => c.down)
  };
}
function createTable(schema, render) {
  const up = defineSchemaStatements(schema, render);
  return {
    kind: "table.create",
    target: schema.tb,
    up,
    down: [`REMOVE TABLE ${schema.tb};`]
  };
}
function diffTable(schema, current, options, render) {
  const changes = [];
  const desiredTable = defineTable(schema, render);
  if (!same(desiredTable, current.definition)) {
    changes.push({
      kind: "table.modify",
      target: schema.tb,
      up: [defineTable(schema, { ...render, overwrite: true })],
      down: [`${current.definition};`]
    });
  }
  changes.push(...diffFields(schema, current, options, render));
  changes.push(...diffAttachments(schema, current, options));
  return changes;
}
function diffAttachments(schema, current, options) {
  return [
    ...diffNamed(
      schema.ddl.indexes ?? {},
      current.indexes,
      "index",
      (name, spec, overwrite) => defineIndex(schema.tb, { name, ...spec }, { overwrite }),
      (name) => `REMOVE INDEX ${name} ON TABLE ${schema.tb};`,
      options
    ),
    ...diffNamed(
      schema.ddl.events ?? {},
      current.events,
      "event",
      (name, spec, overwrite) => defineEvent(schema.tb, { name, ...spec }, { overwrite }),
      (name) => `REMOVE EVENT ${name} ON TABLE ${schema.tb};`,
      options
    )
  ].map((change) => ({
    ...change,
    target: `${schema.tb}.${change.target}`
  }));
}
function diffNamed(declared, stored, kind, define, remove, options) {
  const changes = [];
  const renamedFrom = /* @__PURE__ */ new Set();
  for (const [name, spec] of Object.entries(declared)) {
    const existing = stored[name];
    const oldName = !existing ? spec.previousNames?.find((previous) => stored[previous]) : void 0;
    if (oldName) {
      renamedFrom.add(oldName);
      changes.push({
        kind: `${kind}.modify`,
        target: `${oldName} -> ${name}`,
        up: [define(name, spec, false), remove(oldName)],
        down: [`${stored[oldName]};`, remove(name)]
      });
      continue;
    }
    if (!existing) {
      changes.push({
        kind: `${kind}.create`,
        target: name,
        up: [define(name, spec, false)],
        down: [remove(name)]
      });
      continue;
    }
    if (!same(define(name, spec, false), existing)) {
      changes.push({
        kind: `${kind}.modify`,
        target: name,
        up: [define(name, spec, true)],
        down: [`${existing};`]
      });
    }
  }
  if (!options.removeMissing) return changes;
  for (const [name, existing] of Object.entries(stored)) {
    if (name in declared || renamedFrom.has(name)) continue;
    changes.push({
      kind: `${kind}.remove`,
      target: name,
      up: [remove(name)],
      down: [`${existing};`]
    });
  }
  return changes;
}
function diffFields(schema, current, options, render) {
  const changes = [];
  const fields = definableFields(schema);
  const renamedFrom = /* @__PURE__ */ new Set();
  for (const field of fields) {
    const stored = current.fields[storedName(field.name)];
    const oldName = renameSource(field, current);
    if (oldName) {
      renamedFrom.add(oldName);
      changes.push(renameField(schema, field, oldName, current, render));
      continue;
    }
    if (!stored) {
      changes.push({
        kind: "field.create",
        target: `${schema.tb}.${field.name}`,
        up: [defineField(schema.tb, field, render)],
        down: [`REMOVE FIELD ${field.name} ON TABLE ${schema.tb};`]
      });
      continue;
    }
    const desired = defineField(schema.tb, field, render);
    if (!same(desired, stored)) {
      changes.push({
        kind: "field.modify",
        target: `${schema.tb}.${field.name}`,
        up: [defineField(schema.tb, field, { ...render, overwrite: true })],
        down: [`${stored};`]
      });
    }
  }
  for (const [name, define, overwrite] of rawComputedFields(schema)) {
    const stored = current.fields[name];
    if (!stored) {
      changes.push({
        kind: "field.create",
        target: `${schema.tb}.${name}`,
        up: [define],
        down: [`REMOVE FIELD ${name} ON TABLE ${schema.tb};`]
      });
    } else if (!same(define, stored)) {
      changes.push({
        kind: "field.modify",
        target: `${schema.tb}.${name}`,
        up: [overwrite],
        down: [`${stored};`]
      });
    }
  }
  if (!options.removeMissing) return changes;
  const declaredNames = /* @__PURE__ */ new Set([
    ...fields.map((f) => storedName(f.name)),
    ...rawComputedFields(schema).map(([name]) => name)
  ]);
  changes.push(
    ...removeUndeclaredFields(schema, current, declaredNames, renamedFrom)
  );
  return changes;
}
function removeUndeclaredFields(schema, current, declaredNames, renamedFrom) {
  const changes = [];
  for (const [name, stored] of Object.entries(current.fields)) {
    if (declaredNames.has(name) || renamedFrom.has(name)) continue;
    if (isArrayElement(name, declaredNames)) continue;
    if (isDatabaseOwned(name, schema)) continue;
    changes.push({
      kind: "field.remove",
      target: `${schema.tb}.${name}`,
      up: [`REMOVE FIELD ${name} ON TABLE ${schema.tb};`],
      down: [`${stored};`]
    });
  }
  return changes;
}
function renameField(schema, field, oldName, current, render) {
  const tb = schema.tb;
  return {
    kind: "field.rename",
    target: `${tb}.${oldName} -> ${field.name}`,
    up: [
      defineField(tb, field, render),
      `UPDATE ${tb} SET ${field.name} = ${oldName};`,
      `REMOVE FIELD ${oldName} ON TABLE ${tb};`,
      `UPDATE ${tb} UNSET ${oldName};`
    ],
    down: [
      `${current.fields[oldName]};`,
      `UPDATE ${tb} SET ${oldName} = ${field.name};`,
      `REMOVE FIELD ${field.name} ON TABLE ${tb};`,
      `UPDATE ${tb} UNSET ${field.name};`
    ]
  };
}
function renameSource(field, current) {
  const previous = field.ddl.previousNames;
  if (!previous?.length) return null;
  if (current.fields[storedName(field.name)]) return null;
  return previous.find((name) => current.fields[storedName(name)]) ?? null;
}
function isDatabaseOwned(name, schema) {
  if (name === "id") return true;
  return schema instanceof EdgeSchema && (name === "in" || name === "out");
}
function isArrayElement(name, declared) {
  const marker = name.indexOf(".*");
  if (marker === -1) return false;
  return declared.has(name.slice(0, marker));
}
function isTableSchema(definition) {
  return "tb" in definition;
}
function isDatabaseEntity(definition) {
  return "kind" in definition && "define" in definition;
}
function diffEntities(entities, current, options) {
  const result = { first: [], last: [] };
  const seen = /* @__PURE__ */ new Map();
  for (const entity of entities) {
    const stored = current.entities[entity.kind] ?? {};
    const claimed = seen.get(entity.kind) ?? /* @__PURE__ */ new Set();
    claimed.add(entity.key);
    seen.set(entity.kind, claimed);
    const change = diffEntity(entity, stored);
    if (!change) continue;
    if (change.renamedFrom) claimed.add(change.renamedFrom);
    result.first.push(change.change);
    if (change.last) result.last.push(change.last);
  }
  if (options.removeMissing) {
    const removals = removeUndeclaredEntities(entities, current, seen);
    result.first.push(...removals.first);
    result.last.push(...removals.last);
  }
  return result;
}
function removedAfterTables(entity) {
  return entity.kind === "analyzer";
}
function diffEntity(entity, stored) {
  const existing = stored[entity.key];
  if (!existing) {
    const oldName = entity.previousNames?.find((previous) => stored[previous]);
    if (oldName) {
      const target = `${entity.kind} ${oldName} -> ${entity.name}`;
      if (removedAfterTables(entity)) {
        return {
          renamedFrom: oldName,
          change: {
            kind: "entity.modify",
            target,
            up: [entity.define()],
            down: [entity.remove()]
          },
          last: {
            kind: "entity.modify",
            target,
            up: [removeNamed(entity, oldName)],
            down: [`${stored[oldName]};`]
          }
        };
      }
      return {
        renamedFrom: oldName,
        change: {
          kind: "entity.modify",
          target,
          up: [entity.define(), removeNamed(entity, oldName)],
          down: [restoreStatement(stored[oldName] ?? ""), entity.remove()]
        }
      };
    }
    return {
      change: {
        kind: "entity.create",
        target: `${entity.kind} ${entity.name}`,
        up: [entity.define()],
        down: [entity.remove()]
      }
    };
  }
  if (entity.opaque) return null;
  if (same(entity.define(), existing)) return null;
  return {
    change: {
      kind: "entity.modify",
      target: `${entity.kind} ${entity.name}`,
      up: [entity.define({ overwrite: true })],
      down: [restoreStatement(existing)]
    }
  };
}
function removeUndeclaredEntities(entities, current, seen) {
  const result = { first: [], last: [] };
  for (const [kind, stored] of Object.entries(current.entities)) {
    const entity = entities.find((candidate) => candidate.kind === kind);
    if (!entity) continue;
    const when = removedAfterTables(entity) ? result.last : result.first;
    for (const [name, existing] of Object.entries(stored)) {
      if (seen.get(kind)?.has(name)) continue;
      when.push({
        kind: "entity.remove",
        target: `${kind} ${name}`,
        up: [removeNamed(entity, name)],
        down: [restoreStatement(existing)]
      });
    }
  }
  return result;
}
function removeNamed(entity, name) {
  return entity.remove(name);
}
function defineSchemaStatements(schema, render) {
  const statements = [defineTable(schema, render)];
  for (const field of definableFields(schema)) {
    statements.push(defineField(schema.tb, field, render));
  }
  for (const [, define] of rawComputedFields(schema)) {
    statements.push(define);
  }
  for (const [name, index] of Object.entries(schema.ddl.indexes ?? {})) {
    statements.push(defineIndex(schema.tb, { name, ...index }));
  }
  for (const [name, event] of Object.entries(schema.ddl.events ?? {})) {
    statements.push(defineEvent(schema.tb, { name, ...event }));
  }
  return statements;
}
function definableFields(schema) {
  const declared = schema._fields;
  const computed = new Set(
    "computedFields" in schema ? schema.computedFields : []
  );
  return flattenFields(schema.fields).filter((field) => {
    if (schema instanceof EdgeSchema && (field.name === "in" || field.name === "out")) {
      return false;
    }
    if (computed.has(field.name.split(/[.[]/)[0])) return false;
    return !(field.name === "id" && !("id" in declared));
  });
}
function rawComputedFields(schema) {
  if (!("rawComputedStatements" in schema)) return [];
  const plain = schema.rawComputedStatements(false);
  const overwritten = schema.rawComputedStatements(true);
  return plain.map(([name, sql], index) => [
    name,
    sql,
    overwritten[index]?.[1] ?? sql
  ]);
}
function storedName(name) {
  return name.replace(/\[\*\]/g, ".*");
}
function same(a, b) {
  return canonicalise(a) === canonicalise(b);
}

// src/migrator/introspect.ts
var ENTITY_KEYS = {
  analyzer: "analyzers",
  param: "params",
  function: "functions",
  sequence: "sequences",
  access: "accesses",
  config: "configs"
};
var MIGRATIONS_TABLE = "_migrations";
async function introspect(surreal) {
  const [dbInfo] = await surreal.query("INFO FOR DB;");
  const tableNames = Object.keys(dbInfo?.tables ?? {}).filter(
    (name) => name !== MIGRATIONS_TABLE
  );
  const tables2 = {};
  for (const name of tableNames) {
    const [info2] = await surreal.query(`INFO FOR TABLE ${name};`);
    tables2[name] = {
      name,
      definition: dbInfo?.tables?.[name] ?? "",
      fields: info2?.fields ?? {},
      indexes: info2?.indexes ?? {},
      events: info2?.events ?? {}
    };
  }
  const entities = {};
  for (const [kind, key] of Object.entries(ENTITY_KEYS)) {
    entities[kind] = dbInfo?.[key] ?? {};
  }
  return { tables: tables2, entities };
}

// src/migrator/migrate.ts
async function plan(surreal, schemas, options = {}) {
  const current = await introspect(surreal);
  const result = diff(schemas, current, options);
  return { ...result, hasChanges: result.up.length > 0 };
}
async function migrate(surreal, schemas, options = {}) {
  const pending = await plan(surreal, schemas, options);
  if (!pending.hasChanges) return null;
  await ensureMigrationsTable(surreal);
  await surreal.query(pending.up.join("\n"));
  return record2(surreal, pending);
}
async function rollback(surreal) {
  const history = await applied(surreal);
  const last = history.at(-1);
  if (!last) return null;
  assertRollbackable(last);
  if (last.down.length) await surreal.query(last.down.join("\n"));
  await surreal.query(`DELETE ${MIGRATIONS_TABLE} WHERE id = $id;`, {
    id: last.id
  });
  return last;
}
async function applied(surreal) {
  await ensureMigrationsTable(surreal);
  const [rows] = await surreal.query(
    `SELECT * FROM ${MIGRATIONS_TABLE} ORDER BY appliedAt ASC;`
  );
  return rows ?? [];
}
function checksum(statements) {
  const input = statements.join("\n");
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
async function ensureMigrationsTable(surreal) {
  await surreal.query(
    `DEFINE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} SCHEMALESS;`
  );
}
async function record2(surreal, pending) {
  const migration = {
    appliedAt: (/* @__PURE__ */ new Date()).toISOString(),
    // What is recorded is what can be shown, so the history never holds a key,
    // and the checksum is over that text, which a rollback can recompute.
    up: pending.display,
    down: pending.down,
    checksum: checksum(pending.display)
  };
  const [created] = await surreal.query(
    `CREATE ${MIGRATIONS_TABLE} CONTENT $migration;`,
    { migration }
  );
  return created?.[0];
}
function assertRollbackable(migration) {
  verifyChecksum(migration);
  const hidden = unrestorableAccess(migration.down);
  if (hidden === void 0) return;
  throw new Error(
    `Migration ${migration.id} cannot be rolled back: it would restore the access method ${hidden}, and its keys cannot be read from the database. Restoring it from what the database reports would set its key to the text [REDACTED], which anyone can sign a token with. Recreate it by hand with a key of your own, then delete this migration from ${MIGRATIONS_TABLE}.`
  );
}
function verifyChecksum(migration) {
  const actual = checksum(migration.up);
  if (actual === migration.checksum) return;
  throw new Error(
    `Migration ${migration.id} has been modified since it was applied (expected checksum ${migration.checksum}, got ${actual}). Rolling it back would not undo what actually ran.`
  );
}

// src/cli/config.ts
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_node_url = require("url");
var UnknownEnvironmentError = class extends Error {
  constructor(requested, available) {
    const list = available.length ? available.join(", ") : "none defined";
    super(`No environment named '${requested}'. Available: ${list}`);
    this.requested = requested;
    this.available = available;
    this.name = "UnknownEnvironmentError";
  }
};
var CONFIG_FILES = [
  "surqlize.config.ts",
  "surqlize.config.mts",
  "surqlize.config.js",
  "surqlize.config.mjs"
];
var DEFAULTS = {
  schema: "./schema.ts",
  url: "ws://localhost:8000",
  namespace: "test",
  database: "test",
  username: "root",
  password: "root"
};
async function loadConfig(overrides = {}, cwd = process.cwd(), environment2) {
  const file = await loadConfigFile(cwd);
  const { environments, ...base } = file;
  if (environment2 && !environments?.[environment2]) {
    throw new UnknownEnvironmentError(
      environment2,
      Object.keys(environments ?? {})
    );
  }
  return {
    ...DEFAULTS,
    ...definedOnly(base),
    ...definedOnly(environment2 ? environments?.[environment2] ?? {} : {}),
    ...fromEnvironment(),
    ...definedOnly(overrides)
  };
}
async function availableEnvironments(cwd = process.cwd()) {
  return Object.keys((await loadConfigFile(cwd)).environments ?? {});
}
async function loadConfigFile(cwd) {
  for (const filename of CONFIG_FILES) {
    const path = (0, import_node_path.resolve)(cwd, filename);
    if (!(0, import_node_fs.existsSync)(path)) continue;
    const module2 = await importModule(path);
    return module2.default ?? module2;
  }
  return {};
}
function fromEnvironment() {
  return definedOnly({
    schema: process.env.SURREAL_SCHEMA,
    url: process.env.SURREAL_URL,
    namespace: process.env.SURREAL_NAMESPACE,
    database: process.env.SURREAL_DATABASE,
    username: process.env.SURREAL_USERNAME,
    password: process.env.SURREAL_PASSWORD
  });
}
function definedOnly(source) {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== void 0)
  );
}
async function importModule(path) {
  const url = `${(0, import_node_url.pathToFileURL)(path).href}?t=${Date.now()}`;
  if (!(0, import_node_fs.existsSync)(path)) {
    throw new Error(`No such file: ${path}`);
  }
  try {
    return await import(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (path.endsWith(".ts") && /Unknown file extension/.test(message)) {
      throw new Error(
        `Could not import ${path}.
Importing TypeScript directly needs Bun, or Node 22.6+ with --experimental-strip-types. Alternatively point at a compiled .js file.`
      );
    }
    throw new Error(`Could not import ${path}: ${message}`);
  }
}

// src/cli/output.ts
var enabled = process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== "dumb";
function paint(code, text) {
  return enabled ? `\x1B[${code}m${text}\x1B[0m` : text;
}
var style = {
  bold: (text) => paint(1, text),
  dim: (text) => paint(2, text),
  red: (text) => paint(31, text),
  green: (text) => paint(32, text),
  yellow: (text) => paint(33, text),
  blue: (text) => paint(34, text),
  cyan: (text) => paint(36, text)
};
function info(message) {
  console.log(message);
}
function success(message) {
  console.log(`${style.green("\u2714")} ${message}`);
}
function warn(message) {
  console.log(`${style.yellow("!")} ${message}`);
}
function fail(message) {
  console.error(`${style.red("\u2716")} ${message}`);
}
function printStatements(statements) {
  for (const statement of statements) {
    console.log(
      statement.startsWith("--") ? style.dim(statement) : style.cyan(statement)
    );
  }
}

// src/cli/schema.ts
var import_node_path2 = require("path");
async function loadDefinitions(path) {
  const module2 = await importModule((0, import_node_path2.resolve)(process.cwd(), path));
  const found = [];
  for (const value of Object.values(module2)) {
    collect3(value, found);
  }
  if (!found.length) {
    throw new Error(
      `${path} exports no table, edge or database definitions.
Export them individually, or as a default-exported object.`
    );
  }
  return found;
}
function collect3(value, into) {
  if (isDefinition(value)) {
    if (!into.includes(value)) into.push(value);
    return;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const nested of Object.values(value)) collect3(nested, into);
    return;
  }
  if (Array.isArray(value)) {
    for (const nested of value) collect3(nested, into);
  }
}
function isDefinition(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  const isTable = typeof candidate.tb === "string" && "fields" in candidate;
  const isEntity = typeof candidate.kind === "string" && typeof candidate.define === "function";
  return isTable || isEntity;
}

// src/cli/index.ts
var USAGE = `
${style.bold("surqlize")} \u2014 schema migrations for SurrealDB

${style.bold("Usage")}
  surqlize <command> [options]

${style.bold("Commands")}
  init        Create a schema file and a config file
  plan        Show what would change, without changing it
  migrate     Apply the schema to the database
  status      List the migrations that have been applied
  rollback    Undo the most recent migration
  validate    Load the schema and report what it declares, without connecting
  config      Show the settings in force, and the environments available

${style.bold("Options")}
  -u, --url <url>              SurrealDB address
  -n, --namespace <name>       Namespace
  -d, --database <name>        Database
  -U, --username <name>        Username
  -p, --password <pass>        Password
  -s, --schema <path>          Path to the schema module
  -e, --env <name>             Use a named environment from the config file
      --remove-missing         Drop tables and fields the schema no longer declares
      --yes                    Do not ask for confirmation
  -h, --help                   Show this message

Settings are read from surqlize.config.ts, then SURREAL_* environment
variables, then these flags.
`.trim();
var OPTIONS = {
  url: { type: "string", short: "u" },
  namespace: { type: "string", short: "n" },
  database: { type: "string", short: "d" },
  username: { type: "string", short: "U" },
  password: { type: "string", short: "p" },
  schema: { type: "string", short: "s" },
  env: { type: "string", short: "e" },
  level: { type: "string" },
  output: { type: "string", short: "o" },
  stdout: { type: "boolean" },
  "remove-missing": { type: "boolean" },
  yes: { type: "boolean" },
  help: { type: "boolean", short: "h" }
};
async function run(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = (0, import_node_util.parseArgs)({
      args: argv,
      options: OPTIONS,
      allowPositionals: true
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const command = parsed.positionals[0];
  const flags = parsed.values;
  if (flags.help || !command) {
    info(USAGE);
    return flags.help ? 0 : 1;
  }
  try {
    return await dispatch(command, flags);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
async function dispatch(command, flags) {
  const overrides = {
    url: flags.url,
    namespace: flags.namespace,
    database: flags.database,
    username: flags.username,
    password: flags.password,
    schema: flags.schema
  };
  const environment2 = flags.env;
  const options = {
    removeMissing: flags["remove-missing"] === true,
    assumeYes: flags.yes === true
  };
  switch (command) {
    case "init":
      return initCommand();
    case "config":
      return configCommand(
        await loadConfig(overrides, process.cwd(), environment2),
        environment2
      );
    case "validate":
      return validateCommand(
        await loadConfig(overrides, process.cwd(), environment2)
      );
    case "plan":
    case "diff":
      return planCommand(
        await loadConfig(overrides, process.cwd(), environment2),
        options
      );
    case "migrate":
      return migrateCommand(
        await loadConfig(overrides, process.cwd(), environment2),
        options
      );
    case "status":
      return statusCommand(
        await loadConfig(overrides, process.cwd(), environment2)
      );
    case "rollback":
      return rollbackCommand(
        await loadConfig(overrides, process.cwd(), environment2),
        options
      );
    default:
      fail(`Unknown command: ${command}`);
      info(USAGE);
      return 1;
  }
}
var CONNECT_TIMEOUT_MS = 1e4;
async function withTimeout(work, ms, message) {
  let timer;
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function names(definitions) {
  return definitions.map(
    (definition) => "tb" in definition ? definition.tb : definition.name
  );
}
async function connect(config) {
  const surreal = new import_surrealdb7.Surreal();
  try {
    await withTimeout(
      surreal.connect(config.url, { reconnect: false }).catch((error) => {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not connect to ${config.url}: ${reason}`, {
          cause: error
        });
      }),
      CONNECT_TIMEOUT_MS,
      `Could not reach ${config.url} within ${CONNECT_TIMEOUT_MS / 1e3}s.`
    );
    await surreal.signin({
      username: config.username,
      password: config.password
    });
    await surreal.use({
      namespace: config.namespace,
      database: config.database
    });
  } catch (error) {
    await surreal.close().catch(() => {
    });
    throw error;
  }
  return surreal;
}
async function withSchema(config, body) {
  const definitions = await loadDefinitions(config.schema);
  const surreal = await connect(config);
  try {
    return await body(surreal, definitions);
  } finally {
    await surreal.close();
  }
}
async function initCommand() {
  const files = [
    ["schema.ts", SCHEMA_TEMPLATE],
    ["surqlize.config.ts", CONFIG_TEMPLATE]
  ];
  for (const [name, contents] of files) {
    if ((0, import_node_fs2.existsSync)(name)) {
      warn(`${name} already exists \u2014 leaving it alone`);
      continue;
    }
    await (0, import_promises.writeFile)(name, contents, "utf-8");
    success(`Created ${name}`);
  }
  info("");
  info(
    `Next: edit ${style.bold("schema.ts")}, then run ${style.bold("surqlize plan")}`
  );
  return 0;
}
async function validateCommand(config) {
  const definitions = await loadDefinitions(config.schema);
  const tables2 = definitions.filter((d) => "tb" in d);
  const entities = definitions.filter((d) => "kind" in d);
  success(`${config.schema} is valid`);
  info(`  Tables and edges: ${names(tables2).join(", ") || "none"}`);
  if (entities.length)
    info(`  Other definitions: ${names(entities).join(", ")}`);
  return 0;
}
async function configCommand(config, environment2) {
  if (environment2) success(`Environment: ${environment2}`);
  for (const [key, value] of Object.entries(config)) {
    info(`  ${key.padEnd(10)} ${key === "password" ? "********" : value}`);
  }
  const environments = await availableEnvironments();
  info(
    environments.length ? `
  Environments: ${environments.join(", ")}` : "\n  No environments defined"
  );
  return 0;
}
async function planCommand(config, options) {
  return withSchema(config, async (surreal, definitions) => {
    const pending = await plan(surreal, definitions, options);
    if (!pending.hasChanges) {
      success("The database matches the schema \u2014 nothing to do");
      return 0;
    }
    info(style.bold(`${pending.changes.length} change(s):`));
    for (const change of pending.changes) {
      info(`  ${style.dim(change.kind)} ${change.target}`);
    }
    info("");
    info(style.bold("Statements:"));
    printStatements(pending.display);
    return 0;
  });
}
async function migrateCommand(config, options) {
  return withSchema(config, async (surreal, definitions) => {
    const pending = await plan(surreal, definitions, options);
    if (!pending.hasChanges) {
      success("The database matches the schema \u2014 nothing to do");
      return 0;
    }
    info(style.bold("Statements to apply:"));
    printStatements(pending.display);
    info("");
    if (options.removeMissing && !options.assumeYes) {
      const destructive = pending.changes.filter(
        (c) => c.kind.endsWith("remove")
      );
      if (destructive.length && !await confirm(destructive.length)) {
        warn("Cancelled");
        return 1;
      }
    }
    const result = await migrate(surreal, definitions, options);
    success(`Applied ${result?.up.length ?? 0} statement(s)`);
    return 0;
  });
}
async function statusCommand(config) {
  const surreal = await connect(config);
  try {
    const history = await applied(surreal);
    if (!history.length) {
      info("No migrations have been applied");
      return 0;
    }
    info(style.bold(`${history.length} migration(s):`));
    for (const migration of history) {
      info(
        `  ${style.dim(migration.appliedAt)}  ${migration.up.length} statement(s)  ${style.dim(migration.checksum)}`
      );
    }
    return 0;
  } finally {
    await surreal.close();
  }
}
async function rollbackCommand(config, options) {
  const surreal = await connect(config);
  try {
    const history = await applied(surreal);
    const last = history.at(-1);
    if (!last) {
      warn("No migrations to roll back");
      return 0;
    }
    assertRollbackable(last);
    info(style.bold("Statements to apply:"));
    printStatements(last.down);
    info("");
    if (!options.assumeYes && !await confirm(last.down.length)) {
      warn("Cancelled");
      return 1;
    }
    await rollback(surreal);
    success("Rolled back");
    return 0;
  } finally {
    await surreal.close();
  }
}
async function confirm(count) {
  if (!process.stdin.isTTY) {
    fail("Refusing to continue without a terminal to confirm on. Pass --yes.");
    return false;
  }
  process.stdout.write(
    `${style.yellow("!")} ${count} statement(s) will remove things. Continue? [y/N] `
  );
  const answer = await new Promise((resolve3) => {
    process.stdin.once("data", (data) => resolve3(data.toString().trim()));
  });
  return /^y(es)?$/i.test(answer);
}
var SCHEMA_TEMPLATE = `/**
 * Your database schema.
 *
 * Every table and edge exported here is one Surqlize will manage. Run
 * \`surqlize plan\` to see what it would change, then \`surqlize migrate\` to apply it.
 */
import { expr, t, table } from "surqlize";

export const user = table("user", {
  name: t.string().assert("string::len($value) > 0"),
  email: t.string().assert("string::is_email($value)"),
  createdAt: t.date().default(expr("time::now()")).readonly(),
})
  .index("email_idx", { fields: ["email"], unique: true });
`;
var CONFIG_TEMPLATE = `/**
 * Where Surqlize connects, and which file describes the schema.
 *
 * Add an \`environments\` block to describe more than one deployment, then
 * select one with \`--env <name>\`.
 */
export default {
  schema: "./schema.ts",

  url: "ws://localhost:8000",
  namespace: "test",
  database: "test",
  username: "root",
  password: "root",
};
`;

// src/cli.ts
run().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
