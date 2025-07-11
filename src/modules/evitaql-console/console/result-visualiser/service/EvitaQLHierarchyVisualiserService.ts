import type { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import { EvitaQLResultVisualiserService } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { VisualisedHierarchyTreeNode } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { Hierarchy } from '@/modules/database-driver/request-response/data/Hierarchy'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'

/**
 * {@link HierarchyVisualiserService} for EvitaQL query language.
 */
export class EvitaQLHierarchyVisualiserService
    implements HierarchyVisualiserService
{
    private visualizerService: EvitaQLResultVisualiserService

    constructor(visualiserService: EvitaQLResultVisualiserService) {
        this.visualizerService = visualiserService
    }

    findNamedHierarchiesByReferencesResults(
        hierarchyResult: ImmutableMap<string, Hierarchy>,
        entitySchema: EntitySchema
    ): [ReferenceSchema | undefined, Result][] {
        const newHierarchy: [ReferenceSchema | undefined, Result][] = []
        const references: ImmutableMap<string, ReferenceSchema> | undefined = entitySchema.references
        if (references != undefined) {
            for (const [hierarchyName, hierarchy] of hierarchyResult) {
                newHierarchy.push([
                    references.get(hierarchyName),
                    hierarchy.hierarchy,
                ])
            }
        }
        return newHierarchy
    }

    resolveNamedHierarchy(
        namedHierarchyResult: ImmutableList<LevelInfo>,
        entityRepresentativeAttributes: string[]
    ): VisualisedNamedHierarchy {
        const trees: VisualisedHierarchyTreeNode[] = []
        const nodeCountHolder: HierarchyTreeNodeCountHolder = new HierarchyTreeNodeCountHolder()
        const requestedNodeHolder: RequestedHierarchyTreeNodeHolder = new RequestedHierarchyTreeNodeHolder();

        namedHierarchyResult.forEach((levelInfo: LevelInfo) => {
            const tree: VisualisedHierarchyTreeNode = this.resolveHierarchyTreeNode(
                levelInfo,
                1,
                nodeCountHolder,
                requestedNodeHolder,
                entityRepresentativeAttributes
            )
            trees.push(tree)
        })

        return {
            count: nodeCountHolder.count,
            trees,
            requestedNode: requestedNodeHolder.requestedNode,
        }
    }

    private resolveHierarchyTreeNode(
        nodeResult: LevelInfo,
        level: number,
        nodeCountHolder: HierarchyTreeNodeCountHolder,
        requestedNodeHolder: RequestedHierarchyTreeNodeHolder,
        entityRepresentativeAttributes: string[]
    ): VisualisedHierarchyTreeNode {
        nodeCountHolder.count++

        // todo lho rewrite entity access
        const primaryKey: number | undefined = nodeResult.entity != undefined
            ? nodeResult.entity.primaryKey
            : nodeResult.entityReference!.primaryKey
        // only root nodes should display parents, we know parents in nested nodes from the direct parent in the tree
        let parentPrimaryKey: number | undefined = undefined
        if (level === 1 && nodeResult.entity != undefined) {
            parentPrimaryKey = nodeResult.entity.parentEntity?.primaryKey
        }
        const title: string | undefined =
            this.visualizerService.resolveRepresentativeTitleForEntityResult(
                nodeResult.entity,
                entityRepresentativeAttributes
            )
        const requested: boolean | undefined = nodeResult.requested
        const childrenCount: number | undefined = nodeResult.childrenCount
        const queriedEntityCount: number | undefined = nodeResult.queriedEntityCount

        const children: VisualisedHierarchyTreeNode[] = []
        const childResults: ImmutableList<LevelInfo> | undefined = nodeResult.children
        if (childResults != undefined && childResults.size > 0) {
            childResults.forEach((childResult: LevelInfo) => {
                const childNode: VisualisedHierarchyTreeNode =
                    this.resolveHierarchyTreeNode(
                        childResult,
                        level + 1,
                        nodeCountHolder,
                        requestedNodeHolder,
                        entityRepresentativeAttributes
                    )
                children.push(childNode)
            })
        }

        const node: VisualisedHierarchyTreeNode =
            new VisualisedHierarchyTreeNode(
                primaryKey,
                parentPrimaryKey,
                title,
                requested,
                childrenCount,
                queriedEntityCount,
                children
            )
        if (requested) {
            requestedNodeHolder.requestedNode = node
        }

        return node
    }
}

class HierarchyTreeNodeCountHolder {
    count: number

    constructor() {
        this.count = 0
    }
}

class RequestedHierarchyTreeNodeHolder {
    requestedNode: VisualisedHierarchyTreeNode | undefined

    constructor() {
        this.requestedNode = undefined
    }
}
