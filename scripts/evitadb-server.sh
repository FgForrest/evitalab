#!/usr/bin/env bash
# Launcher for a Dockerized evitaDB server used by evitaLab dev / agentic
# workflows.
#
# Two modes:
#   image  (default) - runs the published `evitadb/evitadb:<tag>` image
#   source           - runs evitaDB built from a local source tree; the locally
#                      built shaded jar is bind-mounted over the one the image
#                      ships, so the image only provides the JVM + entrypoint
#
# See documentation/developer/evitadb-server.md for usage.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONTAINER_NAME="evitalab-dev-evitadb"
IMAGE="index.docker.io/evitadb/evitadb"
DATA_HOST_DIR="/evita-data"
API_PORT="5555"

DEFAULT_TAG="canary"
DEFAULT_WAIT="120"

# evitaDB source tree used by `source` mode. Resolution order:
# --repo <path> -> $EVITADB_REPO -> sibling of the evitaLab repo.
DEFAULT_REPO="${EVITADB_REPO:-$(cd "$SCRIPT_DIR/../.." && pwd)/evitaDB}"
SOURCE_JAR_REL="evita_server/target/evita-server.jar"
CONTAINER_JAR_PATH="/evita/bin/evita-server.jar"
# `source` mode keeps its own dataset - a source build may carry unreleased
# storage-format changes that would poison the dataset shared with image mode.
DEFAULT_SOURCE_DATA_DIR="${EVITADB_SOURCE_DATA_DIR:-$HOME/.evitalab/evita-data-source}"
DEFAULT_DEBUG_PORT="8005"

LABEL_MODE="io.evitalab.mode"
LABEL_JAR_MTIME="io.evitalab.jar-mtime"
LABEL_JAR_PATH="io.evitalab.jar-path"
LABEL_DEBUG_PORT="io.evitalab.debug-port"

# Self-signed certificates and RELAXED TLS on all endpoints so evitaLab can
# connect over plain HTTP without any certificate setup.
EVITA_ARGS_BASE="\
api.exposedOn=localhost \
api.certificate.generateAndUseSelfSigned=true \
api.endpoints.graphQL.tlsMode=RELAXED \
api.endpoints.rest.tlsMode=RELAXED \
api.endpoints.lab.tlsMode=RELAXED \
api.endpoints.gRPC.tlsMode=RELAXED \
api.endpoints.gRPC.mTLS.enabled=false"

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
    start [--source] [--repo <path>] [--no-build] [--data-dir <path>]
          [--debug [port]] [--tag <tag>] [--host <host>] [--wait <seconds>]
                          Start the evitaDB container and wait until ready.
                          With --source: build the jar with Maven, then run it
                          in the image; the container is recreated whenever the
                          freshly built jar differs from the running one.
    stop                  Stop and remove the container.
    restart [...]         Stop, then start (start options forwarded).
    rebuild [...]         Like `start --source`, but always recreates the
                          container (start options forwarded).
    status [--host <host>]
                          Report container state, mode, image tag, readiness
                          and - in source mode - jar staleness.
    logs [-f]             Print container logs.
    pull [--tag <tag>]    Pull the image.
    build [--repo <path>] Build the evitaDB jar from source, nothing else.

Options:
    --source              Run evitaDB built from the local source tree.
    --repo <path>         evitaDB source tree (implies --source).
                          Default: $EVITADB_REPO or the sibling ../evitaDB.
    --no-build            Skip the Maven build and run the jar currently in
                          `evita_server/target/` (implies --source).
    --data-dir <path>     Host data directory.
                          Default: /evita-data (image mode),
                          $EVITADB_SOURCE_DATA_DIR or
                          ~/.evitalab/evita-data-source (source mode).
    --debug [port]        Publish a JDWP agent on <port> (default: 8005).
    --tag <tag>           Image tag (default: canary = evitaDB `dev` branch).
                          In source mode this is only the JVM/entrypoint base.
    --host <host>         Host to probe for readiness.
                          Default: derived from DOCKER_HOST (tcp://<host>:...)
                          or "localhost" for a native host / Unix socket.
    --wait <seconds>      Readiness timeout (default: 120).

Container:
    Name:  evitalab-dev-evitadb
    Image: index.docker.io/evitadb/evitadb:<tag> (default `canary`)
    Port:  5555 (all APIs multiplexed)
    Data:  host data directory -> /evita/data in container
EOF
}

