import {
    type ArgumentNode,
    type DirectiveNode,
    type DocumentNode,
    type FieldNode,
    Kind,
    parse,
    print,
    stripIgnoredCharacters,
    type ValueNode,
    visit
} from 'graphql'
import { errorMessage } from '@/utils/error'
import { DocumentFormattingError } from '@/modules/code-editor/exception/DocumentFormattingError'

/**
 * Reformats a GraphQL document into the canonical indented form of the reference GraphQL printer.
 *
 * The printer works on the parsed document, which carries no comments, so `#` comments are lost and an
 * explicitly named `query { … }` operation is rewritten into the shorthand `{ … }` form.
 *
 * Unlike the reference printer, input object values (and lists holding objects or lists) in arguments are
 * expanded one field per line, and arguments of such a field or directive are then each placed on a line
 * of their own.
 *
 * @param source GraphQL document to format
 * @throws DocumentFormattingError when the document cannot be parsed
 */
export function prettifyGraphQL(source: string): string {
    try {
        return print(expandArgumentValues(parse(source)))
    } catch (e) {
        throw new DocumentFormattingError(errorMessage(e))
    }
}

/**
 * Strips all insignificant characters (whitespace, commas, comments) from a GraphQL document.
 *
 * @param source GraphQL document to format
 * @throws DocumentFormattingError when the document cannot be tokenized or carries no operation at all
 */
export function minifyGraphQL(source: string): string {
    let minified: string
    try {
        minified = stripIgnoredCharacters(source)
    } catch (e) {
        throw new DocumentFormattingError(errorMessage(e))
    }
    if (minified.length === 0) {
        // a comment-only or blank document strips down to nothing; formatting it would wipe the editor
        throw new DocumentFormattingError('the document contains no GraphQL operation')
    }
    return minified
}

/**
 * Pre-renders arguments of fields and directives holding input objects into a multiline form. The reference
 * printer has no hook for value formatting, so the rendered argument list is folded into the node's name
 * (which is printed verbatim) and the arguments themselves are removed. The enclosing selection set
 * indents the embedded line breaks as usual.
 */
function expandArgumentValues(document: DocumentNode): DocumentNode {
    return visit(document, {
        Field: { leave: (node: FieldNode) => expandArguments(node) },
        Directive: { leave: (node: DirectiveNode) => expandArguments(node) }
    })
}

function expandArguments<N extends FieldNode | DirectiveNode>(node: N): N {
    const args: readonly ArgumentNode[] = node.arguments ?? []
    const printedArgs: string[] = args.map(arg => `${arg.name.value}: ${printValue(arg.value)}`)
    if (!printedArgs.some(printedArg => printedArg.includes('\n'))) {
        return node
    }
    return {
        ...node,
        name: { ...node.name, value: `${node.name.value}(\n${indent(printedArgs.join('\n'))}\n)` },
        arguments: []
    }
}

function printValue(value: ValueNode): string {
    if (value.kind === Kind.OBJECT && value.fields.length > 0) {
        const fields: string = value.fields
            .map(field => `${field.name.value}: ${printValue(field.value)}`)
            .join('\n')
        return `{\n${indent(fields)}\n}`
    }
    if (value.kind === Kind.LIST && value.values.some(item => item.kind === Kind.OBJECT || item.kind === Kind.LIST)) {
        return `[\n${indent(value.values.map(printValue).join('\n'))}\n]`
    }
    return print(value)
}

function indent(text: string): string {
    return '  ' + text.replaceAll('\n', '\n  ')
}
