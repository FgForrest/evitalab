# `server-viewer` — server status & details

Feature module. Shows the connected server's status and details. Contributes `TabType.ServerViewer`.

- **Provides:** `serverViewerServiceInjectionKey`, `serverViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `connectionServiceInjectionKey`,
  `tabFactoryRegistryInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `component/ServerViewer.vue` | The tab body — stat tiles |
| `component/ServerTitle.vue` | Tab title |
| `service/ServerViewerService.ts` | Fetches server status through `EvitaClient.management` |
| `service/ServerViewerTabFactory.ts`, `model/ServerViewerTab*` | Tab wiring |

## The 5 s poll, and why it force-refreshes

The tab polls every 5 s and **force-refreshes** server metadata through the cache
(`getServerStatus(forceRefresh: true)`) so the stats actually advance instead of returning a frozen
cached value. Each successful refresh also fires the **server-status callbacks**, which is what keeps
[`connection-explorer`](connection-explorer.md)'s menu in sync without that panel needing its own
polling — so this tab's poll is load-bearing beyond its own UI.

## When the server goes down mid-session

If a poll fails while the tab is open, the body swaps the stat tiles for an **"unavailable" indicator**
instead of showing stale data, and keeps polling silently so it recovers on its own once the server is
back. The manual reload button still surfaces the error via a toast — silent recovery applies to the
automatic poll only, so a user-initiated action always reports what happened.

## Related

- [`database-driver`](database-driver.md) — `getServerStatus`, the metadata cache and its
  invalidate-vs-refresh semantics
- [`connection-explorer`](connection-explorer.md) — consumer of the server-status callbacks
