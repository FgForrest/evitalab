import { HierarchyVisualiserService } from '@/modules/console/result-visualiser/service/HierarchyVisualiserService'
import { EvitaQLResultVisualiserService } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import { VisualisedHierarchyTreeNode } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { Entity } from '@/modules/connection/model/data/Entity'
import { Value } from '@/modules/connection/model/Value'
import { Hierarchy } from '@/modules/connection/model/data/Hierarchy'
import { LevelInfo } from '@/modules/connection/model/data/LevelInfo'
import Immutable, { List, Map } from 'immutable'
import { no } from 'vuetify/locale'

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
        hierarchyResult: Immutable.Map<string, Hierarchy>,
        entitySchema: EntitySchema
    ): [ReferenceSchema | undefined, Result][] {
        const newHierarchy: [ReferenceSchema | undefined, Result][] = []
        const references: Immutable.Map<string, ReferenceSchema> | undefined = entitySchema.references.getIfSupported()
        if (references != undefined) {
            for (const [hierarchyName, hierarchy] of hierarchyResult) {
                newHierarchy.push([
                    references.get(hierarchyName),
                    hierarchy.hierarchy.getOrThrow(),
                ])
            }
        }
        return newHierarchy
    }

    resolveNamedHierarchy(
        namedHierarchyResult: List<LevelInfo>,
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
        const primaryKey: number | undefined = nodeResult.entity.getOrThrow() != undefined
            ? nodeResult.entity.getOrThrow()!.primaryKey
            : nodeResult.entityReference.getOrThrow()!.primaryKey
        // only root nodes should display parents, we know parents in nested nodes from the direct parent in the tree
        let parentPrimaryKey: number | undefined = undefined
        if (level === 1 && nodeResult.entity.getOrElse(undefined) != undefined) {
            parentPrimaryKey = nodeResult.entity.getOrThrow()!.parentEntity?.primaryKey
        }
        const title: string | undefined =
            this.visualizerService.resolveRepresentativeTitleForEntityResult(
                nodeResult.entity.getOrElse(undefined),
                entityRepresentativeAttributes
            )
        const requested: boolean | undefined = nodeResult.requested.getOrElse(false)
        const childrenCount: number | undefined = nodeResult.childrenCount.getOrElse(0)
        const queriedEntityCount: number | undefined = nodeResult.queriedEntityCount.getOrElse(0)

        const children: VisualisedHierarchyTreeNode[] = []
        const childResults: List<LevelInfo> | undefined = nodeResult.children.getOrElse(List())
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
