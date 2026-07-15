# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

evitaLab (or "lab" for short) is the official web-based GUI client for evitaDB e-commerce database. It's a Vue.js SPA that allows users to
browse entities, execute queries (GraphQL/evitaQL), inspect schemas, manage server connections, and more.

Technology stack: Yarn, Vue.js 3 (Composition API), TypeScript 5, Vite 7, Vitest 3, Pinia 3, Vuetify 3.

## Documentation

Developer documentation lives in `documentation/developer/` — **read it before analyzing source code**;
it covers the architecture, all modules, custom components, conventions and step-by-step recipes:

- [index](documentation/developer/index.md) — TOC with recommended reading order
- [architecture](documentation/developer/architecture.md) — bootstrap, run modes, module system, dependency injection
- [module catalog](documentation/developer/modules/index.md) — what every module under `src/modules/` does
- [database driver](documentation/developer/database-driver.md) — `EvitaClient`, sessions, internal model, caching
- [workspace & tabs](documentation/developer/workspace-and-tabs.md) — the tab framework every feature plugs into
- [UI components](documentation/developer/ui-components.md) — custom component catalog and theming
- [guidelines](documentation/developer/guidelines.md) — coding conventions, error handling, git workflow
- [recipes](documentation/developer/recipes.md) — step-by-step: new service/module/tab/dialog/shortcut, calling evitaDB, pre-PR checklist
- [i18n](documentation/developer/i18n.md), [testing](documentation/developer/testing.md), [build & tooling](documentation/developer/build-and-tooling.md)

When implementing or changing any functionality, it HAS TO BE REFLECTED in the documentation files.

### Source code pollution

Don't overcomment the source code itself, focus documentation mainly into the /documentation
directories. If you comment the code, don't mention anything from the implementation plans, like
Phases of implementation or things like that. Keep only language-specific documentation in the
source code files.

## Building

**Package manager is yarn. Never run `npm install`, `npm ci`, or `npx` in this repo** — npm may write `package-lock.json`, which diverges from `yarn.lock`. If yarn looks broken, fix it (proxy allowlist / corepack / missing binary); do not fall back to npm.

```bash
yarn install                # install dependencies
yarn dev                    # dev server (localhost:3000/lab); dev-driver for Desktop driver mode
yarn build                  # type-check + production build; build-driver for driver mode
yarn lint                   # ESLint with auto-fix
yarn test                   # Vitest
```

Full reference (env variables, Vite config, CI/CD): [build & tooling](documentation/developer/build-and-tooling.md).

### evitaDB server

evitaLab needs a running evitaDB backend to verify changes — either **DEMO** (`https://demo.evitadb.io`,
the `.env.local` default; use for evitaLab-only work) or **LOCAL** (Dockerized evitaDB; use when the task
depends on an unreleased evitaDB feature). Details, yarn shortcuts, Docker networking and
`VITE_DEV_LOCAL_URL` override: [evitaDB server](documentation/developer/evitadb-server.md).
Never mutate `.env.local` in agent flows — use inline env vars instead.

**Agent workflow:** the skill `.claude/skills/evitadb-server/SKILL.md` codifies the decision (ask once
per session — DEMO or LOCAL?), the startup / readiness probe, and the cleanup (stop + remove container
on task completion). Invoke it before running `yarn dev` for any task that verifies UI behavior.

## Browser Automation

Use agent-browser for web automation. Run agent-browser --help for all commands.

Core workflow:

1. agent-browser open <url> - Navigate to page
2. agent-browser snapshot -i - Get interactive elements with refs (@e1, @e2)
3. agent-browser click @e1 / fill @e2 "text" - Interact using refs
4. Re-snapshot after page changes

## Mandatory advisor calls (cost discipline)

ALWAYS call advisor() BEFORE:

- Invoking /batch or any skill that spawns multiple parallel Agent calls
- Spawning 3+ Agent tool calls in a single turn
- Committing to a multi-hour delegation plan (10+ work units)
- Any action that crosses multiple repositories

Non-negotiable. A 30-second advisor call is cheaper than a failed 90M-token orchestration. Advisor sees the full transcript and will flag memory-rule violations, cost concerns, and fan-out mistakes before they happen.

## Planning

Always create a detailed plan of implementation or fix if asked for issue analysis. Always store the plan in Markdown file
inside this project.

## Architecture & Conventions

Described in the [developer documentation](documentation/developer/index.md) — see the links above.
The non-negotiable rules:

- Modules under `src/modules/` communicate via dependency injection; injectable services are provided
  by `ModuleRegistrar`s registered in `src/modules/modules.ts` (order matters) and consumed via
  `useX()` helpers built on `mandatoryInject`.
- All evitaDB server communication goes through `EvitaClient` (`useEvitaClient()`), usually from services.
- Wrap all service/`EvitaClient` calls in components in try-catch and report via `useToaster().error(...)`.
- New tabs: implement `TabDefinition` + factory, open via `workspaceService.createTab(...)` —
  follow the [recipe](documentation/developer/recipes.md#add-a-new-tab-type).
- Prefer the custom `V*` components over raw Vuetify ([UI components](documentation/developer/ui-components.md)).
- All user-facing strings go through i18n (`src/modules/i18n/en.json`).
- Document every new Vue component, class, type and interface (JSDoc) and reflect changes in
  `documentation/developer/`.

## Git Workflow

- `master`: released versions only; `dev`: current development (target for PRs and feature branches)
- Feature branches: created from `dev` for each issue
- Use [conventional commits](https://www.conventionalcommits.org/) — CI/CD depends on this for versioning
- Details: [guidelines — git](documentation/developer/guidelines.md#git)

## External Documentation

Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without being explicitly asked.
