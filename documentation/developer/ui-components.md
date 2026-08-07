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
per component. Global SCSS lives in `src/styles/` (Vuetify SASS settings in `settings.scss`).
Icons are [Material Design Icons](https://pictogrammers.com/library/mdi/) (`mdi-*` strings).

## Dialogs

| Component | Use for |
|-----------|---------|
| `VLabDialog` | Every plain dialog. Props: `modelValue`, `maxWidth?`, `persistent?`, `scrollable?`; slots for activator, title, content, action buttons |
| `VFormDialog` | Dialogs containing a form. Built-in Vuetify form + validation handling, submit state, reset support. Key props: `modelValue`, `changed?`, `dangerous?` (red confirm), `confirmButtonIcon?`, `confirm: () => Promise<boolean>`, `reset?` |
| `VConfirmDialog` | Simple confirm prompts (`modelValue`, `confirmIcon`) |
| `VConfirmDialogButton`, `VRejectDialogButton`, `VCancelDialogButton`, `VAlternativeActionDialogButton` | Standardized dialog action buttons |

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
| `VTabToolbarTitle` | Title rendering inside the toolbar |
| `VTabMainActionButton` | Primary action button of a tab (`prependIcon`, `loading?`, `disabled?`) |
| `VExecuteQueryButton` | Query execution button; integrates with keymap (`command` prop shows the shortcut) — use together with query editors |
| `VSideTabs` | Vertical tab strip on the left/right edge of a tab window (`side: 'left' | 'right'`). Two independent models: `v-model` = which view is displayed (always set), `v-model:visible` = whether the panel the strip controls is on screen. With `collapsible`, clicking the active tab collapses the panel (`update:visible = false`) while keeping the remembered view; clicking any tab of a collapsed panel restores it |

All tab windows must fill the available space (the tab component stretches to 100 % of the tab
area).

## Data display

| Component | Use for |
|-----------|---------|
| `VPropertiesTable` | Key-value listing of object properties (`title?`, `properties: Property[]`, `dense?`). Property model in `modules/base/model/properties-table/` supports typed values (`VPropertiesTableValue*`) |
| `VMarkdown` | Rendering markdown (`source` prop; markdown-it + highlight.js + DOMPurify) |
| `VTreeViewItem` / `VTreeViewEmptyItem` | Tree menu structures (openable/loading states, flags, item actions) |
| `VListItemDivider` | Divider between list items in **every** non-menu list |
| `VListItemLazyIterator` | Client-side "load next" paging for long lists (`items`, `page`, `pageSize`) — use to keep the DOM small |
| `VExpansionPanelLazyIterator` | Same paging pattern for expansion panels |
| `VMissingDataIndicator` | Placeholder when there is nothing to show (icon + message) |
| `VLoadingCircular` | Loading spinner |
| `VCardTitleWithActions` | Card title row with action buttons |
| `VActionTooltip` | Tooltip for action buttons; pass a `command` to display its keyboard shortcut |

### Properties table

`Property(name, value, description?)` is one row. The optional `description` renders a muted
`mdi-information-outline` icon with a tooltip after the row label — use it for row-level help, not for
explaining a single value. Per-value affordances live on the value objects instead:

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
