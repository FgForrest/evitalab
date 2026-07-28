# `entity-viewer` — grid-based entity browser

Feature module. The grid users browse catalog data in: it builds and executes queries in **evitaQL or
GraphQL**, renders entity properties through formatters, and offers a property selector and price
renderer. Contributes `TabType.EntityViewer`.

- **Provides:** `entityViewerServiceInjectionKey`, `entityViewerTabFactoryInjectionKey`,
  `codeDetailRendererMenuFactoryInjectionKey`, `markdownDetailRendererMenuFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`

## Layout

Everything sits under `viewer/`:

| Path | What's in it |
|------|--------------|
| `component/entity-grid/` | The grid itself — `EntityGrid.vue`, cells, and `detail-renderer/` |
| `component/entity-property-selector/` | Choosing which properties become columns |
| `service/` | `EntityViewerService` + the query abstraction (below) |
| `service/entity-property-value-formatter/` | `Raw`, `Json`, `Xml` formatters behind `EntityPropertyValueFormatter` |
| `model/` | `EntityPropertyKey`, `EntityPropertyDescriptor`, `EntityPropertyType`, `FlatEntity`, `GridHeader`, `QueryLanguage`, `QueryResult`, `QueryPriceMode`, `SelectedScope`, … |
| `model/entity-property-value/` | `EntityPrice(s)`, `EntityReferences`, `EntityReferenceValue`, `EntityReferenceAttributes`, `NativeValue` |
| `history/` | `FilterByHistoryKey`/`Record`, `OrderByHistoryKey`/`Record` |
| `keymap/scopes.ts` | The viewer's shortcut scopes |
| `workspace/` | `EntityViewerTabDefinition`, params/data DTOs, `EntityViewerTabFactory` |

## The two-language query abstraction

`QueryBuilder` + `QueryExecutor` are implemented twice — `EvitaQLQueryBuilder`/`EvitaQLQueryExecutor`
and `GraphQLQueryBuilder`/`GraphQLQueryExecutor` — so the grid is language-agnostic. Anything added to
one implementation almost always has to be added to the other.

## References

The references column cell shows an aggregate count (`N <name> references`, all cardinalities;
`0 <name> references`, non-interactive, when the entity has none — executors backfill an empty
`EntityReferences`/`EntityReferenceAttributes` container via
`QueryExecutor.backfillEmptyReferenceContainers` so an absent reference renders as a zero count instead
of a `null` cell) and its cell detail (`ReferencesDetailRenderer`) lists the references grouped and
filtered by the reference's representative attributes (`EntityReferences` container per column).

Each reference-attribute column cell shows the same count summary; its detail
(`ReferenceAttributesDetailRenderer`) uses the same grouping/filtering but item rows render that
column's attribute value (`EntityReferenceAttributes` container).

Grouping/filtering is **pure logic on `EntityViewerService`**
(`collectReferenceFilterData` / `filterReferences` / `groupReferences`) reused by both details via the
shared `ReferenceGroupFilter` / `ReferenceGroupedList` components.

Query builders fetch the reference's representative attributes **implicitly** (unioned with selected
reference-attribute columns) so grouping works even when no attribute column is selected; executors
classify response attributes against `requiredData` + the schema's representative flags so implicitly
fetched attributes don't leak into unselected columns.

### The detail sidepanel

Clicking a references cell opens the detail **sidepanel** (no longer a new tab). The panel is **keyed by
cell identity** in `EntityGrid.vue` so it fully remounts when switching cells — the detail's `provide`d
entity/descriptor are non-reactive and would otherwise go stale, blanking the panel. Open-in-new-tab
lives inside the panel (whole filtered list + per item).

Per-item open is a **menu** for managed reference types that also define a managed group: it opens the
referenced entity, or the referenced group (`referencedGroupType`) when that reference carries a group;
item rows show `{referenced entity PK} / {referenced group PK}`. The group primary key is carried on
`EntityReferenceValue.groupPrimaryKey`, populated only for managed group types — evitaQL reads it from
the reference's group reference by default, GraphQL fetches `groupEntity { primaryKey }`.

## Note for automated UI testing

`agent-browser click @ref` does **not** fire the grid's `@mousedown` cell handler; dispatch native
`mousedown` + `mouseup` + `click` (button 0) on the `td` instead.

## Related

- [`database-driver`](database-driver.md) — where queries actually go
- [`console`](console.md) — result visualisation shared with the consoles
- [`history-component`](history-component.md) — the filter/order history lists
- [design language](../design-language.md) — cell/tooltip conventions
