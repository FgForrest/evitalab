#!/usr/bin/env bash
# Launcher for a Dockerized evitaDB server used by evitaLab dev / agentic
# workflows.
#
# See documentation/developer/evitadb-server.md for usage.

set -euo pipefail

CONTAINER_NAME="evitalab-dev-evitadb"
IMAGE="index.docker.io/evitadb/evitadb"
CONTAINER_DATA_DIR="/evita/data"
API_PORT="5555"

DEFAULT_TAG="canary"
DEFAULT_WAIT="120"

# Baseline evitaDB properties passed via EVITA_ARGS. Self-signed certificates
# plus RELAXED TLS on every endpoint let evitaLab connect over plain HTTP.
# Any property supplied through --arg / EVITA_EXTRA_ARGS overrides the entry
# with the same key here.
# This is a bash array: one `key=value` entry per line, quoted, NO commas -
# a trailing comma becomes part of the value and evitaDB fails to parse it.
DEFAULT_EVITA_ARGS=(
    "api.exposedOn=localhost"
    "api.certificate.generateAndUseSelfSigned=true"
    "api.endpoints.graphQL.tlsMode=RELAXED"
    "api.endpoints.rest.tlsMode=RELAXED"
    "api.endpoints.lab.tlsMode=RELAXED"
    "api.endpoints.gRPC.tlsMode=RELAXED"
    "api.endpoints.gRPC.mTLS.enabled=false"
    "storage.compress=true"
    "server.trafficRecording.enabled=true"
)

# Default readiness host. If DOCKER_HOST is set to a tcp://<host>:<port> URL
# (typical for Claude Code sandboxes with a sidecar Docker daemon), the host
# published port is reachable at that <host>. Otherwise fall back to localhost
# (native host or Unix socket).
default_host() {
    case "${DOCKER_HOST:-}" in
        tcp://*)
            local hostport="${DOCKER_HOST#tcp://}"
            echo "${hostport%%:*}"
            ;;
        *)
            echo "localhost"
            ;;
    esac
}

DEFAULT_HOST="$(default_host)"

usage() {
    cat <<'EOF'
Usage: evitadb-server.sh <command> [options]

Commands:
    start --data-dir <dir> [--tag <tag>] [--host <host>] [--wait <seconds>]
          [--arg <k=v> ...]
                          Start the evitaDB container and wait until ready.
    stop                  Stop and remove the container.
    restart [...]         Stop, then start (start options forwarded, so
                          --data-dir is required here as well).
    status [--host <host>]
                          Report container state, image tag, data directory,
                          properties and readiness.
    logs [-f]             Print container logs.
    pull [--tag <tag>]    Pull the image.

Options:
    --data-dir <dir>      REQUIRED. Where evitaDB stores its data - either an
                          absolute host path (checked for existence on the
                          machine running this script) or the name of a docker
                          volume (created on demand). There is no
                          default on purpose: the data directory decides which
                          catalogs the server sees, so it is always an explicit
                          choice. Mounted to /evita/data in the container.
    --tag <tag>           Image tag (default: canary = evitaDB `dev` branch).
    --host <host>         Host to probe for readiness.
                          Default: derived from DOCKER_HOST (tcp://<host>:...)
                          or "localhost" for a native host / Unix socket.
    --wait <seconds>      Readiness timeout (default: 120).
    --arg <key=value>     Extra evitaDB property appended to EVITA_ARGS.
                          Repeatable. A key that also exists in the built-in
                          defaults replaces it. Values must not contain spaces.

Environment:
    EVITA_DATA_DIR        Fallback for --data-dir (--data-dir wins). Handy for
                          `export`ing once per shell session instead of
                          repeating the directory on every invocation.
    EVITA_EXTRA_ARGS      Space-separated `key=value` properties, merged the
                          same way as --arg (--arg wins on a key collision).

Properties:
    Baseline EVITA_ARGS (self-signed certificates + RELAXED TLS so evitaLab
    can connect over plain HTTP) is always applied; --arg / EVITA_EXTRA_ARGS
    override individual keys. A running container is never reconfigured in
    place -- if the requested data directory or properties differ from the
    running ones, `start` fails and asks for `restart`.

Examples:
    evitadb-server.sh start --data-dir /evita-data
    evitadb-server.sh start --data-dir my-scratch-volume --tag 2026.1
    evitadb-server.sh restart --data-dir /evita-data \
        --arg server.trafficRecording.enabled=true

Container:
    Name:  evitalab-dev-evitadb
    Image: index.docker.io/evitadb/evitadb:<tag> (default `canary`)
    Port:  5555 (all APIs multiplexed)
    Data:  <--data-dir> -> /evita/data in container
EOF
}

log() { printf '[evitadb-server] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

require_docker() {
    command -v docker >/dev/null 2>&1 || die "docker is not on PATH"
}

container_exists() {
    docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"
}

container_running() {
    docker ps --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"
}

container_image_tag() {
    docker inspect --format '{{.Config.Image}}' "$CONTAINER_NAME" 2>/dev/null || true
}

container_evita_args() {
    docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$CONTAINER_NAME" 2>/dev/null \
        | sed -n 's/^EVITA_ARGS=//p'
}

# Data directory the container was created with: the volume name for a named
# volume, the host path for a bind mount.
container_data_dir() {
    docker inspect \
        --format "{{range .Mounts}}{{if eq .Destination \"${CONTAINER_DATA_DIR}\"}}{{if .Name}}{{.Name}}{{else}}{{.Source}}{{end}}{{end}}{{end}}" \
        "$CONTAINER_NAME" 2>/dev/null || true
}

# Normalizes and validates the user-supplied data directory. A value containing
# a slash is a host path and must exist (docker would otherwise create it as
# root-owned); anything else is a docker volume name, created on demand.
resolve_data_dir() {
    local dir="$1"
    case "$dir" in
        */)
            # strip trailing slashes so the value matches docker's own
            # normalization when comparing against a running container
            while [ "${dir}" != "/" ] && [ "${dir%/}" != "$dir" ]; do
                dir="${dir%/}"
            done
            ;;
    esac
    case "$dir" in
        /*)
            [ -d "$dir" ] || die "Data directory does not exist: $dir"
            ;;
        */*)
            die "Data directory path must be absolute (or a docker volume name): $dir"
            ;;
    esac
    printf '%s' "$dir"
}

