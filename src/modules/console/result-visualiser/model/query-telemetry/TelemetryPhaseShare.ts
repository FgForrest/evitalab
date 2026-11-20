import { TelemetryPhaseGroup } from './TelemetryPhaseGroup'

/**
 * One segment of the phase share bar: how much of the whole query one phase group took. The
 * {@link TelemetryPhaseGroup.Root} segment is the root's time not covered by any of the other three.
 */
export class TelemetryPhaseShare {
    readonly group: TelemetryPhaseGroup
    /**
     * Nanoseconds attributed to the group.
     */
    readonly nanos: number
    /**
     * `nanos` relative to the query total, `0` … `1`.
     */
    readonly share: number

    constructor(group: TelemetryPhaseGroup, nanos: number, share: number) {
        this.group = group
        this.nanos = nanos
        this.share = share
    }
}
