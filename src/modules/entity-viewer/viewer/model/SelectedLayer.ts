import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SelectedLayer {
    readonly scope: EntityScope
    readonly value: boolean
    constructor(scope: EntityScope, value: boolean) {
        this.scope = scope
        this.value = value
    }
}
