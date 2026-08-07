import type { SyntaxNode, Tree } from '@lezer/common'
import { evitaQLQueryLanguage } from '@lukashornych/codemirror-lang-evitaql'
import { DocumentFormattingError } from '@/modules/code-editor/exception/DocumentFormattingError'

/**
 * Indentation of a single nesting level. Matches CodeMirror's default `indentUnit` so that typing in a
 * prettified query keeps the same rhythm as the printer produced.
 */
const indentUnit: string = '  '

const queryNodeName: string = 'Query'
const bodyNodeNames: string[] = ['QueryBody', 'ConstraintBody']
const constraintNodeNames: string[] = ['RootConstraint', 'Constraint']
const argsDelimiterNodeNames: string[] = ['ArgsOpening', 'ArgsClosing']
const commentNodeName: string = 'Comment'
const rangeNodeName: string = 'Range'

const whitespaceRunPattern: RegExp = /\s+/g

/**
 * Reformats an evitaQL query into an indented multiline form. Constraints containing other constraints
 * are broken one argument per line, leaf constraints stay on a single line, and `//` comments are kept
 * on lines of their own.
 *
 * @param source evitaQL query to format
 * @throws DocumentFormattingError when the query cannot be parsed
 */
export function prettifyEvitaQL(source: string): string {
    return formatEvitaQL(source, true)
}

/**
 * Reformats an evitaQL query into a single line without any redundant whitespace. Comments are dropped,
 * because a `//` comment cannot survive the collapse without commenting out the rest of the query.
 *
 * @param source evitaQL query to format
 * @throws DocumentFormattingError when the query cannot be parsed
 */
export function minifyEvitaQL(source: string): string {
    return formatEvitaQL(source, false)
}

function formatEvitaQL(source: string, pretty: boolean): string {
    const tree: Tree = evitaQLQueryLanguage.parser.parse(source)
    if (containsErrorNode(tree)) {
        throw new DocumentFormattingError('the query is not a valid evitaQL query')
    }

    const request: SyntaxNode = tree.topNode
    const query: SyntaxNode | null = request.getChild(queryNodeName)
    if (query == undefined) {
        // a comment-only or blank document parses without a query; formatting it would wipe the editor
        throw new DocumentFormattingError('the document contains no evitaQL query')
    }

    const parts: string[] = []
    for (const child of childrenOf(request)) {
        if (child.name === commentNodeName) {
            if (pretty) {
                parts.push(printComment(child, source))
            }
        } else {
            parts.push(printConstraint(child, source, '', pretty))
        }
    }
    return parts.join('\n')
}

/**
 * Prints a query or a constraint. Comments preceding the argument list are lifted onto separate lines
 * above it — they cannot stay next to the name without commenting out the arguments once the query is
 * collapsed.
 */
function printConstraint(node: SyntaxNode, source: string, indent: string, pretty: boolean): string {
    const children: SyntaxNode[] = childrenOf(node)
    const body: SyntaxNode | undefined = children.find(child => bodyNodeNames.includes(child.name))
    if (body == undefined) {
        return source.slice(node.from, node.to).trim()
    }

    const lines: string[] = []
    if (pretty) {
        children
            .filter(child => child.name === commentNodeName)
            .forEach(comment => lines.push(printComment(comment, source)))
    }

    const firstChild: SyntaxNode | undefined = children[0]
    const nameEnd: number = firstChild != undefined ? firstChild.from : body.from
    const name: string = source.slice(node.from, nameEnd).trim()
    lines.push(name + printArgs(body, source, indent, pretty))

    return lines.join('\n' + indent)
}

function printArgs(body: SyntaxNode, source: string, indent: string, pretty: boolean): string {
    const args: SyntaxNode[] = childrenOf(body)
        .filter(child => !argsDelimiterNodeNames.includes(child.name))
        .filter(child => pretty || child.name !== commentNodeName)
    if (args.length === 0) {
        return '()'
    }

    const breakArgs: boolean = pretty && args.some(arg => isConstraint(arg) || arg.name === commentNodeName)
    if (!breakArgs) {
        return '(' + args.map(arg => printArg(arg, source, indent, pretty)).join(pretty ? ', ' : ',') + ')'
    }

    const argIndent: string = indent + indentUnit
    const lines: string[] = args.map((arg, index) => {
        const separator: string = arg.name !== commentNodeName && hasValueAfter(args, index) ? ',' : ''
        return argIndent + printArg(arg, source, argIndent, pretty) + separator
    })
    return '(\n' + lines.join('\n') + '\n' + indent + ')'
}

function printArg(node: SyntaxNode, source: string, indent: string, pretty: boolean): string {
    if (isConstraint(node)) {
        return printConstraint(node, source, indent, pretty)
    }
    if (node.name === commentNodeName) {
        return printComment(node, source)
    }
    if (node.name === rangeNodeName) {
        // a range never contains a string literal, so collapsing its whitespace cannot alter any value
        return source.slice(node.from, node.to).replace(whitespaceRunPattern, ' ')
    }
    return source.slice(node.from, node.to)
}

function printComment(node: SyntaxNode, source: string): string {
    return source.slice(node.from, node.to).trim()
}

/**
 * Tells whether any argument after the given position still needs a separator before it, i.e. whether
 * a trailing comma has to be emitted. Comments are not arguments and never carry one.
 */
function hasValueAfter(args: SyntaxNode[], index: number): boolean {
    return args
        .slice(index + 1)
        .some(arg => arg.name !== commentNodeName)
}

function isConstraint(node: SyntaxNode): boolean {
    return constraintNodeNames.includes(node.name)
}

function childrenOf(node: SyntaxNode): SyntaxNode[] {
    const children: SyntaxNode[] = []
    for (let child: SyntaxNode | null = node.firstChild; child != undefined; child = child.nextSibling) {
        children.push(child)
    }
    return children
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
