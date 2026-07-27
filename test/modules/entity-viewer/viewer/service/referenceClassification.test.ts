import { describe, test, expect } from 'vitest'
import { List, Map } from 'immutable'
import { EvitaQLQueryExecutor } from '../../../../../src/modules/entity-viewer/viewer/service/EvitaQLQueryExecutor'
import type { ReferenceClassification } from '../../../../../src/modules/entity-viewer/viewer/service/QueryExecutor'
import { ReferenceSchema } from '../../../../../src/modules/database-driver/request-response/schema/ReferenceSchema'
import { ReferenceAttributeSchema } from '../../../../../src/modules/database-driver/request-response/schema/ReferenceAttributeSchema'
import { AttributeSchema } from '../../../../../src/modules/database-driver/request-response/schema/AttributeSchema'
import { EntitySchema } from '../../../../../src/modules/database-driver/request-response/schema/EntitySchema'
import { EntityPropertyKey } from '../../../../../src/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { Cardinality } from '../../../../../src/modules/database-driver/request-response/schema/Cardinality'
import { NamingConvention } from '../../../../../src/modules/database-driver/request-response/NamingConvetion'
import { Scalar } from '../../../../../src/modules/database-driver/data-type/Scalar'

const nameVariants = Map<NamingConvention, string>()

function referenceAttribute(name: string, representative: boolean): ReferenceAttributeSchema {
    return new ReferenceAttributeSchema(
        name, nameVariants, undefined, undefined, Scalar.String, false, undefined, false, 0,
        representative, List(), List(), List()
    )
}

function referenceSchema(): ReferenceSchema {
    return new ReferenceSchema(
        'tags', nameVariants, undefined, undefined, 'Tag', true, nameVariants,
        undefined, undefined, undefined, Cardinality.ZeroOrMore,
        [
            referenceAttribute('gallery', true),   // representative
            referenceAttribute('priority', true),  // representative, not selected as a column
            referenceAttribute('note', false)      // not representative, selected as a column
        ],
        [], List(), List(), List(), List(), List()
    )
}

// buildReferenceClassifications is pure; the evitaClient is never touched by it
const executor = new EvitaQLQueryExecutor(undefined as never)

function classify(): Map<string, ReferenceClassification> | undefined {
    const entitySchema = { references: List([referenceSchema()]) } as unknown as EntitySchema
    const requiredData = [
        EntityPropertyKey.references('tags'),
        EntityPropertyKey.referenceAttributes('tags', 'note')
    ]
    return (executor as unknown as {
        buildReferenceClassifications(
            schema: EntitySchema,
            required: EntityPropertyKey[],
            responseName: (attribute: AttributeSchema) => string
        ): globalThis.Map<string, ReferenceClassification>
    }).buildReferenceClassifications(entitySchema, requiredData, attribute => attribute.name) as unknown as Map<string, ReferenceClassification>
}

describe('QueryExecutor.buildReferenceClassifications', () => {
    test('separates representative attributes from the selected column so implicit ones do not leak into columns', () => {
        const classifications = classify()!
        const classification = (classifications as unknown as globalThis.Map<string, ReferenceClassification>).get('tags')!

        // only the explicitly selected reference-attribute column becomes its own container
        expect(Array.from(classification.selectedColumnAttributeNames).sort()).toEqual(['note'])
        // the reference's own representative attributes are tracked separately for grouping/filtering
        expect(Array.from(classification.representativeAttributeNames).sort()).toEqual(['gallery', 'priority'])
        // the implicitly fetched representative attribute is NOT treated as a selected column
        expect(classification.selectedColumnAttributeNames.has('priority')).toBe(false)
        expect(classification.selectedColumnAttributeNames.has('gallery')).toBe(false)
    })
})
