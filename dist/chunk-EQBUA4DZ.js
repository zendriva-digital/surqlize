import {
  __export
} from "./chunk-MLKGABMK.js";

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
var DuplicateSurrealError = class extends OrmError {
  constructor(options) {
    super(
      [
        "Query subjects could not be encoded: this looks like more than one copy of the `surrealdb` package is installed.",
        "The connection passed to Surqlize comes from a different `surrealdb` install than the one Surqlize imports, so the SDK's `instanceof` checks fail and subjects such as `Table` are sent as empty objects.",
        "To fix it, make sure a single copy of `surrealdb` is resolved: run `npm ls surrealdb` (or `bun pm ls --all`), dedupe or add an `overrides`/`resolutions` entry so one version is used, and avoid `file:` dependencies that bring their own `node_modules`.",
        "If the project is symlinked and TypeScript reports `Property '#private' in type 'Surreal' refers to a different member`, set `preserveSymlinks: true`."
      ].join(" "),
      options
    );
    this.name = "DuplicateSurrealError";
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

// src/utils/display.ts
import { toSurqlString } from "surrealdb";

// src/utils/model.ts
var modelClasses = /* @__PURE__ */ new WeakSet();
function registerModelClass(cls) {
  modelClasses.add(cls);
}
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
var inlineValue = (value) => typeof value === "string" ? JSON.stringify(value) : toSurqlString(value);

// src/types/classes.ts
import {
  Decimal,
  Duration,
  Geometry,
  GeometryPoint,
  Range,
  RecordId,
  Uuid
} from "surrealdb";
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
function expr(sql) {
  return new SurqlExpression(sql);
}
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
  was(...names) {
    return patchDdl(this, (d) => {
      d.previousNames = [...d.previousNames ?? [], ...names];
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
    return value instanceof Duration;
  }
  /**
   * Return an existing SurrealDB `Duration` instance.
   *
   * @throws {TypeParseError} If `value` is not a `Duration`.
   */
  parse(value) {
    if (value instanceof Duration) return value;
    throw new TypeParseError(this.name, this.expected, value);
  }
};
var PointType = class extends AbstractType {
  name = "point";
  expected = "GeometryPoint";
  validate(value) {
    return value instanceof GeometryPoint;
  }
};
var UuidType = class extends AbstractType {
  name = "uuid";
  expected = "Uuid";
  validate(value) {
    return value instanceof Uuid;
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
    if (!(value instanceof RecordId)) return false;
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
    if (this._tb === "*") return value.every((v) => v instanceof RecordId);
    return value.every(
      (v) => v instanceof RecordId && String(v.table) === this._tb
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
    return value instanceof Decimal || typeof value === "number";
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
    return value instanceof Geometry;
  }
};
var RangeType = class extends AbstractType {
  name = "range";
  expected = "Range";
  validate(value) {
    return value instanceof Range;
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

// src/utils/workable.ts
import { escapeIdent } from "surrealdb";

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
  const record2 = value;
  const schema = type.schema;
  for (const key in schema) {
    const field = schema[key];
    const given = record2[key];
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
function checkArgs(params, args) {
  const issues = [];
  if (args.length > params.length) {
    report(
      issues,
      "",
      `at most ${params.length} argument${params.length === 1 ? "" : "s"}`,
      `${args.length} arguments`
    );
  }
  params.forEach((param, i) => {
    collect(param, args[i], `[${i}]`, issues);
  });
  return issues;
}
function checkValue(type, value) {
  const issues = [];
  collect(type, value, "", issues);
  return issues;
}
function resolve(schema, path) {
  let type = schema;
  for (const segment of path.split(".")) {
    while (type instanceof OptionType) type = type.schema;
    if (!(type instanceof ObjectType)) return void 0;
    const next = type.schema[segment];
    if (next === void 0) return void 0;
    type = next;
  }
  return type;
}
var isOperator = (value) => typeof value === "object" && value !== null && ("+=" in value || "-=" in value);
function collectOperand(type, operand, path, issues) {
  if (isDeferred(operand)) return;
  let base = type;
  while (base instanceof OptionType) base = base.schema;
  if (base instanceof ArrayType && !Array.isArray(base.schema)) {
    const member = base.schema;
    collect(Array.isArray(operand) ? base : member, operand, path, issues);
  } else if (base instanceof SetType) {
    const member = base.schema;
    collect(operand instanceof Set ? base : member, operand, path, issues);
  } else if (base.name === "number") {
    collect(base, operand, path, issues);
  }
}
function checkSet(schema, data, computed = []) {
  const issues = [];
  for (const [key, raw] of Object.entries(data)) {
    const type = resolve(schema, key);
    if (computed.includes(key.split(".")[0])) {
      if (raw !== void 0) report(issues, key, READ_ONLY, raw);
    } else if (!type || isDeferred(raw)) {
    } else if (isOperator(raw)) {
      collectOperand(type, raw["+="] ?? raw["-="], key, issues);
    } else if (raw !== void 0 || !hasDefault(type)) {
      collect(type, raw, key, issues);
    }
  }
  return issues;
}
function checkRequired(schema, written, options) {
  const issues = [];
  const fields = schema.schema;
  for (const key in fields) {
    const field = fields[key];
    if (written.has(key) || options.implicit?.includes(key) || options.computed?.includes(key) || options.fills && hasDefault(field) || field.validate(void 0))
      continue;
    issues.push({
      path: key,
      expected: expectedOf(field),
      received: void 0,
      message: `${key}: required field is not set`
    });
  }
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

// src/query/subject.ts
function resolveSubjectSchema(orm, tb) {
  const tables2 = orm.tables;
  if (typeof tb === "string") return tables2[tb].schema;
  return mergeSchemas(tb.map((name) => tables2[name].schema));
}
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
  const names = typeof tb === "string" ? [tb] : Array.isArray(tb) ? tb : [];
  const schemas = [];
  for (const name of names) {
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
        return escapeIdent(key);
      }
      return `${parent}${path}`;
    },
    [__type]: type,
    [__path]: true
  };
}
function sanitizeWorkable(workable) {
  const display = workable[__display].bind(workable);
  return {
    [__ctx]: workable[__ctx],
    [__display]: display,
    [__type]: workable[__type]
  };
}
function isFieldPath(workable) {
  return workable[__path] === true;
}
function isWorkable(value) {
  return (typeof value === "object" || typeof value === "function") && value !== null && value[__ctx] !== void 0;
}

// src/query/utils.ts
import { escapeIdent as escapeIdent2 } from "surrealdb";

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
function literalWorkable(ctx, type, sql) {
  return {
    [__ctx]: ctx,
    [__type]: type,
    [__display]: () => sql
  };
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
function checkBound(bound, label) {
  if (!Number.isInteger(bound) || bound < 1 || bound > MAX_RECURSION_DEPTH) {
    throw new OrmError(
      `Recursion ${label} must be an integer between 1 and ${MAX_RECURSION_DEPTH}, received ${bound}`
    );
  }
  return bound;
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
  const bound = /* @__PURE__ */ new Map();
  return new Proxy(table, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return workable[prop];
      }
      if (prop in target) {
        let fn = bound.get(prop);
        if (fn === void 0) {
          const unbound = target[prop];
          if (typeof unbound !== "function") {
            throw new OrmError(`Property ${prop} is not a function`);
          }
          fn = Object.assign(unbound.bind(workable), {
            valueOf: () => actionable(workableGet(workable, prop))
          });
          bound.set(prop, fn);
        }
        return fn;
      }
      return actionable(workableGet(workable, prop));
    }
  });
}

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

// src/query/utils.ts
function andWhere(filter, condition) {
  return filter ? joiningFilter(condition[__ctx], "AND", filter, condition) : condition;
}
function escapeIdiomPath(path) {
  return path.split(".").map(escapeIdent2).join(".");
}
function processSetOperators(data) {
  const processedData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && ("+=" in value || "-=" in value)) {
      processedData[key] = value;
    } else {
      processedData[key] = value;
    }
  }
  return processedData;
}
function generateSetAssignments(data, ctx) {
  const assignments = [];
  for (const [key, value] of Object.entries(data)) {
    const field = escapeIdiomPath(key);
    if (value && typeof value === "object" && "+=" in value) {
      assignments.push(
        `${field} += ${ctx.var(value["+="])}`
      );
    } else if (value && typeof value === "object" && "-=" in value) {
      assignments.push(
        `${field} -= ${ctx.var(value["-="])}`
      );
    } else {
      assignments.push(`${field} = ${renderValue(value, ctx)}`);
    }
  }
  return assignments;
}
function renderValue(value, ctx) {
  return value instanceof SurqlExpression ? value.sql : ctx.var(value);
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
function edge(from, tb, to, fields) {
  return new EdgeSchema(from, tb, to, fields);
}

export {
  OrmError,
  ValidationError,
  DuplicateSurrealError,
  TypeParseError,
  registerModelClass,
  displayContext,
  inlineValue,
  SurqlExpression,
  expr,
  AbstractType,
  LiteralType,
  StringType,
  NumberType,
  BigIntType,
  BoolType,
  NullType,
  NoneType,
  NeverType,
  DateType,
  DurationType,
  PointType,
  UuidType,
  OptionType,
  RecordType,
  GraphType,
  ObjectType,
  ArrayType,
  UnionType,
  IntType,
  FloatType,
  DecimalType,
  BytesType,
  GeometryType,
  RangeType,
  AnyType,
  SetType,
  resolveSubjectSchema,
  __display,
  __type,
  __ctx,
  __fields,
  intoWorkable,
  resolveAccessType,
  sanitizeWorkable,
  isFieldPath,
  isWorkable,
  checkRecord,
  checkArgs,
  checkValue,
  checkSet,
  checkRequired,
  throwIfInvalid,
  safeParseWith,
  t_exports,
  inheritableIntoWorkable,
  andWhere,
  escapeIdiomPath,
  processSetOperators,
  generateSetAssignments,
  renderValue,
  ANY,
  matchRef,
  literalWorkable,
  actionable,
  joiningFilter,
  prefixedFilter,
  patchTableDdl,
  EdgeSchema,
  edge
};
