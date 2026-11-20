# `evitaql-console` — evitaQL query console

Feature module. A console tab for executing **evitaQL** queries, with history and result visualisation.
Contributes `TabType.EvitaQLConsole`.

- **Provides:** `evitaQLConsoleServiceInjectionKey`, `evitaQLConsoleTabFactoryInjectionKey`,
  `evitaQLResultVisualiserServiceInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`,
  `tabFactoryRegistryInjectionKey`, `demoSnippetResolverInjectionKey`

Structurally a mirror of [`graphql-console`](graphql-console.md) — the same layout with a different
query language, so a change to one is usually needed in the other. One deliberate asymmetry: this console
has **no variables editor**. evitaQL query variables are not implemented on the server side and are not
expected to be, so the view, its `Ctrl+2` shortcut and the `variables` half of the tab data were removed.
`Ctrl+2` is left unassigned rather than reused for the history view, which keeps `Ctrl+3` = history the
same in both consoles. Removing the field is backward compatible in both directions: a stored tab or share
link written by an older evitaLab still restores (`restoreTabDataFromSerializable` reads only `query`, and
the DTO is a plain cast with no schema validation), and a link written by a newer one opens in an older
evitaLab with an empty variables document. History records shortened from `[id, query, variables]` to
`[id, query]` for the same reason — records are read positionally, so the stored 3-element ones keep
working.

## Layout

Everything under `console/`:

| Path | What's in it |
|------|--------------|
| `component/` | The console UI (editor + results), built on [`code-editor`](code-editor.md)'s `VQueryEditor` |
| `service/EvitaQLConsoleService.ts` | Executes queries through `EvitaClient` |
| `service/injectQueryTelemetry.ts` | `injectQueryTelemetry(query)` — adds `queryTelemetry(PLAN)` for [Run with telemetry](#run-with-telemetry) |
| `model/EvitaQLConsoleDataPointer.ts` | What the tab points at (connection + catalog) |
| `history/` | `EvitaQLConsoleHistoryKey`, `EvitaQLConsoleHistoryRecord` (`[id, query]`) |
| `result-visualiser/service/` | The concrete parsers (below) |
| `workspace/` | `EvitaQLConsoleTabDefinition`, params/data DTOs, `EvitaQLConsoleTabFactory` |

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
tab's own actions, and first in the row so that coming and going shifts nothing else — reformat the query
with the evitaQL printer. Both come from [`code-editor`](code-editor.md#document-formatters), which also documents what the
formatters refuse and why minify drops `//` comments.

The formatted document is **assigned to the bound `ref`**, not dispatched as a CodeMirror transaction —
neither console captures an `EditorView` for these editors. The caret therefore jumps to the document
start and the whole format is a single undo step. Formatting also changes `currentData`, so the tab is
marked dirty and a shared link carries the reformatted query; that is expected.

### Why the buttons come and go

The buttons are shown only when `formattingAvailable` holds: the query panel is visible, the caret is in
that panel, and the selected view is the query editor. Both panels are visible at once,
so `editorTab` alone does not say where the caret is; the panel is tracked in `focusedPanel` by a single
`@focusin` listener on each `Pane`, plus the `focus*()` helpers, which set it directly.

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
disappear until the user clicks (or `Ctrl+1`s) back into the query panel. The keyboard
shortcuts apply the same guard, so a shortcut pressed while the result viewer has focus is a visible
no-op rather than a hidden action.

## Result status

The result pane starts with the shared [`ResultStatusBar`](console.md#result-status-bar): `OK` / `Error` and the
duration measured by `EvitaQLConsoleService.executeEvitaQLQuery`, which returns an `EvitaQLQueryResult`
(`response` + `status`). A query the server refuses (`QueryError`) is a result with an error status, other failures
still go to the toaster. No size — the gRPC payload is not available.

## Result visualisation

`EvitaQLResultVisualiserService` implements [`console`](console.md)'s `ResultVisualiserService`, and each
abstract parser has an evitaQL counterpart: `EvitaQLResultAnalyzer`,
`EvitaQLFacetSummaryResultParser`, `EvitaQLHierarchyResultParser`,
`EvitaQLAttributeHistogramsResultParser`, `EvitaQLPriceHistogramResultParser`,
`EvitaQLReferenceSummaryResultParser`, `EvitaQLQueryTelemetryResultParser`.

The query telemetry needs no parsing here: the driver already converted the gRPC tree into the internal
`QueryTelemetry` model (`EvitaResponse.extraResults.queryTelemetry`), which is always complete, so
`EvitaQLQueryTelemetryResultParser` wraps it in a `ParsedQueryTelemetry` with no missing selections. The
visualiser type is offered whenever the query contains `queryTelemetry(...)` in its `require` part
(`queryTelemetry(PLAN)` adds the formula plans) — written by hand or added by
[Run with telemetry](#run-with-telemetry).

The service is `provide`d per console tab under `resultVisualiserServiceInjectionKey`, which is how the
shared visualiser components render evitaQL results without knowing the language.

## Run with telemetry

The Run button is a split button (`VExecuteQueryButton` with `variants`, see
[UI components](../ui-components.md#tab-window-building-blocks)): its chevron menu offers **Run with
telemetry**, also bound to `Command.EvitaQLConsole_ExecuteQueryWithTelemetry` (`Ctrl+Shift+Enter` /
`Cmd+Shift+Enter`). It calls `executeQuery(true)`, which sends a copy of the query passed through
`injectQueryTelemetry` instead of the editor text. Everything else is as for a plain run: the **editor
content is never modified**, the history record and `enteredQueryCode` (the visualiser's input query) keep
the query as written, and the result handling is identical. There is no toolbar indicator — the result's
*Visualise* menu offering **Query telemetry** and the `PLAN` chip of its overview are the feedback.

`injectQueryTelemetry(query: string): string` parses the query with the Lezer grammar of
`@lukashornych/codemirror-lang-evitaql` (`evitaQLQueryLanguage.parser`, the same parser the
[formatters](code-editor.md#document-formatters) walk), looks at the direct arguments of `Query → QueryBody`
and splices text into the **original source**, so formatting and `//` comments survive:

| Query | Result |
|-------|--------|
| `require(...)` without `queryTelemetry` | `, queryTelemetry(PLAN)` inserted right after the last argument of `require` (before a trailing comment); an empty `require()` gets `queryTelemetry(PLAN)` without the comma |
| no `require` | `, require(queryTelemetry(PLAN))` inserted after the last argument of the query |
| `require` already contains `queryTelemetry(...)` (any level) | returned unchanged — the injection is idempotent and never overrides the user's level |
| syntax errors (error nodes in the tree) or no query at all | throws `QueryTelemetryInjectionError` (reason `Unparseable`) |

The error class lives in [`console`](console.md#run-with-telemetry) and is shared with the GraphQL injector.
The console catches it, shows `toaster.warning` ("query could not be parsed, running it without
telemetry") and runs the original query, so a run is never lost to a failed injection.

## Related

- [`console`](console.md) — the shared visualisation infrastructure
- [`code-editor`](code-editor.md) — the query editor
- [`history-component`](history-component.md) — the history list UI
- [`graphql-console`](graphql-console.md) — the sibling implementation
