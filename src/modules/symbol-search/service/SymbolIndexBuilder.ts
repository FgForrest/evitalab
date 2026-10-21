import type { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import type { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import type { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { CatalogSymbolPartition } from '@/modules/symbol-search/service/CatalogSymbolPartition'
import { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolPath } from '@/modules/symbol-search/model/SymbolPath'
import { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import { CatalogSymbolStatus } from '@/modules/symbol-search/model/CatalogSymbolStatus'

/**
 * Schema item exposing its name in every naming convention.
 */
interface NamedSchemaItem {
    readonly name: string
    readonly nameVariants: ImmutableMap<NamingConvention, string>
}

/**
 * Schemas of one catalog read for indexing.
 */
interface CatalogSchemas {
    readonly catalogSchema: CatalogSchema
    readonly entitySchemas: EntitySchema[]
}

/**
 * Returns the structural fingerprint of a catalog: what the symbols of the catalog depend on in its statistics.
 * Deliberately excludes the catalog version, which changes with every data commit.
 */
export function catalogFingerprint(catalog: CatalogStatistics): string {
    const entityTypes: string[] = catalog.entityCollectionStatistics
        .map(collection => collection.entityType)
        .toArray()
        .sort()
    return [catalog.name, catalog.catalogState, catalog.unusable, catalog.readOnly, entityTypes.join(',')].join('|')
}

/**
 * Whether the schema of a catalog can be read. Stricter than the openability rule of the connection explorer on
 * purpose: transient states are indexed later, once the statistics fingerprint reports the catalog alive.
 */
function isCatalogIndexable(catalog: CatalogStatistics): boolean {
    return !catalog.unusable && (catalog.catalogState === CatalogState.Alive || catalog.isInWarmup)
}

/**
 * Walks the schemas of catalogs and turns them into {@link CatalogSymbolPartition}s.
 *
 * Every read goes through the cached driver paths (L1 → L2 → server): entity types are taken from the cached
 * catalog statistics instead of `CatalogSchema.entitySchemas()`, which would call the uncached
 * `getAllEntityTypes` and memoize entity schemas on the catalog schema instance. A fully cached build therefore
 * makes no server call at all and works offline.
 */
export class SymbolIndexBuilder {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * Returns the catalogs of the connection ordered by name, which makes truncation at the symbol limit
     * deterministic.
     */
    async getCatalogs(): Promise<CatalogStatistics[]> {
        const catalogs: ImmutableList<CatalogStatistics> = await this.evitaClient.management.getCatalogStatistics()
        return catalogs.toArray().sort((a, b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0))
    }

    /**
     * Builds the partition of one catalog. A catalog whose schema cannot be read yields its catalog symbol only, and
     * no session is touched for it.
     *
     * @throws Error when the schemas of an indexable catalog cannot be read
     */
    async buildPartition(catalog: CatalogStatistics): Promise<CatalogSymbolPartition> {
        if (!isCatalogIndexable(catalog)) {
            return this.createCatalogOnlyPartition(catalog)
        }

        const entityTypes: string[] = catalog.entityCollectionStatistics
            .map(collection => collection.entityType)
            .toArray()
        // read everything first, the session logic may be replayed and must stay free of side effects
        let schemas: CatalogSchemas
        try {
            schemas = await this.readSchemas(catalog, entityTypes)
        } finally {
            if (catalog.isInWarmup) {
                // evitaDB permits a single session on a warming-up catalog and the shared one is read-write there:
                // left open by an indexing nobody sees, it would block every schema mutation of the catalog. It is
                // evicted and closed once idle, a tab reading concurrently just gets a new one on its next call
                await this.evitaClient.closeSharedSession(catalog.name)
            }
        }
        return this.createPartition(catalog, schemas)
    }

    private async readSchemas(catalog: CatalogStatistics, entityTypes: string[]): Promise<CatalogSchemas> {
        return await this.evitaClient.queryCatalog(
            catalog.name,
            async (session): Promise<CatalogSchemas> => {
                const catalogSchema: CatalogSchema = await session.getCatalogSchema()
                const entitySchemas: EntitySchema[] = []
                for (const entityType of entityTypes) {
                    const entitySchema: EntitySchema | undefined = await session.getEntitySchema(entityType)
                    if (entitySchema != undefined) {
                        entitySchemas.push(entitySchema)
                    }
                }
                return { catalogSchema, entitySchemas }
            }
        )
    }

    /**
     * Creates a partition holding only the catalog symbol, for catalogs whose schema is not (or could not be) read.
     */
    createCatalogOnlyPartition(catalog: CatalogStatistics): CatalogSymbolPartition {
        const partition: CatalogSymbolPartition = new CatalogSymbolPartition(catalog.name, catalogFingerprint(catalog))
        partition.add(this.createCatalogSymbol(catalog), [])
        return partition
    }

    private createPartition(catalog: CatalogStatistics, schemas: CatalogSchemas): CatalogSymbolPartition {
        const partition: CatalogSymbolPartition = new CatalogSymbolPartition(catalog.name, catalogFingerprint(catalog))
        const catalogName: string = catalog.name
        const catalogPath: SymbolPath = new SymbolPath(catalogName)

        partition.add(this.createCatalogSymbol(catalog), schemas.catalogSchema.nameVariants.values())
        this.addItems(partition, schemas.catalogSchema.attributes.values(), SymbolType.Attribute, catalogPath, AttributeOwner.Catalog)

        for (const entitySchema of schemas.entitySchemas) {
            const entityPath: SymbolPath = new SymbolPath(catalogName, entitySchema.name)
            this.addItem(partition, entitySchema, SymbolType.EntityCollection, catalogPath)
            this.addItems(partition, entitySchema.attributes.values(), SymbolType.Attribute, entityPath, AttributeOwner.Entity)
            this.addItems(
                partition,
                entitySchema.sortableAttributeCompounds.values(),
                SymbolType.SortableAttributeCompound,
                entityPath,
                AttributeOwner.Entity
            )
            this.addItems(partition, entitySchema.associatedData.values(), SymbolType.AssociatedData, entityPath)

            for (const referenceSchema of entitySchema.references.values()) {
                this.addReference(partition, catalogName, entitySchema.name, referenceSchema)
            }
        }
        return partition
    }

    private addReference(partition: CatalogSymbolPartition,
                         catalogName: string,
                         entityType: string,
                         referenceSchema: ReferenceSchema): void {
        const referencePath: SymbolPath = new SymbolPath(catalogName, entityType, referenceSchema.name)
        this.addItem(partition, referenceSchema, SymbolType.Reference, new SymbolPath(catalogName, entityType))
        this.addItems(partition, referenceSchema.attributes.values(), SymbolType.Attribute, referencePath, AttributeOwner.Reference)
        this.addItems(
            partition,
            referenceSchema.sortableAttributeCompounds.values(),
            SymbolType.SortableAttributeCompound,
            referencePath,
            AttributeOwner.Reference
        )
    }

    private addItems(partition: CatalogSymbolPartition,
                     items: Iterable<NamedSchemaItem>,
                     type: SymbolType,
                     path: SymbolPath,
                     attributeOwner?: AttributeOwner): void {
        for (const item of items) {
            this.addItem(partition, item, type, path, attributeOwner)
        }
    }

    private addItem(partition: CatalogSymbolPartition,
                    item: NamedSchemaItem,
                    type: SymbolType,
                    path: SymbolPath,
                    attributeOwner?: AttributeOwner): void {
        partition.add(new SchemaSymbol(type, item.name, path, attributeOwner), item.nameVariants.values())
    }

    private createCatalogSymbol(catalog: CatalogStatistics): SchemaSymbol {
        return new SchemaSymbol(
            SymbolType.Catalog,
            catalog.name,
            new SymbolPath(catalog.name),
            undefined,
            new CatalogSymbolStatus(catalog.catalogState, catalog.unusable, catalog.readOnly)
        )
    }
}
