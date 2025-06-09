import { provide } from 'vue'
import type { InjectionKey, Ref, ComputedRef } from 'vue'
import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'
import { mandatoryInject } from '@/utils/reactivity'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import type { Result } from '@/modules/console/result-visualiser/model/Result'

const catalogPointerInjectionKey: InjectionKey<CatalogPointer> = Symbol('catalogPointer')
export function provideCatalogPointer(catalogPointer: CatalogPointer): void {
    provide(catalogPointerInjectionKey, catalogPointer)
}
export function useCatalogPointer(): CatalogPointer {
    return mandatoryInject(catalogPointerInjectionKey) as CatalogPointer
}

const visualiserServiceInjectionKey: InjectionKey<ResultVisualiserService> = Symbol('visualiserService')
export function provideVisualiserService(visualiserService: ResultVisualiserService): void {
    provide(visualiserServiceInjectionKey, visualiserService)
}
export function useVisualiserService(): ResultVisualiserService {
    return mandatoryInject(visualiserServiceInjectionKey) as ResultVisualiserService
}

const rootEntitySchemaInjectionKey: InjectionKey<Ref<EntitySchema | undefined>> = Symbol('rootEntitySchema')
export function provideRootEntitySchema(entitySchema: Ref<EntitySchema | undefined>): void {
    provide(rootEntitySchemaInjectionKey, entitySchema)
}
export function useRootEntitySchema(): Ref<EntitySchema | undefined> {
    return mandatoryInject(rootEntitySchemaInjectionKey) as Ref<EntitySchema | undefined>
}

const queryResultInjectionKey: InjectionKey<ComputedRef<Result | undefined>> = Symbol('queryResult')
export function provideQueryResult(queryResult: ComputedRef<Result | undefined>): void {
    provide(queryResultInjectionKey, queryResult)
}
export function useQueryResult(): ComputedRef<Result | undefined> {
    return mandatoryInject(queryResultInjectionKey) as ComputedRef<Result | undefined>
}
