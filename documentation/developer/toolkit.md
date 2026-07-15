# Developer toolkit

The generic infrastructure originally summarized on this page now has dedicated in-depth pages:

- **Database access (`EvitaClient`, sessions, internal model, caches)** →
  [database driver](database-driver.md)
- **Workspace, tabs, tab history, panels, status bar** →
  [workspace & tabs](workspace-and-tabs.md)
- **Custom UI components, theming, code editors, toast notifications** →
  [UI components](ui-components.md)
- **Module system, dependency injection, bootstrap** →
  [architecture](architecture.md)
- **Localization** → [i18n](i18n.md)
- **Per-module reference** → [module catalog](modules/index.md)
- **Common implementation tasks (new service/module/tab/dialog/shortcut, storage, history)** →
  [recipes](recipes.md)

Quick reference of the remaining small generic services:

- **Storage** — `LabStorage` (`modules/storage/`): key-value wrapper over browser local storage;
  keys must be globally unique across evitaLab.
- **Config** — `EvitaLabConfig` (`modules/config/`): run mode, read-only flag, system properties
  parsed from URL query parameters.
- **Keymap** — `Keymap` service + `Command` enum (`modules/keymap/`): keyboard shortcuts bound per
  tab context; see the [recipe](recipes.md#add-a-keyboard-shortcut).
- **Notifications** — `useToaster()` (`modules/notification/`): `success`/`info`/`warning`/`error`
  toasts; local in standalone mode, forwarded to evitaLab Desktop in driver mode.
