# `storage` — persistent client-side storage

Generic module, registered second (right after [`config`](config.md)).

- **Provides:** `labStorageInjectionKey` → `LabStorage` (`storage/LabStorage.ts`)
- **Injects:** `evitaLabConfigInjectionKey`

## `LabStorage`

A thin key-value wrapper around browser local storage (the `store2` library). Consumers ask it for a
namespaced sub-store rather than touching local storage directly.

`get(key, def)` falls back to `def` only when the key is missing — falsy values (`0`, `''`, `false`)
are returned as they were stored.

**Storage keys must be globally unique.** There is no per-module key prefixing enforced by the type
system, so two modules picking the same key silently share (and corrupt) each other's state. Pick a
key that names the module and the concern.

It injects [`config`](config.md) because what gets persisted depends on the run mode — a driver-mode
instance and a standalone instance do not share the same persistence expectations.

Main consumers: `workspace` (open tabs, selected tab, tab history, panel state via `workspaceStore`) and
`welcome-screen` (`welcomeScreenStore`).

## Related

- [architecture](../architecture.md)
- [`workspace`](workspace.md) — the biggest consumer
