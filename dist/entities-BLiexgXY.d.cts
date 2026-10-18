import { A as AbstractType, F as FieldDdl, T as TableSchema, E as EdgeSchema, R as RenderTables } from './standard-schema-BtCNboat.cjs';

/** One `DEFINE FIELD` statement's worth of information. */
interface FlatField {
    /** The field's path, e.g. `address`, `address.street`, `items[*].name`. */
    name: string;
    type: AbstractType;
    ddl: Readonly<FieldDdl>;
}
/**
 * Expand a nested field map into the flat list SurrealDB defines fields as.
 *
 * A schema nests, because that is what produces the row type:
 *
 * ```ts
 * { address: t.object({ street: t.string() }) }
 * ```
 *
 * SurrealDB does not. Each level is its own statement, and the parent object
 * field must exist or its children have nothing to attach to:
 *
 * ```surql
 * DEFINE FIELD address ON user TYPE object;
 * DEFINE FIELD address.street ON user TYPE string;
 * ```
 *
 * Objects inside an array or a set are addressed through the element wildcard —
 * `items[*].name`. The element field itself (`items[*]`) is **not** emitted:
 * SurrealDB creates it automatically for every array and set, and defining it by hand
 * would show up as an extra field on the next diff.
 *
 * @param fields - The table's fields, as declared
 * @returns One entry per `DEFINE FIELD` statement, parents before children
 */
declare function flattenFields(fields: Record<string, AbstractType>): FlatField[];

/** Anything that can be rendered as a `DEFINE TABLE` plus its fields. */
type DefinableSchema = TableSchema | EdgeSchema;
/** How a `DEFINE` statement should behave when the thing already exists. */
interface DefineOptions {
    /** Replace an existing definition rather than erroring. */
    overwrite?: boolean;
    /**
     * The tables of the schema, by name. A typed permission rule resolves record
     * links against them, so pass every table when generating a schema; a rule that
     * stays within its own table needs none.
     */
    tables?: RenderTables;
}
/**
 * Render a `DEFINE FIELD` statement.
 *
 * Clause order follows SurrealQL's grammar, which is not free-form — a
 * misplaced clause is a parse error.
 *
 * @param tableName - The table the field belongs to
 * @param field - The field's path, type and metadata
 * @returns A complete `DEFINE FIELD` statement
 */
declare function defineField(tableName: string, field: FlatField, options?: DefineOptions): string;
/**
 * Render a `DEFINE TABLE` statement.
 *
 * @param schema - The table or edge to define
 * @returns A complete `DEFINE TABLE` statement
 */
declare function defineTable(schema: DefinableSchema, options?: DefineOptions): string;
/**
 * Render every statement needed to define a table and its fields.
 *
 * @param schema - The table or edge to define
 * @returns The `DEFINE TABLE` statement followed by one per field
 */
declare function defineSchema(schema: DefinableSchema, options?: DefineOptions): string[];
/** What a statement defines. */
type StatementKind = "table" | "field" | "index" | "event";
/** One `DEFINE` statement, and the thing it defines. */
interface SchemaStatement {
    kind: StatementKind;
    /**
     * The object it defines, stable across runs: the table (`user`), or the
     * field, index or event with its table (`user.address.city`, `post.items[*].k`).
     */
    name: string;
    /** The statement, ending with a semicolon. */
    sql: string;
}
/**
 * The statements {@link defineSchema} renders, each with what it defines, so
 * that two generations can be compared by name.
 *
 * Computed fields (`TableSchema.computed()`) are left out: they have a
 * statement of their own, rendered against an ORM.
 */
declare function schemaStatements(schema: DefinableSchema, options?: DefineOptions): SchemaStatement[];

/**
 * Database-level definitions: things that belong to the database rather than to
 * a table.
 *
 * Each renders to a `DEFINE …` statement and knows how to remove itself, which
 * is all the diff needs — they are compared by name and by definition, exactly
 * as tables are.
 */
