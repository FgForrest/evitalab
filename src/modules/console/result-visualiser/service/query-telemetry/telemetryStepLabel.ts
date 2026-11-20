import { i18n } from '@/vue-plugins/i18n'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'

/**
 * Display label of a telemetry step on flamegraph blocks, step cards, captions and tab titles: the localised
 * `ALTERNATIVE #n` for index-selection candidates, otherwise the step's technical {@link VisualisedTelemetryStep.label}.
 */
export function telemetryStepLabel(step: VisualisedTelemetryStep): string {
    const alternativeOrdinal: number | undefined = step.alternativeOrdinal
    if (alternativeOrdinal != undefined) {
        return i18n.global.t(
            'resultVisualizer.queryTelemetryVisualiser.label.alternative',
            { ordinal: alternativeOrdinal }
        )
    }
    return step.label
}