require_data_dir() {
    local dir="$1"
    [ -n "$dir" ] && return 0
    log "Missing required --data-dir - it has no default, because the data"
    log "directory decides which catalogs the server sees."
    log ""
    log "  shared evitaLab dev data:  $0 start --data-dir /evita-data"
    log "  throwaway catalog set:     $0 start --data-dir evitadb-scratch"
    log "                             (a docker volume, created on demand)"
    log ""
    log "To avoid repeating it, export EVITA_DATA_DIR once per shell session."
    die "No data directory specified."
}

# Validates a `key=value` property token supplied by the user.
validate_property() {
    local token="$1"
    case "$token" in
        *[[:space:]]*) die "Property must not contain whitespace: '$token'" ;;
        =*) die "Property is missing a key: '$token'" ;;
        *=*) ;;
        *) die "Property must be in key=value form: '$token'" ;;
    esac
}

# Joins `key=value` tokens into a single EVITA_ARGS string, keeping only the
# last occurrence of each key so later tokens (user overrides) win over
# earlier ones (built-in defaults).
compose_evita_args() {
    local -a tokens=("$@")
    local -a merged=()
    local total="${#tokens[@]}"
    local i j key keep
    for (( i = 0; i < total; i++ )); do
        key="${tokens[i]%%=*}"
        keep=1
        for (( j = i + 1; j < total; j++ )); do
            if [ "$key" = "${tokens[j]%%=*}" ]; then
                keep=0
                break
            fi
        done
        if [ "$keep" -eq 1 ]; then
            merged+=("${tokens[i]}")
        fi
    done
    printf '%s' "${merged[*]}"
}

probe_readiness() {
    local host="$1"
    local http_code
    http_code=$(curl -sS -o /dev/null -w '%{http_code}' \
        --max-time 3 \
        "http://${host}:${API_PORT}/system/readiness" 2>/dev/null || echo "000")
    [ "$http_code" = "200" ]
}

wait_for_ready() {
    local host="$1"
    local timeout="$2"
    local elapsed=0
    log "Waiting up to ${timeout}s for evitaDB to become ready at http://${host}:${API_PORT}/system/readiness ..."
    while [ "$elapsed" -lt "$timeout" ]; do
        if probe_readiness "$host"; then
            log "evitaDB is ready (took ${elapsed}s)."
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    die "evitaDB did not become ready within ${timeout}s. Try: $0 logs"
}

