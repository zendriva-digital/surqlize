import { O as Orm, A as AbstractType, N as NullType, a as AnyType, b as ArrayType, B as BigIntType, c as BoolType, d as BytesType, D as DateType, e as DecimalType, f as DurationType, g as FloatType, G as GeometryKind, h as GeometryType, i as Workable, W as WorkableContext, I as IntType, j as LiteralType, k as NeverType, l as NoneType, m as NumberType, n as ObjectType, o as OptionType, P as PointType, p as RangeType, q as RecordType, r as SetType, s as StringType, U as UnionType, t as UuidType, u as Actionable, v as ContextSource, w as IntoWorkable } from './standard-schema-BtCNboat.cjs';
export { x as ANY, y as AnyGraphSegmentSpec, z as AnyTable, H as ApiClient, J as ApiEndpointSchema, K as ApiMethodDef, M as ApiMethods, Q as ApiResponse, V as BatchQuery, X as BatchResult, Y as BothStepSegments, Z as Computed, _ as ComputedExpression, $ as ComputedKeys, C as CreateInput, a0 as CreateQuery, a1 as DefaultValue, a2 as DeleteQuery, a3 as DeleteReturns, a4 as DisplayContext, a5 as DistanceMetric, a6 as DuplicateSurrealError, a7 as EdgeFields, E as EdgeSchema, a8 as EventDefinition, a9 as EventOptions, aa as EventTrigger, ab as FetchPaths, ac as FetchedSchema, ad as FieldCondition, ae as FieldOperation, af as FieldPermissionRules, ag as FieldPermissions, ah as FromOf, ai as FulltextOptions, aj as FunctionCallable, ak as FunctionSchema, al as GraphArgs, am as GraphDirection, an as GraphFilter, ao as GraphSegmentArg, ap as GraphSegmentPrimitive, aq as GraphSegmentResult, ar as GraphSegmentSpec, as as GraphType, at as HasDefault, au as HasTableDdl, av as HnswOptions, aw as HttpMethod, ax as InStepSegments, ay as IncomingEdges, az as IndexDefinition, aA as IndexOptions, aB as InferParams, aC as InsertQuery, L as LiveMessage, aD as LiveQuery, aE as LiveSubscription, aF as LooseAuthType, aG as LooseRow, aH as MappedTables, aI as ModelClass, aJ as ObjectTypeInner, aK as OperatorFilter, aL as OrderByObject, aM as OrderDirection, aN as OrmError, aO as OrmOptions, aP as OutStepSegments, aQ as OutgoingEdges, aR as PermissionContext, aS as PermissionRule, aT as RecursionBody, aU as RecursionDepth, aV as RecursionOptions, aW as RecursiveTraversal, aX as RelateEndpoint, aY as RelateQuery, aZ as RelateReturnMode, a_ as RowTraversal, a$ as SafeParseResult, b0 as SchemaMap, b1 as SchemaMapTables, b2 as SegmentBuilder, b3 as SegmentCallback, S as SelectQuery, b4 as SessionType, b5 as SplitEntry, b6 as StandardIssue, b7 as StandardSchemaProps, b8 as StandardSchemaV1, b9 as StepSegments, ba as SurqlExpression, bb as SurrealConnection, bc as TableChangefeed, bd as TableDdl, be as TableFields, bf as TableFieldsOf, bg as TableOperation, bh as TablePermissionRules, bi as TablePermissions, T as TableSchema, bj as ToOf, bk as TokenType, bl as Transaction, bm as TypeParseError, bn as UpdateQuery, bo as UpsertQuery, bp as ValidationError, bq as ValidationIssue, br as ValidationMode, bs as ValueType, bt as VectorType, bu as WhereObject, bv as WhereRule, bw as __ctx, bx as __display, by as __type, bz as api, bA as authenticatedAs, bB as defineEvent, bC as defineIndex, bD as displayContext, bE as edge, bF as expr, bG as fn, bH as orm, bI as resolveFetchObject, bJ as table, bK as where } from './standard-schema-BtCNboat.cjs';
import { GeometryPoint } from 'surrealdb';
import { S as SchemaStatement } from './entities-BLiexgXY.cjs';
export { A as AccessDuration, b as AccessOptions, c as AnalyzerOptions, d as ApiConfigOptions, B as BearerAccessOptions, a as DatabaseEntity, D as DefinableSchema, e as DefineOptions, E as EntityKind, F as FlatField, f as FunctionOptions, G as GraphqlConfigOptions, g as GraphqlExposure, J as JwtAccessOptions, h as JwtAlgorithm, P as ParamOptions, R as RecordAccessOptions, i as RecordJwtOptions, j as SequenceOptions, k as StatementKind, l as access, m as analyzer, n as config, o as defineField, p as defineSchema, q as defineTable, r as flattenFields, s as param, t as schemaStatements, u as sequence, v as storedFunction } from './entities-BLiexgXY.cjs';
import { O as OutboxOp } from './store-ChxnTd70.cjs';
export { C as ConnectionEvents, b as ConnectionSignal, c as OutboxStorage, d as QueryOptions, Q as QueryStore, e as QueryStoreDeps, S as Store, f as StoreMode, g as StoreOptions, a as StoreSnapshot, T as TableWriter, W as Write, h as createStore, i as indexedDbStorage, m as memoryStorage } from './store-ChxnTd70.cjs';

