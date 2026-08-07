# `evitaql-console` — evitaQL query console

Feature module. A console tab for executing **evitaQL** queries, with history and result visualisation.
Contributes `TabType.EvitaQLConsole`.

- **Provides:** `evitaQLConsoleServiceInjectionKey`, `evitaQLConsoleTabFactoryInjectionKey`,
  `evitaQLResultVisualiserServiceInjectionKey`
- **Injects:** `evitaClientInjectionKey`

Structurally a mirror of [`graphql-console`](graphql-console.md) — the same layout with a different
query language, so a change to one is usually needed in the other.

## Layout

Everything under `console/`:

| Path | What's in it |
|------|--------------|
| `component/` | The console UI (editor + results), built on [`code-editor`](code-editor.md)'s `VQueryEditor` |
| `service/EvitaQLConsoleService.ts` | Executes queries through `EvitaClient` |
| `model/EvitaQLConsoleDataPointer.ts` | What the tab points at (connection + catalog) |
| `history/` | `EvitaQLConsoleHistoryKey`, `EvitaQLConsoleHistoryRecord` |
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

## Result visualisation

`EvitaQLResultVisualiserService` implements [`console`](console.md)'s `ResultVisualiserService`, and each
abstract parser has an evitaQL counterpart: `EvitaQLResultAnalyzer`,
`EvitaQLFacetSummaryResultParser`, `EvitaQLHierarchyResultParser`,
`EvitaQLAttributeHistogramsResultParser`, `EvitaQLPriceHistogramResultParser`,
`EvitaQLReferenceSummaryResultParser`.

The service is `provide`d per console tab under `resultVisualiserServiceInjectionKey`, which is how the
shared visualiser components render evitaQL results without knowing the language.

## Related

- [`console`](console.md) — the shared visualisation infrastructure
- [`code-editor`](code-editor.md) — the query editor
- [`history-component`](history-component.md) — the history list UI
- [`graphql-console`](graphql-console.md) — the sibling implementation
