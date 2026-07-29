# Design language

This document distils the visual and interaction design language of evitaLab from its three most
mature pages — the **GraphQL console**, the **entity viewer** and the **schema viewer** — into
rules for building new pages. Follow it together with the [UI components catalog](ui-components.md);
where that document says *what* components exist, this one says *how* they are composed so a new
page feels like the rest of the lab.

## Foundations

### Color

evitaLab is **dark-only**. The palette (defined in `src/vue-plugins/vuetify.ts` and mirrored in
`src/styles/colors.scss`) is deliberately tiny and each color has a fixed role:

| Color | Value | Role |
|---|---|---|
| `background` / `surface` / `primary` | `#1f1f33` | Base canvas of every page and pane |
| `primary-dark` | `#131323` | Elevated-but-subdued surfaces: tooltips, dialog backgrounds, sticky headers |
| `primary-light` | `#23355C` | Structural chrome: tab toolbars, secondary chart series |
| `primary-lightest` | `#21BFE3` | **The only accent.** Highlighted/selected data (e.g. requested histogram buckets), links, active emphasis |
| `gray-light` | `#A5ACBC` | Secondary text and default chip color |
| `success` | `#22a44e` | The safe/recommended state of a setting (e.g. the default conflict scope) |
| `info` | `#487ad3` | A deliberately narrowed/relaxed state of a setting |
| `warning` | `#f7a729` | Warning icons and notes |
| `error` | `#E13321` | Errors, dangerous confirm buttons |

Rules:

- Never introduce new hex values in components. Use theme colors (`bg-primary-light`,
  `text-gray-light`, …) or the SCSS variables from `src/styles/colors.scss`.
- Accent (`primary-lightest`) is reserved for *data the user asked for* or *the active thing* —
  not for decoration. Everything structural stays in the blue-gray ramp.
- De-emphasis is done with **opacity, not new colors**: Vuetify's `text-disabled`,
  `text-medium-emphasis` and `--v-disabled-opacity` classes/variables.
- Borders use the theme border variables:
  `thin solid rgba(var(--v-border-color), var(--v-border-opacity))`.

