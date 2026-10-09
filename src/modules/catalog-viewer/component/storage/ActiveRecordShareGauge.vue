<script setup lang="ts">
/**
 * Semi-circle gauge of the catalog-wide active record share, with the configured compaction thresholds drawn as
 * *context* only.
 *
 * **The gauge never states a verdict.** The share reported here is a catalog-wide aggregate, while the compaction
 * predicate is evaluated per data file against its own file length — the engine's contract says the two must not
 * be compared. A catalog reading 0.62 overall can hold one file at 0.2 that is eligible right now. The verdict
 * comes from `compactionEligibleNow`, which the page passes in through the `verdict` slot — this component only
 * places it under the legend, and derives nothing of it from the share it draws.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { formatPercent } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    activeRecordShare: number
    /**
     * Configured share below which compaction triggers once the minimum interval has elapsed.
     */
    minimalActiveRecordShare: number
    /**
     * Configured share below which compaction triggers regardless of the interval.
     */
    maxWasteActiveShare: number
}>()

/**
 * Arc color by where the aggregate sits relative to the server's own thresholds. A colour is context, not a
 * verdict — see the component comment.
 */
const arcColor = computed<string>(() => {
    if (props.activeRecordShare <= props.maxWasteActiveShare) {
        return '#E13321'
    }
    if (props.activeRecordShare <= props.minimalActiveRecordShare) {
        return '#f7a729'
    }
    return '#21BFE3'
})

const chartSeries = computed<number[]>(() => [Math.round(props.activeRecordShare * 1000) / 10])

/**
 * Legend of the arc colour: the two configured thresholds the engine drives compaction from, and the band above
 * them. Reported by the server alongside the measurements, so the gauge draws the server's own thresholds instead
 * of a copy that drifts.
 */
interface ThresholdBand {
    readonly color: string
    readonly label: string
}

const bands = computed<ThresholdBand[]>(() => [
    {
        color: '#E13321',
        label: t('catalogViewer.storage.fragmentation.band.dueRegardless', {
            share: formatPercent(props.maxWasteActiveShare)
        })
    },
    {
        color: '#f7a729',
        label: t('catalogViewer.storage.fragmentation.band.dueAfterInterval', {
            share: formatPercent(props.minimalActiveRecordShare)
        })
    },
    {
        color: '#21BFE3',
        label: t('catalogViewer.storage.fragmentation.band.healthy', {
            share: formatPercent(props.minimalActiveRecordShare)
        })
    }
])

const chartOptions = computed(() => ({
    chart: {
        type: 'radialBar',
        sparkline: { enabled: true },
        animations: { enabled: false }
    },
    plotOptions: {
        radialBar: {
            startAngle: -90,
            endAngle: 90,
            hollow: { size: '60%' },
            track: { background: '#23355C' },
            dataLabels: {
                name: { show: false },
                value: {
                    // apex places the value at the circle's centre, which for a semi-circle is its flat bottom
                    // edge; the offset lifts it into the middle of the hollow
                    offsetY: -28,
                    fontSize: '2rem',
                    formatter: () => formatPercent(props.activeRecordShare)
                }
            }
        }
    },
    fill: { colors: [arcColor.value] },
    stroke: { lineCap: 'round' },
    labels: [t('catalogViewer.storage.fragmentation.activeRecordShare')]
}))
</script>

<template>
    <div class="active-record-share">
        <div class="active-record-share__title text-medium-emphasis">
            {{ t('catalogViewer.storage.fragmentation.activeRecordShare') }}
            <span class="active-record-share__help">
                <VIcon icon="mdi-information-outline" size="x-small" />
                <VTooltip activator="parent">
                    <span>{{ t('catalogViewer.storage.fragmentation.aggregateCaveat') }}</span>
                </VTooltip>
            </span>
        </div>

        <!--
            apex sizes a semi-circle as `min(height / 2, width / 2)` tall, so the height given here is only the
            ceiling: the arc follows the width of the column it is dropped into, and stops growing at 250 px tall
        -->
        <VueApexCharts
            type="radialBar"
            height="500"
            :options="chartOptions"
            :series="chartSeries"
            class="active-record-share__chart"
        />

        <div class="active-record-share__legend">
            <div
                v-for="band in bands"
                :key="band.label"
                :class="[
                    'active-record-share__band',
                    { 'text-disabled': band.color !== arcColor }
                ]"
            >
                <span
                    class="active-record-share__swatch"
                    :style="{ backgroundColor: band.color }"
                />
                {{ band.label }}
            </div>

            <!--
                the verdict belongs to the page, not to the gauge - the slot only places it under the legend, so
                the reading and the verdict about it form one block instead of two columns of loose parts
            -->
            <div v-if="$slots.verdict" class="active-record-share__verdict">
                <slot name="verdict" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// a semi-circle gauge is wide and short, so the legend sits beside it and fills the space under the arc's
// missing half instead of stacking below the whole chart. It wraps back underneath when the column it is in
// cannot hold both - the section's own grid narrows to 22rem before it breaks into one column.
// The gauge is not capped in width: it takes the whole column it is given, and the arc grows with it - the
// legend keeps its own width, so everything the column gains goes to the arc
.active-record-share {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1rem;

    &__title {
        flex: 1 0 100%;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__help {
        display: inline-flex;
    }

    &__chart {
        flex: 1 1 14rem;
        min-width: 8rem;
    }

    &__legend {
        flex: 0 1 14rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__band {
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    &__swatch {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 2px;
        flex: 0 0 auto;
    }

    &__verdict {
        margin-top: 0.5rem;
    }
}
</style>
