import { provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'

const serverStatusInjectionKey: InjectionKey<Ref<ServerStatus | undefined>> = Symbol('serverStatus')
export function provideServerStatus(serverStatus: Ref<ServerStatus | undefined>): void {
    provide(serverStatusInjectionKey, serverStatus)
}
export function useServerStatus(): Ref<ServerStatus | undefined> {
    return mandatoryInject(serverStatusInjectionKey) as Ref<ServerStatus | undefined>
}

const catalogInjectionKey: InjectionKey<Ref<CatalogStatistics | undefined>> = Symbol('catalog')
export function provideCatalog(catalog: Ref<CatalogStatistics | undefined>): void {
    provide(catalogInjectionKey, catalog)
}
export function useCatalog(): Ref<CatalogStatistics> {
    return mandatoryInject(catalogInjectionKey) as Ref<CatalogStatistics>
}
