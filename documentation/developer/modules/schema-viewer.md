# `schema-viewer` — browsing catalog and entity schemas

Feature module for browsing catalog / entity / attribute / reference / associated-data /
sortable-compound schemas, with **deep-linkable schema paths**. Contributes `TabType.SchemaViewer`.

- **Provides:** `schemaViewerServiceInjectionKey`, `schemaViewerTabFactoryInjectionKey`,
  `delegatingSchemaPathFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`,
  `schemaViewerTabFactoryInjectionKey`

## Layout

Everything under `viewer/`:

| Path | What's in it |
|------|--------------|
| `component/` | One subdirectory per schema kind: `catalog/`, `entity/`, `attribute/`, `attribute-element/`, `reference/`, `associated-data/`, `sortable-compound/` |
| `model/` | `SchemaPointer` + one pointer per kind, `SchemaPointerType`, `SchemaType`, `Flag`, `SchemaViewerDataPointer` |
| `service/` | `SchemaViewerService` |
| `service/schema-path-factory/` | `SchemaPathFactory`, `AbstractSchemaPathFactory`, `DelegatingSchemaPathFactory` + one factory per kind |
| `workspace/` | `SchemaViewerTabDefinition`, params DTOs, `SchemaViewerTabFactory` |

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

## Related

- [`database-driver`](database-driver.md) — the schema model and `representativeFlags`
- [design language](../design-language.md) — flag/chip conventions
- [`entity-viewer`](entity-viewer.md) — consumes representative attributes for reference grouping
