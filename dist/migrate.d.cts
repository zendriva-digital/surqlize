import { E as EntityKind, D as DefinableSchema, a as DatabaseEntity } from './entities-BLiexgXY.cjs';
import { SurrealSession } from 'surrealdb';
import './standard-schema-BtCNboat.cjs';

/**
 * Reducing `DEFINE` statements to a comparable form.
 *
 * A migration needs to answer one question: does what the schema says match
 * what the database has? Both sides are `DEFINE` statements, but they are
 * spelled differently — SurrealDB rewrites a definition when it stores it, and
 * fills in defaults that were never written.
 *
 * Rather than predict those rewrites, both sides are reduced to the same
 * canonical form and compared. Every rule below was found by writing a
 * statement, reading it back, and diffing the two; they are pinned in
 * tests/integration/canonical.test.ts so a change in SurrealDB surfaces as a
 * failing test rather than a migration that never converges.
 */
/**
 * Reduce a `DEFINE` statement to the form used for comparison.
 *
 * @param statement - A generated or stored `DEFINE` statement
 * @returns A canonical string, comparable with any other canonicalised statement
 */
declare function canonicalise(statement: string): string;
/** Whether two `DEFINE` statements define the same thing. */
declare function equivalent(a: string, b: string): boolean;

/** A table as the database currently has it, with its definitions verbatim. */
interface CurrentTable {
    name: string;
    /** The `DEFINE TABLE` statement SurrealDB reports. */
    definition: string;
    /** Each field's `DEFINE FIELD` statement, keyed by field path. */
    fields: Record<string, string>;
    /** Each index's `DEFINE INDEX` statement, keyed by index name. */
    indexes: Record<string, string>;
    /** Each event's `DEFINE EVENT` statement, keyed by event name. */
    events: Record<string, string>;
}
/** The database's current schema, as statements rather than parsed structures. */
interface CurrentSchema {
    tables: Record<string, CurrentTable>;
    /** Database-level definitions, keyed by kind and then by name. */
    entities: Record<EntityKind, Record<string, string>>;
}
/**
 * The table migrations are recorded in. Excluded from introspection so it never
 * shows up as drift against a schema that does not declare it.
 */
declare const MIGRATIONS_TABLE = "_migrations";
/**
 * Read the database's current schema.
 *
 * Definitions are kept as the statements SurrealDB reports rather than being
 * parsed into properties. Comparison happens through {@link canonicalise}, so
 * there is nothing to gain from taking them apart — and a parser would be one
 * more thing to keep in step with SurrealDB's output.
 *
 * @param surreal - A session already pointed at the target namespace and database
 * @returns Every table, with its fields, indexes and events
 */
declare function introspect(surreal: SurrealSession): Promise<CurrentSchema>;

/** One change a migration makes, with the statements to apply and undo it. */
interface Change {
    kind: "table.create" | "table.modify" | "table.remove" | "field.create" | "field.modify" | "field.remove" | "field.rename" | "index.create" | "index.modify" | "index.remove" | "event.create" | "event.modify" | "event.remove" | "entity.create" | "entity.modify" | "entity.remove";
    /** What changed, e.g. `user` or `user.email`. */
    target: string;
    /** The statements that apply it. These are what runs, so they hold any key. */
    up: string[];
    /**
     * `up` in the form that is safe to print and to record: a signing key is
     * replaced by a placeholder, and everything else is as it is in `up`.
     */
    display: string[];
    down: string[];
}
/** The result of comparing a schema against a database. */
interface Diff {
    changes: Change[];
    /** Every `up` statement, in order. */
    up: string[];
    /** Every `display` statement, in the same order, for printing and recording. */
    display: string[];
    /** Every `down` statement, in reverse order. */
    down: string[];
}
/** How to treat things in the database that the schema does not mention. */
interface DiffOptions {
    /**
     * Drop tables and fields the schema no longer declares.
     *
     * Off by default: a schema is usually a partial view of a database, and
     * dropping whatever it does not mention destroys data. The CLI turns this on
     * explicitly.
     */
    removeMissing?: boolean;
}
/**
 * Compare a set of schemas against the database's current state.
 *
 * @param schemas - The tables and edges the schema declares
 * @param current - The database's current schema, from {@link introspect}
 * @param options - How to treat undeclared tables and fields
 * @returns The changes needed to bring the database in line
 */
declare function diff(definitions: (DefinableSchema | DatabaseEntity)[], current: CurrentSchema, options?: DiffOptions): Diff;

/** A migration that has been applied, as recorded in the database. */
interface AppliedMigration {
    /** When it ran, and what makes it unique. */
    id: string;
    appliedAt: string;
    /**
     * The statements that were run, in the form `plan()` reports as `display`: a
     * signing key is replaced by a placeholder, never recorded.
     */
    up: string[];
    /** The statements that undo them. */
    down: string[];
    /** A digest of `up` as recorded, so a tampered history can be detected. */
    checksum: string;
}
/** What `plan()` worked out needs doing. */
interface MigrationPlan extends Diff {
    /** Whether there is anything to apply. */
    hasChanges: boolean;
}
/**
 * Work out what a schema would change, without changing anything.
 *
 * @param surreal - A session pointed at the target namespace and database
 * @param schemas - The tables and edges the schema declares
 * @param options - How to treat undeclared tables and fields
 */
declare function plan(surreal: SurrealSession, schemas: (DefinableSchema | DatabaseEntity)[], options?: DiffOptions): Promise<MigrationPlan>;
/**
 * Bring the database in line with the schema, recording what was done.
 *
 * Statements run in one query so SurrealDB applies them together — a failure
 * part-way leaves the earlier statements applied, which is why `plan()` exists
 * and why the CLI shows the plan before running it.
 *
 * @param surreal - A session pointed at the target namespace and database
 * @param schemas - The tables and edges the schema declares
 * @param options - How to treat undeclared tables and fields
 * @returns The migration that was recorded, or null when nothing needed doing
 */
declare function migrate(surreal: SurrealSession, schemas: (DefinableSchema | DatabaseEntity)[], options?: DiffOptions): Promise<AppliedMigration | null>;
/**
 * Undo the most recent migration.
 *
 * Refuses when undoing it would restore an access method whose key the database
 * hid: the key cannot be recovered, and restoring the text the database reports
 * would set it to a value anyone can sign a token with.
 *
 * @param surreal - A session pointed at the target namespace and database
 * @returns The migration that was undone, or null when there is no history
 */
declare function rollback(surreal: SurrealSession): Promise<AppliedMigration | null>;
/**
 * Every migration that has been applied, oldest first.
 *
 * @param surreal - A session pointed at the target namespace and database
 */
declare function applied(surreal: SurrealSession): Promise<AppliedMigration[]>;
/**
 * A digest of the statements a migration applied.
 *
 * Recorded so a rollback can tell that the history it is about to reverse is
 * the history that was written — an edited `up` means the `down` no longer
 * undoes it.
 */
declare function checksum(statements: string[]): string;

export { type AppliedMigration, type Change, type CurrentSchema, type CurrentTable, type Diff, type DiffOptions, MIGRATIONS_TABLE, type MigrationPlan, applied, canonicalise, checksum, diff, equivalent, introspect, migrate, plan, rollback };