/** Something in the schema that has no `DEFINE` of its own, and why. */
interface SkippedDefinition {
    /** Where it is, such as `user.posts`. */
    path: string;
    reason: string;
}
interface SchemaOptions {
    /**
     * Whether a statement replaces a definition that exists (`overwrite`, the
     * default) or leaves it (`if-not-exists`).
     */
    mode?: "overwrite" | "if-not-exists";
}
/** The result of {@link generateSchema}. */
interface GeneratedSchema {
    /** Every table before its fields, so the output can be run top to bottom. */
    statements: SchemaStatement[];
    /** What the schema holds that is left to the client, and why. */
    skipped: SkippedDefinition[];
}
/**
 * Generate the statements for every table and edge of an ORM, with computed
 * fields, so the database enforces what the types describe.
 *
 * Nothing is guessed: what cannot be expressed in SurrealQL (a default that is a
 * function) is listed in `skipped` with its path and the reason, and left to the
 * client.
 *
 * @example
 * ```ts
 * const { statements } = generateSchema(db);
 * await surreal.query(statements.map((s) => s.sql).join("\n"));
 * ```
 */
declare function generateSchema(orm: Orm<any>, options?: SchemaOptions): GeneratedSchema;
/** The statements as the text of a `.surql` file, one per line. */
declare function toSurql(schema: GeneratedSchema): string;

/**
 * Render a type as the SurrealQL type expression used in `DEFINE FIELD … TYPE`.
 *
 * This is distinct from a type's `expected`, which describes the *TypeScript*
 * shape for error messages (`Option<string>`, `RecordId<user>`). What SurrealDB
 * wants is its own syntax (`option<string>`, `record<user>`).
 *
 * An object is `object` where its fields are defined one by one, which is the
 * case for a field and for the elements of an array. Inside a union or a tuple
 * they cannot be, so there it is a literal object type, `{ kind: 'a', n: number }`,
 * which the database also holds to exactly those keys.
 *
 * @param type - The type to render
 * @param inline - Whether an object is written out, rather than as `object`
 * @returns A SurrealQL type expression
 */
declare function printSurqlType(type: AbstractType, inline?: boolean): string;

/** Create a string type. */
declare function string(): StringType;
/** Create a number type. Use {@link int}, {@link float} or {@link decimal} when the
 * SurrealDB numeric width matters — a migration needs to know which to define. */
declare function number(): NumberType;
/** Create an integer type. Rejects fractional values. */
declare function int(): IntType;
/** Create a floating-point type. */
declare function float(): FloatType;
/** Create an arbitrary-precision decimal type. */
declare function decimal(): DecimalType;
/** Create a duration type. */
declare function duration$1(): DurationType;
/** Create a binary data type. */
declare function bytes$1(): BytesType;
/** Create an any type. Accepts every value. */
declare function any(): AnyType;
/** Create a geometry type, optionally constrained to a single kind. */
declare function geometry<const K extends GeometryKind | undefined = undefined>(kind?: K): GeometryType<K>;
/** Create a range type. SurrealDB ranges are untyped — there is no `range<T>`. */
declare function range(): RangeType;
/**
 * Create a set type: an array whose elements must be unique.
 *
 * @param schema - The element type
 * @param max - The most elements the set may hold, as `set<T, max>`
 */
declare function set<T extends AbstractType>(schema: T, max?: number): SetType<T>;
/** Create a boolean type. */
declare function bool(): BoolType;

