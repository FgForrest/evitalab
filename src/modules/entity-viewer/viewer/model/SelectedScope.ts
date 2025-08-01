import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * This class contains scope (Live, Archive) and value that represents is checked
 */
export class SelectedScope {
    readonly scope: EntityScope
    readonly value: boolean
    constructor(scope: EntityScope, value: boolean) {
        this.scope = scope
        this.value = value
    }
}
