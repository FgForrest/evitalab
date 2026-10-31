# Using the database driver

Before writing code that calls `EvitaClient`, a session or the driver caches, read the relevant parts of
[database driver](../../documentation/developer/database-driver.md): *Lazy materialization*, *Caching & change
callbacks*, *Manual refresh: fetch first, never clear*, *Date-time values*. The traps:

- **Session logic is side-effect-free until it has its data.** It can be replayed on a fresh session and runs its
  cache-served prefix while offline.
- **Never add an `await` inside `getOrCreateSharedSession` before the session is registered** — it would leak
  sessions or fail on a warming-up catalog.
- **A reload button calls a `refresh*` entry point**, never a cache-clearing one: clearing destroys the offline copy.
- **Change listeners do no server I/O inline** and always unregister on unmount; a new mutating call clears the
  caches it affects.
- **Never format a date-time instant with a plain `Intl` formatter** (it shifts to the browser's zone); print driver
  values through the injected `EvitaValuePrinter` (`useEvitaValuePrinter()` or a constructor argument).
- An absent wire field becomes `undefined`, never `0` or `''`.
- Never edit `connector/grpc/gen/` by hand; regenerate it with the `generate-evitadb-client` skill.
