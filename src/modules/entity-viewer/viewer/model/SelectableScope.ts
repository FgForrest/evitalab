import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * An entity scope (Live, Archive) the user can tick in the scope selector, together with whether it is ticked.
 * The ticked scopes are the ones the entity viewer queries.
 */
export class SelectableScope {
    readonly scope: EntityScope
    readonly selected: boolean

    constructor(scope: EntityScope, selected: boolean) {
        this.scope = scope
        this.selected = selected
    }
}
