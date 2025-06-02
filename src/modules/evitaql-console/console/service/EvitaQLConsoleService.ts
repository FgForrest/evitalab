import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

export const evitaQLConsoleServiceInjectionKey: InjectionKey<EvitaQLConsoleService> = Symbol('evitaQLConsoleService')

/**
 * Service for running EvitaQL console component.
 */
export class EvitaQLConsoleService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * Executes user GraphQL query against a given catalog.
     */
    async executeEvitaQLQuery(dataPointer: EvitaQLConsoleDataPointer, query: string): Promise<EvitaResponse> {
        let result: EvitaResponse
        try {
           result = await this.evitaClient.queryCatalog(
               dataPointer.catalogName,
               session => session.query(query),
               true // we want to always fetch fresh data
           )
        } catch (e: any) {
            if (e.name === 'QueryError') {
                result = e.error
            } else {
                throw e
            }
        }
        return result
    }
}

export const useEvitaQLConsoleService = (): EvitaQLConsoleService => {
    return mandatoryInject(evitaQLConsoleServiceInjectionKey) as EvitaQLConsoleService
}