/** Create a null type. */
declare function _null(): NullType;
/** Create a none type (SurrealDB's NONE). */
declare function none(): NoneType;
/** Create a never type. */
declare function never(): NeverType;
/** Create a datetime type. */
declare function date(): DateType;
/** Create a bigint type, for integers too large for a JS `number`. */
declare function bigint(): BigIntType;
/** Create a native SurrealDB point type. */
declare function point(): PointType;
/** Create a UUID type. */
declare function uuid(): UuidType;
/** Create an optional type. The value may be the inner type or `NONE`. */
declare function option<T extends AbstractType>(schema: T): OptionType<T>;
/** Create an object type with the given field schema. */
declare function object$1<T extends Record<string, AbstractType>>(schema: T): ObjectType<T>;
/**
 * Create an array type. Pass a single type for a homogeneous array, or a tuple
 * of types.
 *
 * @param schema - The element type, or a tuple of types
 * @param max - The most elements the array may hold, as `array<T, max>`.
 *   SurrealQL takes a maximum only; a minimum has to be an `ASSERT`.
 */
declare function array<T extends AbstractType>(schema: T, max?: number): ArrayType<T>;
declare function array<T extends AbstractType[]>(schema: [...T], max?: number): ArrayType<T>;
/** Create a union type that matches any of the given types. */
declare function union<T extends AbstractType[]>(schema: T): UnionType<T>;
/** Create a literal type that matches exactly the given value. */
declare function literal<T extends string | number | boolean>(value: T extends string ? T : T extends number ? T : T extends boolean ? T : never): LiteralType<T>;
/**
 * Create a record reference type, optionally scoped to one or more tables.
 * Passing an array (e.g. `t.record(["post", "user"])`) yields a link that
 * accepts a record from any of the given tables (`record<post | user>`).
 */
declare function record<const T extends string | undefined = undefined>(table?: T | readonly T[]): RecordType<T>;
/** Extract the inferred TypeScript type from a type definition or workable. */
type InferType<T extends AbstractType | Workable> = T extends Workable<WorkableContext, infer T> ? T["infer"] : T extends AbstractType ? T["infer"] : never;

declare const t__null: typeof _null;
declare const t_any: typeof any;
declare const t_array: typeof array;
declare const t_bigint: typeof bigint;
declare const t_bool: typeof bool;
declare const t_date: typeof date;
declare const t_decimal: typeof decimal;
declare const t_float: typeof float;
declare const t_geometry: typeof geometry;
declare const t_int: typeof int;
declare const t_literal: typeof literal;
declare const t_never: typeof never;
declare const t_none: typeof none;
declare const t_number: typeof number;
declare const t_option: typeof option;
declare const t_point: typeof point;
declare const t_range: typeof range;
declare const t_record: typeof record;
declare const t_set: typeof set;
declare const t_string: typeof string;
declare const t_union: typeof union;
declare const t_uuid: typeof uuid;
declare namespace t {
  export { t__null as _null, t_any as any, t_array as array, t_bigint as bigint, t_bool as bool, bytes$1 as bytes, t_date as date, t_decimal as decimal, duration$1 as duration, t_float as float, t_geometry as geometry, type InferType as infer, t_int as int, t_literal as literal, t_never as never, t_none as none, _null as null, t_number as number, object$1 as object, t_option as option, t_point as point, t_range as range, t_record as record, t_set as set, t_string as string, t_union as union, t_uuid as uuid };
}

/** and(...conditions) - combine multiple conditions with AND */
declare function and<C extends WorkableContext>(...conditions: [Workable<C>, Workable<C>, ...Workable<C>[]]): Actionable<C, BoolType>;

declare const bytes: {
    len<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
};

/**
 * count() - counts a row, or counts truthy values if a value is given.
 *
 * A row count renders as `count(true)` rather than `count()`: SurrealDB names a
 * bare `count()` used as a `VALUE` `count`, so a single aggregate in a GROUP ALL
 * came back as `{ count: n }` instead of `n`. `count(true)` counts the same rows.
 */
declare function count<C extends WorkableContext>(source: ContextSource<C>, value?: Workable<C>): Actionable<C, NumberType>;

