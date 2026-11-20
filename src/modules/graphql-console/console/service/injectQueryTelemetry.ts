import {
    type DocumentNode,
    type FieldNode,
    Kind,
    type OperationDefinitionNode,
    parse,
    print,
    type SelectionNode,
    type SelectionSetNode,
    visit
} from 'graphql'
import { errorMessage } from '@/utils/error'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'

const queryFieldPrefix: string = 'query'
const extraResultsFieldName: string = 'extraResults'
const queryTelemetryFieldName: string = 'queryTelemetry'

/**
 * Complete selection of the query telemetry including the formula plans (selecting `plan` is what makes the server
 * compute them).
 */
const queryTelemetrySelection: string =
    'queryTelemetry { level operation start spentTime selfTime arguments stepsCount startedAt ' +
    'metrics { estimatedCardinality actualCardinality estimatedCost actualCost recordsReturned ioFetchCount ' +
    'ioFetchedSizeBytes prefetched } ' +
    'plan { level id refTo hash description estimatedCost actualCost resultCount childrenCount } }'

/**
 * Adds the query telemetry selection to a GraphQL document so that the server returns the query telemetry including
 * the formula plans.
 *
 * Every top-level field of every operation whose name starts with `query` (the catalog API's `query<EntityType>`
 * fields, which own `extraResults`) gets `queryTelemetry { … }` in its `extraResults` selection, which is added when
 * missing. Only selections under the response keys `extraResults` / `queryTelemetry` count, because that is where the
 * result visualiser looks for the data: an aliased `extraResults` is left alone and an unaliased one is added next to
 * it. A field already selecting `queryTelemetry` is left unchanged, fragments are not inspected. A modified document
 * is re-printed, so formatting and comments of the original are not preserved; a document that already selects the
 * telemetry everywhere is returned as written. Variables are untouched.
 *
 * @param query GraphQL document as written by the user
 * @return document requesting the telemetry
 * @throws QueryTelemetryInjectionError when the document cannot be parsed or contains no `query*` field
 */
export function injectQueryTelemetry(query: string): string {
    let document: DocumentNode
    try {
        document = parse(query)
    } catch (e) {
        throw new QueryTelemetryInjectionError(QueryTelemetryInjectionFailureReason.Unparseable, errorMessage(e))
    }

    let queryFieldFound: boolean = false
    let changed: boolean = false
    const injectedDocument: DocumentNode = visit(document, {
        OperationDefinition(operation: OperationDefinitionNode): OperationDefinitionNode {
            const selections: SelectionNode[] = operation.selectionSet.selections.map(selection => {
                if (!isQueryField(selection)) {
                    return selection
                }
                queryFieldFound = true
                const injectedField: FieldNode = injectIntoQueryField(selection)
                changed ||= injectedField !== selection
                return injectedField
            })
            return { ...operation, selectionSet: { ...operation.selectionSet, selections } }
        },
        // only top-level fields of operations are of interest
        FragmentDefinition: () => false
    })

    if (!queryFieldFound) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.NoTarget,
            'the document contains no query* field'
        )
    }
    // printing drops comments and formatting, so a document that needs nothing is returned as written
    return changed ? print(injectedDocument) : query
}

function isQueryField(selection: SelectionNode): selection is FieldNode {
    return selection.kind === Kind.FIELD && selection.name.value.startsWith(queryFieldPrefix)
}

function injectIntoQueryField(queryField: FieldNode): FieldNode {
    const selections: readonly SelectionNode[] = queryField.selectionSet?.selections ?? []
    const extraResultsIndex: number = selections.findIndex(selection =>
        isFieldWithResponseKey(selection, extraResultsFieldName))

    if (extraResultsIndex < 0) {
        return withSelections(queryField, [...selections, createExtraResultsField()])
    }

    const extraResults: FieldNode = selections[extraResultsIndex] as FieldNode
    const extraResultsSelections: readonly SelectionNode[] = extraResults.selectionSet?.selections ?? []
    if (extraResultsSelections.some(selection => isFieldWithResponseKey(selection, queryTelemetryFieldName))) {
        return queryField
    }

    const injectedExtraResults: FieldNode = withSelections(
        extraResults,
        [...extraResultsSelections, createQueryTelemetryField()]
    )
    return withSelections(queryField, selections.map((selection, index) =>
        index === extraResultsIndex ? injectedExtraResults : selection))
}

/**
 * Whether the selection is the field of the given name that also appears under that name in the response
 * (i.e. not renamed by an alias).
 */
function isFieldWithResponseKey(selection: SelectionNode, fieldName: string): selection is FieldNode {
    return selection.kind === Kind.FIELD &&
        selection.name.value === fieldName &&
        (selection.alias == undefined || selection.alias.value === fieldName)
}

function withSelections(field: FieldNode, selections: readonly SelectionNode[]): FieldNode {
    const selectionSet: SelectionSetNode = { kind: Kind.SELECTION_SET, selections }
    return { ...field, selectionSet }
}

function createExtraResultsField(): FieldNode {
    return parseField(`${extraResultsFieldName} { ${queryTelemetrySelection} }`)
}

function createQueryTelemetryField(): FieldNode {
    return parseField(queryTelemetrySelection)
}

function parseField(selection: string): FieldNode {
    const operation = parse(`{ ${selection} }`, { noLocation: true }).definitions[0] as OperationDefinitionNode
    return operation.selectionSet.selections[0] as FieldNode
}
