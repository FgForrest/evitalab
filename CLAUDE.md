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
- [module catalog](documentation/developer/modules/index.md) — index of all modules under `src/modules/`,
  linking to one detail page per module (`documentation/developer/modules/<module>.md`)
- [database driver](documentation/developer/database-driver.md) — `EvitaClient`, sessions, internal model, caching
- [workspace & tabs](documentation/developer/workspace-and-tabs.md) — the tab framework every feature plugs into
- [UI components](documentation/developer/ui-components.md) — custom component catalog and theming
- [design language](documentation/developer/design-language.md) — visual & interaction conventions for building new pages
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

**Agents: `node_modules` is usually empty in a fresh sandbox.** Run `yarn install` without asking as
soon as you need to build, type-check, lint or test — a missing dependency tree shows up as
`error Command "vitest" not found` (or the same for `vue-tsc`/`eslint`), which is a setup gap, not a
code problem. Two notes:

- `node_modules/.gitignore` and `node_modules/.gitkeep` are **tracked** — they are what keeps the
  populated directory out of `git status`. If they show as deleted (a wiped `node_modules`), restore
  them with `git checkout -- node_modules/.gitignore node_modules/.gitkeep` after installing,
  otherwise `git status` fills with hundreds of untracked entries.
- Mention the install in your summary; it changes the working tree even though it touches no code.
  Yarn v1 does not bump versions the lockfile already pins, so a clean install leaves `yarn.lock`
  alone — any diff there is pre-existing work, not install churn.

```bash
yarn install                # install dependencies
yarn dev                    # dev server (localhost:3000/lab); dev-driver for Desktop driver mode
yarn dev:demo|dev:local     # dev server with the connection forced to demo / a local evitaDB
                            # dev-driver:demo|dev-driver:local for driver mode
yarn build                  # type-check + production build; build-driver for driver mode
yarn lint                   # ESLint with auto-fix
yarn test                   # Vitest
```

Full reference (env variables, Vite config, CI/CD): [build & tooling](documentation/developer/build-and-tooling.md).

**Agent workflow:** when the user wants to verify changes in their own browser ("build it, I want to
test it now"), use the skill `.claude/skills/build-evitalab/SKILL.md` — it builds the requested run
mode and hands over `./scripts/serve-dist.sh`, which serves `dist/` with the correct base path and an
injected evitaDB connection using only `python3` (no Node.js needed on the developer's side).

### evitaDB server

evitaLab needs a running evitaDB backend to verify changes — either **DEMO** (`https://demo.evitadb.io`;
use for evitaLab-only work) or **LOCAL** (Dockerized evitaDB via `scripts/evitadb-server.sh`, which
requires `--data-dir`; use when the task depends on an unreleased evitaDB feature). Details, container
lifecycle, custom evitaDB properties, Docker networking and the `VITE_DEV_LOCAL_URL` override:
[evitaDB server](documentation/developer/evitadb-server.md).
Never mutate `.env.local` in agent flows — select the backend with `yarn dev:demo` / `yarn dev:local`
and pass any extra variable inline.

**Agent workflow:** the skill `.claude/skills/evitadb-server/SKILL.md` codifies the decision (ask once
per session — DEMO or LOCAL?), the startup / readiness probe, and the cleanup (stop + remove container
on task completion). Invoke it before starting the dev server for any task that verifies UI behavior.

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

## Analyzing, planning and ADR

When an analysis of a problem is requested, do not write an implementation plan, just state the facts the developer and their team need to know to make a decision.
These documents will be stored inside this project at `documentation/analysis`. 

If an implementation plan of a specific request is requested, write a detailed implementation plan and store it
inside this project at `documentation/plans` and delete it after an ADR record is written (see below).

`documentation/adr/` holds one dated record per line of work — what was done, when, why, which alternatives were declined
**and why they lost**, and what it relates to. It is the project's memory of reasoning; the code only remembers outcomes.

- Before starting work, search it for the area you are touching and read the "Consequences & open follow-ups" of every hit — known traps and deliberately-deferred work live there.
- After finishing work that clears the bar, write the record and delete the documentation/plans it replaces. Not optional, and not a follow-up task.
- Never attribute anything to a customer — see "No customer attribution" in `.claude/rules/adr.md`.
- In-flight plans `documentation/plans` and analysis `documentation/analysis` are never committed to git. They are working notes, not a deliverable — tracking them puts intent into the history where a later reader cannot tell it apart from outcome. They are git-ignored to make this automatic rather than a matter of remembering.
- A plan must leave the disk when the work finalizes — merged, abandoned, or decided against. Two exits, no third: write the ADR and delete the plan, or delete the plan outright. A plan left behind reads as current intent long after it stopped being true.
- The bar defaults to no. All three must hold: a genuine fork (a reasonable alternative was rejected for a reason the code doesn't show), reasoning that outlives the change (it constrains work beyond the files you touched), and nothing cheaper that carries it (a commit message or a code comment is the first choice). Most work does not clear it — a thin ADR is worse than none. Never for renames, dependency bumps, fixture or benchmark tweaks, or anything the diff plus its commit message already explains.

Template: documentation/adr/TEMPLATE.md. Index: documentation/adr/README.md, generated by scripts/generate-adr-index.sh. Full rules — when a record is required, which date it carries, what to keep and what to delete: .claude/rules/adr.md.

## Architecture & Conventions

Described in the [developer documentation](documentation/developer/index.md) — see the links above.
The non-negotiable rules:

- Modules under `src/modules/` communicate via dependency injection; injectable services are provided
  by `ModuleRegistrar`s registered in `src/modules/modules.ts` (order matters) and consumed via
  `useX()` helpers built on `mandatoryInject`.
- All evitaDB server communication goes through `EvitaClient` (`useEvitaClient()`), usually from services.
- A change that depends on a newer evitaDB API (new constraint/argument, field, endpoint, regenerated gRPC
  types — typically anything that needs the `canary` server) raises the supported-server floor in
  `.evitadbrc` in the same change ([versioning](documentation/developer/evitadb-server.md#versioning)).
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
- Use [conventional commits](https://www.conventionalcommits.org/) — CI/CD depends on this for versioning, do not mentions any author, always use `Refs:` with number of current the issue by first number in the branch name, keep the descriptio coarse
- Details: [guidelines — git](documentation/developer/guidelines.md#git)
- Do NOT commit any changes unless explicitly asked.

## External Documentation

Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without being explicitly asked.
