import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SystemSubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SystemSubjectPath'

const fallbackPath: SubjectPath = new SystemSubjectPath([])

/**
 * Holds user-resource paths
 */
export class SubjectPathStatus {

    _activatedPathId: string | undefined

    readonly availablePaths: Map<string, SubjectPath> = new Map()

    constructor() {
    }

    /**
     * Activate defined path, i.e. to be visible as the primary path.
     *
     * @param id path id to activate
     */
    activatePath(id: string): void {
        this._activatedPathId = id
    }

    /**
     * Deactivates previously activated path to not be visible anymore
     */
    deactivatePath(): void {
        this._activatedPathId = undefined
    }

    /**
     * Returns activated subject path, if any.
     */
    get activatedPath(): SubjectPath | undefined {
        if (this._activatedPathId == undefined) {
            return fallbackPath
        }
        const activatedPath: SubjectPath | undefined = this.availablePaths.get(this._activatedPathId)
        if (activatedPath == undefined) {
            return fallbackPath
        }
        return activatedPath
    }

    /**
     * Defines a new or updated subject path under specified id. Such path can be later
     * activated
     *
     * @param id path id
     * @param path new/updated path
     */
    definePath(id: string, path: SubjectPath): void {
        this.availablePaths.set(id, path)
    }

    /**
     * Deletes defined subject path if it is no longer needed
     *
     * @param id path id
     */
    deletePath(id: string): void {
        this.availablePaths.delete(id)
    }
}



