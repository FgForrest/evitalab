#!/usr/bin/env bash
# Serves an already built evitaLab `dist/` over plain HTTP so that a change can
# be verified in a browser without a Node.js/yarn environment (only python3 is
# required). `yarn preview` does the same job but needs the full toolchain.
#
# Handles the two things a naive static server gets wrong for evitaLab:
#   * the standalone build is served under the `/lab/` base path,
#   * a production build has no dev connection, so the evitaDB connection is
#     injected as the `evitalab-connection` URL system property.
#
# See documentation/developer/building-from-source.md for usage.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DEFAULT_DIST="${PROJECT_DIR}/dist"
DEFAULT_PORT="8080"
DEFAULT_MODE="auto"
DEFAULT_SERVER_URL="http://localhost:5555"
DEFAULT_CONNECTION_NAME="Preview"

usage() {
    cat <<'EOF'
Usage: serve-dist.sh [options]

Serves a built evitaLab dist over HTTP (foreground, Ctrl-C to stop).

Options:
    --port <port>         Port to listen on (default: 8080).
    --mode <mode>         auto | standalone | driver (default: auto).
                          Detected from dist/index.html at startup only;
                          standalone is served under /lab/, driver under /.
    --server-url <url>    evitaDB server the lab connects to
                          (default: http://localhost:5555).
    --connection-name <n> Display name of the injected connection
                          (default: Preview).
    --dist <dir>          Directory to serve (default: <project>/dist).
    --host <host>         Bind address (default: 0.0.0.0).
    -h, --help            Show this help.

Prerequisites:
    A production build must exist: `yarn build` (standalone) or
    `yarn build-driver` (driver). Both write into `dist/`.

Note:
    Rebuilding in the same run mode needs only a browser reload. Rebuilding in
    the OTHER mode requires restarting this script — the mode is resolved once
    at startup, so the server would keep serving the previous base path and
    every request to the expected prefix would 404 even though the files exist.
EOF
}

log() { printf '[serve-dist] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

DIST="$DEFAULT_DIST"
PORT="$DEFAULT_PORT"
MODE="$DEFAULT_MODE"
SERVER_URL="$DEFAULT_SERVER_URL"
CONNECTION_NAME="$DEFAULT_CONNECTION_NAME"
BIND_HOST="0.0.0.0"

while [ $# -gt 0 ]; do
    case "$1" in
        --port) PORT="$2"; shift 2 ;;
        --mode) MODE="$2"; shift 2 ;;
        --server-url) SERVER_URL="$2"; shift 2 ;;
        --connection-name) CONNECTION_NAME="$2"; shift 2 ;;
        --dist) DIST="$2"; shift 2 ;;
        --host) BIND_HOST="$2"; shift 2 ;;
        -h|--help) usage; exit 0 ;;
        *) usage; die "Unknown option: $1" ;;
    esac
done

command -v python3 >/dev/null 2>&1 || die "python3 is not on PATH (it is the only prerequisite of this script)"

# A malformed server URL is not rejected by the lab — it fails as an endless
# "Loading ..." splash, so catch the common mistakes here.
case "$SERVER_URL" in
    http://*|https://*) ;;
    *) die "--server-url must include the scheme, e.g. http://localhost:5555 (got: ${SERVER_URL})" ;;
esac

[ -d "$DIST" ] || die "Dist directory not found: ${DIST}. Build it first: yarn build (standalone) or yarn build-driver (driver)."
[ -f "${DIST}/index.html" ] || die "No index.html in ${DIST} — this does not look like an evitaLab build."

case "$MODE" in
    auto)
        if grep -q '"/lab/' "${DIST}/index.html" || grep -q "'/lab/" "${DIST}/index.html"; then
            MODE="standalone"
        else
            MODE="driver"
        fi
        log "Detected run mode: ${MODE}"
        ;;
    standalone|driver) ;;
    *) die "Unsupported mode: ${MODE} (expected auto, standalone or driver)" ;;
esac

exec python3 - "$DIST" "$PORT" "$MODE" "$SERVER_URL" "$CONNECTION_NAME" "$BIND_HOST" <<'PYTHON'
"""Static file server for a built evitaLab dist.

Serves the standalone build under the /lab/ base path and the driver build
under /, falls back to index.html for SPA routes and redirects the site root
to a URL carrying the evitaDB connection as a system property.
"""
import base64
import json
import mimetypes
import os
import sys
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DIST, RAW_PORT, MODE, SERVER_URL, CONNECTION_NAME, BIND_HOST = sys.argv[1:7]
PORT = int(RAW_PORT)
BASE = '/lab/' if MODE == 'standalone' else '/'
CONNECTION_PARAM = 'evitalab-connection'

# evitaLab reads system properties from URL query params prefixed with
# `evitalab-`, base64-encoded (see EvitaLabConfig.load). The base64 must be
# percent-encoded, otherwise `+` would be decoded back as a space.
CONNECTION = base64.b64encode(json.dumps({
    'id': 'preview',
    'name': CONNECTION_NAME,
    'serverUrl': SERVER_URL,
}).encode('utf-8')).decode('ascii')
ENTRY_PATH = '{}?{}={}'.format(BASE, CONNECTION_PARAM, urllib.parse.quote(CONNECTION, safe=''))

# python's mimetypes db is incomplete on some systems; the lab bundle needs these
for extension, mime_type in {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm',
    '.map': 'application/json',
}.items():
    mimetypes.add_type(mime_type, extension)


class EvitaLabHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def translate_path(self, path: str) -> str:
        requested = urllib.parse.unquote(urllib.parse.urlsplit(path).path)

        if BASE != '/':
            if not requested.startswith(BASE):
                # outside of the base path — resolve to a non-existent file (404)
                return os.path.join(DIST, '__outside_base_path__')
            requested = '/' + requested[len(BASE):]

        segments = [segment for segment in requested.split('/') if segment not in ('', '.', '..')]
        target = os.path.join(DIST, *segments)

        if os.path.isdir(target):
            target = os.path.join(target, 'index.html')
        if not os.path.isfile(target) and os.path.splitext(target)[1] == '':
            # SPA route — let the app router resolve it. Missing assets (which
            # always have an extension) still return 404 so build problems show.
            target = os.path.join(DIST, 'index.html')
        return target

    def do_GET(self) -> None:  # noqa: N802 - http.server API
        split = urllib.parse.urlsplit(self.path)
        query = urllib.parse.parse_qs(split.query)
        is_entry_point = split.path in ('/', BASE, BASE.rstrip('/'))
        if is_entry_point and CONNECTION_PARAM not in query:
            self.send_response(302)
            self.send_header('Location', ENTRY_PATH)
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self) -> None:
        # never cache — a rebuilt dist must be picked up on plain reload
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main() -> None:
    server = ThreadingHTTPServer((BIND_HOST, PORT), EvitaLabHandler)
    print('[serve-dist] serving {} ({} mode) on port {}'.format(DIST, MODE, PORT), file=sys.stderr)
    print('[serve-dist] evitaDB server: {}'.format(SERVER_URL), file=sys.stderr)
    print('[serve-dist] open: http://localhost:{}{}'.format(PORT, ENTRY_PATH), file=sys.stderr)
    print('[serve-dist] press Ctrl-C to stop', file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('', file=sys.stderr)
        print('[serve-dist] stopped', file=sys.stderr)
    finally:
        server.server_close()


main()
PYTHON
