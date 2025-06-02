import Immutable from 'immutable'

/**
 * Label associated with the query / source query.
 */
export class Label {
    readonly name: string
    readonly value?: string

    constructor(name: string, value: string | undefined) {
        this.name = name
        this.value = value
    }
}

export const labelSourceQuery: string = 'source-query'
export const labelSourceType: string = 'source-type'

export const labelGraphQlOperationName: string = "graphql-operation-name"

export const graphQlSourceTypeLabelValue: string = 'GraphQL'

/**
 * Labels that shouldn't be visualised because they are useful only for the evitaLab
 * or evitaDB internally
 */
export const systemLabels: Immutable.List<string> = Immutable.List([labelSourceQuery])
