import type { VisualisedFormulaPlanNode } from './VisualisedFormulaPlanNode'

/**
 * Kind of a view inside the query telemetry visualiser.
 */
export enum TelemetryTabKind {
    Overview = 'overview',
    Steps = 'steps',
    Plan = 'plan',
    Group = 'group'
}

/**
 * One open tab of the query telemetry visualiser. Its identity is `(kind, stepId)`, plus the group key for a Group
 * tab: opening the same identity again activates the existing tab instead of adding a duplicate.
 */
export class TelemetryTab {
    readonly kind: TelemetryTabKind
    /**
     * Step the tab is rooted at (Steps) or whose plan it shows (Plan, Group); `undefined` for the Overview.
     */
    readonly stepId: string | undefined
    /**
     * Group of similar formulas whose members a Group tab lists; captured when the tab is opened, so the tab does not
     * depend on how the plan is currently filtered.
     */
    readonly group: VisualisedFormulaPlanNode | undefined

    constructor(kind: TelemetryTabKind, stepId: string | undefined, group?: VisualisedFormulaPlanNode) {
        this.kind = kind
        this.stepId = stepId
        this.group = group
    }

    static overview(): TelemetryTab {
        return new TelemetryTab(TelemetryTabKind.Overview, undefined)
    }

    /**
     * String form of the identity, used as the `VTab` value.
     */
    get key(): string {
        const base: string = `${this.kind}:${this.stepId ?? ''}`
        return this.group == undefined ? base : `${base}:${this.group.key}`
    }

    get closable(): boolean {
        return this.kind !== TelemetryTabKind.Overview
    }
}
