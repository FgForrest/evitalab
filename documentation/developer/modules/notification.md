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
| `service/ConnectivityAwareToaster.ts` | Decorator that collapses "server unreachable" floods (see below) |
| `service/ToasterFactory.ts` | Picks the implementation from the run mode in [`config`](config.md), then wraps it in the decorator |
| `model/NotificationData.ts`, `model/NotificationType.ts` | The notification model |

## Two implementations, one interface

The run mode decides which `Toaster` is provided, so callers never branch on it:

- **`LocalToaster`** — standalone web app; toasts render in the page.
- **`RemoteToaster`** — driver mode; toasts are handed to the desktop shell through
  [`desktop-support`](desktop-support.md)'s IPC bridge so they appear as native notifications.

## Reporting outages once, not per failure

Whatever implementation the run mode picks, `ToasterFactory` wraps it in **`ConnectivityAwareToaster`**, so both
environments behave the same. Its job: when the server is unreachable, *every* action that wants fresh data
fails, and each failure used to raise its own notification — a single user action could bury the screen in
near-identical network errors that all say the same thing.

The decorator reports an outage **once per reporting round**, keyed on the driver's offline state
(`isServerUnreachable()` / `currentOutageReportingRound()` in
[`database-driver`](../database-driver.md#offline-state--is-evitalab-offline)). One generic message
(`common.notification.serverUnreachable`) per round, no matter how long the outage lasts or how many reads fail
during it; the next outage is reported again, because recovery ends the round.

**A user-initiated refresh always gets an answer.** The reload paths call `requestOutageReport()`, which starts a
new round, so pressing *Reload* (or the schema viewer's / GraphQL console's reload button) deep into an already
reported outage is reported again rather than doing nothing visible. The background retries and pollers that
produce most of an outage's failures do not call it — that asymmetry is the whole point, and it is why the call
is explicit in those few places instead of being inferred.

**Why a state and not a time window.** An earlier version collapsed notifications within a few seconds of each
other, and that is the wrong shape for the problem: a *sustained* outage keeps producing failures indefinitely
as pollers and retries fire, and any window short enough to still answer a deliberate user action is far too
short to cover them — the flood merely becomes a slow drip. The window also had to guess whether a notification
carrying no error object belonged to an outage from how recently one had happened, which breaks under load.
Keying on the offline state removes both problems and involves no timers.

Everything that is **not** an outage passes through untouched, with its own title and error — a malformed query
must never be swallowed because the server happened to be down. Unreported failures are still `console.error`-ed,
so nothing is lost for diagnosis.

Recognising an outage report takes two mechanisms, because reporting sites come in two shapes:

| Shape | How it is recognised |
|---|---|
| `error(title, error)` — the error is passed | `isConnectivityError(error)`. Every connectivity error reaching a component came through `ErrorTransformer`, which has already flipped the state, so an episode exists by then |
| `error(title)` — the reason is interpolated into the title, no error | counts as an outage report exactly while the server is unreachable — there is nothing to classify, and the offline state is the evidence |

The second mechanism exists only because the title-only shape is the majority of call sites. Its cost is that an
unrelated *title-only* failure during an outage is collapsed too; that is bounded by the outage actually being in
progress, and such sites overwhelmingly report server calls anyway.

That bound is only as good as the driver's *recovery* signal, which is why it is observed on **both** transports
— the gRPC interceptor and the HTTP client's `afterResponse` hook (see
[offline state](../database-driver.md#offline-state--is-evitalab-offline)). A user working only in a GraphQL
console makes no gRPC calls at all, so with the gRPC funnel alone a single transient fetch failure kept this
decorator swallowing every title-only error toast long after the server was answering again.

**Do not add connectivity suppression at a call site.** It is centralised here precisely so 100+ reporting sites
don't each grow their own version of it.

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
