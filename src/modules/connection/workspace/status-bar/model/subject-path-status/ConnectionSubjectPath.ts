import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'

import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Defines workspace path of a primary user-worked on remote resource.
 */
export class ConnectionSubjectPath extends SubjectPath {

    constructor(connection: Connection, items: SubjectPathItem[]) {
        super([
            SubjectPathItem.significant('mdi-connection', connection.name),
            ...items
        ])
    }
}
