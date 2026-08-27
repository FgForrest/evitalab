# `schema-viewer` — browsing catalog and entity schemas

Feature module for browsing catalog / entity / attribute / reference / associated-data /
sortable-compound schemas, with **deep-linkable schema paths**. Contributes `TabType.SchemaViewer`.

- **Provides:** `schemaViewerServiceInjectionKey`, `schemaViewerTabFactoryInjectionKey`,
  `delegatingSchemaPathFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`,
  `workspaceServiceInjectionKey`, `tabFactoryRegistryInjectionKey`

## Layout

Everything under `viewer/`:

| Path | What's in it |
|------|--------------|
| `component/` | One subdirectory per schema kind: `catalog/`, `entity/`, `attribute/`, `attribute-element/`, `reference/`, `associated-data/`, `sortable-compound/` |
| `model/` | `SchemaPointer` + one pointer per kind, `SchemaPointerType`, `SchemaType`, `Flag`, `SchemaViewerDataPointer` |
| `service/` | `SchemaViewerService` |
| `service/schema-path-factory/` | `SchemaPathFactory`, `AbstractSchemaPathFactory`, `DelegatingSchemaPathFactory` + one factory per kind |
| `workspace/` | `SchemaViewerTabDefinition`, params DTOs, `SchemaViewerTabFactory` |

## Initialization, errors & retry

