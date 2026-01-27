import {
    GraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import {
    JsonHierarchyVisualiserService
} from '@/modules/console/result-visualiser/service/json/JsonHierarchyVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'

/**
 * {@link HierarchyVisualiserService} for GraphQL query language.
 */
export class GraphQLHierarchyVisualiserService extends JsonHierarchyVisualiserService<GraphQLResultVisualiserService> {

    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }

    resolveNamedHierarchy(namedHierarchyResult: Result[],
                          entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy {
        const count: number | undefined = namedHierarchyResult.length
        const trees: VisualisedHierarchyTreeNode[] = []
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined

        let currentLevel: number = -1
        const nodesStack: VisualisedHierarchyTreeNode[] = []
        for (const nodeResult of namedHierarchyResult) {
            const nodeResultObj = nodeResult as Record<string, unknown>
            const level: number = (nodeResultObj['level'] as number) || 1

            const nodeEntity: Result = nodeResultObj['entity']
            const nodeEntityObj = nodeEntity as Record<string, unknown> | undefined
            const primaryKey: number | undefined = nodeEntityObj?.['primaryKey'] as number | undefined
            // only root nodes should display parents, we know parents in nested nodes from the direct parent in the tree
            const parentPrimaryKey: number | undefined = level === 1 ? nodeEntityObj?.['parentPrimaryKey'] as number | undefined : undefined
            const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
                nodeEntity,
                entityRepresentativeAttributes
            )
            const requested: boolean | undefined = nodeResultObj['requested'] as boolean | undefined
            const childrenCount: number | undefined = nodeResultObj['childrenCount'] as number | undefined
            const queriedEntityCount: number | undefined = nodeResultObj['queriedEntityCount'] as number | undefined

            if (level <= currentLevel) {
                // flush lower nodes as well as previous neighbour of the current node
                const levelDiff = currentLevel - level + 1
                for (let i = 0; i < levelDiff; i++) {
                    this.flushCurrentNodeToUpper(trees, nodesStack)
                }
            }

            currentLevel = level
            // prepare current node into the stack
            const node: VisualisedHierarchyTreeNode = new VisualisedHierarchyTreeNode(
                primaryKey,
                parentPrimaryKey,
                title,
                requested,
                childrenCount,
                queriedEntityCount,
                [] // will be filled during children flush
            )
            nodesStack.push(node)
            if (requested) {
                requestedNode = node
            }
        }

        // flush remaining nodes
        while (nodesStack.length > 0) {
            this.flushCurrentNodeToUpper(trees, nodesStack)
        }

        return { count, trees, requestedNode }
    }

    private flushCurrentNodeToUpper(trees: VisualisedHierarchyTreeNode[], stack: VisualisedHierarchyTreeNode[]): void {
        const prevNode: VisualisedHierarchyTreeNode = stack.pop() as VisualisedHierarchyTreeNode
        if (stack.length === 0) {
            // root node flush to final node collection
            trees.push(prevNode)
        } else {
            // todo lho this shouldn't be needed
            // @ts-expect-error - accessing children directly
            stack.at(-1).children.push(prevNode)
        }
    }
}