declare const crypto: {
    blake3<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    joaat<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    md5<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    sha1<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    sha256<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    sha512<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    argon2Compare<C extends WorkableContext>(hash: Workable<C>, pass: Workable<C>): Actionable<C, BoolType>;
    argon2Generate<C extends WorkableContext>(pass: Workable<C>): Actionable<C, StringType>;
    bcryptCompare<C extends WorkableContext>(hash: Workable<C>, pass: Workable<C>): Actionable<C, BoolType>;
    bcryptGenerate<C extends WorkableContext>(pass: Workable<C>): Actionable<C, StringType>;
    pbkdf2Compare<C extends WorkableContext>(hash: Workable<C>, pass: Workable<C>): Actionable<C, BoolType>;
    pbkdf2Generate<C extends WorkableContext>(pass: Workable<C>): Actionable<C, StringType>;
    scryptCompare<C extends WorkableContext>(hash: Workable<C>, pass: Workable<C>): Actionable<C, BoolType>;
    scryptGenerate<C extends WorkableContext>(pass: Workable<C>): Actionable<C, StringType>;
};

declare const duration: {
    days<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    hours<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    micros<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    millis<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    mins<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    nanos<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    secs<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    weeks<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    years<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    fromDays<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromHours<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromMicros<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromMillis<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromMins<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromNanos<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromSecs<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    fromWeeks<C extends WorkableContext>(value: Workable<C>): Actionable<C, DurationType>;
    max<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DurationType>;
};

declare const encoding: {
    base64Decode<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    base64Encode<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
};

type CoordinateType = ArrayType<[NumberType, NumberType]>;
type PointExpression<C extends WorkableContext> = Workable<C, PointType | CoordinateType>;
type Coordinate = readonly [number, number];
type PointArgument<C extends WorkableContext> = PointExpression<C> | GeometryPoint | Coordinate;
type DistanceArguments<C extends WorkableContext> = [p1: PointExpression<C>, p2: PointArgument<C>] | [p1: GeometryPoint | Coordinate, p2: PointExpression<C>];
declare const geo: {
    area<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    bearing<C extends WorkableContext>(p1: Workable<C>, p2: Workable<C>): Actionable<C, NumberType>;
    centroid<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    distance<C extends WorkableContext>(...args: DistanceArguments<C>): Actionable<C, NumberType>;
    hashDecode<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    hashEncode<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    hashEncodeAccuracy<C extends WorkableContext>(value: Workable<C>, accuracy: Workable<C>): Actionable<C, StringType>;
};

declare const http: {
    head<C extends WorkableContext>(url: Workable<C>): Actionable<C, StringType>;
    get<C extends WorkableContext>(url: Workable<C>): Actionable<C, StringType>;
    put<C extends WorkableContext>(url: Workable<C>, body: Workable<C>): Actionable<C, StringType>;
    post<C extends WorkableContext>(url: Workable<C>, body: Workable<C>): Actionable<C, StringType>;
    patch<C extends WorkableContext>(url: Workable<C>, body: Workable<C>): Actionable<C, StringType>;
    del<C extends WorkableContext>(url: Workable<C>): Actionable<C, StringType>;
};

declare const math: {
    max<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    min<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    mean<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    median<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    sum<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    product<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    stddev<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    variance<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    mode<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    spread<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    interquartile<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    midhinge<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    trimean<C extends WorkableContext>(arr: Workable<C>): Actionable<C, NumberType>;
    bottom<C extends WorkableContext>(arr: Workable<C>, count: Workable<C>): Actionable<C, NumberType>;
    top<C extends WorkableContext>(arr: Workable<C>, count: Workable<C>): Actionable<C, NumberType>;
    nearestrank<C extends WorkableContext>(arr: Workable<C>, percentile: Workable<C>): Actionable<C, NumberType>;
    percentile<C extends WorkableContext>(arr: Workable<C>, percentile: Workable<C>): Actionable<C, NumberType>;
    e<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    pi<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    tau<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    inf<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    negInf<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    frac1Pi<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    frac1Sqrt2<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    frac2Pi<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    frac2SqrtPi<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    fracPi2<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    fracPi3<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    fracPi4<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    fracPi6<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    fracPi8<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    ln10<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    ln2<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    log102<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    log10E<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    log210<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    log2E<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    sqrt2<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
};

declare const meta: {
    id<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    table<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    tb<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
};

/** not(value) - logical negation */
declare function not<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;

declare const object: {
    entries<C extends WorkableContext>(value: Workable<C>): Actionable<C, ArrayType<StringType>>;
    fromEntries<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    keys<C extends WorkableContext>(value: Workable<C>): Actionable<C, ArrayType<StringType>>;
    len<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    values<C extends WorkableContext>(value: Workable<C>): Actionable<C, ArrayType<StringType>>;
};

/** or(...conditions) - combine multiple conditions with OR */
declare function or<C extends WorkableContext>(...conditions: [Workable<C>, Workable<C>, ...Workable<C>[]]): Actionable<C, BoolType>;

