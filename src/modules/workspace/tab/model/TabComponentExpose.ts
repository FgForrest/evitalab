import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'

/**
 * Defines what a tab component exposes as a public API.
 */
export interface TabComponentExpose {
    /**
     * Computes current path of resource the tab is pointing at.
     */
    path(): SubjectPath | undefined

    /**
     * Re-runs the tab component's initialization after it previously failed. When present, the
     * tab framework calls this instead of remounting the component on retry, preserving component
     * state. If absent, the framework falls back to remounting the component.
     */
    retry?(): void
}
