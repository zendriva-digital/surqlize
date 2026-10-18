#!/usr/bin/env node
import {
  applied,
  assertRollbackable,
  migrate,
  plan,
  rollback
} from "./chunk-PCSFR3AQ.js";
import "./chunk-QLEB32PY.js";
import "./chunk-EQBUA4DZ.js";
import "./chunk-MLKGABMK.js";

// src/cli/index.ts
import { existsSync as existsSync2 } from "fs";
import { writeFile } from "fs/promises";
import { parseArgs } from "util";
import { Surreal } from "surrealdb";

// src/cli/config.ts
import { existsSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "url";
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
async function loadConfig(overrides = {}, cwd = process.cwd(), environment) {
  const file = await loadConfigFile(cwd);
  const { environments, ...base } = file;
  if (environment && !environments?.[environment]) {
    throw new UnknownEnvironmentError(
      environment,
      Object.keys(environments ?? {})
    );
  }
  return {
    ...DEFAULTS,
    ...definedOnly(base),
    ...definedOnly(environment ? environments?.[environment] ?? {} : {}),
    ...fromEnvironment(),
    ...definedOnly(overrides)
  };
}
async function availableEnvironments(cwd = process.cwd()) {
  return Object.keys((await loadConfigFile(cwd)).environments ?? {});
}
async function loadConfigFile(cwd) {
  for (const filename of CONFIG_FILES) {
    const path = resolve(cwd, filename);
    if (!existsSync(path)) continue;
    const module = await importModule(path);
    return module.default ?? module;
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
  const url = `${pathToFileURL(path).href}?t=${Date.now()}`;
  if (!existsSync(path)) {
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
import { resolve as resolve2 } from "path";
async function loadDefinitions(path) {
  const module = await importModule(resolve2(process.cwd(), path));
  const found = [];
  for (const value of Object.values(module)) {
    collect(value, found);
  }
  if (!found.length) {
    throw new Error(
      `${path} exports no table, edge or database definitions.
Export them individually, or as a default-exported object.`
    );
  }
  return found;
}
function collect(value, into) {
  if (isDefinition(value)) {
    if (!into.includes(value)) into.push(value);
    return;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const nested of Object.values(value)) collect(nested, into);
    return;
  }
  if (Array.isArray(value)) {
    for (const nested of value) collect(nested, into);
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
    parsed = parseArgs({
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
  const environment = flags.env;
  const options = {
    removeMissing: flags["remove-missing"] === true,
    assumeYes: flags.yes === true
  };
  switch (command) {
    case "init":
      return initCommand();
    case "config":
      return configCommand(
        await loadConfig(overrides, process.cwd(), environment),
        environment
      );
    case "validate":
      return validateCommand(
        await loadConfig(overrides, process.cwd(), environment)
      );
    case "plan":
    case "diff":
      return planCommand(
        await loadConfig(overrides, process.cwd(), environment),
        options
      );
    case "migrate":
      return migrateCommand(
        await loadConfig(overrides, process.cwd(), environment),
        options
      );
    case "status":
      return statusCommand(
        await loadConfig(overrides, process.cwd(), environment)
      );
    case "rollback":
      return rollbackCommand(
        await loadConfig(overrides, process.cwd(), environment),
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
  const surreal = new Surreal();
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
    if (existsSync2(name)) {
      warn(`${name} already exists \u2014 leaving it alone`);
      continue;
    }
    await writeFile(name, contents, "utf-8");
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
  const tables = definitions.filter((d) => "tb" in d);
  const entities = definitions.filter((d) => "kind" in d);
  success(`${config.schema} is valid`);
  info(`  Tables and edges: ${names(tables).join(", ") || "none"}`);
  if (entities.length)
    info(`  Other definitions: ${names(entities).join(", ")}`);
  return 0;
}
async function configCommand(config, environment) {
  if (environment) success(`Environment: ${environment}`);
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
