import type { HierarchyResultParser } from '@/modules/console/result-visualiser/service/HierarchyResultParser'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
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
import { List as ImmutableList } from 'immutable'

/**
 * A node whose own data is already known but whose children are still being collected as the flat,
 * level-ordered result is walked. The {@link VisualisedHierarchyTreeNode} is built from it only once its
 * children are complete, because the node holds them as an immutable list.
 */
type PendingHierarchyNode = {
    readonly primaryKey: number | undefined
    readonly parentPrimaryKey: number | undefined
    readonly title: string | undefined
    readonly requested: boolean | undefined
    readonly childrenCount: number | undefined
    readonly queriedEntityCount: number | undefined
    readonly children: VisualisedHierarchyTreeNode[]
}

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
        const result = queryResult as GraphQLResultNode
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
        namedHierarchyResult: GraphQLResultNode[],
        entityRepresentativeAttributes: string[]
    ): VisualisedNamedHierarchy {
        const trees: VisualisedHierarchyTreeNode[] = []
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined
        let requestedPendingNode: PendingHierarchyNode | undefined = undefined

        let currentLevel: number = -1
        const nodesStack: PendingHierarchyNode[] = []

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
                    const flushed = this.flushCurrentNodeToUpper(trees, nodesStack)
                    if (flushed.pending === requestedPendingNode) {
                        requestedNode = flushed.node
                    }
                }
            }

            currentLevel = level
            const pendingNode: PendingHierarchyNode = {
                primaryKey,
                parentPrimaryKey,
                title,
                requested,
                childrenCount,
                queriedEntityCount,
                children: []
            }
            nodesStack.push(pendingNode)
            if (requested) {
                requestedPendingNode = pendingNode
            }
        }

        while (nodesStack.length > 0) {
            const flushed = this.flushCurrentNodeToUpper(trees, nodesStack)
            if (flushed.pending === requestedPendingNode) {
                requestedNode = flushed.node
            }
        }

        return new VisualisedNamedHierarchy(
            ImmutableList(trees),
            namedHierarchyResult.length,
            requestedNode
        )
    }

    /**
     * Pops the deepest pending node, builds it now that its children are complete, and files it under its
     * own parent — or as a root, when there is no parent left on the stack.
     */
    private flushCurrentNodeToUpper(
        trees: VisualisedHierarchyTreeNode[],
        stack: PendingHierarchyNode[]
    ): { pending: PendingHierarchyNode, node: VisualisedHierarchyTreeNode } {
        const pending: PendingHierarchyNode = stack.pop()!
        const node: VisualisedHierarchyTreeNode = new VisualisedHierarchyTreeNode(
            pending.primaryKey,
            pending.parentPrimaryKey,
            pending.title,
            pending.requested,
            pending.childrenCount,
            pending.queriedEntityCount,
            ImmutableList(pending.children)
        )
        const parent: PendingHierarchyNode | undefined = stack.at(-1)
        if (parent == undefined) {
            trees.push(node)
        } else {
            parent.children.push(node)
        }
        return { pending, node }
    }

    private resolveRepresentativeTitle(entityResult: GraphQLResultNode | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) return undefined

        const possibleAttributes: { value: unknown; isRepresentative: boolean }[] = []
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
