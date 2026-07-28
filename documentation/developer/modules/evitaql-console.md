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
