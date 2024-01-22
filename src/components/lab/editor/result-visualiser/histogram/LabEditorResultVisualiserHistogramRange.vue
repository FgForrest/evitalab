<script setup lang="ts">
/**
 * Visualises histogram as a range slider.
 */

import { VisualisedHistogram, VisualisedHistogramBucket } from '@/model/editor/result-visualiser'
import { computed } from 'vue'
import LabEditorResultVisualiserHistogramNote
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogramNote.vue'
import { BigDecimal } from '@/model/evitadb'

const props = defineProps<{
    histogram: VisualisedHistogram
}>()

type RangeInfo = {
    readonly min: number
    readonly max: number
    readonly requestedRange: [number, number]
    /**
     * If certain values are missing in the histogram, we can only simulate the range. This means that e.g. actual values
     * shouldn't be displayed, only range silhouette.
     * If not the reason is not empty, the range is simulated and reason displayed.
     */
    readonly simulatedReason?: string
}

const rangeInfo = computed<RangeInfo>(() => {
    const sampleBucket: VisualisedHistogramBucket = props.histogram.buckets[0] // there is always at least one bucket
    if (sampleBucket.requested == undefined) {
        // we don't know the requested range, there is nothing to display
        const missingRequiredProperties: string[] = []
        if (sampleBucket.requested == undefined) {
            missingRequiredProperties.push('requested')
        }
        return {
            min: 0,
            max: 10,
            requestedRange: [5, 5],
            simulatedReason: `Missing properties: ${missingRequiredProperties.map(it => '`' + it + '`').join(", ")}. Cannot simulate the range.`
        }
    } else {
        if (props.histogram.min != undefined &&
            props.histogram.max != undefined &&
            sampleBucket.threshold != undefined) {
            // we have all properties to compute actual range with proper thresholds
            const min = parseFloat(props.histogram.min)
            const max = parseFloat(props.histogram.max)
            const middle = (min + max) / 2

            // const step = roundStep((max - min) / props.histogram.buckets.length, getRequiredDecimalPlaces(props.histogram.buckets))
            const leftRequestedThreshold: BigDecimal | undefined = props.histogram.buckets.find((bucket) => bucket.requested)?.threshold
            let rightRequestedThreshold: number | undefined = undefined
            if (leftRequestedThreshold != undefined) {
                // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
                const rightRequestedIndex = props.histogram.buckets.findLastIndex((bucket) => bucket.requested)!
                if (rightRequestedIndex < props.histogram.buckets.length - 1) {
                    rightRequestedThreshold = parseFloat(props.histogram.buckets[rightRequestedIndex + 1].threshold!)
                } else {
                    rightRequestedThreshold = max
                }
            }

            return {
                min,
                max,
                requestedRange: [
                    leftRequestedThreshold != undefined ? parseFloat(leftRequestedThreshold) : middle,
                    rightRequestedThreshold != undefined ? rightRequestedThreshold : middle
                ]
            }
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
            const max = props.histogram.buckets.length
            const middle = (min + max) / 2

            let leftRequestedIndex: number | undefined = props.histogram.buckets.findIndex((bucket) => bucket.requested)
            if (leftRequestedIndex == -1) {
                leftRequestedIndex = undefined
            }
            let rightRequestedIndex: number | undefined = undefined
            if (leftRequestedIndex != undefined) {
                // there must be last requested bucket if there is first requested bucket, even if it's the same bucket
                rightRequestedIndex = props.histogram.buckets.findLastIndex((bucket) => bucket.requested)! + 1
            }

            return {
                min,
                max,
                requestedRange: [
                    leftRequestedIndex != undefined ? leftRequestedIndex : middle,
                    rightRequestedIndex != undefined ? rightRequestedIndex : middle
                ],
                simulatedReason: `Missing properties ${missingPropertiesForActualValues.map(it => '`' + it + '`').join(', ')} for actual values. The range is only simulated from indexes.`
            }
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
    <LabEditorResultVisualiserHistogramNote v-if="rangeInfo.simulatedReason != undefined" :note="rangeInfo.simulatedReason" />
</template>

<style lang="scss" scoped>
.histogram-range__real-values {
    margin-top: 2.5rem;
}
</style>
