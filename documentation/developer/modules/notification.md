# `notification` — toast notifications

Generic module, registered sixth (after [`workspace`](workspace.md), whose service it needs).
All user feedback in evitaLab goes through this module.

- **Provides:** `toasterInjectionKey` → `Toaster` (`useToaster()`)
- **Injects:** `evitaLabConfigInjectionKey`, `connectionServiceInjectionKey`,
  `workspaceServiceInjectionKey`, `errorViewerTabFactoryInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `service/Toaster.ts` | The `Toaster` interface (`success`/`info`/`error`) + `useToaster()` |
| `service/LocalToaster.ts` | Standalone mode — renders via `vue-toastification` |
| `service/RemoteToaster.ts` | Driver mode — forwards to evitaLab Desktop over IPC |
| `service/ToasterFactory.ts` | Picks the implementation from the run mode in [`config`](config.md) |
| `model/NotificationData.ts`, `model/NotificationType.ts` | The notification model |

## Two implementations, one interface

The run mode decides which `Toaster` is provided, so callers never branch on it:

- **`LocalToaster`** — standalone web app; toasts render in the page.
- **`RemoteToaster`** — driver mode; toasts are handed to the desktop shell through
  [`desktop-support`](desktop-support.md)'s IPC bridge so they appear as native notifications.

## Why it injects the error-viewer factory

`toaster.error(title, error)` can offer to open the full error in an **error viewer** tab — that is why
this module needs `errorViewerTabFactoryInjectionKey` and `workspaceServiceInjectionKey`, and why
[`error-viewer`](error-viewer.md) is registered before it.

## The convention

Every service or `EvitaClient` call made from a component is wrapped in try-catch and reported with
`useToaster().error(...)`. This is not optional — see
[guidelines — error handling](../guidelines.md#error-handling). Toast text always comes from
[i18n](../i18n.md), never a literal.

## Related

- [guidelines — error handling](../guidelines.md#error-handling)
- [design language — feedback & safety](../design-language.md#feedback--safety)
- [`error-viewer`](error-viewer.md), [`desktop-support`](desktop-support.md)
