# Code placement and dependency injection

Before creating or moving a file, and before a plan names a location for one, read and follow
[guidelines — where a file goes](../../documentation/developer/guidelines.md#where-a-file-goes),
[guidelines — naming conventions](../../documentation/developer/guidelines.md#naming-conventions) and
[guidelines — dependency injection](../../documentation/developer/guidelines.md#dependency-injection).
The traps they cover, which plans have fallen into before (494bf2b0 moved misplaced files out of `model/`):

- **`model/` is vocabulary, not "logic without the DOM".** Types, value objects (with methods over
  their own state), constants and lookup tables go there. Stateless operations and function sets go to
  `service/`, and so do interfaces that describe an operation (precedent: `notification/service/Toaster.ts`,
  `keymap/service/Keymap.ts`). Composables (`useX`) go to `composable/`. `exception/` holds error types and
  error classification only. evitaLab does not follow Feature-Sliced Design segments.
- **No module-level service singletons** (`export const fooService = new FooService()`). Apply the
  guidelines' test: a service with collaborators, state or a swappable implementation (e.g. constructor-passed
  tables) is provided by the module's `ModuleRegistrar` (`fooServiceInjectionKey` + `useFooService()`) and
  reaches other services through their constructor. A stateless, dependency-free transformation is a plain
  exported function. Stateless strategy instances used only to build a provided service stay module-private.
- **Generic helpers take what they need as parameters** (e.g. a printer) rather than importing a module's
  service, or `src/utils` and `base` end up depending on feature code. Value objects never get services
  injected; the service operates on them.
- **Tests mirror `src/`**: a moved file moves its test.
