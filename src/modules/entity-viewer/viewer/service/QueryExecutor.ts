import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import { List } from 'immutable'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    ReferenceAttributeSchema
} from '@/modules/database-driver/request-response/schema/ReferenceAttributeSchema'

/**
 * Classifies the reference attributes of a single reference name present in a query response into those selected
 * as grid columns and those (implicitly) fetched because they are representative. Attribute names are expressed in
 * the naming used by the concrete response (camelCase for GraphQL, raw name for evitaQL).
 */
export type ReferenceClassification = {
    referenceSchema: ReferenceSchema
    /** Names of reference attributes the user selected as grid columns; only these become their own containers. */
    selectedColumnAttributeNames: Set<string>
    /** Names of the reference's own representative attributes; used to group and filter references. */
    representativeAttributeNames: Set<string>
}

/**
 * Executes query against evitaDB server in language defined by implementation.
 */
export abstract class QueryExecutor {

    /**
     * Executes a query against evitaDB server in language defined by implementation and returns formatted data.
     *
     * @param dataPointer points to a collection where to fetch data from
     * @param query pre-built query to execute in language defined by implementation
     * @param requiredData the entity properties requested by the grid; used to tell selected reference-attribute
     *        columns apart from implicitly fetched representative reference attributes
     */
    abstract executeQuery(dataPointer: EntityViewerDataPointer, query: string, requiredData: EntityPropertyKey[]): Promise<QueryResult>

    /**
     * Builds a per-reference classification of the requested reference attributes. The `responseName` callback maps
     * an attribute schema to the name under which the attribute appears in the concrete query response.
     */
    protected buildReferenceClassifications(
        entitySchema: EntitySchema,
        requiredData: EntityPropertyKey[],
        responseName: (attribute: AttributeSchema) => string
    ): Map<string, ReferenceClassification> {
        const classifications: Map<string, ReferenceClassification> = new Map<string, ReferenceClassification>()

        const referenceNames: Set<string> = new Set<string>()
        for (const key of requiredData) {
            if (key.type === EntityPropertyType.References) {
                referenceNames.add(key.names[0]!)
            } else if (key.type === EntityPropertyType.ReferenceAttributes) {
                const referenceName: string | undefined = key.names[0]
                if (referenceName != undefined) {
                    referenceNames.add(referenceName)
                }
            }
        }

        for (const referenceName of referenceNames) {
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                .find(schema => schema.name === referenceName)
            if (referenceSchema == undefined) {
                continue
            }

            const selectedColumnAttributeNames: Set<string> = new Set<string>()
            for (const key of requiredData) {
                if (key.type === EntityPropertyType.ReferenceAttributes && key.names[0] === referenceName) {
                    const attributeSchema: AttributeSchema | undefined = referenceSchema.attributes
                        .find(schema => schema.name === key.names[1])
                    if (attributeSchema != undefined) {
                        selectedColumnAttributeNames.add(responseName(attributeSchema))
                    }
                }
            }

            const representativeAttributeNames: Set<string> = new Set<string>()
            for (const attributeSchema of referenceSchema.attributes.values()) {
                if (attributeSchema instanceof ReferenceAttributeSchema && attributeSchema.representative) {
                    representativeAttributeNames.add(responseName(attributeSchema))
                }
            }

            classifications.set(referenceName, {
                referenceSchema,
                selectedColumnAttributeNames,
                representativeAttributeNames
            })
        }

        return classifications
    }

    /**
     * Ensures every selected reference name the entity carries no references of (its container is absent or empty)
     * renders as a "0 references" summary instead of a `null` cell, both in its references column and in each of its
     * selected reference-attribute columns. Without this the property key is missing from the flat entity (evitaQL
     * omits absent names; GraphQL returns the references column empty but still omits the attribute columns).
     * Reference names that do have references are left untouched, so partially populated attribute columns keep their
     * existing behaviour. Selected column names are taken verbatim from the classification, so the emitted keys mirror
     * the ones produced for non-empty references.
     */
    protected backfillEmptyReferenceContainers(
        flattenedReferences: WritableEntityProperty[],
        referenceClassifications: Map<string, ReferenceClassification>
    ): void {
        const emittedKeys: Set<string> = new Set<string>(
            flattenedReferences.map(([key]) => key.toString())
        )
        for (const [referenceName, classification] of referenceClassifications) {
            const referencesKey: EntityPropertyKey = EntityPropertyKey.references(referenceName)
            const existing: WritableEntityProperty | undefined = flattenedReferences
                .find(([key]) => key.toString() === referencesKey.toString())
            if (existing != undefined && (existing[1] as EntityReferences).count() > 0) {
                // the entity has references of this name; leave any partially populated columns as they are
                continue
            }
            if (existing == undefined) {
                flattenedReferences.push([referencesKey, new EntityReferences(referenceName, [])])
            }
            for (const attributeName of classification.selectedColumnAttributeNames) {
                const columnKey: EntityPropertyKey = EntityPropertyKey.referenceAttributes(referenceName, attributeName)
                if (!emittedKeys.has(columnKey.toString())) {
                    flattenedReferences.push([columnKey, new EntityReferenceAttributes(referenceName, attributeName, [])])
                }
            }
        }
    }

    /**
     * Creates immutable copy of entity from constructed properties
     */
    protected createFlatEntity(flattenedProperties: (WritableEntityProperty | undefined)[]): FlatEntity {
        const flattenedEntity: { [key: string]: EntityPropertyValue | EntityPropertyValue[] } = {}
        flattenedProperties.forEach(it => {
            if (it == undefined) {
                return
            }
            flattenedEntity[it[0].toString()] = it[1]
        })
        return flattenedEntity as FlatEntity
    }

    /**
     * Converts an entity property value to properly formatted {@link NativeValue} wrapper.
     * @param value a raw entity property value
     * @protected
     */
    protected wrapRawValueIntoNativeValue(value: EvitaValue | undefined): NativeValue | NativeValue[] {
        if (value instanceof Array) {
            return value.map(item => new NativeValue(item))
        } else if(value instanceof List) {
            return (value as List<EvitaValue>).map(x => new NativeValue(x)).toArray();
        } else {
            return new NativeValue(value)
        }
    }

    /**
     * Collapses a wrapped value into a single {@link EntityPropertyValue} suitable for a named representative-attribute
     * map. Representative attributes are scalar in practice; the first element is kept for the rare array case.
     */
    protected toSingleValue(wrapped: NativeValue | NativeValue[]): EntityPropertyValue {
        if (wrapped instanceof Array) {
            return wrapped[0] ?? new NativeValue(undefined)
        }
        return wrapped
    }
}
