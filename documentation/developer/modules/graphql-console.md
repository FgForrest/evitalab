# `graphql-console` — GraphQL query console

Feature module. A console tab for executing **GraphQL** queries against the catalog data, catalog schema
and system APIs, with history and result visualisation. Contributes `TabType.GraphQLConsole`.

- **Provides:** `graphQLConsoleServiceInjectionKey`, `graphQLConsoleTabFactoryInjectionKey`,
  `graphQLResultVisualiserServiceInjectionKey`
- **Injects:** `evitaClientInjectionKey`

Structurally a mirror of [`evitaql-console`](evitaql-console.md) — a change to one is usually needed in
the other.

## Layout

Everything under `console/`:

| Path | What's in it |
|------|--------------|
| `component/` | The console UI, built on [`code-editor`](code-editor.md)'s `VQueryEditor` (with GraphQL language support) |
| `service/GraphQLConsoleService.ts` | Executes queries through `EvitaClient` |
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
is per open tab and is **not persisted** — a reload restores both panels.

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

## `GraphQLInstanceType` — the one sanctioned dependency inversion

`EvitaClient.queryCatalogUsingGraphQL()` in [`database-driver`](database-driver.md) references this
module's `GraphQLInstanceType`. This is the **known documented exception** to the "generic modules must
not depend on feature modules" rule (see the [module catalog](index.md#module-dependency-rules)) — do not
treat it as precedent for new cross-dependencies.

## Result visualisation

`GraphQLResultVisualiserService` implements [`console`](console.md)'s `ResultVisualiserService`, with a
GraphQL counterpart for each abstract parser: `GraphQLResultAnalyzer`,
`GraphQLFacetSummaryResultParser`, `GraphQLHierarchyResultParser`,
`GraphQLAttributeHistogramsResultParser`, `GraphQLPriceHistogramResultParser`,
`GraphQLReferenceSummaryResultParser`.

## Related

- [`console`](console.md) — the shared visualisation infrastructure
- [`code-editor`](code-editor.md) — the query editor
- [`database-driver`](database-driver.md) — `queryCatalogUsingGraphQL`, the GraphQL schema cache
- [`evitaql-console`](evitaql-console.md) — the sibling implementation
