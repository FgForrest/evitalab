# `welcome-screen` — landing screen

Feature module. The landing screen shown in **standalone** mode when no tab is open. It is a view, not a
tab, and is the only feature module with its own Pinia store.

- **Provides:** `welcomeScreenServiceInjectionKey` → `WelcomeScreenService`
- **Injects:** `evitaLabConfigInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `component/WelcomeScreen.vue` | The screen, choosing between the two contents below |
| `component/StandaloneWelcomeContent.vue` | Standalone mode — blog posts, docs and community links |
| `component/DriverWelcomeContent.vue` | Driver mode — a reduced variant |
| `service/WelcomeScreenService.ts` | Supplies the content |
| `service/EvitaDBDocsClient.ts` | Fetches blog posts from the evitaDB site |
| `model/EvitaDBBlogPost.ts` | Blog-post model |
| `store/welcomeScreenStore.ts` | Pinia store (fetched posts) |

## Two contents, chosen by run mode

It injects [`config`](config.md) purely to decide which content to render: in driver mode the desktop
shell already provides its own surroundings, so the standalone landing content would be redundant.

## `EvitaDBDocsClient` is the one outbound HTTP call

This is the only place evitaLab talks to something other than the configured evitaDB server — it fetches
blog posts from the public evitaDB site. Consequences worth knowing: in a sandboxed or offline
environment that fetch simply fails and the screen renders without posts, and it is unrelated to
[`database-driver`](database-driver.md) (no `EvitaClient` involvement).

## Related

- [architecture](../architecture.md) — run modes and bootstrap
- [`workspace`](workspace.md) — the shell that hosts this screen
