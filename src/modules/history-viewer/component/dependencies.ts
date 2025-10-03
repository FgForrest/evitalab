import { provide } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'

const historyCriteriaInjectionKey: InjectionKey<Ref<MutationHistoryCriteria>> = Symbol('mutationHistoryCriteria')
export function provideHistoryCriteria(historyCriteria: Ref<MutationHistoryCriteria>): void {
    provide(historyCriteriaInjectionKey, historyCriteria)
}
export function useHistoryCriteria(): Ref<MutationHistoryCriteria> {
    return mandatoryInject(historyCriteriaInjectionKey)
}
