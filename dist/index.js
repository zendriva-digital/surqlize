import {
  WhereRule,
  authenticatedAs,
  defineEvent,
  defineField,
  defineIndex,
  defineSchema,
  defineTable,
  flattenFields,
  printSurqlType,
  quote,
  schemaStatements,
  where
} from "./chunk-QLEB32PY.js";
import {
  ApiClient,
  BatchQuery,
  CreateQuery,
  DeleteQuery,
  InsertQuery,
  LiveQuery,
  LiveSubscription,
  Orm,
  RelateQuery,
  SelectQuery,
  TableSchema,
  Transaction,
  UpdateQuery,
  UpsertQuery,
  orm,
  resolveFetchObject,
  table
} from "./chunk-3WFC57DU.js";
import {
  ANY,
  AbstractType,
  AnyType,
  ArrayType,
  BigIntType,
  BoolType,
  BytesType,
  DateType,
  DecimalType,
  DuplicateSurrealError,
  DurationType,
  EdgeSchema,
  FloatType,
  GeometryType,
  GraphType,
  IntType,
  LiteralType,
  NeverType,
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
  SurqlExpression,
  TypeParseError,
  UnionType,
  UuidType,
  ValidationError,
  __ctx,
  __display,
  __type,
  actionable,
  displayContext,
  edge,
  expr,
  intoWorkable,
  isWorkable,
  joiningFilter,
  literalWorkable,
  matchRef,
  t_exports
} from "./chunk-EQBUA4DZ.js";
import "./chunk-MLKGABMK.js";

// src/functions/standalone/and.ts
function and(...conditions) {
  return joiningFilter(conditions[0][__ctx], "AND", ...conditions);
}

// src/functions/standalone/internal.ts
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
var bytes = {
  len(value2) {
    return standaloneFn(value2, t_exports.number(), "bytes::len", value2);
  }
};

