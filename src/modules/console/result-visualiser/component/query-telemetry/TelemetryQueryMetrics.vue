<script setup lang="ts">
/**
 * Query metrics recorded on the root step: cardinality and cost (estimated / actual), returned records, I/O and the
 * prefetch flag. A cardinality estimate off by ten times or more (including an estimate of ten or more records when
 * none matched) gets a verdict chip; a missing member reads as the not-applicable placeholder, never as `0`.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'
import type { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { formatBytes, formatNumber, formatRate, notApplicable } from '@/utils/statisticsFormatting'

/**
 * Ratio of actual to estimated cardinality from which on the estimate is called off.
 */
const misestimateRatio: number = 10

const { t } = useI18n()

const props = defineProps<{
    metrics: QueryTelemetryMetrics
}>()

const cardinalityVerdict = computed<KeywordValue | undefined>(() => {
    const estimated: bigint | undefined = props.metrics.estimatedCardinality
    const actual: bigint | undefined = props.metrics.actualCardinality
    if (estimated == undefined || actual == undefined || estimated <= 0n || actual < 0n) {
        return undefined
    }
    if (actual == 0n) {
        if (estimated < BigInt(misestimateRatio)) {
            return undefined
        }
        return new KeywordValue(
            t('resultVisualizer.queryTelemetryVisualiser.chip.offByAtLeast', {
                ratio: formatNumber(estimated)
            }),
            'warning',
            t('resultVisualizer.queryTelemetryVisualiser.help.offBy')
        )
    }
    const ratio: number = Number(actual) / Number(estimated)
    if (ratio < misestimateRatio && ratio > 1 / misestimateRatio) {
        return undefined
    }
    return new KeywordValue(
        t('resultVisualizer.queryTelemetryVisualiser.chip.offBy', {
            ratio: formatRate(ratio >= 1 ? ratio : 1 / ratio)
        }),
        'warning',
        t('resultVisualizer.queryTelemetryVisualiser.help.offBy')
    )
})

function pair(estimated: bigint | undefined, actual: bigint | undefined): PropertyValue {
    return new PropertyValue(`${formatNumber(estimated)} / ${formatNumber(actual)}`)
}

const properties = computed<Property[]>(() => {
    const metrics: QueryTelemetryMetrics = props.metrics
    const cardinality: PropertyValue = pair(metrics.estimatedCardinality, metrics.actualCardinality)
    return [
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.cardinality'),
            cardinalityVerdict.value == undefined
                ? cardinality
                : List.of(cardinality, new PropertyValue(cardinalityVerdict.value)),
            t('resultVisualizer.queryTelemetryVisualiser.help.cardinality')
        ),
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.cost'),
            pair(metrics.estimatedCost, metrics.actualCost),
            t('resultVisualizer.queryTelemetryVisualiser.help.cost')
        ),
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.recordsReturned'),
            new PropertyValue(formatNumber(metrics.recordsReturned)),
            t('resultVisualizer.queryTelemetryVisualiser.help.recordsReturned')
        ),
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.ioFetchCount'),
            new PropertyValue(formatNumber(metrics.ioFetchCount)),
            t('resultVisualizer.queryTelemetryVisualiser.help.ioFetchCount')
        ),
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.ioFetchedSize'),
            new PropertyValue(formatBytes(metrics.ioFetchedSizeBytes)),
            t('resultVisualizer.queryTelemetryVisualiser.help.ioFetchedSize')
        ),
        new Property(
            t('resultVisualizer.queryTelemetryVisualiser.metrics.prefetched'),
            metrics.prefetched == undefined
                ? new PropertyValue(notApplicable())
                : new PropertyValue(metrics.prefetched),
            t('resultVisualizer.queryTelemetryVisualiser.help.prefetched')
        )
    ]
})
</script>

<template>
    <VCard variant="tonal" class="telemetry-query-metrics">
        <VCardTitle class="telemetry-query-metrics__title">
            {{ t('resultVisualizer.queryTelemetryVisualiser.metrics.title') }}
            <span class="telemetry-query-metrics__help">
                <VIcon size="small" class="text-medium-emphasis">mdi-information-outline</VIcon>
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.metrics') }}
                </VTooltip>
            </span>
        </VCardTitle>
        <VCardText>
            <VPropertiesTable :properties="properties" />
        </VCardText>
    </VCard>
</template>

<style lang="scss" scoped>
.telemetry-query-metrics {
    &__title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    &__help {
        display: inline-flex;
    }
}
</style>
