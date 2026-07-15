# evitaLab developer documentation

evitaLab is a pure browser SPA built with the [Vue.js 3 framework](https://vuejs.org/)
(Composition API + TypeScript), [Vuetify](https://vuetifyjs.com/en/) for UI,
[Vite](https://vitejs.dev/) for building and [Yarn](https://yarnpkg.com/) as the package manager.
The required [Node.js](https://nodejs.org/en) version is in `.nvmrc`.

## Getting started

- [Running development version](running-development-version.md)
- [Building from source](building-from-source.md)
- [evitaDB server](evitadb-server.md) — backend to develop against (demo vs. local Docker)
- [Build & tooling](build-and-tooling.md) — scripts, env variables, Vite config, CI/CD

## Understanding the codebase

Recommended reading order for anyone (human or AI agent) new to the codebase:

1. [Codebase architecture](architecture.md) — bootstrap, run modes, module system, dependency
   injection, state management
2. [Module catalog](modules/index.md) — what every module under `src/modules/` does
3. [Database driver](database-driver.md) — `EvitaClient`, sessions, internal model, caching
4. [Workspace and tabs](workspace-and-tabs.md) — the tab framework every feature plugs into
5. [UI components](ui-components.md) — custom component catalog and theming
6. [Design language](design-language.md) — visual & interaction conventions for building new
   pages consistently

## Writing code

- [Guidelines](guidelines.md) — conventions, best practices, git workflow
- [Recipes](recipes.md) — step-by-step instructions for common tasks (new service, module, tab,
  dialog, keyboard shortcut, …)
- [Localization](i18n.md) — i18n key structure and usage
- [Testing](testing.md) — Vitest conventions
- [Developer toolkit](toolkit.md) — quick reference of generic services

When implementing or changing any functionality, the change **has to be reflected** in these
documentation files.
