# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

evitaLab is the official web-based GUI client for evitaDB e-commerce database. It's a Vue.js SPA that allows users to browse entities, execute queries (GraphQL/evitaQL), inspect schemas, manage server connections, and more.

## Development Commands

```bash
# Install dependencies
yarn install

# Run development server (localhost:3000/lab)
yarn dev

# Run in driver mode for evitaLab Desktop (localhost:3000)
yarn dev-driver

# Build for production
yarn build                  # Standalone mode
yarn build-driver           # Driver mode for Desktop app

# Lint with auto-fix
yarn lint

# Run tests
yarn test
```

**Environment Configuration:** Set `VITE_DEV_CONNECTION` in `.env.local` to `DEMO` (default) or `LOCAL` to change the dev connection target.

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

## Git Workflow

- `master`: Released versions only
- `dev`: Current development (target for feature branches)
- Feature branches: Created from `dev` for each issue

Use [conventional commits](https://www.conventionalcommits.org/) for commit messages - CI/CD depends on this for versioning.

## External Documentation

Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without being explicitly asked.
