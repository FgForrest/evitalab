# `rest-console` — REST API console

Feature module. A console tab for calling the operations of evitaDB's **REST API** — the catalog API
(`/rest/<catalog>`) and the system API (`/rest/system`) — with an endpoint picker built from the OpenAPI
specification, a generated parameter form, a JSON body editor with OpenAPI-aware completion and lint, the raw
response with status, duration and size, and the shared result visualisers. Contributes `TabType.RestConsole`.

- **Provides:** `restConsoleServiceInjectionKey`, `restConsoleTabFactoryInjectionKey`,
  `restResultVisualiserServiceInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`, `tabFactoryRegistryInjectionKey`

Registered right after [`graphql-console`](graphql-console.md) and before
[`symbol-search`](symbol-search.md) and [`connection-explorer`](connection-explorer.md), which inject its tab
factory. Opened from a catalog's menu (*REST API console*), from a catalog result of the symbol search (the same
action) and from the connection menu (*REST System API console*), all enabled only when the server reports
`ApiType.Rest` as enabled.

Structurally a sibling of the [`graphql-console`](graphql-console.md): the panel logic (collapsible panels, focus
tracking, first-result behaviour, prettify/minify rules) is a copy of it and follows the same rules described there.

## Layout

Everything under `console/`:

| Path | What's in it |
|------|--------------|
| `component/RestConsole.vue` | The tab: toolbar, side tabs, request and result panes |
| `component/RestEndpointPicker.vue` | Searchable, grouped endpoint combobox |
| `component/RestParameterForm.vue`, `RestParameterInput.vue` | The generated parameter form, one input per parameter kind |
| `component/RestMethodChip.vue` | The coloured method chip |
| `service/createRestResultStatus.ts` | Response → the shared [result status bar](console.md#result-status-bar) |
| `service/endpointPickerNavigation.ts` | Arrow-key movement of the picker's highlighted row |
| `model/RestOperation.ts` | One `(path, method)` of the specification — operation id, templated path, parameters, body |
| `model/RestEndpoint.ts` | A logical endpoint of the picker: an operation and its localized twin |
| `model/RestOperationGroup.ts`, `RestOperationCatalog.ts` | Endpoints grouped by collection / catalog / system |
| `model/RestParameter*.ts` | Parameter, its kind and location, the form value (`RestParameterValue`), validation failures |
| `model/RestConsoleDataPointer.ts` | What the tab points at (connection, catalog, `RestInstanceType`), plus `restSystemCatalogName` |
| `service/RestConsoleService.ts` | Mediates `EvitaClient`: specification, locales, calls, body language support |
| `service/buildRestOperationCatalog.ts` | Specification → endpoint catalog (below) |
| `service/buildRestRequest.ts`, `validateRestParameterValue.ts` | Form values → `RestRequest`; per-kind validation and `findInvalidRestParameters` (what blocks a run) |
| `service/resolveInitialRestSelection.ts` | Tab data → the endpoint, locale, parameters and body a console starts with |
| `service/injectQueryTelemetry.ts` | [Run with telemetry](#run-with-telemetry) |
| `service/restLanguageSupport.ts` | Lazy loading of the language-server packages |
| `service/parseRestResultJson.ts` | `parseRestResult` — the single parse of a response for both views (bigint-safe for the visualisers) |
| `service/restEndpointDisplayName.ts` | Localized endpoint and group names |
| `history/` | `RestConsoleHistory.vue`, `RestConsoleHistoryKey`, `RestConsoleHistoryRecord` |
| `result-visualiser/` | `RestResultVisualiserService`, `RestResultAnalyzer` and the six REST parsers |
| `workspace/` | `RestConsoleTabDefinition` (`mdi-api`), params/data DTOs, `RestConsoleTabFactory` |

`RestInstanceType` (`Catalog` | `System`) and the request/response/specification models live in
[`database-driver`](database-driver.md) under `connector/rest/model/` — unlike `GraphQLInstanceType`, the driver
does not depend on this module.

## The System instance and its catalog name

As with the GraphQL console, a System tab carries the stable catalog name `system` (`restSystemCatalogName`),
because the specification cache, the history key and the serialized tab params are keyed by (catalog name,
instance type). The request URL is built from the instance type alone and the tab title, subject path and URL
preview suppress the name.

## Endpoint catalog

`buildRestOperationCatalog(document, instanceType)` turns the parsed specification into `RestOperationGroup`s:

- Every `(path, method)` becomes a `RestOperation`, except `/` (the specification itself) and `/change-captures`
  (a stream). The specification has no `tags` or `summary`, only `operationId` and `description`.
- **Localized twins** — evitaDB exposes nearly every read twice: `/Product/query` (`queryProduct`) and
  `/{locale}/Product/query` (`queryProductLocalized`). A `/{locale}/…` operation whose id ends with `Localized` is
  merged with the operation of the same method whose id lacks the suffix into one `RestEndpoint` (`localized` /
  `nonLocalized` variant). Twins are merged **before** grouping, so the lower-case `/entity/*` twins are merged
  too. Each variant keeps its own parameters: the non-localized `get*` variant additionally takes `locale` and
  `dataInLocales` as query parameters, shown as ordinary parameters when the locale switch is `—`.
- **Groups** — the catalog API is grouped by entity collection, i.e. the first path segment after the optional
  `{locale}` when it starts with an upper-case letter (it is the PascalCase name variant of the entity type);
  everything else (`/schema`, `/entity/*`, `/collections`) goes to the *Catalog* group, placed last. The system API
  is a single *System* group. Groups are sorted alphabetically.
- **Operation key and ordering** — the endpoint id is the non-localized operation id; stripped of the collection
  name it gives the operation key (`getProductById` → `getById`). Endpoints of a group are ordered by a fixed list
  of keys (`query`, `list`, `get`, `getById`, `upsert`, `delete`, `deleteByQuery`, `getSchema`, `updateSchema`, then
  the catalog-level and system keys), unknown ones after them by path. The display name is
  `restConsole.operationName.<key>` when the key is localized, the raw operation id otherwise.
- **Parameter kinds** (`RestParameterKind`), `$ref`s resolved against the document:

| Schema | Kind | Input |
|---|---|---|
| `format: locale` (directly or via `$ref`, e.g. `CatalogLocale`) — **wins over `enum`** | `Locale` | select over the catalog's locales |
| `enum` (incl. `$ref`ed `CatalogCurrency`, `PriceContentMode`, `Scope`, …) | `Enum` | select, clearable when optional |
| `boolean` | `Boolean` | tri-state toggle `unset` / `true` / `false` |
| `integer` (`int32`/`int64`) / `number` | `Integer` / `Number` | text field with numeric validation |
| `string` + `format: date-time` | `DateTime` | `VDateTimeInput` (picker wizard or typed text), sent as ISO 8601 with offset |
| array of locales / of enums / of anything else | `LocaleArray` / `EnumArray` / `StringArray` | multi-select chips / free-text chips combobox |
| anything else | `String` | text field, raw type shown |

Path parameters are always required. The form lists **all** parameters, path parameters first, required ones
with an asterisk. Unset optional parameters are **never sent** — evitaDB rejects empty and unknown query
parameters with 400. `buildRestRequest` substitutes (and encodes) path parameters, sends array values as repeated
keys (`scope=LIVE&scope=ARCHIVED`, OpenAPI's default form + explode, which is how the server reads them), and
sends a body only for operations that accept one, and only when it is not blank. A required parameter left empty,
an invalid value, or a localized variant without a chosen locale (which would otherwise send a literal `{locale}`)
blocks the run with a toaster warning naming the parameters (`findInvalidRestParameters`).

### Locales

The locale switch (`—` = non-localized variant, then the locales) is shown for endpoints with a localized twin.
The locales come from the **catalog schema**: for collection endpoints the `locales` of the entity schema whose
PascalCase name variant matches the collection, for catalog-level endpoints the union of all entity schemas'
locales — which is how evitaDB builds its `CatalogLocale` enum. They are re-read whenever the specification is
reloaded through the change callback, because both are derived from the catalog schema. The System API has no schema and falls back to
the `enum` of the specification's `locale` parameter. The `{locale}` path parameter is displayed read-only in the
form ("set by Locale above"). A fresh console starts on the first locale.

### Endpoint picker

A `VMenu` over a searchable, grouped `VList`. The search field gets the caret once the menu has entered
(`@after-enter` — earlier the field does not exist yet and the focus is lost), so typing and the keyboard work right
after opening: **ArrowUp / ArrowDown** move a highlighted row through the filtered endpoints across groups (clamped
at both ends, scrolled into view), **Enter** selects it, **Escape** closes the menu (Vuetify's overlay handles it, no
own handler). Every opening highlights the current endpoint when the filters still show it, otherwise the first
row; the highlight also resets to the first row whenever the search, a filter or the catalog changes. The search
text is split and matched by `service/endpointPickerSearch.ts` — the field is clearable and Vuetify sets a cleared
field to `null`, which the helper treats as no terms. The Enter handler stops propagation, because `VMenu`'s content
keydown handler would otherwise act on it too.

The activator card is focusable (`tabindex="0"`, `role="button"`) and opens the menu on ArrowDown, ArrowUp, Enter
and Space itself. `VMenu`'s own activator keydown handler is removed from the slot props: it opens the menu on the
arrows and then moves the focus to the next focusable child — past the search field, into the list. The search field uses `bg-color="primary-dark"`: the global
`.v-field__input` rule of `settings.scss` darkens only the input area, which left the leading and trailing icons on
a lighter background.

**The dropdown card must fill the menu's overlay content** (`width: 100%`). `VMenu` stretches the overlay content
to the activator's width — the whole request panel — so a narrower card leaves an invisible part of the overlay
next to it; a click there counts as a click *inside* the menu and the menu stays open.

**Outside presses close the picker in the capture phase.** Vuetify closes a menu on an outside click only while it
is the top-most overlay (`globalTop`), and the selects and comboboxes of the parameter form open their own menu
already on mousedown — clicking such a parameter left the picker open underneath the new menu (reproduced at
1600×1000). While open, the picker listens for `pointerdown` on the document in the capture phase and closes itself
when the press lands neither in its dropdown nor on its activator. The activator element is read from the menu
(`VMenu`'s exposed `activatorEl`): the activator slot's props carry Vuetify's own `ref`, so a template ref on the
activator would be overwritten.

### Switching endpoints

Values of parameters that exist with the same name and kind in the new endpoint are kept, the others dropped. The
body is never replaced — nothing the user wrote is thrown away silently. The body editor stays **mounted** (hidden)
for operations without a body, so its undo history survives, exactly like the collapsed panels.

## Request panel views

The left side tabs are **Request** (`mdi-database-search`, the same icon as the other consoles' query view),
**History** and **OpenAPI** (`mdi-file-code`) — a read-only `VPreviewEditor` with the pretty-printed specification,
like the GraphQL console's schema viewer. It is filled lazily on its first opening (`@group:selected`) and kept in
sync when the specification is reloaded afterwards. Measured on the 8.5 MB catalog specification (local evitaDB,
Chrome): the first opening is one ~65 ms long task (stringify + CodeMirror document), the view is painted after
~70 ms; CodeMirror renders only the visible lines, so scrolling stays smooth.

### Request view layout

The request view is a flex column of three parts: the **header** (picker, description, locale switch and URL),
the **parameters** and the **body** (its caption + `VQueryEditor`). Only the parameters scroll — the body editor
must never scroll along with the form:

- **With a body**, the parameters take their content height, capped at 40 % of the view (`max-height`), and the
  editor takes the rest; in a very low window both keep a minimum (parameters 4 rem, editor 6 rem), and below
  roughly header + 10 rem the view clips the bottom of the editor.
- **Without a body**, the parameters fill the whole remaining height and the "takes no request body" note scrolls
  with them at their end.

The view sets `overflow: hidden`, and that is load-bearing: the workspace styles every `.v-window-item` as a grid
with a `1fr` row (`WorkspaceTabWindowList.vue`), whose automatic minimum is the content height — without it the row
grows to fit all parameters, nothing is constrained and nothing can scroll. A non-visible overflow drops the grid
item's automatic minimum height to zero.

## Body editor

`VQueryEditor` with the `json(context, metaProvider)` extension of `@ruzito/oas-ls-codemirror` (it already contains
the lang-json language support, which is therefore not added separately). The meta provider returns the method and
the **templated** path of the selected variant plus `Content-Type: application/json`; the package prepends a
synthetic request head to the body and shifts offsets back, so the editor contains only JSON. The extension is
swapped into a CodeMirror compartment (plain JSON until it is loaded), so the editor is never remounted.

- The packages are loaded lazily (`import()` in `restLanguageSupport.ts`); they bundle three WebAssembly binaries.
  The driver run mode builds with `inlineDynamicImports`, so there they end up in the single bundle anyway.
- The language-server context is `{ root: parsedDocument, externalRefs: {} }`, built once per specification object
  and shared by all consoles (`RestConsoleService`). The package's `parseOas` is **never** called — it would parse
  the several megabytes large text again and log the whole context — and neither is `fetchOas` (bare `fetch`).
- **Known limitations of the package (1.0.0):** no completion of enum values (e.g. `queryTelemetry`,
  `entityLocaleEquals` offer only a placeholder), hover documentation is not implemented (documentation shows only
  in the completion info panel), and its own `autocompletion({ override })` would clash should `VQueryEditor` ever
  set an override itself. Some numeric literals are linted as wrong types.

Prettify/minify (`Shift+Alt+F` / `Shift+Alt+M`) format the body with `formatJson` and are available only while the
caret sits in the request panel and the operation has a body.

## Specification cache

The console reads the specification through `EvitaClient.getRestOpenApi(catalogName, instanceType)` — memory, then
IndexedDB, then a download — and listens on `registerRestOpenApiChangedCallback`. It is dropped with the catalog's
schema caches (`clearSchemaCache`, `clearCache`, catalog rename/replace/delete), which fires the callback so open
consoles reload once, keeping the selected operation, parameters and body. **Reload OpenAPI** (`mdi-refresh`) uses
the fetch-first `refreshRestOpenApi`, which swaps and notifies only when the hash of the text changed. Details:
[database driver — REST access](../database-driver.md#rest-access).

While the specification downloads the tab shows the loading screen; a failure (an error status carries the
server's message) shows the tab error screen with a retry.

## Result

The right panel has the **Raw** view and, for the catalog API, the **Visualise** view. The shared
[`ResultStatusBar`](console.md#result-status-bar) above them shows the HTTP status (success colour for 2xx, error
colour otherwise), duration, size and `METHOD path` of the executed request.
**4xx/5xx responses are a regular result** — evitaDB answers `{ errorCode, message }` and it is shown in the raw
view; only transport failures (unreachable server, deadline) go to `useToaster().error(...)`.

The body is parsed **once** (`parseRestResult`, `lossless-json` keeping every number as its text): the raw view is
that tree pretty-printed, so nothing the server sent is rounded or reformatted, and the visualiser value is derived
from the same tree. A body that is not JSON is shown as it is.

### Visualisation

`RestResultVisualiserService` implements [`console`](console.md)'s `ResultVisualiserService`. Visualisation is
available only for a **2xx response of a `query*` operation** of the catalog API (`/{locale}?/<Collection>/query`);
otherwise the view shows a note. `ResultVisualiser` gets the executed variant's **path template** as `inputQuery`,
from which `RestResultAnalyzer` derives the entity schema (PascalCase name variant), and a single analyzed query
(no query selector).

The visualiser value converts the numbers bigint-safely (as `parseRestResultJson` does): integers above 2^53 become
`bigint`, every other number becomes a `number`. That matters for the query telemetry — REST sends `Long`
values as JSON numbers (the specification declares some of them as `string/int64`), and the winner rule of the
telemetry visualiser compares plan `hash`es, which a plain `JSON.parse` rounds.

Response shapes (fixed, there is no selection set — captured fixtures under `test/modules/rest-console/fixtures/`):

| Extra result | Shape | Parser |
|---|---|---|
| `facetSummary` | `<referenceName>` → one group object (ungrouped reference) or a list of groups, each `{ count, groupEntity?, facetStatistics[{ requested, count, impact{difference, matchCount}, facetEntity }] }` | `RestFacetSummaryResultParser` |
| `referenceSummary` | same, plus optional `histogramStatistics.<index>` per group | `RestReferenceSummaryResultParser` |
| `hierarchy` | `<referenceName \| self>.<outputName>[]`, **nested** `children[]`, `entity`, `requested`, `childrenCount`, `queriedEntityCount` | `RestHierarchyResultParser` (recursive, children first) |
| `attributeHistogram` | `<camelCaseAttributeName>` → `{ min, max, overallCount, buckets[] }` (decimals as strings) | `RestAttributeHistogramsResultParser` |
| `priceHistogram` | `{ min, max, overallCount, buckets[] }` | `RestPriceHistogramResultParser` |
| `queryTelemetry` | the **root step object** (`operation`, `start`, `spentTime`, `selfTime`, `arguments`, `startedAt`, `metrics`, `plan`, `steps[]`); `plan` a nested tree with `children[]` | `RestQueryTelemetryResultParser` |

Entity titles use the shared representative-attribute helpers. A localized request returns attributes flat; a
non-localized one splits them into `global` and `localized.<locale>`, which are merged (first locale returned). The
telemetry parser builds the driver's `QueryTelemetry` model; `missingSelections` is always empty, a missing
`operation` / `spentTime` yields a `PartialQueryTelemetrySelection`.

## Run with telemetry

Offered only when the selected operation is a `query*` operation of the catalog API: the Run button becomes a split
button with **Run with telemetry** (`Ctrl+Shift+Enter` / `Cmd+Shift+Enter`). The command is bound on every tab; for
any other operation it warns and runs the request plainly.

`injectQueryTelemetry(body)` parses a copy of the body (a blank body is `{}`), requires a JSON object and a `require`
that is an object when present (`QueryTelemetryInjectionError`, reason `Unparseable`, otherwise), and sets
`require.queryTelemetry = "PLAN"` unless `queryTelemetry` is present already — then the **original text** is
returned, so the injection is idempotent. The copy is re-serialized pretty-printed. The editor content never
changes and the history records the body as written; on an injection error a `toaster.warning` is shown and the
original body is sent.

## Tab data, sharing and history

- **Params** (identity, `RestConsoleTabParamsDto`): connection, `catalogName`, `instanceType` (`catalog` / `system`).
  `executeOnOpen` like the other consoles; restored tabs never execute.
- **Data** (`RestConsoleTabDataDto`, shareable): `operationId` of the selected **variant**, `method`,
  `pathTemplate`, `locale`, `parameters` (only the set ones), `body`. Restoring an operation that no longer exists
  (the specification changed) warns, selects the first endpoint and keeps the parameters and the body
  (`resolveInitialRestSelection`). Deep-link example:
  `{"tabType":"restConsole","tabParams":{"catalogName":"evita","instanceType":"catalog"},"tabData":{"operationId":"queryProductLocalized","locale":"en","body":"{}"}}`.
- **History** is keyed by (catalog name, instance type). A `RestConsoleHistoryRecord` is a plain object — operation
  id, method, path template, the sent path with query string, locale, parameters, body as written — rendered by the
  shared `HistoryComponent` with the preview `METHOD path` + the first body line. Picking a record restores the
  operation, locale, parameters and body.

## Keyboard shortcuts

`RestConsole_*` commands mirror the GraphQL console: `Ctrl+Enter` run, `Ctrl+Shift+Enter` run with telemetry,
`Ctrl+L` share, `Ctrl+1` request view, `Ctrl+3` history, `Ctrl+4` OpenAPI viewer, `Shift+Alt+F` / `Shift+Alt+M` prettify / minify the body,
`Alt+2` / `Alt+3` toggle the panels, `Ctrl+0` raw result, `Ctrl+9` visualiser. See [`keymap`](keymap.md).

## Out of scope

Copy as cURL, the `/change-captures` stream and a demo-snippet handler are not implemented.

## Related

- [`graphql-console`](graphql-console.md) — the sibling console whose panel behaviour this one copies
- [`console`](console.md) — the shared visualisation infrastructure
- [`code-editor`](code-editor.md) — the editors
- [database driver — REST access](../database-driver.md#rest-access) — `callRest`, the specification cache