cmd_start() {
    local tag="$DEFAULT_TAG"
    local host="$DEFAULT_HOST"
    local wait_seconds="$DEFAULT_WAIT"
    local data_dir="${EVITA_DATA_DIR:-}"
    local -a cli_args=()
    while [ $# -gt 0 ]; do
        case "$1" in
            --data-dir) data_dir="$2"; shift 2 ;;
            --tag) tag="$2"; shift 2 ;;
            --host) host="$2"; shift 2 ;;
            --wait) wait_seconds="$2"; shift 2 ;;
            --arg) validate_property "$2"; cli_args+=("$2"); shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done

    # EVITA_EXTRA_ARGS is word-split on purpose - it carries several properties.
    local -a env_args=()
    local token
    for token in ${EVITA_EXTRA_ARGS:-}; do
        validate_property "$token"
        env_args+=("$token")
    done

    # Defaults first, then env, then CLI - the last occurrence of a key wins.
    local evita_args
    evita_args="$(compose_evita_args \
        "${DEFAULT_EVITA_ARGS[@]}" \
        ${env_args[@]+"${env_args[@]}"} \
        ${cli_args[@]+"${cli_args[@]}"})"

    require_docker
    require_data_dir "$data_dir"
    data_dir="$(resolve_data_dir "$data_dir")"

    if container_running; then
        local current_image current_args current_data_dir
        current_image=$(container_image_tag)
        current_args=$(container_evita_args)
        current_data_dir=$(container_data_dir)
        if [ "$current_data_dir" != "$data_dir" ]; then
            log "Running container data directory:   $current_data_dir"
            log "Requested container data directory: $data_dir"
            die "Container ${CONTAINER_NAME} is already running with a different data directory. Re-run with 'restart' (same options) to recreate it."
        fi
        if [ "$current_args" != "$evita_args" ]; then
            log "Running container properties:   $current_args"
            log "Requested container properties: $evita_args"
            die "Container ${CONTAINER_NAME} is already running with different evitaDB properties. Re-run with 'restart' (same options) to apply them."
        fi
        log "Container already running (image: $current_image). Waiting for readiness..."
        wait_for_ready "$host" "$wait_seconds"
        return 0
    fi

    if container_exists; then
        log "Removing stale container..."
        docker rm -f "$CONTAINER_NAME" >/dev/null
    fi

    log "Pulling image ${IMAGE}:${tag} ..."
    docker pull "${IMAGE}:${tag}" >/dev/null

    log "Starting container ${CONTAINER_NAME} (image: ${IMAGE}:${tag}) ..."
    log "Data directory: ${data_dir} -> ${CONTAINER_DATA_DIR}"
    log "Properties: ${evita_args}"
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "${API_PORT}:${API_PORT}" \
        -v "${data_dir}:${CONTAINER_DATA_DIR}" \
        -e EVITA_ARGS="$evita_args" \
        "${IMAGE}:${tag}" >/dev/null

    wait_for_ready "$host" "$wait_seconds"
    log "Started. Reachable at http://${host}:${API_PORT}"
}

cmd_stop() {
    require_docker
    if container_exists; then
        log "Stopping and removing container ${CONTAINER_NAME} ..."
        docker rm -f "$CONTAINER_NAME" >/dev/null
        log "Stopped."
    else
        log "Container ${CONTAINER_NAME} does not exist. Nothing to do."
    fi
}

cmd_restart() {
    cmd_stop
    cmd_start "$@"
}

cmd_status() {
    local host="$DEFAULT_HOST"
    while [ $# -gt 0 ]; do
        case "$1" in
            --host) host="$2"; shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done

    require_docker
    if ! container_exists; then
        echo "state: absent"
        return 0
    fi
    echo "state: $(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME")"
    echo "image: $(container_image_tag)"
    echo "data-dir: $(container_data_dir)"
    echo "properties: $(container_evita_args)"
    if container_running; then
        if probe_readiness "$host"; then
            echo "readiness: ready (http://${host}:${API_PORT}/system/readiness = 200)"
        else
            echo "readiness: not-ready (http://${host}:${API_PORT}/system/readiness != 200)"
        fi
    fi
}

cmd_logs() {
    require_docker
    container_exists || die "Container ${CONTAINER_NAME} does not exist."
    docker logs "$@" "$CONTAINER_NAME"
}

cmd_pull() {
    local tag="$DEFAULT_TAG"
    while [ $# -gt 0 ]; do
        case "$1" in
            --tag) tag="$2"; shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done
    require_docker
    log "Pulling ${IMAGE}:${tag} ..."
    docker pull "${IMAGE}:${tag}"
}

main() {
    [ $# -ge 1 ] || { usage; exit 1; }
    local subcmd="$1"; shift
    case "$subcmd" in
        start)   cmd_start "$@" ;;
        stop)    cmd_stop "$@" ;;
        restart) cmd_restart "$@" ;;
        status)  cmd_status "$@" ;;
        logs)    cmd_logs "$@" ;;
        pull)    cmd_pull "$@" ;;
        -h|--help|help) usage ;;
        *) usage; exit 1 ;;
    esac
}

main "$@"
