"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
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

// src/error.ts
var OrmError, ValidationError, DuplicateSurrealError, TypeParseError;
var init_error = __esm({
  "src/error.ts"() {
    "use strict";
    OrmError = class extends Error {
    };
    ValidationError = class extends OrmError {
      constructor(issues, table2, subject) {
        const where2 = subject ?? (table2 === void 0 ? "data" : `data for table "${table2}"`);
        const count2 = `${issues.length} validation error${issues.length === 1 ? "" : "s"}`;
        super(
          `Invalid ${where2}: ${count2}
${issues.map((i) => `  - ${i.message}`).join("\n")}`
        );
        this.issues = issues;
        this.table = table2;
        this.name = "ValidationError";
      }
    };
    DuplicateSurrealError = class extends OrmError {
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
    TypeParseError = class extends Error {
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
  }
});

// src/utils/model.ts
function registerModelClass(cls) {
  modelClasses.add(cls);
}
function toPlainModel(value2) {
  if (Array.isArray(value2)) return value2.map(toPlainModel);
  if (typeof value2 === "object" && value2 !== null && modelClasses.has(value2.constructor)) {
    return { ...value2 };
  }
  return value2;
}
var modelClasses;
var init_model = __esm({
  "src/utils/model.ts"() {
    "use strict";
    modelClasses = /* @__PURE__ */ new WeakSet();
  }
});

// src/utils/display.ts
function createVariableStore() {
  const variables = {};
  let count2 = 0;
  const v = (value2) => {
    let name = `_v${count2++}`;
    while (name in variables) name = `_v${count2++}`;
    variables[name] = toPlainModel(value2);
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
var import_surrealdb, inlineValue;
var init_display = __esm({
  "src/utils/display.ts"() {
    "use strict";
    import_surrealdb = require("surrealdb");
    init_model();
    inlineValue = (value2) => typeof value2 === "string" ? JSON.stringify(value2) : (0, import_surrealdb.toSurqlString)(value2);
  }
});

// src/types/classes.ts
function pathSegment(prop) {
  if (typeof prop === "string" && IDENTIFIER.test(prop)) return `.${prop}`;
  return `[${JSON.stringify(prop)}]`;
}
function expr(sql) {
  return new SurqlExpression(sql);
}
function fieldDefault(value2, always) {
  if (typeof value2 === "function") return void 0;
  if (value2 instanceof SurqlExpression) {
    return { value: value2.sql, always, expression: true };
  }
  return { value: value2, always };
}
function patchDdl(type, patch2) {
  const next = Object.assign(
    Object.create(Object.getPrototypeOf(type)),
    type
  );
  const draft = { ...type.ddl };
  patch2(draft);
  next.ddl = draft;
  return next;
}
var import_surrealdb2, IDENTIFIER, SurqlExpression, AbstractType, LiteralType, StringType, NumberType, BigIntType, BoolType, NullType, NoneType, NeverType, DateType, DurationType, PointType, UuidType, OptionType, RecordType, GraphType, ObjectType, ArrayType, UnionType, IntType, FloatType, DecimalType, BytesType, GeometryType, RangeType, AnyType, SetType;
var init_classes = __esm({
  "src/types/classes.ts"() {
    "use strict";
    import_surrealdb2 = require("surrealdb");
    init_error();
    IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
    SurqlExpression = class {
      constructor(sql) {
        this.sql = sql;
      }
    };
    AbstractType = class {
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
      default(value2) {
        const copy = patchDdl(this, (d) => {
          d.default = fieldDefault(value2, false);
          if (d.default === void 0) delete d.default;
        });
        copy._default = value2;
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
      parse(value2) {
        if (!this.validate(value2))
          throw new TypeParseError(this.name, this.expected, value2);
        return value2;
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
      defaultAlways(value2) {
        return patchDdl(this, (d) => {
          d.default = fieldDefault(value2, true);
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
      comment(text2) {
        return patchDdl(this, (d) => {
          d.comment = text2;
        });
      }
      /** Declare the field a `REFERENCE`, optionally naming the referenced table. */
      references(table2) {
        return patchDdl(this, (d) => {
          d.reference = { ...d.reference, table: table2 };
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
    LiteralType = class extends AbstractType {
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
      validate(value2) {
        return value2 === this.value;
      }
    };
    StringType = class extends AbstractType {
      name = "string";
      expected = "string";
      validate(value2) {
        return typeof value2 === "string";
      }
    };
    NumberType = class extends AbstractType {
      name = "number";
      expected = "number";
      validate(value2) {
        return typeof value2 === "number";
      }
    };
    BigIntType = class extends AbstractType {
      name = "bigint";
      expected = "bigint";
      validate(value2) {
        return typeof value2 === "bigint";
      }
      /**
       * Return `value` as a `bigint`. A safe integer the SDK decoded as a `number`
       * (a small value, such as a date near the epoch) is converted, so the result
       * always has the declared type.
       *
       * @throws {TypeParseError} If `value` is neither a `bigint` nor a safe integer.
       */
      parse(value2) {
        if (typeof value2 === "number" && Number.isSafeInteger(value2)) {
          return BigInt(value2);
        }
        return super.parse(value2);
      }
    };
    BoolType = class extends AbstractType {
      name = "bool";
      expected = "boolean";
      validate(value2) {
        return typeof value2 === "boolean";
      }
    };
    NullType = class extends AbstractType {
      name = "null";
      expected = "null";
      validate(value2) {
        return value2 === null;
      }
    };
    NoneType = class extends AbstractType {
      name = "none";
      expected = "undefined";
      validate(value2) {
        return value2 === void 0;
      }
    };
    NeverType = class extends AbstractType {
      name = "never";
      expected = "never";
      validate(_) {
        return arguments.length === 0;
      }
    };
    DateType = class extends AbstractType {
      name = "date";
      expected = "Date";
      validate(value2) {
        if (value2 instanceof Date) return true;
        if (value2 && typeof value2 === "object" && "toDate" in value2 && typeof value2.toDate === "function") {
          return true;
        }
        return false;
      }
      /**
       * Parse a value into a `Date`, converting SurrealDB `DateTime` objects.
       *
       * @throws {TypeParseError} If `value` is not a `Date` or `DateTime`.
       */
      parse(value2) {
        if (value2 instanceof Date) return value2;
        if (value2 && typeof value2 === "object" && "toDate" in value2 && typeof value2.toDate === "function") {
          return value2.toDate();
        }
        throw new TypeParseError(this.name, this.expected, value2);
      }
    };
    DurationType = class extends AbstractType {
      name = "duration";
      expected = "Duration";
      validate(value2) {
        return value2 instanceof import_surrealdb2.Duration;
      }
      /**
       * Return an existing SurrealDB `Duration` instance.
       *
       * @throws {TypeParseError} If `value` is not a `Duration`.
       */
      parse(value2) {
        if (value2 instanceof import_surrealdb2.Duration) return value2;
        throw new TypeParseError(this.name, this.expected, value2);
      }
    };
    PointType = class extends AbstractType {
      name = "point";
      expected = "GeometryPoint";
      validate(value2) {
        return value2 instanceof import_surrealdb2.GeometryPoint;
      }
    };
    UuidType = class extends AbstractType {
      name = "uuid";
      expected = "Uuid";
      validate(value2) {
        return value2 instanceof import_surrealdb2.Uuid;
      }
    };
    OptionType = class extends AbstractType {
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
      validate(value2) {
        return value2 === void 0 || this.schema.validate(value2);
      }
      /**
       * Parse `value` against the inner schema, returning `undefined` when the
       * value is absent. Delegates to the inner type so conversions (e.g. dates)
       * are applied.
       *
       * @throws {TypeParseError} If `value` is defined but fails the inner schema.
       */
      parse(value2) {
        if (value2 === void 0) return void 0;
        return this.schema.parse(value2);
      }
    };
    RecordType = class extends AbstractType {
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
      validate(value2) {
        if (!(value2 instanceof import_surrealdb2.RecordId)) return false;
        if (this._tb === void 0) return true;
        const table2 = String(value2.table);
        return Array.isArray(this._tb) ? this._tb.some((t) => t === table2) : this._tb === table2;
      }
    };
    GraphType = class extends AbstractType {
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
      validate(value2) {
        if (!Array.isArray(value2)) return false;
        if (this._tb === "*") return value2.every((v) => v instanceof import_surrealdb2.RecordId);
        return value2.every(
          (v) => v instanceof import_surrealdb2.RecordId && String(v.table) === this._tb
        );
      }
    };
    ObjectType = class extends AbstractType {
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
      validate(value2) {
        if (typeof value2 !== "object" || value2 === null) return false;
        for (const key in this.schema) {
          if (!this.schema[key].validate(value2[key]))
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
      parse(value2) {
        if (typeof value2 !== "object" || value2 === null)
          throw new TypeParseError(this.name, this.expected, value2);
        const source = value2;
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
    ArrayType = class extends AbstractType {
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
      validate(value2) {
        if (!Array.isArray(value2)) return false;
        if (!this.withinBound(value2.length)) return false;
        const schema = this.schema;
        if (Array.isArray(schema)) {
          return schema.length === value2.length && schema.every((item, i) => item.validate(value2[i]));
        }
        return value2.every((item) => schema.validate(item));
      }
      /**
       * Validate every element of `value` against the array or tuple schema,
       * returning a new array of the parsed (and possibly converted) elements.
       *
       * @throws {TypeParseError} If `value` is not an array, has the wrong length
       *   (tuple), exceeds the declared maximum, or an element fails validation.
       */
      parse(value2) {
        if (!Array.isArray(value2))
          throw new TypeParseError(this.name, this.expected, value2);
        if (!this.withinBound(value2.length))
          throw new TypeParseError(this.name, this.expected, value2);
        const schema = this.schema;
        if (Array.isArray(schema)) {
          if (schema.length !== value2.length)
            throw new TypeParseError(this.name, this.expected, value2);
          return schema.map((item, i) => item.parse(value2[i]));
        }
        return value2.map((item) => schema.parse(item));
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
    UnionType = class extends AbstractType {
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
      validate(value2) {
        for (const schema of this.schema) {
          if (schema.validate(value2)) return true;
        }
        return false;
      }
      /**
       * Parse `value` against the first matching member, delegating so that member
       * conversions (e.g. dates) are applied.
       *
       * @throws {TypeParseError} If `value` matches none of the members.
       */
      parse(value2) {
        for (const schema of this.schema) {
          if (schema.validate(value2)) return schema.parse(value2);
        }
        throw new TypeParseError(this.name, this.expected, value2);
      }
    };
    IntType = class extends NumberType {
      validate(value2) {
        return typeof value2 === "number" && Number.isInteger(value2);
      }
    };
    FloatType = class extends NumberType {
    };
    DecimalType = class extends AbstractType {
      // Keep the number function family; see the note above.
      name = "number";
      expected = "Decimal | number";
      validate(value2) {
        return value2 instanceof import_surrealdb2.Decimal || typeof value2 === "number";
      }
    };
    BytesType = class extends AbstractType {
      name = "bytes";
      expected = "Uint8Array";
      validate(value2) {
        return value2 instanceof Uint8Array;
      }
      /** Returns a `Uint8Array` over the bytes, without copying an `ArrayBuffer`. */
      parse(value2) {
        if (value2 instanceof ArrayBuffer) return new Uint8Array(value2);
        return super.parse(value2);
      }
    };
    GeometryType = class extends AbstractType {
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
      validate(value2) {
        return value2 instanceof import_surrealdb2.Geometry;
      }
    };
    RangeType = class extends AbstractType {
      name = "range";
      expected = "Range";
      validate(value2) {
        return value2 instanceof import_surrealdb2.Range;
      }
    };
    AnyType = class extends AbstractType {
      name = "any";
      expected = "any";
      validate(_value) {
        return true;
      }
    };
    SetType = class extends AbstractType {
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
      validate(value2) {
        if (!(value2 instanceof Set)) return false;
        if (this._max !== void 0 && value2.size > this._max) return false;
        for (const member of value2)
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
      parse(value2) {
        if (!(value2 instanceof Set))
          throw new TypeParseError(this.name, this.expected, value2);
        if (this._max !== void 0 && value2.size > this._max)
          throw new TypeParseError(this.name, this.expected, value2);
        const parsed = /* @__PURE__ */ new Set();
        for (const member of value2) parsed.add(this._schema.parse(member));
        return parsed;
      }
    };
  }
});

// src/query/subject.ts
function resolveSubjectSchema(orm2, tb) {
  const tables2 = orm2.tables;
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
var init_subject = __esm({
  "src/query/subject.ts"() {
    "use strict";
    init_types();
  }
});

// src/utils/workable.ts
function intoWorkable(ctx, type, value2) {
  if (isWorkable(value2)) {
    return value2;
  }
  return {
    [__ctx]: ctx,
    [__display](ctx2) {
      return ctx2.var(value2);
    },
    [__type]: type
  };
}
function optional(type) {
  return type instanceof OptionType ? type : new OptionType(type);
}
function linkedSchema(orm2, tb) {
  const names = typeof tb === "string" ? [tb] : Array.isArray(tb) ? tb : [];
  const schemas = [];
  for (const name of names) {
    const schema = orm2.tables[name]?.schema;
    if (schema) schemas.push(schema);
  }
  if (schemas.length === 0) return void 0;
  return schemas.length === 1 ? schemas[0] : mergeSchemas(schemas);
}
function resolveAccessType(orm2, type) {
  if (type instanceof OptionType) {
    const inner = resolveAccessType(orm2, type.schema);
    return { target: inner.target, rewrap: (f) => optional(inner.rewrap(f)) };
  }
  if (type instanceof GraphType && type.tb !== "*") {
    const schema = orm2.tables[type.tb]?.schema;
    if (schema) return { target: schema, rewrap: (f) => new ArrayType(f) };
  }
  if (type instanceof RecordType) {
    const schema = linkedSchema(orm2, type.tb);
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
        return (0, import_surrealdb3.escapeIdent)(key);
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
function isWorkable(value2) {
  return (typeof value2 === "object" || typeof value2 === "function") && value2 !== null && value2[__ctx] !== void 0;
}
var import_surrealdb3, __display, __type, __ctx, __fields, __path;
var init_workable = __esm({
  "src/utils/workable.ts"() {
    "use strict";
    import_surrealdb3 = require("surrealdb");
    init_subject();
    init_types();
    __display = /* @__PURE__ */ Symbol("display");
    __type = /* @__PURE__ */ Symbol("type");
    __ctx = /* @__PURE__ */ Symbol("ctx");
    __fields = /* @__PURE__ */ Symbol("fields");
    __path = /* @__PURE__ */ Symbol("path");
  }
});

// src/validation.ts
function join(path, key) {
  if (typeof key === "number") return `${path}[${key}]`;
  if (!IDENT.test(key)) return `${path}[${JSON.stringify(key)}]`;
  return path === "" ? key : `${path}.${key}`;
}
function describe(value2) {
  if (value2 === void 0) return "undefined";
  if (value2 === null) return "null";
  if (typeof value2 === "string")
    return JSON.stringify(value2.length > 40 ? `${value2.slice(0, 40)}\u2026` : value2);
  if (typeof value2 !== "object") return String(value2);
  if (Array.isArray(value2)) return `array of ${value2.length}`;
  if (value2 instanceof Set) return `set of ${value2.size}`;
  const name = value2.constructor?.name;
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
  const where2 = path === "" ? "(root)" : path;
  issues.push({
    path: where2,
    expected,
    received,
    message: `${where2}: expected ${expected}, received ${describe(received)}`
  });
}
function mayBeMissing(field, key, options) {
  if (options?.mode === "update") return true;
  if (options?.mode === "create" && options.implicit?.includes(key))
    return true;
  return hasDefault(field) && (options?.fills ?? true);
}
function collectObject(type, value2, path, issues, options) {
  if (typeof value2 !== "object" || value2 === null || Array.isArray(value2)) {
    report(issues, path, "object", value2);
    return;
  }
  const record2 = value2;
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
function collectArray(type, value2, path, issues) {
  const schema = type.schema;
  if (!Array.isArray(value2)) {
    report(issues, path, expectedOf(type), value2);
  } else if (!Array.isArray(schema)) {
    value2.forEach((item, i) => {
      collect(schema, item, join(path, i), issues);
    });
  } else if (schema.length !== value2.length) {
    report(issues, path, expectedOf(type), value2);
  } else {
    schema.forEach((member, i) => {
      collect(member, value2[i], join(path, i), issues);
    });
  }
}
function collectSet(type, value2, path, issues) {
  if (!(value2 instanceof Set)) {
    report(issues, path, expectedOf(type), value2);
    return;
  }
  let i = 0;
  for (const member of value2) {
    collect(type.schema, member, join(path, i++), issues);
  }
  if (type.max !== void 0 && value2.size > type.max) {
    report(issues, path, `at most ${type.max} members`, value2);
  }
}
function collect(type, value2, path, issues, options) {
  if (isDeferred(value2)) return;
  if (type instanceof OptionType) {
    if (value2 !== void 0) collect(type.schema, value2, path, issues);
  } else if (type instanceof ObjectType) {
    collectObject(type, value2, path, issues, options);
  } else if (type instanceof ArrayType) {
    collectArray(type, value2, path, issues);
  } else if (type instanceof SetType) {
    collectSet(type, value2, path, issues);
  } else if (!type.validate(value2)) {
    report(issues, path, expectedOf(type), value2);
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
  params.forEach((param2, i) => {
    collect(param2, args[i], `[${i}]`, issues);
  });
  return issues;
}
function checkValue(type, value2) {
  const issues = [];
  collect(type, value2, "", issues);
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
function throwIfInvalid(issues, table2, subject) {
  if (issues.length > 0) throw new ValidationError(issues, table2, subject);
}
function safeParseWith(schema, data, mode, table2, implicit, computed) {
  const issues = checkRecord(schema, data, {
    mode,
    implicit,
    computed: mode === "row" ? [] : computed
  });
  return issues.length === 0 ? { success: true, data } : { success: false, error: new ValidationError(issues, table2) };
}
var IDENT, READ_ONLY, isDeferred, hasDefault, isOperator;
var init_validation = __esm({
  "src/validation.ts"() {
    "use strict";
    init_error();
    init_types();
    init_workable();
    IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
    READ_ONLY = "undefined (computed fields are read-only)";
    isDeferred = (value2) => value2 instanceof SurqlExpression || isWorkable(value2);
    hasDefault = (type) => type._default !== void 0;
    isOperator = (value2) => typeof value2 === "object" && value2 !== null && ("+=" in value2 || "-=" in value2);
  }
});

// src/standard-schema.ts
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
function installStandardSchema() {
  if (Object.hasOwn(AbstractType.prototype, "~standard")) return;
  Object.defineProperty(AbstractType.prototype, "~standard", {
    configurable: true,
    get() {
      return {
        version: 1,
        vendor: "surqlize",
        validate: (value2) => {
          const issues = checkValue(this, value2);
          return issues.length === 0 ? { value: value2 } : { issues: issues.map(toStandard) };
        }
      };
    }
  });
}
var SEGMENT, toStandard;
var init_standard_schema = __esm({
  "src/standard-schema.ts"() {
    "use strict";
    init_classes();
    init_validation();
    SEGMENT = /([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/g;
    toStandard = (issue) => ({
      // The message of an issue starts with its path, which a Standard Schema
      // issue carries separately.
      message: issue.message.slice(issue.path.length + 2),
      path: pathOf(issue.path)
    });
  }
});

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
function literal(value2) {
  return new LiteralType(value2);
}
function record(table2) {
  return new RecordType(table2);
}
var init_t = __esm({
  "src/types/t.ts"() {
    "use strict";
    init_standard_schema();
    init_classes();
    installStandardSchema();
  }
});

// src/types/index.ts
var init_types = __esm({
  "src/types/index.ts"() {
    "use strict";
    init_classes();
    init_t();
  }
});

// src/utils/inheritable.ts
function inheritableIntoWorkable(value2) {
  if (isWorkable(value2)) {
    return value2;
  }
  if (typeof value2 !== "object" || value2 === null) {
    throw new TypeParseError("inheritable", "object", value2);
  }
  if (Array.isArray(value2)) {
    const converted2 = value2.map(
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
    Object.entries(value2).map(([key, val2]) => [
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
var init_inheritable = __esm({
  "src/utils/inheritable.ts"() {
    "use strict";
    init_error();
    init_types();
    init_workable();
  }
});

// src/utils/traversal.ts
function traversableRow(row, fields) {
  return new Proxy(row, {
    get(target, prop) {
      if (prop === "extend") {
        return (extra) => {
          const merged = {};
          const row2 = target;
          for (const key of Object.keys(fields)) {
            merged[key] = row2[key];
          }
          Object.assign(merged, extra);
          return inheritableIntoWorkable(merged);
        };
      }
      if (typeof prop === "string" && TRAVERSAL_VERBS.has(prop)) {
        const idRecord = target.id;
        const verb = (...args) => idRecord[prop](
          ...args
        );
        if (prop in fields) {
          const field = target[prop];
          return new Proxy(verb, {
            get: (_verb, key) => key === "valueOf" ? () => field : field[key]
          });
        }
        return verb;
      }
      return target[prop];
    }
  });
}
var TRAVERSAL_VERBS;
var init_traversal = __esm({
  "src/utils/traversal.ts"() {
    "use strict";
    init_inheritable();
    TRAVERSAL_VERBS = /* @__PURE__ */ new Set([
      "out",
      "in",
      "both",
      "recurse",
      "collect",
      "shortest"
    ]);
  }
});

// src/utils/index.ts
var init_utils = __esm({
  "src/utils/index.ts"() {
    "use strict";
    init_display();
    init_traversal();
    init_workable();
  }
});

// src/functions/types/any.ts
var any_exports = {};
__export(any_exports, {
  functions: () => functions
});
var functions;
var init_any = __esm({
  "src/functions/types/any.ts"() {
    "use strict";
    init_utils();
    init_filters();
    functions = {
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
  }
});

// src/query/utils.ts
function andWhere(filter, condition) {
  return filter ? joiningFilter(condition[__ctx], "AND", filter, condition) : condition;
}
function escapeIdiomPath(path) {
  return path.split(".").map(import_surrealdb4.escapeIdent).join(".");
}
function processSetOperators(data) {
  const processedData = {};
  for (const [key, value2] of Object.entries(data)) {
    if (value2 && typeof value2 === "object" && ("+=" in value2 || "-=" in value2)) {
      processedData[key] = value2;
    } else {
      processedData[key] = value2;
    }
  }
  return processedData;
}
function generateSetAssignments(data, ctx) {
  const assignments = [];
  for (const [key, value2] of Object.entries(data)) {
    const field = escapeIdiomPath(key);
    if (value2 && typeof value2 === "object" && "+=" in value2) {
      assignments.push(
        `${field} += ${ctx.var(value2["+="])}`
      );
    } else if (value2 && typeof value2 === "object" && "-=" in value2) {
      assignments.push(
        `${field} -= ${ctx.var(value2["-="])}`
      );
    } else {
      assignments.push(`${field} = ${renderValue(value2, ctx)}`);
    }
  }
  return assignments;
}
function renderValue(value2, ctx) {
  return value2 instanceof SurqlExpression ? value2.sql : ctx.var(value2);
}
var import_surrealdb4;
var init_utils2 = __esm({
  "src/query/utils.ts"() {
    "use strict";
    import_surrealdb4 = require("surrealdb");
    init_filters();
    init_types();
    init_utils();
  }
});

// src/schema/traversal.ts
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
function isGraphSegmentSpec(value2) {
  return typeof value2 === "object" && value2 !== null && value2[GRAPH_SEGMENT] === true;
}
var ANY, GRAPH_SEGMENT;
var init_traversal2 = __esm({
  "src/schema/traversal.ts"() {
    "use strict";
    init_utils2();
    ANY = /* @__PURE__ */ Symbol("surqlize.graph.ANY");
    GRAPH_SEGMENT = /* @__PURE__ */ Symbol("surqlize.graph.segment");
  }
});

// src/functions/utils.ts
function databaseFunction(ctx, type, fn2, ...params) {
  return actionable({
    [__ctx]: ctx,
    [__type]: type,
    [__display](ctx2) {
      const vars = params.map((p) => p[__display](ctx2)).join(", ");
      return `${fn2}(${vars})`;
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
var MAX_RECURSION_DEPTH;
var init_utils3 = __esm({
  "src/functions/utils.ts"() {
    "use strict";
    init_error();
    init_traversal2();
    init_types();
    init_utils();
    init_actionable();
    MAX_RECURSION_DEPTH = 256;
  }
});

// src/functions/types/array.ts
var array_exports = {};
__export(array_exports, {
  KNN_METRICS: () => KNN_METRICS,
  functions: () => functions2,
  vectorFunctions: () => vectorFunctions
});
function elementType(arr) {
  const schema = arr.schema;
  return Array.isArray(schema) ? new UnionType(schema) : schema;
}
function positiveInteger(name, value2) {
  if (typeof value2 !== "number" || !Number.isSafeInteger(value2) || value2 < 1) {
    throw new OrmError(
      `knn() ${name} must be a positive integer, got ${String(value2)}`
    );
  }
  return value2;
}
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
var KNN_METRICS, ROW_PREFIX, vectorFunctions, functions2;
var init_array = __esm({
  "src/functions/types/array.ts"() {
    "use strict";
    init_error();
    init_types();
    init_utils();
    init_actionable();
    init_inheritable();
    init_filters();
    init_utils3();
    KNN_METRICS = [
      "EUCLIDEAN",
      "COSINE",
      "MANHATTAN",
      "CHEBYSHEV"
    ];
    ROW_PREFIX = "$this.";
    vectorFunctions = {
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
        const vector2 = intoWorkable(this[__ctx], t_exports.array(t_exports.number()), query);
        return knnFilter(this, vector2, operator);
      }
    };
    functions2 = {
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
  }
});

// src/functions/types/date.ts
var date_exports = {};
__export(date_exports, {
  functions: () => functions3
});
var functions3;
var init_date = __esm({
  "src/functions/types/date.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_utils3();
    functions3 = {
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
      timeCeil(duration3) {
        const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration3);
        return databaseFunction(this[__ctx], t_exports.date(), "time::ceil", this, val2);
      },
      timeFloor(duration3) {
        const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration3);
        return databaseFunction(this[__ctx], t_exports.date(), "time::floor", this, val2);
      },
      timeRound(duration3) {
        const val2 = intoWorkable(this[__ctx], t_exports.duration(), duration3);
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
  }
});

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
var functions4;
var init_graph = __esm({
  "src/functions/types/graph.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_filters();
    init_utils3();
    functions4 = {
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
  }
});

// src/functions/types/number.ts
var number_exports = {};
__export(number_exports, {
  functions: () => functions5
});
var functions5;
var init_number = __esm({
  "src/functions/types/number.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_utils3();
    functions5 = {
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
  }
});

// src/functions/types/option.ts
var option_exports = {};
__export(option_exports, {
  functions: () => functions6
});
var functions6;
var init_option = __esm({
  "src/functions/types/option.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_actionable();
    functions6 = {
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
        const value2 = intoWorkable(this[__ctx], this[__type].schema, fallback);
        return actionable({
          [__ctx]: this[__ctx],
          [__type]: this[__type].schema,
          [__display]: (ctx) => `(${this[__display](ctx)} ?? ${value2[__display](ctx)})`
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
  }
});

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
var functions7;
var init_record = __esm({
  "src/functions/types/record.ts"() {
    "use strict";
    init_utils();
    init_utils3();
    functions7 = {
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
  }
});

// src/functions/types/set.ts
var set_exports = {};
__export(set_exports, {
  functions: () => functions8
});
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
var functions8;
var init_set = __esm({
  "src/functions/types/set.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_actionable();
    init_inheritable();
    init_filters();
    init_utils3();
    functions8 = {
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
  }
});

// src/functions/types/string.ts
var string_exports = {};
__export(string_exports, {
  functions: () => functions9
});
var functions9;
var init_string = __esm({
  "src/functions/types/string.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_actionable();
    init_filters();
    init_utils3();
    functions9 = {
      /**
       * Full-text match: `field @@ value`, or `field @N@ value` when `ref` is given.
       *
       * `search.score()`, `search.highlight()` and `search.offsets()` read a match
       * by its reference, so pass the same N to both. A reference is only valid
       * within one statement, and must be a literal integer from 0 to 255.
       */
      search(value2, ref) {
        if (ref === void 0) {
          return comparingFilter(this[__ctx], "@@", this, value2);
        }
        const n = matchRef(ref);
        const operand = intoWorkable(this[__ctx], t_exports.string(), value2);
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
  }
});

// src/functions/types/index.ts
var init_types2 = __esm({
  "src/functions/types/index.ts"() {
    "use strict";
    init_any();
    init_array();
    init_date();
    init_graph();
    init_number();
    init_option();
    init_record();
    init_set();
    init_string();
  }
});

// src/functions/index.ts
function functionTable(typeName) {
  let table2 = tables.get(typeName);
  if (!table2) {
    table2 = { ...functions10.any };
    if (typeName in functions10) {
      Object.assign(table2, functions10[typeName]);
    }
    tables.set(typeName, table2);
  }
  return table2;
}
var functions10, tables;
var init_functions = __esm({
  "src/functions/index.ts"() {
    "use strict";
    init_types2();
    functions10 = {
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
    tables = /* @__PURE__ */ new Map();
  }
});

// src/utils/actionable.ts
function actionable(workable) {
  const table2 = functionTable(workable[__type].name);
  const bound2 = /* @__PURE__ */ new Map();
  return new Proxy(table2, {
    get(target, prop) {
      if (typeof prop === "symbol") {
        return workable[prop];
      }
      if (prop in target) {
        let fn2 = bound2.get(prop);
        if (fn2 === void 0) {
          const unbound = target[prop];
          if (typeof unbound !== "function") {
            throw new OrmError(`Property ${prop} is not a function`);
          }
          fn2 = Object.assign(unbound.bind(workable), {
            valueOf: () => actionable(workableGet(workable, prop))
          });
          bound2.set(prop, fn2);
        }
        return fn2;
      }
      return actionable(workableGet(workable, prop));
    }
  });
}
var init_actionable = __esm({
  "src/utils/actionable.ts"() {
    "use strict";
    init_error();
    init_functions();
    init_workable();
  }
});

// src/functions/filters.ts
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
var JoiningKind, PrefixKind, ComparisonKind;
var init_filters = __esm({
  "src/functions/filters.ts"() {
    "use strict";
    init_types();
    init_utils();
    init_actionable();
    JoiningKind = t_exports.union([t_exports.literal("OR"), t_exports.literal("AND")]);
    PrefixKind = t_exports.union([t_exports.literal("!"), t_exports.literal("!!")]);
    ComparisonKind = t_exports.union([
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
  }
});

// src/query/api.ts
function isSuccess(status) {
  return status >= 200 && status < 300;
}
var import_surrealdb6, ApiClient;
var init_api = __esm({
  "src/query/api.ts"() {
    "use strict";
    import_surrealdb6 = require("surrealdb");
    init_validation();
    ApiClient = class {
      constructor(surreal, endpoints, validate = false) {
        this.surreal = surreal;
        this.validate = validate;
        this.schemas = /* @__PURE__ */ new Map();
        for (const ep of endpoints) {
          this.schemas.set(ep.path, ep.methods);
        }
      }
      schemas;
      // -------------------------------------------------------------------
      // Internal helpers
      // -------------------------------------------------------------------
      getMethodDef(path, method) {
        return this.schemas.get(path)?.[method];
      }
      parseBody(body, path, method) {
        const def = this.getMethodDef(path, method);
        if (def?.response && body !== void 0) {
          return def.response.parse(body);
        }
        return body;
      }
      async invoke(path, method, body) {
        const request = this.getMethodDef(path, method)?.request;
        if (this.validate && request) {
          throwIfInvalid(
            checkValue(request, body),
            void 0,
            `request body for ${method.toUpperCase()} ${path}`
          );
        }
        const sdkApi = this.surreal.api();
        const response = await sdkApi.invoke(path, {
          method,
          body
        });
        if (response.status !== void 0 && !isSuccess(response.status)) {
          throw new import_surrealdb6.UnsuccessfulApiError(path, method, response);
        }
        response.body = this.parseBody(response.body, path, method);
        return response;
      }
      // -------------------------------------------------------------------
      // Public API
      // -------------------------------------------------------------------
      /**
       * Invoke a user-defined GET API endpoint.
       *
       * @param path - The endpoint path.
       * @returns The typed API response.
       */
      get(path) {
        return this.invoke(path, "get");
      }
      /**
       * Invoke a user-defined POST API endpoint.
       *
       * @param path - The endpoint path.
       * @param body - The request body.
       * @returns The typed API response.
       */
      post(path, body) {
        return this.invoke(path, "post", body);
      }
      /**
       * Invoke a user-defined PUT API endpoint.
       *
       * @param path - The endpoint path.
       * @param body - The request body.
       * @returns The typed API response.
       */
      put(path, body) {
        return this.invoke(path, "put", body);
      }
      /**
       * Invoke a user-defined DELETE API endpoint.
       *
       * @param path - The endpoint path.
       * @param body - Optional request body.
       * @returns The typed API response.
       */
      delete(path, body) {
        return this.invoke(path, "delete", body);
      }
      /**
       * Invoke a user-defined PATCH API endpoint.
       *
       * @param path - The endpoint path.
       * @param body - The request body.
       * @returns The typed API response.
       */
      patch(path, body) {
        return this.invoke(path, "patch", body);
      }
      /**
       * Invoke a user-defined TRACE API endpoint.
       *
       * @param path - The endpoint path.
       * @param body - Optional request body.
       * @returns The typed API response.
       */
      trace(path, body) {
        return this.invoke(path, "trace", body);
      }
    };
  }
});

// src/query/request.ts
function addSignal(options, signal) {
  if (!signal) return options;
  return { ...options, signals: [...options.signals ?? [], signal] };
}
function applyRequestOptions(query, options) {
  let configured = query;
  for (const signal of options.signals ?? []) {
    configured = configured.signal(signal);
  }
  if (options.requestTimeout !== void 0) {
    configured = configured.requestTimeout(options.requestTimeout);
  }
  if (options.retry !== void 0) {
    configured = configured.retry(options.retry);
  }
  return configured;
}
function bindSignals(connection, options) {
  let bound2 = connection;
  for (const signal of options.signals ?? []) {
    bound2 = bound2.withSignal(signal);
  }
  return bound2;
}
function isForeignConnection(connection) {
  return !(connection instanceof import_surrealdb7.SurrealSession || connection instanceof import_surrealdb7.SurrealRequestScope);
}
function diagnoseSdkError(connection, error) {
  if (error instanceof Error && EMPTY_SUBJECT.test(error.message) && isForeignConnection(connection)) {
    return new DuplicateSurrealError({ cause: error });
  }
  return error;
}
async function withSdkDiagnosis(connection, run) {
  try {
    return await run();
  } catch (error) {
    throw diagnoseSdkError(connection, error);
  }
}
var import_surrealdb7, EMPTY_SUBJECT;
var init_request = __esm({
  "src/query/request.ts"() {
    "use strict";
    import_surrealdb7 = require("surrealdb");
    init_error();
    EMPTY_SUBJECT = /Cannot execute \w+ statement using value:\s*\{\s*\}/;
  }
});

// src/query/batch.ts
var import_surrealdb8, BatchQuery;
var init_batch = __esm({
  "src/query/batch.ts"() {
    "use strict";
    import_surrealdb8 = require("surrealdb");
    init_display();
    init_workable();
    init_request();
    BatchQuery = class _BatchQuery {
      constructor(surreal, queries, options = {}) {
        this.surreal = surreal;
        this.queries = queries;
        this.options = options;
      }
      /** Render each query as a single statement sharing one variable store. */
      statements(inp) {
        return this.queries.map((q) => {
          const sql = q[__display](inp);
          return sql.startsWith("(") && sql.endsWith(")") ? sql.slice(1, -1) : sql;
        });
      }
      [__display](inp) {
        return `BEGIN TRANSACTION; ${this.statements(inp).join("; ")}; COMMIT TRANSACTION;`;
      }
      toString() {
        const ctx = displayContext();
        return this[__display](ctx);
      }
      [Symbol.toStringTag] = "BatchQuery";
      /** A copy of this batch with different request options. */
      withOptions(options) {
        return new _BatchQuery(this.surreal, this.queries, options);
      }
      /**
       * Abandon the batch when `signal` aborts. Calling this more than once
       * combines the signals.
       *
       * Aborting means "stop waiting", and nothing more: the batch is a single
       * request that the server may carry on to run, so **it may or may not have
       * been committed**.
       */
      signal(signal) {
        return this.withOptions(addSignal(this.options, signal));
      }
      /**
       * Give up on the batch with a `TimeoutError` if the server has not answered
       * within `milliseconds` (per attempt, when retrying), overriding the
       * connection's `requestTimeout`. Pass `0` to wait without limit. As for
       * {@link BatchQuery.signal}, the batch may or may not have been committed.
       */
      requestTimeout(milliseconds) {
        return this.withOptions({ ...this.options, requestTimeout: milliseconds });
      }
      /**
       * Re-send the whole batch when it fails because of a conflict with a
       * concurrent transaction. Defaults to the connection's retry behaviour; pass
       * options to override it, or `false` to turn it off.
       *
       * Conflicts are recognised from the structured `TransactionConflict` error
       * that SurrealDB 3.1.0 and later report. For earlier servers, pass a
       * `retryable` predicate.
       */
      retry(options = true) {
        return this.withOptions({ ...this.options, retry: options });
      }
      async execute() {
        for (const q of this.queries) q.assertInput();
        const ctx = displayContext();
        const statements = this.statements(ctx);
        const connection = bindSignals(this.surreal, this.options);
        const queries = statements.length === 0 ? [] : [new import_surrealdb8.BoundQuery(statements.join("; "), ctx.variables)];
        const results = await withSdkDiagnosis(
          connection,
          () => connection.transaction(queries, {
            retry: this.options.retry,
            requestTimeout: this.options.requestTimeout
          })
        );
        return results.map((result, i) => {
          return this.queries[i].parseResult(result);
        });
      }
      // biome-ignore lint/suspicious/noThenProperty: intentional for Promise-like behavior
      get then() {
        return (onFulfilled, onRejected) => {
          return this.execute().then(onFulfilled, onRejected);
        };
      }
      catch(onRejected) {
        return this.then(void 0, onRejected);
      }
      finally(onFinally) {
        return this.then(
          (value2) => {
            onFinally?.();
            return value2;
          },
          (reason) => {
            onFinally?.();
            throw reason;
          }
        );
      }
    };
  }
});

// src/schema/model-type.ts
var ModelType;
var init_model_type = __esm({
  "src/schema/model-type.ts"() {
    "use strict";
    init_types();
    ModelType = class extends ObjectType {
      constructor(fields, model) {
        super(fields);
        this.model = model;
      }
      /** Parse a row, then hydrate it into an instance of the linked class. */
      parse(value2) {
        const row = super.parse(value2);
        return Object.assign(Object.create(this.model.prototype), row);
      }
    };
  }
});

// src/query/write-result.ts
function parseWritten(type, value2) {
  if (type instanceof ArrayType && Array.isArray(type.schema)) {
    return type.parse(value2);
  }
  if (type instanceof ArrayType) {
    if (!Array.isArray(value2)) return type.parse(value2);
    const row = type.schema;
    return value2.map((item) => parseRow(row, item));
  }
  if (Array.isArray(value2)) {
    throw new TypeParseError(type.name, type.expected, value2);
  }
  return parseRow(type, value2);
}
function parseRow(type, value2) {
  if (value2 === void 0 || value2 === null) return value2;
  if (type instanceof OptionType) return parseRow(type.schema, value2);
  if (!(type instanceof ObjectType) || typeof value2 !== "object") {
    return type.parse(value2);
  }
  const source = value2;
  const result = { ...source };
  const schema = type.schema;
  for (const key in schema) {
    if (source[key] !== void 0) {
      result[key] = schema[key].parse(source[key]);
    }
  }
  return type instanceof ModelType ? Object.assign(Object.create(type.model.prototype), result) : result;
}
var init_write_result = __esm({
  "src/query/write-result.ts"() {
    "use strict";
    init_error();
    init_model_type();
    init_types();
  }
});

// src/query/abstract.ts
var import_surrealdb9, Query;
var init_abstract = __esm({
  "src/query/abstract.ts"() {
    "use strict";
    import_surrealdb9 = require("surrealdb");
    init_utils();
    init_actionable();
    init_request();
    init_write_result();
    Query = class {
      type = void 0;
      /** When true, result parsing is skipped (used by RETURN DIFF). */
      _skipParse = false;
      /**
       * When true, the result of a partial write is parsed leniently: a field the
       * write did not set is not an error, since the record need not have it. See
       * `parseWritten`.
       */
      _lenient = false;
      /** Client-side options applied when the query is sent. */
      _request = {};
      /** Per-query override of the ORM's input validation; `undefined` defers to the ORM. */
      _validate;
      /**
       * Check the data this query writes against the table schema before it is
       * sent, throwing a {@link ValidationError} that lists every failing field.
       * `.validated()` turns it on for this query and `.validated(false)` off; by
       * default it follows the ORM (see `Orm.validated()`), which is off.
       */
      validated(enabled = true) {
        return this.derive((next) => {
          next._validate = enabled;
        });
      }
      /**
       * Validate the data this query writes, if input validation is on for it.
       * Called before the query is sent (and before a batch sends it).
       *
       * @throws {ValidationError} If the data does not match the table schema.
       */
      assertInput() {
        if (this._validate ?? this[__ctx].orm.validation) this.validateInput();
      }
      /** Overridden by the write queries to check the data they carry. */
      validateInput() {
      }
      /** Type-guard that checks whether a value matches this query's result type. */
      validate(value2) {
        return this[__type].validate(value2);
      }
      /** Parse and validate a raw query result against this query's result type. */
      parse(value2) {
        return this[__type].parse(value2);
      }
      /**
       * Normalize a raw query result into the public return value for this query.
       * Most queries parse through the runtime schema, while a few modes such as
       * `RETURN DIFF` intentionally bypass parse.
       */
      parseResult(value2) {
        if (this._skipParse) return value2;
        if (this._lenient) return parseWritten(this[__type], value2);
        return this.parse(value2);
      }
      /** Create a shallow clone of this query. */
      clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
      }
      /**
       * Return a shallow {@link clone} of this query with `mutate` applied to it.
       *
       * This is the basis of the immutable builder API: every chaining method
       * (`.where()`, `.limit()`, …) derives a *new* query rather than mutating
       * `this`, so a partially-built query can be safely reused as the base for
       * several divergent queries without their state leaking into one another.
       *
       * Because the clone is shallow, `mutate` must replace mutable fields
       * wholesale (e.g. `next._orderBy = [...next._orderBy ?? [], entry]`) instead
       * of mutating them in place — an in-place `push`/property write would also
       * affect the original query, which shares the same array/object references.
       */
      derive(mutate) {
        const next = this.clone();
        mutate(next);
        return next;
      }
      /**
       * Abandon the query when `signal` aborts: the returned promise rejects with
       * the signal's reason instead of waiting for the server. Calling this more
       * than once combines the signals.
       *
       * Aborting means "stop waiting", and nothing more. The server may carry on,
       * so **a write that was already sent may or may not have been applied**.
       * To tie every query of a request handler to the request's signal, use
       * `orm.withSignal()` instead.
       *
       * ```ts
       * await db.select("report").signal(AbortSignal.timeout(2000));
       * ```
       */
      signal(signal) {
        return this.derive((next) => {
          next._request = addSignal(next._request, signal);
        });
      }
      /**
       * Give up on the query with a `TimeoutError` if the server has not answered
       * within `milliseconds`, overriding the connection's `requestTimeout`. Pass
       * `0` to wait without limit.
       *
       * This is a limit on the *client*. It is not the `TIMEOUT` clause that
       * `.timeout()` adds to the statement and the server enforces. The server is
       * not told the client has given up, so a write that timed out may or may not
       * have been applied.
       */
      requestTimeout(milliseconds) {
        return this.derive((next) => {
          next._request = { ...next._request, requestTimeout: milliseconds };
        });
      }
      /**
       * Re-send the query, with exponential backoff, when it fails because of a
       * transaction conflict with a concurrent write. Defaults to the connection's
       * retry behaviour; pass options to override it, or `false` to turn it off.
       *
       * The whole query is re-sent, which is safe for a single statement. Do not use
       * it inside an interactive transaction, where a conflict has already failed
       * the transaction. To retry several statements together, use `orm.batch()`,
       * which is atomic and can be retried as a unit.
       *
       * Conflicts are recognised from the structured `TransactionConflict` error
       * that SurrealDB 3.1.0 and later report. For earlier servers, pass a
       * `retryable` predicate.
       */
      retry(options = true) {
        return this.derive((next) => {
          next._request = { ...next._request, retry: options };
        });
      }
      /** Render the query as a SurrealQL string. */
      toString() {
        const ctx = displayContext();
        return this[__display]({
          ...ctx,
          contextId: this[__ctx].id
        });
      }
      [Symbol.toStringTag] = "Query";
      catch(onRejected) {
        return this.then(void 0, onRejected);
      }
      finally(onFinally) {
        return this.then(
          (value2) => {
            onFinally?.();
            return value2;
          },
          (reason) => {
            onFinally?.();
            throw reason;
          }
        );
      }
      // biome-ignore lint/suspicious/noThenProperty: entire point of the class
      get then() {
        const fn2 = (onFulfilled, onRejected) => {
          return this.execute().then(onFulfilled, onRejected);
        };
        const val2 = () => this.execute().then(
          (result) => Array.isArray(result) ? result.at(0) : result
        );
        const at3 = (index) => this.execute().then(
          (result) => Array.isArray(result) ? result.at(index) : void 0
        );
        return Object.assign(fn2, { val: val2, at: at3 });
      }
      wrap() {
        const query = this;
        return actionable({
          [__ctx]: this[__ctx],
          [__type]: this[__type],
          [__display](ctx) {
            return `(${query[__display](ctx)})`;
          }
        });
      }
      /** Execute the query against SurrealDB and return the parsed result. */
      async execute() {
        this.assertInput();
        const ctx = displayContext();
        const query = this[__display](ctx);
        const { surreal } = this[__ctx].orm;
        const [result] = await withSdkDiagnosis(
          surreal,
          () => applyRequestOptions(
            surreal.query(query, ctx.variables),
            this._request
          )
        );
        return this.parseResult(result);
      }
      /**
       * Compile this query into a fully-typed SurrealDB {@link BoundQuery} — the
       * query string plus its bindings — that can be handed straight to the SDK's
       * `surreal.query(...)`, including inside a manual transaction
       * (`await db.begin()`):
       *
       * ```ts
       * const prepared = orm
       *   .select("user")
       *   .return((user) => ({ fullName: user.name, email: user.email }))
       *   .prepare();
       *
       * const [users] = await db.query(prepared); // users is fully typed
       * ```
       *
       * The result type is preserved (`BoundQuery<[this["type"]]>`), so the SDK
       * types the response from the ORM's inferred schema. Unlike {@link execute},
       * the SDK's raw result is **not** run through this query's {@link parseResult}
       * — the caller owns decoding.
       *
       * Options set with `.signal()`, `.requestTimeout()` and `.retry()` are not
       * carried over: they configure how this query is sent, and a prepared query
       * is sent by the caller. Configure the SDK query instead, for example
       * `surreal.query(prepared).retry()`.
       */
      prepare() {
        this.assertInput();
        const ctx = displayContext();
        const query = this[__display](ctx);
        return new import_surrealdb9.BoundQuery(query, ctx.variables);
      }
    };
  }
});

// src/query/defaults.ts
function schemaDefaults(schema) {
  if (!(schema instanceof ObjectType)) return [];
  const defaults = [];
  for (const [key, type] of Object.entries(
    schema.schema
  )) {
    if (key !== "id" && type._default !== void 0)
      defaults.push([key, type._default]);
  }
  return defaults;
}
function resolve2(value2) {
  return typeof value2 === "function" ? value2() : value2;
}
function isPlainObject(value2) {
  if (typeof value2 !== "object" || value2 === null) return false;
  const proto = Object.getPrototypeOf(value2);
  return proto === Object.prototype || proto === null;
}
function fillRecord(record2, defaults) {
  const filled = { ...record2 };
  for (const [field, value2] of defaults) {
    if (filled[field] === void 0) filled[field] = resolve2(value2);
  }
  return filled;
}
function fillData(data, defaults) {
  if (defaults.length === 0) return data;
  if (Array.isArray(data))
    return data.map(
      (row) => isPlainObject(row) ? fillRecord(row, defaults) : row
    );
  return isPlainObject(data) ? fillRecord(data, defaults) : data;
}
function renderData(data, ctx) {
  if (!containsExpr(data)) return ctx.var(data);
  if (Array.isArray(data))
    return `[${data.map((row) => renderData(row, ctx)).join(", ")}]`;
  const entries = Object.entries(data).filter(([, v]) => v !== void 0).map(([k, v]) => `${(0, import_surrealdb10.escapeIdent)(k)}: ${renderValue(v, ctx)}`);
  return `{ ${entries.join(", ")} }`;
}
function withDefaults(state, defaults) {
  if (defaults.length === 0) return state;
  const next = { ...state };
  const mode = state._modificationMode;
  if (mode === void 0 || mode === "set") {
    const set2 = { ...state._set };
    const covers = (key, field) => key === field || key.startsWith(`${field}.`);
    for (const [field, value2] of defaults) {
      const present = Object.keys(set2).some((k) => covers(k, field)) || (state._unset ?? []).some((u) => covers(u, field));
      if (!present) set2[field] = resolve2(value2);
    }
    if (Object.keys(set2).length > 0) next._set = set2;
  } else if (mode === "content") {
    next._content = fillData(state._content, defaults);
  } else if (mode === "merge") {
    next._merge = fillData(state._merge, defaults);
  }
  return next;
}
function fillValues(fields, rows, defaults) {
  const missing = defaults.filter(([f]) => !fields.includes(f));
  const listed = defaults.filter(([f]) => fields.includes(f)).map(([f, v]) => [fields.indexOf(f), v]);
  return {
    fields: [...fields, ...missing.map(([f]) => f)],
    rows: rows.map((row) => {
      const filled = [...row];
      for (const [index, value2] of listed) {
        if (filled[index] === void 0) filled[index] = resolve2(value2);
      }
      return [...filled, ...missing.map(([, v]) => resolve2(v))];
    })
  };
}
var import_surrealdb10, containsExpr;
var init_defaults = __esm({
  "src/query/defaults.ts"() {
    "use strict";
    import_surrealdb10 = require("surrealdb");
    init_types();
    init_utils2();
    containsExpr = (value2) => Array.isArray(value2) ? value2.some(containsExpr) : isPlainObject(value2) && Object.values(value2).some((v) => v instanceof SurqlExpression);
  }
});

// src/query/modification-methods.ts
function assertDottedRootsSupplied(data) {
  for (const key of Object.keys(data)) {
    const dot = key.indexOf(".");
    if (dot === -1) continue;
    const root = key.slice(0, dot);
    if (data[root] !== void 0) continue;
    throw new OrmError(
      `set() key "${key}" writes into "${root}", but "${root}" is not set in the same call. Set the parent object in full alongside it (for example .set({ ${root}: { \u2026 }, "${key}": \u2026 })): CREATE and RELATE would otherwise store a partial object that cannot be read back.`
    );
  }
}
function checkModificationMode(currentMode, newMode) {
  if (currentMode && currentMode !== newMode) {
    throw new OrmError(
      `Cannot use ${newMode}() when ${currentMode}() has already been used`
    );
  }
}
function applySet(state, data) {
  checkModificationMode(state._modificationMode, "set");
  state._modificationMode = "set";
  const processedData = processSetOperators(data);
  state._set = { ...state._set, ...processedData };
}
function applyUnset(state, fields) {
  checkModificationMode(state._modificationMode, "set");
  state._modificationMode = "set";
  state._unset = [...state._unset || [], ...fields];
}
function applyContent(state, data) {
  checkModificationMode(state._modificationMode, "content");
  state._modificationMode = "content";
  state._content = data;
}
function applyMerge(state, data) {
  checkModificationMode(state._modificationMode, "merge");
  state._modificationMode = "merge";
  state._merge = data;
}
function applyPatch(state, operations) {
  checkModificationMode(state._modificationMode, "patch");
  state._modificationMode = "patch";
  state._patch = operations;
}
function applyReplace(state, data) {
  checkModificationMode(state._modificationMode, "replace");
  state._modificationMode = "replace";
  state._replace = data;
}
function displaySetUnsetClause(state, ctx) {
  const unset = state._unset ?? [];
  const assignments = state._set ? generateSetAssignments(state._set, ctx) : [];
  if (assignments.length > 0) {
    for (const path of unset) {
      assignments.push(`${escapeIdiomPath(path)} = NONE`);
    }
    return ` SET ${assignments.join(", ")}`;
  }
  if (unset.length > 0) {
    return ` UNSET ${unset.map(escapeIdiomPath).join(", ")}`;
  }
  return "";
}
function displayModificationClause(state, ctx) {
  if (state._content) {
    return (
      /* surql */
      ` CONTENT ${renderData(state._content, ctx)}`
    );
  }
  if (state._merge) {
    return (
      /* surql */
      ` MERGE ${renderData(state._merge, ctx)}`
    );
  }
  if (state._patch) {
    return (
      /* surql */
      ` PATCH ${ctx.var(state._patch)}`
    );
  }
  if (state._replace) {
    return (
      /* surql */
      ` REPLACE ${ctx.var(state._replace)}`
    );
  }
  if (state._set || state._unset) {
    return displaySetUnsetClause(state, ctx);
  }
  return "";
}
var init_modification_methods = __esm({
  "src/query/modification-methods.ts"() {
    "use strict";
    init_error();
    init_defaults();
    init_utils2();
  }
});

// src/query/validate-input.ts
function computedFieldsOf(orm2, tb) {
  const schema = orm2.tables[tb];
  return schema?.computedFields ?? [];
}
function implicitFieldsOf(orm2, tb) {
  const schema = orm2.tables[tb];
  return "from" in schema ? ["id", "in", "out"] : ["id"];
}
function writtenFields(state) {
  const written = /* @__PURE__ */ new Set();
  const mode = state._modificationMode;
  if (mode === "set" || mode === "merge") {
    const data = mode === "set" ? state._set : state._merge;
    if (data === void 0) return written;
    if (!isPlainRecord(data)) return void 0;
    for (const [key, value2] of Object.entries(data)) {
      if (value2 !== void 0) written.add(key.split(".")[0]);
    }
  }
  for (const key of state._unset ?? []) {
    written.delete(key.split(".")[0]);
  }
  return written;
}
function validateWrite(orm2, tb, schema, state, kind) {
  if (!(schema instanceof ObjectType)) return;
  const computed = computedFieldsOf(orm2, tb);
  const implicit = implicitFieldsOf(orm2, tb);
  const fills = kind === "create";
  const issues = [];
  if (state._content !== void 0) {
    issues.push(
      ...checkRecord(schema, state._content, {
        mode: "create",
        implicit,
        computed,
        fills
      })
    );
  }
  if (state._replace !== void 0) {
    issues.push(
      ...checkRecord(schema, state._replace, {
        mode: "create",
        implicit,
        computed,
        fills: false
      })
    );
  }
  if (state._merge !== void 0)
    issues.push(
      ...checkRecord(schema, state._merge, { mode: "update", computed })
    );
  if (state._set !== void 0)
    issues.push(...checkSet(schema, state._set, computed));
  const wholeRecord = state._content !== void 0 || state._replace !== void 0;
  const newRecord = kind !== "update";
  if (newRecord && !wholeRecord && state._modificationMode !== "patch") {
    const written = writtenFields(state);
    if (written !== void 0)
      issues.push(
        ...checkRequired(schema, written, { implicit, computed, fills })
      );
  }
  throwIfInvalid(issues, tb);
}
var isPlainRecord;
var init_validate_input = __esm({
  "src/query/validate-input.ts"() {
    "use strict";
    init_types();
    init_workable();
    init_validation();
    isPlainRecord = (value2) => {
      if (typeof value2 !== "object" || value2 === null) return false;
      if (value2 instanceof SurqlExpression || isWorkable(value2)) return false;
      const proto = Object.getPrototypeOf(value2);
      return proto === Object.prototype || proto === null;
    };
  }
});

// src/query/create.ts
var import_surrealdb11, CreateQuery;
var init_create = __esm({
  "src/query/create.ts"() {
    "use strict";
    import_surrealdb11 = require("surrealdb");
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_abstract();
    init_defaults();
    init_modification_methods();
    init_validate_input();
    CreateQuery = class extends Query {
      constructor(orm2, tb, id) {
        super();
        this.tb = tb;
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._lenient = true;
        this._id = id;
      }
      [__ctx];
      _only = false;
      _set;
      _content;
      _merge;
      _patch;
      _replace;
      _modificationMode;
      _return;
      _timeout;
      _id;
      get schema() {
        return this[__ctx].orm.tables[this.tb].schema;
      }
      get [__type]() {
        const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
        return this._only ? schema : t_exports.array(schema);
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      /**
       * Set fields. Fields that are not set are absent from the result, so the
       * result only types the fields that are known to be there.
       */
      set(data) {
        assertDottedRootsSupplied(data);
        return this.derive((next) => {
          applySet(next, data);
        });
      }
      content(data) {
        return this.derive((next) => {
          applyContent(next, data);
          next._lenient = false;
        });
      }
      /** Merge fields into the record. Fields that are not merged are absent from the result. */
      merge(data) {
        return this.derive((next) => {
          applyMerge(next, data);
        });
      }
      patch(operations) {
        return this.derive((next) => {
          applyPatch(next, operations);
        });
      }
      /** Replace the record. REPLACE does not apply defaults, so only the given fields are known. */
      replace(data) {
        return this.derive((next) => {
          applyReplace(next, data);
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const record2 = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$this" : "$parent";
            }
          });
          const inheritable = value2(record2);
          const workable = inheritableIntoWorkable(inheritable);
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      validateInput() {
        validateWrite(this[__ctx].orm, this.tb, this.schema, this, "create");
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        let target;
        if (this._id !== void 0) {
          const recordId = new import_surrealdb11.RecordId(this.tb, this._id);
          target = ctx.var(recordId);
        } else {
          target = ctx.var(new import_surrealdb11.Table(this.tb));
        }
        let query = (
          /* surql */
          `CREATE ${this._only ? "ONLY " : ""}${target}`
        );
        query += displayModificationClause(
          withDefaults(this, schemaDefaults(this.schema)),
          ctx
        );
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/query/object-filter.ts
function isPlainObject2(value2) {
  if (typeof value2 !== "object" || value2 === null) return false;
  const proto = Object.getPrototypeOf(value2);
  return proto === Object.prototype || proto === null;
}
function fieldNames(target) {
  const { target: resolved } = resolveAccessType(
    target[__ctx].orm,
    target[__type]
  );
  return new Set(
    resolved instanceof ObjectType ? Object.keys(resolved.schema) : []
  );
}
function combine(ctx, kind, conditions) {
  if (conditions.length === 0) return void 0;
  if (conditions.length === 1) return conditions[0];
  return joiningFilter(ctx, kind, ...conditions);
}
function asObjectArray(key, value2) {
  if (!Array.isArray(value2) || !value2.every(isPlainObject2)) {
    throw new OrmError(
      `"${key}" in a where object must be an array of filter objects`
    );
  }
  return value2;
}
function fieldOf(target, key) {
  const field = target[key];
  return typeof field === "function" ? field.valueOf() : field;
}
function callOperator(field, op, value2) {
  const fn2 = field[op];
  if (typeof fn2 !== "function") {
    throw new OrmError(
      `Operator "${op}" is not supported on a ${field[__type].name} field`
    );
  }
  return fn2(value2);
}
function conditionsOf(target, input, isField) {
  const names = fieldNames(target);
  const out = [];
  for (const [key, value2] of Object.entries(input)) {
    if (value2 === void 0) continue;
    let condition;
    if (names.has(key)) {
      condition = fieldConditions(fieldOf(target, key), value2);
    } else if (key === "and" || key === "or" || key === "not") {
      condition = combinatorCondition(target, key, value2, isField);
    } else if (isField && OPERATORS.has(key)) {
      condition = callOperator(target, key, value2);
    } else {
      throw new OrmError(`Unknown field "${key}" in where object`);
    }
    if (Array.isArray(condition)) out.push(...condition);
    else if (condition) out.push(condition);
  }
  return out;
}
function fieldConditions(field, value2) {
  if (isWorkable(value2) || !isPlainObject2(value2)) {
    return [callOperator(field, "eq", value2)];
  }
  return conditionsOf(field, value2, true);
}
function combinatorCondition(target, key, value2, isField) {
  const ctx = target[__ctx];
  const group = (kind, items) => combine(
    ctx,
    kind,
    items.map((o) => combine(ctx, "AND", conditionsOf(target, o, isField))).filter((g) => g !== void 0)
  );
  if (key !== "not") {
    return group(key === "and" ? "AND" : "OR", asObjectArray(key, value2));
  }
  if (!isPlainObject2(value2)) {
    throw new OrmError(`"not" in a where object must be a filter object`);
  }
  const inner = group("AND", [value2]);
  return inner ? prefixedFilter(ctx, "!", joiningFilter(ctx, "AND", inner)) : void 0;
}
function whereFromObject(row, input) {
  if (!isPlainObject2(input)) {
    throw new OrmError("where() expects a callback or a filter object");
  }
  return combine(row[__ctx], "AND", conditionsOf(row, input, false));
}
function orderFromObject(row, input, prefix = []) {
  if (!isPlainObject2(input)) {
    throw new OrmError("orderBy() expects a field, a callback or an object");
  }
  const names = fieldNames(row);
  const out = [];
  for (const [key, value2] of Object.entries(input)) {
    if (value2 === void 0) continue;
    if (!names.has(key)) {
      throw new OrmError(`Unknown field "${key}" in orderBy object`);
    }
    const path = [...prefix, key];
    if (typeof value2 === "string") {
      const direction = value2.toUpperCase();
      if (direction !== "ASC" && direction !== "DESC") {
        throw new OrmError(
          `Invalid sort direction "${value2}" for "${path.join(".")}"; expected "asc" or "desc"`
        );
      }
      out.push({ field: path.join("."), direction });
    } else if (isPlainObject2(value2)) {
      const field = fieldOf(row, key);
      out.push(...orderFromObject(field, value2, path));
    } else {
      throw new OrmError(
        `Invalid sort direction for "${path.join(".")}"; expected "asc", "desc" or a nested object`
      );
    }
  }
  return out;
}
var OPERATORS;
var init_object_filter = __esm({
  "src/query/object-filter.ts"() {
    "use strict";
    init_error();
    init_filters();
    init_types();
    init_workable();
    OPERATORS = /* @__PURE__ */ new Set([
      "eq",
      "ne",
      "ex",
      "gt",
      "gte",
      "lt",
      "lte",
      "inside",
      "notInside",
      "contains",
      "containsNot",
      "containsAll",
      "containsAny",
      "containsNone",
      "allInside",
      "anyInside",
      "noneInside",
      "startsWith",
      "endsWith",
      "search"
    ]);
  }
});

// src/query/delete.ts
var import_surrealdb12, DeleteQuery;
var init_delete = __esm({
  "src/query/delete.ts"() {
    "use strict";
    import_surrealdb12 = require("surrealdb");
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_abstract();
    init_object_filter();
    init_subject();
    init_utils2();
    DeleteQuery = class extends Query {
      [__ctx];
      _only = false;
      _filter;
      _return;
      _timeout;
      tb;
      subject;
      constructor(orm2, subject) {
        super();
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._lenient = true;
        this.subject = subject;
        if (typeof subject === "string") {
          this.tb = subject;
        } else if (isWorkable(subject)) {
          this.tb = subject[__type].tb;
        } else {
          this.tb = String(subject.table);
        }
      }
      get schema() {
        return resolveSubjectSchema(this[__ctx].orm, this.tb);
      }
      get [__type]() {
        let type;
        if (this._return === void 0 || this._return === "none") {
          type = this._only ? t_exports.option(t_exports.never()) : t_exports.array(t_exports.never());
        } else if (this._return === "after") {
          const element = t_exports.option(t_exports.never());
          type = this._only ? element : t_exports.array(element);
        } else {
          const schema = typeof this._return !== "string" ? this._return[__type] : this.schema;
          type = this._only ? schema : t_exports.array(schema);
        }
        return type;
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      where(input) {
        const tb = actionable({
          [__ctx]: this[__ctx],
          [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
          [__display]: ({ contextId }) => {
            return contextId === this[__ctx].id ? "$this" : "$parent";
          }
        });
        const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
        if (!condition) return this;
        const filter = sanitizeWorkable(condition);
        return this.derive((next) => {
          next._filter = andWhere(next._filter, filter);
        });
      }
      /** Remove every `.where()` condition set so far. */
      clearWhere() {
        return this.derive((next) => {
          next._filter = void 0;
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const tb = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$before" : "$parent";
            }
          });
          const predicable = value2(tb);
          const workable = inheritableIntoWorkable(
            predicable
          );
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const thing = typeof this.subject === "string" ? ctx.var(new import_surrealdb12.Table(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
        let query = (
          /* surql */
          `DELETE ${this._only ? "ONLY " : ""}${thing}`
        );
        if (this._filter)
          query += /* surql */
          ` WHERE ${this._filter[__display](ctx)}`;
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/query/insert.ts
var import_surrealdb13, InsertQuery;
var init_insert = __esm({
  "src/query/insert.ts"() {
    "use strict";
    import_surrealdb13 = require("surrealdb");
    init_error();
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_validation();
    init_abstract();
    init_defaults();
    init_utils2();
    init_validate_input();
    InsertQuery = class extends Query {
      constructor(orm2, tb, data) {
        super();
        this.tb = tb;
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._data = data;
      }
      [__ctx];
      _data;
      _fields;
      _values;
      _ignore;
      _onDuplicate;
      _return;
      _timeout;
      get schema() {
        return this[__ctx].orm.tables[this.tb].schema;
      }
      get [__type]() {
        if (this._return && typeof this._return !== "string") {
          return t_exports.array(this._return[__type]);
        }
        return t_exports.array(this.schema);
      }
      /**
       * Specify the fields for a `VALUES`-style insert.
       *
       * @param fields - Column names to insert into.
       * @throws {OrmError} If the query was constructed with inline data.
       */
      fields(fields) {
        if (this._data) {
          throw new OrmError("Cannot use fields() with object-style insert");
        }
        const fields_ = fields;
        return this.derive((next) => {
          next._fields = fields_;
        });
      }
      /**
       * Provide value rows for a `VALUES`-style insert.
       *
       * @param rows - One or more arrays of values matching the field order.
       * @throws {OrmError} If the query was constructed with inline data.
       * @throws {OrmError} If {@link fields} has not been called first.
       * @throws {OrmError} If any row length does not match the field count.
       */
      values(...rows) {
        if (this._data) {
          throw new OrmError("Cannot use values() with object-style insert");
        }
        if (!this._fields) {
          throw new OrmError("Must call fields() before values()");
        }
        for (const row of rows) {
          if (row.length !== this._fields.length) {
            throw new OrmError(
              `Value row length (${row.length}) does not match fields length (${this._fields.length})`
            );
          }
        }
        return this.derive((next) => {
          next._values = [...next._values ?? [], ...rows];
        });
      }
      /**
       * Add an `IGNORE` clause so duplicate records are silently skipped.
       *
       * @throws {OrmError} If {@link onDuplicate} has already been called.
       */
      ignore() {
        if (this._onDuplicate) {
          throw new OrmError("Cannot use both ignore() and onDuplicate()");
        }
        return this.derive((next) => {
          next._ignore = true;
        });
      }
      /**
       * Add an `ON DUPLICATE KEY UPDATE` clause.
       *
       * A row that conflicts is updated, not inserted, so the rows returned may be
       * records the update did not fully write. Only the id is typed as present.
       *
       * @param updates - Fields and values to update on conflict.
       * @throws {OrmError} If {@link ignore} has already been called.
       */
      onDuplicate(updates) {
        if (this._ignore) {
          throw new OrmError("Cannot use both ignore() and onDuplicate()");
        }
        const processedData = processSetOperators(
          updates
        );
        return this.derive((next) => {
          next._onDuplicate = processedData;
          next._lenient = true;
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const tb = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$this" : "$parent";
            }
          });
          const predicable = value2(tb);
          const workable = inheritableIntoWorkable(
            predicable
          );
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      validateInput() {
        const schema = this.schema;
        if (!(schema instanceof ObjectType)) return;
        const orm2 = this[__ctx].orm;
        const options = {
          mode: "create",
          implicit: implicitFieldsOf(orm2, this.tb),
          computed: computedFieldsOf(orm2, this.tb)
        };
        const issues = [];
        if (this._data !== void 0) {
          if (Array.isArray(this._data)) {
            this._data.forEach((row, i) => {
              issues.push(...checkRecord(schema, row, options, `[${i}]`));
            });
          } else {
            issues.push(...checkRecord(schema, this._data, options));
          }
        } else if (this._fields && this._values) {
          const fields = this._fields;
          this._values.forEach((values, i) => {
            const row = Object.fromEntries(fields.map((f, j) => [f, values[j]]));
            issues.push(...checkRecord(schema, row, options, `[${i}]`));
          });
        }
        if (this._onDuplicate) {
          issues.push(...checkSet(schema, this._onDuplicate, options.computed));
        }
        throwIfInvalid(issues, this.tb);
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const table2 = ctx.var(new import_surrealdb13.Table(this.tb));
        let query = (
          /* surql */
          "INSERT"
        );
        if (this._ignore) query += /* surql */
        " IGNORE";
        query += /* surql */
        ` INTO ${table2}`;
        const defaults = schemaDefaults(this.schema);
        if (this._data) {
          query += /* surql */
          ` ${renderData(fillData(this._data, defaults), ctx)}`;
        } else if (this._fields && this._values) {
          const filled = fillValues(this._fields, this._values, defaults);
          query += /* surql */
          ` (${filled.fields.map(import_surrealdb13.escapeIdent).join(", ")})`;
          const valueGroups = filled.rows.map(
            (row) => `(${row.map((v) => renderValue(v, ctx)).join(", ")})`
          );
          query += /* surql */
          ` VALUES ${valueGroups.join(", ")}`;
        }
        if (this._onDuplicate) {
          const assignments = generateSetAssignments(this._onDuplicate, ctx);
          query += /* surql */
          ` ON DUPLICATE KEY UPDATE ${assignments.join(", ")}`;
        }
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/query/select.ts
function chainWhereInput(previous, input) {
  if (previous === void 0) return input;
  if (typeof previous === "function") return previous;
  if (typeof input === "function") return input;
  return { and: [previous, input] };
}
function splitSchema(schema, fields) {
  if (!(schema instanceof ObjectType) || fields.length === 0) return schema;
  const resolved = { ...schema.schema };
  for (const field of fields) {
    const type = resolved[field];
    if (type instanceof ArrayType && !Array.isArray(type.schema)) {
      resolved[field] = type.schema;
    }
  }
  return schema instanceof ModelType ? new ModelType(resolved, schema.model) : new ObjectType(resolved);
}
function resolveFetchObject(schema, paths, orm2) {
  const tailsByHead = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const dot = path.indexOf(".");
    const head = dot === -1 ? path : path.slice(0, dot);
    const tail = dot === -1 ? void 0 : path.slice(dot + 1);
    const tails = tailsByHead.get(head) ?? [];
    if (tail !== void 0) tails.push(tail);
    tailsByHead.set(head, tails);
  }
  const resolved = { ...schema.schema };
  for (const [head, tails] of tailsByHead) {
    const fieldType = resolved[head];
    if (fieldType) resolved[head] = resolveFetchField(fieldType, tails, orm2);
  }
  return schema instanceof ModelType ? new ModelType(resolved, schema.model) : new ObjectType(resolved);
}
function resolveFetchField(fieldType, tails, orm2) {
  if (fieldType instanceof RecordType) {
    return resolveFetchRecord(fieldType, tails, orm2);
  }
  if (fieldType instanceof UnionType) {
    return new UnionType(
      fieldType.schema.map(
        (member) => resolveFetchField(member, tails, orm2)
      )
    );
  }
  if (fieldType instanceof OptionType) {
    return new OptionType(resolveFetchField(fieldType.schema, tails, orm2));
  }
  if (fieldType instanceof ArrayType) {
    return resolveFetchArray(fieldType, tails, orm2);
  }
  if (fieldType instanceof ObjectType && tails.length > 0) {
    return resolveFetchObject(fieldType, tails, orm2);
  }
  return fieldType;
}
function resolveFetchRecord(fieldType, tails, orm2) {
  const tb = fieldType.tb;
  if (typeof tb === "string") {
    return resolveFetchTable(tb, tails, orm2);
  }
  if (!Array.isArray(tb)) return fieldType;
  return new UnionType(tb.map((table2) => resolveFetchTable(table2, tails, orm2)));
}
function resolveFetchTable(tb, tails, orm2) {
  const target = orm2.tables[tb];
  if (!target) return new ObjectType({ id: new RecordType(tb) });
  return tails.length === 0 ? target.schema : resolveFetchObject(target.schema, tails, orm2);
}
function resolveFetchArray(fieldType, tails, orm2) {
  if (Array.isArray(fieldType.schema)) return fieldType;
  return new ArrayType(resolveFetchField(fieldType.schema, tails, orm2));
}
var import_surrealdb14, SelectQuery;
var init_select = __esm({
  "src/query/select.ts"() {
    "use strict";
    import_surrealdb14 = require("surrealdb");
    init_error();
    init_model_type();
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_traversal();
    init_workable();
    init_abstract();
    init_object_filter();
    init_subject();
    init_utils2();
    SelectQuery = class extends Query {
      [__ctx];
      _only = false;
      _start;
      _limit;
      _filter;
      _whereInput;
      _entry;
      /** The fields of an object `.return()` projection, when it is one. */
      _entryFields;
      _orderBy;
      _groupBy;
      _split;
      _fetch;
      _fetchResolvedType;
      _timeout;
      tb;
      subject;
      constructor(orm2, subject) {
        super();
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this.subject = subject;
        if (typeof subject === "string") {
          this.tb = subject;
        } else if (Array.isArray(subject)) {
          this.tb = subject;
        } else if (isWorkable(subject)) {
          this.tb = subject[__type].tb;
        } else {
          this.tb = String(subject.table);
        }
      }
      get entry() {
        if (this._entry) return this._entry[__type];
        const base = this._fetchResolvedType ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
        return splitSchema(base, this._split ?? []);
      }
      get [__type]() {
        return this._only ? this.entry : t_exports.array(this.entry);
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      /**
       * Build the row actionable handed to `.return()` / `.where()` / `.orderBy()`
       * callbacks: it renders as `$this` (or `$parent` when nested) and carries the
       * row's id, so traversal verbs called directly on it root at `<row>.id`.
       */
      rowActionable(type) {
        const base = actionable({
          [__ctx]: this[__ctx],
          [__type]: type,
          [__display]: (ctx) => {
            if (ctx.contextId !== this[__ctx].id) return "$parent";
            return ctx.bareRowsOf === this[__ctx].id ? "" : "$this";
          }
        });
        return traversableRow(
          base,
          resolveSubjectSchema(this[__ctx].orm, this.tb).schema
        );
      }
      return(cb) {
        const tb = this.rowActionable(this.entry);
        const predicable = cb(tb);
        const workable = inheritableIntoWorkable(
          predicable
        );
        const entry = sanitizeWorkable(workable);
        const fields = workable[__fields];
        const entryFields = fields ? Object.entries(fields) : void 0;
        return this.derive((next) => {
          const select = next;
          select._entry = entry;
          select._entryFields = entryFields;
        });
      }
      where(input) {
        const tb = this.rowActionable(
          resolveSubjectSchema(this[__ctx].orm, this.tb)
        );
        const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
        if (!condition) return this;
        const filter = sanitizeWorkable(condition);
        return this.derive((next) => {
          next._filter = andWhere(next._filter, filter);
          next._whereInput = chainWhereInput(next._whereInput, input);
        });
      }
      /** Remove every `.where()` condition set so far. */
      clearWhere() {
        return this.derive((next) => {
          next._filter = void 0;
          next._whereInput = void 0;
        });
      }
      /**
       * What a client needs to check a row against this query without asking the
       * database, or `undefined` when the query is more than a filter over a
       * table: a callback filter (a SurrealQL expression), a projection, `FETCH`,
       * `LIMIT`, `START`, `GROUP`, `SPLIT`, `.only()`, or several tables.
       *
       * - `where` is the object passed to `.where()`, if there is one.
       * - `ordered` tells that the rows come in an order the client does not
       *   reproduce, so a row it adds would be in the wrong place.
       */
      clientFilter() {
        const plain = typeof this.tb === "string" && typeof this.subject === "string" && !this._only && this._entry === void 0 && this._start === void 0 && this._limit === void 0 && this._groupBy === void 0 && this._split === void 0 && this._fetch === void 0;
        if (!plain) return void 0;
        const input = this._whereInput;
        if (typeof input === "function") return void 0;
        return {
          where: input,
          ordered: this._orderBy !== void 0
        };
      }
      start(start) {
        return this.derive((next) => {
          next._start = start;
        });
      }
      limit(limit) {
        return this.derive((next) => {
          next._limit = limit;
        });
      }
      _addOrderBy(field, direction, opts) {
        let entry;
        if (typeof field === "string") {
          entry = { field, direction, ...opts };
        } else {
          const workable = field(
            this.rowActionable(this.entry)
          );
          entry = {
            field: sanitizeWorkable(workable),
            direction,
            ...opts,
            hoist: !isFieldPath(workable)
          };
        }
        return this.derive((next) => {
          next._orderBy = [...next._orderBy ?? [], entry];
        });
      }
      orderBy(field, direction) {
        if (typeof field === "object" && field !== null) {
          const specs = orderFromObject(
            this.rowActionable(this.entry),
            field
          );
          return this.derive((next) => {
            next._orderBy = [...next._orderBy ?? [], ...specs];
          });
        }
        return this._addOrderBy(field, direction);
      }
      orderByNumeric(field, direction) {
        return this._addOrderBy(field, direction, { numeric: true });
      }
      orderByCollate(field, direction) {
        return this._addOrderBy(field, direction, { collate: true });
      }
      /**
       * Group rows by the given fields. A grouped query must have a `.return()`
       * projection that selects each of them, and its aggregates, as in
       * `db.select("post").groupBy("author").return((p) => ({ author: p.author, posts: count(p) }))`.
       * It cannot be combined with {@link split}.
       */
      groupBy(...fields) {
        if (fields.length === 0) {
          throw new OrmError("groupBy() needs at least one field");
        }
        this.assertNotSplit("groupBy");
        return this.derive((next) => {
          next._groupBy = fields;
        });
      }
      /**
       * Group all rows into one, for table-wide aggregates. Needs a `.return()`
       * projection of aggregates, such as `count(u)` or `math.mean(u.age)`.
       */
      groupAll() {
        this.assertNotSplit("groupAll");
        return this.derive((next) => {
          next._groupBy = "ALL";
        });
      }
      /**
       * Emit one row per element of the given array fields. SurrealDB does not allow
       * SPLIT and GROUP BY in the same query, so this cannot be combined with
       * {@link groupBy} or {@link groupAll}. Call it before {@link return}.
       */
      split(...fields) {
        if (this._groupBy !== void 0) {
          throw new OrmError(
            "split() cannot be combined with groupBy() or groupAll(): SurrealDB does not allow SPLIT and GROUP in one query"
          );
        }
        if (this._entry) {
          throw new OrmError(
            "split() must come before return(): the projection was typed before the split"
          );
        }
        return this.derive((next) => {
          next._split = fields;
        });
      }
      assertNotSplit(method) {
        if (this._split && this._split.length > 0) {
          throw new OrmError(
            `${method}() cannot be combined with split(): SurrealDB does not allow SPLIT and GROUP in one query`
          );
        }
      }
      fetch(...fields) {
        const currentSchema = this._entry?.[__type] ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
        const resolved = currentSchema instanceof ObjectType ? resolveFetchObject(currentSchema, fields, this[__ctx].orm) : void 0;
        return this.derive((next) => {
          next._fetch = fields;
          if (resolved) next._fetchResolvedType = resolved;
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      displaySubject(ctx) {
        if (typeof this.subject === "string")
          return ctx.var(new import_surrealdb14.Table(this.subject));
        if (Array.isArray(this.subject))
          return this.subject.map((name) => ctx.var(new import_surrealdb14.Table(name))).join(", ");
        if (isWorkable(this.subject)) return this.subject[__display](ctx);
        return ctx.var(this.subject);
      }
      /**
       * The ORDER BY clause. SurrealQL only sorts by field idioms, so an expression
       * term orders by an alias instead, and its SurrealQL is collected into
       * `hoisted` for the projection to compute under that alias.
       */
      displayOrderBy(ctx, hoisted) {
        if (!this._orderBy || this._orderBy.length === 0) return "";
        const orderParts = this._orderBy.map((spec) => {
          let part;
          if (typeof spec.field === "string") {
            part = escapeIdiomPath(spec.field);
          } else if (spec.hoist) {
            const alias = `__order_${hoisted.length}`;
            hoisted.push({ alias, sql: spec.field[__display](ctx) });
            part = alias;
          } else {
            part = spec.field[__display]({
              ...ctx,
              bareRowsOf: this[__ctx].id
            });
          }
          if (spec.collate) part += " COLLATE";
          if (spec.numeric) part += " NUMERIC";
          if (spec.direction) part += ` ${spec.direction}`;
          return part;
        });
        return (
          /* surql */
          ` ORDER BY ${orderParts.join(", ")}`
        );
      }
      /**
       * The projection after `SELECT`. An expression sort is computed beside `*`
       * under its alias and dropped again with OMIT, so it cannot be combined with a
       * return() projection (a VALUE projection has no OMIT to drop the alias from) or
       * with a grouped query (SurrealDB needs the sort key to be a selected field).
       *
       * A grouped or split query has to name its keys as selected fields, which an
       * object `VALUE { … }` cannot do, so its object projection is a field list
       * (`email AS writer, count(true) AS posts`). SurrealDB rejects a grouped query
       * with no projection, and one that does not select each of its keys, so both
       * are reported here as an {@link OrmError}.
       */
      displayProjection(ctx, bare, hoisted) {
        this.assertHoistedSortAllowed(hoisted);
        if (!this._entry) return this.displayUnprojected(hoisted);
        const fields = this._entryFields;
        if (!bare) return (
          /* surql */
          `VALUE ${this._entry[__display](ctx)}`
        );
        const exprs = fields ? fields.map(([, field]) => field[__display](ctx)) : [this._entry[__display](ctx)];
        const keys = this._groupBy === "ALL" ? [] : this._groupBy ?? this._split ?? [];
        const kind = this._groupBy !== void 0 ? "groupBy" : "split";
        for (const key of keys) {
          if (!exprs.includes(escapeIdiomPath(key))) {
            throw new OrmError(
              `${kind}("${key}") needs the return() projection to select "${key}" as a field`
            );
          }
        }
        if (!fields) return (
          /* surql */
          `VALUE ${exprs[0]}`
        );
        return fields.map(([alias], i) => `${exprs[i]} AS ${(0, import_surrealdb14.escapeIdent)(alias)}`).join(", ");
      }
      /** An expression sort is hoisted into a `*` projection, so it cannot be combined with a return() or a grouped query. */
      assertHoistedSortAllowed(hoisted) {
        if (hoisted.length === 0) return;
        if (this._groupBy !== void 0) {
          throw new OrmError(
            "orderBy() with an expression cannot be combined with groupBy() or groupAll(): the sort key must be a selected field. Sort by a field, or by a name the return() projection selects."
          );
        }
        if (this._entry) {
          throw new OrmError(
            "orderBy() with an expression cannot be combined with return(): the sort key would be returned with each row. Sort by a field, or return the value and sort in your code."
          );
        }
      }
      /** The projection of a query with no return(): `*`, with any hoisted sort keys beside it. */
      displayUnprojected(hoisted) {
        if (this._groupBy !== void 0) {
          throw new OrmError(
            "groupBy() and groupAll() need a return() projection of aggregates: SurrealDB cannot group SELECT *"
          );
        }
        if (hoisted.length === 0) return "*";
        const sorts = hoisted.map((h) => `${h.sql} AS ${h.alias}`).join(", ");
        const aliases = hoisted.map((h) => h.alias).join(", ");
        return `*, ${sorts} OMIT ${aliases}`;
      }
      /** The SPLIT and GROUP clauses, which come after WHERE and before ORDER BY. */
      displayGrouping() {
        let clauses = "";
        if (this._split && this._split.length > 0)
          clauses += /* surql */
          ` SPLIT ${this._split.map(escapeIdiomPath).join(", ")}`;
        if (this._groupBy) {
          clauses += this._groupBy === "ALL" ? " GROUP ALL" : (
            /* surql */
            ` GROUP BY ${this._groupBy.map(escapeIdiomPath).join(", ")}`
          );
        }
        return clauses;
      }
      [__display](inp) {
        const grouped = this._groupBy !== void 0;
        const split2 = this._split !== void 0 && this._split.length > 0;
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id,
          bareRowsOf: grouped || split2 ? this[__ctx].id : void 0
        });
        const thing = this.displaySubject(ctx);
        const start = this._start !== void 0 ? ctx.var(this._start) : void 0;
        const limit = this._limit !== void 0 ? ctx.var(this._limit) : void 0;
        const hoisted = [];
        const orderBy = this.displayOrderBy(ctx, hoisted);
        const predicates = this.displayProjection(ctx, grouped || split2, hoisted);
        let query = (
          /* surql */
          `SELECT ${predicates} FROM ${this._only ? "ONLY " : ""}${thing}`
        );
        if (this._filter)
          query += /* surql */
          ` WHERE ${this._filter[__display](ctx)}`;
        query += this.displayGrouping();
        query += orderBy;
        if (limit) query += /* surql */
        ` LIMIT ${limit}`;
        if (start) query += /* surql */
        ` START ${start}`;
        if (this._fetch && this._fetch.length > 0)
          query += /* surql */
          ` FETCH ${this._fetch.map(escapeIdiomPath).join(", ")}`;
        if (this._timeout)
          query += /* surql */
          ` TIMEOUT <duration> ${ctx.var(this._timeout)}`;
        return `(${query})`;
      }
    };
  }
});

// src/query/live.ts
function refuseSearchPredicate(condition, contextId) {
  const sql = condition[__display](displayContext({ contextId }));
  if (!SEARCH_OPERATOR.test(sql.replace(QUOTED, ""))) return;
  throw new OrmError(
    "A live query cannot filter by a full-text match or a KNN predicate, anywhere in the filter. SurrealDB accepts one, but at the top of the filter, alone or inside and(), or() and not(), it never causes a notification. Inside a subquery it did deliver on 3.2.3, but that is untested on other versions, so it is refused there too. Filter by a plain condition, or use select() and refetch when the table changes."
  );
}
var import_surrealdb15, SEARCH_OPERATOR, QUOTED, LiveSubscription, LiveQuery;
var init_live = __esm({
  "src/query/live.ts"() {
    "use strict";
    import_surrealdb15 = require("surrealdb");
    init_error();
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_object_filter();
    init_request();
    init_select();
    init_subject();
    init_utils2();
    SEARCH_OPERATOR = /@\d*(?:,?(?:AND|OR))?@|<\|/;
    QUOTED = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|⟨[^⟩]*⟩/g;
    LiveSubscription = class {
      constructor(inner, mapValue) {
        this.inner = inner;
        this.mapValue = mapValue;
      }
      /**
       * The id of the underlying live subscription. A managed subscription is
       * re-registered when the connection is re-established, which changes its id.
       */
      get id() {
        return this.inner.id;
      }
      /**
       * Whether the subscription is still delivering notifications. It turns
       * `false` once the subscription is killed (by {@link kill}, by the server, or
       * by an aborted request scope) or its session goes away.
       */
      get isAlive() {
        return this.inner.isAlive;
      }
      /**
       * Whether the SDK re-registers this subscription after the connection drops
       * and reconnects. An unmanaged subscription ends silently instead.
       */
      get isManaged() {
        return this.inner.isManaged;
      }
      /**
       * Subscribe to notifications. Returns a function that unsubscribes this
       * handler (it does not kill the subscription — use {@link kill} for that).
       */
      subscribe(handler) {
        if (!this.inner.isAlive) return () => {
        };
        const messages = this[Symbol.asyncIterator]();
        let stopped = false;
        (async () => {
          for await (const message of { [Symbol.asyncIterator]: () => messages }) {
            if (stopped) return;
            handler(message);
          }
        })().catch((error) => {
          if (stopped || !this.inner.isAlive) return;
          queueMicrotask(() => {
            throw error;
          });
        });
        return () => {
          stopped = true;
          messages.return?.(void 0)?.catch(() => {
          });
        };
      }
      /** Async-iterate notifications: `for await (const msg of sub) { … }`. */
      async *[Symbol.asyncIterator]() {
        if (!this.inner.isAlive) return;
        for await (const message of this.inner) {
          yield this.toMessage(message);
        }
      }
      /** Map an SDK notification onto a {@link LiveMessage}, parsing its value. */
      toMessage(message) {
        if (message.action === "KILLED") return { action: "KILLED" };
        return {
          action: message.action,
          recordId: message.recordId,
          value: this.mapValue(message.value)
        };
      }
      /** Kill the live subscription and stop receiving updates. */
      kill() {
        return this.inner.kill();
      }
    };
    LiveQuery = class {
      [__ctx];
      _filter;
      _entry;
      _fetch;
      _fetchResolvedType;
      _diff = false;
      tb;
      subject;
      constructor(orm2, subject) {
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this.subject = subject;
        if (typeof subject === "string") {
          this.tb = subject;
        } else if (isWorkable(subject)) {
          this.tb = subject[__type].tb;
        } else {
          this.tb = String(subject.table);
        }
      }
      get entry() {
        return this._entry?.[__type] ?? this._fetchResolvedType ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
      }
      get [__type]() {
        return this.entry;
      }
      /** Create a shallow clone of this live query. */
      clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
      }
      /**
       * Return a shallow {@link clone} with `mutate` applied. Mirrors
       * `Query.derive`: chaining methods derive a new builder instead of mutating
       * `this`, so a base live query can be safely reused. Mutations must replace
       * mutable fields wholesale rather than mutating them in place.
       */
      derive(mutate) {
        const next = this.clone();
        mutate(next);
        return next;
      }
      return(cb) {
        const tb = actionable({
          [__ctx]: this[__ctx],
          [__type]: this.entry,
          [__display]: ({ contextId }) => {
            return contextId === this[__ctx].id ? "$this" : "$parent";
          }
        });
        const predicable = cb(tb);
        const workable = inheritableIntoWorkable(
          predicable
        );
        const entry = sanitizeWorkable(workable);
        return this.derive((next) => {
          next._entry = entry;
        });
      }
      where(input) {
        const tb = actionable({
          [__ctx]: this[__ctx],
          [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
          [__display]: ({ contextId }) => {
            return contextId === this[__ctx].id ? "$this" : "$parent";
          }
        });
        const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
        if (!condition) return this;
        refuseSearchPredicate(condition, this[__ctx].id);
        const filter = sanitizeWorkable(condition);
        return this.derive((next) => {
          next._filter = andWhere(next._filter, filter);
        });
      }
      /** Remove every `.where()` condition set so far. */
      clearWhere() {
        return this.derive((next) => {
          next._filter = void 0;
        });
      }
      fetch(...fields) {
        const currentSchema = this._entry?.[__type] ?? resolveSubjectSchema(this[__ctx].orm, this.tb);
        const resolved = currentSchema instanceof ObjectType ? resolveFetchObject(currentSchema, fields, this[__ctx].orm) : void 0;
        return this.derive((next) => {
          next._fetch = fields;
          if (resolved) next._fetchResolvedType = resolved;
        });
      }
      /**
       * Receive updates as JSON Patch arrays (`LIVE SELECT DIFF`) instead of full
       * records. Mutually exclusive with a `.return()` projection.
       */
      diff() {
        return this.derive((next) => {
          next._diff = true;
        });
      }
      /** Whether the subject is a single record rather than a table. */
      get isRecordSubject() {
        return typeof this.subject !== "string";
      }
      /**
       * The table a live query reads. SurrealDB rejects `LIVE SELECT ... FROM
       * user:n1` ("Cannot execute LIVE statement using value"), so a record subject
       * selects its table and is filtered by id instead (see {@link recordFilter}).
       */
      displaySubject(ctx) {
        if (typeof this.subject === "string")
          return ctx.var(new import_surrealdb15.Table(this.subject));
        if (this.isRecordSubject && typeof this.tb === "string")
          return ctx.var(new import_surrealdb15.Table(this.tb));
        if (isWorkable(this.subject)) return this.subject[__display](ctx);
        return ctx.var(this.subject);
      }
      /** The `id = …` condition that selects a record subject, if there is one. */
      recordFilter(ctx) {
        if (!this.isRecordSubject || typeof this.tb !== "string") return void 0;
        const id = isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
        return `id = ${id}`;
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const thing = this.displaySubject(ctx);
        const recordFilter = this.recordFilter(ctx);
        const projection = this._diff ? "DIFF" : this._entry ? (
          /* surql */
          `VALUE ${this._entry[__display](ctx)}`
        ) : "*";
        let query = (
          /* surql */
          `LIVE SELECT ${projection} FROM ${thing}`
        );
        if (recordFilter && this._filter)
          query += /* surql */
          ` WHERE ${recordFilter} AND (${this._filter[__display](ctx)})`;
        else if (recordFilter) query += /* surql */
        ` WHERE ${recordFilter}`;
        else if (this._filter)
          query += /* surql */
          ` WHERE ${this._filter[__display](ctx)}`;
        if (this._fetch && this._fetch.length > 0)
          query += /* surql */
          ` FETCH ${this._fetch.map(escapeIdiomPath).join(", ")}`;
        return query;
      }
      /** Render the query as a SurrealQL string. */
      toString() {
        const ctx = displayContext();
        return this[__display](ctx);
      }
      /**
       * The table the SDK can subscribe to on our behalf, or `undefined` when this
       * query needs the unmanaged path.
       *
       * The SDK composes a managed `LIVE SELECT` itself, from a table, an optional
       * `WHERE`, `FETCH` and `DIFF`. It cannot carry a `.return()` projection (an
       * arbitrary expression), and its resource is a table: a record id or a
       * subquery as the subject stays on the unmanaged path.
       */
      get managedResource() {
        if (this._entry || typeof this.subject !== "string") return void 0;
        return new import_surrealdb15.Table(this.subject);
      }
      /** The filter as an SDK expression, which defines its own variables. */
      get managedFilter() {
        const filter = this._filter;
        if (!filter) return void 0;
        const contextId = this[__ctx].id;
        return {
          // Rendering only ever defines variables through `var`.
          toSQL: (ctx) => filter[__display]({ var: ctx.def, variables: {}, contextId })
        };
      }
      /** Register a live query that the SDK keeps alive across reconnects. */
      async registerManaged(resource) {
        let live = this[__ctx].orm.surreal.live(resource);
        const filter = this.managedFilter;
        if (filter) live = live.where(filter);
        if (this._fetch && this._fetch.length > 0) {
          live = live.fetch(...this._fetch.map(escapeIdiomPath));
        }
        if (this._diff) live = live.diff();
        try {
          return await live;
        } catch (error) {
          if (error instanceof import_surrealdb15.LiveSubscriptionError && error.cause !== void 0) {
            throw error.cause;
          }
          throw error;
        }
      }
      /** Register the live query by hand and attach to it, without a restart. */
      async registerUnmanaged() {
        const ctx = displayContext();
        const query = this[__display](ctx);
        const { surreal } = this[__ctx].orm;
        const [uuid2] = await surreal.query(query, ctx.variables);
        return surreal.liveOf(uuid2);
      }
      /** Start the live query and resolve to a typed {@link LiveSubscription}. */
      async execute() {
        const resource = this.managedResource;
        const { surreal } = this[__ctx].orm;
        const inner = await withSdkDiagnosis(
          surreal,
          () => resource ? this.registerManaged(resource) : this.registerUnmanaged()
        );
        const type = this.entry;
        const diff = this._diff;
        const mapValue = (raw) => {
          if (diff) return raw;
          return type.parse(raw);
        };
        return new LiveSubscription(inner, mapValue);
      }
      /**
       * Start the live query and subscribe `handler` in one step. Returns a stop
       * function that unsubscribes the handler and kills the subscription.
       */
      subscribe(handler) {
        return this.execute().then((sub) => {
          const off = sub.subscribe(handler);
          return () => {
            off();
            sub.kill().catch(() => {
            });
          };
        });
      }
      // biome-ignore lint/suspicious/noThenProperty: makes the builder awaitable
      then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
      }
      catch(onRejected) {
        return this.execute().catch(onRejected);
      }
      finally(onFinally) {
        return this.execute().finally(onFinally);
      }
    };
  }
});

// src/query/relate.ts
var import_surrealdb16, RelateQuery;
var init_relate = __esm({
  "src/query/relate.ts"() {
    "use strict";
    import_surrealdb16 = require("surrealdb");
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_abstract();
    init_defaults();
    init_modification_methods();
    init_validate_input();
    RelateQuery = class extends Query {
      constructor(orm2, edge2, from, to) {
        super();
        this.edge = edge2;
        this.from = from;
        this.to = to;
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._lenient = true;
      }
      [__ctx];
      _only = false;
      _set;
      _content;
      _merge;
      _patch;
      _replace;
      _modificationMode;
      _return;
      _timeout;
      get schema() {
        return this[__ctx].orm.tables[this.edge].schema;
      }
      get [__type]() {
        let type;
        if (this._return === "none") {
          type = this._only ? t_exports.option(t_exports.never()) : t_exports.array(t_exports.never());
        } else {
          const row = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
          const element = this._return === "before" ? t_exports.option(row) : row;
          type = this._only ? element : t_exports.array(element);
        }
        return type;
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      /** Set fields on the edge. Fields that are not set are absent from the result. */
      set(data) {
        assertDottedRootsSupplied(data);
        return this.derive((next) => {
          applySet(next, data);
        });
      }
      content(data) {
        return this.derive((next) => {
          applyContent(next, data);
          next._lenient = false;
        });
      }
      merge(data) {
        return this.derive((next) => {
          applyMerge(next, data);
        });
      }
      patch(operations) {
        return this.derive((next) => {
          applyPatch(next, operations);
        });
      }
      /** Replace the edge's data. REPLACE does not apply defaults, so only the given fields are known. */
      replace(data) {
        return this.derive((next) => {
          applyReplace(next, data);
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const record2 = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$this" : "$parent";
            }
          });
          const inheritable = value2(record2);
          const workable = inheritableIntoWorkable(inheritable);
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      validateInput() {
        validateWrite(this[__ctx].orm, this.edge, this.schema, this, "relate");
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const edgeTable = ctx.var(new import_surrealdb16.Table(this.edge));
        let fromStr;
        if (Array.isArray(this.from)) {
          const fromIds = this.from.map((id) => ctx.var(id));
          fromStr = `[${fromIds.join(", ")}]`;
        } else if (isWorkable(this.from)) {
          fromStr = this.from[__display](ctx);
        } else {
          fromStr = ctx.var(this.from);
        }
        let toStr;
        if (Array.isArray(this.to)) {
          const toIds = this.to.map((id) => ctx.var(id));
          toStr = `[${toIds.join(", ")}]`;
        } else if (isWorkable(this.to)) {
          toStr = this.to[__display](ctx);
        } else {
          toStr = ctx.var(this.to);
        }
        let query = (
          /* surql */
          `RELATE ${this._only ? "ONLY " : ""}${fromStr}->${edgeTable}->${toStr}`
        );
        query += displayModificationClause(
          withDefaults(this, schemaDefaults(this.schema)),
          ctx
        );
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/query/update.ts
var import_surrealdb17, UpdateQuery;
var init_update = __esm({
  "src/query/update.ts"() {
    "use strict";
    import_surrealdb17 = require("surrealdb");
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_abstract();
    init_modification_methods();
    init_object_filter();
    init_subject();
    init_utils2();
    init_validate_input();
    UpdateQuery = class extends Query {
      [__ctx];
      _only = false;
      _set;
      _unset;
      _content;
      _merge;
      _patch;
      _replace;
      _modificationMode;
      _filter;
      _return;
      _timeout;
      tb;
      subject;
      constructor(orm2, subject) {
        super();
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._lenient = true;
        this.subject = subject;
        if (typeof subject === "string") {
          this.tb = subject;
        } else if (isWorkable(subject)) {
          this.tb = subject[__type].tb;
        } else {
          this.tb = String(subject.table);
        }
      }
      get schema() {
        return resolveSubjectSchema(this[__ctx].orm, this.tb);
      }
      get [__type]() {
        const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
        return this._only ? schema : t_exports.array(schema);
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      /**
       * Set fields. A SET on an existing record leaves its other fields in place,
       * so those are typed as optional in the result.
       */
      set(data) {
        return this.derive((next) => {
          applySet(next, data);
        });
      }
      /** Remove fields from the record. Removed fields are absent from the result. */
      unset(fields) {
        return this.derive((next) => {
          applyUnset(next, [...fields]);
        });
      }
      /** Replace the record with the given fields, so the other fields are gone. */
      content(data) {
        return this.derive((next) => {
          applyContent(next, data);
        });
      }
      merge(data) {
        return this.derive((next) => {
          applyMerge(next, data);
        });
      }
      patch(operations) {
        return this.derive((next) => {
          applyPatch(next, operations);
        });
      }
      /** Replace the record. The other fields of the record are gone. */
      replace(data) {
        return this.derive((next) => {
          applyReplace(next, data);
        });
      }
      where(input) {
        const tb = actionable({
          [__ctx]: this[__ctx],
          [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
          [__display]: ({ contextId }) => {
            return contextId === this[__ctx].id ? "$this" : "$parent";
          }
        });
        const condition = typeof input === "function" ? input(tb) : whereFromObject(tb, input);
        if (!condition) return this;
        const filter = sanitizeWorkable(condition);
        return this.derive((next) => {
          next._filter = andWhere(next._filter, filter);
        });
      }
      /** Remove every `.where()` condition set so far. */
      clearWhere() {
        return this.derive((next) => {
          next._filter = void 0;
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const tb = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$this" : "$parent";
            }
          });
          const predicable = value2(tb);
          const workable = inheritableIntoWorkable(
            predicable
          );
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      validateInput() {
        validateWrite(
          this[__ctx].orm,
          String(this.tb),
          this.schema,
          this,
          "update"
        );
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const thing = typeof this.subject === "string" ? ctx.var(new import_surrealdb17.Table(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
        let query = (
          /* surql */
          `UPDATE ${this._only ? "ONLY " : ""}${thing}`
        );
        query += displayModificationClause(this, ctx);
        if (this._filter)
          query += /* surql */
          ` WHERE ${this._filter[__display](ctx)}`;
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/query/upsert.ts
var import_surrealdb18, UpsertQuery;
var init_upsert = __esm({
  "src/query/upsert.ts"() {
    "use strict";
    import_surrealdb18 = require("surrealdb");
    init_types();
    init_actionable();
    init_display();
    init_inheritable();
    init_workable();
    init_abstract();
    init_modification_methods();
    init_subject();
    init_utils2();
    init_validate_input();
    UpsertQuery = class extends Query {
      [__ctx];
      _only = false;
      _set;
      _content;
      _merge;
      _patch;
      _replace;
      _modificationMode;
      _filter;
      _return;
      _timeout;
      tb;
      subject;
      constructor(orm2, subject) {
        super();
        this[__ctx] = {
          orm: orm2,
          id: /* @__PURE__ */ Symbol()
        };
        this._lenient = true;
        this.subject = subject;
        if (typeof subject === "string") {
          this.tb = subject;
        } else if (isWorkable(subject)) {
          this.tb = subject[__type].tb;
        } else {
          this.tb = String(subject.table);
        }
      }
      get schema() {
        return resolveSubjectSchema(this[__ctx].orm, this.tb);
      }
      get [__type]() {
        const schema = this._return && typeof this._return !== "string" ? this._return[__type] : this.schema;
        return this._only ? schema : t_exports.array(schema);
      }
      only() {
        return this.derive((next) => {
          next._only = true;
        });
      }
      /**
       * Set fields. A SET leaves the fields it does not set in place, or absent if
       * the record is created, so those are typed as optional in the result.
       */
      set(data) {
        return this.derive((next) => {
          applySet(next, data);
        });
      }
      /** Replace the record with the given fields, so the other fields are gone. */
      content(data) {
        return this.derive((next) => {
          applyContent(next, data);
        });
      }
      merge(data) {
        return this.derive((next) => {
          applyMerge(next, data);
        });
      }
      patch(operations) {
        return this.derive((next) => {
          applyPatch(next, operations);
        });
      }
      /** Replace the record. The other fields of the record are gone. */
      replace(data) {
        return this.derive((next) => {
          applyReplace(next, data);
        });
      }
      where(cb) {
        const tb = actionable({
          [__ctx]: this[__ctx],
          [__type]: resolveSubjectSchema(this[__ctx].orm, this.tb),
          [__display]: ({ contextId }) => {
            return contextId === this[__ctx].id ? "$this" : "$parent";
          }
        });
        const filter = sanitizeWorkable(cb(tb));
        return this.derive((next) => {
          next._filter = andWhere(next._filter, filter);
        });
      }
      /** Remove every `.where()` condition set so far. */
      clearWhere() {
        return this.derive((next) => {
          next._filter = void 0;
        });
      }
      return(value2) {
        if (typeof value2 === "function") {
          const tb = actionable({
            [__ctx]: this[__ctx],
            [__type]: this.schema,
            [__display]: ({ contextId }) => {
              return contextId === this[__ctx].id ? "$this" : "$parent";
            }
          });
          const predicable = value2(tb);
          const workable = inheritableIntoWorkable(
            predicable
          );
          const ret = sanitizeWorkable(workable);
          return this.derive((next) => {
            next._return = ret;
          });
        }
        const mode = value2;
        return this.derive((next) => {
          next._return = mode;
          next._skipParse = mode === "diff";
        });
      }
      timeout(duration3) {
        return this.derive((next) => {
          next._timeout = duration3;
        });
      }
      validateInput() {
        validateWrite(
          this[__ctx].orm,
          String(this.tb),
          this.schema,
          this,
          "update"
        );
      }
      [__display](inp) {
        const ctx = displayContext({
          ...inp,
          contextId: this[__ctx].id
        });
        const thing = typeof this.subject === "string" ? ctx.var(new import_surrealdb18.Table(this.subject)) : isWorkable(this.subject) ? this.subject[__display](ctx) : ctx.var(this.subject);
        let query = (
          /* surql */
          `UPSERT ${this._only ? "ONLY " : ""}${thing}`
        );
        query += displayModificationClause(this, ctx);
        if (this._filter)
          query += /* surql */
          ` WHERE ${this._filter[__display](ctx)}`;
        if (this._return) {
          if (typeof this._return === "string") {
            query += /* surql */
            ` RETURN ${this._return.toUpperCase()}`;
          } else {
            query += /* surql */
            ` RETURN VALUE ${this._return[__display](ctx)}`;
          }
        }
        if (this._timeout) {
          query += /* surql */
          ` TIMEOUT ${ctx.var(this._timeout)}`;
        }
        return `(${query})`;
      }
    };
  }
});

// src/schema/ddl/table-ddl.ts
function patchTableDdl(schema, patch2) {
  const next = Object.assign(
    Object.create(Object.getPrototypeOf(schema)),
    schema
  );
  const draft = { ...schema.ddl };
  patch2(draft);
  next.ddl = draft;
  return next;
}
var init_table_ddl = __esm({
  "src/schema/ddl/table-ddl.ts"() {
    "use strict";
  }
});

// src/schema/edge.ts
function edge(from, tb, to, fields) {
  return new EdgeSchema(from, tb, to, fields);
}
var EdgeSchema;
var init_edge = __esm({
  "src/schema/edge.ts"() {
    "use strict";
    init_types();
    init_validation();
    init_table_ddl();
    EdgeSchema = class {
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
      validate(value2) {
        return this.schema.validate(value2);
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
      changefeed(duration3, includeOriginal = false) {
        return patchTableDdl(this, (d) => {
          d.changefeed = { duration: duration3, includeOriginal };
        });
      }
      /** Attach a `COMMENT` to the edge table. */
      comment(text2) {
        return patchTableDdl(this, (d) => {
          d.comment = text2;
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
  }
});

// src/schema/lookup.ts
function ensureNode(lookup, node) {
  if (!lookup.to[node]) lookup.to[node] = [];
  if (!lookup.from[node]) lookup.from[node] = [];
}
function addEdgeConnections(lookup, schema) {
  const { tb: via } = schema;
  for (const from of asArray(schema.from)) {
    lookup.to[from].push(via);
    lookup.from[via].push(from);
  }
  for (const to of asArray(schema.to)) {
    lookup.to[via].push(to);
    lookup.from[to].push(via);
  }
}
function createLookupFromSchemas(schemas) {
  const lookup = {
    to: {},
    from: {}
  };
  for (const schema of schemas) {
    if (schema instanceof EdgeSchema) {
      for (const from of asArray(schema.from)) ensureNode(lookup, from);
      ensureNode(lookup, schema.tb);
      for (const to of asArray(schema.to)) ensureNode(lookup, to);
    } else {
      ensureNode(lookup, schema.tb);
    }
  }
  for (const schema of schemas) {
    if (schema instanceof EdgeSchema) {
      addEdgeConnections(lookup, schema);
    }
  }
  return lookup;
}
var asArray;
var init_lookup = __esm({
  "src/schema/lookup.ts"() {
    "use strict";
    init_edge();
    asArray = (x) => typeof x === "string" ? [x] : x;
  }
});

// src/schema/table.ts
function table(tb, fields, model) {
  return new TableSchema(tb, fields, model);
}
var import_surrealdb19, TableSchema;
var init_table = __esm({
  "src/schema/table.ts"() {
    "use strict";
    import_surrealdb19 = require("surrealdb");
    init_error();
    init_types();
    init_classes();
    init_utils();
    init_actionable();
    init_model();
    init_validation();
    init_table_ddl();
    init_model_type();
    TableSchema = class _TableSchema {
      constructor(tb, _fields, model, _computed = {}) {
        this.tb = tb;
        this._fields = _fields;
        this.model = model;
        this._computed = _computed;
        if (model) registerModelClass(model);
      }
      /** Schema metadata used to generate `DEFINE TABLE`. */
      ddl = {};
      /**
       * Add a computed field: a read-only field whose value SurrealDB derives from
       * an expression each time the record is read (`DEFINE FIELD … COMPUTED`,
       * SurrealDB 3.0+). It is part of the row type returned by selects, but cannot
       * be written: it is left out of the input types of `create`, `update`,
       * `upsert`, `insert` and `relate`.
       *
       * The field must exist in the database before it can be read. Create it with
       * {@link Orm.defineComputed}, or run {@link TableSchema.computedStatements}
       * in a migration.
       *
       * @param name - The field name.
       * @param type - The type of the computed value.
       * @param expression - Builds the expression from the row and the ORM.
       *
       * @example
       * ```ts
       * const user = table("user", { name: t.string() }).computed(
       *   "postCount",
       *   t.number(),
       *   (user, db) =>
       *     db
       *       .select("post")
       *       .where((p) => p.author.eq(user.id))
       *       .return((p) => p.id)
       *       .wrap()
       *       .len(),
       * );
       * ```
       */
      computed(name, type, expression) {
        if (name === "id" || name in this._fields || name in this._computed) {
          throw new OrmError(
            `Field "${name}" is already defined on table "${this.tb}"`
          );
        }
        const next = new _TableSchema(
          this.tb,
          { ...this._fields, [name]: type },
          this.model,
          {
            ...this._computed,
            [name]: { type, expression }
          }
        );
        next.ddl = this.ddl;
        return next;
      }
      /** The names of this table's computed fields. */
      get computedFields() {
        return Object.keys(this._computed);
      }
      /**
       * Render a `DEFINE FIELD OVERWRITE … COMPUTED …` statement for each computed
       * field. Values are inlined, because a `DEFINE` statement cannot take
       * parameters.
       *
       * @param orm - The ORM the expressions are built against.
       */
      /**
       * The computed fields written as raw SurrealQL, which need no ORM to render
       * and so take part in schema generation and migrations like any other field.
       */
      rawComputedStatements(overwrite = false) {
        return Object.entries(this._computed).filter(([, def]) => def.expression instanceof SurqlExpression).map(([name, def]) => [
          name,
          `DEFINE FIELD ${overwrite ? "OVERWRITE " : ""}${(0, import_surrealdb19.escapeIdent)(name)} ON TABLE ${(0, import_surrealdb19.escapeIdent)(this.tb)} COMPUTED ${def.expression.sql.trim()};`
        ]);
      }
      // biome-ignore lint/suspicious/noExplicitAny: accepts an ORM over any tables
      computedStatements(orm2) {
        return Object.entries(this._computed).map(([name, def]) => {
          if (def.expression instanceof SurqlExpression) {
            return `DEFINE FIELD OVERWRITE ${(0, import_surrealdb19.escapeIdent)(name)} ON TABLE ${(0, import_surrealdb19.escapeIdent)(this.tb)} COMPUTED ${def.expression.sql.trim()}`;
          }
          const id = /* @__PURE__ */ Symbol();
          const row = actionable({
            [__ctx]: { orm: orm2, id },
            [__type]: this.schema,
            [__display]: ({ contextId }) => contextId === id ? "$this" : "$parent"
          });
          const expression = def.expression(row, orm2);
          const sql = expression[__display](
            displayContext({ var: inlineValue, variables: {}, contextId: id })
          );
          return `DEFINE FIELD OVERWRITE ${(0, import_surrealdb19.escapeIdent)(name)} ON TABLE ${(0, import_surrealdb19.escapeIdent)(this.tb)} COMPUTED (${sql})`;
        });
      }
      // A table is immutable (`computed()` returns a new one), so what it derives
      // from its fields is built once. Rebuilding it on every access made each
      // query rebuild a whole object type per property lookup.
      _fieldsCache;
      _schemaCache;
      get fields() {
        if (!this._fieldsCache) {
          this._fieldsCache = {
            ...this._fields,
            ..."id" in this._fields ? {} : { id: t_exports.record(this.tb) }
          };
        }
        return this._fieldsCache;
      }
      type = void 0;
      get schema() {
        if (!this._schemaCache) {
          this._schemaCache = this.model ? new ModelType(this.fields, this.model) : t_exports.object(this.fields);
        }
        return this._schemaCache;
      }
      /** Type-guard that checks whether a value matches this table's schema. */
      validate(value2) {
        return this.schema.validate(value2);
      }
      safeParse(data, options = {}) {
        const mode = options.mode ?? "create";
        const result = safeParseWith(
          this.schema,
          data,
          mode,
          this.tb,
          ["id"],
          this.computedFields
        );
        if (result.success && mode === "row" && this.model) {
          return {
            success: true,
            data: Object.assign(
              Object.create(this.model.prototype),
              result.data
            )
          };
        }
        return result;
      }
      parse(data, options = {}) {
        const result = this.safeParse(data, options);
        if (!result.success) throw result.error;
        return result.data;
      }
      // -------------------------------------------------------------------------
      // Schema modifiers
      //
      // As with the field modifiers, each returns a clone rather than mutating —
      // a table definition is routinely shared between several `orm()` instances.
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
      /** Discard every record written to this table (`DROP`). */
      drop() {
        return patchTableDdl(this, (d) => {
          d.drop = true;
        });
      }
      /**
       * Set the table's `PERMISSIONS`: a SurrealQL clause as a string, or a rule per
       * operation. A rule is `"full"`, `"none"`, SurrealQL, or a typed condition
       * built with `where()`, checked against this table's fields.
       *
       * An operation left out takes SurrealDB's default for a table, which is
       * `NONE`.
       *
       * @example
       * ```ts
       * table("post", { owner: t.record("user") }).permissions({
       *   select: "full",
       *   update: where((row, { auth }) => row.owner.eq(auth.id)),
       * });
       * ```
       */
      permissions(rules) {
        return patchTableDdl(this, (d) => {
          d.permissions = rules;
        });
      }
      /** Retain a change feed for `duration` (e.g. `"3d"`). */
      changefeed(duration3, includeOriginal = false) {
        return patchTableDdl(this, (d) => {
          d.changefeed = { duration: duration3, includeOriginal };
        });
      }
      /** Make this a computed view over another table (`AS SELECT …`). */
      view(selectStatement) {
        return patchTableDdl(this, (d) => {
          d.view = selectStatement;
        });
      }
      /** Attach a `COMMENT` to the table. */
      comment(text2) {
        return patchTableDdl(this, (d) => {
          d.comment = text2;
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
    };
  }
});

// src/schema/orm.ts
function typeFromValue(value2) {
  if (isWorkable(value2)) return value2[__type];
  if (value2 instanceof import_surrealdb20.RecordId) return t_exports.record(String(value2.table));
  if (value2 instanceof Date) return t_exports.date();
  if (value2 instanceof import_surrealdb20.Duration) return t_exports.duration();
  if (value2 instanceof import_surrealdb20.Uuid) return t_exports.uuid();
  if (value2 instanceof import_surrealdb20.GeometryPoint) return t_exports.point();
  if (value2 === null) return t_exports.null();
  if (value2 === void 0) return t_exports.none();
  switch (typeof value2) {
    case "string":
      return t_exports.string();
    case "number":
      return t_exports.number();
    case "boolean":
      return t_exports.bool();
    case "object": {
      if (Array.isArray(value2)) {
        if (value2.length === 0) return t_exports.array(t_exports.never());
        return t_exports.array(value2.map(typeFromValue));
      }
      const fields = Object.fromEntries(
        Object.entries(value2).map(([key, field]) => [
          key,
          typeFromValue(field)
        ])
      );
      return t_exports.object(fields);
    }
    default:
      throw new OrmError(`Cannot infer a SurrealDB type for ${typeof value2}`);
  }
}
function isSchemaMap(value2) {
  return typeof value2 === "object" && value2 !== null && !(value2 instanceof TableSchema) && !(value2 instanceof EdgeSchema);
}
function orm(surreal, ...args) {
  const tables2 = args.length === 1 && isSchemaMap(args[0]) ? Object.values(args[0]) : args;
  const mapped = tables2.reduce((acc, table2) => {
    acc[table2.tb] = table2;
    return acc;
  }, {});
  const lookup = createLookupFromSchemas(tables2);
  return new Orm(surreal, mapped, lookup);
}
var import_surrealdb20, Orm;
var init_orm = __esm({
  "src/schema/orm.ts"() {
    "use strict";
    import_surrealdb20 = require("surrealdb");
    init_error();
    init_api();
    init_batch();
    init_create();
    init_delete();
    init_insert();
    init_live();
    init_relate();
    init_select();
    init_update();
    init_upsert();
    init_types();
    init_utils();
    init_actionable();
    init_validation();
    init_edge();
    init_lookup();
    init_table();
    Orm = class _Orm {
      constructor(surreal, tables2, lookup, options = {}) {
        this.surreal = surreal;
        this.tables = tables2;
        this.lookup = lookup;
        this.validation = options.validate ?? false;
      }
      /**
       * Whether queries check the data they write against the table schema before
       * sending it. Off by default; see {@link Orm.validated}.
       */
      validation;
      /**
       * A view of this ORM in which every query that writes data (create, insert,
       * update, upsert, relate) first checks it against the table schema, and
       * throws a {@link ValidationError} listing every failing field instead of
       * sending it. Like {@link Orm.withSignal}, it shares the connection and
       * changes nothing else. A single query can still opt out with
       * `.validated(false)`.
       *
       * @example
       * ```ts
       * const db = orm(surreal, user).validated();
       * await db.create("user").content({ name: 42 }); // throws ValidationError
       * ```
       */
      validated(enabled = true) {
        return new _Orm(this.surreal, this.tables, this.lookup, {
          validate: enabled
        });
      }
      /**
       * Wrap a raw JavaScript value as an actionable SurrealQL expression. Record
       * ids keep their table type, so graph traversal can start directly from a
       * value: `db.value(new RecordId("person", "tobie")).out("authored")`.
       */
      value(value2) {
        const ctx = {
          orm: this,
          id: /* @__PURE__ */ Symbol()
        };
        return actionable(
          intoWorkable(
            ctx,
            typeFromValue(value2),
            value2
          )
        );
      }
      /**
       * Create (or overwrite) the computed fields of the registered tables in the
       * database, with `DEFINE FIELD OVERWRITE … COMPUTED …` (SurrealDB 3.0+). Pass
       * table names to restrict it to those tables. Safe to run repeatedly.
       *
       * @example
       * ```ts
       * await db.defineComputed();
       * ```
       */
      async defineComputed(...tables2) {
        const names = tables2.length > 0 ? tables2 : Object.keys(this.tables);
        const statements = names.flatMap((name) => {
          const schema = this.tables[name];
          return schema instanceof TableSchema ? schema.computedStatements(this) : [];
        });
        if (statements.length === 0) return;
        await this.surreal.query(`${statements.join(";\n")};`);
      }
      // Method
      select(tb, id) {
        if (tb instanceof import_surrealdb20.RecordId) return new SelectQuery(this, tb);
        if (Array.isArray(tb)) return new SelectQuery(this, tb);
        if (isWorkable(tb))
          return new SelectQuery(this, tb);
        if (id === void 0) return new SelectQuery(this, tb);
        return new SelectQuery(this, new import_surrealdb20.RecordId(tb, id));
      }
      // Method
      live(tb, id) {
        if (tb instanceof import_surrealdb20.RecordId) return new LiveQuery(this, tb);
        if (isWorkable(tb))
          return new LiveQuery(this, tb);
        if (id === void 0) return new LiveQuery(this, tb);
        return new LiveQuery(this, new import_surrealdb20.RecordId(tb, id));
      }
      // Method
      create(tb, id) {
        return new CreateQuery(this, tb, id);
      }
      // Method
      insert(tb, data) {
        return new InsertQuery(this, tb, data);
      }
      // Method
      update(tb, id) {
        if (tb instanceof import_surrealdb20.RecordId) return new UpdateQuery(this, tb);
        if (isWorkable(tb))
          return new UpdateQuery(this, tb);
        if (id === void 0) return new UpdateQuery(this, tb);
        return new UpdateQuery(this, new import_surrealdb20.RecordId(tb, id));
      }
      // Method
      delete(tb, id) {
        if (tb instanceof import_surrealdb20.RecordId) return new DeleteQuery(this, tb);
        if (isWorkable(tb))
          return new DeleteQuery(this, tb);
        if (id === void 0) return new DeleteQuery(this, tb);
        return new DeleteQuery(this, new import_surrealdb20.RecordId(tb, id));
      }
      // Method
      upsert(tb, id) {
        if (tb instanceof import_surrealdb20.RecordId) return new UpsertQuery(this, tb);
        if (isWorkable(tb))
          return new UpsertQuery(this, tb);
        if (id === void 0) return new UpsertQuery(this, tb);
        return new UpsertQuery(this, new import_surrealdb20.RecordId(tb, id));
      }
      // Method
      relate(edge2, from, to) {
        const edgeSchema = this.tables[edge2];
        if (!(edgeSchema instanceof EdgeSchema)) {
          throw new OrmError(`"${edge2}" is not an edge table`);
        }
        return new RelateQuery(this, edge2, from, to);
      }
      /**
       * Run a user-defined SurrealDB function and return the typed result.
       *
       * @param fn - A function callable created with {@link fn}.
       * @param args - Positional arguments matching the function's parameter types.
       *   Omit for functions that take no parameters.
       * @returns The typed result of the function execution.
       *
       * @example
       * ```ts
       * const greet = fn("greet", [t.string()], t.string());
       * const result = await db.run(greet, ["world"]); // typed as string
       * ```
       */
      async run(fn2, args) {
        const schema = fn2.schema;
        if (this.validation) {
          throwIfInvalid(
            checkArgs(schema.params, args ?? []),
            void 0,
            `arguments for fn::${schema.name}`
          );
        }
        const result = await this.surreal.run(
          `fn::${schema.name}`,
          args
        );
        return schema.returns.parse(result);
      }
      /**
       * Create a type-safe API client for user-defined API endpoints.
       *
       * @param endpoints - One or more {@link ApiEndpointSchema} definitions
       *   created with {@link api}.
       * @returns An {@link ApiClient} with typed HTTP methods.
       *
       * @example
       * ```ts
       * const usersEndpoint = api("/users", {
       *   get: { response: t.array(user.schema) },
       *   post: { request: t.object({ name: t.string() }), response: user.schema },
       * });
       *
       * const client = db.api(usersEndpoint);
       * const response = await client.get("/users");
       * ```
       */
      api(...endpoints) {
        return new ApiClient(this.surreal, endpoints, this.validation);
      }
      /**
       * Create a view of this ORM in which every query is abandoned when `signal`
       * aborts, which is how the work of a request handler is tied to the signal of
       * the request without passing it to every query:
       *
       * ```ts
       * const scoped = db.withSignal(request.signal);
       * const users = await scoped.select("user");
       * ```
       *
       * The view shares the connection and session of this ORM and changes neither,
       * so it is cheap to make one per request. Batches, transactions and live
       * subscriptions made through it are bound to the signal as well; a live
       * subscription is killed when the signal aborts.
       *
       * Aborting means "stop waiting", and nothing more: a write that was already
       * sent may or may not have been applied.
       */
      withSignal(signal) {
        return new _Orm(
          this.surreal.withSignal(signal),
          this.tables,
          this.lookup,
          { validate: this.validation }
        );
      }
      /**
       * Combine multiple queries into a single request that is applied atomically:
       * either every query takes effect or none does. Resolves to a tuple with the
       * result of each query.
       *
       * The batch runs as a stateless transaction, so it works over HTTP as well as
       * WebSockets, and can be configured with `.retry()`, `.signal()` and
       * `.requestTimeout()`.
       *
       * @param queries - The queries to batch together.
       * @returns A {@link BatchQuery} that can be awaited.
       */
      // biome-ignore lint/suspicious/noExplicitAny: required for generic constraint flexibility
      batch(...queries) {
        return new BatchQuery(this.surreal, queries);
      }
      // Method
      async transaction(cb) {
        const { Transaction: Tx } = await Promise.resolve().then(() => (init_transaction(), transaction_exports));
        const surrealTx = await this.surreal.beginTransaction();
        const tx = new Tx(surrealTx, this.tables, this.lookup, {
          validate: this.validation
        });
        if (!cb) return tx;
        try {
          const result = await cb(tx);
          await tx.commit();
          return result;
        } catch (e) {
          await tx.cancel();
          throw e;
        }
      }
    };
  }
});

// src/query/transaction.ts
var transaction_exports = {};
__export(transaction_exports, {
  Transaction: () => Transaction
});
var Transaction;
var init_transaction = __esm({
  "src/query/transaction.ts"() {
    "use strict";
    init_error();
    init_orm();
    Transaction = class _Transaction extends Orm {
      _transaction;
      constructor(transaction, tables2, lookup, options = {}) {
        super(transaction, tables2, lookup, options);
        this._transaction = transaction;
      }
      /**
       * A handle on this same transaction in which every query is also bound to
       * `signal`. It commits and cancels the transaction just as this one does.
       *
       * Only queries are bound to the signal: `commit()` and `cancel()` are not, so
       * a request that is being abandoned cannot leave the outcome of a commit in
       * doubt.
       */
      withSignal(signal) {
        return new _Transaction(
          this._transaction.withSignal(signal),
          this.tables,
          this.lookup,
          { validate: this.validation }
        );
      }
      /** A handle on this same transaction with input validation switched on or off. */
      validated(enabled = true) {
        return new _Transaction(this._transaction, this.tables, this.lookup, {
          validate: enabled
        });
      }
      /**
       * Not available inside a transaction: a batch is itself an atomic
       * transaction, and transactions cannot be nested. Run the queries on the
       * transaction directly instead.
       */
      // biome-ignore lint/suspicious/noExplicitAny: mirrors the signature of Orm.batch
      batch(..._queries) {
        throw new OrmError(
          "batch() cannot be used inside a transaction: a batch is already atomic, and transactions cannot be nested. Run the queries on the transaction instead."
        );
      }
      /**
       * Commit this transaction to the datastore, applying all changes.
       */
      async commit() {
        await this._transaction.commit();
      }
      /**
       * Cancel this transaction, discarding all changes.
       */
      async cancel() {
        await this._transaction.cancel();
      }
    };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ANY: () => ANY,
  AbstractType: () => AbstractType,
  AnyType: () => AnyType,
  ApiClient: () => ApiClient,
  ApiEndpointSchema: () => ApiEndpointSchema,
  ArrayType: () => ArrayType,
  BatchQuery: () => BatchQuery,
  BigIntType: () => BigIntType,
  BoolType: () => BoolType,
  BytesType: () => BytesType,
  CreateQuery: () => CreateQuery,
  DateType: () => DateType,
  DecimalType: () => DecimalType,
  DeleteQuery: () => DeleteQuery,
  DuplicateSurrealError: () => DuplicateSurrealError,
  DurationType: () => DurationType,
  EdgeSchema: () => EdgeSchema,
  FloatType: () => FloatType,
  FunctionSchema: () => FunctionSchema,
  GeometryType: () => GeometryType,
  GraphType: () => GraphType,
  InsertQuery: () => InsertQuery,
  IntType: () => IntType,
  LiteralType: () => LiteralType,
  LiveQuery: () => LiveQuery,
  LiveSubscription: () => LiveSubscription,
  NeverType: () => NeverType,
  NoneType: () => NoneType,
  NullType: () => NullType,
  NumberType: () => NumberType,
  ObjectType: () => ObjectType,
  OptionType: () => OptionType,
  Orm: () => Orm,
  OrmError: () => OrmError,
  PointType: () => PointType,
  QueryStore: () => QueryStore,
  RangeType: () => RangeType,
  RecordType: () => RecordType,
  RelateQuery: () => RelateQuery,
  SelectQuery: () => SelectQuery,
  SetType: () => SetType,
  Store: () => Store,
  StringType: () => StringType,
  SurqlExpression: () => SurqlExpression,
  TableSchema: () => TableSchema,
  TableWriter: () => TableWriter,
  Transaction: () => Transaction,
  TypeParseError: () => TypeParseError,
  UnionType: () => UnionType,
  UpdateQuery: () => UpdateQuery,
  UpsertQuery: () => UpsertQuery,
  UuidType: () => UuidType,
  ValidationError: () => ValidationError,
  WhereRule: () => WhereRule,
  __ctx: () => __ctx,
  __display: () => __display,
  __type: () => __type,
  access: () => access,
  analyzer: () => analyzer,
  and: () => and,
  api: () => api,
  applyOverlay: () => applyOverlay,
  authenticatedAs: () => authenticatedAs,
  bytes: () => bytes2,
  config: () => config,
  count: () => count,
  createStore: () => createStore,
  crypto: () => crypto,
  defineEvent: () => defineEvent,
  defineField: () => defineField,
  defineIndex: () => defineIndex,
  defineSchema: () => defineSchema,
  defineTable: () => defineTable,
  displayContext: () => displayContext,
  duration: () => duration2,
  edge: () => edge,
  encoding: () => encoding,
  expr: () => expr,
  flattenFields: () => flattenFields,
  fn: () => fn,
  generateSchema: () => generateSchema,
  geo: () => geo,
  http: () => http,
  indexedDbStorage: () => indexedDbStorage,
  math: () => math,
  memoryStorage: () => memoryStorage,
  meta: () => meta,
  not: () => not,
  object: () => object2,
  or: () => or,
  orm: () => orm,
  param: () => param,
  parse: () => parse,
  printSurqlType: () => printSurqlType,
  rand: () => rand,
  resolveFetchObject: () => resolveFetchObject,
  schemaStatements: () => schemaStatements,
  search: () => search,
  sequence: () => sequence,
  session: () => session,
  set_: () => set_,
  sleep: () => sleep,
  storedFunction: () => storedFunction,
  t: () => t_exports,
  table: () => table,
  time: () => time,
  toSurql: () => toSurql,
  type_: () => type_,
  value: () => value,
  vector: () => vector,
  where: () => where
});
module.exports = __toCommonJS(src_exports);
init_error();

// src/functions/standalone/and.ts
init_utils();
init_filters();
function and(...conditions) {
  return joiningFilter(conditions[0][__ctx], "AND", ...conditions);
}

// src/functions/standalone/bytes.ts
init_types();

// src/functions/standalone/internal.ts
init_utils();
init_actionable();
function extractContext(source) {
  if (isWorkable(source)) {
    return source[__ctx];
  }
  return source;
}
function standaloneFn(source, type, fn2, ...params) {
  const ctx = extractContext(source);
  return actionable({
    [__ctx]: ctx,
    [__type]: type,
    [__display](ctx2) {
      const vars = params.map((p) => p[__display](ctx2)).join(", ");
      return vars ? `${fn2}(${vars})` : `${fn2}()`;
    }
  });
}
function standaloneConst(source, type, name) {
  const ctx = extractContext(source);
  return actionable({
    [__ctx]: ctx,
    [__type]: type,
    [__display]() {
      return name;
    }
  });
}

// src/functions/standalone/bytes.ts
var bytes2 = {
  len(value2) {
    return standaloneFn(value2, t_exports.number(), "bytes::len", value2);
  }
};

// src/functions/standalone/count.ts
init_types();
init_utils();
function count(source, value2) {
  const ctx = extractContext(source);
  const counted = value2 ?? {
    [__ctx]: ctx,
    [__type]: t_exports.bool(),
    [__display]: () => "true"
  };
  return standaloneFn(source, t_exports.number(), "count", counted);
}

// src/functions/standalone/crypto.ts
init_types();
var crypto = {
  // Hashing functions
  blake3(value2) {
    return standaloneFn(value2, t_exports.string(), "crypto::blake3", value2);
  },
  joaat(value2) {
    return standaloneFn(value2, t_exports.number(), "crypto::joaat", value2);
  },
  md5(value2) {
    return standaloneFn(value2, t_exports.string(), "crypto::md5", value2);
  },
  sha1(value2) {
    return standaloneFn(value2, t_exports.string(), "crypto::sha1", value2);
  },
  sha256(value2) {
    return standaloneFn(value2, t_exports.string(), "crypto::sha256", value2);
  },
  sha512(value2) {
    return standaloneFn(value2, t_exports.string(), "crypto::sha512", value2);
  },
  // Password functions
  argon2Compare(hash, pass) {
    return standaloneFn(hash, t_exports.bool(), "crypto::argon2::compare", hash, pass);
  },
  argon2Generate(pass) {
    return standaloneFn(pass, t_exports.string(), "crypto::argon2::generate", pass);
  },
  bcryptCompare(hash, pass) {
    return standaloneFn(hash, t_exports.bool(), "crypto::bcrypt::compare", hash, pass);
  },
  bcryptGenerate(pass) {
    return standaloneFn(pass, t_exports.string(), "crypto::bcrypt::generate", pass);
  },
  pbkdf2Compare(hash, pass) {
    return standaloneFn(hash, t_exports.bool(), "crypto::pbkdf2::compare", hash, pass);
  },
  pbkdf2Generate(pass) {
    return standaloneFn(pass, t_exports.string(), "crypto::pbkdf2::generate", pass);
  },
  scryptCompare(hash, pass) {
    return standaloneFn(hash, t_exports.bool(), "crypto::scrypt::compare", hash, pass);
  },
  scryptGenerate(pass) {
    return standaloneFn(pass, t_exports.string(), "crypto::scrypt::generate", pass);
  }
};

// src/functions/standalone/duration.ts
init_types();
var duration2 = {
  // Extraction functions
  days(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::days", value2);
  },
  hours(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::hours", value2);
  },
  micros(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::micros", value2);
  },
  millis(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::millis", value2);
  },
  mins(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::mins", value2);
  },
  nanos(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::nanos", value2);
  },
  secs(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::secs", value2);
  },
  weeks(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::weeks", value2);
  },
  years(value2) {
    return standaloneFn(value2, t_exports.number(), "duration::years", value2);
  },
  // Factory functions
  fromDays(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_days", value2);
  },
  fromHours(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_hours", value2);
  },
  fromMicros(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_micros", value2);
  },
  fromMillis(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_millis", value2);
  },
  fromMins(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_mins", value2);
  },
  fromNanos(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_nanos", value2);
  },
  fromSecs(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_secs", value2);
  },
  fromWeeks(value2) {
    return standaloneFn(value2, t_exports.duration(), "duration::from_weeks", value2);
  },
  // Constant
  max(source) {
    return standaloneConst(source, t_exports.duration(), "duration::max");
  }
};

// src/functions/standalone/encoding.ts
init_types();
var encoding = {
  base64Decode(value2) {
    return standaloneFn(value2, t_exports.string(), "encoding::base64::decode", value2);
  },
  base64Encode(value2) {
    return standaloneFn(value2, t_exports.string(), "encoding::base64::encode", value2);
  }
};

// src/functions/standalone/geo.ts
var import_surrealdb5 = require("surrealdb");
init_types();
init_utils();
function isCoordinateType(type) {
  return type instanceof ArrayType && Array.isArray(type.schema) && type.schema.length === 2 && type.schema.every((item) => item instanceof NumberType);
}
function normalizePoint(source, value2) {
  if (isWorkable(value2)) {
    if (value2[__type] instanceof PointType)
      return value2;
    if (isCoordinateType(value2[__type]))
      return standaloneFn(value2, t_exports.point(), "type::point", value2);
  }
  if (value2 instanceof import_surrealdb5.GeometryPoint)
    return intoWorkable(source[__ctx], t_exports.point(), value2);
  const coordinates = intoWorkable(
    source[__ctx],
    t_exports.array([t_exports.number(), t_exports.number()]),
    value2
  );
  return standaloneFn(source, t_exports.point(), "type::point", coordinates);
}
var geo = {
  area(value2) {
    return standaloneFn(value2, t_exports.number(), "geo::area", value2);
  },
  bearing(p1, p2) {
    return standaloneFn(p1, t_exports.number(), "geo::bearing", p1, p2);
  },
  centroid(value2) {
    return standaloneFn(value2, t_exports.string(), "geo::centroid", value2);
  },
  // Point normalization is intentionally limited to distance; the other geo
  // functions retain their existing generic signatures until their point types
  // are specified.
  distance(...args) {
    const [p1, p2] = args;
    const source = isWorkable(p1) ? p1 : p2;
    const point1 = normalizePoint(source, p1);
    const point2 = normalizePoint(source, p2);
    return standaloneFn(point1, t_exports.number(), "geo::distance", point1, point2);
  },
  hashDecode(value2) {
    return standaloneFn(value2, t_exports.string(), "geo::hash::decode", value2);
  },
  hashEncode(value2) {
    return standaloneFn(value2, t_exports.string(), "geo::hash::encode", value2);
  },
  hashEncodeAccuracy(value2, accuracy) {
    return standaloneFn(
      value2,
      t_exports.string(),
      "geo::hash::encode",
      value2,
      accuracy
    );
  }
};

// src/functions/standalone/http.ts
init_types();
var http = {
  head(url) {
    return standaloneFn(url, t_exports.string(), "http::head", url);
  },
  get(url) {
    return standaloneFn(url, t_exports.string(), "http::get", url);
  },
  put(url, body) {
    return standaloneFn(url, t_exports.string(), "http::put", url, body);
  },
  post(url, body) {
    return standaloneFn(url, t_exports.string(), "http::post", url, body);
  },
  patch(url, body) {
    return standaloneFn(url, t_exports.string(), "http::patch", url, body);
  },
  del(url) {
    return standaloneFn(url, t_exports.string(), "http::delete", url);
  }
};

// src/functions/standalone/math.ts
init_types();
var math = {
  // Aggregation functions (single array param)
  max(arr) {
    return standaloneFn(arr, t_exports.number(), "math::max", arr);
  },
  min(arr) {
    return standaloneFn(arr, t_exports.number(), "math::min", arr);
  },
  mean(arr) {
    return standaloneFn(arr, t_exports.number(), "math::mean", arr);
  },
  median(arr) {
    return standaloneFn(arr, t_exports.number(), "math::median", arr);
  },
  sum(arr) {
    return standaloneFn(arr, t_exports.number(), "math::sum", arr);
  },
  product(arr) {
    return standaloneFn(arr, t_exports.number(), "math::product", arr);
  },
  stddev(arr) {
    return standaloneFn(arr, t_exports.number(), "math::stddev", arr);
  },
  variance(arr) {
    return standaloneFn(arr, t_exports.number(), "math::variance", arr);
  },
  mode(arr) {
    return standaloneFn(arr, t_exports.number(), "math::mode", arr);
  },
  spread(arr) {
    return standaloneFn(arr, t_exports.number(), "math::spread", arr);
  },
  interquartile(arr) {
    return standaloneFn(arr, t_exports.number(), "math::interquartile", arr);
  },
  midhinge(arr) {
    return standaloneFn(arr, t_exports.number(), "math::midhinge", arr);
  },
  trimean(arr) {
    return standaloneFn(arr, t_exports.number(), "math::trimean", arr);
  },
  // Aggregation functions with extra param
  bottom(arr, count2) {
    return standaloneFn(arr, t_exports.number(), "math::bottom", arr, count2);
  },
  top(arr, count2) {
    return standaloneFn(arr, t_exports.number(), "math::top", arr, count2);
  },
  nearestrank(arr, percentile) {
    return standaloneFn(arr, t_exports.number(), "math::nearestrank", arr, percentile);
  },
  percentile(arr, percentile) {
    return standaloneFn(arr, t_exports.number(), "math::percentile", arr, percentile);
  },
  // Constants
  e(source) {
    return standaloneConst(source, t_exports.number(), "math::e");
  },
  pi(source) {
    return standaloneConst(source, t_exports.number(), "math::pi");
  },
  tau(source) {
    return standaloneConst(source, t_exports.number(), "math::tau");
  },
  inf(source) {
    return standaloneConst(source, t_exports.number(), "math::inf");
  },
  negInf(source) {
    return standaloneConst(source, t_exports.number(), "math::neg_inf");
  },
  frac1Pi(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_1_pi");
  },
  frac1Sqrt2(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_1_sqrt_2");
  },
  frac2Pi(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_2_pi");
  },
  frac2SqrtPi(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_2_sqrt_pi");
  },
  fracPi2(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_pi_2");
  },
  fracPi3(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_pi_3");
  },
  fracPi4(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_pi_4");
  },
  fracPi6(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_pi_6");
  },
  fracPi8(source) {
    return standaloneConst(source, t_exports.number(), "math::frac_pi_8");
  },
  ln10(source) {
    return standaloneConst(source, t_exports.number(), "math::ln_10");
  },
  ln2(source) {
    return standaloneConst(source, t_exports.number(), "math::ln_2");
  },
  log102(source) {
    return standaloneConst(source, t_exports.number(), "math::log10_2");
  },
  log10E(source) {
    return standaloneConst(source, t_exports.number(), "math::log10_e");
  },
  log210(source) {
    return standaloneConst(source, t_exports.number(), "math::log2_10");
  },
  log2E(source) {
    return standaloneConst(source, t_exports.number(), "math::log2_e");
  },
  sqrt2(source) {
    return standaloneConst(source, t_exports.number(), "math::sqrt_2");
  }
};

// src/functions/standalone/meta.ts
init_types();
var meta = {
  id(value2) {
    return standaloneFn(value2, t_exports.string(), "meta::id", value2);
  },
  table(value2) {
    return standaloneFn(value2, t_exports.string(), "meta::table", value2);
  },
  tb(value2) {
    return standaloneFn(value2, t_exports.string(), "meta::tb", value2);
  }
};

// src/functions/standalone/not.ts
init_types();
function not(value2) {
  return standaloneFn(value2, t_exports.bool(), "not", value2);
}

// src/functions/standalone/object.ts
init_types();
var object2 = {
  entries(value2) {
    return standaloneFn(value2, t_exports.array(t_exports.string()), "object::entries", value2);
  },
  fromEntries(value2) {
    return standaloneFn(value2, t_exports.string(), "object::from_entries", value2);
  },
  keys(value2) {
    return standaloneFn(value2, t_exports.array(t_exports.string()), "object::keys", value2);
  },
  len(value2) {
    return standaloneFn(value2, t_exports.number(), "object::len", value2);
  },
  values(value2) {
    return standaloneFn(value2, t_exports.array(t_exports.string()), "object::values", value2);
  }
};

// src/functions/standalone/or.ts
init_utils();
init_filters();
function or(...conditions) {
  return joiningFilter(conditions[0][__ctx], "OR", ...conditions);
}

// src/functions/standalone/parse.ts
init_types();
var parse = {
  emailHost(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::email::host", value2);
  },
  emailUser(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::email::user", value2);
  },
  urlDomain(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::domain", value2);
  },
  urlFragment(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::fragment", value2);
  },
  urlHost(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::host", value2);
  },
  urlPath(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::path", value2);
  },
  urlPort(value2) {
    return standaloneFn(value2, t_exports.number(), "parse::url::port", value2);
  },
  urlQuery(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::query", value2);
  },
  urlScheme(value2) {
    return standaloneFn(value2, t_exports.string(), "parse::url::scheme", value2);
  }
};

// src/functions/standalone/rand.ts
init_types();
var rand = {
  rand(source) {
    return standaloneFn(source, t_exports.number(), "rand");
  },
  bool(source) {
    return standaloneFn(source, t_exports.bool(), "rand::bool");
  },
  randEnum(...values) {
    return standaloneFn(values[0], t_exports.string(), "rand::enum", ...values);
  },
  float(source) {
    return standaloneFn(source, t_exports.number(), "rand::float");
  },
  floatRange(min, max) {
    return standaloneFn(min, t_exports.number(), "rand::float", min, max);
  },
  guid(source) {
    return standaloneFn(source, t_exports.string(), "rand::guid");
  },
  int(source) {
    return standaloneFn(source, t_exports.number(), "rand::int");
  },
  intRange(min, max) {
    return standaloneFn(min, t_exports.number(), "rand::int", min, max);
  },
  string(source) {
    return standaloneFn(source, t_exports.string(), "rand::string");
  },
  time(source) {
    return standaloneFn(source, t_exports.date(), "rand::time");
  },
  uuid(source) {
    return standaloneFn(source, t_exports.uuid(), "rand::uuid");
  },
  ulid(source) {
    return standaloneFn(source, t_exports.string(), "rand::ulid");
  }
};

// src/functions/standalone/search.ts
init_types();
init_utils();
init_utils3();
var span = t_exports.object({ s: t_exports.number(), e: t_exports.number() });
var search = {
  /** `search::analyze(analyzer, value)`: the tokens `value` is analysed into. */
  analyze(analyzer2, value2) {
    return standaloneFn(
      analyzer2,
      t_exports.array(t_exports.string()),
      "search::analyze",
      analyzer2,
      value2
    );
  },
  /**
   * `search::highlight(prefix, suffix, ref)`: the text of the field matched by
   * the `@ref@` clause, with each matched term wrapped in `prefix`/`suffix`.
   *
   * `fieldRef` supplies the query context. The match is identified by `ref`,
   * which must equal the N of a `.search(value, N)` clause in the same
   * statement.
   */
  highlight(fieldRef, prefix, suffix, ref) {
    const ctx = fieldRef[__ctx];
    return standaloneFn(
      fieldRef,
      t_exports.string(),
      "search::highlight",
      intoWorkable(ctx, t_exports.string(), prefix),
      intoWorkable(ctx, t_exports.string(), suffix),
      literalWorkable(ctx, t_exports.number(), String(matchRef(ref)))
    );
  },
  /**
   * `search::offsets(ref)`: the matched spans of the `@ref@` clause, keyed by
   * field. `fieldRef` supplies the query context; see {@link search.highlight}.
   */
  offsets(fieldRef, ref) {
    const ctx = fieldRef[__ctx];
    return standaloneFn(
      fieldRef,
      t_exports.object({}),
      "search::offsets",
      literalWorkable(ctx, t_exports.number(), String(matchRef(ref)))
    );
  },
  /**
   * `search::score(ref)`: the BM25 relevance of the `@ref@` clause. `fieldRef`
   * supplies the query context; see {@link search.highlight}.
   */
  score(fieldRef, ref) {
    const ctx = fieldRef[__ctx];
    return standaloneFn(
      fieldRef,
      t_exports.number(),
      "search::score",
      literalWorkable(ctx, t_exports.number(), String(matchRef(ref)))
    );
  }
};

// src/functions/standalone/session.ts
init_types();
var session = {
  ac(source) {
    return standaloneFn(source, t_exports.option(t_exports.string()), "session::ac");
  },
  db(source) {
    return standaloneFn(source, t_exports.option(t_exports.string()), "session::db");
  },
  id(source) {
    return standaloneFn(source, t_exports.uuid(), "session::id");
  },
  ip(source) {
    return standaloneFn(source, t_exports.string(), "session::ip");
  },
  ns(source) {
    return standaloneFn(source, t_exports.option(t_exports.string()), "session::ns");
  },
  origin(source) {
    return standaloneFn(source, t_exports.option(t_exports.string()), "session::origin");
  },
  rd(source) {
    return standaloneFn(source, t_exports.option(t_exports.record()), "session::rd");
  },
  token(source) {
    return standaloneFn(source, t_exports.option(t_exports.object({})), "session::token");
  }
};

// src/functions/standalone/set.ts
init_types();
init_utils();
var set_ = {
  difference(a, b) {
    return standaloneFn(a, a[__type], "set::difference", a, b);
  },
  intersect(a, b) {
    return standaloneFn(a, a[__type], "set::intersect", a, b);
  },
  len(value2) {
    return standaloneFn(value2, t_exports.number(), "set::len", value2);
  },
  union(a, b) {
    return standaloneFn(a, a[__type], "set::union", a, b);
  }
};

// src/functions/standalone/sleep.ts
init_types();
function sleep(duration3) {
  return standaloneFn(duration3, t_exports.string(), "sleep", duration3);
}

// src/functions/standalone/time.ts
init_types();
var time = {
  // Functions
  now(source) {
    return standaloneFn(source, t_exports.date(), "time::now");
  },
  timezone(source) {
    return standaloneFn(source, t_exports.string(), "time::timezone");
  },
  // Constants
  epoch(source) {
    return standaloneConst(source, t_exports.date(), "time::epoch");
  },
  minimum(source) {
    return standaloneConst(source, t_exports.date(), "time::minimum");
  },
  maximum(source) {
    return standaloneConst(source, t_exports.date(), "time::maximum");
  },
  // Conversion functions
  fromMillis(ms) {
    return standaloneFn(ms, t_exports.date(), "time::from_millis", ms);
  },
  fromMicros(us) {
    return standaloneFn(us, t_exports.date(), "time::from_micros", us);
  },
  fromNanos(ns) {
    return standaloneFn(ns, t_exports.date(), "time::from_nanos", ns);
  },
  fromSecs(s) {
    return standaloneFn(s, t_exports.date(), "time::from_secs", s);
  },
  fromUnix(s) {
    return standaloneFn(s, t_exports.date(), "time::from_unix", s);
  },
  fromUlid(ulid) {
    return standaloneFn(ulid, t_exports.date(), "time::from_ulid", ulid);
  },
  fromUuid(uuid2) {
    return standaloneFn(uuid2, t_exports.date(), "time::from_uuid", uuid2);
  },
  // Aggregation functions
  timeMin(arr) {
    return standaloneFn(arr, t_exports.date(), "time::min", arr);
  },
  timeMax(arr) {
    return standaloneFn(arr, t_exports.date(), "time::max", arr);
  }
};

// src/functions/standalone/type.ts
init_types();
var type_ = {
  // Casting functions
  array(value2) {
    return standaloneFn(value2, t_exports.array(t_exports.string()), "type::array", value2);
  },
  bool(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::bool", value2);
  },
  datetime(value2) {
    return standaloneFn(value2, t_exports.date(), "type::datetime", value2);
  },
  float(value2) {
    return standaloneFn(value2, t_exports.number(), "type::float", value2);
  },
  int(value2) {
    return standaloneFn(value2, t_exports.number(), "type::int", value2);
  },
  point(value2) {
    return standaloneFn(value2, t_exports.point(), "type::point", value2);
  },
  number(value2) {
    return standaloneFn(value2, t_exports.number(), "type::number", value2);
  },
  string(value2) {
    return standaloneFn(value2, t_exports.string(), "type::string", value2);
  },
  of(value2) {
    return standaloneFn(value2, t_exports.string(), "type::of", value2);
  },
  table(value2) {
    return standaloneFn(value2, t_exports.string(), "type::table", value2);
  },
  uuid(value2) {
    return standaloneFn(value2, t_exports.string(), "type::uuid", value2);
  },
  // Type check functions
  isArray(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_array", value2);
  },
  isBool(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_bool", value2);
  },
  isBytes(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_bytes", value2);
  },
  isCollection(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_collection", value2);
  },
  isDatetime(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_datetime", value2);
  },
  isDecimal(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_decimal", value2);
  },
  isDuration(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_duration", value2);
  },
  isFloat(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_float", value2);
  },
  isGeometry(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_geometry", value2);
  },
  isInt(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_int", value2);
  },
  isLine(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_line", value2);
  },
  isNone(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_none", value2);
  },
  isNull(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_null", value2);
  },
  isMultiline(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_multiline", value2);
  },
  isMultipoint(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_multipoint", value2);
  },
  isMultipolygon(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_multipolygon", value2);
  },
  isNumber(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_number", value2);
  },
  isObject(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_object", value2);
  },
  isPoint(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_point", value2);
  },
  isPolygon(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_polygon", value2);
  },
  isRange(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_range", value2);
  },
  isRecord(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_record", value2);
  },
  isString(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_string", value2);
  },
  isUuid(value2) {
    return standaloneFn(value2, t_exports.bool(), "type::is_uuid", value2);
  }
};

// src/functions/standalone/value.ts
init_types();
var value = {
  diff(a, b) {
    return standaloneFn(a, t_exports.string(), "value::diff", a, b);
  },
  patch(value2, diff) {
    return standaloneFn(value2, t_exports.string(), "value::patch", value2, diff);
  }
};

// src/functions/standalone/vector.ts
init_types();
init_utils();
function vectorFn(type, fn2, ...args) {
  const source = args.find((arg) => isWorkable(arg));
  if (!source) {
    throw new TypeError(
      `${fn2}() needs at least one workable argument to bind the query context; wrap literal arrays with db.value() when every argument is a literal`
    );
  }
  const ctx = source[__ctx];
  const params = args.map(
    (arg) => isWorkable(arg) ? arg : intoWorkable(ctx, t_exports.array(t_exports.number()), arg)
  );
  return standaloneFn(source, type, fn2, ...params);
}
var vectorType = t_exports.array(t_exports.number());
var vector = {
  add(...args) {
    return vectorFn(vectorType, "vector::add", ...args);
  },
  angle(...args) {
    return vectorFn(t_exports.number(), "vector::angle", ...args);
  },
  cross(...args) {
    return vectorFn(vectorType, "vector::cross", ...args);
  },
  divide(...args) {
    return vectorFn(vectorType, "vector::divide", ...args);
  },
  dot(...args) {
    return vectorFn(t_exports.number(), "vector::dot", ...args);
  },
  magnitude(a) {
    return standaloneFn(a, t_exports.number(), "vector::magnitude", a);
  },
  multiply(...args) {
    return vectorFn(vectorType, "vector::multiply", ...args);
  },
  normalize(a) {
    return standaloneFn(a, vectorType, "vector::normalize", a);
  },
  project(...args) {
    return vectorFn(vectorType, "vector::project", ...args);
  },
  subtract(...args) {
    return vectorFn(vectorType, "vector::subtract", ...args);
  },
  // Distance functions
  /**
   * The distance the KNN operator computed for the row in the same query
   * (`vector::distance::knn()`). Valid only in a query with a `knn()` predicate.
   */
  distanceKnn(source) {
    return standaloneFn(source, t_exports.number(), "vector::distance::knn");
  },
  distanceChebyshev(...args) {
    return vectorFn(t_exports.number(), "vector::distance::chebyshev", ...args);
  },
  distanceEuclidean(...args) {
    return vectorFn(t_exports.number(), "vector::distance::euclidean", ...args);
  },
  distanceHamming(...args) {
    return vectorFn(t_exports.number(), "vector::distance::hamming", ...args);
  },
  distanceMahalanobis(...args) {
    return vectorFn(t_exports.number(), "vector::distance::mahalanobis", ...args);
  },
  distanceManhattan(...args) {
    return vectorFn(t_exports.number(), "vector::distance::manhattan", ...args);
  },
  distanceMinkowski(a, b, p) {
    return vectorFn(t_exports.number(), "vector::distance::minkowski", a, b, p);
  },
  // Similarity functions
  similarityCosine(...args) {
    return vectorFn(t_exports.number(), "vector::similarity::cosine", ...args);
  },
  similarityJaccard(...args) {
    return vectorFn(t_exports.number(), "vector::similarity::jaccard", ...args);
  },
  similarityPearson(...args) {
    return vectorFn(t_exports.number(), "vector::similarity::pearson", ...args);
  },
  similaritySpearman(...args) {
    return vectorFn(t_exports.number(), "vector::similarity::spearman", ...args);
  }
};

// src/index.ts
init_api();
init_batch();
init_create();
init_delete();
init_insert();
init_live();
init_relate();
init_select();
init_transaction();
init_update();
init_upsert();

// src/schema/api.ts
var ApiEndpointSchema = class {
  constructor(path, methods) {
    this.path = path;
    this.methods = methods;
  }
};
function api(path, methods) {
  return new ApiEndpointSchema(path, methods);
}

// src/schema/ddl/define.ts
init_edge();

// src/schema/ddl/syntax.ts
var import_surrealdb21 = require("surrealdb");
var PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function ident(name) {
  return PLAIN.test(name) ? name : (0, import_surrealdb21.escapeIdent)(name);
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
function quote(value2, mark = "'") {
  const text2 = value2.replaceAll("\\", "\\\\");
  if (mark === "'" && value2.includes("'") && !value2.includes('"')) {
    return `"${text2}"`;
  }
  return `${mark}${text2.split(mark).join(`\\${mark}`)}${mark}`;
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
init_classes();
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
  const count2 = index.fields?.length ?? 0;
  if (count2 <= 1) return;
  throw new Error(
    `Index '${index.name}' is ${kind} over ${count2} columns. SurrealDB accepts exactly one column for these; define one index per column.`
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
var import_surrealdb22 = require("surrealdb");
init_error();
init_types();
init_utils();
init_actionable();

// src/schema/ddl/condition.ts
var JOIN = /^ (AND|OR) /;
function simplifyCondition(condition) {
  return simplify(condition.trim()).text;
}
function simplify(text2) {
  const { operands, joins } = split(text2);
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
function split(text2) {
  const operands = [];
  const joins = [];
  let start = 0;
  for (const { i, char, depth } of unquoted(text2)) {
    if (i < start || depth !== 0 || char !== " ") continue;
    const join2 = JOIN.exec(text2.slice(i, i + 5));
    if (!join2) continue;
    operands.push(text2.slice(start, i).trim());
    joins.push(join2[1]);
    start = i + join2[0].length;
  }
  operands.push(text2.slice(start).trim());
  return { operands, joins };
}
function isWrapped(text2) {
  return text2.startsWith("(") && closing(text2, 0) === text2.length - 1;
}
function closing(text2, open) {
  for (const { i, char, depth } of unquoted(text2.slice(open))) {
    if (char === ")" && depth === 0) return open + i;
  }
  return -1;
}
function* unquoted(text2) {
  let depth = 0;
  for (let i = 0; i < text2.length; i++) {
    const char = text2[i];
    if (QUOTES.includes(char)) {
      i = endOfQuote(text2, i);
      continue;
    }
    if (char === ")") depth--;
    yield { i, char, depth };
    if (char === "(") depth++;
  }
}
var QUOTES = ["'", '"', "`"];
function endOfQuote(text2, open) {
  for (let i = open + 1; i < text2.length; i++) {
    if (text2[i] === "\\") i++;
    else if (text2[i] === text2[open]) return i;
  }
  return text2.length;
}
function collapse(text2) {
  for (let i = 0; i < text2.length - 1; i++) {
    if (text2[i] !== "(" || text2[i + 1] !== "(") continue;
    const outer = closing(text2, i);
    if (outer !== -1 && closing(text2, i + 1) === outer - 1) {
      return collapse(
        text2.slice(0, i) + text2.slice(i + 1, outer) + text2.slice(outer + 1)
      );
    }
  }
  return text2;
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
function isWhereRule(value2) {
  return value2 instanceof WhereRule;
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
function literal2(value2) {
  if (value2 instanceof import_surrealdb22.RecordId) return `(${value2.toString()})`;
  return typeof value2 === "string" ? stringLiteral(value2) : inlineValue(value2);
}
function stringLiteral(value2) {
  const quoted = JSON.stringify(value2);
  if (value2.includes("'")) return quoted;
  const body = quoted.slice(1, -1).replace(/\\\\|\\"/g, (pair) => pair === '\\"' ? '"' : pair);
  return `'${body}'`;
}
function renderWhere(rule, scope, env) {
  const tables2 = { ...env.tables };
  for (const table2 of [rule.auth, ...rule.related]) {
    if (table2) tables2[table2.tb] = table2;
  }
  const id = /* @__PURE__ */ Symbol();
  const ctx = { orm: { tables: tables2 }, id };
  const row = actionable({
    [__ctx]: ctx,
    [__type]: tables2[env.tb]?.schema ?? t_exports.object({}),
    [__display]: () => "$this"
  });
  const field = (name) => {
    const value2 = variable(ctx, name, t_exports.any());
    return scope === "field" ? value2 : unavailable(scope, name);
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
init_classes();
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
    const value2 = type.value;
    return typeof value2 === "string" ? quote(value2) : String(value2);
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
function tableList(tables2) {
  return (Array.isArray(tables2) ? tables2 : [String(tables2)]).map(ident).join(" | ");
}
function literal3(value2, expression = false) {
  if (typeof value2 === "string") {
    return expression ? value2 : quote(value2, "'");
  }
  if (value2 === null) return "NULL";
  if (value2 === void 0) return "NONE";
  if (value2 instanceof Date) return `d'${value2.toISOString()}'`;
  if (value2 instanceof Set) {
    return `<set>[${[...value2].map((member) => literal3(member)).join(", ")}]`;
  }
  if (Array.isArray(value2) || typeof value2 === "object") {
    return JSON.stringify(value2);
  }
  return String(value2);
}

// src/schema/ddl/entities.ts
init_error();
function analyzer(name, options) {
  return {
    kind: "analyzer",
    name,
    key: name,
    previousNames: options.previousNames,
    define: ({ overwrite } = {}) => {
      const parts = ["DEFINE ANALYZER"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(name, "TOKENIZERS", upper(options.tokenizers));
      if (options.filters?.length) {
        parts.push("FILTERS", upper(options.filters));
      }
      if (options.comment) parts.push("COMMENT", quote(options.comment));
      return `${parts.join(" ")};`;
    },
    remove: (key = name) => `REMOVE ANALYZER ${key};`
  };
}
function upper(values) {
  return values.map((value2) => value2.toUpperCase()).join(", ");
}
function param(name, options) {
  const bare = name.replace(/^\$/, "");
  return {
    kind: "param",
    name: bare,
    key: bare,
    previousNames: options.previousNames,
    define: ({ overwrite } = {}) => {
      const parts = ["DEFINE PARAM"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(`$${bare}`, "VALUE", options.value);
      if (options.comment) parts.push("COMMENT", quote(options.comment));
      return `${parts.join(" ")};`;
    },
    remove: (key = bare) => `REMOVE PARAM $${key.replace(/^\$/, "")};`
  };
}
function storedFunction(name, options) {
  const full = name.startsWith("fn::") ? name : `fn::${name}`;
  return {
    kind: "function",
    name: full,
    // INFO FOR DB keys functions by their bare name
    key: full.replace(/^fn::/, ""),
    previousNames: options.previousNames,
    define: ({ overwrite } = {}) => {
      const args = (options.args ?? []).map(([argName, type]) => `$${argName.replace(/^\$/, "")}: ${type}`).join(", ");
      const parts = ["DEFINE FUNCTION"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(`${full}(${args})`);
      if (options.returns) parts.push("->", options.returns);
      parts.push(`{ ${options.body.trim()} }`);
      if (options.permissions) parts.push("PERMISSIONS", options.permissions);
      if (options.comment) parts.push("COMMENT", quote(options.comment));
      return `${parts.join(" ")};`;
    },
    remove: (key = full) => `REMOVE FUNCTION ${key.startsWith("fn::") ? key : `fn::${key}`};`
  };
}
function sequence(name, options = {}) {
  return {
    kind: "sequence",
    name,
    key: name,
    define: ({ overwrite } = {}) => {
      const parts = ["DEFINE SEQUENCE"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(
        name,
        "BATCH",
        String(options.batch ?? 1e3),
        "START",
        String(options.start ?? 0)
      );
      return `${parts.join(" ")};`;
    },
    remove: (key = name) => `REMOVE SEQUENCE ${key};`
  };
}
var BEARER_DURATION = {
  grant: "4w2d",
  token: "1h",
  session: "NONE"
};
function access(name, options) {
  const type = options.type ?? "RECORD";
  if (type !== "BEARER" && options.duration?.grant !== void 0) {
    throw new OrmError(
      `Access ${name} is a ${type} access, and a grant duration only applies to a BEARER one. Remove it from the duration.`
    );
  }
  const recordJwt = type === "RECORD" ? options.jwt : void 0;
  const opaque = type === "RECORD" && !(recordJwt?.url && !recordJwt.key) || type === "JWT" && options.url === void 0;
  return {
    kind: "access",
    name,
    key: name,
    previousNames: options.previousNames,
    opaque,
    define: ({ overwrite } = {}) => {
      const parts = ["DEFINE ACCESS"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(name, "ON DATABASE TYPE", type);
      if (type === "RECORD") parts.push(...recordClauses(options));
      if (type === "JWT")
        parts.push(...jwtClauses(options));
      if (type === "BEARER") {
        parts.push("FOR", options.for);
      }
      const durations = durationClauses(options, type);
      if (durations) parts.push("DURATION", durations);
      if (options.comment) parts.push("COMMENT", quote(options.comment));
      return `${parts.join(" ")};`;
    },
    remove: (key = name) => `REMOVE ACCESS ${key} ON DATABASE;`
  };
}
function recordClauses(options) {
  const record2 = options;
  const parts = [];
  if (record2.jwt) {
    parts.push("WITH JWT", ...jwtClauses({ type: "JWT", ...record2.jwt }));
  }
  for (const [clause, query] of [
    ["SIGNUP", record2.signup],
    ["SIGNIN", record2.signin],
    ["AUTHENTICATE", record2.authenticate]
  ]) {
    if (query) parts.push(clause, wrapClause(query));
  }
  return parts;
}
function wrapClause(query) {
  const body = query.trim().replace(/;\s*$/, "");
  const block = /;/.test(body) || /^(LET|IF|RETURN|THROW|FOR|BEGIN)\b/i.test(body);
  return block ? `{ ${body}; }` : `(${body})`;
}
function jwtClauses(options) {
  if (options.url) return ["URL", quote(options.url)];
  const parts = ["ALGORITHM", options.algorithm ?? "HS512"];
  if (options.key) parts.push("KEY", quote(options.key));
  if (options.issuerKey)
    parts.push("WITH ISSUER KEY", quote(options.issuerKey));
  return parts;
}
function durationClauses(options, type) {
  const { duration: duration3 } = options;
  const parts = [];
  if (type === "JWT" && options.url) {
    return `FOR SESSION ${duration3?.session ?? "NONE"}`;
  }
  if (type === "RECORD" && options.jwt) {
    return `FOR TOKEN ${duration3?.token ?? "1h"}, FOR SESSION ${duration3?.session ?? "NONE"}`;
  }
  if (type === "BEARER") {
    parts.push(`FOR GRANT ${duration3?.grant ?? BEARER_DURATION.grant}`);
    parts.push(`FOR TOKEN ${duration3?.token ?? BEARER_DURATION.token}`);
    parts.push(`FOR SESSION ${duration3?.session ?? BEARER_DURATION.session}`);
    return parts.join(", ");
  }
  if (duration3?.token) parts.push(`FOR TOKEN ${duration3.token}`);
  if (duration3?.session) parts.push(`FOR SESSION ${duration3.session}`);
  return parts.join(", ");
}
var CONFIG_KEYS = { GRAPHQL: "GraphQL", API: "API" };
function config(kind, options = {}) {
  return {
    kind: "config",
    name: kind,
    key: CONFIG_KEYS[kind],
    define: ({ overwrite } = {}) => {
      const parts = ["DEFINE CONFIG"];
      if (overwrite) parts.push("OVERWRITE");
      parts.push(kind);
      if (kind === "GRAPHQL") {
        parts.push("TABLES", exposure(options.tables));
        parts.push("FUNCTIONS", exposure(options.functions));
      } else if (options.permissions) {
        parts.push("PERMISSIONS", options.permissions);
      }
      return `${parts.join(" ")};`;
    },
    remove: (key = kind) => `REMOVE CONFIG ${key === "GraphQL" ? "GRAPHQL" : key};`
  };
}
function exposure(value2) {
  if (value2 === void 0 || value2 === "AUTO") return "AUTO";
  if (value2 === "NONE") return "NONE";
  return `INCLUDE ${value2.join(", ")}`;
}

// src/schema/ddl/generate.ts
function generateSchema(orm2, options = {}) {
  const overwrite = options.mode !== "if-not-exists";
  const statements = [];
  const skipped = [];
  for (const schema of Object.values(orm2.tables)) {
    statements.push(
      ...schemaStatements(schema, {
        overwrite: true,
        tables: orm2.tables
      }).map((s) => retarget(s, overwrite))
    );
    statements.push(...computedStatements(orm2, schema, overwrite));
    skip(schema, skipped);
  }
  return { statements, skipped };
}
function retarget(statement, overwrite) {
  return overwrite ? statement : {
    ...statement,
    sql: statement.sql.replace(" OVERWRITE ", " IF NOT EXISTS ")
  };
}
function computedStatements(orm2, schema, overwrite) {
  if (!("computedStatements" in schema)) return [];
  return schema.computedStatements(orm2).map((sql) => ({
    kind: "field",
    name: `${schema.tb}.${sql.match(/FIELD (?:OVERWRITE|IF NOT EXISTS) (\S+) ON/)?.[1] ?? "?"}`,
    sql: `${overwrite ? sql : sql.replace("OVERWRITE", "IF NOT EXISTS")};`
  }));
}
function skip(schema, into) {
  const computed = new Set(
    "computedFields" in schema ? schema.computedFields : []
  );
  for (const [name, type] of Object.entries(
    schema._fields
  )) {
    if (computed.has(name)) continue;
    const fn2 = type._default;
    if (typeof fn2 === "function") {
      into.push({
        path: `${schema.tb}.${name}`,
        reason: "its default is a function, which only the client can run; use a value or expr()"
      });
    }
  }
}
function toSurql(schema) {
  return `${schema.statements.map((s) => s.sql).join("\n")}
`;
}

// src/schema/index.ts
init_edge();

// src/schema/function.ts
var FunctionSchema = class {
  constructor(name, params, returns) {
    this.name = name;
    this.params = params;
    this.returns = returns;
  }
};
function fn(name, params, returns) {
  const schema = new FunctionSchema(name, params, returns);
  const callable = (source, ...args) => {
    return standaloneFn(
      source,
      returns,
      `fn::${name}`,
      ...args
    );
  };
  callable.schema = schema;
  return callable;
}

// src/schema/index.ts
init_orm();
init_table();
init_traversal2();

// src/store/codec.ts
var import_surrealdb23 = require("surrealdb");
var TAG = "$t";
function encode(value2) {
  return JSON.stringify(toJson(value2, "value"));
}
function decode(text2) {
  return fromJson(JSON.parse(text2));
}
function toJson(value2, path) {
  if (value2 === void 0) return { [TAG]: "undefined" };
  if (typeof value2 === "number") {
    return Number.isFinite(value2) ? value2 : { [TAG]: "number", v: String(value2) };
  }
  if (value2 === null || typeof value2 === "string" || typeof value2 === "boolean")
    return value2;
  if (Array.isArray(value2))
    return value2.map((v, i) => toJson(v, `${path}[${i}]`));
  if (value2 instanceof Set)
    return {
      [TAG]: "set",
      v: [...value2].map((v, i) => toJson(v, `${path}[${i}]`))
    };
  if (typeof value2 === "object" && Object.getPrototypeOf(value2) === Object.prototype) {
    return plainToJson(value2, path);
  }
  return valueToJson(value2, path);
}
function valueToJson(value2, path) {
  if (typeof value2 === "bigint")
    return { [TAG]: "bigint", v: value2.toString() };
  if (value2 instanceof Date) return { [TAG]: "date", v: value2.toISOString() };
  if (value2 instanceof import_surrealdb23.RecordId) {
    return {
      [TAG]: "rid",
      table: String(value2.table),
      id: toJson(value2.id, path)
    };
  }
  if (value2 instanceof import_surrealdb23.Uuid) return { [TAG]: "uuid", v: value2.toString() };
  if (value2 instanceof import_surrealdb23.Duration) return { [TAG]: "dur", v: value2.toString() };
  const name = value2?.constructor?.name ?? typeof value2;
  throw new TypeError(`${path} (${name}) cannot be stored in the outbox`);
}
function plainToJson(value2, path) {
  const out = {};
  for (const [k, v] of Object.entries(value2))
    out[k] = toJson(v, `${path}.${k}`);
  return TAG in out ? { [TAG]: "obj", v: out } : out;
}
function fromJson(value2) {
  if (Array.isArray(value2)) return value2.map(fromJson);
  if (typeof value2 !== "object" || value2 === null) return value2;
  const object3 = value2;
  switch (object3[TAG]) {
    case void 0:
      break;
    case "undefined":
      return void 0;
    case "number":
      return Number(object3.v);
    case "bigint":
      return BigInt(object3.v);
    case "date":
      return new Date(object3.v);
    case "rid":
      return new import_surrealdb23.RecordId(object3.table, fromJson(object3.id));
    case "uuid":
      return new import_surrealdb23.Uuid(object3.v);
    case "dur":
      return new import_surrealdb23.Duration(object3.v);
    case "set":
      return new Set(object3.v.map(fromJson));
    case "obj":
      return decodeObject(object3.v);
    default:
      throw new TypeError(
        `Unknown tag ${String(object3[TAG])} in a stored value`
      );
  }
  return decodeObject(object3);
}
function decodeObject(object3) {
  const out = {};
  for (const [k, v] of Object.entries(object3)) out[k] = fromJson(v);
  return out;
}

// src/store/outbox.ts
function memoryStorage() {
  const entries = /* @__PURE__ */ new Map();
  return {
    async load() {
      return [...entries].map(([seq, payload]) => ({ seq, payload }));
    },
    async put(seq, payload) {
      entries.set(seq, payload);
    },
    async remove(seq) {
      entries.delete(seq);
    }
  };
}
function indexedDbStorage(name = "surqlize-outbox") {
  const STORE = "ops";
  let opened;
  const open = () => {
    opened ??= new Promise((resolve3, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve3(request.result);
      request.onerror = () => reject(request.error);
    });
    return opened;
  };
  const run = async (mode, work) => {
    const db = await open();
    return new Promise((resolve3, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve3(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  return {
    async load() {
      const db = await open();
      return new Promise((resolve3, reject) => {
        const out = [];
        const request = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve3(out);
          out.push({ seq: Number(cursor.key), payload: String(cursor.value) });
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    },
    async put(seq, payload) {
      await run("readwrite", (s) => s.put(payload, seq));
    },
    async remove(seq) {
      await run("readwrite", (s) => s.delete(seq));
    }
  };
}
var Outbox = class {
  constructor(deps) {
    this.deps = deps;
    this.ready = this.#load();
  }
  #entries = [];
  #counter = 0;
  #snapshot = Object.freeze([]);
  #listeners = /* @__PURE__ */ new Set();
  #flushing = false;
  #disposed = false;
  #loaded = false;
  #timer;
  #attempt = 0;
  /** Resolves once the writes of an earlier session have been loaded. */
  ready;
  /** The writes waiting to be sent, oldest first. The same array until it changes. */
  getSnapshot = () => this.#snapshot;
  /** Subscribe to changes of the waiting writes. */
  subscribe = (listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };
  /** The pending writes to one table, in the order they were made. */
  forTable(table2) {
    return this.#entries.filter((e) => e.op.table === table2).map((e) => e.op);
  }
  /**
   * Queue a write. Resolves with the stored record once the database accepted
   * it, and rejects if it refused it, or if the write cannot be stored.
   */
  enqueue(op) {
    if (!this.#loaded) return this.ready.then(() => this.enqueue(op));
    return new Promise((resolve3, reject) => {
      const waiter = { resolve: resolve3, reject };
      const target = this.#mergeTarget(op);
      const previous = target?.op;
      const next = target ? { ...target.op, data: { ...target.op.data, ...op.data } } : { ...op };
      const payload = encode(next);
      let entry;
      if (target) {
        target.op = next;
        target.waiters.push(waiter);
        entry = target;
      } else {
        entry = {
          seq: ++this.#counter,
          op: next,
          inFlight: false,
          waiters: [waiter]
        };
        this.#entries.push(entry);
      }
      this.#changed();
      this.deps.storage.put(entry.seq, payload).then(
        () => {
          this.deps.onWrite?.();
          void this.flush();
        },
        (error) => {
          if (previous) {
            entry.op = previous;
            entry.waiters = entry.waiters.filter((w) => w !== waiter);
          } else {
            this.#entries = this.#entries.filter((e) => e !== entry);
          }
          this.#changed();
          reject(error);
        }
      );
    });
  }
  /**
   * The unsent write an update can be folded into: the latest write to the same
   * record, if it has not been sent and is not a delete. Writes to other
   * records in between do not matter, as each record is written in order.
   */
  #mergeTarget(op) {
    if (op.kind !== "update") return void 0;
    for (let i = this.#entries.length - 1; i >= 0; i--) {
      const entry = this.#entries[i];
      if (entry.op.table !== op.table || !sameId(entry.op.id, op.id)) continue;
      return entry.inFlight || entry.op.kind === "delete" ? void 0 : entry;
    }
    return void 0;
  }
  async #load() {
    const stored = await this.deps.storage.load();
    const sorted = [...stored].sort((a, b) => a.seq - b.seq);
    this.#counter = sorted.at(-1)?.seq ?? 0;
    this.#entries = sorted.map(({ seq, payload }) => ({
      seq,
      op: decode(payload),
      inFlight: false,
      waiters: []
    }));
    this.#loaded = true;
    this.#changed();
    void this.flush();
  }
  #changed() {
    this.#snapshot = Object.freeze(this.#entries.map((e) => e.op));
    for (const listener of [...this.#listeners]) listener();
  }
  /**
   * Send the waiting writes, oldest first, until one cannot be sent for want of
   * a connection. Safe to call at any time; only one run happens at once. Does
   * nothing once the outbox is disposed.
   */
  async flush() {
    if (this.#flushing || this.#disposed) return;
    this.#flushing = true;
    clearTimeout(this.#timer);
    this.#timer = void 0;
    try {
      while (!this.#disposed && this.#entries.length > 0 && this.deps.isOnline()) {
        if (!await this.#sendFirst()) return;
      }
    } finally {
      this.#flushing = false;
    }
  }
  /** Send the oldest write. Returns whether to carry on with the next. */
  async #sendFirst() {
    const entry = this.#entries[0];
    entry.inFlight = true;
    try {
      const row = await this.deps.send(entry.op);
      this.deps.acknowledge(entry.op, row);
      await this.#finish(entry, (w) => w.resolve(row));
      this.#attempt = 0;
      return true;
    } catch (error) {
      entry.inFlight = false;
      if (this.deps.isPermanent(error)) {
        await this.#finish(entry, (w) => w.reject(error));
        return true;
      }
      this.#scheduleRetry();
      return false;
    }
  }
  async #finish(entry, settle) {
    this.#entries = this.#entries.filter((e) => e !== entry);
    await this.deps.storage.remove(entry.seq).catch(() => {
    });
    this.#changed();
    for (const waiter of entry.waiters) settle(waiter);
  }
  #scheduleRetry() {
    if (this.#disposed) return;
    const { minMs, maxMs } = this.deps.retry;
    const wait = Math.min(maxMs, minMs * 2 ** this.#attempt++);
    this.#timer = setTimeout(() => {
      this.#timer = void 0;
      void this.flush();
    }, wait);
  }
  /**
   * Stop sending, for good. A write that is on its way still ends as the
   * database answers, but nothing is sent after it, and a failed one is not
   * tried again. Writes stay in storage and are sent when a store starts again.
   */
  dispose() {
    this.#disposed = true;
    clearTimeout(this.#timer);
    this.#timer = void 0;
  }
};
var sameId = (a, b) => encode(a) === encode(b);

// src/store/overlay.ts
var import_surrealdb24 = require("surrealdb");
function applyOverlay(rows, ops, keyOf2, insert, stays = () => true) {
  if (ops.length === 0) return rows;
  const map3 = /* @__PURE__ */ new Map();
  for (const row of rows) map3.set(keyOf2(row) ?? /* @__PURE__ */ Symbol(), row);
  for (const op of ops) applyOp(map3, op, insert, stays);
  return [...map3.values()];
}
function applyOp(map3, op, insert, stays) {
  const id = new import_surrealdb24.RecordId(op.table, op.id);
  const key = String(id);
  if (op.kind === "delete") {
    map3.delete(key);
  } else if (op.kind === "create") {
    const row = { id, ...op.data };
    if (typeof insert === "function" ? insert(row) : insert) map3.set(key, row);
  } else {
    const existing = map3.get(key);
    if (existing === void 0) return;
    const changed = patch(existing, op.data ?? {});
    if (stays(changed)) map3.set(key, changed);
    else map3.delete(key);
  }
}
function patch(row, data) {
  return Object.assign(
    Object.create(Object.getPrototypeOf(row)),
    row,
    data
  );
}

// src/store/query-store.ts
var LOADING = Object.freeze({ status: "loading" });
var QueryStore = class {
  constructor(deps) {
    this.deps = deps;
    deps.registerStop?.(() => this.#stop());
  }
  #snapshot = LOADING;
  #listeners = /* @__PURE__ */ new Set();
  #rows = /* @__PURE__ */ new Map();
  #running = false;
  /** The live query could not be registered, so the store is not running. */
  #failedToStart = false;
  #stopLive;
  #stopConnection;
  #stopOverlay;
  /** The last result of a `refetch` query, before pending writes are applied. */
  #base = [];
  #idle;
  #debounce;
  /** Notifications received while a load is in flight, applied once it ends. */
  #buffer;
  #loading = false;
  #dirty = false;
  #stale = false;
  /** Distinguishes a load that was superseded by a restart. */
  #epoch = 0;
  /** The table this query reads. */
  get table() {
    return this.deps.table;
  }
  /** Subscribe to changes of the snapshot. Returns a function that unsubscribes. */
  subscribe = (listener) => {
    this.#listeners.add(listener);
    clearTimeout(this.#idle);
    this.#idle = void 0;
    if (!this.#running) void this.#start();
    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) this.#scheduleStop();
    };
  };
  /** The current snapshot. The same object is returned until something changes. */
  getSnapshot = () => this.#snapshot;
  /**
   * Run the query again now and replace the result with what it returns. A
   * query that failed to start has no live subscription yet, so it is started
   * again instead.
   */
  refetch() {
    if (this.#failedToStart) return this.#start();
    return this.#load();
  }
  #publish(next) {
    this.#snapshot = next;
    for (const listener of [...this.#listeners]) listener();
  }
  /** Publish the result, with the pending writes applied on top of it. */
  #publishView() {
    const direct = this.deps.mode === "direct";
    let data = direct ? [...this.#rows.values()] : [...this.#base];
    if (this.deps.overlay) data = this.deps.overlay.apply(data, direct);
    if (direct && this.deps.sort) data.sort(this.deps.sort);
    this.#publish(
      Object.freeze({
        status: "success",
        data: Object.freeze(data),
        stale: this.#stale
      })
    );
  }
  /**
   * The database accepted a write: record its result in the base, so that the
   * view does not change when the write leaves the pending ones. The caller
   * removes the write next, which publishes.
   *
   * The result is a whole table row. A `refetch` query that is not a plain
   * filter may select or compute other columns, so a row it holds keeps its
   * keys: the result updates the keys the row has and adds none.
   */
  acknowledge(change) {
    if (change.row === void 0) {
      this.#rows.delete(change.key);
      this.#base = this.#base.filter((r) => this.deps.keyOf(r) !== change.key);
      return;
    }
    const row = change.row;
    if (this.deps.mode === "direct") {
      this.#rows.set(change.key, row);
      return;
    }
    const member = this.deps.membership?.(row);
    const present = this.#base.some((r) => this.deps.keyOf(r) === change.key);
    if (member === false) {
      this.#base = this.#base.filter((r) => this.deps.keyOf(r) !== change.key);
    } else if (present) {
      this.#base = this.#base.map(
        (r) => this.deps.keyOf(r) === change.key ? this.#accepted(r, row) : r
      );
    } else if (member === true && this.deps.insertable) {
      this.#base = [...this.#base, row];
    }
  }
  /** The row `held` becomes when the database accepts a write that returned `row`. */
  #accepted(held, row) {
    if (this.deps.membership) return row;
    const kept = Object.assign(
      Object.create(Object.getPrototypeOf(held)),
      held
    );
    for (const key of Object.keys(row)) {
      if (Object.hasOwn(held, key)) {
        kept[key] = row[key];
      }
    }
    return kept;
  }
  async #start() {
    this.#running = true;
    this.#failedToStart = false;
    const epoch = ++this.#epoch;
    this.#buffer = [];
    try {
      const stop = await this.deps.live((message) => this.#onMessage(message));
      if (!this.#running || epoch !== this.#epoch) {
        stop();
        return;
      }
      this.#stopLive = stop;
      this.#stopConnection = this.deps.onConnection?.(
        (signal) => this.#onConnection(signal)
      );
      this.#stopOverlay = this.deps.overlay?.subscribe(() => {
        if (this.#snapshot.status === "success") this.#publishView();
      });
      await this.#load();
    } catch (error) {
      if (epoch === this.#epoch) {
        this.#running = false;
        this.#failedToStart = true;
        this.#buffer = void 0;
        this.#publish(Object.freeze({ status: "error", error }));
      }
    }
  }
  async #load() {
    if (this.#loading) {
      this.#dirty = true;
      return;
    }
    this.#loading = true;
    const epoch = this.#epoch;
    try {
      do {
        this.#dirty = false;
        this.#buffer ??= [];
        const rows = await this.deps.fetch();
        if (epoch !== this.#epoch || !this.#running) return;
        this.#accept(rows);
      } while (this.#dirty && this.#running);
    } catch (error) {
      if (epoch === this.#epoch) this.#failLoad(error);
    } finally {
      this.#loading = false;
    }
  }
  /** Make `rows` the result, with the notifications that arrived while it was read on top. */
  #accept(rows) {
    const buffered = this.#buffer ?? [];
    this.#buffer = void 0;
    this.#stale = false;
    if (this.deps.mode === "refetch") {
      this.#base = rows;
      this.#publishView();
      return;
    }
    this.#rows.clear();
    for (const row of rows) this.#rows.set(this.deps.keyOf(row), row);
    for (const message of buffered) this.#apply(message);
    this.#publishView();
  }
  #failLoad(error) {
    this.#buffer = void 0;
    if (this.#snapshot.status === "success") this.#publishStale(true);
    else this.#publish(Object.freeze({ status: "error", error }));
  }
  #publishStale(stale) {
    this.#stale = stale;
    if (this.#snapshot.status !== "success") return;
    if (this.#snapshot.stale === stale) return;
    this.#publish(Object.freeze({ ...this.#snapshot, stale }));
  }
  #onMessage(message) {
    if (message.action === "KILLED") {
      this.#publish(
        Object.freeze({
          status: "error",
          error: new Error("The live subscription was killed by the server")
        })
      );
      return;
    }
    if (this.deps.mode === "refetch") {
      this.#scheduleRefetch();
    } else if (this.#buffer) {
      this.#buffer.push(message);
    } else {
      this.#apply(message);
      this.#publishView();
    }
  }
  #apply(message) {
    if (message.action === "KILLED") return;
    const key = this.deps.keyOfId(message.recordId);
    if (message.action === "DELETE") this.#rows.delete(key);
    else this.#rows.set(key, message.value);
  }
  #scheduleRefetch() {
    if (this.#loading) {
      this.#dirty = true;
      return;
    }
    clearTimeout(this.#debounce);
    this.#debounce = setTimeout(() => {
      this.#debounce = void 0;
      void this.#load();
    }, this.deps.debounceMs);
  }
  #onConnection(signal) {
    if (signal === "disconnected") {
      this.#publishStale(true);
    } else if (this.#stale) {
      this.#buffer = [];
      void this.#load();
    }
  }
  #scheduleStop() {
    clearTimeout(this.#idle);
    this.#idle = setTimeout(() => this.#stop(), this.deps.idleMs);
  }
  #stop() {
    clearTimeout(this.#idle);
    this.#idle = void 0;
    this.#running = false;
    this.#failedToStart = false;
    this.#epoch++;
    clearTimeout(this.#debounce);
    this.#debounce = void 0;
    this.#stopLive?.();
    this.#stopLive = void 0;
    this.#stopConnection?.();
    this.#stopConnection = void 0;
    this.#stopOverlay?.();
    this.#stopOverlay = void 0;
    this.#base = [];
    this.#rows.clear();
    this.#buffer = void 0;
    this.#loading = false;
    this.#dirty = false;
    this.#stale = false;
    this.#snapshot = LOADING;
    this.deps.onDispose?.();
  }
};

// src/store/store.ts
var import_surrealdb26 = require("surrealdb");
init_error();

// src/store/match.ts
var import_surrealdb25 = require("surrealdb");
init_workable();
var OPERATORS2 = /* @__PURE__ */ new Set([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "inside",
  "notInside",
  "contains",
  "containsNot",
  "containsAll",
  "containsAny",
  "containsNone",
  "allInside",
  "anyInside",
  "noneInside",
  "startsWith",
  "endsWith"
]);
var COMBINATORS = /* @__PURE__ */ new Set(["and", "or", "not"]);
var isPlain = (value2) => {
  if (typeof value2 !== "object" || value2 === null) return false;
  const proto = Object.getPrototypeOf(value2);
  return proto === Object.prototype || proto === null;
};
function sameSet(a, b) {
  const rest = [...b];
  return a.size === b.size && [...a].every((x) => {
    const at3 = rest.findIndex((y) => same(x, y));
    if (at3 < 0) return false;
    rest.splice(at3, 1);
    return true;
  });
}
function same(a, b) {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof import_surrealdb25.RecordId && b instanceof import_surrealdb25.RecordId)
    return String(a) === String(b);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => same(x, b[i]));
  }
  if (a instanceof Set && b instanceof Set) return sameSet(a, b);
  if (isPlain(a) && isPlain(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((k) => k in b && same(a[k], b[k]));
  }
  if (typeof a === "object" && typeof b === "object" && a && b && a.constructor === b.constructor) {
    return String(a) === String(b);
  }
  return false;
}
var sign = (a, b) => a < b ? -1 : a > b ? 1 : 0;
var isNumber = (value2) => typeof value2 === "number" || typeof value2 === "bigint";
function compareStrings(a, b) {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a.codePointAt(i);
    const y = b.codePointAt(j);
    if (x !== y) return x < y ? -1 : 1;
    i += x > 65535 ? 2 : 1;
    j += y > 65535 ? 2 : 1;
  }
  return sign(a.length - i, b.length - j);
}
function compare(a, b) {
  if (isNumber(a) && isNumber(b)) return sign(a, b);
  if (typeof a === "string" && typeof b === "string")
    return compareStrings(a, b);
  if (a instanceof Date && b instanceof Date)
    return sign(a.getTime(), b.getTime());
  return void 0;
}
var not2 = (value2) => value2 === void 0 ? void 0 : !value2;
function ordered(value2, arg, test) {
  const c = compare(value2, arg);
  return c === void 0 ? void 0 : test(c);
}
function contains(value2, arg) {
  if (Array.isArray(value2)) return value2.some((x) => same(x, arg));
  if (typeof value2 === "string" && typeof arg === "string")
    return value2.includes(arg);
  return void 0;
}
function shared(value2, arg) {
  if (!Array.isArray(value2) || !Array.isArray(arg)) return void 0;
  return {
    count: value2.filter((x) => arg.some((y) => same(x, y))).length,
    size: value2.length
  };
}
var SET_TESTS = {
  containsAny: (s) => s.count > 0,
  anyInside: (s) => s.count > 0,
  containsNone: (s) => s.count === 0,
  noneInside: (s) => s.count === 0,
  allInside: (s) => s.count === s.size
};
var text = (value2, arg, test) => typeof value2 === "string" && typeof arg === "string" ? test(value2, arg) : void 0;
function operate(op, value2, arg) {
  switch (op) {
    case "eq":
      return same(value2, arg);
    case "ne":
      return !same(value2, arg);
    case "gt":
      return ordered(value2, arg, (c) => c > 0);
    case "gte":
      return ordered(value2, arg, (c) => c >= 0);
    case "lt":
      return ordered(value2, arg, (c) => c < 0);
    case "lte":
      return ordered(value2, arg, (c) => c <= 0);
    case "inside":
      return Array.isArray(arg) ? arg.some((x) => same(value2, x)) : void 0;
    case "notInside":
      return Array.isArray(arg) ? !arg.some((x) => same(value2, x)) : void 0;
    case "contains":
      return contains(value2, arg);
    case "containsNot":
      return not2(contains(value2, arg));
    case "containsAll":
      return Array.isArray(arg) && Array.isArray(value2) ? arg.every((y) => value2.some((x) => same(x, y))) : void 0;
    case "startsWith":
      return text(value2, arg, (v, a) => v.startsWith(a));
    case "endsWith":
      return text(value2, arg, (v, a) => v.endsWith(a));
    default: {
      const test = SET_TESTS[op];
      const counted = test ? shared(value2, arg) : void 0;
      return test && counted ? test(counted) : void 0;
    }
  }
}
var all = (results) => results.includes(false) ? false : results.includes(void 0) ? void 0 : true;
var any2 = (results) => results.includes(true) ? true : results.includes(void 0) ? void 0 : false;
var ANSWERS_FOR_NONE = /* @__PURE__ */ new Set(["eq", "ne", "inside", "notInside"]);
var hasFields = (value2) => typeof value2 === "object" && value2 !== null && !Array.isArray(value2);
function fieldTest(condition, value2, ctx) {
  if (isWorkable(condition)) return void 0;
  if (!isPlain(condition)) return operate("eq", value2, condition);
  return filterTest(condition, value2, true, ctx);
}
function combinatorTest(key, condition, value2, isField, ctx) {
  if (key === "not") {
    return isPlain(condition) ? not2(filterTest(condition, value2, isField, ctx)) : void 0;
  }
  if (!Array.isArray(condition) || !condition.every(isPlain)) return void 0;
  const results = condition.map((c) => filterTest(c, value2, isField, ctx));
  return key === "and" ? all(results) : any2(results);
}
function operatorTest(key, condition, value2, ctx) {
  if (isWorkable(condition)) return void 0;
  if (value2 === void 0 && (ctx.partial || !ANSWERS_FOR_NONE.has(key)))
    return void 0;
  return operate(key, value2, condition);
}
function nestedTest(key, condition, value2, isField, ctx) {
  const container = isField ? isPlain(value2) ? value2 : void 0 : hasFields(value2) ? value2 : void 0;
  if (!container) return void 0;
  const child = container[key];
  if (child === void 0 && ctx.partial) return void 0;
  return fieldTest(condition, child, ctx);
}
function entryTest(key, condition, value2, isField, ctx) {
  const isFieldName = hasFields(value2) && key in value2;
  if (!isFieldName && COMBINATORS.has(key))
    return combinatorTest(key, condition, value2, isField, ctx);
  if (!isFieldName && isField && OPERATORS2.has(key))
    return operatorTest(key, condition, value2, ctx);
  return nestedTest(key, condition, value2, isField, ctx);
}
function filterTest(filter, value2, isField, ctx) {
  const results = [];
  for (const [key, condition] of Object.entries(filter)) {
    if (condition !== void 0)
      results.push(entryTest(key, condition, value2, isField, ctx));
  }
  return all(results);
}
function matchesWhere(filter, row, options = {}) {
  if (filter === void 0) return true;
  return filterTest(filter, row, false, { partial: options.partial ?? false });
}

// src/store/store.ts
var isConnectionEvents = (value2) => typeof value2?.subscribe === "function";
function keyOf(text2, bindings) {
  return `${text2}\0${keyOfValue(bindings, [])}`;
}
function keyOfValue(value2, parents) {
  switch (typeof value2) {
    case "string":
      return JSON.stringify(value2);
    case "bigint":
      return `${value2}n`;
    case "symbol":
      return `symbol(${value2.description ?? ""})`;
    case "function":
      return `function(${value2.name})`;
    case "object":
      break;
    default:
      return String(value2);
  }
  if (value2 === null) return "null";
  if (parents.includes(value2)) return "[circular]";
  const inner = [...parents, value2];
  const each = (items) => [...items].map((item) => keyOfValue(item, inner)).join(",");
  if (Array.isArray(value2)) return `[${each(value2)}]`;
  if (value2 instanceof Set) return `set[${each(value2)}]`;
  if (value2 instanceof Map)
    return `map[${[...value2].map(([k, v]) => `${keyOfValue(k, inner)}=>${keyOfValue(v, inner)}`).join(",")}]`;
  if (value2 instanceof ArrayBuffer) return `buffer(${hex(value2)})`;
  if (ArrayBuffer.isView(value2))
    return `${value2.constructor.name}(${hex(value2.buffer, value2.byteOffset, value2.byteLength)})`;
  if (value2 instanceof Date) return `date(${value2.getTime()})`;
  const proto = Object.getPrototypeOf(value2);
  if (proto === Object.prototype || proto === null) {
    const entries = Object.entries(value2).map(
      ([k, v]) => `${JSON.stringify(k)}:${keyOfValue(v, inner)}`
    );
    return `{${entries.join(",")}}`;
  }
  try {
    const text2 = (0, import_surrealdb26.toSurqlString)(value2);
    if (!text2.startsWith("[object ")) return text2;
  } catch {
  }
  return `class(${value2.constructor?.name ?? "unknown"})`;
}
var hex = (buffer, offset = 0, length) => Array.from(
  new Uint8Array(buffer, offset, length),
  (byte) => byte.toString(16).padStart(2, "0")
).join("");
function recordKey(row) {
  const id = row?.id;
  return id === void 0 || id === null ? void 0 : String(id);
}
var Store = class {
  constructor(db, options = {}) {
    this.db = db;
    this.#idleMs = options.idleMs ?? 100;
    this.#debounceMs = options.debounceMs ?? 20;
    const candidate = options.connection ?? db.surreal;
    this.#connection = isConnectionEvents(candidate) ? candidate : void 0;
    this.#gate = options.gate;
    this.#gateOpen = options.gate === void 0;
    this.#outbox = new Outbox({
      storage: options.storage ?? memoryStorage(),
      send: (op) => this.#send(op),
      acknowledge: (op, row) => this.#acknowledge(op, row),
      // A write that lost a race with another one was not applied, and sending it
      // again cannot count it twice, so it is not a refusal. Only a server that
      // reports the conflict in a structured way (3.1.0 or later) is recognised.
      isPermanent: (error) => !(0, import_surrealdb26.isRetryableConflict)(error) && (error instanceof import_surrealdb26.ServerError || error instanceof OrmError),
      isOnline: () => (this.#connection === void 0 || this.#online) && this.#gateOpen,
      onWrite: () => {
        if (!this.#gateOpen) void this.#open().catch(() => {
        });
      },
      retry: {
        minMs: options.retry?.minMs ?? 500,
        maxMs: options.retry?.maxMs ?? 3e4
      }
    });
    this.pending = this.#outbox;
    this.ready = this.#outbox.ready;
    this.#watchConnection();
  }
  #stores = /* @__PURE__ */ new Map();
  #idleMs;
  #debounceMs;
  #connection;
  #outbox;
  #gate;
  #gateOpen;
  #opening;
  /**
   * Writes that have not been accepted by the database yet, oldest first. The
   * same array is returned until it changes.
   */
  pending;
  /** Resolves once the writes of an earlier session have been loaded from storage. */
  ready;
  #online = true;
  #unwatch = [];
  /** Keep track of the connection, and send waiting writes when it returns. */
  #watchConnection() {
    const connection = this.#connection;
    if (!connection) return;
    this.#unwatch.push(
      connection.subscribe("connected", () => {
        this.#online = true;
        void this.#outbox.flush();
      })
    );
    for (const event of ["reconnecting", "disconnected"]) {
      this.#unwatch.push(
        connection.subscribe(event, () => {
          this.#online = false;
        })
      );
    }
  }
  /**
   * Stop everything the store started: its listeners on the connection, the
   * sending of the writes that are still waiting, and every running query, even
   * one that is subscribed. For a store made for a short-lived scope, such as a
   * request or a test, so that it does not outlive it. A write that is on its
   * way ends as the database answers, but none is sent or retried after it.
   * Writes that are waiting stay in storage, and are sent when a store starts
   * over it again.
   */
  dispose() {
    for (const off of this.#unwatch) off();
    this.#unwatch = [];
    this.#outbox.dispose();
    for (const { stop } of [...this.#stores.values()]) stop();
  }
  /**
   * Open the gate, if there is one and it is not open yet. Only one call to it
   * is made at a time, and a failed one is forgotten, so the next need tries
   * again. Writes that were held are sent once it has opened.
   */
  #open() {
    this.#opening ??= (async () => this.#gate?.())().then(
      () => {
        this.#opening = void 0;
        this.#gateOpen = true;
        void this.#outbox.flush();
      },
      (error) => {
        this.#opening = void 0;
        throw error;
      }
    );
    return this.#opening;
  }
  /** `run`, after the gate has opened. Not wrapped at all when there is no gate. */
  #gated(run) {
    if (!this.#gate) return run;
    return async () => {
      if (!this.#gateOpen) await this.#open();
      return run();
    };
  }
  async #send(op) {
    const db = this.db;
    if (op.kind === "delete") {
      await db.delete?.(op.table, op.id)?.execute();
      return void 0;
    }
    const query = op.kind === "create" ? db.upsert?.(op.table, op.id)?.content(op.data ?? {}) : db.update?.(op.table, op.id)?.merge(op.data ?? {});
    const [row] = await query?.execute() ?? [];
    if (row === void 0) {
      throw new OrmError(
        `${op.table}:${String(op.id)} does not exist, so it cannot be updated`
      );
    }
    return row;
  }
  /** Record the result of an accepted write in every running query of its table. */
  #acknowledge(op, row) {
    const key = String(new import_surrealdb26.RecordId(op.table, op.id));
    for (const { query } of this.#stores.values()) {
      if (query.table === op.table) query.acknowledge({ key, row });
    }
  }
  /**
   * Make writes to a table. Each applies to every query of the table at once,
   * and is sent to the database in order.
   *
   * ```ts
   * const tasks = store.table("task");
   * const { id, committed } = tasks.create({ title: "Write docs", done: false });
   * tasks.update(id, { done: true });
   * await committed;
   * ```
   *
   * Updates merge top-level fields, and the last write to a field wins.
   */
  table(tb) {
    return new TableWriter(tb, this.#outbox);
  }
  query(tb, build, options = {}) {
    const db = this.db;
    const select = db.select(tb);
    const query = build ? build(select) : select;
    const filter = build ? query.clientFilter?.() : void 0;
    const prepared = query.prepare();
    const key = `${build ? "refetch" : "direct"}\0${keyOf(prepared.query, prepared.bindings)}`;
    const existing = this.#stores.get(key);
    if (existing) return existing.query;
    let stop = () => {
    };
    const store = new QueryStore({
      table: tb,
      mode: build ? "refetch" : "direct",
      overlay: {
        apply: (rows, direct) => {
          const ops = this.#outbox.forTable(tb);
          if (direct) return applyOverlay(rows, ops, recordKey, true);
          if (!filter) return applyOverlay(rows, ops, recordKey, false);
          return applyOverlay(
            rows,
            ops,
            recordKey,
            (row) => !filter.ordered && matchesWhere(filter.where, row, { partial: true }) === true,
            (row) => matchesWhere(filter.where, row) !== false
          );
        },
        subscribe: this.#outbox.subscribe
      },
      membership: filter ? (row) => matchesWhere(filter.where, row) : void 0,
      insertable: filter ? !filter.ordered : false,
      fetch: this.#gated(async () => {
        const result = await query.execute();
        if (Array.isArray(result)) return result;
        return result == null ? [] : [result];
      }),
      live: (handler) => this.#gated(
        () => db.live(tb).subscribe(handler)
      )(),
      // A row with no key is the record of no write.
      keyOf: (row) => recordKey(row) ?? "",
      keyOfId: (id) => String(id),
      sort: options.sort,
      onConnection: this.#connection && ((listener) => this.#listen(listener)),
      // A query that was stopped and replaced can still stop again, when a holder
      // of it subscribes and leaves: it must not forget the one that replaced it.
      onDispose: () => {
        if (this.#stores.get(key)?.query === store) this.#stores.delete(key);
      },
      registerStop: (stopQuery) => {
        stop = stopQuery;
      },
      idleMs: this.#idleMs,
      debounceMs: this.#debounceMs
    });
    this.#stores.set(key, { query: store, stop });
    return store;
  }
  #listen(listener) {
    const connection = this.#connection;
    const offs = [
      // Writes go first, so that the read that follows includes them.
      connection.subscribe("connected", () => {
        void this.#outbox.flush().finally(() => listener("connected"));
      }),
      connection.subscribe("reconnecting", () => listener("disconnected")),
      connection.subscribe("disconnected", () => listener("disconnected"))
    ];
    return () => {
      for (const off of offs) off();
    };
  }
};
var idValue = (id) => id instanceof import_surrealdb26.RecordId ? id.id : id;
var newId = () => globalThis.crypto.randomUUID().replaceAll("-", "");
var TableWriter = class {
  constructor(tb, outbox) {
    this.tb = tb;
    this.outbox = outbox;
  }
  #write(kind, id, data) {
    const committed = this.outbox.enqueue({
      table: this.tb,
      id,
      kind,
      data
    });
    return { id: new import_surrealdb26.RecordId(this.tb, id), committed };
  }
  /**
   * Create a record. Without an `id`, one is generated here, so the record can
   * be used straight away, before the database has seen it.
   */
  create(data, options = {}) {
    return this.#write(
      "create",
      options.id ?? newId(),
      data
    );
  }
  /** Change fields of a record. Other fields are left as they are. */
  update(id, data) {
    return this.#write("update", idValue(id), data);
  }
  /** Delete a record. Deleting one that does not exist is not an error. */
  delete(id) {
    return this.#write("delete", idValue(id));
  }
};
function createStore(db, options) {
  return new Store(db, options);
}

// src/index.ts
init_types();
init_utils();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ANY,
  AbstractType,
  AnyType,
  ApiClient,
  ApiEndpointSchema,
  ArrayType,
  BatchQuery,
  BigIntType,
  BoolType,
  BytesType,
  CreateQuery,
  DateType,
  DecimalType,
  DeleteQuery,
  DuplicateSurrealError,
  DurationType,
  EdgeSchema,
  FloatType,
  FunctionSchema,
  GeometryType,
  GraphType,
  InsertQuery,
  IntType,
  LiteralType,
  LiveQuery,
  LiveSubscription,
  NeverType,
  NoneType,
  NullType,
  NumberType,
  ObjectType,
  OptionType,
  Orm,
  OrmError,
  PointType,
  QueryStore,
  RangeType,
  RecordType,
  RelateQuery,
  SelectQuery,
  SetType,
  Store,
  StringType,
  SurqlExpression,
  TableSchema,
  TableWriter,
  Transaction,
  TypeParseError,
  UnionType,
  UpdateQuery,
  UpsertQuery,
  UuidType,
  ValidationError,
  WhereRule,
  __ctx,
  __display,
  __type,
  access,
  analyzer,
  and,
  api,
  applyOverlay,
  authenticatedAs,
  bytes,
  config,
  count,
  createStore,
  crypto,
  defineEvent,
  defineField,
  defineIndex,
  defineSchema,
  defineTable,
  displayContext,
  duration,
  edge,
  encoding,
  expr,
  flattenFields,
  fn,
  generateSchema,
  geo,
  http,
  indexedDbStorage,
  math,
  memoryStorage,
  meta,
  not,
  object,
  or,
  orm,
  param,
  parse,
  printSurqlType,
  rand,
  resolveFetchObject,
  schemaStatements,
  search,
  sequence,
  session,
  set_,
  sleep,
  storedFunction,
  t,
  table,
  time,
  toSurql,
  type_,
  value,
  vector,
  where
});
