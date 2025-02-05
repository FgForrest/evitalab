import { InjectionKey, provide, Ref } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'

const historyCriteriaInjectionKey: InjectionKey<Ref<TrafficRecordHistoryCriteria>> = Symbol('TrafficRecordHistoryCriteria')
export function provideHistoryCriteria(historyCriteria: Ref<TrafficRecordHistoryCriteria>): void {
    provide(historyCriteriaInjectionKey, historyCriteria)
}
export function useHistoryCriteria(): Ref<TrafficRecordHistoryCriteria> {
    return mandatoryInject(historyCriteriaInjectionKey)
}
