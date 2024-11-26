import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'

/**
 * Defines what a tab component exposes as a public API.
 */
export interface TabComponentExpose {
    /**
     * Computes current path of resource the tab is pointing at.
     */
    path(): SubjectPath | undefined
}
