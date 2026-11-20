import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { QueryError } from '@/modules/database-driver/exception/QueryError'
import type { EvitaQLQueryResult } from '@/modules/evitaql-console/console/model/EvitaQLQueryResult'
import { createEvitaQLResultStatus } from '@/modules/evitaql-console/console/service/createEvitaQLResultStatus'

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
     * Executes user evitaQL query against a given catalog. A query the server refuses is a result too — with its
     * error response and an error status.
     */
    async executeEvitaQLQuery(dataPointer: EvitaQLConsoleDataPointer, query: string): Promise<EvitaQLQueryResult> {
        let result: EvitaResponse
        let successful: boolean = true
        const startedAt: number = performance.now()
        try {
           result = await this.evitaClient.queryCatalog(
               dataPointer.catalogName,
               session => session.query(query),
               true // we want to always fetch fresh data
           )
        } catch (e) {
            if (e instanceof QueryError) {
                result = e.error as EvitaResponse
                successful = false
            } else {
                throw e
            }
        }
        return { response: result, status: createEvitaQLResultStatus(successful, performance.now() - startedAt) }
    }
}

export const useEvitaQLConsoleService = (): EvitaQLConsoleService => {
    return mandatoryInject(evitaQLConsoleServiceInjectionKey) as EvitaQLConsoleService
}