`SchemaViewer.vue` follows the tab framework's
[init contract](../workspace-and-tabs.md#loading-errors--retry):

- **One fetch per open.** `initialize()` — called from `onBeforeMount` and from the exposed `retry()` — is the
  only init caller. The tab title is a synchronous `const` derived from
  `params.dataPointer.schemaPointer` alone, so it needs no fetch; the tab body is gated on `schemaLoaded`.
- **Throw vs. toast is split by path.** `loadSchema()` throws. `initialize()` catches and
  `emit('error', asError(e))`, which puts the tab on the error screen with a *Try again* button instead of
  rendering an empty schema body. The **reload** paths — the toolbar's reload button (`reloadSchema()`) and the
  registered schema-change callback — catch and `toaster.error(...)` instead: a background reload must never
  replace working content with an error screen.
- **`retry()` is exposed rather than relying on the remount fallback**, because the schema-change callback is
  registered at setup top level and released in `onUnmounted`, which `KeepAlive` never runs on a `:key` bump.

## Schema pointers and paths

A `SchemaPointer` identifies *which* schema a tab shows — `CatalogSchemaPointer`,
`EntitySchemaPointer`, `CatalogAttributeSchemaPointer`, `EntityAttributeSchemaPointer`,
`ReferenceAttributeSchemaPointer`, `ReferenceSchemaPointer`, `AssociatedDataSchemaPointer`,
`SortableAttributeCompoundSchemaPointer`. Each has a matching `*SchemaPathFactory` that turns it into a
breadcrumb path; `DelegatingSchemaPathFactory` dispatches to the right one. Adding a schema kind means
adding a pointer, a path factory, a registration in the delegating factory, and a component.

## Representative flags (chips)

The flags rendered next to each schema item come from the **model class's `representativeFlags`
getter**, which lives in [`database-driver`](database-driver.md), not here.

For attribute schemas the base `AttributeSchema` owns the canonical flag order — type → subclass prefix
flags → uniqueness → sortable → filterable → localized → nullable. Subclasses extend only narrow
protected hooks (`prefixFlags`, `uniquenessFlags`, `isImplicitlyFilterable`) instead of reimplementing
the getter, so **the flag set can't drift between attribute-list levels**. A unique attribute is
treated as implicitly filterable.

`Flag.icons` always carries raw `EntityScope` values; `SchemaContainerSectionListItem.vue` is the
**only** place that maps them to mdi icons via `EntityScopeIcons`.

Model-class getters use `i18n.global.t` — never `useI18n()`, which throws outside component setup.

## Attribute detail viewer

`AttributeSchemaViewer.vue` renders a per-scope "Unique" row from `uniqueInScopes`, and for global
attribute schemas an additional "Globally unique" row from `uniqueGloballyInScopes`. Its "filterable due
to uniqueness" treatment mirrors the model's `isImplicitlyFilterable()`, which is triggered by either
local or global uniqueness.

## Conflict-resolution rows

Five tabs surface evitaDB's write-conflict policy. The driver delivers only what each level *declares*
([driver model](../database-driver.md#transaction-conflict-resolution)); **which level wins, and what a
single item ends up being checked against, is computed here**:

| Piece | Where |
|---|---|
| Pure resolution algorithm | `viewer/service/ConflictResolutionResolver.ts` |
| Shared property-row builders | `viewer/component/conflict-resolution/conflictResolutionProperties.ts` |
| Async plumbing for item tabs | `viewer/component/conflict-resolution/useEffectiveConflictScope.ts` |

`ConflictResolutionResolver` is I/O-free and unit-tested against the reference algorithm from
[issue #426](https://github.com/FgForrest/evitalab/issues/426) — it must not drift from it:

- `resolveCatalogPolicy` / `resolveEntityPolicy` — the **most specific level that declares a resolution
  wins outright**, scope *and* refinement set, with no merging (`entity → catalog → engine default`).
  The winner is reported as a `PolicySource` (*Defined here* / *Inherited from catalog* / *Engine default*).
  The engine default is a **required input**, not a constant: it is server configuration, read through
  `SchemaViewerService.getDefaultConflictResolution()` (`useDefaultConflictResolution()` in components) and
  cached by the driver. When it cannot be read, the row that would need it is omitted and the error is
  reported — never substitute a guessed default, that is exactly the confidently-wrong UI this feature
  removes.
- `resolveItemScope` — per-item overrides take effect **only** under a coarse `Entity` policy. Under a
  wider (or disabled) policy the coarse scope dominates and the declared override is reported as
  `inert: true`, which drives the amber inert-override warning — the most valuable safety cue here.
  Without an override, the outcome follows the entity's granularity set for the item's own flag.

**`itemKind` is derived from the schema pointer, not from the model class.** `GlobalAttributeSchema
extends EntityAttributeSchema`, so `instanceof` cannot separate the attribute flavours; and the same
`AttributeSchemaViewer` renders both entity and reference attributes, which must resolve against
`ENTITY_ATTRIBUTE` and `REFERENCE_ATTRIBUTE` respectively (a `ReferenceAttributeSchemaPointer` selects the
latter).

Layout — catalog and entity tabs get **one** row (chips + provenance badge); item tabs get **two**:
row A "Conflict resolution override" only when an override is declared, row B "Effective conflict scope"
always. Row help lives on `Property.description`, chip hints on `KeywordValue.tooltip`, the inert warning
on `PropertyValue.note`.

Two deviations worth knowing:

- A **catalog-level global attribute** has no owning entity, so it resolves against the catalog's
  effective policy and its copy is catalog-flavoured (*Follows catalog policy*). The issue does not
  specify this case.
- Row B renders its outcome as a chip rather than plain text — a `List<PropertyValue>` is rendered inside
  a `VChipGroup`, where a raw string would be a block element among flex chips.

Existing rows never wait for the extra fetches: they render immediately, and the conflict rows are appended
once the owning policy resolves. Catalog and entity rows wait for the engine default (and the entity row
also for the catalog schema) **only when the inspected level declares no policy of its own** — that is the
only case where the answer depends on them, and *Inherited from catalog* cannot be told from *Engine
default* before they arrive.

## Related

- [`database-driver`](database-driver.md) — the schema model and `representativeFlags`
- [design language](../design-language.md) — flag/chip conventions
- [`entity-viewer`](entity-viewer.md) — consumes representative attributes for reference grouping
