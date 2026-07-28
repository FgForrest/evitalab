# `desktop-support` — integration with evitaLab Desktop

Generic module. Active only in the **`DRIVER`** run mode, where evitaLab runs embedded in the evitaLab
Desktop application and must delegate some capabilities to the shell instead of handling them in-page.
No `ModuleRegistrar` and no injectable services — the IPC bridges are used directly by the modules that
need them.

## Contents

| Path | Purpose |
|------|---------|
| `global.d.ts` | Ambient declarations for the objects the desktop shell injects into `window` |
| `ipc/notification/service/LabNotificationManagerIpc.ts` | Bridge for handing notifications to the shell |
| `ipc/notification/model/` | The IPC wire types: `NotificationDefinitionDto`, `NotificationSourceDto`, `NotificationId`, `NotificationSeverity`, `InstanceNotificationSource` |

## How it is reached

Nothing imports this module conditionally at call sites. Instead
[`notification`](notification.md)'s `ToasterFactory` picks `RemoteToaster` when
[`config`](config.md) reports `DRIVER` mode, and `RemoteToaster` is the thing that talks to
`LabNotificationManagerIpc`. Adding another delegated capability should follow the same shape: an
interface in the owning module, two implementations, and the run mode selecting between them — not
`if (driverMode)` scattered through components.

The wire types are DTOs on purpose: they cross a process boundary, so they stay plain and separate from
the in-app `NotificationData` model.

## Related

- [architecture](../architecture.md) — run modes
- [`notification`](notification.md) — the consumer
- [build & tooling](../build-and-tooling.md) — `yarn dev-driver` / `yarn build-driver`
