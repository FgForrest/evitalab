<script setup lang="ts">
/**
 * Visualises histogram as a range slider.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisualisedHistogram } from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogram'
import {
    VisualisedHistogramBucket
} from '@/modules/console/result-visualiser/model/histogram/VisualisedHistogramBucket'
import HistogramNote from '@/modules/console/result-visualiser/component/histogram/HistogramNote.vue'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'

const { t } = useI18n()

const props = defineProps<{
    histogram: VisualisedHistogram
}>()

class RangeInfo {
    readonly min: number
    readonly max: number
    readonly requestedRange: [number, number]
    /**
     * If certain values are missing in the histogram, we can only simulate the range. This means that e.g. actual values
     * shouldn't be displayed, only range silhouette.
     * If not the reason is not empty, the range is simulated and reason displayed.
     */
    readonly simulatedReason?: string

    constructor(min: number, max: number, requestedRange: [number, number], simulatedReason?: string) {
        this.min = min
        this.max = max
        this.requestedRange = requestedRange
        this.simulatedReason = simulatedReason
    }
}

const rangeInfo = computed<RangeInfo>(() => {
    const sampleBucket: VisualisedHistogramBucket = props.histogram.buckets.get(0)! // there is always at least one bucket
    if (sampleBucket.requested == undefined) {
        // we don't know the requested range, there is nothing to display
        return new RangeInfo(
            0,
            10,
            [5, 5],
            t('resultVisualizer.histogram.placeholder.missingPropertiesForSimulatedRange', { properties: formatProperties(['requested']) })
        )
    }
    return actualRange() ?? simulatedRange()
})

/**
 * Range built from the real histogram values. Undefined when the result does not carry everything needed for
 * it — the histogram boundaries and a threshold of every bucket.
 */
function actualRange(): RangeInfo | undefined {
    const histogramMin: BigDecimal | undefined = props.histogram.min
    const histogramMax: BigDecimal | undefined = props.histogram.max
    if (histogramMin == undefined || histogramMax == undefined || missingActualProperties().length > 0) {
        return undefined
    }

    const min: number = histogramMin.toFloat()
    const max: number = histogramMax.toFloat()
    const middle: number = (min + max) / 2

    const leftRequestedThreshold: BigDecimal | undefined = props.histogram.buckets.find((bucket) => bucket.requested ?? false)?.threshold
    let rightRequestedThreshold: number | undefined = undefined
    if (leftRequestedThreshold != undefined) {
        // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
        const rightRequestedIndex: number = props.histogram.buckets.findLastIndex((bucket) => bucket.requested ?? false)
        rightRequestedThreshold = rightRequestedIndex < props.histogram.buckets.size - 1
            ? props.histogram.buckets.get(rightRequestedIndex + 1)?.threshold?.toFloat()
            : max
    }

    return new RangeInfo(
        min,
        max,
        [
            leftRequestedThreshold != undefined ? leftRequestedThreshold.toFloat() : middle,
            rightRequestedThreshold != undefined ? rightRequestedThreshold : middle
        ]
    )
}

/**
 * Range silhouette built from bucket indexes, used when actual values are not available. The reason is reported
 * to the user, so that the displayed values are not mistaken for real thresholds.
 */
function simulatedRange(): RangeInfo {
    const min: number = 0
    const max: number = props.histogram.buckets.size
    const middle: number = (min + max) / 2

    let leftRequestedIndex: number | undefined = props.histogram.buckets.findIndex((bucket) => bucket.requested ?? false)
    if (leftRequestedIndex == -1) {
        leftRequestedIndex = undefined
    }
    let rightRequestedIndex: number | undefined = undefined
    if (leftRequestedIndex != undefined) {
        // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
        rightRequestedIndex = props.histogram.buckets.findLastIndex((bucket) => bucket.requested ?? false) + 1
    }

    return new RangeInfo(
        min,
        max,
        [
            leftRequestedIndex != undefined ? leftRequestedIndex : middle,
            rightRequestedIndex != undefined ? rightRequestedIndex : middle
        ],
        t('resultVisualizer.histogram.placeholder.missingPropertiesForActualRange', { properties: formatProperties(missingActualProperties()) })
    )
}

/**
 * Names of the properties a range with actual values needs but the fetched histogram does not contain.
 */
function missingActualProperties(): string[] {
    const missingProperties: string[] = []
    if (props.histogram.min == undefined) {
        missingProperties.push('min')
    }
    if (props.histogram.max == undefined) {
        missingProperties.push('max')
    }
    if (props.histogram.buckets.some((bucket) => bucket.threshold == undefined)) {
        missingProperties.push('threshold')
    }
    return missingProperties
}

function formatProperties(properties: string[]): string {
    return properties.map(it => '`' + it + '`').join(', ')
}
</script>

<template>
    <VRangeSlider
        disabled
        :min="rangeInfo.min"
        :max="rangeInfo.max"
        :model-value="rangeInfo.requestedRange"
        :thumb-label="rangeInfo.simulatedReason != undefined ? false : 'always'"
        hide-details
        :class="{ 'histogram-range__real-values': rangeInfo.simulatedReason == undefined }"
    />
    <HistogramNote v-if="rangeInfo.simulatedReason != undefined" :note="rangeInfo.simulatedReason" />
</template>

<style lang="scss" scoped>
.histogram-range__real-values {
    margin-top: 2.5rem;
}
</style>
