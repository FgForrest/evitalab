import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import {
    VisualisedHierarchyResult,
    VisualisedReferenceHierarchy,
    VisualisedNamedHierarchyEntry
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { VisualisedHierarchyTreeNode } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { findSchemaByName } from '@/modules/console/result-visualiser/service/utils/schemaMatching'
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'

/**
 * {@link HierarchyResultParser} for GraphQL query language. Builds hierarchy trees from
 * flat level-ordered JSON nodes using a stack-based algorithm.
 */
export class GraphQLHierarchyResultParser implements HierarchyResultParser {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: unknown, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedHierarchyResult> {
        const result = queryResult as any
        const hierarchyResult = result['extraResults']?.['hierarchy']
        if (!hierarchyResult) {
            return new VisualisedHierarchyResult([])
        }

        const references: VisualisedReferenceHierarchy[] = []

        for (const referenceName of Object.keys(hierarchyResult)) {
            const namedHierarchiesResult = hierarchyResult[referenceName]
            let referenceSchema = undefined
            let entityRepresentativeAttributes: string[]

            if (referenceName === 'self') {
                entityRepresentativeAttributes = Array.from(entitySchema.attributes.values())
                    .filter(attr => attr.representative)
                    .map(attr => attr.nameVariants.get(NamingConvention.CamelCase)!)
            } else {
                referenceSchema = findSchemaByName(
                    referenceName,
                    entitySchema.references.values(),
                    entitySchema.name,
                    'Reference'
                )
                entityRepresentativeAttributes = referenceSchema.referencedEntityTypeManaged
                    ? await resolveRepresentativeAttributes(this.evitaClient, catalogName, referenceSchema.entityType as string)
                    : []
            }

            const namedHierarchies: VisualisedNamedHierarchyEntry[] = []
            for (const name of Object.keys(namedHierarchiesResult)) {
                const hierarchy = this.resolveNamedHierarchy(
                    namedHierarchiesResult[name],
                    entityRepresentativeAttributes
                )
                namedHierarchies.push(new VisualisedNamedHierarchyEntry(name, hierarchy))
            }

            references.push(new VisualisedReferenceHierarchy(referenceSchema, namedHierarchies))
        }

        return new VisualisedHierarchyResult(references)
    }

    private resolveNamedHierarchy(
        namedHierarchyResult: any[],
        entityRepresentativeAttributes: string[]
    ): VisualisedNamedHierarchy {
        const trees: VisualisedHierarchyTreeNode[] = []
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined

        let currentLevel: number = -1
        const nodesStack: { node: VisualisedHierarchyTreeNode; children: VisualisedHierarchyTreeNode[] }[] = []

        for (const nodeResult of namedHierarchyResult) {
            const level: number = nodeResult['level'] || 1

            const nodeEntity = nodeResult['entity']
            const primaryKey: number | undefined = nodeEntity?.['primaryKey']
            const parentPrimaryKey: number | undefined = level === 1 ? nodeEntity?.['parentPrimaryKey'] : undefined
            const title = this.resolveRepresentativeTitle(nodeEntity, entityRepresentativeAttributes)
            const requested: boolean | undefined = nodeResult['requested']
            const childrenCount: number | undefined = nodeResult['childrenCount']
            const queriedEntityCount: number | undefined = nodeResult['queriedEntityCount']

            if (level <= currentLevel) {
                const levelDiff = currentLevel - level + 1
                for (let i = 0; i < levelDiff; i++) {
                    this.flushCurrentNodeToUpper(trees, nodesStack)
                }
            }

            currentLevel = level
            const children: VisualisedHierarchyTreeNode[] = []
            const node = new VisualisedHierarchyTreeNode(
                primaryKey,
                parentPrimaryKey,
                title,
                requested,
                childrenCount,
                queriedEntityCount,
                children
            )
            nodesStack.push({ node, children })
            if (requested) {
                requestedNode = node
            }
        }

        while (nodesStack.length > 0) {
            this.flushCurrentNodeToUpper(trees, nodesStack)
        }

        return new VisualisedNamedHierarchy(trees, namedHierarchyResult.length, requestedNode)
    }

    private flushCurrentNodeToUpper(
        trees: VisualisedHierarchyTreeNode[],
        stack: { node: VisualisedHierarchyTreeNode; children: VisualisedHierarchyTreeNode[] }[]
    ): void {
        const prev = stack.pop()!
        if (stack.length === 0) {
            trees.push(prev.node)
        } else {
            stack.at(-1)!.children.push(prev.node)
        }
    }

    private resolveRepresentativeTitle(entityResult: any | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) return undefined

        const possibleAttributes: { value: any; isRepresentative: boolean }[] = []
        const attributes = entityResult['attributes'] || {}
        for (const attributeName in attributes) {
            possibleAttributes.push({
                value: attributes[attributeName],
                isRepresentative: representativeAttributes.includes(attributeName)
            })
        }
        return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
    }
}
