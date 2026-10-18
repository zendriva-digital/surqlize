import {
  defineEvent,
  defineField,
  defineIndex,
  defineTable,
  flattenFields
} from "./chunk-QLEB32PY.js";
import {
  EdgeSchema
} from "./chunk-EQBUA4DZ.js";

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
function equivalent(a, b) {
  return canonicalise(a) === canonicalise(b);
}
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
      const quote = statement[next];
      if (quote === "'" || quote === '"') {
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
  const quote = statement[start];
  let i = start + 1;
  while (i < statement.length) {
    if (statement[i] === "\\") i += 2;
    else if (statement[i] === quote) return i + 1;
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
  const tables = {};
  for (const name of tableNames) {
    const [info] = await surreal.query(`INFO FOR TABLE ${name};`);
    tables[name] = {
      name,
      definition: dbInfo?.tables?.[name] ?? "",
      fields: info?.fields ?? {},
      indexes: info?.indexes ?? {},
      events: info?.events ?? {}
    };
  }
  const entities = {};
  for (const [kind, key] of Object.entries(ENTITY_KEYS)) {
    entities[kind] = dbInfo?.[key] ?? {};
  }
  return { tables, entities };
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
  return record(surreal, pending);
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
async function record(surreal, pending) {
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

export {
  canonicalise,
  equivalent,
  diff,
  MIGRATIONS_TABLE,
  introspect,
  plan,
  migrate,
  rollback,
  applied,
  checksum,
  assertRollbackable
};