declare const parse: {
    emailHost<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    emailUser<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlDomain<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlFragment<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlHost<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlPath<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlPort<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    urlQuery<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    urlScheme<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
};

declare const rand: {
    rand<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    bool<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, BoolType>;
    randEnum<C extends WorkableContext>(values_0: Workable<C>, ...values: Workable<C>[]): Actionable<C, StringType>;
    float<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    floatRange<C extends WorkableContext>(min: Workable<C>, max: Workable<C>): Actionable<C, NumberType>;
    guid<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, StringType>;
    int<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    intRange<C extends WorkableContext>(min: Workable<C>, max: Workable<C>): Actionable<C, NumberType>;
    string<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, StringType>;
    time<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DateType>;
    uuid<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, UuidType>;
    ulid<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, StringType>;
};

declare const search: {
    /** `search::analyze(analyzer, value)`: the tokens `value` is analysed into. */
    analyze<C extends WorkableContext>(analyzer: Workable<C>, value: Workable<C>): Actionable<C, ArrayType<StringType>>;
    /**
     * `search::highlight(prefix, suffix, ref)`: the text of the field matched by
     * the `@ref@` clause, with each matched term wrapped in `prefix`/`suffix`.
     *
     * `fieldRef` supplies the query context. The match is identified by `ref`,
     * which must equal the N of a `.search(value, N)` clause in the same
     * statement.
     */
    highlight<C extends WorkableContext>(fieldRef: Workable<C>, prefix: IntoWorkable<C, StringType>, suffix: IntoWorkable<C, StringType>, ref: number): Actionable<C, StringType>;
    /**
     * `search::offsets(ref)`: the matched spans of the `@ref@` clause, keyed by
     * field. `fieldRef` supplies the query context; see {@link search.highlight}.
     */
    offsets<C extends WorkableContext>(fieldRef: Workable<C>, ref: number): Actionable<C, ObjectType<Record<string, ArrayType<ObjectType<{
        s: NumberType;
        e: NumberType;
    }>>>>>;
    /**
     * `search::score(ref)`: the BM25 relevance of the `@ref@` clause. `fieldRef`
     * supplies the query context; see {@link search.highlight}.
     */
    score<C extends WorkableContext>(fieldRef: Workable<C>, ref: number): Actionable<C, NumberType>;
};

declare const session: {
    ac<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<StringType>>;
    db<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<StringType>>;
    id<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, UuidType>;
    ip<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, StringType>;
    ns<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<StringType>>;
    origin<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<StringType>>;
    rd<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<RecordType<undefined>>>;
    token<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, OptionType<ObjectType<{}>>>;
};

declare const set_: {
    difference<C extends WorkableContext, T extends AbstractType>(a: Workable<C, T>, b: Workable<C>): Actionable<C, T>;
    intersect<C extends WorkableContext, T extends AbstractType>(a: Workable<C, T>, b: Workable<C>): Actionable<C, T>;
    len<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    union<C extends WorkableContext, T extends AbstractType>(a: Workable<C, T>, b: Workable<C>): Actionable<C, T>;
};

/** sleep(duration) - pauses execution */
declare function sleep<C extends WorkableContext>(duration: Workable<C>): Actionable<C, StringType>;

declare const time: {
    now<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DateType>;
    timezone<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, StringType>;
    epoch<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DateType>;
    minimum<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DateType>;
    maximum<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, DateType>;
    fromMillis<C extends WorkableContext>(ms: Workable<C>): Actionable<C, DateType>;
    fromMicros<C extends WorkableContext>(us: Workable<C>): Actionable<C, DateType>;
    fromNanos<C extends WorkableContext>(ns: Workable<C>): Actionable<C, DateType>;
    fromSecs<C extends WorkableContext>(s: Workable<C>): Actionable<C, DateType>;
    fromUnix<C extends WorkableContext>(s: Workable<C>): Actionable<C, DateType>;
    fromUlid<C extends WorkableContext>(ulid: Workable<C>): Actionable<C, DateType>;
    fromUuid<C extends WorkableContext>(uuid: Workable<C>): Actionable<C, DateType>;
    timeMin<C extends WorkableContext>(arr: Workable<C>): Actionable<C, DateType>;
    timeMax<C extends WorkableContext>(arr: Workable<C>): Actionable<C, DateType>;
};

