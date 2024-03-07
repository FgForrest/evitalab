import { inject, InjectionKey } from 'vue'
import { EvitaDBClient } from '@/services/evitadb-client'
import { EvitaQLDataPointer } from '@/model/editor/tab/evitaQLConsole/EvitaQLDataPointer'

export const key: InjectionKey<EvitaQLConsoleService> = Symbol()

/**
 * Service for running EvitaQL console component.
 */
export class EvitaQLConsoleService {
    private readonly evitaDBClient: EvitaDBClient

    constructor(evitaDBClient: EvitaDBClient) {
        this.evitaDBClient = evitaDBClient
    }

    /**
     * Executes user GraphQL query against a given evitaDB server and catalog.
     */
    // todo lho variables
    async executeEvitaQLQuery(dataPointer: EvitaQLDataPointer, query: string, variables?: object): Promise<string> {
        let result: any
        try {
           result = await this.evitaDBClient.queryEntities(dataPointer.connection, dataPointer.catalogName, query)
        } catch (e: any) {
            if (e.name === 'QueryError') {
                result = e.error
            } else {
                throw e
            }
        }
        return JSON.stringify(result, null, 2)
    }
}

export const useEvitaQLConsoleService = (): EvitaQLConsoleService => {
    return inject(key) as EvitaQLConsoleService
}
