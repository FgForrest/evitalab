# Guidelines

Rules and conventions for writing evitaLab code. Each module respects the **vertical slice
architecture** — a feature's components, models and services live together in its module
(see [module catalog](modules/index.md)). We are big fans of **immutability** (where it makes
sense) and Domain-Driven Design, and we try to build the codebase using these practices —
which is also what decides [where a file goes](#where-a-file-goes) within a module.

## TypeScript conventions

- **Explicit types everywhere** — declare types for variables, parameters and return values even
  when inferable (`const catalog: CatalogStatistics = ...`). This is the prevailing codebase style.
- Prefer `undefined` over `null`; check with `== undefined`.
- Domain model classes are immutable: `readonly` properties, initialization in the constructor,
  [Immutable.js](https://immutable-js.com/) collections (`List`, `Map`, `Set`) instead of mutable
  arrays/maps in models and service APIs. **Strict in the engine** — the `database-driver` internal
  model and its service APIs; **recommended in view models**, where the point is to prevent bugs rather
  than to satisfy the rule. Two consequences worth knowing:
  - A `readonly` field holding a plain array is not immutable, and it invites exactly the bug the rule
    exists to prevent: the visualiser DTOs used to advertise `readonly children: X[]` while
    `GraphQLHierarchyResultParser` filled that array *after* constructing the node. An `Immutable.List`
    forces the honest order — collect first, construct once complete.
  - Where a view model is handed to a third-party component that reads it by plain property access
    (Vuetify's data table rows, for instance), a plain object is the right call; say so in its JSDoc so
    the exception is not mistaken for an oversight. `readonly` plus `noUncheckedIndexedAccess` already
    gives compile-time immutability and undefined-safe reads there.
- Use evitaLab data types (`modules/database-driver/data-type/`) for evitaDB values — never raw
  strings/numbers for `BigDecimal`, date-times, locales, currencies, UUIDs etc.
- Enums are string-valued (`enum TabType { EntityViewer = 'entityViewer', ... }`).
- Errors extend `LabError` (`modules/base/exception/`); throw `UnexpectedError` for "should not
  happen" states.
- Every class, interface, type and Vue component gets a short JSDoc block describing its purpose.
  Do **not** put implementation-plan commentary into source files — extended documentation belongs
  in `documentation/`.

### Fixing type errors — never weaken types to get to green

`yarn typecheck` is a real gate at zero errors. When the compiler reports an
error, fix the cause, do not silence the symptom:

- **Forbidden by default:** `any`, `as unknown as X`, double casts, `!`
  non-null assertions, `@ts-ignore`, `@ts-expect-error`, loosening a signature
  to `object`/`Function`, or deleting a failing usage instead of understanding it.
- When two types disagree, decide **which one tells the truth** and fix the
  other. The grpc gen files (`connector/grpc/gen/`) are ground truth for wire
  data; the model classes (`request-response/`) are ground truth for the internal
  model. Never hand-edit the gen files — regenerate them.
- `Ref<T>` vs `T` mismatches usually mean a missing `.value` — often a real
  runtime bug, so verify the affected UI flow after fixing.
- gRPC enum-name↔value mismatches: convert explicitly
  (`GrpcEnum[name as keyof typeof GrpcEnum]`), never cast the array.
- **Last resort only** (a genuinely-wrong upstream library typing): a single,
  narrowly-scoped `@ts-expect-error` **with a comment naming the upstream issue**
  — never bare, never `@ts-ignore`.
- If a compiler-forced change alters a code path (added guard, `.value` unwrap,
  enum conversion), add/extend a regression test under `test/`.

## Where a file goes

Within a module's vertical slice ([module structure](modules/index.md)), the split between `model/`,
`service/` and `exception/` follows the Domain-Driven Design distinction, **not** the file's shape:
whether it is a class or a set of exported functions has no bearing on where it lives.

**`model/` — the module's vocabulary.** What the feature *is*:

- types, interfaces, enums and DTOs;
- immutable value objects and entities, **including methods over their own state** — a query on a
  model object belongs on that object, not in a service (see [anemic domain
  model](https://martinfowler.com/bliki/AnemicDomainModel.html));
- static data and constant lookup tables (`taskStateToColorMapping.ts`, `keyboardShortcutMappings.ts`);
- state holders that own their data together with the mutators of that data
  (`database-driver/model/serverConnectivity.ts`) — they are stateful, so they cannot be domain
  services (criterion 3 below).

**`service/` — operations over the vocabulary.** What the feature *does*. Eric Evans' three criteria
for a domain service apply; a file belongs here when **all three** hold:

1. the operation relates to a concept that is not a natural part of a single model type;
2. its interface is expressed in terms of model types;
3. the operation is stateless.

In practice that covers mappers and transformations between model types, factories that assemble
model objects, predicates and policies (specifications), and — as the dependency-bearing special
case — injectable collaborators. Injectables are services *because* they are dependency-bearing
operations, not the other way round: **a `service/` file need not be a class and need not have an
injection key.** Plain function modules belong here too (`code-editor/service/formatJson.ts`,
`console/result-visualiser/service/utils/schemaMatching.ts`).

**`exception/` — error types, and classifying errors** (`isConnectivityError`, `ErrorTransformer`).
Nothing else. Do not file something there merely because errors are what write to it — that is
proximity, not responsibility, and it hides the file from everyone who looks for it by what it *is*.

The awkward cases are usually primitive obsession. Logic that parses or validates a raw `string`
or `number` has no model type to live on, so it falls to a service by default; had the concept been
a value object, the same logic would have been its factory. Worth noting when you hit it — it is a
hint about the model, not a rule to act on.

> **Note for readers coming from [Feature-Sliced Design](https://feature-sliced.design/docs/reference/slices-segments):**
> FSD segments this differently — its `model` segment holds business logic including validation and
> stores, and auxiliary helpers go to `lib`. evitaLab does **not** follow FSD; it follows the DDD
> reading above, consistent with the intro to this document. Do not port FSD's segment semantics
> into this codebase.

## Naming conventions

- Types (class/interface/enum), and files naming a server-side entity: `PascalCase`, one type per
  file, file named after it.
- Files that are a set of functions or constants rather than a type: `camelCase`.
- Casing follows what the file **is**; the directory follows [where a file
  goes](#where-a-file-goes) — the two are independent, as
  `code-editor/service/flattenToSingleLine.ts` and `database-driver/model/serverConnectivity.ts`
  illustrate: same casing, opposite directories.
- **Directories: `kebab-case`**, always — including the sub-directories that group a driver model by
  concept (`request-response/schema/mutation/associated-data/`,
  `.../sortable-attribute-compound/`). The one exception is `connector/grpc/gen/`, which is generated.
- Injectable service pattern: `MyService` + `myServiceInjectionKey` + `useMyService()`.
- Tab classes: `<Feature>TabDefinition/TabParams/TabParamsDto/TabData/TabDataDto/TabFactory`.
- Shared Vue components: `V` prefix (`VLabDialog`); feature components without prefix.
- i18n keys: camelCase, namespaced per module (see [i18n](i18n.md)).

## Code architecture

### Component structure

We use [Single-File Components](https://vuejs.org/guide/scaling-up/sfc.html) with the
[Composition API](https://vuejs.org/api/composition-api-setup.html) and section order:

- `script` (setup)
- `template`
- `style`

### Component setup structure

Each `setup` portion of a component should follow this ordering:

- imports
- component constants
- injection of services
- props/emit definition
- refs/computed/functions

### MVVM for complex components

Complex components that access data should adhere to the
[Model-View-ViewModel architecture](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel),
preferably in conjunction with the [mediator pattern](https://en.wikipedia.org/wiki/Mediator_pattern):
a custom injectable service for the component (or component tree) abstracts access to generic
services (`EvitaClient`, `WorkspaceService`, …). Components hold only view state; queries, data
transformation and orchestration belong to the service. Example: `EntityViewerService` mediates
between the entity viewer components and query builders/executors.

![Component-service hierarchy](assets/component-service-hierarchy.svg)

### Dependency injection

Not every service needs DI. `<module>/service/` is where **business logic** lives, injectable or
not — a stateless, dependency-free transformation (`code-editor/service/formatEvitaQL.ts`) is a plain
exported function that callers import, and it is no less a service for it. Reach for an injectable
class when the logic has collaborators to resolve, state to hold, or an implementation to swap.
Either way it does not belong in `model/`, which holds the data the logic works on.

Each injectable service exports an injection key and a helper:

```ts
export const serviceInjectionKey: InjectionKey<Service> = Symbol('service')

export function useService(): Service {
    return mandatoryInject(serviceInjectionKey)
}
```

- The `Symbol` description must be globally unique (enforced at bootstrap).
- Services are constructed and provided in the module's `ModuleRegistrar`
  (see [architecture](architecture.md#module-registration-and-dependency-injection)).
- Constructor injection only — services receive their dependencies as constructor arguments.
- For **component-tree** DI (parent component providing context to descendants), create a
  `dependencies.ts` file next to the components with `provideX`/`injectX` functions wrapping the
  keys, so keys are not spread across components (examples:
  `modules/entity-viewer/viewer/component/dependencies.ts`,
  `modules/traffic-viewer/components/dependencies.ts`).

### Where logic belongs

- Components: rendering + small UI logic.
- Feature services: feature business logic, calls to `EvitaClient`.
- `EvitaClient`/driver: all server communication (see [database driver](database-driver.md)).
- Use the client directly in a component only for truly tiny logic.

### Encapsulate a responsibility in its own type

When a class starts to own a distinct, self-contained responsibility with its own state and behaviour
(a cache, a registry, a poller, a converter, a state machine…), give it its **own type** and hold an
instance of it — do not scatter raw `Map`s, arrays and ad-hoc helper functions across the host class.
The host delegates to thin wrappers; the collaborator owns its data and the operations over it.

- **A field's type should carry its invariants.** Prefer a small dedicated class/interface over a bare
  `Map<string, …>` or loosely-typed record once the structure has rules of its own (keying scheme,
  paired register/unregister, fire-on-change, cache-through fetch). This keeps the host thin, keeps each
  collaborator single-purpose and testable in isolation, and makes the pattern uniform across siblings.
- **Keep transport/framework coupling out of the collaborator.** Pass what it needs in — e.g. a fetch
  thunk rather than a client reference (see the cache-through accessor pattern in
  [database driver](database-driver.md#caching--change-callbacks)).
- **Follow the established sibling.** If a comparable collaborator already exists, mirror its shape
  (naming, method surface, id/callback conventions) instead of inventing a parallel style.

This is the same instinct as *Where logic belongs*, applied one level down: just as logic is placed in
the layer that owns it, state is placed in the type that owns it.

**When no type can own it**, and only then, a module-scoped signal is acceptable — a shared state whose
writers and readers sit in different modules, where threading it through dependency injection would couple
modules that otherwise never meet (`database-driver/model/serverConnectivity.ts` is the one instance —
[why](database-driver.md#offline-state--is-evitalab-offline)). File
it by **what it is**, not by who writes to it: it belongs in `model/`, next to the module's other
vocabulary, never in `exception/` just because errors are what set it — see
[where a file goes](#where-a-file-goes).

## UI

Use Vuetify components as the base and the custom component set documented in
[UI components](ui-components.md) — dialogs (`VLabDialog`/`VFormDialog`), tab toolbars
(`VTabToolbar`), properties tables, lazy iterators, tree items, markdown, code editors, etc.

Key rules:

- All tab windows must fill all available space.
- Use `VListItemDivider` in every non-menu list.
- Use lazy iterators (`VListItemLazyIterator`, `VExpansionPanelLazyIterator`) for potentially long
  lists.
- Use `mdi-*` icons; keep the icon of a feature consistent across menu items, tabs and toolbars.

### Forms

We use built-in Vuetify [forms](https://vuetifyjs.com/en/components/forms/) with built-in
[validation rules](https://vuetifyjs.com/en/components/forms/#rules). For forms in dialogs use
`VFormDialog`, which already handles validation, submit state and reset.

## Error handling

All service/`EvitaClient` calls in a component must be wrapped in try-catch so the component can
react to errors — usually by calling `toaster.error(...)` and providing fallback values:

```ts
const toaster: Toaster = useToaster()

try {
    catalogs.value = await evitaClient.getCatalogNames()
} catch (e: any) {
    await toaster.error(t('explorer.notification.couldNotLoadCatalogs'), e)
    catalogs.value = Set()
}
```

- Toast titles come from i18n; **pass the caught error as the second argument** (the toaster can open
  the error-viewer tab with details). Do *not* interpolate `errorMessage(e)` into the title instead — a
  fair number of existing sites do, and it costs the notification layer the only thing it can classify
  (see the next point). Prefer `error(title, e)` in new code.
- Services generally let errors propagate to the calling component; the driver already transforms
  transport errors into `LabError` types.
- **Do not suppress or deduplicate connectivity errors at a call site.** An unreachable server makes
  every read fail at once, and collapsing that flood into one notification is done centrally by
  `ConnectivityAwareToaster` — see
  [`notification`](modules/notification.md#reporting-outages-once-not-per-failure). Just report the
  failure as usual.
- Never swallow errors silently.

## Localization

All user-facing strings go through vue-i18n — no hardcoded texts in templates. See
[i18n](i18n.md) for key structure and usage patterns.

## Asynchronicity

- Service methods talking to the server are `async`; avoid fire-and-forget — `await` and handle
  errors.
- Long-running server operations report progress via async iterables or `TaskStatus` polling
  (see [database driver](database-driver.md#long-running-operations)).
- Register/unregister change callbacks symmetrically in `onMounted`/`onUnmounted` (same for
  `Keymap.bind`/`unbind`).
- **Session logic must be side-effect-free until it has its data.** The logic passed to
  `queryCatalog`/`updateCatalog` may be executed more than once (the client replays it on a session it
  evicted underneath the caller) and, because sessions materialize lazily, its cache-served prefix may run
  even while the server is unreachable and only then fail. Read first, act on the results afterwards — see
  [database driver — lazy materialization](database-driver.md#lazy-materialization).
- **A UI "reload" button must refresh, not invalidate.** Use the driver's `refresh*` entry points
  (`refreshCatalogSchema`, `refreshEntitySchema`, `refreshGraphQLSchema`, `refreshCatalogStatistics`), which
  fetch first and keep the displayed data when the fetch fails. Clearing a cache to force a reload destroys
  the offline copy for a user whose refresh cannot succeed — see
  [manual refresh](database-driver.md#manual-refresh-fetch-first-never-clear).

## Documentation

Document every new Vue component, class, type and interface with JSDoc. Any new or changed
functionality **must be reflected** in `documentation/developer/` (this directory). Changes to a
module belong on that module's own page under [`modules/`](modules/index.md) (one page per directory
in `src/modules/`); a brand-new module also needs a row in the [module catalog](modules/index.md).
New shared components go in [UI components](ui-components.md), new recipes in [recipes](recipes.md).

## Git

### Branches

We use 3 types of branches:

- `master` — released versions only
- `dev` — current development; target of feature branches
- feature branches — created from `dev` for each issue (bug fix or feature)

For hotfixes, a bug-fixing branch may be created from `master`, but it must not do more than fix a
bug in a non-breaking way.

### Commits

We use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages
and pull requests:

- commits are more transparent,
- GitHub CI/CD derives versions from them (see [build & tooling](build-and-tooling.md)).