/** What kind of thing a database-level definition is. */
type EntityKind = "analyzer" | "param" | "function" | "sequence" | "access" | "config";
/** A definition that belongs to the database rather than a table. */
interface DatabaseEntity {
    kind: EntityKind;
    name: string;
    /**
     * The key `INFO FOR DB` reports this under.
     *
     * Usually the name, but a function is keyed by its bare name while its
     * statement uses the `fn::` prefix.
     */
    key: string;
    /** Previous names, so a rename redefines rather than dropping and recreating. */
    previousNames?: string[];
    /**
     * Whether part of this definition is hidden when read back.
     *
     * SurrealDB redacts secrets — a signing key comes back as `'[REDACTED]'` —
     * so a definition carrying one can never equal its stored form. Those are
     * created when missing and then left alone, because re-applying one on every
     * run would rotate the secret and invalidate whatever was issued under it.
     *
     * It is per definition rather than per kind: a `BEARER` access hides nothing,
     * and neither does a `JWT` access that verifies against a published key set,
     * so both of those are kept in sync like anything else.
     */
    opaque?: boolean;
    /** Render the `DEFINE` statement. */
    define(options?: {
        overwrite?: boolean;
    }): string;
    /**
     * Render the statement that removes it.
     *
     * `key` names a different entity of the same kind to remove — the old name
     * during a rename. Each builder qualifies it the way its own statement needs,
     * which matters for a function: `INFO FOR DB` keys it bare but
     * `REMOVE FUNCTION` needs the `fn::` prefix.
     */
    remove(key?: string): string;
}
/** How text is split into tokens and then filtered, for full-text search. */
interface AnalyzerOptions {
    tokenizers: string[];
    filters?: string[];
    comment?: string;
    previousNames?: string[];
}
/**
 * Define an analyzer, which turns text into the terms a full-text index stores.
 *
 * @param name - The analyzer name, referenced by `index(…, { fulltext })`
 * @param options - Tokenizers and filters
 */
declare function analyzer(name: string, options: AnalyzerOptions): DatabaseEntity;
/** A value available to every query in the database. */
interface ParamOptions {
    /** The value, as a SurrealQL expression. */
    value: string;
    comment?: string;
    previousNames?: string[];
}
/**
 * Define a database parameter, referenced in queries as `$name`.
 *
 * @param name - The parameter name, without the leading `$`
 * @param options - Its value
 */
declare function param(name: string, options: ParamOptions): DatabaseEntity;
/** A stored function. */
interface FunctionOptions {
    /** Arguments, as `[name, surqlType]` pairs. */
    args?: [string, string][];
    /** The return type, as a SurrealQL type. */
    returns?: string;
    /** The body, without the surrounding braces. */
    body: string;
    permissions?: string;
    comment?: string;
    previousNames?: string[];
}
/**
 * Define a stored function.
 *
 * @param name - The function name, with or without the `fn::` prefix
 * @param options - Its arguments, return type and body
 */
declare function storedFunction(name: string, options: FunctionOptions): DatabaseEntity;
/** A monotonically increasing counter. */
interface SequenceOptions {
    /** The first value handed out. */
    start?: number;
    /** How many values are reserved at a time. */
    batch?: number;
    previousNames?: string[];
}
/**
 * Define a sequence.
 *
 * `BATCH` and `START` are always emitted because SurrealDB fills them in — a
 * bare `DEFINE SEQUENCE s` reads back as `BATCH 1000 START 0`, so omitting them
 * would leave the sequence looking permanently modified.
 *
 * Note that a sequence's current value is not exposed by `INFO FOR DB`. Dropping
 * and recreating one silently restarts it, which is why renaming a sequence is
 * not supported.
 *
 * @param name - The sequence name
 * @param options - Its starting value and batch size
 */
declare function sequence(name: string, options?: SequenceOptions): DatabaseEntity;
/** How long a grant, a token and a session stay valid. */
interface AccessDuration {
    /** How long a bearer grant stays valid. `BEARER` only: any other type throws. */
    grant?: string;
    /**
     * How long a token stays valid. A `JWT` access that fetches a key set from a
     * `url` takes it from the issuer's `exp` claim instead, and ignores this.
     */
    token?: string;
    session?: string;
}
/** Shared by every access type. */
interface AccessCommon {
    duration?: AccessDuration;
    comment?: string;
    previousNames?: string[];
}
/**
 * Record-level access: end users authenticate as rows in a table.
 *
 * This is what lets a browser connect as a user rather than as root.
 */
