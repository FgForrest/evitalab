<script setup lang="ts">
/**
 * Overview tab of the query telemetry visualiser: the total with the start instant, the `PLAN` chip and the result
 * summary of the root metrics, the phase share bar with its legend, the flamegraph of all steps and the query metrics recorded on the root.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import { TelemetryPhaseGroup } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseGroup'
import type { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import { formatDateTime, formatNanos, formatNumber } from '@/utils/statisticsFormatting'
import PhaseShareBar from './PhaseShareBar.vue'
import TelemetryFlamegraph from './TelemetryFlamegraph.vue'
import TelemetryQueryMetrics from './TelemetryQueryMetrics.vue'

const { t } = useI18n()

const props = defineProps<{
    telemetry: VisualisedQueryTelemetry,
    /**
     * Steps that have an open Steps or Plan tab.
     */
    openStepIds: ReadonlySet<string>
}>()
const emit = defineEmits<{
    (e: 'openSteps', stepId: string): void
    (e: 'openPlan', stepId: string): void
}>()

const legendGroups: TelemetryPhaseGroup[] = [
    TelemetryPhaseGroup.Planning,
    TelemetryPhaseGroup.Execution,
    TelemetryPhaseGroup.Fetching
]

const resultSummary = computed<string | undefined>(() => {
    const metrics: QueryTelemetryMetrics | undefined = props.telemetry.metrics
    if (metrics == undefined) {
        return undefined
    }
    const values = { matched: formatNumber(metrics.actualCardinality), returned: formatNumber(metrics.recordsReturned) }
    return metrics.prefetched === true
        ? t('resultVisualizer.queryTelemetryVisualiser.label.resultSummaryPrefetched', values)
        : t('resultVisualizer.queryTelemetryVisualiser.label.resultSummary', values)
})

const notSelected = computed<string | undefined>(() => {
    if (props.telemetry.missingSelections.isEmpty()) {
        return undefined
    }
    return t(
        'resultVisualizer.queryTelemetryVisualiser.label.notSelected',
        { fields: props.telemetry.missingSelections.join(', ') }
    )
})
</script>

<template>
    <div class="telemetry-overview">
        <div class="telemetry-overview__header">
            <span class="telemetry-overview__total">
                {{ formatNanos(telemetry.total) }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.total') }}
                </VTooltip>
            </span>
            <span v-if="telemetry.startedAt != undefined" class="text-disabled">
                {{ formatDateTime(telemetry.startedAt) }}
            </span>
            <VChip v-if="telemetry.hasPlan" size="small">
                {{ t('resultVisualizer.queryTelemetryVisualiser.label.planChip') }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.planChip') }}
                </VTooltip>
            </VChip>
            <span v-if="resultSummary != undefined" class="telemetry-overview__summary text-medium-emphasis">
                {{ resultSummary }}
            </span>
            <span v-if="notSelected != undefined" class="telemetry-overview__not-selected text-disabled">
                <VIcon size="small">mdi-information-outline</VIcon>
                {{ notSelected }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.notSelected') }}
                </VTooltip>
            </span>
        </div>

        <PhaseShareBar :shares="telemetry.phaseShares" />

        <div class="telemetry-overview__legend text-medium-emphasis">
            <span
                v-for="group in legendGroups"
                :key="group"
                class="telemetry-overview__legend-item"
            >
                <span class="telemetry-overview__swatch" :style="{ background: `var(--telemetry-${group})` }" />
                {{ t(`resultVisualizer.queryTelemetryVisualiser.phase.${group}`) }}
            </span>
            <span class="telemetry-overview__legend-item">
                <span class="telemetry-overview__swatch telemetry-overview__swatch--self" />
                {{ t('resultVisualizer.queryTelemetryVisualiser.label.selfTimeLegend') }}
            </span>
        </div>

        <TelemetryFlamegraph
            :telemetry="telemetry"
            :open-step-ids="openStepIds"
            @open-steps="stepId => emit('openSteps', stepId)"
            @open-plan="stepId => emit('openPlan', stepId)"
        />

        <TelemetryQueryMetrics v-if="telemetry.metrics != undefined" :metrics="telemetry.metrics" />
    </div>
</template>

<style lang="scss" scoped>
@use "./telemetry-colors" as *;

.telemetry-overview {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &__header {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        column-gap: 1rem;
        row-gap: 0.25rem;
    }

    &__total {
        font-size: 1.625rem;
        font-weight: 500;
        line-height: 1.2;
    }

    &__summary {
        font-size: 0.875rem;
        font-variant-numeric: tabular-nums;
    }

    &__not-selected {
        font-size: 0.75rem;
    }

    &__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        font-size: 0.75rem;
    }

    &__legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }

    &__swatch {
        width: 0.625rem;
        height: 0.625rem;
        border-radius: 2px;

        &--self {
            background: $telemetry-self-hatch-muted;
        }
    }
}
</style>
