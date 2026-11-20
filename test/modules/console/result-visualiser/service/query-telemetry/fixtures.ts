import { List } from 'immutable'
import {
    GraphQLQueryTelemetryResultParser
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLQueryTelemetryResultParser'
import {
    ParsedQueryTelemetry,
    type QueryTelemetryParseResult
} from '@/modules/console/result-visualiser/model/query-telemetry/QueryTelemetryParseResult'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import q3 from '../../../../graphql-console/console/result-visualiser/service/fixture/query-telemetry-q3.json'
import q4 from '../../../../graphql-console/console/result-visualiser/service/fixture/query-telemetry-q4.json'
import q6 from '../../../../graphql-console/console/result-visualiser/service/fixture/query-telemetry-q6.json'
import r3 from '../../../../graphql-console/console/result-visualiser/service/fixture/query-telemetry-r3.json'

/**
 * Real evitaDB payloads shared with the GraphQL parser test (q3 nested alternative without plan, q4 nested
 * alternative with plan and an ineligible candidate, q6 empty result, r3 `refTo` and no `hash`), parsed through the
 * GraphQL parser, plus synthetic telemetry built in code.
 */
const parser: GraphQLQueryTelemetryResultParser = new GraphQLQueryTelemetryResultParser()

function parse(fixture: { data: { queryProduct: unknown } }): ParsedQueryTelemetry {
    const result: QueryTelemetryParseResult | undefined = parser.parse(fixture.data.queryProduct)
    if (!(result instanceof ParsedQueryTelemetry)) {
        throw new Error('Fixture did not parse into a complete telemetry.')
    }
    return result
}

export const parsedQ3: ParsedQueryTelemetry = parse(q3)
export const parsedQ4: ParsedQueryTelemetry = parse(q4)
export const parsedQ6: ParsedQueryTelemetry = parse(q6)
export const parsedR3: ParsedQueryTelemetry = parse(r3)

export function step(operation: QueryPhase,
                     start: number,
                     spent: number,
                     steps: QueryTelemetry[] = [],
                     args: string[] = [],
                     plan?: FormulaPlan): QueryTelemetry {
    const childrenSpent: number = steps.reduce((sum, it) => sum + Number(it.spentTime), 0)
    return new QueryTelemetry(
        operation,
        BigInt(start),
        BigInt(spent),
        BigInt(spent - childrenSpent),
        List(args),
        undefined,
        undefined,
        plan,
        List(steps)
    )
}

export function formula(id: number,
                        description: string | undefined,
                        children: FormulaPlan[] = [],
                        options: { refTo?: number, hash?: bigint, est?: bigint, act?: bigint, rows?: number } = {}): FormulaPlan {
    return new FormulaPlan(
        id,
        options.refTo,
        options.hash,
        description,
        options.est,
        options.act,
        options.rows,
        List(children)
    )
}
