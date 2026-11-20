# `graphql-console` — GraphQL query console

Feature module. A console tab for executing **GraphQL** queries against the catalog data, catalog schema
and system APIs, with history and result visualisation. Contributes `TabType.GraphQLConsole`.

- **Provides:** `graphQLConsoleServiceInjectionKey`, `graphQLConsoleTabFactoryInjectionKey`,
  `graphQLResultVisualiserServiceInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`,
  `tabFactoryRegistryInjectionKey`, `demoSnippetResolverInjectionKey`

Structurally a mirror of [`evitaql-console`](evitaql-console.md) — a change to one is usually needed in
the other.

## Layout

Everything under `console/`:

| Path | What's in it |
|------|--------------|
| `component/` | The console UI, built on [`code-editor`](code-editor.md)'s `VQueryEditor` (with GraphQL language support) |
| `service/GraphQLConsoleService.ts` | Executes queries through `EvitaClient` |
| `service/injectQueryTelemetry.ts` | `injectQueryTelemetry(query)` — adds the full telemetry selection for [Run with telemetry](#run-with-telemetry) |
| `model/GraphQLConsoleDataPointer.ts` | What the tab points at |
| `model/GraphQLInstanceType.ts` | Which GraphQL API — catalog data, catalog schema, or system |
| `history/` | `GraphQLConsoleHistoryKey`, `GraphQLConsoleHistoryRecord` |
| `result-visualiser/service/` | The concrete parsers (below) |
| `workspace/` | `GraphQLConsoleTabDefinition`, params/data DTOs, `GraphQLConsoleTabFactory` |

## Collapsible panels

Either panel can be hidden to focus on just the query or just the result — click the already-active
side tab of a strip, or press `Alt+2` (query panel) / `Alt+3` (result panel); the same shortcuts show
it again, as does picking any view in the collapsed strip. When **both** panels are hidden, a
`VMissingDataIndicator` overlays the panes area with buttons that bring each panel back. The visibility
is per open tab and is **not persisted** — a reload restores the initial state described below.

A newly opened console starts with the **result panel hidden**, so the whole width belongs to the query
until there is anything to show; the panel opens itself when the **first** result arrives. Only the
first one — from then on the user's own hide/show choice wins, so executing again never re-opens a panel
the user deliberately closed (`firstResultPending` in the component). A tab opened with
`executeOnOpen` starts with the panel already visible, so the result it was opened for doesn't pop the
panel open a moment after mount.

**Do not turn the collapse into an unmount.** Both `Pane`s stay mounted for the lifetime of the tab and
the `editorTab` / `resultTab` refs are never cleared; collapsing is CSS only (the pane becomes
`position: absolute; visibility: hidden` at its original size, its sibling takes `width: 100%`).
That is what keeps the editors' caret, **undo history** and exact scroll offset across a collapse cycle,
and it is why the split ratio survives for free — splitpanes' own size model is never touched.
Three details keep the collapse free of visual artifacts, and all three are easy to undo by accident:
the collapsed pane is **anchored** to the edge it already sits at (`left: 0` for the query pane,
`right: 0` for the result pane), so leaving the flow never moves it on screen; splitpanes'
`transition: width .2s` and `will-change: width` are switched off on the panes, so the change lands in
a single frame instead of the surviving pane snapping to the edge and only then sweeping out to full
width; and the collapsed pane is pushed **below** the surviving one (`z-index` 0 vs. 1), because the
result pane is last in the DOM and would otherwise paint on top — the editors are composited scrollers
whose layer can outlive the frame in which the pane was hidden, which showed up as the result panel's
content lingering for a moment after its background was already gone.
Switching this to `<Pane v-if>`, or letting a view ref go `undefined`, would silently discard the user's
undo history.

## Prettify & minify

Two toolbar buttons (`mdi-auto-fix` / `mdi-arrow-collapse-vertical`, `Shift+Alt+F` / `Shift+Alt+M`)
wrapped in a `VTabToolbarActionGroup` at the front of the toolbar's append slot — separated from the
tab's own actions, and first in the row so that coming and going shifts nothing else — reformat the
editor the caret sits in — the query with the `graphql-js` printer, the variables document
as JSON. Both come from [`code-editor`](code-editor.md#document-formatters).

> **GraphQL prettify loses `#` comments** and rewrites an anonymous `query { … }` into `{ … }`, because
> `print()` works on the parsed document. See the
> [caveat in `code-editor`](code-editor.md#graphql) — it is a property of graphql-js, not of this
> console.

The formatted document is **assigned to the bound `ref`**, not dispatched as a CodeMirror transaction.
The caret therefore jumps to the document start and the whole format is a single undo step. Formatting
also changes `currentData`, so the tab is marked dirty and a shared link carries the reformatted query;
that is expected.

### Why the buttons come and go

The buttons are shown only when `formattingAvailable` holds: the query panel is visible, the caret is in
that panel, and the selected view is the query or the variables editor — never the history or the schema
viewer. Both panels are visible at once, so `editorTab` alone does not say where the caret is; the panel
is tracked in `focusedPanel` by a single `@focusin` listener on each `Pane`, plus the `focus*()` helpers,
which set it directly.

`focusin` bubbles, so two listeners cover every view in both panes without new emits on `VQueryEditor`,
`VPreviewEditor`, the history component or `ResultVisualiser`. The state is **sticky** — it changes only
when something else takes focus, never on a plain blur. That matters: clicking the Prettify button
blurs the editor, and a blur-clears design would make the button vanish from under the cursor on
mousedown, before the click lands.

**The `focus*()` helpers must keep setting `focusedPanel` themselves.** Their actual `focus()` call is
deferred through `setTimeout` and is swallowed when the target view is not mounted yet — on a tab opened
with `executeOnOpen`, for instance. Relying on the `focusin` that call *would* fire leaves the state
pointing at the panel the caret has just left, and the buttons would then format an editor the user is
not looking at.

The accepted consequence is that executing a query moves focus to the raw result viewer, so the buttons
disappear until the user clicks (or `Ctrl+1` / `Ctrl+2`s) back into the query panel. The keyboard
shortcuts apply the same guard, so a shortcut pressed while the result viewer has focus is a visible
no-op rather than a hidden action.

## `GraphQLInstanceType` — the one sanctioned dependency inversion

`EvitaClient.queryCatalogUsingGraphQL()` in [`database-driver`](database-driver.md) references this
module's `GraphQLInstanceType`. This is the **known documented exception** to the "generic modules must
not depend on feature modules" rule (see the [module catalog](index.md#module-dependency-rules)) — do not
treat it as precedent for new cross-dependencies.

## The System instance and its catalog name

`GraphQLInstanceType.System` is not bound to a catalog, yet its tabs still carry one: the exported
`systemCatalogName` constant (`console/model/GraphQLConsoleDataPointer.ts`). It is not decoration — the
GraphQL schema cache, the console history key and the serialized tab params are all keyed by
(catalog name, instance type), so an `undefined` there would split a System console off from its own stored
history and change the shape of already shared links. The request path is built from the instance type
alone (`EvitaClient.queryCatalogUsingGraphQL`), so the name never reaches the server, and everything
user-facing — tab title, subject path, query placeholder — suppresses it.

## Result status

The result pane starts with the shared [`ResultStatusBar`](console.md#result-status-bar): `OK` or `N error(s)` from
the response's `errors` array, the duration of the call and the UTF-8 size of the compact response JSON, all
derived in `GraphQLConsoleService.executeGraphQLQuery`, which returns a `GraphQLQueryResult` (`resultJson` +
`status`).

## Result visualisation

`GraphQLResultVisualiserService` implements [`console`](console.md)'s `ResultVisualiserService`, with a
GraphQL counterpart for each abstract parser: `GraphQLResultAnalyzer`,
`GraphQLFacetSummaryResultParser`, `GraphQLHierarchyResultParser`,
`GraphQLAttributeHistogramsResultParser`, `GraphQLPriceHistogramResultParser`,
`GraphQLReferenceSummaryResultParser`, `GraphQLQueryTelemetryResultParser`.

### Query telemetry selection

GraphQL returns the telemetry as a **flat pre-order list** of steps with a `level` (root = 1), and each
step's `plan` as a flat pre-order list with `level` and `childrenCount`; `GraphQLQueryTelemetryResultParser`
rebuilds both trees with a stack. `Long` fields arrive as JSON strings and become `bigint`. There is no
argument for the plan — **selecting `plan { … }` is the opt-in** — and a bare `queryTelemetry` without a
sub-selection is invalid. The full selection the parser reads:

```graphql
extraResults {
  queryTelemetry {
    level operation spentTime          # required
    start selfTime arguments startedAt # optional
    metrics {
      estimatedCardinality actualCardinality estimatedCost actualCost
      recordsReturned ioFetchCount ioFetchedSizeBytes prefetched
    }
    plan {
      id level                         # required for the plan (childrenCount may replace level)
      refTo hash description estimatedCost actualCost resultCount childrenCount
    }
  }
}
```

- `GraphQLResultAnalyzer` offers the Query telemetry type only when `extraResults.queryTelemetry` is a non-empty
  array; it does not inspect the selection.
- Missing `level`, `operation` or `spentTime` → `PartialQueryTelemetrySelection` (a note, not an error).
- Missing optional fields are tolerated and reported in `ParsedQueryTelemetry.missingSelections`; a missing
  `start` is reconstructed sequentially. `stepsCount`, `formattedSpentTime` and `formattedSelfTime` are accepted
  but not read.
- A plan without `id`, or without both `level` and `childrenCount`, cannot be built: plans are dropped and
  `plan.id` / `plan.level` reported as missing.
- Presence is judged on the root step (and the first plan node / the `metrics` object), because a selection set
  applies to every list item alike.
- `startedAt` keeps its nanosecond fraction (Luxon alone would round it to milliseconds).

## Run with telemetry

On the **catalog data** instance (`GraphQLInstanceType.Data`, the one that supports visualisation) the Run
button is a split button (`VExecuteQueryButton` with `variants`, see
[UI components](../ui-components.md#tab-window-building-blocks)) whose chevron menu offers **Run with
telemetry**; the schema and system instances keep the plain button. The command
`Command.GraphQLConsole_ExecuteQueryWithTelemetry` (`Ctrl+Shift+Enter` / `Cmd+Shift+Enter`) is bound on
every instance. It calls `executeQuery(true)`, which sends a copy of the query passed through
`injectQueryTelemetry`; `variables` are sent untouched. The **editor content is never modified**, the
history record and `lastAppliedQueryCode` keep the query as written, and the result handling is identical to
a plain run.

`injectQueryTelemetry(query: string): string` uses `parse` → `visit` → `print` from the `graphql` package:

- Every **top-level field of every operation whose name starts with `query`** (the `query<EntityType>`
  fields, which own `extraResults`) gets the complete selection from
  [above](#query-telemetry-selection) (plus `stepsCount`) in its `extraResults`; `extraResults { … }` is
  added when missing. `get*` / `list*` fields are left alone.
- Only the **response keys** `extraResults` and `queryTelemetry` count, because that is where the analyzer
  and the parser look: an aliased `extra: extraResults { … }` is left as is and an unaliased `extraResults`
  is added next to it.
- A `query*` field that already selects `queryTelemetry` (with any sub-selection) is left alone; when no
  field needed a change the **original text** is returned, so the injection is idempotent. Otherwise the
  document is re-printed — comments and formatting of the *sent copy* are lost, the editor keeps them.
- Fragments are not inspected; a duplicate selection through a fragment is still valid GraphQL.
- An unparseable document throws `QueryTelemetryInjectionError` (reason `Unparseable`), a document without
  any `query*` field throws it with reason `NoTarget`. The console shows a `toaster.warning` (two messages,
  one per reason) and runs the original query.

## Related

- [`console`](console.md) — the shared visualisation infrastructure
- [`code-editor`](code-editor.md) — the query editor
- [`database-driver`](database-driver.md) — `queryCatalogUsingGraphQL`, the GraphQL schema cache
- [`evitaql-console`](evitaql-console.md) — the sibling implementation
