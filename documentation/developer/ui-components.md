# UI components

evitaLab uses [Vuetify](https://vuetifyjs.com/) as the base component framework, with a dark-only
custom theme and opinionated defaults configured in `src/vue-plugins/vuetify.ts`. On top of that,
custom components extend the standard set. **Always prefer an existing custom component over a raw
Vuetify equivalent when one exists for the use case.** For how these components are composed into
consistent pages (layout anatomy, color roles, icon vocabulary, interaction patterns), see the
[design language](design-language.md).

Custom shared components live in:

- `src/modules/base/component/` — the general-purpose set (prefixed `V*`),
- `src/modules/code-editor/component/` — CodeMirror editors,
- `src/modules/viewer-support/component/`, `src/modules/history-component/` — viewer helpers.

Feature modules keep their own private components inside their `component/`/`components/` dirs.

## Theming

The single dark theme defines the palette: `background`/`surface`/`primary` (`#1f1f33`),
`primary-dark` (`#131323`), `primary-light` (`#23355C`), `primary-lightest` (`#21BFE3` — the
accent), `gray-light` (`#A5ACBC`), plus `warning`/`error`. Component defaults (compact density,
solo-filled inputs, plain chips, no ripple, tooltip styling) are set globally — don't repeat them
per component. Global SCSS lives in `src/styles/` (Vuetify SASS settings in `settings.scss`) — which
is also where every Vuetify table gets its between-cell separators (`table.scss`, see
[design language](design-language.md#tables)) and where the chip variants get the interaction
affordances that make the variant a statement about clickability (`chip.scss`, see
[design language](design-language.md#chips-the-variant-is-a-promise-about-interaction)).
Icons are [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi-*` strings).

## Dialogs

| Component | Use for |
|-----------|---------|
| `VLabDialog` | Every plain dialog. Props: `modelValue`, `maxWidth?`, `persistent?`, `scrollable?`; slots for activator, title, content, action buttons |
| `VFormDialog` | Dialogs containing a form. Built-in Vuetify form + validation handling, submit state, reset support. Key props: `modelValue`, `changed?`, `dangerous?` (red confirm), `confirmButtonIcon?`, `confirm: () => Promise<boolean>`, `reset?` |
| `VConfirmDialog` | Simple confirm prompts (`modelValue`, `confirmIcon`) |
| `VConfirmDialogButton`, `VRejectDialogButton`, `VCancelDialogButton`, `VAlternativeActionDialogButton` | Standardized dialog action buttons |

Even a command palette uses `VLabDialog`: the [symbol search](modules/symbol-search.md) is a `VLabDialog`
with a fixed body height, so it does not jump while the result count changes. Listeners for `VDialog` events
`VLabDialog` does not declare (`@after-enter`, `@after-leave`) fall through to its `VDialog` root.

Convention: a dialog component wraps its trigger via the activator slot, owns its open state via
`modelValue`, performs its action in `confirm` returning `true`/`false` for success, and reports
errors via the toaster.

`VFormDialog` renders content through these slots: `activator`, `title`, `prepend-form`, `default`
(wrapped in the validated `VForm`), `append-form`, `alternative-action-button` and
**`confirm-button-body`** — the label of the confirm button, which falls back to a generic "Confirm"
when not passed.

Mind the slot names: Vue silently drops a `<template #…>` whose name the target component doesn't
declare, so a typo costs you the label with no error anywhere. `test/components/slotNames.test.ts`
guards against this repository-wide — see [testing](testing.md#slot-names).

## Tab window building blocks

| Component | Use for |
|-----------|---------|
| `VTabToolbar` | Toolbar of every tab window. Props: `prependIcon`, `title: List<string>` (path segments), `flags?`, `extensionHeight?`; slots for append actions and extension row |
| `VTabToolbarActionGroup` | Groups related actions inside the toolbar's append slot and closes them with a vertical separator; place before the ungrouped actions |
| `VTabToolbarTitle` | Title rendering inside the toolbar |
| `VTabMainActionButton` | Primary action button of a tab (`prependIcon`, `loading?`, `disabled?`) |
| `VExecuteQueryButton` | Query execution button; integrates with keymap (`command` prop shows the shortcut) — use together with query editors. Optional `variants: ExecuteQueryVariant[]` (`base/model/ExecuteQueryVariant.ts`, `{ command, title }`) turns it into a **split button**: the primary Run button stays as is (emits `click`), an attached chevron (`VBtn` + `VMenu`, tooltip "More run options", disabled while `loading`) lists one `VListItem` per variant, each wrapped in a `div` that activates a `VActionTooltip` of its command (title + shortcut chip), and a pick emits `variant` with the variant's `command`. Without `variants` the rendered DOM is unchanged. The chevron is always present when variants are passed, so the Run button never shifts. Used by the evitaQL, GraphQL and REST consoles for *Run with telemetry* |
| `VSideTabs` | Vertical tab strip on the left/right edge of a tab window (`side: 'left' | 'right'`). Two independent models: `v-model` = which view is displayed (always set), `v-model:visible` = whether the panel the strip controls is on screen. With `collapsible`, clicking the active tab collapses the panel (`update:visible = false`) while keeping the remembered view; clicking any tab of a collapsed panel restores it. The active view is indicated by its icon turning `primary-lightest` — a global rule in `settings.scss` keyed off Vuetify's `v-tab--selected`, guarded by `test/styles/activeTabClass.test.ts` because a Vuetify upgrade already renamed that class once — and by Vuetify's slider on the strip's outer edge (Vuetify anchors the vertical slider to the tab's left edge, so the `--right` strip mirrors it to the right; the tabs fill the strip's content box rather than its full `3rem`, otherwise they overflow the strip border and clip that slider). While the panel is collapsed no tab is highlighted and no slider is drawn |

All tab windows must fill the available space (the tab component stretches to 100 % of the tab
area).

## Data display

| Component | Use for |
|-----------|---------|
| `VDataGrid` | Server-paginated grid of rows × columns with auto/resizable column widths, sorting, cell selection and an edit hook — see [Data grid](#data-grid) |
| `VPropertiesTable` | Key-value listing of object properties (`title?`, `properties: Property[]`, `dense?`). Property model in `modules/base/model/properties-table/` supports typed values (`VPropertiesTableValue*`) |
| `VMarkdown` | Rendering markdown (`source` prop; markdown-it + highlight.js + DOMPurify) |
| `VTreeViewItem` / `VTreeViewEmptyItem` | Tree menu structures (openable/loading states, flags, item actions). `openableByArrowOnly` reserves expanding for the leading arrow and reports its click as `click:open`, freeing the row click for a meaning of its own — the catalog row uses it to open the catalog preview |
| `VListItemDivider` | Divider between list items in **every** non-menu list |
| `VListItemLazyIterator` | Client-side "load next" paging for long lists (`items: List<T>`, `page`, `pageSize`) — use to keep the DOM small. `items` takes an Immutable `List` only; it used to accept a plain array as well and branch on the shape at runtime |
| `VExpansionPanelLazyIterator` | Same paging pattern for expansion panels |
| `VMissingDataIndicator` | Placeholder when there is nothing to show (icon + message) |
| `VLoadingCircular` | Loading spinner |
| `VCardTitleWithActions` | Card title row with action buttons |
| `VActionTooltip` | Tooltip for action buttons; pass a `command` to display its keyboard shortcut |

### Properties table

`Property(name, value, description?)` is one row. The optional `description` renders a muted
`mdi-information-outline` icon with a tooltip after the row label — use it for row-level help, not for
explaining a single value. The icon sits **in the label's text flow**, not as a flex item beside it,
so that a name too long for the fixed label column keeps the icon next to its last word instead of
having it pushed to the column's right edge, where it reads as belonging to the value.
Per-value affordances live on the value objects instead:

| Want | Use |
|---|---|
| Row-level help | `Property.description` |
| Colored chip with its own tooltip | `KeywordValue(value, color?, tooltip?)` |
| Warning next to a value (amber `mdi-alert-outline`) | `PropertyValue.note` |
| Several chips on one row | `List<PropertyValue>` as the property value |

Rows have a fixed `min-height` so chip rows and text rows share one vertical rhythm; markdown values get
their trailing block margin zeroed for the same reason. Do not add per-page spacing overrides.

A chip color must be a **theme role** (`success`, `info`, `warning`, `error`, or the default grey) — the
renderer passes it as Vuetify's `base-color`, because inside a `VChipGroup` (the `List<PropertyValue>`
variant) a plain `color` applies only to *selected* chips.

### Data grid

`VDataGrid` (`base/component/data-grid/`) is the lab's own grid, built on Vuetify's bare `VTable` shell so the
compact density, header styling and the global cell separators apply unchanged. It replaced `VDataTableServer`
in the entity viewer, which could not resize columns, select cells or host an editor. It is generic — it imports
nothing from other modules (only `src/utils`) — and is used by `EntityGrid.vue`.

**Data.** `rows` are plain objects keyed by column key and keep the **original** values. Each
`DataGridColumn<V, R, C>` (`base/model/data-grid/`) prints its values through its `printer`, a
`DataGridValuePrinter<V, R, C>` (`base/service/data-grid/`) with `print(value, row, context)` (default `defaultDataGridValuePrinter`, i.e.
`formatDataGridValue`: JSON for plain objects and arrays, `String()` for anything else — primitives and class
instances alike — and `''` for a missing value). `printDataGridCell(column, value, row, context)` is the pure helper
the grid prints every cell with. The grid knows nothing about evitaDB: a column holding driver data types supplies a
`printer` printing them through `value-presentation`. Every cell is printed **once per data, column or context
change**; the string is used for rendering, for the automatic width and handed to the `#cell` slot as `text`.
`rowKey(row)` gives each row a stable identity (selection and editing survive a reload of the rows).

**Context.** `VDataGrid<V, R, C>` takes a grid-wide `context` prop (type `C`, default `void`) and passes it to every
printer and editor call. It is how the owner's display options reach the printers — the entity viewer passes
`{ priceType }`. The printed cells are a `computed` that reads `context`, so a new context object re-prints all cells
and re-measures the column widths. Pass a stable object (a `computed`, not an inline literal in the template), or
every render of the owner re-prints the grid.

**State is owned by the parent and passed one-way**: `page` (1-based), `itemsPerPage`, `sortBy`
(`{ key, order }[]`), `totalCount`, `loading`, `selectedCell`, `editingCell`. User changes come back as a single
`update:options` (`{ page, itemsPerPage, sortBy }`), emitted **only on user interaction** — never on mount and
never as an echo of a prop change — so the owner can tell the user's changes from its own. The semantics follow
Vuetify's data table (`base/composable/data-grid/useDataGridOptions`, unit-tested): a header click cycles *asc → desc → unsorted* (appended
to the list with `multi-sort`), sorting and changing the page size reset the page to 1, and when the total
a new result leaves the current page beyond the last one (a filter shrank the result, a restored tab's page no
longer exists) the grid emits the last existing page (never page 0). The check runs per result, not on a page-count
change, because a restored page 3 of a one-page result never changes the page count.

**Column widths.** `table-layout: fixed` with a `<colgroup>`; a trailing filler column absorbs leftover space so
the grid still fills its container, and the wrapper scrolls horizontally when the columns are wider. A column's
automatic width is its widest formatted value (canvas `measureText` with the cell font, re-measured once the web
font has loaded) + padding + border + `cellIconWidth`, clamped to `[80px, maxAutoWidth = 200px]`; `120px` without
rows. **The header title never widens a column** — it ellipsizes, with the full title in a tooltip. Dragging the
handle on a header's right edge sets a manual width (min `48px`, no max) that wins over the automatic one for the
lifetime of the component; double-clicking the handle returns to the automatic width. Manual widths are not
persisted.

**Selection.** `selectedCell` (`{ rowKey, columnKey }`) outlines the cell in `primary-lightest` and tints its row.
The grid only emits `click:cell` (DOM `click`, i.e. the left button); whether a click selects is the owner's
decision. Middle click and context menu are not grid events — the cell slot handles them (a middle-click
`preventDefault()` has to happen on `mousedown` to stop autoscroll).

**Editing hook.** A column with an `editor` (a `DataGridValueEditor<V, R, C>`: `toEditRepresentation(value, row,
context)` / `parse(text, row, context)`) is editable; its cell matching `editingCell` renders the `#cell-editor` slot
with `commit(value)` / `cancel()`; `commit` emits `edit:commit` and both clear `editingCell` via
`update:editingCell`. The grid never mutates `rows`. The editor lives on the column, not on the value, because an
empty cell has no instance and primitives cannot implement an interface. There is no default editor and nothing
uses the hook yet.

**Layout.** The grid sizes itself with `height: 100%`. Inside a `Splitpanes` pane (a CSS grid whose row grows
with its content) that does not constrain it — stretch it with `position: absolute; inset: 0; height: auto`, as
`EntityGrid.vue` does, or the footer is pushed out of view. The footer reproduces `VDataTableFooter`'s markup and
imports its CSS (the Vuetify component cannot be used outside `VDataTable`).

## Code editors (`code-editor` module)

CodeMirror 6 wrappers — never instantiate CodeMirror directly:

| Component | Use for |
|-----------|---------|
| `VQueryEditor` | Full-size query editor (`modelValue`, `additionalExtensions?` for language support, `placeholder?`; emits `update:editor` with the CodeMirror `ViewUpdate` so callers can reach the `EditorView`) |
| `VInlineQueryEditor` | Single-line/inline editor variant (also emits `update:editor`). Optional `appendInnerIcon` + `appendInnerIconTooltip` render a non-interactive trailing glyph explaining the state of the content — always pass both, an icon without a tooltip is a bug |
| `VPreviewEditor` | Read-only code/text preview |
| `VPreviewEditorDialog` | Preview editor in a dialog |

Language support: evitaQL via `@lukashornych/codemirror-lang-evitaql`, GraphQL via `cm6-graphql`,
JSON/XML/YAML via `@codemirror/lang-*`. Editors integrate with the workspace status bar through
`extension/workspaceStatusBarIntegration.ts` (cursor position display).

> **Changing extensions at runtime — use a `Compartment`, don't reassign the array.**
> To swap language support (or any extension) after mount, keep the `additionalExtensions`
> array reference **stable** and wrap the changing part in a CodeMirror `Compartment`, then
> `view.dispatch({ effects: compartment.reconfigure(...) })` using the `EditorView` obtained
> from the `update:editor` event. See `QueryInput.vue` and `GraphQLConsole.vue`.
>
> Do **not** reassign `additionalExtensions` to a new array to apply changes: vue-codemirror
> reconfigures its own extensions compartment when the `extensions` prop changes, but a
> changing reference previously also drove a manual full-remount hack in these wrappers that
> duplicated CodeMirror's dynamically-appended panels (e.g. the find/replace toolbar rendered
> twice). That hack has been removed — the compartment approach is the supported way.

## Date & time

Primarily use Vuetify date/time components (`VDateInput`, `VTimePicker` labs components are
registered). For combined date-time input use the custom `VDateTimeInput` (returns evitaLab
`OffsetDateTime`-compatible values, offset picking via `VTimeOffsetPicker`).

`VDateTimeInput` supports two entry modes:

- **Picker wizard** — opened via the calendar icon; three steps (date → time → time offset)
  confirmed as a whole. While the wizard is open the text field is read-only so that typed text
  cannot diverge from the wizard state.
- **Manual text entry** — the field is editable; typed or pasted values are committed on
  <kbd>Enter</kbd> or blur. Parsing (`parseDateTimeInput` in `src/utils/dateTime.ts`) accepts
  ISO 8601, SQL-like (`2007-12-03 10:15:30`), RFC 2822 and locale-based formats (derived from
  `Intl` for the browser locale, incl. the app's own pretty-printed form with a trailing
  `GMT±X`/`UTC` zone name — so date times displayed elsewhere in the lab can be copied straight
  in). When the input carries an explicit time offset it is committed directly; **when it has no
  offset, the wizard opens at the time offset step so the user picks the offset instead of the
  component guessing one**. While focused the field shows the canonical ISO form (editable),
  unfocused it shows the localized pretty form. Unparsable input and `min`/`max` violations are
  reported as field errors and leave the model untouched.

### Hand-rolled clear icons

A field whose model Vuetify's own `clearable` cannot handle (a wrapper over a non-trivial value, such as
`VDateTimeInput` or `traffic-viewer`'s `VLabelSelect`) renders the clear icon itself in `#append-inner`.
Two things belong on it:

```vue
<template #append-inner>
    <VIcon v-if="clearable && model != undefined" @mousedown.prevent @click="clear">
        mdi-close-circle
    </VIcon>
</template>
```

- **Gate visibility on the value, never on focus.** `#append-inner` hands the slot an `isFocused` flag,
  and gating the icon on it makes the affordance unreachable: the mousedown that would hit the icon
  arrives while the field is still unfocused, so the icon is not there yet.
- **`@mousedown.prevent`** keeps the field from losing focus (or, for a wrapper that opens a menu from
  its root, from toggling that menu) before the click resolves. Add `.stop` to the click as well when the
  field itself is a `VMenu` activator, otherwise clearing also opens the menu.

Honour the component's own `clearable` prop in the condition — a wrapper that ignores it silently offers
a clear button the caller did not ask for.

## Viewer helpers

- `VDownloadServerFileButton` (`viewer-support`) — download button for server files, with determinate
  progress and click-to-cancel (see [`viewer-support`](modules/viewer-support.md)).
- `useAutoReload` (`viewer-support`) — the periodic reload loop behind the server-data viewer lists.
- `HistoryComponent` (`history-component`) — reusable execution-history list UI.

### Determinate progress on an icon button

A button whose work reports progress keeps the standard `loading` prop and replaces the
indeterminate spinner through Vuetify's `#loader` slot, so the button footprint stays identical:

```vue
<VBtn icon :loading="inProgress" :disabled="disabled">
    <VIcon>mdi-file-download-outline</VIcon>
    <template #loader>
        <VProgressCircular :model-value="progress" :indeterminate="progress === 0" size="20" width="2" />
    </template>
</VBtn>
```

Vuetify does **not** fold `loading` into the button's disabled state, so a loading button still
receives clicks — which is what makes "click again to cancel" possible. Guard the click handler on the
current state and add an `aria-label` for the cancel affordance.

## Charts

Use [ApexCharts](https://apexcharts.com/) via the globally registered `apexcharts` component
(`vue3-apexcharts`), e.g. histograms in the result visualiser.

## Toast notifications

Inject the toaster interface — never use `vue-toastification` directly (in driver mode
notifications are forwarded to evitaLab Desktop via IPC):

```ts
const toaster: Toaster = useToaster()
await toaster.success(t('...'))
await toaster.error(t('...'), error)   // error toasts can open the error-viewer tab
```

## Writing a new shared component

1. Only promote a component to `modules/base/component/` when it is (or will be) used by multiple
   modules; otherwise keep it in the owning module.
2. Prefix shared components with `V`, follow Vuetify prop naming (`modelValue`, `density`, …).
3. Document the component with a JSDoc block in the SFC and add it to this catalog.
