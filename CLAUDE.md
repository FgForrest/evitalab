# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

evitaLab (or "lab" for short) is the official web-based GUI client for evitaDB e-commerce database. It's a Vue.js SPA that allows users to 
browse entities, execute queries (GraphQL/evitaQL), inspect schemas, manage server connections, and more.

## Documentation

There is developer documentation in documentation/developer directory, you should use it to understand the project 
structure and implemented functionalities. When implementing or changing any functionality, it HAS TO BE REFLECTED 
in the documentation files.

### Source code pollution

Don't overcommend the source code itself in the source code files, focus it mainly into either /documentation 
directories. If you comment the code, don't mention anything from the implementation plans, like mention Phases of 
implementation or things like that. Keep only language-specific documentation in the source code files.

## Technology stack

- Vue.js 3
- TypeScript 5
- Vite 7
- Vitest 3
- Pinia 3

## Building

### evitaLab - Vite + Vue + TypeScript

```bash
# Install dependencies
yarn install

# Run development server (localhost:3000/lab)
yarn dev

# Run in driver mode for evitaLab Desktop app (localhost:3000)
yarn dev-driver

# Build for production
yarn build                  # Standalone mode
yarn build-driver           # Driver mode for Desktop app

# Code Lint with auto-fix
yarn lint

# Run tests
yarn test
```

**Environment Configuration:** Set `VITE_DEV_CONNECTION` in `.env.local` to `DEMO` (default) or `LOCAL` to change the dev connection target.

### evitaDB server

evitaLab needs a running evitaDB backend to verify changes. Two options:

- **DEMO** (`https://demo.evitadb.io`) — cheap, quick. Use for evitaLab-only work (UI, refactors, bugfixes not tied to evitaDB API changes). This is the `.env.local` default.
- **LOCAL** — a Dockerized `evitadb/evitadb:<tag>` container managed by `scripts/evitadb-server.sh`. Use when the task depends on an unreleased evitaDB feature. Default tag `canary` = evitaDB `dev` branch. Pass `--tag <version>` for pinned versions (no auto-resolution).

Yarn shortcuts: `yarn evitadb:start | evitadb:stop | evitadb:status | evitadb:logs`, or `yarn dev:with-evitadb` to launch both.

Networking: Docker runs on a sidecar daemon. `evitadb-server.sh` auto-detects the docker-host hostname from `DOCKER_HOST` (e.g. `tcp://docker:2375` → the container is reachable at `docker:5555`); on a native host with a Unix socket it falls back to `localhost:5555`. The `LOCAL` connection URL is overridable via `VITE_DEV_LOCAL_URL` (never mutate `.env.local` in agent flows — use inline env vars instead).

**Agent workflow:** the skill `.claude/skills/evitadb-server/SKILL.md` codifies the decision (ask once per session — DEMO or LOCAL?), the startup / readiness probe, and the cleanup (stop + remove container on task completion). Invoke it before running `yarn dev` for any task that verifies UI behavior.

## Browser Automation

Use agent-browser for web automation. Run agent-browser --help for all commands.

Core workflow:

1. agent-browser open <url> - Navigate to page
2. agent-browser snapshot -i - Get interactive elements with refs (@e1, @e2)
3. agent-browser click @e1 / fill @e2 "text" - Interact using refs
4. Re-snapshot after page changes

Mandatory advisor calls (cost discipline)

ALWAYS call advisor() BEFORE:

- Invoking /batch or any skill that spawns multiple parallel Agent calls
- Spawning 3+ Agent tool calls in a single turn
- Committing to a multi-hour delegation plan (10+ work units)
- Any action that crosses multiple repositories

Non-negotiable. A 30-second advisor call is cheaper than a failed 90M-token orchestration. Advisor sees the full transcript and will flag memory-rule violations, cost concerns, and fan-out mistakes before they happen.

## Planning

Always create a detailed plan of implementation or fix if asked for issue analysis. Always store the plan in Markdown file 
inside this project.

## Architecture

### Module System

The codebase is organized into **modules** under `src/modules/`. Each module is a semantic domain separation with its own services, components, and models. Modules communicate via dependency injection.

**Module types:**
- **Abstract modules** (`base`, `console`, `code-editor`): Shared services, models, and UI components
- **Generic modules** (`config`, `connection`, `workspace`, `storage`, `keymap`): Core evitaLab infrastructure
- **Feature modules** (`entity-viewer`, `evitaql-console`, `graphql-console`, `schema-viewer`, etc.): User-facing features

**Key modules:**
- `database-driver`: `EvitaClient` class - the single entrypoint for all evitaDB server communication. Uses gRPC internally but exposes an internal model tailored to evitaLab
- `workspace`: Manages tabs, history, and overall UI structure. Use `WorkspaceService` to create tabs
- `connection`: Manages connections to evitaDB instances

### Module Registration

Modules that need dependency injection implement `ModuleRegistrar` interface and are registered in `src/modules/modules.ts`. The registration order matters - base modules must be registered before feature modules that depend on them.

```typescript
// Example: injecting EvitaClient in a module registrar
const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)

// In components, use the helper
const evitaClient = useEvitaClient()
```

### Bootstrapping

`main.ts` initializes Vue, plugins, and calls each module's `register()` method. `Lab.vue` is the root component.

## Code Conventions

### Vue Components

- Use **Single-File Components** with **Composition API**
- Order: `<script>`, `<template>`, `<style>`
- Setup structure: imports → constants → service injection → props/emit → refs/computed/functions
- Complex data-accessing components should follow **MVVM** pattern with a mediator service

### Dependency Injection

Export injection key and helper function for each injectable service:

```typescript
export const serviceInjectionKey: InjectionKey<Service> = Symbol('service')
export function useService(): Service {
    return mandatoryInject(serviceInjectionKey)
}
```

For component tree injection, create a `dependencies.ts` file with `provideX`/`injectX` methods.

### UI Components

Use Vuetify components as the base. Custom components in `modules/base/component`:
- `VLabDialog` / `VFormDialog` for dialogs
- `VTabToolbar` for tab toolbars
- `VPropertiesTable` for property displays
- `VMarkdown` for markdown rendering
- `VQueryEditor`, `VInlineQueryEditor`, `VPreviewEditor` for code editors

### Error Handling

Wrap all service/EvitaClient calls in try-catch and use `useToaster().error(...)` for user feedback.

### Creating Tabs

Implement `TabDefinition` interface, create a factory class, then use:
```typescript
workspaceService.createTab(tabDefinition)
```

## Documentation

Document every new Vue component, class, type, interface, and so on.

## Git Workflow

- `master`: Released versions only
- `dev`: Current development (target for feature branches)
- Feature branches: Created from `dev` for each issue

Use [conventional commits](https://www.conventionalcommits.org/) for commit messages - CI/CD depends on this for versioning.

## External Documentation

Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without being explicitly asked.
