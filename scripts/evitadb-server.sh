#!/usr/bin/env bash
# Launcher for a Dockerized evitaDB server used by evitaLab dev / agentic
# workflows.
#
# See documentation/developer/evitadb-server.md for usage.

set -euo pipefail

CONTAINER_NAME="evitalab-dev-evitadb"
IMAGE="index.docker.io/evitadb/evitadb"
DATA_HOST_DIR="/evita-data"
API_PORT="5555"

DEFAULT_TAG="canary"
DEFAULT_WAIT="120"

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
    start [--tag <tag>] [--host <host>] [--wait <seconds>]
                          Start the evitaDB container and wait until ready.
    stop                  Stop and remove the container.
    restart [...]         Stop, then start (start options forwarded).
    status [--host <host>]
                          Report container state, image tag, and readiness.
    logs [-f]             Print container logs.
    pull [--tag <tag>]    Pull the image.

Options:
    --tag <tag>           Image tag (default: canary = evitaDB `dev` branch).
    --host <host>         Host to probe for readiness.
                          Default: derived from DOCKER_HOST (tcp://<host>:...)
                          or "localhost" for a native host / Unix socket.
    --wait <seconds>      Readiness timeout (default: 120).

Container:
    Name:  evitalab-dev-evitadb
    Image: index.docker.io/evitadb/evitadb:<tag> (default `canary`)
    Port:  5555 (all APIs multiplexed)
    Data:  /evita-data on host -> /evita/data in container
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
    while [ $# -gt 0 ]; do
        case "$1" in
            --tag) tag="$2"; shift 2 ;;
            --host) host="$2"; shift 2 ;;
            --wait) wait_seconds="$2"; shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done

    require_docker

    if [ ! -d "$DATA_HOST_DIR" ]; then
        die "Data directory not found on host: $DATA_HOST_DIR"
    fi

    if container_running; then
        local current_image
        current_image=$(container_image_tag)
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
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "${API_PORT}:${API_PORT}" \
        -v "${DATA_HOST_DIR}:/evita/data" \
        -e EVITA_ARGS="\
api.exposedOn=localhost \
api.certificate.generateAndUseSelfSigned=true \
api.endpoints.graphQL.tlsMode=RELAXED \
api.endpoints.rest.tlsMode=RELAXED \
api.endpoints.lab.tlsMode=RELAXED \
api.endpoints.gRPC.tlsMode=RELAXED \
api.endpoints.gRPC.mTLS.enabled=false" \
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
