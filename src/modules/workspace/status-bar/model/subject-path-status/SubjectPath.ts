import { List as ImmutableList } from 'immutable'

import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'

/**
 * Defines workspace path of a primary user-worked on resource.
 */
export class SubjectPath {
    readonly items: ImmutableList<SubjectPathItem>

    constructor(items: SubjectPathItem[]) {
        this.items = ImmutableList(items)
    }
}
