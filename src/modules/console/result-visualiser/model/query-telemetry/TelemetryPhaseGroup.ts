import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'

/**
 * Coarse classification of a {@link QueryPhase} the telemetry visualiser colours by. The string values double as the
 * suffix of the `--telemetry-*` CSS custom properties and of the i18n keys of the phase legend.
 */
export enum TelemetryPhaseGroup {
    /**
     * The `OVERALL` root step; in the phase share it stands for the root's own, unattributed time.
     */
    Root = 'root',
    Planning = 'planning',
    Execution = 'execution',
    Fetching = 'fetching'
}

/**
 * Group of a phase by its name prefix: `OVERALL` is the root, `PLANNING*` planning, `FETCHING*` fetching and
 * everything else (`EXECUTION*`, `EXTRA_RESULT*`) execution. Only good for colouring a single step — phases of one
 * group nest inside another (planning of hierarchy statistics runs inside `EXECUTION`), so shares must never be
 * summed by group.
 */
export function telemetryPhaseGroupOf(phase: QueryPhase): TelemetryPhaseGroup {
    if (phase === QueryPhase.Overall) {
        return TelemetryPhaseGroup.Root
    }
    if (phase.startsWith('PLANNING')) {
        return TelemetryPhaseGroup.Planning
    }
    if (phase.startsWith('FETCHING')) {
        return TelemetryPhaseGroup.Fetching
    }
    return TelemetryPhaseGroup.Execution
}

/**
 * Phase name without its group prefix (`FETCHING_REFERENCES` → `REFERENCES`), as the flamegraph blocks and the step
 * cards show it. A phase that is nothing but its prefix (`PLANNING`, `OVERALL`) is returned unchanged.
 */
export function shortQueryPhaseName(phase: QueryPhase): string {
    if (phase === QueryPhase.Overall) {
        return phase
    }
    const short: string = phase.replace(/^(PLANNING|EXECUTION|FETCHING|EXTRA_RESULTS?)_?/, '')
    return short.length > 0 ? short : phase
}
