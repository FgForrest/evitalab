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
import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import HistogramNote from '@/modules/console/result-visualiser/component/histogram/HistogramNote.vue'

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
        const missingRequiredProperties: string[] = []
        if (sampleBucket.requested == undefined) {
            missingRequiredProperties.push('requested')
        }
        return new RangeInfo(
            0,
            10,
            [5, 5],
            t('resultVisualizer.histogram.placeholder.missingPropertiesForSimulatedRange', { properties: missingRequiredProperties.map(it => '`' + it + '`').join(", ") })
        )
    } else {
        if (props.histogram.min != undefined &&
            props.histogram.max != undefined &&
            sampleBucket.threshold != undefined) {
            // we have all properties to compute actual range with proper thresholds
            const min = props.histogram.min.toFloat()
            const max = props.histogram.max.toFloat()
            const middle = (min + max) / 2

            // const step = roundStep((max - min) / props.histogram.buckets.length, getRequiredDecimalPlaces(props.histogram.buckets))
            const leftRequestedThreshold: BigDecimal | undefined = props.histogram.buckets.find((bucket) => bucket.requested ?? false)?.threshold
            let rightRequestedThreshold: number | undefined = undefined
            if (leftRequestedThreshold != undefined) {
                // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
                const rightRequestedIndex = props.histogram.buckets.findLastIndex((bucket) => bucket.requested ?? false)!
                if (rightRequestedIndex < props.histogram.buckets.size - 1) {
                    // todo lho fix nullable threshold
                    rightRequestedThreshold = props.histogram.buckets.get(rightRequestedIndex + 1)!.threshold!.toFloat()
                } else {
                    rightRequestedThreshold = max
                }
            }

            return new RangeInfo(
                min,
                max,
                [
                    leftRequestedThreshold != undefined ? leftRequestedThreshold.toFloat() : middle,
                    rightRequestedThreshold != undefined ? rightRequestedThreshold : middle
                ]
            )
        } else {
            // we are missing some properties, but we can only simulate the range by indexes of buckets
            const missingPropertiesForActualValues: string[] = []
            if (props.histogram.min == undefined) {
                missingPropertiesForActualValues.push('min')
            }
            if (props.histogram.max == undefined) {
                missingPropertiesForActualValues.push('max')
            }
            if (sampleBucket?.threshold == undefined) {
                missingPropertiesForActualValues.push('threshold')
            }

            const min = 0
            const max = props.histogram.buckets.size
            const middle = (min + max) / 2

            let leftRequestedIndex: number | undefined = props.histogram.buckets.findIndex((bucket) => bucket.requested ?? false)
            if (leftRequestedIndex == -1) {
                leftRequestedIndex = undefined
            }
            let rightRequestedIndex: number | undefined = undefined
            if (leftRequestedIndex != undefined) {
                // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
                rightRequestedIndex = props.histogram.buckets.findLastIndex((bucket) => bucket.requested ?? false)! + 1
            }

            return new RangeInfo(
                min,
                max,
                [
                    leftRequestedIndex != undefined ? leftRequestedIndex : middle,
                    rightRequestedIndex != undefined ? rightRequestedIndex : middle
                ],
                t('resultVisualizer.histogram.placeholder.missingPropertiesForActualRange', { properties: missingPropertiesForActualValues.map(it => '`' + it + '`').join(', ') })
            )
        }
    }
})
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
