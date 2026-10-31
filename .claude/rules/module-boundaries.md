# Module boundaries

Before adding an import from another module, a new module or a new registrar, read
[modules — module dependency rules](../../documentation/developer/modules/index.md#module-dependency-rules) and
[architecture — contribution points](../../documentation/developer/architecture.md#contribution-points).
The traps:

- **Generic and abstract modules never import feature modules.** When the framework needs feature behaviour
  (a tab of any type, a demo snippet), the generic module owns a registry and the feature contributes into it —
  importing the feature instead creates a cycle (#476 was one).
- **`base` depends on no other module.** Generic helpers there take what they need as parameters or duck-type it.
- **A registrar can only inject what an earlier entry in `src/modules/modules.ts` provided.** Order matters.
- **A new cross-module edge is either removed or added to the documented exception list in the same change.**
  Known undocumented edges today (do not add more, do not copy the pattern): `database-driver` → `schema-viewer`
  (`Flag`), `history-viewer` (`MutationHistoryRequest`), `connection-explorer` (`MutationProgressType`); `base` →
  `database-driver` (`properties-table/RangeValue.ts`), `keymap` (`Command`, `Keymap`).
- **Cross-module access goes through injected services**, never another module's internal state.
- A change that needs a newer evitaDB API raises the floor in `.evitadbrc` in the same change.