// src/functions/standalone/count.ts
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
var duration = {
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
var encoding = {
  base64Decode(value2) {
    return standaloneFn(value2, t_exports.string(), "encoding::base64::decode", value2);
  },
  base64Encode(value2) {
    return standaloneFn(value2, t_exports.string(), "encoding::base64::encode", value2);
  }
};

// src/functions/standalone/geo.ts
import { GeometryPoint } from "surrealdb";
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
  if (value2 instanceof GeometryPoint)
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
function not(value2) {
  return standaloneFn(value2, t_exports.bool(), "not", value2);
}

// src/functions/standalone/object.ts
var object = {
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
function or(...conditions) {
  return joiningFilter(conditions[0][__ctx], "OR", ...conditions);
}

// src/functions/standalone/parse.ts
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
function sleep(duration2) {
  return standaloneFn(duration2, t_exports.string(), "sleep", duration2);
}

// src/functions/standalone/time.ts
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
  fromUuid(uuid) {
    return standaloneFn(uuid, t_exports.date(), "time::from_uuid", uuid);
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
var value = {
  diff(a, b) {
    return standaloneFn(a, t_exports.string(), "value::diff", a, b);
  },
  patch(value2, diff) {
    return standaloneFn(value2, t_exports.string(), "value::patch", value2, diff);
  }
};

// src/functions/standalone/vector.ts
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

// src/schema/ddl/entities.ts
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
  const record = options;
  const parts = [];
  if (record.jwt) {
    parts.push("WITH JWT", ...jwtClauses({ type: "JWT", ...record.jwt }));
  }
  for (const [clause, query] of [
    ["SIGNUP", record.signup],
    ["SIGNIN", record.signin],
    ["AUTHENTICATE", record.authenticate]
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
  const { duration: duration2 } = options;
  const parts = [];
  if (type === "JWT" && options.url) {
    return `FOR SESSION ${duration2?.session ?? "NONE"}`;
  }
  if (type === "RECORD" && options.jwt) {
    return `FOR TOKEN ${duration2?.token ?? "1h"}, FOR SESSION ${duration2?.session ?? "NONE"}`;
  }
  if (type === "BEARER") {
    parts.push(`FOR GRANT ${duration2?.grant ?? BEARER_DURATION.grant}`);
    parts.push(`FOR TOKEN ${duration2?.token ?? BEARER_DURATION.token}`);
    parts.push(`FOR SESSION ${duration2?.session ?? BEARER_DURATION.session}`);
    return parts.join(", ");
  }
  if (duration2?.token) parts.push(`FOR TOKEN ${duration2.token}`);
  if (duration2?.session) parts.push(`FOR SESSION ${duration2.session}`);
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

// src/store/codec.ts
import { Duration, RecordId, Uuid } from "surrealdb";
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
  if (value2 instanceof RecordId) {
    return {
      [TAG]: "rid",
      table: String(value2.table),
      id: toJson(value2.id, path)
    };
  }
  if (value2 instanceof Uuid) return { [TAG]: "uuid", v: value2.toString() };
  if (value2 instanceof Duration) return { [TAG]: "dur", v: value2.toString() };
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
  const object2 = value2;
  switch (object2[TAG]) {
    case void 0:
      break;
    case "undefined":
      return void 0;
    case "number":
      return Number(object2.v);
    case "bigint":
      return BigInt(object2.v);
    case "date":
      return new Date(object2.v);
    case "rid":
      return new RecordId(object2.table, fromJson(object2.id));
    case "uuid":
      return new Uuid(object2.v);
    case "dur":
      return new Duration(object2.v);
    case "set":
      return new Set(object2.v.map(fromJson));
    case "obj":
      return decodeObject(object2.v);
    default:
      throw new TypeError(
        `Unknown tag ${String(object2[TAG])} in a stored value`
      );
  }
  return decodeObject(object2);
}
function decodeObject(object2) {
  const out = {};
  for (const [k, v] of Object.entries(object2)) out[k] = fromJson(v);
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
    opened ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return opened;
  };
  const run = async (mode, work) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  return {
    async load() {
      const db = await open();
      return new Promise((resolve, reject) => {
        const out = [];
        const request = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return resolve(out);
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
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject };
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
import { RecordId as RecordId2 } from "surrealdb";
function applyOverlay(rows, ops, keyOf2, insert, stays = () => true) {
  if (ops.length === 0) return rows;
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) map.set(keyOf2(row) ?? /* @__PURE__ */ Symbol(), row);
  for (const op of ops) applyOp(map, op, insert, stays);
  return [...map.values()];
}
function applyOp(map, op, insert, stays) {
  const id = new RecordId2(op.table, op.id);
  const key = String(id);
  if (op.kind === "delete") {
    map.delete(key);
  } else if (op.kind === "create") {
    const row = { id, ...op.data };
    if (typeof insert === "function" ? insert(row) : insert) map.set(key, row);
  } else {
    const existing = map.get(key);
    if (existing === void 0) return;
    const changed = patch(existing, op.data ?? {});
    if (stays(changed)) map.set(key, changed);
    else map.delete(key);
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
import {
  isRetryableConflict,
  RecordId as RecordId4,
  ServerError,
  toSurqlString
} from "surrealdb";

// src/store/match.ts
import { RecordId as RecordId3 } from "surrealdb";
var OPERATORS = /* @__PURE__ */ new Set([
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
    const at = rest.findIndex((y) => same(x, y));
    if (at < 0) return false;
    rest.splice(at, 1);
    return true;
  });
}
function same(a, b) {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof RecordId3 && b instanceof RecordId3)
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
var any = (results) => results.includes(true) ? true : results.includes(void 0) ? void 0 : false;
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
  return key === "and" ? all(results) : any(results);
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
  if (!isFieldName && isField && OPERATORS.has(key))
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
    const text2 = toSurqlString(value2);
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
      isPermanent: (error) => !isRetryableConflict(error) && (error instanceof ServerError || error instanceof OrmError),
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
    const key = String(new RecordId4(op.table, op.id));
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
var idValue = (id) => id instanceof RecordId4 ? id.id : id;
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
    return { id: new RecordId4(this.tb, id), committed };
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
export {
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
  t_exports as t,
  table,
  time,
  toSurql,
  type_,
  value,
  vector,
  where
};