**Chips that encode a setting's risk** follow one legend, so a reader learns it once. The
conflict-resolution chips in the [schema viewer](modules/schema-viewer.md#conflict-resolution-rows) are the
reference implementation:

| Chip color | Means |
|---|---|
| `error` (red) | The widest/strictest setting — safest, but the biggest cost (lowest throughput) |
| `warning` (orange) | Wide setting with a noticeable cost |
| `success` (green) | The balanced, recommended default |
| `info` (blue) | Deliberately narrower than the default — cheaper, but relaxes a safety check |
| default grey + `mdi-alert-outline` | The check is off entirely; grey (not red) because the risk is *data safety*, not cost, and the amber icon carries the warning |

### Typography & emphasis

- Regular data values are plain body text; there is no custom font scale — headings inside pages
  are rare and small (panel titles, card titles).
- **Muted (`text-disabled`) italic/light text is the universal "non-value" signal**: `null`,
  empty arrays, "no locale selected", missing data placeholders. Always via i18n keys
  (`common.placeholder.null`, `common.placeholder.emptyArray`, `common.placeholder.empty`, …).
- Secondary identifiers (primary keys prefixing a title, shortcut hints in parentheses) are
  `text-disabled` next to the primary label.
- Property/field labels in tables are `text-medium-emphasis`; values full emphasis.
- Deprecated schema items are struck through (`text-decoration-line-through`), never hidden.

### Iconography

Icons are [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi-*`) exclusively.
The lab has an established icon vocabulary — reuse it, don't invent synonyms:

| Icon | Meaning |
|---|---|
| `mdi-key` | Primary key (prefixes titles, muted) |
| `mdi-translate` / `mdi-translate-off` | Localized data / no locale selected |
| `mdi-open-in-new` | Opens something in a new tab, or an external (unmanaged) reference |
| `mdi-link-variant` | References |
| `mdi-package-variant-closed` | Associated data |
| `mdi-filter-menu-outline` | Filter input |
| `mdi-sort` | Ordering (order-by input, sortable column) |
| `mdi-database-search` | Query / query selector |
| `mdi-variable` | Query variables |
| `mdi-history` | Execution history |
| `mdi-file-code` | Schema (code form) |
| `mdi-code-braces` | Raw (JSON) result / output format |
| `mdi-file-tree-outline` | Visualised / structured result |
| `mdi-view-column-outline` | Column/property selection |
| `mdi-counter` | Count metric |
| `mdi-check` / `mdi-close` | Flag on / off |
| `mdi-refresh` | Reload data from server |
| `mdi-auto-fix` | Automatic ("pretty print") mode |
| `mdi-information-outline` | Neutral explanation tooltip |
| `mdi-alert-outline` (warning color) | Warning note tooltip |

Tab types have a single canonical icon defined on their `TabDefinition` (e.g.
`EntityViewerTabDefinition.icon()`) — reuse that everywhere the feature is referenced (toolbar,
subject path, menus), never hardcode a second variant.

### Density & spacing

- Everything is **compact**: global Vuetify defaults set `density="compact"`, `solo-filled`
  inputs, plain chips, no ripple, accordion expansion panels. Do not restate these per component
  and do not opt out on a single page.
- Spacing is rem-based and small: `0.25rem`–`0.5rem` gaps inside composite labels,
  `1rem` padding for scrollable content bodies, `gap: 1rem` between major blocks.
- Fixed structural sizes are also rem-based: `3rem` toolbar row and side-tab strips,
  `5.5rem` toolbar with extension row, `2.25rem` grid row height.
- Layout is CSS **grid/flex in scoped SCSS** (BEM-ish class names like
  `data-grid-cell__body`, `visualiser__select`) — not utility-class soup. Short Vuetify helper
  classes (`mr-1`, `d-flex align-center`) are fine for one-off tweaks inside templates.

## Page anatomy

Every page is a **tab window** (see [workspace & tabs](workspace-and-tabs.md)) and fills 100 % of
the tab area. The canonical skeleton, used by all three reference pages:

```
┌──────────────────────────────────────────────────────────┐
│ VTabToolbar  (3rem, bg-primary-light)                    │
│  [tab icon] Title / path   [flag chips]   …actions [Run] │
│  └ optional extension row (inline query inputs)          │
├───┬──────────────────────────────────────┬───────────────┤
│ V │                                      │ V             │
│ S │   content pane(s)                    │ S             │
│ i │   (Splitpanes when two panes)        │ i             │
│ d │                                      │ d             │
│ e │                                      │ e             │
└───┴──────────────────────────────────────┴───────────────┘
```

- Root element is a CSS grid: `grid-template-rows: 3rem 1fr` (or `5.5rem 1fr` when the toolbar
  has an extension row, as in the entity viewer).
- Render the page only once its prerequisites are loaded (`v-if="initialized"`), emit `ready`,
  and report initialization failures via the toaster.

### Toolbar

`VTabToolbar` is mandatory. Its grammar:

- **prepend icon** — the tab type's canonical icon.
- **title** — an `ImmutableList<string>` path from broad to narrow (e.g. catalog → console type,
  or `Entity schema → Product`), not a single concatenated string. The same path is exposed to
  the status bar via `TabComponentExpose.path()` (`SubjectPath`).
- **flags** — chips right of the title for *ambient state that changes query semantics*:
  selected data locale (`mdi-translate`), entity scopes, price mode. If the user changes it and
  results change meaning, it belongs here.
- **append slot** — icon buttons, ordered least → most important, with the **primary action
  last**: `ShareTabButton`, secondary actions (reload `mdi-refresh`, …), then
  `VExecuteQueryButton`/`VTabMainActionButton`.
- **extension slot** — a second toolbar row for always-visible query inputs (entity viewer's
  filter/order bar). Use it when the page's main interaction is "type constraint → run".

### Panes

- A **console-type page** (GraphQL/evitaQL console) is two vertical `Splitpanes` panes — input
  left, output right — each wrapped by a `VWindow` whose views are switched by a 3-rem
  `VSideTabs` strip on the outer edge (left strip switches input views: query, variables,
  history, schema; right strip switches output views: raw, visualiser). Side-tab items are
  icon-only `VTab`s with a `VActionTooltip` bound to the switching command.
- A **grid-type page** (entity viewer) is a single main pane; a detail pane splits in
  on demand (`Splitpanes` with the detail `Pane` appearing at ~30 % when a cell is opened,
  `min-size` guarded).
- A **document-type page** (schema viewer) is a single scrollable body.
- Scrollable content uses the **absolute-fill pattern**: the container is
  `position: absolute; inset: 0; overflow-y: auto; padding: 1rem` inside a relatively positioned
  body. This keeps toolbars and side tabs fixed while only content scrolls.
- Heavy pane content (raw result editor, visualiser) is instantiated lazily —
  `v-if` on the active view, or initialize-on-first-open (GraphQL schema editor) — so opening a
  tab stays cheap.

## Interaction language

### Keyboard first

Every user-facing action and every focusable pane has a `Command`:

- Bind commands in `onMounted` and unbind in `onUnmounted`, scoped to the tab `props.id`
  (dialog-local shortcuts use `keymap.pushScope`/`popScope` while the dialog is open).
- Every icon-only button gets `VActionTooltip` with its `command`, so the tooltip advertises the
  shortcut. Buttons without a command get a plain `VTooltip` — an icon button without any
  tooltip is a bug.
- Input placeholders embed the shortcut: `` `Filter by (${keymap.prettyPrint(command)})` ``.
- Switching to a view also focuses it (`setTimeout(() => ref.value?.focus())`), and components
  expose `focus()` via `defineExpose` for this purpose.

### Tooltips are the help system

There is no inline help text; explanation lives in delayed tooltips (750 ms, `primary-dark`
background — global defaults):

- Data glyphs (metric chips, flag chips, checkboxes with unusual state) carry tooltips
  explaining the metric or state, using `VMarkdown` inside the tooltip when the explanation
  references query constraints (i18n `help.*` keys).
- Missing/unknowable data is explained, not hidden: a red or `mdi-checkbox-blank-off-outline`
  state plus a tooltip saying *which* property was missing from the query and how to request it.
- Warnings attach as an `mdi-alert-outline` (warning color) icon with tooltip; neutral
  explanations as `mdi-information-outline`.

### Navigation opens tabs

evitaLab never navigates in place. Anything that "goes somewhere" —
a referenced entity, a parent entity, a nested schema, a predecessor — calls
`workspaceService.createTab(factory.createNew(...))` and is marked with `mdi-open-in-new`
(prepended icon in grid cells, appended icon in schema list items). Clicking a schema list item
row is the open action; non-openable items are `disabled`.

### Feedback & safety

- All success/info/error feedback goes through `useToaster()`; service/`EvitaClient` calls in
  components are wrapped in try-catch and reported with `toaster.error(...)`.
- Click-to-copy is everywhere data identifiers appear (primary keys, cell values, rendered
  code); it always confirms with `toaster.info('…copied…')` and reports clipboard failure.
- Queries arriving from outside (shared tabs, restored state) are **not executed automatically**
  until the user triggers execution once — malicious query protection (see
  `EntityViewer.executeQueryAutomatically`). New pages that execute stored input must keep this
  consent gate and show an initial "execute" screen instead of results.
- Long lists never render fully: `VListItemLazyIterator` / `VExpansionPanelLazyIterator`
  page the DOM, `VLazy` defers chip groups, expansion content initializes on first expand.

### Empty, loading and error states

- Each distinct "nothing to show" cause gets its own `VMissingDataIndicator` with a
  cause-specific icon and i18n message (no queries found ≠ no query selected ≠ no data selected).
- In-progress states use `VLoadingCircular` (inside `VMissingDataIndicator` for pane-level
  loading) or the `loading` prop on buttons/tables; the primary action button shows the spinner
  while its work runs.
- Errors are toasts — panes don't render inline error boxes.

## Data display language

### Chips are metadata badges

The plain, gray-light chip (global default) is the lab's unit of secondary metadata. It is never
a filter control; it annotates:

- **Toolbar flags** — ambient query state (locale, scope).
- **Schema flags** — representative flags on schema list items (`SchemaContainerSectionListItem`),
  with scope icons appended and a tooltip; i18n-translated when the flag starts with `_`.
- **Metrics** — counters on visualiser rows: chip containing icon + value sections
  (`mdi-counter`, `mdi-set-right`, `mdi-set-all`), `-` for unknown values, tooltip explaining
  every metric.
- **Enum/keyword values** — see `KeywordValue` below.
- **External references** — `mdi-open-in-new` + "external" label chip when a referenced type is
  not managed by evitaDB.

### Composite titles

List rows representing identified data follow one title grammar (facet rows, group rows):

```
[state control] [muted: 🔑 123:] Primary title [chip chip …]
```

flex row, `0.5rem` column gap, muted `mdi-key` + primary key prefix (click = copy), title
(`'Unknown'` + explanatory tooltip when unresolvable), then chips. Unknown/zero-impact rows are
dimmed with disabled opacity rather than removed.

### Key-value details: `VPropertiesTable`

Any "properties of one object" view (schema viewers, server info) is a `VPropertiesTable` with
typed value objects from `modules/base/model/properties-table/` — never a hand-rolled table.
The type dictates the rendering:

| Value type | Rendering |
|---|---|
| `string` | Markdown (`VMarkdown`) |
| `boolean` | Disabled compact checkbox |
| `KeywordValue` | Chip (optionally colored, tooltip) — **use for enum items, data types, locales, currencies**; an enum-typed property is a list of keyword chips, one per item |
| `MultiValueFlagValue` | Chip with `mdi-check`/`mdi-close` (or custom) icon + per-scope label + tooltip — **use for flags that vary by scope** (sortable/filterable/unique in live vs. archive) |
| `NotApplicableValue` | Crossed-out checkbox + optional `mdi-information-outline` explanation |
| `RangeValue` | `from - to` |
| `ProgressValue` | Linear progress + percentage |
| `PlaceholderValue` / `undefined` | Muted italic placeholder |

A `PropertyValue.note` renders as a warning icon + tooltip next to the value; a
`PropertyValue.action` makes the value clickable (chip becomes `outlined`).

### Schema viewer composition

A schema page is: `SchemaContainer` (absolute-fill scroll body) → `VPropertiesTable` of scalar
properties on top → `VExpansionPanels` (accordion, multiple) of nested sections below
(`SchemaContainerSection` per section: name variants first, then attributes, associated data,
references, …). Sections contain `SchemaContainerSectionList*` rows whose click opens the nested
schema **in a new tab** via a `SchemaPointer` + `SchemaViewerTabFactory`. Empty sections are
omitted entirely (`v-if` on size), not rendered empty.

### Data grids

- Server-driven tables use `VDataTableServer` with `density="compact"`, `fixed-header`,
  `fixed-footer`, `multi-sort` and explicit page-size options (10 … 1000).
- Cells and headers get right/bottom hairline borders (theme border variables) so the grid reads
  as a spreadsheet; rows are `2.25rem` tall, values clipped (no wrapping) with full value in the
  tooltip.
- Custom column headers show: property-type icon, title, `mdi-translate` when localized, and a
  sort affordance (`mdi-sort` when sortable, the active sort icon when sorted). Only sortable
  columns get the pointer cursor.
- Clickable cells (`--clickable` modifier) show pointer cursor + `on-surface`-hover; a cell
  click either navigates (reference-like values → new tab) or opens the **detail pane**.

### Value detail & pretty printing

The cell-detail pane is the model for any "inspect one value" surface:

- `VCard` header via `VCardTitleWithActions`: property-type icon + property name; actions =
  output-format selector + close button; `VDivider`; scrollable body.
- Rendering delegates through `DelegateDetailRenderer` driven by an
  `EntityPropertyValueDesiredOutputFormat` chosen in a `VMenu` list (each format with its icon:
  auto `mdi-auto-fix`, raw `mdi-text`, markdown, JSON, XML, HTML). Default is
  **auto pretty print**, which infers the renderer from the declared data type and value shape
  (JSON-looking string → JSON code, HTML-tag string → sandboxed HTML preview, XML → XML code,
  other strings/scalars → Markdown, prices/reference attributes → dedicated renderers).
- Code is always displayed in `VPreviewEditor` (read-only CodeMirror) with language extensions;
  renderer toolbars offer *copy* and *pretty print/raw toggle* actions; copying confirms via
  toaster.
- Array values render as `VExpansionPanels` of per-item renderers rather than one blob.

### Code editing

All code/query input is CodeMirror through the `code-editor` module wrappers: `VQueryEditor`
(full pane), `VInlineQueryEditor` (single-line toolbar inputs with prepend icon, shortcut
placeholder and per-input **history** dropdown persisted via
`workspaceService.addTabHistoryRecord`), `VPreviewEditor` (read-only output). Language support
is passed as `additionalExtensions` and can be swapped at runtime with a `Compartment` (entity
viewer swaps evitaQL/GraphQL modes).

### Charts

Charts use ApexCharts (`vue3-apexcharts`), styled to the palette: neutral series
`primary-light` (`#23355C`), highlighted/requested series `primary-lightest` (`#21BFE3`),
rounded bars, sparkline mode (no axes chrome), and **custom dark HTML tooltips** shaped like a
mini properties table (muted property-name column). Data quality problems (missing optional
properties) are stated in a note under the chart instead of failing silently.

## Language & i18n

- Every user-facing string goes through `src/modules/i18n/en.json`. Established key families:
  `common.button.*`, `common.placeholder.*`, `common.notification.*`, plus per-feature
  `<feature>.label.*`, `<feature>.help.*` (tooltip explanations), `<feature>.placeholder.*`,
  `<feature>.notification.*`, `<feature>.tooltip.*`.
- Tone: short, imperative labels ("Run", "Reload"); tooltips are full sentences; help texts may
  use Markdown (rendered via `VMarkdown`) to reference query constraints in backticks.

## New-page checklist

1. Tab window fills the tab area; root grid `3rem/5.5rem + 1fr`; `VTabToolbar` with canonical
   tab icon, path-style title, flags for ambient query state, primary action last in append.
2. Pick the right archetype: console (side tabs + splitpanes), grid (table + on-demand detail
   pane), or document (scrollable `VPropertiesTable` + expansion panel sections).
3. Every action has a `Command`, keymap bindings bound/unbound with the tab, and a
   `VActionTooltip`; every icon button has a tooltip.
4. All strings via i18n; placeholders for null/empty as muted italic text; explanations as
   delayed tooltips, warnings as warning-icon tooltips.
5. Metadata as plain chips; enums as `KeywordValue` chips; scope-dependent flags as
   `MultiValueFlagValue` chips; key-value data via `VPropertiesTable`.
6. Navigation elsewhere = new tab (`workspaceService.createTab`) + `mdi-open-in-new`.
7. Feedback via `useToaster()`; loading via `VLoadingCircular`/`loading` props; each empty state
   its own `VMissingDataIndicator`.
8. Long lists lazy (`V*LazyIterator`, initialize-on-expand); heavy panes rendered only when
   visible.
9. Externally supplied queries never auto-execute without prior user consent.
10. Colors only from the theme; accent reserved for selected/requested data; compact density
    everywhere.
