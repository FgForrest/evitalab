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
