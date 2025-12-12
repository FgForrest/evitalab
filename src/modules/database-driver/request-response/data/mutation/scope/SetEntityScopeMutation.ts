import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'

export class SetEntityScopeMutation implements LocalMutation{
    static readonly TYPE = 'setEntityScopeMutation' as const

    readonly scope: EntityScope

    constructor(scope: EntityScope) {
        this.scope = scope;
    }
}
