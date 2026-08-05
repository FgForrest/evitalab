# `entity-viewer` — grid-based entity browser

Feature module. The grid users browse catalog data in: it builds and executes queries in **evitaQL or
GraphQL**, renders entity properties through formatters, and offers a property selector and price
renderer. Contributes `TabType.EntityViewer`.

- **Provides:** `entityViewerServiceInjectionKey`, `entityViewerTabFactoryInjectionKey`,
  `codeDetailRendererMenuFactoryInjectionKey`, `markdownDetailRendererMenuFactoryInjectionKey`,
  `entityGridCellMenuFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`

## Layout

Everything sits under `viewer/`:

| Path | What's in it |
|------|--------------|
| `component/entity-grid/` | The grid itself — `EntityGrid.vue`, cells, and `detail-renderer/` |
| `component/entity-property-selector/` | Choosing which properties become columns |
| `service/` | `EntityViewerService` + the query abstraction (below), `EntityGridCellMenuFactory` |
| `service/entity-property-value-formatter/` | `Raw`, `Json`, `Xml` formatters behind `EntityPropertyValueFormatter` |
| `model/` | `EntityPropertyKey`, `EntityPropertyDescriptor`, `EntityPropertyType`, `FlatEntity`, `GridHeader`, `QueryLanguage`, `QueryResult`, `QueryPriceMode`, `SelectedScope`, … |
| `model/entity-property-value/` | `EntityPrice(s)`, `EntityReferences`, `EntityReferenceValue`, `EntityReferenceAttributes`, `NativeValue` |
| `model/entity-grid/` | `EntityGridCellMenuItemType`, `propertyMutationHistoryContainer` (property type → mutation history container) |
| `history/` | `FilterByHistoryKey`/`Record`, `OrderByHistoryKey`/`Record` |
| `keymap/scopes.ts` | The viewer's shortcut scopes |
| `workspace/` | `EntityViewerTabDefinition`, params/data DTOs, `EntityViewerTabFactory` |

## Cell interaction model

`EntityGridCell.vue` supports three pointer gestures:

| Gesture | Effect |
|---|---|
| Left click | opens the cell detail sidepanel / navigates (`EntityGrid.handlePropertyClicked`) |
| Middle click | copies the printable value; **Shift + middle click** copies the raw value |
| Right click | opens the cell's context menu at the cursor |

The two copy actions therefore exist twice on purpose: the mouse combos (documented by the chips in the
value tooltip) make them fast, the menu makes them discoverable. The former `E`/`L` + middle-click
history combos are **gone** — they were undiscoverable and each cell had to install four `window`
keyboard listeners to track the held key.

Menu items come from `EntityGridCellMenuFactory` (`EntityGridCellMenuItemType`), created **lazily on
first right-click**: both the items and the `VMenu` itself (`v-if="menuItemList.length > 0"`), because a
100 × 10 grid would otherwise instantiate a thousand overlays. The menu is positioned by passing the
click coordinates as `VMenu`'s `:target="[clientX, clientY]"` — a table cell has no activator element of
its own, and `target="cursor"` only works for activator-driven menus. `handleClick` must **not** call
`preventDefault()` before checking `event.button`: browsers disagree on whether a default-prevented
button-2 `mousedown` still emits `contextmenu`.

Which history items a cell offers depends on the property type. The mapping lives in the pure
`resolvePropertyMutationHistoryContainer` (`model/entity-grid/`); unsupported items are not created at
all rather than created disabled:

| `propertyDescriptor.type` | Property history item | Container type | Container name |
|---|---|---|---|
| `Entity` (`primaryKey`, `version`, `locales`, `scope`, …) | — | — | — |
| `Attributes` | *Attribute history* | `CONTAINER_ATTRIBUTE` | attribute name |
| `AssociatedData` | *Associated data history* | `CONTAINER_ASSOCIATED_DATA` | associated-data name |
| `Prices` | *Price history* | `CONTAINER_PRICE` | — |
| `References` | *Reference history* | `CONTAINER_REFERENCE` | reference name |
| `ReferenceAttributes` | *Reference history* | `CONTAINER_REFERENCE` | reference name (`key.parentName`) |

*Entity history* is always offered. Container names come from the **property key**, not from the
descriptor's schema: a reference attribute's schema is the *attribute* schema, so a schema-derived name
would filter the history by the attribute where evitaDB expects the reference.

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

The panel header carries a single `mdi-history` button that opens the mutation history of whatever the
panel is showing. It calls `EntityGridCellMenuFactory.openPropertyMutationHistory` directly — no menu —
and its tooltip is `resolvePropertyHistoryTitle`, i.e. the same string the cell menu's item uses, so the
button names its target ("Attribute history", "Price history", …). For `Entity`-type properties, which
have no property-level container, it falls back to the entity history and the *Entity history* label.

Per-item open is a **menu** for managed reference types that also define a managed group: it opens the
referenced entity, or the referenced group (`referencedGroupType`) when that reference carries a group;
item rows show `{referenced entity PK} / {referenced group PK}`. The group primary key is carried on
`EntityReferenceValue.groupPrimaryKey`, populated only for managed group types — evitaQL reads it from
the reference's group reference by default, GraphQL fetches `groupEntity { primaryKey }`.

## Note for automated UI testing

`agent-browser click @ref` does **not** fire the grid's `@mousedown` cell handler; dispatch native
`mousedown` + `mouseup` + `click` (button 0) on the `td` instead. For the cell context menu, dispatch a
native `contextmenu` event on the `td`.

## Related

- [`database-driver`](database-driver.md) — where queries actually go
- [`console`](console.md) — result visualisation shared with the consoles
- [`history-component`](history-component.md) — the filter/order history lists
- [design language](../design-language.md) — cell/tooltip conventions