declare const type_: {
    array<C extends WorkableContext>(value: Workable<C>): Actionable<C, ArrayType<StringType>>;
    bool<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    datetime<C extends WorkableContext>(value: Workable<C>): Actionable<C, DateType>;
    float<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    int<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    point<C extends WorkableContext>(value: Workable<C>): Actionable<C, PointType>;
    number<C extends WorkableContext>(value: Workable<C>): Actionable<C, NumberType>;
    string<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    of<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    table<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    uuid<C extends WorkableContext>(value: Workable<C>): Actionable<C, StringType>;
    isArray<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isBool<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isBytes<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isCollection<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isDatetime<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isDecimal<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isDuration<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isFloat<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isGeometry<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isInt<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isLine<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isNone<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isNull<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isMultiline<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isMultipoint<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isMultipolygon<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isNumber<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isObject<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isPoint<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isPolygon<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isRange<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isRecord<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isString<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
    isUuid<C extends WorkableContext>(value: Workable<C>): Actionable<C, BoolType>;
};

declare const value: {
    diff<C extends WorkableContext>(a: Workable<C>, b: Workable<C>): Actionable<C, StringType>;
    patch<C extends WorkableContext>(value: Workable<C>, diff: Workable<C>): Actionable<C, StringType>;
};

/**
 * A vector operand: a workable expression, or a plain array of numbers, which is
 * bound as a vector literal (the same as `db.value([...])`).
 */
type VectorArg<C extends WorkableContext = WorkableContext> = Workable<C> | number[];
/**
 * Two vector operands, at least one of which is a workable. The workable is what
 * binds the query context, so two plain arrays need `db.value()` instead.
 * `Rest` appends further arguments to the tuple.
 */
type VectorPair<C extends WorkableContext, Rest extends unknown[] = []> = [Workable<C>, VectorArg<C>, ...Rest] | [VectorArg<C>, Workable<C>, ...Rest];
declare const vector: {
    add<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    angle<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    cross<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    divide<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    dot<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    magnitude<C extends WorkableContext>(a: Workable<C>): Actionable<C, NumberType>;
    multiply<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    normalize<C extends WorkableContext>(a: Workable<C>): Actionable<C, ArrayType<NumberType>>;
    project<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    subtract<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, ArrayType<NumberType>>;
    /**
     * The distance the KNN operator computed for the row in the same query
     * (`vector::distance::knn()`). Valid only in a query with a `knn()` predicate.
     */
    distanceKnn<C extends WorkableContext>(source: ContextSource<C>): Actionable<C, NumberType>;
    distanceChebyshev<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    distanceEuclidean<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    distanceHamming<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    distanceMahalanobis<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    distanceManhattan<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    distanceMinkowski<C extends WorkableContext>(a: VectorArg<C>, b: VectorArg<C>, p: Workable<C>): Actionable<C, NumberType>;
    similarityCosine<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    similarityJaccard<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    similarityPearson<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
    similaritySpearman<C extends WorkableContext>(...args: VectorPair<C>): Actionable<C, NumberType>;
};

/**
 * Show `ops`, the writes that are waiting to be sent, on top of `rows`.
 *
 * - A create adds a row, if `insert` allows it: always, never, or when the new
 *   row passes the check it is given.
 * - An update changes the row if it is there, and removes it if the changed row
 *   no longer `stays`. A record that is not in the result is not added, as it
 *   may not belong to it.
 * - A delete removes the row.
 *
 * Rows keep their order, and created rows go at the end. The result is a new
 * array; rows that no write touches are the same objects.
 *
 * A row that `keyOf` gives no key for, such as a projection that leaves out
 * `id`, is not the record of any write. It stays where it is, and it is never
 * taken for another row.
 */
declare function applyOverlay<T>(rows: T[], ops: readonly OutboxOp[], keyOf: (row: T) => string | undefined, insert: boolean | ((row: T) => boolean), stays?: (row: T) => boolean): T[];

export { AbstractType, AnyType, ArrayType, BigIntType, BoolType, BytesType, ContextSource, DateType, DecimalType, DurationType, FloatType, type GeneratedSchema, GeometryKind, GeometryType, IntType, IntoWorkable, LiteralType, NeverType, NoneType, NullType, NumberType, ObjectType, OptionType, Orm, OutboxOp, PointType, RangeType, RecordType, type SchemaOptions, SchemaStatement, SetType, type SkippedDefinition, StringType, UnionType, UuidType, type VectorArg, Workable, WorkableContext, and, applyOverlay, bytes, count, crypto, duration, encoding, generateSchema, geo, http, math, meta, not, object, or, parse, printSurqlType, rand, search, session, set_, sleep, t, time, toSurql, type_, value, vector };
