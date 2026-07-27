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
import { resolveRepresentativeAttributes } from '@/modules/console/result-visualiser/service/utils/representativeAttributes'
import { buildRepresentativeTitle, toPrintableAttributeValue } from '@/modules/console/result-visualiser/service/utils/representativeTitle'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { Hierarchy } from '@/modules/database-driver/request-response/data/Hierarchy'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { List as ImmutableList } from 'immutable'

/**
 * {@link HierarchyResultParser} for EvitaQL query language. Recursively builds hierarchy trees
 * from typed {@link LevelInfo} objects in the internal model.
 */
export class EvitaQLHierarchyResultParser implements HierarchyResultParser<EvitaResponse> {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async parse(queryResult: EvitaResponse, entitySchema: EntitySchema, catalogName: string): Promise<VisualisedHierarchyResult> {
        const extraResults = queryResult.extraResults
        if (extraResults == undefined) {
            return new VisualisedHierarchyResult([])
        }

        const references: VisualisedReferenceHierarchy[] = []

        if (extraResults.selfHierarchy != undefined) {
            const entityRepresentativeAttributes = Array.from(entitySchema.attributes.values())
                .filter(attr => attr.representative)
                .map(attr => attr.nameVariants.get(NamingConvention.CamelCase)!)

            const namedHierarchies = this.resolveHierarchyEntries(
                extraResults.selfHierarchy,
                entityRepresentativeAttributes
            )
            references.push(new VisualisedReferenceHierarchy(undefined, namedHierarchies))
        }

        if (extraResults.hierarchy != undefined) {
            for (const [hierarchyName, hierarchy] of extraResults.hierarchy) {
                const referenceSchema = entitySchema.references.get(hierarchyName)

                let entityRepresentativeAttributes: string[]
                if (referenceSchema && referenceSchema.referencedEntityTypeManaged) {
                    entityRepresentativeAttributes = await resolveRepresentativeAttributes(
                        this.evitaClient,
                        catalogName,
                        referenceSchema.entityType as string
                    )
                } else {
                    entityRepresentativeAttributes = []
                }

                const namedHierarchies = this.resolveHierarchyEntries(
                    hierarchy,
                    entityRepresentativeAttributes
                )
                references.push(new VisualisedReferenceHierarchy(referenceSchema, namedHierarchies))
            }
        }

        return new VisualisedHierarchyResult(references)
    }

    private resolveHierarchyEntries(
        hierarchy: Hierarchy,
        entityRepresentativeAttributes: string[]
    ): VisualisedNamedHierarchyEntry[] {
        const entries: VisualisedNamedHierarchyEntry[] = []

        for (const [name, levelInfos] of hierarchy.hierarchy) {
            const result = this.resolveNamedHierarchy(levelInfos, entityRepresentativeAttributes)
            entries.push(new VisualisedNamedHierarchyEntry(name, result))
        }

        return entries
    }

    private resolveNamedHierarchy(
        levelInfos: ImmutableList<LevelInfo>,
        entityRepresentativeAttributes: string[]
    ): VisualisedNamedHierarchy {
        const trees: VisualisedHierarchyTreeNode[] = []
        let count = 0
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined

        levelInfos.forEach((levelInfo: LevelInfo) => {
            const { node, nodeCount, requested } = this.resolveHierarchyTreeNode(
                levelInfo,
                1,
                entityRepresentativeAttributes
            )
            trees.push(node)
            count += nodeCount
            if (requested) {
                requestedNode = requested
            }
        })

        return new VisualisedNamedHierarchy(trees, count, requestedNode)
    }

    private resolveHierarchyTreeNode(
        nodeResult: LevelInfo,
        level: number,
        entityRepresentativeAttributes: string[]
    ): { node: VisualisedHierarchyTreeNode; nodeCount: number; requested: VisualisedHierarchyTreeNode | undefined } {
        let nodeCount = 1
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined

        const primaryKey: number | undefined = nodeResult.entity != undefined
            ? nodeResult.entity.primaryKey
            : nodeResult.entityReference?.primaryKey
        let parentPrimaryKey: number | undefined = undefined
        if (level === 1 && nodeResult.entity != undefined) {
            parentPrimaryKey = nodeResult.entity.parentEntity?.primaryKey
        }
        const title = this.resolveRepresentativeTitle(nodeResult.entity, entityRepresentativeAttributes)
        const requested: boolean | undefined = nodeResult.requested
        const childrenCount: number | undefined = nodeResult.childrenCount
        const queriedEntityCount: number | undefined = nodeResult.queriedEntityCount

        const children: VisualisedHierarchyTreeNode[] = []
        if (nodeResult.children != undefined && nodeResult.children.size > 0) {
            nodeResult.children.forEach((childResult: LevelInfo) => {
                const childResolved = this.resolveHierarchyTreeNode(
                    childResult,
                    level + 1,
                    entityRepresentativeAttributes
                )
                children.push(childResolved.node)
                nodeCount += childResolved.nodeCount
                if (childResolved.requested) {
                    requestedNode = childResolved.requested
                }
            })
        }

        const node = new VisualisedHierarchyTreeNode(
            primaryKey,
            parentPrimaryKey,
            title,
            requested,
            childrenCount,
            queriedEntityCount,
            children
        )
        if (requested) {
            requestedNode = node
        }

        return { node, nodeCount, requested: requestedNode }
    }

    private resolveRepresentativeTitle(entity: Entity | undefined, representativeAttributes: string[]): string | undefined {
        if (!entity) return undefined

        const possibleAttributes: { value: unknown; isRepresentative: boolean }[] = []
        entity.allAttributes.forEach(it => {
            possibleAttributes.push({
                value: it.value,
                isRepresentative: representativeAttributes.includes(it.name)
            })
        })
        return buildRepresentativeTitle(possibleAttributes, toPrintableAttributeValue)
    }
}
