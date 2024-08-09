import { Connection } from '@/modules/connection/model/Connection'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { ConnectionServerInfo } from '@/modules/connection/model/ConnectionServerInfo'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { EvitaDBServerProbe } from '@/modules/connection/service/EvitaDBServerProbe'
import { EvitaDBDriverGrpc } from './grpc/EvitaDBDriverGrpc'

export const evitaDBDriverResolverInjectionKey: InjectionKey<EvitaDBDriverResolver> = Symbol('evitaDBDriverResolver')

/**
 * Provides correct evitaDB driver for given connection.
 */
export class EvitaDBDriverResolver {

    /**
     * All supported drivers. Must be sorted from the newest one to correctly resolve version ranges
     */
    private readonly driverIndex: EvitaDBDriver[]

    private readonly evitaDBServerProbe: EvitaDBServerProbe

    constructor(evitaLabConfig: EvitaLabConfig, evitaDBServerProbe: EvitaDBServerProbe) {
        this.driverIndex = [
            new EvitaDBDriverGrpc()
        ]
        this.evitaDBServerProbe = evitaDBServerProbe
    }

    /**
     * Tries to find a correct driver for the given connection based on server version.
     *
     * @param connection
     */
    async resolveDriver(connection: Connection): Promise<EvitaDBDriver> {
        const serverInfo: ConnectionServerInfo = await this.evitaDBServerProbe.fetchServerInfo(connection)
        for (const driver of this.driverIndex) {
            // todo lho this is just hack for snapshots
            if (driver.getSupportedVersions().contains('all')) {
                return driver
            }
            // if (semver.gte(serverInfo.version, driver.getSupportedVersions())) {
            //     return driver
            // }
        }
        throw new UnexpectedError(`Could not find driver for connection '${connection.name}' with evitaDB version '${serverInfo.version}'.`)
    }
}

export const useEvitaDBDriverResolver = (): EvitaDBDriverResolver => {
    return mandatoryInject(evitaDBDriverResolverInjectionKey) as EvitaDBDriverResolver
}
