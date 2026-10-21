import type { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import type { CatalogViewerTabFactory } from '@/modules/catalog-viewer/service/CatalogViewerTabFactory'
import type { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import type {
    EvitaQLConsoleTabFactory
} from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import type {
    GraphQLConsoleTabFactory
} from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import type { EntityViewerTabFactory } from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'
import { SymbolActionDisabledReason } from '@/modules/symbol-search/model/SymbolActionDisabledReason'
import { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import type { CatalogSymbolStatus } from '@/modules/symbol-search/model/CatalogSymbolStatus'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import {
    ReferenceAttributeSchemaPointer
} from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import {
    SortableAttributeCompoundSchemaPointer
} from '@/modules/schema-viewer/viewer/model/SortableAttributeCompoundSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Executes {@link SymbolActionType}s on symbols by opening the corresponding tabs, and decides which of them are
 * available. Opens tabs through the same factory calls as the connection explorer menus.
 */
export class SymbolActionExecutor {

    private readonly workspaceService: WorkspaceService
    private readonly catalogViewerTabFactory: CatalogViewerTabFactory
    private readonly schemaViewerTabFactory: SchemaViewerTabFactory
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly entityViewerTabFactory: EntityViewerTabFactory

    constructor(workspaceService: WorkspaceService,
                catalogViewerTabFactory: CatalogViewerTabFactory,
                schemaViewerTabFactory: SchemaViewerTabFactory,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
                entityViewerTabFactory: EntityViewerTabFactory) {
        this.workspaceService = workspaceService
        this.catalogViewerTabFactory = catalogViewerTabFactory
        this.schemaViewerTabFactory = schemaViewerTabFactory
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.entityViewerTabFactory = entityViewerTabFactory
    }

    /**
     * Returns why the action cannot be executed on the symbol, or undefined when it can.
     *
     * Catalog actions mirror the predicates of `CatalogItemMenuFactory` (connection explorer): the preview needs the
     * catalog not to be deactivated, everything else an alive usable catalog, the GraphQL consoles also the GraphQL
     * API. Actions of symbols inside a catalog are always available, exactly as in `CollectionItemMenuFactory` —
     * such symbols exist only for catalogs whose schema could be read.
     *
     * @param action action to check
     * @param symbol symbol the action would be executed on
     * @param graphQLEnabled whether the server exposes the GraphQL API
     */
    getDisabledReason(action: SymbolActionType,
                      symbol: SchemaSymbol,
                      graphQLEnabled: boolean): SymbolActionDisabledReason | undefined {
        const catalogStatus: CatalogSymbolStatus | undefined = symbol.catalogStatus
        if (symbol.type !== SymbolType.Catalog || catalogStatus == undefined) {
            return undefined
        }

        if (action === SymbolActionType.CatalogPreview) {
            return catalogStatus.state === CatalogState.Inactive
                ? SymbolActionDisabledReason.CatalogInactive
                : undefined
        }
        if (catalogStatus.unusable) {
            return SymbolActionDisabledReason.CatalogUnusable
        }
        if (catalogStatus.state !== CatalogState.Alive) {
            return SymbolActionDisabledReason.CatalogNotAlive
        }
        if ((action === SymbolActionType.GraphQLDataConsole || action === SymbolActionType.GraphQLSchemaConsole) &&
            !graphQLEnabled) {
            return SymbolActionDisabledReason.GraphQLDisabled
        }
        return undefined
    }

    /**
     * Opens the tab of the action for the symbol. Does nothing when the action is disabled.
     *
     * @param action action to execute
     * @param symbol target symbol
     * @param graphQLEnabled whether the server exposes the GraphQL API
     */
    execute(action: SymbolActionType, symbol: SchemaSymbol, graphQLEnabled: boolean): void {
        if (this.getDisabledReason(action, symbol, graphQLEnabled) != undefined) {
            return
        }
        const catalogName: string = symbol.path.catalogName
        switch (action) {
            case SymbolActionType.CatalogPreview:
                this.workspaceService.createTab(this.catalogViewerTabFactory.createNew(catalogName))
                break
            case SymbolActionType.Schema:
                this.workspaceService.createTab(this.schemaViewerTabFactory.createNew(this.createSchemaPointer(symbol)))
                break
            case SymbolActionType.EvitaQLConsole:
                this.workspaceService.createTab(this.evitaQLConsoleTabFactory.createNew(catalogName))
                break
            case SymbolActionType.GraphQLDataConsole:
                this.workspaceService.createTab(
                    this.graphQLConsoleTabFactory.createNew(catalogName, GraphQLInstanceType.Data)
                )
                break
            case SymbolActionType.GraphQLSchemaConsole:
                this.workspaceService.createTab(
                    this.graphQLConsoleTabFactory.createNew(catalogName, GraphQLInstanceType.Schema)
                )
                break
            case SymbolActionType.EntityViewer:
                this.workspaceService.createTab(
                    this.entityViewerTabFactory.createNew(
                        catalogName,
                        symbol.name,
                        undefined,
                        true // we want to display data to user right away, there is no malicious code here
                    )
                )
                break
            default:
                throw new UnexpectedError(`Unsupported symbol action '${action}'.`)
        }
    }

    /**
     * Resolves the schema viewer pointer of a symbol. A reference-level sortable attribute compound has no pointer
     * of its own, so it points to the owning reference.
     */
    private createSchemaPointer(symbol: SchemaSymbol): SchemaPointer {
        const catalogName: string = symbol.path.catalogName
        const entityType: string | undefined = symbol.path.entityType
        const referenceName: string | undefined = symbol.path.referenceName

        switch (symbol.type) {
            case SymbolType.Catalog:
                return new CatalogSchemaPointer(catalogName)
            case SymbolType.EntityCollection:
                return new EntitySchemaPointer(catalogName, symbol.name)
            case SymbolType.Attribute:
                if (symbol.attributeOwner === AttributeOwner.Catalog) {
                    return new CatalogAttributeSchemaPointer(catalogName, symbol.name)
                }
                if (symbol.attributeOwner === AttributeOwner.Reference) {
                    return new ReferenceAttributeSchemaPointer(
                        catalogName,
                        this.requirePathPart(entityType, symbol),
                        this.requirePathPart(referenceName, symbol),
                        symbol.name
                    )
                }
                return new EntityAttributeSchemaPointer(catalogName, this.requirePathPart(entityType, symbol), symbol.name)
            case SymbolType.SortableAttributeCompound:
                if (symbol.attributeOwner === AttributeOwner.Reference) {
                    return new ReferenceSchemaPointer(
                        catalogName,
                        this.requirePathPart(entityType, symbol),
                        this.requirePathPart(referenceName, symbol)
                    )
                }
                return new SortableAttributeCompoundSchemaPointer(
                    catalogName,
                    this.requirePathPart(entityType, symbol),
                    symbol.name
                )
            case SymbolType.AssociatedData:
                return new AssociatedDataSchemaPointer(catalogName, this.requirePathPart(entityType, symbol), symbol.name)
            case SymbolType.Reference:
                return new ReferenceSchemaPointer(catalogName, this.requirePathPart(entityType, symbol), symbol.name)
            default:
                throw new UnexpectedError(`Unsupported symbol type '${symbol.type}'.`)
        }
    }

    private requirePathPart(part: string | undefined, symbol: SchemaSymbol): string {
        if (part == undefined) {
            throw new UnexpectedError(`Symbol '${symbol.id}' misses a part of its path.`)
        }
        return part
    }
}
