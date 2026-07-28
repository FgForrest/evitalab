# `history-component` — reusable execution-history list

Abstract module, one file: `HistoryComponent.vue`. Renders a list of previously executed inputs so a
user can pick one and re-run it. No `ModuleRegistrar`, no injectable services, no model of its own —
it is generic over whatever record type the caller stores.

Used by the query consoles, which pair it with their own history keys and records:

- `evitaql-console` — `EvitaQLConsoleHistoryKey` / `EvitaQLConsoleHistoryRecord`
- `graphql-console` — `GraphQLConsoleHistoryKey` / `GraphQLConsoleHistoryRecord`
- `entity-viewer` — `FilterByHistoryKey` / `FilterByHistoryRecord`,
  `OrderByHistoryKey` / `OrderByHistoryRecord`

The records themselves are persisted by the workspace's tab-history mechanism (`TabHistoryKey`), not
by this module.

## Related

- [workspace & tabs](../workspace-and-tabs.md) — tab history storage
- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md), [`entity-viewer`](entity-viewer.md)
