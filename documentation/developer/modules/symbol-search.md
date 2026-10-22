# `symbol-search` — application-wide symbol search (Ctrl+K)

Feature module. A command-palette popup that searches **every schema item of every catalog** of the
connection — catalogs, entity collections, attributes (catalog, entity and reference level), sortable
attribute compounds (entity and reference level), associated data and references — and opens the selected
one in a tab. Implements [issue #86](https://github.com/FgForrest/evitalab/issues/86). It contributes no tab
type of its own.

- **Provides:** `symbolSearchServiceInjectionKey` → `SymbolSearchService` (`useSymbolSearchService()`)
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`, `toasterInjectionKey` and the tab
  factories of `catalog-viewer`, `schema-viewer`, `evitaql-console`, `graphql-console` and `entity-viewer`
- **Registered** after every module whose tab factory it injects and **before** `connection-explorer`, whose
  panel header places the magnifier button.

## Contents

| Path | Purpose |
|------|---------|
| `SymbolSearchModuleRegistrar.ts` | Builds the `SymbolActionExecutor` and the service |
| `model/SchemaSymbol.ts` | One schema item: `type`, display `name`, `path`, `attributeOwner`, `catalogStatus` (catalog symbols only). Named `SchemaSymbol` so it does not shadow the global `Symbol` |
| `model/SymbolType.ts` | Symbol kinds; the declaration order is the order of the result groups |
| `model/SymbolPath.ts`, `model/AttributeOwner.ts`, `model/CatalogSymbolStatus.ts` | Location, owner of attributes/compounds, catalog state for action enablement |
| `model/SymbolKey.ts` | One index entry: normalized key, `words`, `wordStarts`, `initialsMask` and the symbols carrying the name |
| `model/MatchTier.ts`, `model/MatchRange.ts` | Match quality (0 = exact … 5 = substring) and highlight ranges |
| `model/SymbolActionType.ts`, `model/symbolActions.ts`, `model/SymbolAction.ts`, `model/SymbolActionDisabledReason.ts` | The six actions, the static `SymbolType → actions` map, an action with its availability |
| `model/SymbolSearchResult(s).ts` | A found symbol with tier and display highlight ranges; the ordered, capped result list |
| `model/SymbolIndexState.ts` | `Idle` / `Building` (progress) / `Ready` / `LimitExceeded` / `Failed` |
| `model/SymbolSearchSelection.ts` | Keyboard/mouse selection state machine (zones, rows, actions) — pure, unit-tested |
| `service/SymbolMatcher.ts` | Normalization, word splitting, key creation, tiered matching incl. the word-prefix chain, display ranges |
| `service/CatalogSymbolPartition.ts`, `service/SymbolIndex.ts` | Per-catalog `name → symbols` partitions; linear search over distinct keys, ordering, result cap |
| `service/SymbolIndexBuilder.ts` | Reads the schemas of a catalog through the cached driver paths and builds its partition |
| `service/CatalogSchemaListeners.ts` | The catalog + per-entity schema change callbacks of one indexed catalog |
| `service/SymbolActionExecutor.ts` | Action → `workspaceService.createTab(...)`; enablement predicates |
| `service/SymbolSearchService.ts` | Facade: `open()` / `close()` / `toggle()`, reactive `opened` / `state` / `revision`, lazy build, invalidation |
| `component/SymbolSearchHost.vue` | Mounted once in `StandaloneMainView` and `DriverMainView`: binds `Command.System_SymbolSearch` globally, renders the dialog |
| `component/SymbolSearchDialog.vue` | The popup on `VLabDialog` (fixed height): `VTextField` with the shortcut in its label, `VProgressLinear`, keyboard help (`VList` of `VChip` keys) / results (`VList` + `VListItemDivider`) / `VMissingDataIndicator`, small custom footer |
| `component/SymbolSearchResultItem.vue` | One `VListItem`: type icon (`prepend`), one-line muted path + highlighted name (`title`), action `VBtn`s (`append`); the selected row is `active`, the selected action a `tonal` `primary-lightest` button |
| `component/SymbolSearchButton.vue` | Magnifier in the connection explorer header — a bare `VIcon` styled like the neighbouring ⋮ menu activator, with `VActionTooltip` advertising the command |
| `component/SymbolIndexIndicator.vue` | Status-bar spinner while indexing, warning while truncated; nothing otherwise |

The host lives in the main views, not in the connection explorer panel, because the panel can be hidden
in standalone mode and the shortcut must keep working.

## Popup behaviour

- **Activation:** `Ctrl+K` / `Cmd+K` toggles the popup from anywhere — tabs, form fields and CodeMirror
  editors included (the keymap's event filter lets `Ctrl`/`Cmd` without `Alt` through). The magnifier in the
  connection explorer header opens it. `Esc`, the close button, a click outside or a second `Ctrl+K` closes it;
  focus returns where it was, unless an action opened a tab.
- **Query kept after an action:** closing the popup by executing an action keeps the query and remembers the
  selected symbol and action; the next opening re-runs the search, re-selects that symbol (by identity, so a
  changed index does not pick a wrong row; a vanished symbol leaves the selection in the input zone) and selects
  the query text so typing replaces it. Any other way of closing clears the query.
- **While open, the active tab's shortcuts are suspended** (`Keymap.suspendActivatedContext()` /
  `resumeActivatedContext()`): otherwise e.g. `Ctrl+Enter` typed into the popup would execute the console
  query behind it. Global bindings stay active by design (`Ctrl+K` itself, tab switching/closing).
- **Focus zones:** DOM focus stays in the search field. Every keystroke that yields results **preselects the
  first symbol in the list zone**, so typing + `Enter` runs its first enabled action right away (results that
  only appear because the index grew while typing are treated the same). `↑` on the first row moves to the
  *input zone*, where no row is selected, `←`/`→` move the caret and `Enter` or `↓` enter the list on the first
  symbol again; the next keystroke preselects the first result again.
  In the *list zone* `↑`/`↓` move between symbols (no wrap; `↑` on the first row returns to the input),
  `←`/`→` between the enabled actions of the symbol, `Enter` executes the selected action and closes the
  popup. `PageUp`/`PageDown` jump by ten rows, `Ctrl+Home`/`Ctrl+End` to the ends. Moving to another row
  keeps the action index when that action exists and is enabled there.
- **Mouse:** hovering a row selects it (list zone), hovering an enabled action button selects that action
  (the tonal highlight follows the pointer, so the buttons read as clickable), clicking a row runs its
  selected action, clicking an action button runs that action. `mousedown` is prevented on the list so focus never leaves the field.
- **Footer `↵` hint** names the selected action ("open schema", "open GraphQL data API console", …), reads
  "go to results" in the input zone, and shows the disabled reason on a row whose actions are all disabled.
- **Empty query** shows the navigation help; no match shows a `VMissingDataIndicator`. Only the first **200**
  results render, with a note to refine the query.
- **Presentation** follows the entity viewer's property selector: standard Vuetify/`V*` components only. Custom
  SCSS is limited to the fixed height, the footer and the `<mark>` highlight. The list, its items and the action
  buttons carry `tabindex="-1"` and the list body prevents `mousedown`, so DOM focus never leaves the search
  field and `VList`'s own keyboard navigation never engages. Besides the key hints the footer shows the index
  state only while it is building, truncated or failed; a result count is deliberately not shown.

| Symbol | Actions, in order | Schema pointer |
|---|---|---|
| catalog | catalog preview, schema, evitaQL console, GraphQL data console, GraphQL schema console | `CatalogSchemaPointer` |
| entity collection | entity viewer (executes right away), schema | `EntitySchemaPointer` |
| attribute | schema | catalog / entity / reference attribute pointer by `AttributeOwner` |
| sortable attribute compound | schema | entity owner: `SortableAttributeCompoundSchemaPointer`; reference owner: the owning `ReferenceSchemaPointer` (no compound pointer exists at reference level) |
| associated data, reference | schema | `AssociatedDataSchemaPointer`, `ReferenceSchemaPointer` |

Catalog actions mirror `CatalogItemMenuFactory`: the preview needs a non-deactivated catalog, the rest an
alive, usable one, the GraphQL consoles also the GraphQL API (from the cached server status, re-read on every
open; unknown while offline, so they are disabled then). Actions of symbols inside a catalog are always
enabled, like `CollectionItemMenuFactory`. Disabled actions render disabled with the reason in their tooltip
(the tooltip sits on a wrapper — a disabled button gets no pointer events) and are skipped by `←`/`→`.

## Matching and ordering

The query and every key are normalized the same way: lower-cased, `-`, `_` and whitespace removed. Every
`nameVariants` value of a schema item (camelCase, PascalCase, snake_case, UPPER_SNAKE_CASE, kebab-case) is
indexed as a key pointing to the **same** `SchemaSymbol`; most collapse into one key, and a symbol hit through
several keys is returned once with its best tier. Words are split on camelCase humps, acronym ends,
digit↔letter boundaries and separators; when names of different conventions share a key (`productcode`,
`productCode`) the key keeps the finest split, whichever name was added first.

| Tier | Rule | `code` / `pc` hits |
|---|---|---|
| 0 exact | key equals the query | `code` |
| 1 prefix | key starts with the query | `codeShort` |
| 2 word start | the query occurs at a word start (any occurrence) | `productCode` |
| 3 word-prefix chain | the query splits into prefixes of consecutive words | `pc` → `parameterCategory` |
| 4 chain with skips | only when skipping words | `pv` → `parameterGroupValue` |
| 5 substring | inside a word | `barcode` |

The chain is a memoized search (the memo stores the decision: fail / skip word / piece length), because a
greedy longest-prefix cut fails on cases like `sorder` → `s|ort` + `order`. Two cheap prefilters run before it:
the first query letter must start some word (`initialsMask`; skipped for a digit), and the query must be an
in-order subsequence of the key.

Results are ordered by symbol type (catalog → entity collection → attribute → sortable attribute compound →
associated data → reference), then tier, name length, lower-cased name and path. Names are compared with a
plain `<`, not an `Intl.Collator` — schema names are identifiers, and the collator measurably slowed down short
queries with tens of thousands of hits. Highlight ranges are computed in normalized-key space and mapped onto
the display name; a hit through a variant normalizing differently from the display name renders without
highlight.

## Index building and freshness

The index is built **lazily on the first open**, one partition per catalog in name order; a partition is
searchable as soon as it is published, so results appear while later catalogs are still being read. Catalog
schemas and entity schemas are read through `queryCatalog` → `session.getCatalogSchema()` /
`getEntitySchema()` (L1 → L2 → server), with entity types taken from the cached **catalog statistics** — never
`CatalogSchema.entitySchemas()`, which calls the uncached `getAllEntityTypes` and memoizes on the schema
instance. A warm build therefore needs no server at all and works offline. Catalogs that are unusable or
neither alive nor warming up get their catalog symbol only, without touching a session (deliberately stricter
than `CatalogItem.vue`'s `openable`; transient states are picked up later through the fingerprint).

**Warm-up catalogs:** evitaDB permits a single session on a warming-up catalog, and the shared one is
read-write there. After reading such a catalog the builder calls `EvitaClient.closeSharedSession()` (evict + close
once idle): a session left open by an indexing nobody sees would block every schema mutation of the catalog, and a
tab reading concurrently simply gets a fresh session on its next call. A catalog
whose schemas cannot be read is logged, indexed with its catalog symbol only and retried on the next open; when
not even the catalog listing can be read, the state is `Failed`, the toaster reports it and the popup offers a
retry.

Freshness rides on the driver's change callbacks only:

| Event | Reaction |
|---|---|
| catalog schema callback, entity schema callback (per indexed entity type) | mark the catalog dirty. Both levels are needed — entity schema changes notify **only** entity listeners |
| catalog statistics callback | schedules (`setTimeout`, no I/O inline — the cache awaits its callbacks one by one) a comparison of **structural fingerprints**: name, state, unusable, read-only, sorted entity types. Vanished catalogs are dropped, changed and new ones marked dirty. The catalog version is never part of it: every data commit bumps it |

Listeners are registered when a catalog's first build starts (so a revalidation landing mid-build is not missed)
and live as long as the catalog's partition: a rebuild only adds the callbacks of new entity types and removes
those of vanished ones (`CatalogSchemaListeners.update`). Re-registering everything on each rebuild used to churn
the very callback lists the driver was dispatching from, and other tabs could miss the change.
They are unregistered when the catalog is dropped. Dirty marks are coalesced by a 50 ms trailing debounce
— a catalog-wide invalidation notifies the catalog listener and every entity listener with persistent-cache
deletions in between. Dirty catalogs are rebuilt only while the popup is open, otherwise on the next open; the
stale partition stays searchable until its replacement is published. A per-catalog **generation counter**
discards a build that was superseded by a change of its catalog while it ran. Concurrent `ensureIndex()` calls
share one build.

## Size limit and measurements

`maxIndexedSymbols = 50_000` (`SymbolIndex.ts`). Catalogs are indexed in name order; the first catalog that
would exceed the limit and all after it are left out, the state becomes `LimitExceeded`, the status bar shows a
warning and the popup footer says how many catalogs are missing. The left-out catalogs are remembered with their
fingerprint and, when read, their symbol count. They are therefore not re-read on every data commit, only when their
structure or the room left under the limit changes. The limit is a safety net against pathological
servers, not a memory budget — browsers expose no portable memory API (`performance.memory` is Chromium-only,
`measureUserAgentSpecificMemory()` needs cross-origin isolation).

Measured 2026-10-20 (Node 22, real `EvitaClient` against the local evitaDB canary with the demo dataset, and a
synthetic benchmark):

| Measurement | Result |
|---|---|
| demo dataset | 1 catalog, 455 symbols, 199 distinct keys |
| build — cold (L1 + L2 empty, 21 sequential server reads) | ~2.2 s in Node; in the browser the full index was searchable within ~1.5 s of the first open |
| build — warm (new client, L2 hit) / hot (L1 hit) | ~50 ms / ~2 ms |
| search on the demo dataset | 0.004–0.18 ms per query |
| heap, realistic names (50 k symbols, 17.5 k keys) | ~21 MB (~440 B/symbol) |
| heap, worst case (50 k symbols, 50 k distinct keys) | ~49 MB (~1 KB/symbol) |
| search, 50 k symbols | 1–3 ms typical; ~25 ms for a one-letter query matching ~39 k symbols (dominated by sorting) |

Search runs on the main thread after a 50 ms debounce; no Web Worker is needed at these numbers. A startup
prebuild was considered and left out — the warm build is ~50 ms.

## Related

- [`keymap`](keymap.md) — `Command.System_SymbolSearch`, context suspension
- [`connection-explorer`](connection-explorer.md) — the header button
- [`workspace`](workspace.md) — host in the main views, status-bar indicator
- [database driver — caching & change callbacks](../database-driver.md#caching--change-callbacks)
