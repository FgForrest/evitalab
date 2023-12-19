import {
    FacetSummaryVisualiserService,
    HierarchyVisualiserService
} from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result, VisualisedHierarchyTreeNode, VisualisedNamedHierarchy } from '@/model/editor/result-visualiser'
import { CatalogSchema, EntitySchema } from '@/model/evitadb'
import { EvitaDBConnection, UnexpectedError } from '@/model/lab'
import {  LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'
import {
    JsonFacetSummaryVisualiserService, JsonHierarchyVisualiserService,
    JsonResultVisualiserService
} from '@/services/editor/result-visualiser/json-result-visualiser.service'

export const key: InjectionKey<GraphQLResultVisualiserService> = Symbol()

/**
 * {@link ResultVisualiserService} for GraphQL query language.
 */
export class GraphQLResultVisualiserService extends JsonResultVisualiserService {
    private readonly labService: LabService
    private facetSummaryVisualiserService: GraphQLFacetSummaryVisualiserService | undefined = undefined
    private hierarchyVisualiserService: GraphQLHierarchyVisualiserService | undefined = undefined

    constructor(labService: LabService) {
        super()
        this.labService = labService
    }

    supportsMultipleQueries(): boolean {
        return true
    }

    findQueries(inputQuery: string, result: Result): string[] {
        if (result == undefined) {
            return []
        }
        const dataResult: Result | undefined = result['data']
        if (dataResult == undefined) {
            return []
        }
        // we currently support visualisations only of extra results, so we need only full queries
        return Object.keys(dataResult)
    }

    findQueryResult(result: Result, query: string): Result | undefined {
        const dataResult: Result | undefined = result['data']
        if (dataResult == undefined) {
            return undefined
        }
        return dataResult[query]
    }

    async getEntitySchemaForQuery(query: string, connection: EvitaDBConnection, catalogName: string): Promise<EntitySchema | undefined> {
        const entityType: string = (query).replace(/^(get|list|query)/, '')
        if (entityType.toLowerCase() === this.genericEntityType) {
            // generic query, no specific collection for all returned entities (each entity may be from a different collection)
            return undefined
        }
        const catalogSchema: CatalogSchema = await this.labService.getCatalogSchema(connection, catalogName)
        const entitySchema: EntitySchema | undefined = Object.values(catalogSchema.entitySchemas)
            .find(it => it.nameVariants.pascalCase === entityType)
        if (entitySchema == undefined) {
            throw new UnexpectedError(connection, `Entity schema '${entityType}' not found in catalog '${catalogName}'.`)
        }
        return entitySchema
    }

    resolveRepresentativeTitleForEntityResult(entityResult: Result | undefined, representativeAttributes: string[]): string | undefined {
        if (!entityResult) {
            return undefined
        }

        const possibleAttributes: [any, boolean][] = []
        const attributes = entityResult['attributes'] || {}
        for (const attributeName in attributes) {
            possibleAttributes.push([attributes[attributeName], representativeAttributes.includes(attributeName)])
        }

        if (possibleAttributes.length === 0) {
            return undefined
        } else if (possibleAttributes.length <= 3) {
            return possibleAttributes.map(it => this.toPrintableAttributeValue(it[0])).join(', ')
        } else {
            // if there are too many attributes, we only print the representative ones
            return possibleAttributes
                .filter(it => it[1])
                .map(it => this.toPrintableAttributeValue(it[0]))
                .join(', ')
        }
    }

    getFacetSummaryService(): FacetSummaryVisualiserService {
        if (!this.facetSummaryVisualiserService) {
            this.facetSummaryVisualiserService = new GraphQLFacetSummaryVisualiserService(this)
        }
        return this.facetSummaryVisualiserService
    }

    getHierarchyService(): HierarchyVisualiserService {
        if (!this.hierarchyVisualiserService) {
            this.hierarchyVisualiserService = new GraphQLHierarchyVisualiserService(this)
        }
        return this.hierarchyVisualiserService
    }
}

/**
 * {@link FacetSummaryVisualiserService} for GraphQL query language.
 */
export class GraphQLFacetSummaryVisualiserService extends JsonFacetSummaryVisualiserService<GraphQLResultVisualiserService> {
    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }
}

/**
 * {@link HierarchyVisualiserService} for GraphQL query language.
 */
export class GraphQLHierarchyVisualiserService extends JsonHierarchyVisualiserService<GraphQLResultVisualiserService> {

    constructor(visualiserService: GraphQLResultVisualiserService) {
        super(visualiserService)
    }

    resolveNamedHierarchy(namedHierarchyResult: Result[], entityRepresentativeAttributes: string[]): VisualisedNamedHierarchy {
        const count: number | undefined = namedHierarchyResult.length
        const trees: VisualisedHierarchyTreeNode[] = []
        let requestedNode: VisualisedHierarchyTreeNode | undefined = undefined

        let currentLevel: number = -1
        const nodesStack: VisualisedHierarchyTreeNode[] = []
        for (const nodeResult of namedHierarchyResult) {
            const level: number = nodeResult['level'] || 1

            const nodeEntity: Result | undefined = nodeResult['entity']
            const primaryKey: number | undefined = nodeEntity?.['primaryKey']
            // only root nodes should display parents, we know parents in nested nodes from the direct parent in the tree
            const parentPrimaryKey: number | undefined = level === 1 ? nodeEntity?.['parentPrimaryKey'] : undefined
            const title: string | undefined = this.visualiserService.resolveRepresentativeTitleForEntityResult(
                nodeEntity,
                entityRepresentativeAttributes
            )
            const requested: boolean | undefined = nodeResult['requested']
            const childrenCount: number | undefined = nodeResult['childrenCount']
            const queriedEntityCount: number | undefined = nodeResult['queriedEntityCount']

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
        const prevNode: VisualisedHierarchyTreeNode = stack.pop() as VisualisedHierarchyTreeNode;
        if (stack.length === 0) {
            // root node flush to final node collection
            trees.push(prevNode);
        } else {
            // todo lho this should be needed
            // @ts-ignore
            stack.at(-1).children.push(prevNode);
        }
    }
}

export const useGraphQLResultVisualiserService = (): GraphQLResultVisualiserService => {
    return inject(key) as GraphQLResultVisualiserService
}
