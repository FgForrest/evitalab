# `config` — runtime configuration

Generic module, **registered first** in `src/modules/modules.ts` — nearly everything else injects it.

- **Provides:** `evitaLabConfigInjectionKey` → `EvitaLabConfig` (`useEvitaLabConfig()`)
- **Injects:** nothing

## What it carries

`EvitaLabConfig` (`config/EvitaLabConfig.ts`) is the single source of truth for how this evitaLab
instance is running:

| Concern | Notes |
|---------|-------|
| **Run mode** | `STANDALONE` (hosted web app) or `DRIVER` (embedded in evitaLab Desktop) — see [architecture](../architecture.md) |
| **Read-only flag** | Suppresses mutating actions across the UI |
| **Playground mode** | Restricts the instance for public demo use |
| **System properties** | Parsed from URL query params prefixed `evitalab-`, base64-encoded values |

## System properties

Configuration arrives through the URL rather than a config file, which is what lets a host embed a
preconfigured evitaLab: `?evitalab-<name>=<base64 of value>`. `EvitaLabConfig.load` decodes these at
bootstrap. This is also how a connection can be injected into a build that has no dev-mode
`VITE_DEV_CONNECTION` (see [`connection`](connection.md)).

## Related

- [architecture](../architecture.md) — bootstrap and run modes
- [build & tooling](../build-and-tooling.md) — the `VITE_*` build-time counterparts
- [`connection`](connection.md), [`storage`](storage.md) — the first consumers
