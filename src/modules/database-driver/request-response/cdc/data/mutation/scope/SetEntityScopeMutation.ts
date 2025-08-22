import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

export class SetEntityScopeMutation {
    readonly scope: EntityScope

    constructor(scope: EntityScope) {
        this.scope = scope;
    }
}
