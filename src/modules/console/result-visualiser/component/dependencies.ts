import type { InjectionKey } from 'vue'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { mandatoryInject } from '@/utils/reactivity'

export const resultVisualiserServiceInjectionKey: InjectionKey<ResultVisualiserService> = Symbol('resultVisualiserService')

export function useResultVisualiserService(): ResultVisualiserService {
    return mandatoryInject(resultVisualiserServiceInjectionKey) as ResultVisualiserService
}
