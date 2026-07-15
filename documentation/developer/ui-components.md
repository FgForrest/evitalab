# UI components

evitaLab uses [Vuetify](https://vuetifyjs.com/) as the base component framework, with a dark-only
custom theme and opinionated defaults configured in `src/vue-plugins/vuetify.ts`. On top of that,
custom components extend the standard set. **Always prefer an existing custom component over a raw
Vuetify equivalent when one exists for the use case.**

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

## Tab window building blocks

| Component | Use for |
|-----------|---------|
| `VTabToolbar` | Toolbar of every tab window. Props: `prependIcon`, `title: List<string>` (path segments), `flags?`, `extensionHeight?`; slots for append actions and extension row |
| `VTabToolbarTitle` | Title rendering inside the toolbar |
| `VTabMainActionButton` | Primary action button of a tab (`prependIcon`, `loading?`, `disabled?`) |
| `VExecuteQueryButton` | Query execution button; integrates with keymap (`command` prop shows the shortcut) — use together with query editors |
| `VSideTabs` | Vertical tab strip on the left/right edge of a tab window (`side: 'left' | 'right'`) |

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

## Code editors (`code-editor` module)

CodeMirror 6 wrappers — never instantiate CodeMirror directly:

| Component | Use for |
|-----------|---------|
| `VQueryEditor` | Full-size query editor (`modelValue`, `additionalExtensions?` for language support, `placeholder?`) |
| `VInlineQueryEditor` | Single-line/inline editor variant |
| `VPreviewEditor` | Read-only code/text preview |
| `VPreviewEditorDialog` | Preview editor in a dialog |

Language support: evitaQL via `@lukashornych/codemirror-lang-evitaql`, GraphQL via `cm6-graphql`,
JSON/XML/YAML via `@codemirror/lang-*`. Editors integrate with the workspace status bar through
`extension/workspaceStatusBarIntegration.ts` (cursor position display).

## Date & time

Primarily use Vuetify date/time components (`VDateInput`, `VTimePicker` labs components are
registered). For combined date-time input use the custom `VDateTimeInput` (returns evitaLab
`OffsetDateTime`-compatible values, offset picking via `VTimeOffsetPicker`).

## Viewer helpers

- `VDownloadServerFileButton` (`viewer-support`) — download button for server files.
- `HistoryComponent` (`history-component`) — reusable execution-history list UI.

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
