import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'
import { InjectionKey } from 'vue'
import { EvitaDBDriverResolver } from '@/modules/connection/driver/EvitaDBDriverResolver'
import { mandatoryInject } from '@/utils/reactivity'
import { Response } from '@/modules/connection/model/data/Response'

export const evitaQLConsoleServiceInjectionKey: InjectionKey<EvitaQLConsoleService> = Symbol('evitaQLConsoleService')

/**
 * Service for running EvitaQL console component.
 */
export class EvitaQLConsoleService {
    private readonly evitaDBDriverResolver: EvitaDBDriverResolver

    constructor(evitaDBDriver: EvitaDBDriverResolver) {
        this.evitaDBDriverResolver = evitaDBDriver
    }

    /**
     * Executes user GraphQL query against a given evitaDB server and catalog.
     */
    // todo lho variables
    async executeEvitaQLQuery(dataPointer: EvitaQLConsoleDataPointer, query: string, variables?: object): Promise<Response> {
        const evitaDBDriver: EvitaDBDriver = await this.evitaDBDriverResolver.resolveDriver(dataPointer.connection)

        let result: Response
        try {
           result = await evitaDBDriver.query(dataPointer.connection, dataPointer.catalogName, query)
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