log() { printf '[evitadb-server] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

require_docker() {
    command -v docker >/dev/null 2>&1 || die "docker is not on PATH"
}

# stat(1) is not portable: GNU uses -c, BSD/macOS uses -f.
file_size() {
    stat -c %s "$1" 2>/dev/null || stat -f %z "$1"
}

file_mtime() {
    stat -c %Y "$1" 2>/dev/null || stat -f %m "$1"
}

# Fills the global DEBUG_ARGS array with the JDWP port publishing and JVM agent
# options when debugging is requested; empties it otherwise.
DEBUG_ARGS=()
build_debug_args() {
    local debug="$1"
    local debug_port="$2"
    DEBUG_ARGS=()
    [ "$debug" = "1" ] || return 0
    DEBUG_ARGS=(
        -p "${debug_port}:${DEFAULT_DEBUG_PORT}"
        -e "EVITA_JAVA_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:${DEFAULT_DEBUG_PORT}"
    )
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

container_label() {
    docker inspect --format "{{index .Config.Labels \"$1\"}}" "$CONTAINER_NAME" 2>/dev/null || true
}

# Mode of the existing container. Containers created before labels existed are
# reported as `image` so they stay usable.
container_mode() {
    local mode
    mode="$(container_label "$LABEL_MODE")"
    case "$mode" in
        source) echo "source" ;;
        *) echo "image" ;;
    esac
}

resolve_repo() {
    local repo="$1"
    [ -n "$repo" ] || repo="$DEFAULT_REPO"
    [ -d "$repo" ] || die "evitaDB source tree not found: $repo (use --repo <path> or \$EVITADB_REPO)"
    repo="$(cd "$repo" && pwd)"
    [ -f "$repo/evita_server/pom.xml" ] \
        || die "Not an evitaDB source tree (no evita_server/pom.xml): $repo"
    echo "$repo"
}

source_jar_path() {
    echo "$1/$SOURCE_JAR_REL"
}

# True when any evitaDB source or POM is newer than the built jar. The jar is
# then known to predate the working tree.
sources_newer_than_jar() {
    local repo="$1"
    local jar="$2"
    local hit
    hit="$(find "$repo/pom.xml" "$repo"/evita_*/pom.xml -newer "$jar" -print -quit 2>/dev/null || true)"
    [ -n "$hit" ] && return 0
    hit="$(find "$repo"/evita_*/src -newer "$jar" -print -quit 2>/dev/null || true)"
    [ -n "$hit" ]
}

# Bind-mounting a path the daemon cannot see silently yields an empty directory
# in the container, which then fails in a confusing way. Prove the daemon reads
# the same bytes we do.
probe_jar_visible_to_daemon() {
    local jar="$1"
    local image="$2"
    local local_size remote_size
    local_size="$(file_size "$jar")"
    remote_size="$(docker run --rm --entrypoint stat -v "${jar}:/probe.jar:ro" "$image" \
        -c %s /probe.jar 2>/dev/null | tr -d '\r' || true)"
    if [ "$remote_size" != "$local_size" ]; then
        die "The Docker daemon does not see the built jar ($jar: ${local_size} bytes locally, '${remote_size:-<none>}' as seen by the daemon).
The daemon does not share this filesystem, so the jar cannot be bind-mounted.
Workaround: build a thin image instead - a Dockerfile with
  FROM ${image}
  COPY evita-server.jar /evita/bin/
using the jar as the only build context, and run that image by name."
    fi
}

