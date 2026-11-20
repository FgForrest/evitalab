import type { SyntaxNode, Tree } from '@lezer/common'
import { evitaQLQueryLanguage } from '@lukashornych/codemirror-lang-evitaql'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'

const queryNodeName: string = 'Query'
const queryBodyNodeName: string = 'QueryBody'
const constraintBodyNodeName: string = 'ConstraintBody'
const constraintNodeNames: string[] = ['RootConstraint', 'Constraint']
const argsOpeningNodeName: string = 'ArgsOpening'
const argsClosingNodeName: string = 'ArgsClosing'
const commentNodeName: string = 'Comment'

const requireConstraintName: string = 'require'
const queryTelemetryConstraintName: string = 'queryTelemetry'
const queryTelemetryConstraint: string = 'queryTelemetry(PLAN)'

/**
 * Adds the `queryTelemetry(PLAN)` requirement to an evitaQL query so that the server returns the query telemetry
 * including the formula plans.
 *
 * The requirement is spliced into the original text right after the last argument of the target constraint, so
 * the user's formatting and comments survive:
 *
 * - an existing `require(...)` gets `, queryTelemetry(PLAN)` (an empty `require()` gets it without the comma),
 * - a query without `require` gets `, require(queryTelemetry(PLAN))`,
 * - a query already requesting `queryTelemetry` is returned unchanged.
 *
 * @param query evitaQL query as written by the user
 * @return query requesting the telemetry
 * @throws QueryTelemetryInjectionError when the query cannot be parsed or contains no query
 */
export function injectQueryTelemetry(query: string): string {
    const tree: Tree = evitaQLQueryLanguage.parser.parse(query)
    if (containsErrorNode(tree)) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the query is not a valid evitaQL query'
        )
    }

    const queryNode: SyntaxNode | null = tree.topNode.getChild(queryNodeName)
    const queryBody: SyntaxNode | null = queryNode?.getChild(queryBodyNodeName) ?? null
    if (queryBody == undefined) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the document contains no evitaQL query'
        )
    }

    const requireConstraint: SyntaxNode | undefined = argumentsOf(queryBody)
        .find(arg => constraintNameOf(arg, query) === requireConstraintName)
    if (requireConstraint == undefined) {
        return insertArgument(query, queryBody, `require(${queryTelemetryConstraint})`)
    }

    const requireBody: SyntaxNode | null = requireConstraint.getChild(constraintBodyNodeName)
    if (requireBody == undefined) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the require constraint has no argument list'
        )
    }
    const telemetryRequested: boolean = argumentsOf(requireBody)
        .some(arg => constraintNameOf(arg, query) === queryTelemetryConstraintName)
    if (telemetryRequested) {
        return query
    }
    return insertArgument(query, requireBody, queryTelemetryConstraint)
}

/**
 * Inserts a new last argument into an argument list (`QueryBody` or `ConstraintBody`). The argument is placed right
 * after the current last argument, i.e. before any trailing comment, or right after the opening parenthesis of an
 * empty list.
 */
function insertArgument(source: string, body: SyntaxNode, argument: string): string {
    const args: SyntaxNode[] = argumentsOf(body)
    const lastArgument: SyntaxNode | undefined = args[args.length - 1]
    if (lastArgument != undefined) {
        return splice(source, lastArgument.to, ', ' + argument)
    }

    const opening: SyntaxNode | null = body.getChild(argsOpeningNodeName)
    if (opening == undefined) {
        throw new QueryTelemetryInjectionError(
            QueryTelemetryInjectionFailureReason.Unparseable,
            'the argument list has no opening parenthesis'
        )
    }
    return splice(source, opening.to, argument)
}

function splice(source: string, position: number, insertion: string): string {
    return source.slice(0, position) + insertion + source.slice(position)
}

/**
 * Returns the arguments of an argument list, without the parentheses and comments.
 */
function argumentsOf(body: SyntaxNode): SyntaxNode[] {
    const args: SyntaxNode[] = []
    for (let child: SyntaxNode | null = body.firstChild; child != undefined; child = child.nextSibling) {
        if (child.name !== argsOpeningNodeName && child.name !== argsClosingNodeName && child.name !== commentNodeName) {
            args.push(child)
        }
    }
    return args
}

/**
 * Returns the name of a constraint node (the text in front of its first child), or `undefined` for any other node.
 */
function constraintNameOf(node: SyntaxNode, source: string): string | undefined {
    if (!constraintNodeNames.includes(node.name)) {
        return undefined
    }
    // comments between the name and the argument list are children of the constraint as well
    const firstChild: SyntaxNode | null = node.firstChild
    return source.slice(node.from, firstChild != undefined ? firstChild.from : node.to).trim()
}

function containsErrorNode(tree: Tree): boolean {
    const cursor = tree.cursor()
    do {
        if (cursor.type.isError) {
            return true
        }
    } while (cursor.next())
    return false
}