interface RecordAccessOptions extends AccessCommon {
    type?: "RECORD";
    /** The query that authenticates an existing user. */
    signin?: string;
    /** The query that creates one. */
    signup?: string;
    /** An extra check run on every authenticated request. */
    authenticate?: string;
    /**
     * Accept tokens issued elsewhere, verified against a key set `url` or an
     * `algorithm` and `key`, instead of (or as well as) signing users in here.
     * `AUTHENTICATE` then turns the token's claims into the record user.
     */
    jwt?: RecordJwtOptions;
}
/** How a record access verifies a token it did not issue. */
interface RecordJwtOptions {
    algorithm?: JwtAlgorithm;
    key?: string;
    /** A JWKS endpoint, used instead of `algorithm` and `key`. */
    url?: string;
}
/** The algorithms SurrealDB will verify a JWT with. */
type JwtAlgorithm = "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "EDDSA";
/**
 * Token access: trust JWTs issued somewhere else.
 *
 * Either verify them against a key held here, or point at a published key set
 * and let SurrealDB fetch it. The second form keeps no secret, so unlike the
 * first it can be compared against the database and kept in sync.
 */
interface JwtAccessOptions extends AccessCommon {
    type: "JWT";
    algorithm?: JwtAlgorithm;
    /** The verification key. Redacted on read-back when it is a shared secret. */
    key?: string;
    /** A signing key, so this instance can issue tokens as well as accept them. */
    issuerKey?: string;
    /** A JWKS endpoint, used instead of `algorithm` and `key`. */
    url?: string;
}
/**
 * Bearer access: long-lived grants, issued and revoked one at a time.
 *
 * Nothing about the definition is hidden on read-back, so it is kept in sync
 * like any other definition. The grants themselves live outside the schema.
 */
interface BearerAccessOptions extends AccessCommon {
    type: "BEARER";
    /** Whether a grant authenticates a system user or a record. */
    for: "USER" | "RECORD";
}
/** Any of the three access types. */
type AccessOptions = RecordAccessOptions | JwtAccessOptions | BearerAccessOptions;
/**
 * Define an access method, letting something other than root authenticate.
 *
 * @param name - The access method name, used as `signin({ access: name })`
 * @param options - The type and its settings; `RECORD` when not stated
 *
 * @example
 * ```ts
 * access("user", { signin: "SELECT * FROM user WHERE email = $email" });
 * access("api", { type: "JWT", url: "https://issuer/.well-known/jwks.json" });
 * access("keys", { type: "BEARER", for: "RECORD" });
 * ```
 */
declare function access(name: string, options: AccessOptions): DatabaseEntity;
/** What a GraphQL config exposes: everything, nothing, or a named list. */
type GraphqlExposure = "AUTO" | "NONE" | string[];
/** Settings for `DEFINE CONFIG GRAPHQL`. */
interface GraphqlConfigOptions {
    tables?: GraphqlExposure;
    functions?: GraphqlExposure;
}
/** Settings for `DEFINE CONFIG API`. */
interface ApiConfigOptions {
    permissions?: string;
}
/**
 * Define a database-level config.
 *
 * `GRAPHQL` controls what the GraphQL endpoint exposes; `API` sets the
 * permissions on custom API routes.
 *
 * Note that a config is stored without its `DEFINE CONFIG` prefix — `INFO FOR
 * DB` reports `GRAPHQL TABLES AUTO FUNCTIONS AUTO` — and is keyed by a name
 * that matches neither the statement nor the reported value (`GraphQL`). Both
 * are handled here rather than left to the caller.
 *
 * @param kind - `GRAPHQL` or `API`
 * @param options - Settings for that kind
 *
 * @example
 * ```ts
 * config("GRAPHQL", { tables: ["user", "post"], functions: "NONE" });
 * ```
 */
declare function config(kind: "GRAPHQL", options?: GraphqlConfigOptions): DatabaseEntity;
declare function config(kind: "API", options?: ApiConfigOptions): DatabaseEntity;

export { type AccessDuration as A, type BearerAccessOptions as B, type DefinableSchema as D, type EntityKind as E, type FlatField as F, type GraphqlConfigOptions as G, type JwtAccessOptions as J, type ParamOptions as P, type RecordAccessOptions as R, type SchemaStatement as S, type DatabaseEntity as a, type AccessOptions as b, type AnalyzerOptions as c, type ApiConfigOptions as d, type DefineOptions as e, type FunctionOptions as f, type GraphqlExposure as g, type JwtAlgorithm as h, type RecordJwtOptions as i, type SequenceOptions as j, type StatementKind as k, access as l, analyzer as m, config as n, defineField as o, defineSchema as p, defineTable as q, flattenFields as r, param as s, schemaStatements as t, sequence as u, storedFunction as v };
