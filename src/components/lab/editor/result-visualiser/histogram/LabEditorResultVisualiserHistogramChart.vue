<script setup lang="ts">
/**
 * Visualises histogram as a bar chart.
 */

import { computed } from 'vue'
import { VisualisedHistogram, VisualisedHistogramBucket } from '@/model/editor/result-visualiser'
import LabEditorResultVisualiserHistogramNote
    from '@/components/lab/editor/result-visualiser/histogram/LabEditorResultVisualiserHistogramNote.vue'

const props = defineProps<{
    histogram: VisualisedHistogram
}>()

const canChartBeRendered = computed(() => {
    const sampleBucket = props.histogram.buckets[0]
    return sampleBucket.occurrences != undefined
})
const missingRequiredProperties = computed(() => {
    const missingRequiredProperties: string[] = []
    const sampleBucket = props.histogram.buckets[0]
    if (sampleBucket.occurrences == undefined) {
        missingRequiredProperties.push('occurrences')
    }
    return missingRequiredProperties
})
const missingOptionalProperties = computed(() => {
    const missingProperties: string[] = []
    const sampleBucket = props.histogram.buckets[0]
    if (sampleBucket.requested == undefined) {
        missingProperties.push('requested')
    }
    return missingProperties
})

const maxBucketOccurrences = computed(() => {
    let maxBucketOccurrences: number = 0
    props.histogram.buckets.forEach((bucket) => {
        if (bucket.occurrences != undefined && bucket.occurrences > maxBucketOccurrences) {
            maxBucketOccurrences = bucket.occurrences
        }
    })
    return maxBucketOccurrences
})

const chartSeries = computed(() => {
    const nonRequestedBuckets: any[] = []
    const requestedBuckets: any[] = []
    const fillerBuckets: any[] = [] // this is basically hack to allow showing bucket tooltips even for empty buckets where there is no area to hover over (the `intersect` option on tooltip options doesn't work as expected)

    for (let i = 0; i < props.histogram.buckets.length; i++) {
        const bucket: VisualisedHistogramBucket | undefined = props.histogram.buckets[i]
        const requested: boolean = bucket?.requested || false
        const occurrences: number = bucket?.occurrences || 0

        if (requested) {
            nonRequestedBuckets.push([i, 0])
            requestedBuckets.push([i, occurrences])
        } else {
            nonRequestedBuckets.push([i, occurrences])
            requestedBuckets.push([i, 0])
        }

        fillerBuckets.push([i, maxBucketOccurrences.value - occurrences])
    }

    return [
        {
            name: 'All buckets',
            color: '#23355C',
            data: nonRequestedBuckets
        },
        {
            name: 'Requested buckets',
            color: '#21BFE3',
            data: requestedBuckets
        },
        {
            name: '_fillerBuckets',
            color: 'transparent',
            data: fillerBuckets
        }
    ]
})

const chartOptions = {
    chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        sparkline: {
            enabled: true,
        }
    },
    responsive: [{
        breakpoint: 480
    }],
    plotOptions: {
        bar: {
            borderRadius: 4,
            borderRadiusApplication: 'around',
            borderRadiusWhenStacked: 'all'
        }
    },
    xaxis: {
        type: 'numeric'
    },
    fill: {
        opacity: 1
    },
    tooltip: {
        theme: 'dark',
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
            const bucket: VisualisedHistogramBucket = props.histogram.buckets[dataPointIndex]
            return `
                <div class="histogram-tooltip">
                    <header>
                        <h4>Bucket index: ${dataPointIndex}</h4>
                    </header>
                    <article>
                        <table>
                            <tbody>
                                <tr>
                                    <td class="histogram-tooltip__property-name">Occurrences:</td>
                                    <td>${bucket.occurrences}</td>
                                </tr>
                                <tr>
                                    <td class="histogram-tooltip__property-name">Threshold:</td>
                                    <td>${bucket.threshold}</td>
                                </tr>
                                <tr>
                                    <td class="histogram-tooltip__property-name">Was requested:</td>
                                    <td>${bucket.requested ? 'Yes' : 'No'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </article>
                </div>
            `
        }
    }
}
</script>

<template>
    <apexchart v-if="canChartBeRendered" type="bar" height="350" :options="chartOptions" :series="chartSeries" class="histogram-chart" />
    <LabEditorResultVisualiserHistogramNote
        v-if="missingRequiredProperties.length > 0"
        :note="`Missing properties: ${missingRequiredProperties.map(it => '`' + it + '`').join(', ')}. Cannot render the chart.`"
    />
    <LabEditorResultVisualiserHistogramNote
        v-if="missingRequiredProperties.length === 0 && missingOptionalProperties.length > 0"
        :note="`Missing properties: ${missingOptionalProperties.map(it => '`' + it + '`').join(', ')}.`"
    />
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.histogram-chart {
    margin-bottom: 0.5rem;
}

:deep(.histogram-tooltip) {
    padding: 0.5rem;

    h4 {
        margin-bottom: 0.25rem;
    }
}

:deep(.histogram-tooltip__missing-note) {
    display: inline-grid;
    grid-template-columns: 1.5rem 1fr;
    align-items: center;
    column-gap: 0.5rem;
    margin-bottom: 0.5rem;
    color: $info;
}

:deep(.histogram-tooltip__property-name) {
    opacity: 0.8;
}
</style>