build_from_source() {
    local repo="$1"
    command -v mvn >/dev/null 2>&1 || die "mvn is not on PATH, so the evitaDB jar cannot be built.
Install Maven (JDK 17+ required), or build the jar yourself and re-run with --no-build:
  ( cd '$repo' && mvn -DskipTests -DroaringBitmap.skipTests=true -pl evita_server -am package )"
    log "Building evitaDB from source in $repo (mvn -DskipTests -DroaringBitmap.skipTests=true -pl evita_server -am package) ..."
    log "Takes under a minute with a warm ~/.m2, several minutes on the first ever build."
    ( cd "$repo" && mvn -DskipTests -DroaringBitmap.skipTests=true -pl evita_server -am package ) \
        || die "Maven build failed: ( cd '$repo' && mvn -DskipTests -DroaringBitmap.skipTests=true -pl evita_server -am package )"
    log "Build finished."
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
    local mode="image"
    local repo=""
    local no_build=0
    local data_dir=""
    local debug=0
    local debug_port="$DEFAULT_DEBUG_PORT"
    local force_recreate=0
    local tag="$DEFAULT_TAG"
    local host="$DEFAULT_HOST"
    local wait_seconds="$DEFAULT_WAIT"
    while [ $# -gt 0 ]; do
        case "$1" in
            --source) mode="source"; shift ;;
            --repo) repo="$2"; mode="source"; shift 2 ;;
            --no-build) no_build=1; mode="source"; shift ;;
            --data-dir) data_dir="$2"; shift 2 ;;
            --debug)
                debug=1; shift
                if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then
                    debug_port="$1"; shift
                fi
                ;;
            --force-recreate) force_recreate=1; shift ;;
            --tag) tag="$2"; shift 2 ;;
            --host) host="$2"; shift 2 ;;
            --wait) wait_seconds="$2"; shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done

    require_docker

    if container_running; then
        local running_mode
        running_mode="$(container_mode)"
        if [ "$running_mode" != "$mode" ]; then
            die "Container ${CONTAINER_NAME} is already running in '${running_mode}' mode, requested '${mode}'. Run: $0 stop"
        fi
    fi

    if [ "$mode" = "source" ]; then
        cmd_start_source "$repo" "$no_build" "$data_dir" "$debug" "$debug_port" \
            "$force_recreate" "$tag" "$host" "$wait_seconds"
        return 0
    fi

    [ -n "$data_dir" ] || data_dir="$DATA_HOST_DIR"
    if [ ! -d "$data_dir" ]; then
        die "Data directory not found on host: $data_dir"
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

    local run_args=(
        --name "$CONTAINER_NAME"
        --label "${LABEL_MODE}=image"
        -p "${API_PORT}:${API_PORT}"
        -v "${data_dir}:/evita/data"
        -e "EVITA_ARGS=$EVITA_ARGS_BASE"
    )
    build_debug_args "$debug" "$debug_port"

    log "Starting container ${CONTAINER_NAME} (image: ${IMAGE}:${tag}) ..."
    docker run -d "${run_args[@]}" ${DEBUG_ARGS[@]+"${DEBUG_ARGS[@]}"} \
        "${IMAGE}:${tag}" >/dev/null

    wait_for_ready "$host" "$wait_seconds"
    log "Started. Reachable at http://${host}:${API_PORT}"
    [ "$debug" = "1" ] && log "JDWP listening on ${host}:${debug_port}."
    return 0
}

