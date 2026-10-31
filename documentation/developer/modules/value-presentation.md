# `value-presentation` — human-readable evitaDB values

Generic module. Owns how evitaDB values are shown to people: locale-aware, human-readable text for every
`Scalar` (and, later, the text an editor works with). The driver's data types (`database-driver/data-type/`) hold
data only — their `toString()` is the canonical ISO / wire form — so anything that displays a value to the user
prints it through this module.

`ValuePresentationModuleRegistrar` constructs `EvitaValuePrinter` with the default printer tables and provides it
under `evitaValuePrinterInjectionKey`. It is registered right after `DatabaseDriverModuleRegistrar`, before every
consumer. There are no exported singletons: components get the printer through `useEvitaValuePrinter()`, services
through their constructor (passed in by their module's registrar), generic helpers (`src/utils`) as a parameter.

## Dependencies

Of the modules, imports only `database-driver` (types and enums), `base/exception` and `@/vue-plugins/i18n` (plus `src/utils`,
the `@/ModuleRegistrar` / `@/ModuleContextBuilder` registration API and third-party libraries such as Luxon and
Immutable). `database-driver` and `base`
must never import it — `base` stays generic, and the data layer must not drag presentation along to every consumer.
Both directions are enforced by `no-restricted-imports` overrides in `eslint.config.mjs`
(see [module dependency rules](index.md#module-dependency-rules)).

## Contents

| File | Purpose |
|------|---------|
| `ValuePresentationModuleRegistrar.ts` | provides `EvitaValuePrinter` |
| `service/ValuePrinter.ts` | `ValuePrinter<T, C = void>` — `print(value, context)`; never called with `null`/`undefined` |
| `service/ValueEditor.ts` | `ValueEditor<T, C = void>` — `toEditRepresentation(value, context)` / `parse(text, context)`; interface only, no implementations yet |
| `service/PrimitiveValuePrinter.ts` | strings, numbers, `bigint`s, booleans by `String()`; complex data (plain objects/arrays) as `bigint`-safe JSON |
| `service/DataTypeValuePrinter.ts` | one driver data type through a format function |
| `service/RangeValuePrinter.ts` | a range through the printer of its end type, an open end as `∞` |
| `service/ArrayValuePrinter.ts` | an array (`ImmutableList` or plain array) item by item as `[a, b]` |
| `service/scalarValuePrinters.ts` | the default tables `defaultScalarValuePrinters` (by `Scalar`) and `defaultDataTypeValuePrinters` (by class); the per-type printer instances are module-private |
| `service/EvitaValuePrinter.ts` | the injectable delegator `EvitaValuePrinter` (`evitaValuePrinterInjectionKey`, `useEvitaValuePrinter()`), including the translated enums |

## Printing a value

```ts
import { EvitaValuePrinter, useEvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'

const evitaValuePrinter: EvitaValuePrinter = useEvitaValuePrinter()   // in a component's setup

evitaValuePrinter.print(task.created)                    // '8/12/26, 2:05:09 PM GMT+2'
evitaValuePrinter.print(attributeValue, schema.type)     // the Scalar decides when it is known
evitaValuePrinter.print(undefined)                       // ''
```

`print(value, scalar?)` looks the printer up in two ways that reach the **same printer instances**:

- **By `Scalar`** when the caller knows it (e.g. an attribute column with its schema). Prefer this: the runtime type
  cannot tell `Byte`/`Short`/`Integer` apart, nor an array value from complex data that happens to be an array.
  With a scalar, a plain array in an `…Array` column prints item by item and in a `ComplexDataObject` column as JSON.
- **By runtime type** otherwise, in this order: `null`/`undefined` → `''`; a driver data type → the first matching
  class in `defaultDataTypeValuePrinters`; an `ImmutableList` → items recursively as `[a, b]`; a plain object **or
  plain array** → JSON (`serializeJsonWithBigInt`, the driver keeps arrays as `ImmutableList`, so a plain array is
  complex data); anything else → `String(value)`.

`defaultDataTypeValuePrinters` is a list, and the first match wins — a subclass must precede its base class
(`DateTimeRange` before `Range`, or ranges of date-times would print their ISO `toString()`). A test pins the order.

The scalar table is typed `{ readonly [S in Scalar]: ValuePrinter<any> }`, so a new `Scalar` does not compile until it
gets a printer. Both tables are constructor parameters of `EvitaValuePrinter` (defaulting to the two default tables);
a caller needing a different printer for one type builds its own instance instead of mutating a global registry, and
tests construct `new EvitaValuePrinter()` where they need one.

## Texts

| Values | Text |
|--------|------|
| `String`, `Character`, `Byte`, `Short`, `Integer`, `Long`, `Boolean` | `String(value)` — numbers are **not** localized: primary keys, codes and EANs must not get thousands separators |
| `BigDecimal`, `Locale`, `Currency`, `UUID` | canonical form (`toString()`) |
| `Predecessor`, `ReferencedEntityPredecessor` | the predecessor's primary key, `Head` for the head of the list |
| `OffsetDateTime` | Luxon, `dateStyle: 'short'`, `timeStyle: 'long'`, **in the value's own offset** — the offset marker is part of the text (`7/1/24, 2:00:00 AM GMT+2`) |
| `DateTimeRange` | `[from,to]`, each end in its own offset with `dateStyle: 'medium'` (`[Jul 1, 2024, 12:00:00 AM UTC,∞]`) — a dedicated end format, not the `OffsetDateTime` printer |
| `LocalDateTime` | `Intl.DateTimeFormat`, medium date and time, over `new Date(isoDate)` — the offset-less ISO text is read and formatted in the viewer's zone, so the wall-clock value is kept |
| `LocalDate`, `LocalTime` | Luxon `fromISO` (medium date / medium time) — `new Date(...)` reads a bare date as UTC midnight and rejects a bare time |
| `IntegerNumberRange`, `ShortNumberRange`, `ByteNumberRange` | `from,to` |
| `LongNumberRange` | `[from, to]` |
| `BigDecimalNumberRange` | `[from,to]` |
| arrays | `[a, b]`, a missing item as `''` |
| `ComplexDataObject` | JSON, `bigint`-safe |

The range formats differ only because they did before the printers moved here; they are pinned by
`test/modules/value-presentation/service/dataTypePrintedTexts.test.ts` together with every other data type text.

`printEntityScope(scope)` and `printPriceInnerRecordHandling(handling)` translate the driver's enums through
`common.scope.*` and `common.priceInnerRecordHandling.*` (keyed by the enum's raw value, see
[i18n](../i18n.md#rules)); a value that is not a member of the enum (checked against the key records, not
`Object.values` — `EntityScope` is merged with a namespace) falls back to `print(value)`: an unexpected server
value by its string form, a missing one as `''`. The runtime dispatch of
`print` does not reach them — an enum value is a plain string at runtime — so the caller picks the method explicitly.

## Composite values

Values composed of several evitaDB values that only one consumer displays (e.g. the entity viewer's prices with the
selected price type as context) have no printers here. `EvitaValuePrinter` deliberately does **not** dispatch to them
at runtime: type erasure cannot tell a composite that needs a context from one that does not, and calling one without
its context would silently print the wrong text. Composites are printed only by the consumer that holds their context.

The entity viewer's `EntityPropertyValuePrinter` (an injectable service of that module, constructed with the provided
`EvitaValuePrinter`) binds the printer to the scalar columns and prints the composite ones by their preview with the
grid context (see [entity viewer — human-readable values](entity-viewer.md#human-readable-values)). The entity viewer
also converts GraphQL wire values into the driver's data types before printing (`GraphQLValueConverter`), so the
printers only ever receive model values.

## Adding a scalar or a data type

1. Add the (module-private) printer instance to `scalarValuePrinters.ts` — the scalar table fails to compile until you do.
2. If the value is a new driver class, add it to `defaultDataTypeValuePrinters`, before any of its base classes.
3. Add its text to the table in `dataTypePrintedTexts.test.ts`.
