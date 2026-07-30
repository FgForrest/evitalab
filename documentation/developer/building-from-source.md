# Building from source

To build the production version of evitaLab, follow the steps below:

Before you start, make sure you have [Node.js](https://nodejs.org/en/) installed in the version specified in `.nvmrc` and [Yarn](https://yarnpkg.com/)
package manager installed.

Then you can build either the standalone mode:

```shell
yarn install
yarn build
```

Or the driver mode (for [evitaLab Desktop](https://github.com/FgForrest/evitalab-desktop)):

```shell
yarn install
yarn build-driver
```

Both modes write into the same `dist/` directory — a build of one mode overwrites the other.

## Serving the built dist locally

To open a build in a browser (typically to verify changes somebody else built, e.g. an AI agent),
use `scripts/serve-dist.sh`. Its only prerequisite is `python3` — no Node.js, no `yarn install`:

```shell
./scripts/serve-dist.sh --server-url https://demo.evitadb.io
```

The script prints the URL to open and keeps running in the foreground (Ctrl-C stops it):

```
[serve-dist] serving /path/to/evitalab/dist (standalone mode) on port 8080
[serve-dist] open: http://localhost:8080/lab/?evitalab-connection=<base64>
```

It takes care of the three things a plain static file server gets wrong:

- **Base path** — the standalone build is served under `/lab/`, the driver build under `/`. The run
  mode is auto-detected from `dist/index.html` (override with `--mode standalone|driver`).
- **evitaDB connection** — a production build has no connection configured (`VITE_DEV_CONNECTION`
  applies to `yarn dev` only), so the script injects the server passed in `--server-url`
  (default `http://localhost:5555`) as the `evitalab-connection` URL
  [system property](toolkit.md).
- **SPA routing** — extension-less paths fall back to `index.html`, missing assets still return 404.

Responses are sent with `Cache-Control: no-store`, so a rebuilt `dist/` is picked up on a plain
reload. Other flags: `--port`, `--connection-name`, `--dist`, `--host`; see `--help`.

The lab talks to evitaDB directly from the browser, cross-origin. The target server therefore has to
expose its APIs over plain HTTP (`tlsMode=RELAXED`) — as a local evitaDB started by
[`scripts/evitadb-server.sh`](evitadb-server.md) does — and accept the serving origin. If the
connection fails with `Failed to fetch` / CORS errors, check the server's TLS mode and allowed
origins first.

If you have the full toolchain available, `yarn preview` serves the standalone build the same way;
`serve-dist.sh` exists for environments without a Node.js setup.