# Source mode: build the jar, then run it inside the published image with the
# jar bind-mounted over the one the image ships.
cmd_start_source() {
    local repo="$1"
    local no_build="$2"
    local data_dir="$3"
    local debug="$4"
    local debug_port="$5"
    local force_recreate="$6"
    local tag="$7"
    local host="$8"
    local wait_seconds="$9"

    repo="$(resolve_repo "$repo")"
    local jar
    jar="$(source_jar_path "$repo")"

    if [ "$no_build" = "1" ]; then
        log "Skipping the Maven build (--no-build); using the jar in evita_server/target/."
    else
        build_from_source "$repo"
    fi

    if [ ! -f "$jar" ]; then
        if [ "$no_build" = "1" ]; then
            die "Jar not found: $jar - drop --no-build so the script builds it."
        fi
        die "Maven succeeded but the jar is missing: $jar"
    fi

    if sources_newer_than_jar "$repo" "$jar"; then
        log "WARNING: evitaDB sources are newer than $jar - the server will run older code."
        [ "$no_build" = "1" ] && log "         Drop --no-build to rebuild it."
    fi

    [ -n "$data_dir" ] || data_dir="$DEFAULT_SOURCE_DATA_DIR"
    mkdir -p "$data_dir"
    data_dir="$(cd "$data_dir" && pwd)"

    log "Pulling base image ${IMAGE}:${tag} (JVM + entrypoint only) ..."
    docker pull "${IMAGE}:${tag}" >/dev/null

    # Runs before any container is touched: a jar the daemon cannot read must
    # not cost the caller a working container.
    probe_jar_visible_to_daemon "$jar" "${IMAGE}:${tag}"

    local jar_mtime
    jar_mtime="$(file_mtime "$jar")"
    local wanted_debug_port=""
    [ "$debug" = "1" ] && wanted_debug_port="$debug_port"

    if container_running; then
        if [ "$force_recreate" = "1" ]; then
            log "Recreating the running container (rebuild requested) ..."
        elif [ "$(container_label "$LABEL_DEBUG_PORT")" != "$wanted_debug_port" ]; then
            log "The requested debug configuration differs - recreating the container ..."
        elif [ "$(container_label "$LABEL_JAR_MTIME")" = "$jar_mtime" ] \
            && [ "$(container_label "$LABEL_JAR_PATH")" = "$jar" ]; then
            log "Container already running with the current jar. Waiting for readiness..."
            wait_for_ready "$host" "$wait_seconds"
            return 0
        else
            # A bind-mounted file pins its inode: Maven writes a new jar, so the
            # running container keeps serving the old one until it is recreated.
            log "The jar changed since the container started - recreating it ..."
        fi
    fi

    if container_exists; then
        docker rm -f "$CONTAINER_NAME" >/dev/null
    fi

    local run_args=(
        --name "$CONTAINER_NAME"
        --label "${LABEL_MODE}=source"
        --label "${LABEL_JAR_MTIME}=${jar_mtime}"
        --label "${LABEL_JAR_PATH}=${jar}"
        --label "${LABEL_DEBUG_PORT}=${wanted_debug_port}"
        -p "${API_PORT}:${API_PORT}"
        -v "${jar}:${CONTAINER_JAR_PATH}:ro"
        -v "${data_dir}:/evita/data"
        -e "EVITA_ARGS=${EVITA_ARGS_BASE} api.endpoints.gRPC.exposeDocsService=true"
    )
    build_debug_args "$debug" "$debug_port"

    log "Starting container ${CONTAINER_NAME} (source jar: ${jar}) ..."
    docker run -d "${run_args[@]}" ${DEBUG_ARGS[@]+"${DEBUG_ARGS[@]}"} \
        "${IMAGE}:${tag}" >/dev/null

    wait_for_ready "$host" "$wait_seconds"
    log "Started. Reachable at http://${host}:${API_PORT} (data: ${data_dir})"
    [ "$debug" = "1" ] && log "JDWP listening on ${host}:${debug_port}."
    return 0
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

cmd_rebuild() {
    local arg
    for arg in "$@"; do
        [ "$arg" = "--no-build" ] && die "rebuild always builds; use 'start --source --no-build' to skip the build."
    done
    cmd_start --source --force-recreate "$@"
}

cmd_build() {
    local repo=""
    while [ $# -gt 0 ]; do
        case "$1" in
            --repo) repo="$2"; shift 2 ;;
            -h|--help) usage; exit 0 ;;
            *) die "Unknown option: $1" ;;
        esac
    done
    repo="$(resolve_repo "$repo")"
    build_from_source "$repo"
    log "Jar: $(source_jar_path "$repo")"
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
    local mode
    mode="$(container_mode)"
    echo "mode: $mode"
    echo "image: $(container_image_tag)"
    if [ "$mode" = "source" ]; then
        local jar recorded current
        jar="$(container_label "$LABEL_JAR_PATH")"
        recorded="$(container_label "$LABEL_JAR_MTIME")"
        echo "jar: ${jar:-<unknown>}"
        echo "jar-mtime (container): ${recorded:-<unknown>}"
        if [ -n "$jar" ] && [ -f "$jar" ]; then
            current="$(file_mtime "$jar")"
            echo "jar-mtime (current):   ${current}"
            if [ "$current" != "$recorded" ]; then
                echo "jar: STALE (container is running an older jar - run 'rebuild')"
            fi
            local repo="${jar%/$SOURCE_JAR_REL}"
            if [ -d "$repo" ] && sources_newer_than_jar "$repo" "$jar"; then
                echo "sources: NEWER THAN JAR (the running server predates your source edits)"
            fi
        else
            echo "jar-mtime (current):   <jar missing>"
        fi
    fi
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
        rebuild) cmd_rebuild "$@" ;;
        build)   cmd_build "$@" ;;
        status)  cmd_status "$@" ;;
        logs)    cmd_logs "$@" ;;
        pull)    cmd_pull "$@" ;;
        -h|--help|help) usage ;;
        *) usage; exit 1 ;;
    esac
}

main "$@"
