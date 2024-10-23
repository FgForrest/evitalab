import { InjectionKey, provide, Ref } from 'vue'
import { Connection } from '@/modules/connection/model/Connection'
import { mandatoryInject } from '@/utils/reactivity'
import { Catalog } from '../../model/Catalog'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'

const connectionInjectionKey: InjectionKey<Connection> = Symbol('connection')
export function provideConnection(connection: Connection): void {
    provide(connectionInjectionKey, connection)
}
export function useConnection(): Connection {
    return mandatoryInject(connectionInjectionKey)
}

const serverStatusInjectionKey: InjectionKey<Ref<ServerStatus | undefined>> = Symbol('serverStatus')
export function provideServerStatus(serverStatus: Ref<ServerStatus | undefined>): void {
    provide(serverStatusInjectionKey, serverStatus)
}
export function useServerStatus(): Ref<ServerStatus | undefined> {
    return mandatoryInject(serverStatusInjectionKey) as Ref<ServerStatus | undefined>
}

const catalogInjectionKey: InjectionKey<Ref<Catalog | undefined>> = Symbol('catalog')
export function provideCatalog(catalog: Ref<Catalog | undefined>): void {
    provide(catalogInjectionKey, catalog)
}
export function useCatalog(): Ref<Catalog> {
    return mandatoryInject(catalogInjectionKey) as Ref<Catalog>
}
