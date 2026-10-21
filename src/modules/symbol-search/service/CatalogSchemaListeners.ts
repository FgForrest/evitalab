import type { EvitaClient } from '@/modules/database-driver/EvitaClient'

/**
 * Schema change callbacks registered for one indexed catalog: the catalog schema callback plus one entity schema
 * callback per entity type. Entity schema changes notify only entity-level callbacks, so both levels are needed.
 *
 * The callbacks live as long as the catalog's partition. A rebuild only {@link update}s the set of entity types —
 * re-registering everything would churn the callback lists the driver is possibly dispatching from right now.
 */
export class CatalogSchemaListeners {

    private readonly evitaClient: EvitaClient
    private readonly catalogName: string
    private readonly callback: () => Promise<void>

    private catalogCallbackId: string | undefined = undefined
    private readonly entityCallbackIds: Map<string, string> = new Map()

    constructor(evitaClient: EvitaClient, catalogName: string, onChange: () => void) {
        this.evitaClient = evitaClient
        this.catalogName = catalogName
        // the callbacks are awaited one by one by the schema cache, so they only flag the change
        this.callback = async (): Promise<void> => onChange()
    }

    /**
     * Registers the catalog callback if not done yet, and brings the entity callbacks in line with the given entity
     * types: registers the new ones, unregisters the vanished ones, leaves the rest untouched.
     */
    update(entityTypes: string[]): void {
        if (this.catalogCallbackId == undefined) {
            this.catalogCallbackId = this.evitaClient.registerCatalogSchemaChangedCallback(this.catalogName, this.callback)
        }
        const wanted: Set<string> = new Set(entityTypes)
        for (const [entityType, id] of Array.from(this.entityCallbackIds)) {
            if (!wanted.has(entityType)) {
                this.evitaClient.unregisterEntitySchemaChangedCallback(this.catalogName, entityType, id)
                this.entityCallbackIds.delete(entityType)
            }
        }
        for (const entityType of wanted) {
            if (!this.entityCallbackIds.has(entityType)) {
                this.entityCallbackIds.set(
                    entityType,
                    this.evitaClient.registerEntitySchemaChangedCallback(this.catalogName, entityType, this.callback)
                )
            }
        }
    }

    unregister(): void {
        if (this.catalogCallbackId != undefined) {
            this.evitaClient.unregisterCatalogSchemaChangedCallback(this.catalogName, this.catalogCallbackId)
            this.catalogCallbackId = undefined
        }
        for (const [entityType, id] of this.entityCallbackIds) {
            this.evitaClient.unregisterEntitySchemaChangedCallback(this.catalogName, entityType, id)
        }
        this.entityCallbackIds.clear()
    }
}
