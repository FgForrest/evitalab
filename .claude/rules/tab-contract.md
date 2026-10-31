# Tab contract

Before adding or changing a tab type or a tab component, read
[workspace & tabs — tab component contract](../../documentation/developer/workspace-and-tabs.md#tab-component-contract),
[loading, errors & retry](../../documentation/developer/workspace-and-tabs.md#loading-errors--retry) and the
[new tab recipe](../../documentation/developer/recipes.md#add-a-new-tab-type). The traps:

- **A tab that blocks on loading uses one `initialize()`**, called from `onBeforeMount` and from the exposed
  `retry()`; success emits `'ready'`, failure emits `'error', asError(e)` — **never a toast**, or the tab renders with
  no data and no way out.
- **Always expose `retry()`; never rely on the `:key` remount fallback.** Under `KeepAlive`, `onUnmounted` does not
  run on remount, so every registration made at setup (schema callbacks, subscriptions) leaks once per retry.
- **Register callbacks and keymap bindings symmetrically**: everything registered is unregistered on unmount.
- Restored and shared tabs never auto-execute a query.
- The tab component fills its space and uses `VTabToolbar`.
- The factory is provided **and** registered into `TabFactoryRegistry` in the module's registrar; nothing in
  `workspace` is edited for a new tab type.
