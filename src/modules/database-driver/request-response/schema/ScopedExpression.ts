import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * Pairs a scope with an optional expression. Reused for partial-faceted and partial-bucketed
 * reference schema configurations, where the expression narrows which entities participate in
 * faceting or histogram computation for that scope.
 */
export class ScopedExpression {
    readonly scope: EntityScope
    readonly expression: string | undefined

    constructor(scope: EntityScope, expression: string | undefined) {
        this.scope = scope
        this.expression = expression
    }
}
