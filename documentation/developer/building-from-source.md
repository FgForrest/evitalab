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
reload — as long as you rebuilt in the **same** run mode. Other flags: `--port`,
`--connection-name`, `--dist`, `--host`; see `--help`.

### Restart the server after switching run mode

The run mode is detected **once, at startup**, and both modes build into the same `dist/` — so after
rebuilding in the other mode the server keeps serving the *previous* base path. The two directions
fail differently:

- **Server in driver mode, opened under `/lab/`** — every single request 404s, `index.html`,
  `assets/*` and `logo/*.svg` alike, because paths outside the base path are rejected outright.
  Nothing in the output says the mode is wrong, so it reads as a broken build rather than a stale
  server. This is the one that costs time.
- **Server in standalone mode serving a driver build** — mostly keeps working, since the `/lab/`
  prefix is simply stripped and the files resolve by name. Quieter, but you are then verifying a
  driver build under a base path it will never be deployed on.

The tell is the first startup line versus the URL you are opening:

```
[serve-dist] Detected run mode: driver     # → serving under /, so /lab/... 404s
```

Just restart the script after a mode switch (or pin it with `--mode standalone|driver`).

When scripting a wait-for-server loop, note that `curl -s -o /dev/null <url>` **exits 0 on a 404**, so
such a loop reports success against a server in exactly this state. Use `curl -fs`, or assert
`%{http_code}` — and probe a hashed asset from `dist/assets/` rather than `index.html`, which can still
be served successfully while every asset around it 404s.

The lab talks to evitaDB directly from the browser, cross-origin. The target server therefore has to
expose its APIs over plain HTTP (`tlsMode=RELAXED`) — as a local evitaDB started by
[`scripts/evitadb-server.sh`](evitadb-server.md) does — and accept the serving origin. If the
connection fails with `Failed to fetch` / CORS errors, check the server's TLS mode and allowed
origins first.

If you have the full toolchain available, `yarn preview` serves the standalone build the same way;
`serve-dist.sh` exists for environments without a Node.js setup.