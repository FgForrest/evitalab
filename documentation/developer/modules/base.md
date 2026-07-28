# `base` — foundation for everything else

Abstract module. The foundation every other module builds on: the custom `V*` UI component library,
the base error hierarchy, and shared models for dialogs, menus, properties tables and tree views.

**The `base` module must not depend on any other module.** It has no `ModuleRegistrar` and provides
no injectable services — everything in it is imported directly.

## Contents

| Directory | What's in it |
|-----------|--------------|
| `component/` | The `V*` component library (27 components) — see [UI components](../ui-components.md) for the full catalog and when to use which |
| `exception/` | `LabError.ts` (base class every evitaLab error derives from), `UnexpectedError.ts`, `InitializationError.ts` |
| `model/dialog/` | `DangerousConfirmType` — controls whether a confirm button asks a second time |
| `model/menu/` | `MenuItem`, `MenuAction`, `MenuSubheader` — the menu model that `MenuFactory` subclasses build |
| `model/properties-table/` | `Property`, `PropertyValue` and the special value types rendered by `VPropertiesTable`: `ExtendedValue`, `KeywordValue`, `MultiValueFlagValue`, `NotApplicableValue`, `PlaceholderValue`, `ProgressValue`, `RangeValue` |
| `model/tree-view/` | `ItemFlag`, `ItemFlagType` — flag chips rendered next to tree-view items |
| `service/menu/` | `MenuFactory` — abstract base for the menu factories in `connection-explorer` and `entity-viewer` |

## Component groups

Grouped by what they are for (details in [UI components](../ui-components.md)):

- **Dialogs** — `VLabDialog`, `VFormDialog`, `VConfirmDialog`, and their buttons
  (`VConfirmDialogButton`, `VRejectDialogButton`, `VAlternativeActionDialogButton`).
  Note `VFormDialog`'s confirm label slot is **`confirm-button-body`**.
- **Tab chrome** — `VTabToolbar`, `VTabToolbarTitle`, `VTabMainActionButton`, `VSideTabs`.
- **Properties tables** — `VPropertiesTable` plus `VPropertiesTableValue`,
  `VPropertiesTableValueItem`, `VPropertiesTableValueList`.
- **Tree view** — `VTreeViewItem`, `VTreeViewEmptyItem`.
- **Lazy rendering** — `VListItemLazyIterator`, `VExpansionPanelLazyIterator` page the DOM for long
  lists (see [design language](../design-language.md)).
- **Misc** — `VActionTooltip` (tooltip that renders a `Command`'s keyboard shortcut), `VMarkdown`,
  `VMissingDataIndicator`, `VLoadingCircular`, `VListItemDivider`, `VCardTitleWithActions`,
  `VDateTimeInput`, `VTimeOffsetPicker`, `VExecuteQueryButton`.

## Related

- [UI components](../ui-components.md) — the component catalog and theming
- [design language](../design-language.md) — when to reach for which component
- [guidelines — error handling](../guidelines.md#error-handling) — how `LabError` subclasses are surfaced
