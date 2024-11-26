import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'

import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'

/**
 * Defines workspace path of a primary user-worked on system resource.
 */
export class SystemSubjectPath extends SubjectPath {

    constructor(items: SubjectPathItem[]) {
        super([
            SubjectPathItem.significant('mdi-cog', 'evitaLab'),
            ...items
        ])
    }
}
