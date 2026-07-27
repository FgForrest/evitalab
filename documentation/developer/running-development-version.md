# Running development version

To develop evitaLab, you need to know how to run it in the development environment.

Before you start, make sure you have [Node.js](https://nodejs.org/en/) installed in the version specified in `.nvmrc` and [Yarn](https://yarnpkg.com/)
package manager installed.

Then you can run it either in standalone mode:

```shell
yarn install
yarn dev
```

_this will start a development server on [localhost:3000/lab](http://localhost:3000/lab) address._

Or the driver mode (for [evitaLab Desktop](https://github.com/FgForrest/evitalab-desktop)):

```shell
yarn install
yarn dev-driver
```

_this will start a development server on [localhost:3000](http://localhost:3000) address._

By default, the development version of evitaLab starts with a connection to the evitaDB Demo server. You can change it
in the `.env.local` file by modifying the `VITE_DEV_CONNECTION` variable. Right now the following values are supported:

- `DEMO` - connects to the evitaDB Demo server
- `LOCAL` - connects to a local evitaDB server running on the default port 5555 (override the URL with `VITE_DEV_LOCAL_URL`)

To spin up a local Dockerized evitaDB (matching the `dev` integration branch via the `canary` tag by default) and run vite against it in one step:

```shell
yarn dev:with-evitadb
```

Additional container management scripts (`yarn evitadb:start`, `evitadb:stop`, `evitadb:status`, `evitadb:logs`) and the
underlying `scripts/evitadb-server.sh` are documented in [evitaDB server](evitadb-server.md).

To build the production version of evitaLab, check out the [building from source section](building-from-source.md).